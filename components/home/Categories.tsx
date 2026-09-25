"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RevealText } from "@/components/motion/RevealText";
import { Picture } from "@/components/media/Picture";
import { pictures } from "@/config/media";
import { categories } from "@/data/demo/categories";
import { pad } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, MQ } from "@/lib/motion";
import styles from "./Categories.module.css";

/**
 * Trilho horizontal de categorias.
 * Entradas suportadas (nenhuma é obrigatória):
 *  - touch/trackpad: scroll nativo com snap
 *  - mouse: arrastar (drag) — clique continua funcionando se não houve arrasto
 *  - roda vertical sobre o trilho: rola na horizontal até a borda, depois libera a página
 *  - teclado: ←/→/Home/End com o trilho focado; Tab percorre os cards
 *  - botões anterior/próximo
 * Indicador: contador + barra de progresso da posição atual.
 */
export function Categories() {
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);
  const frame = useRef(0);

  // 1 medição por frame; estado React só muda quando o valor muda
  // (a barra de progresso é atualizada direto no DOM, sem re-render)
  const measure = useCallback(() => {
    frame.current = 0;
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max > 0 ? el.scrollLeft / max : 0;
    if (bar.current) bar.current.style.transform = `scaleX(${Math.max(p, 0.04)})`;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft > max - 8);
    const items = Array.from(el.children) as HTMLElement[];
    const left = el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
    let best = 0;
    let dist = Infinity;
    items.forEach((it, i) => {
      const d = Math.abs(it.getBoundingClientRect().left - left);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setActive(best);
  }, []);

  const update = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(measure);
  }, [measure]);

  const stepWidth = () => {
    const item = rail.current?.querySelector("li");
    return item ? item.getBoundingClientRect().width + 16 : 300;
  };

  const step = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * stepWidth(), behavior: "smooth" });

  // scroll, resize, roda e arrasto
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    update();

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // gesto já horizontal
      const max = el.scrollWidth - el.clientWidth;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return; // libera o scroll da página
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let pointerId: number | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      moved = false;
    };
    const onMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        setDragging(true);
        // captura é melhoria (continua arrastando fora do trilho); se o
        // ponteiro já não estiver ativo, o arrasto segue sem ela
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ponteiro inativo */
        }
      }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (moved) {
        setDragging(false);
        // re-encaixa no card mais próximo
        const w = stepWidth();
        el.scrollTo({ left: Math.round(el.scrollLeft / w) * w, behavior: "smooth" });
      }
    };
    // impede que o arrasto dispare o link
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("scroll", update, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [update]);

  const onKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const el = rail.current;
    if (!el || e.target !== el) return;
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Home") el.scrollTo({ left: 0, behavior: "smooth" });
    else if (e.key === "End") el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else return;
    e.preventDefault();
  };

  // TRANSIÇÃO HERO → CARDÁPIO: a "cortina" sobe arredondada e se abre
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          "[data-curtain]",
          { scaleX: 0.9, borderRadius: "48px 48px 0 0" },
          {
            scaleX: 1,
            borderRadius: "0px 0px 0 0",
            ease: EASE.none,
            scrollTrigger: { trigger: section.current, start: "top bottom", end: "top 20%", scrub: true },
          },
        );
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} id="cardapio" className={styles.section} aria-labelledby="cat-title">
      <div className={styles.curtain} data-curtain aria-hidden="true" />

      <div className={`container ${styles.head}`}>
        <div>
          <p className="label" data-reveal>
            <span className="label-index">01</span>Cardápio
          </p>
          <RevealText id="cat-title" className={`display ${styles.title}`} lines={["Por onde", "começar?"]} />
        </div>

        <div className={styles.nav}>
          <p className={styles.counter} aria-live="polite">
            <span>{pad(active + 1)}</span> / {pad(categories.length)}
            <span className="sr-only">: {categories[active]?.name}</span>
          </p>
          <div className={styles.controls}>
            <button type="button" onClick={() => step(-1)} disabled={atStart} aria-label="Categorias anteriores">
              ←
            </button>
            <button type="button" onClick={() => step(1)} disabled={atEnd} aria-label="Próximas categorias">
              →
            </button>
          </div>
        </div>
      </div>

      <ul
        ref={rail}
        className={`${styles.rail} ${dragging ? styles.dragging : ""}`}
        aria-label="Categorias — use as setas do teclado para navegar"
        tabIndex={0}
        onKeyDown={onKey}
        data-cursor="drag"
      >
        {categories.map((c, i) => (
          <li key={c.id} className={styles.item} data-active={i === active || undefined}>
            <Link href={`/menu#${c.id}`} className={styles.card} draggable={false} data-cursor="image">
              <span className={styles.num}>{pad(i + 1)}</span>
              <span className={styles.visual} aria-hidden="true">
                {c.image ? (
                  <Picture asset={pictures[c.image]} alt="" variant="portrait" sizes="350px" className={styles.photo} />
                ) : (
                  <>
                    {/* PLACEHOLDER — sem foto real desta categoria ainda */}
                    <span className={styles.glow} data-tone={i % 3} />
                    <span className="mono-tag">Imagem em breve</span>
                  </>
                )}
              </span>
              <span className={styles.meta}>
                <span className={`display ${styles.name}`}>{c.name}</span>
                <span className={styles.tag}>{c.tagline}</span>
                <span className={styles.go} aria-hidden="true">
                  Ver →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={`container ${styles.foot}`}>
        <div className={styles.track} aria-hidden="true">
          <span ref={bar} />
        </div>
        <p className="note">Categorias demonstrativas — definidas pela loja.</p>
      </div>
    </section>
  );
}
