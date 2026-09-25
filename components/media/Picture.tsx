import type { Picture as PictureAsset } from "@/config/media";

type Variant = "desktop" | "portrait" | "square";

const srcset = (p: PictureAsset, v: Variant, ext: "avif" | "webp") => {
  const suffix = v === "desktop" ? "" : `-${v}`;
  return (p[v] ?? []).map((w) => `${p.base}${suffix}-${w}.${ext} ${w}w`).join(", ");
};

/**
 * <picture> com direção de arte:
 *  - `mobileVariant` (retrato/quadrado) quando `mobileMedia` casar;
 *  - `variant` acima; AVIF → WebP → JPG.
 * `priority` só no hero (fetchpriority alto, sem lazy).
 */
export function Picture({
  asset,
  alt,
  variant = "desktop",
  mobileVariant,
  mobileMedia = "(max-width: 900px) and (orientation: portrait)",
  sizes = "100vw",
  mobileSizes = "100vw",
  priority = false,
  className,
}: {
  asset: PictureAsset;
  alt: string;
  variant?: Variant;
  mobileVariant?: Variant;
  /** quando usar o recorte mobile (retrato só faz sentido em tela vertical) */
  mobileMedia?: string;
  sizes?: string;
  mobileSizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const media = mobileMedia;
  const main = asset[variant] ?? [];
  const fallback = asset.jpg ?? `${asset.base}${variant === "desktop" ? "" : `-${variant}`}-${main[main.length - 1]}.webp`;

  return (
    <picture>
      {mobileVariant && asset[mobileVariant] && (
        <>
          <source media={media} type="image/avif" srcSet={srcset(asset, mobileVariant, "avif")} sizes={mobileSizes} />
          <source media={media} type="image/webp" srcSet={srcset(asset, mobileVariant, "webp")} sizes={mobileSizes} />
        </>
      )}
      <source type="image/avif" srcSet={srcset(asset, variant, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(asset, variant, "webp")} sizes={sizes} />
      {/* variantes já otimizadas no build (scripts/optimize-assets.mjs) */}
      <img
        src={fallback}
        alt={alt}
        width={asset.width}
        height={asset.height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
      />
    </picture>
  );
}
