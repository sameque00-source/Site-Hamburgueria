"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import type { Product } from "@/types/menu";
import { formatPrice } from "@/lib/format";
import { useProductExpand } from "./ProductExpand";
import { ProductMedia } from "./ProductMedia";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
  variant?: "feature" | "row" | "tile";
  index?: number;
};

/**
 * Card único de produto: "feature" (destaque), "row" (lista) e "tile" (grade do cardápio).
 * Dentro de ProductExpandProvider, clicar abre a personalização; sem o provider
 * (ou sem JS), os links levam à página /produto/[slug].
 */
export function ProductCard({ product, variant = "row", index }: Props) {
  const expand = useProductExpand();
  const href = `/produto/${product.slug}`;

  const onOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!expand || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const card = e.currentTarget.closest("article");
    const media = card?.querySelector<HTMLElement>("[data-card-media]") ?? e.currentTarget;
    expand(product, media);
  };

  const shape = variant === "row" ? "square" : "portrait";

  return (
    <article
      className={`${styles.card} ${styles[variant]}`}
      data-reveal
      data-unavailable={!product.available || undefined}
    >
      <Link
        href={href}
        className={styles.media}
        onClick={onOpen}
        data-card-media
        data-cursor="image"
        aria-label={`Abrir ${product.name}`}
      >
        <span className={styles.shift}>
          <ProductMedia
            product={product}
            shape={shape}
            sizes={variant === "row" ? "150px" : variant === "tile" ? "(max-width: 560px) 50vw, 25vw" : "(max-width: 900px) 100vw, 40vw"}
          />
        </span>
        <span className={styles.sheen} aria-hidden="true" />
        {!product.available ? (
          <span className={styles.badge} data-kind="off">
            Indisponível
          </span>
        ) : (
          product.demo && <span className={styles.badge}>Demo</span>
        )}
      </Link>

      <div className={styles.body}>
        {index !== undefined && <span className={styles.index}>{String(index).padStart(2, "0")}</span>}
        <h3 className={`display ${styles.name}`}>
          <Link href={href} onClick={onOpen}>
            {product.name}
          </Link>
        </h3>
        <p className={styles.desc}>{product.description}</p>

        {variant === "feature" && product.ingredients.length > 0 && (
          <ul className={styles.ingredients} aria-label="Ingredientes (demonstrativo)">
            {product.ingredients.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        )}

        <div className={styles.foot}>
          <span className={`display ${styles.price}`} title={product.demo ? "Valor demonstrativo" : undefined}>
            {formatPrice(product.price)}
          </span>
          <Link
            href={href}
            onClick={onOpen}
            className={styles.add}
            data-cursor="button"
            aria-label={product.available ? `Personalizar e adicionar ${product.name}` : `${product.name} — indisponível`}
            aria-disabled={!product.available || undefined}
          >
            <span aria-hidden="true">+</span>
            <span className={styles.addLabel}>{product.available ? "Adicionar" : "Ver"}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
