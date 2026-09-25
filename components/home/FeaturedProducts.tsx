import { ProductCard } from "@/components/product/ProductCard";
import { RevealText } from "@/components/motion/RevealText";
import { Button } from "@/components/ui/Button";
import { featuredProducts } from "@/data/demo/products";
import styles from "./FeaturedProducts.module.css";

export function FeaturedProducts() {
  const [hero, ...rest] = featuredProducts;

  return (
    <section id="destaques" className={styles.section} aria-labelledby="featured-title">
      <div className="container">
        <div className={styles.head}>
          <div>
            <p className="label" data-reveal>
              <span className="label-index">02</span>Destaques
            </p>
            <RevealText
              id="featured-title"
              className={`display ${styles.title}`}
              lines={["Os mais", "pedidos"]}
            />
          </div>
          <div data-reveal>
            <Button href="/menu" variant="ghost">
              Ver menu completo
            </Button>
          </div>
        </div>

        <div className={styles.grid}>
          {hero && (
            <div className={styles.featureCol} data-parallax="0.06">
              <ProductCard product={hero} variant="feature" />
            </div>
          )}
          <div className={styles.list}>
            {rest.map((p, i) => (
              <ProductCard key={p.id} product={p} variant="row" index={i + 2} />
            ))}
          </div>
        </div>

        <p className={`note ${styles.note}`}>
          Produtos, descrições e preços são demonstrativos — valores oficiais a confirmar com a loja.
        </p>
      </div>
    </section>
  );
}
