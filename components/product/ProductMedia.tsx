import { Picture } from "@/components/media/Picture";
import { pictures } from "@/config/media";
import type { Product } from "@/types/menu";
import styles from "./ProductMedia.module.css";

/** Foto real quando existir para o produto; senão placeholder declarado. */
export function ProductMedia({
  product,
  shape = "portrait",
  sizes = "(max-width: 900px) 100vw, 40vw",
  showNote = true,
}: {
  product: Product;
  shape?: "portrait" | "square";
  sizes?: string;
  /** selo "Imagem ilustrativa" (desligado em miniaturas, ex.: carrinho) */
  showNote?: boolean;
}) {
  if (product.image) {
    const asset = pictures[product.image];
    return (
      <>
        <Picture asset={asset} alt={product.name} variant={shape} sizes={sizes} className={styles.img} />
        {/* foto gerada por IA para ilustrar: nunca apresentada como foto real da loja */}
        {"illustrative" in asset && asset.illustrative && showNote && (
          <span className={styles.note}>Imagem ilustrativa</span>
        )}
      </>
    );
  }
  return (
    <span className={styles.placeholder} aria-hidden="true">
      <span className={styles.glow} />
      {/* PLACEHOLDER — sem foto real para este produto (public/assets/tyo/burgers/) */}
      <span className={`mono-tag ${styles.slot}`}>Imagem em breve</span>
    </span>
  );
}
