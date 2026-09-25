import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCustomizer } from "@/components/product/ProductCustomizer";
import { ProductMedia } from "@/components/product/ProductMedia";
import { categories } from "@/data/demo/categories";
import { getProductBySlug, products } from "@/data/demo/products";
import { formatPrice } from "@/lib/format";
import styles from "./page.module.css";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  return p ? { title: p.name, description: p.description } : { title: "Página não encontrada" };
}

export default async function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <article className={`container ${styles.page}`}>
      <div className={styles.media}>
        <ProductMedia product={product} sizes="(max-width: 900px) 100vw, 50vw" />
        {!product.available ? (
          <span className={styles.tag} data-kind="off">
            Indisponível
          </span>
        ) : (
          product.demo && <span className={styles.tag}>Demo</span>
        )}
      </div>

      <div className={styles.body}>
        <nav className={styles.crumbs} aria-label="Você está em">
          <Link href="/menu">Cardápio</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/menu#${product.categoryId}`}>{category?.name}</Link>
        </nav>
        <h1 className={`display ${styles.name}`}>{product.name}</h1>
        <p className={styles.desc}>{product.description}</p>
        <p className={styles.base}>
          A partir de <strong>{formatPrice(product.price)}</strong>
          {product.demo && <span> · valor DEMO</span>}
        </p>
        {product.ingredients.length > 0 && (
          <ul className={styles.chips} aria-label="Ingredientes (demonstrativo)">
            {product.ingredients.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        )}
        <ProductCustomizer product={product} headingLevel="h2" />
      </div>
    </article>
  );
}
