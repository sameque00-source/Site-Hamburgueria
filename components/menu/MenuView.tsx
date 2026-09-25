"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { categories } from "@/data/demo/categories";
import { products } from "@/data/demo/products";
import styles from "./MenuView.module.css";

/**
 * Cardápio completo: navegação de categorias fixa (scroll-spy) + seções.
 * Categorias e produtos são DEMO — trocados pelos dados oficiais depois.
 */
export function MenuView() {
  const [active, setActive] = useState<string>(categories[0].id);
  const navRef = useRef<HTMLElement>(null);

  // categoria ativa = seção que cruza a faixa superior da tela
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    categories.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // mantém a pílula ativa visível no trilho horizontal (mobile)
  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <>
      <nav ref={navRef} className={styles.nav} aria-label="Categorias do cardápio">
        <ul className={`container ${styles.pills}`}>
          {categories.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                data-cat={c.id}
                className={styles.pill}
                aria-current={active === c.id ? "true" : undefined}
              >
                {c.name}
                <span className={styles.count}>{products.filter((p) => p.categoryId === c.id).length}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container">
        {categories.map((c) => {
          const list = products.filter((p) => p.categoryId === c.id);
          return (
            <section key={c.id} id={c.id} className={styles.section} aria-labelledby={`h-${c.id}`}>
              <header className={styles.sHead}>
                <h2 id={`h-${c.id}`} className={`display ${styles.sTitle}`}>
                  {c.name}
                </h2>
                <p className={styles.sTag}>{c.tagline}</p>
              </header>
              {list.length ? (
                <div className={styles.grid}>
                  {list.map((p) => (
                    <ProductCard key={p.id} product={p} variant="tile" />
                  ))}
                </div>
              ) : (
                <p className="note">Nenhum item nesta categoria por enquanto.</p>
              )}
            </section>
          );
        })}
        <p className={`note ${styles.demo}`}>
          Cardápio demonstrativo — categorias, produtos e valores serão substituídos pelos dados oficiais da loja.
        </p>
      </div>
    </>
  );
}
