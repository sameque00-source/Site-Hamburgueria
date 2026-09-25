"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/types/menu";
import { formatPrice } from "@/lib/format";
import { gsap } from "@/lib/gsap";
import { EASE, MQ } from "@/lib/motion";
import { ProductCustomizer } from "./ProductCustomizer";
import { ProductMedia } from "./ProductMedia";
import styles from "./ProductExpand.module.css";

export type EditLine = { key: string; qty: number; addonIds: string[]; note: string };
type Open = (product: Product, origin: HTMLElement, edit?: EditLine) => void;
const Ctx = createContext<Open | null>(null);

/** Retorna a função de expansão, ou null fora do provider (card cai no link). */
export function useProductExpand() {
  return useContext(Ctx);
}

type Active = { product: Product; origin: HTMLElement; edit?: EditLine };

/**
 * CARD → CLICK → EXPANSÃO → PRODUTO GRANDE → PERSONALIZAR → ADICIONAR
 * Transição FLIP: o painel nasce exatamente sobre a imagem do card e
 * cresce até a posição final. Mobile: bottom sheet. Reduced motion: fade.
 * Também serve para editar um item do carrinho (edit).
 */
export function ProductExpandProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);

  const open = useCallback<Open>((product, origin, edit) => setActive({ product, origin, edit }), []);

  return (
    <Ctx.Provider value={open}>
      {children}
      {active && (
        <ProductSheet
          key={active.product.id + (active.edit?.key ?? "")}
          {...active}
          onClosed={() => {
            if (active.origin.isConnected) active.origin.focus({ preventScroll: true });
            setActive(null);
          }}
        />
      )}
    </Ctx.Provider>
  );
}

function ProductSheet({ product, origin, edit, onClosed }: Active & { onClosed: () => void }) {
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const titleId = `sheet-${product.id}`;

  const flipFrom = useCallback(() => {
    const p = panel.current;
    if (!p || !origin.isConnected) return null;
    const a = origin.getBoundingClientRect();
    const b = p.getBoundingClientRect();
    if (!a.width || !b.width) return null;
    return {
      x: a.left - b.left,
      y: a.top - b.top,
      scaleX: a.width / b.width,
      scaleY: a.height / b.height,
    };
  }, [origin]);

  // abertura
  useEffect(() => {
    const p = panel.current;
    if (!p) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });

    const reduced = window.matchMedia(MQ.reduced).matches;
    const mobile = window.matchMedia(MQ.mobile).matches;
    const items = p.querySelectorAll("[data-sheet-item]");
    const tl = gsap.timeline({ defaults: { ease: EASE.out } });
    tl.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0);

    if (reduced) {
      tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0);
    } else if (mobile) {
      tl.fromTo(p, { yPercent: 100 }, { yPercent: 0, duration: 0.7 }, 0).fromTo(
        items,
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.6 },
        0.25,
      );
    } else {
      const from = flipFrom();
      if (from) {
        tl.fromTo(
          p,
          { ...from, transformOrigin: "0 0", borderRadius: 18 },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 28, duration: 0.8 },
          0,
        );
      } else {
        tl.fromTo(p, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.5 }, 0);
      }
      tl.fromTo(items, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.7 }, 0.35);
    }

    return () => {
      tl.kill();
      document.body.style.overflow = prevOverflow;
    };
  }, [flipFrom]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const p = panel.current;
    const reduced = window.matchMedia(MQ.reduced).matches;
    const mobile = window.matchMedia(MQ.mobile).matches;
    // fechar nunca depende da animação terminar (aba em segundo plano
    // pausa o rAF): o timer garante a desmontagem
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onClosed();
    };
    window.setTimeout(finish, 900);
    const tl = gsap.timeline({ defaults: { ease: EASE.inOut }, onComplete: finish });
    tl.to(backdrop.current, { autoAlpha: 0, duration: 0.35 }, 0.1);
    if (!p || reduced) {
      tl.to(p, { autoAlpha: 0, duration: 0.2 }, 0);
    } else if (mobile) {
      tl.to(p, { yPercent: 100, duration: 0.45 }, 0);
    } else {
      gsap.set(p, { clearProps: "transform" });
      const from = flipFrom();
      tl.to(p.querySelectorAll("[data-sheet-item]"), { autoAlpha: 0, duration: 0.15 }, 0);
      tl.to(p, { ...(from ?? { autoAlpha: 0 }), borderRadius: 18, duration: 0.55 }, 0.05);
    }
  }, [flipFrom, onClosed]);

  // teclado: Esc fecha, Tab fica preso no painel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key !== "Tab" || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className={styles.root}>
      <div ref={backdrop} className={styles.backdrop} onClick={close} aria-hidden="true" />
      <div ref={panel} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.media}>
          <ProductMedia product={product} sizes="(max-width: 900px) 100vw, 560px" />
          {product.demo && <span className={styles.demoTag}>Demo</span>}
        </div>

        <div className={styles.body}>
          <button ref={closeBtn} type="button" className={styles.close} onClick={close} aria-label="Fechar">
            <span aria-hidden="true">×</span>
          </button>

          <p className="label" data-sheet-item>
            {edit ? "Editar item" : "Produto"}
          </p>
          <h2 id={titleId} className={`display ${styles.name}`} data-sheet-item>
            {product.name}
          </h2>
          <p className={styles.desc} data-sheet-item>
            {product.description}
          </p>
          <p className={styles.base} data-sheet-item>
            A partir de <strong>{formatPrice(product.price)}</strong>
            {product.demo && <span> · valor DEMO</span>}
          </p>

          {product.ingredients.length > 0 && (
            <ul className={styles.chips} aria-label="Ingredientes (demonstrativo)" data-sheet-item>
              {product.ingredients.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}

          <div data-sheet-item>
            <ProductCustomizer
              product={product}
              editKey={edit?.key}
              initial={edit && { qty: edit.qty, addonIds: edit.addonIds, note: edit.note }}
              onDone={close}
            />
          </div>

          {!edit && (
            <Link href={`/produto/${product.slug}`} className={styles.page} data-sheet-item>
              Página do produto →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
