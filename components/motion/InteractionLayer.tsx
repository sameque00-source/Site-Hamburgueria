"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { MQ } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./InteractionLayer.module.css";

type CursorState = "default" | "hover" | "button" | "image" | "drag";

const LABEL: Partial<Record<CursorState, string>> = {
  image: "Ver",
  drag: "Arrastar",
};

/**
 * Camada de interação para ponteiro fino (desktop):
 *  - cursor seguidor discreto (o cursor nativo continua visível —
 *    nada de acessibilidade sacrificada);
 *  - efeito magnético leve em [data-magnetic].
 * Estados via atributo data-cursor="button|image|drag" nos elementos;
 * links e botões recebem "hover" automaticamente.
 * Em touch ou reduced motion: não monta nada.
 */
export function InteractionLayer() {
  const enabled = useMediaQuery(`${MQ.finePointer} and ${MQ.motionOk}`);
  const ring = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>("default");

  useEffect(() => {
    if (!enabled || !ring.current) return;
    const el = ring.current;
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
    let visible = false;
    let magnet: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
        visible = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);

      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(magnet, { x: dx * 0.18, y: dy * 0.28, duration: 0.5, ease: "power3.out" });
      }
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const tagged = t.closest<HTMLElement>("[data-cursor]");
      const interactive = t.closest("a, button, [role='button'], input, label, select");
      const next: CursorState = tagged
        ? (tagged.dataset.cursor as CursorState)
        : interactive
          ? "hover"
          : "default";
      setState(next);

      const m = t.closest<HTMLElement>("[data-magnetic]");
      if (m !== magnet) {
        if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
        magnet = m;
      }
    };

    const onLeaveWindow = () => {
      gsap.to(el, { autoAlpha: 0, duration: 0.3 });
      visible = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      if (magnet) gsap.set(magnet, { x: 0, y: 0 });
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={ring} className={styles.cursor} data-state={state} aria-hidden="true">
      <span className={styles.ring} />
      <span className={styles.label}>{LABEL[state] ?? ""}</span>
    </div>
  );
}
