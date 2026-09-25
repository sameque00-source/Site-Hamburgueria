"use client";

import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import type { FrameSet } from "@/config/media";
import { MQ } from "@/lib/motion";
import styles from "./FrameSequence.module.css";

export type FrameSequenceHandle = {
  /** 0..1 — normalmente o progress de um ScrollTrigger */
  setProgress: (p: number) => void;
};

export type FrameSequenceState = "idle" | "loading" | "ready" | "error";

/**
 * Sequência de frames desenhada em <canvas>, controlada por progresso (scroll).
 *
 * Carregamento:
 *  - só começa quando o componente se aproxima da viewport (IntersectionObserver);
 *  - frame 1 primeiro (pinta imediatamente), depois passadas progressivas
 *    (a cada 8, 4, 2, 1 frames) → o scrub já funciona com poucos frames
 *    e ganha resolução temporal enquanto carrega;
 *  - no máx. 6 downloads simultâneos; decode() fora da thread principal.
 * Desenho:
 *  - só redesenha quando o índice muda, 1x por frame de animação (rAF);
 *  - se o frame pedido ainda não chegou, usa o carregado mais próximo;
 *  - canvas com DPR limitado (2 desktop / 1.5 mobile), ajuste "cover".
 * Mobile: usa mobileDir/mobileCount quando definidos (menos memória).
 * Memória: ao desmontar, cancela downloads, solta as imagens e o rAF.
 * Erro (frame 1 falhou): mostra o fallback.
 */
export function FrameSequence({
  frames,
  fallback,
  className,
  label,
  onState,
  ref,
}: {
  frames: FrameSet;
  fallback?: ReactNode;
  className?: string;
  label: string;
  onState?: (s: FrameSequenceState) => void;
  ref?: Ref<FrameSequenceHandle>;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const target = useRef(0);
  const drawn = useRef(-1);
  const raf = useRef(0);
  const [state, setState] = useState<FrameSequenceState>("idle");

  const set = useRef<{ dir: string; count: number }>({ dir: frames.dir, count: frames.count });

  const url = (i: number) =>
    `${set.current.dir}/${String(i + 1).padStart(frames.pad, "0")}.${frames.ext}`;

  const draw = () => {
    raf.current = 0;
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const list = images.current;
    // frame carregado mais próximo do pedido
    let idx = target.current;
    for (let d = 0; d < list.length; d++) {
      if (list[idx - d]) {
        idx -= d;
        break;
      }
      if (list[idx + d]) {
        idx += d;
        break;
      }
    }
    const img = list[idx];
    if (!img || idx === drawn.current) return;
    const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
    drawn.current = idx;
  };

  const schedule = () => {
    if (!raf.current) raf.current = requestAnimationFrame(draw);
  };

  useImperativeHandle(ref, () => ({
    setProgress(p: number) {
      const n = set.current.count;
      const i = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
      if (i !== target.current) {
        target.current = i;
        schedule();
      }
    },
  }));

  useEffect(() => {
    onState?.(state);
  }, [state, onState]);

  useEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;

    const mobile = window.matchMedia(MQ.mobile).matches;
    set.current =
      mobile && frames.mobileDir
        ? { dir: frames.mobileDir, count: frames.mobileCount ?? frames.count }
        : { dir: frames.dir, count: frames.count };
    images.current = new Array(set.current.count).fill(null);

    let cancelled = false;
    const pending = new Set<HTMLImageElement>();

    // tamanho do canvas acompanha o elemento
    const dprCap = mobile ? 1.5 : 2;
    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      c.width = Math.round(entry.contentRect.width * dpr);
      c.height = Math.round(entry.contentRect.height * dpr);
      drawn.current = -1;
      schedule();
    });
    ro.observe(el);

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        pending.add(img);
        img.onload = async () => {
          try {
            await img.decode();
          } catch {
            /* decode é otimização; o onload já garante o pixel */
          }
          pending.delete(img);
          if (!cancelled) {
            images.current[i] = img;
            schedule();
          }
          resolve();
        };
        img.onerror = () => {
          pending.delete(img);
          if (i === 0 && !cancelled) setState("error");
          resolve();
        };
        img.src = url(i);
      });

    const start = async () => {
      setState("loading");
      await load(0);
      if (cancelled || !images.current[0]) return;
      setState("ready");
      // ordem progressiva: passos 8 → 4 → 2 → 1
      const n = set.current.count;
      const order: number[] = [];
      const seen = new Set([0]);
      for (const stride of [8, 4, 2, 1]) {
        for (let i = 0; i < n; i += stride) {
          if (!seen.has(i)) {
            seen.add(i);
            order.push(i);
          }
        }
      }
      let cursor = 0;
      const worker = async () => {
        while (!cancelled && cursor < order.length) {
          await load(order[cursor++]);
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      pending.forEach((img) => {
        img.onload = img.onerror = null;
        img.src = "";
      });
      images.current = [];
      drawn.current = -1;
    };
    // frames é configuração estática; recriar só se o conjunto mudar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.dir, frames.mobileDir]);

  return (
    <div ref={wrap} className={`${styles.wrap} ${className ?? ""}`} data-state={state}>
      <canvas ref={canvas} className={styles.canvas} role="img" aria-label={label} />
      {state !== "ready" && fallback && <div className={styles.fallback}>{fallback}</div>}
    </div>
  );
}
