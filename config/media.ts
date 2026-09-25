// ============================================================
// INVENTÁRIO DE MÍDIA
// Fonte original: C:\Users\Administrator\Downloads\Imagens hamburgueria
// (apenas origem — nada em produção aponta para lá).
// Originais copiados para assets-src/ ; variantes geradas por
// scripts/optimize-assets.mjs em public/assets/tyo/…
// Os originais aprovados são JPEG 1376×768 (extensão .png na origem):
//   tyo-hero-main-01              sha256 cf67fcf9d646…
//   tyo-burger-explode-master-01  sha256 d467d12fb82d…
// Em 2026-09-25 a pasta de origem passou a conter apenas 14 PAINÉIS
// (grades/contact sheets com nomes impressos e marcas de terceiros).
// Painéis são REFERÊNCIA de inventário — nunca asset final, nunca recortados.
// Arquivos citados nos painéis (ex.: tyo-burger-product-main-01, versões
// 3840×2160) NÃO existem individualmente → não cadastrados aqui.
// ============================================================

export type MediaStatus = "pending" | "ready";

export type Picture = {
  /** base sem sufixo, ex. /assets/tyo/hero/tyo-hero-main-01 */
  base: string;
  /** larguras desktop geradas (paisagem 16:9) */
  desktop?: number[];
  /** larguras do recorte retrato 4:5 (mobile / cards) */
  portrait?: number[];
  /** larguras do recorte quadrado */
  square?: number[];
  /** fallback universal */
  jpg?: string;
  width: number;
  height: number;
  /** imagem gerada por IA para ilustrar o produto (não é foto da loja) → selo "Imagem ilustrativa" */
  illustrative?: boolean;
};

/**
 * Foto de produto gerada no ChatGPT ("Criar imagem"), original PNG 1254×1254.
 * Variantes: retrato 4:5 (400/640/1000) e quadrado (300/600/1000), AVIF+WebP.
 */
const productPhoto = (dir: string, name: string): Picture => ({
  base: `/assets/tyo/${dir}/${name}`,
  portrait: [400, 640, 1000],
  square: [300, 600, 1000],
  width: 1003,
  height: 1254,
  illustrative: true,
});

export type Asset = {
  id: string;
  name: string;
  type: "image" | "video" | "frames";
  file: string;
  category: "hero" | "burgers" | "pizza" | "acai" | "acompanhamentos" | "bebidas" | "combos" | "ingredients" | "backgrounds" | "textures";
  section: string;
  priority: "high" | "normal" | "low";
  status: MediaStatus;
  desktop: boolean;
  mobile: boolean;
  use: string;
};

// ---------- imagens aprovadas ----------
export const pictures = {
  heroMain: {
    base: "/assets/tyo/hero/tyo-hero-main-01",
    desktop: [640, 960, 1376],
    portrait: [460, 614],
    jpg: "/assets/tyo/hero/tyo-hero-main-01.jpg",
    width: 1376,
    height: 768,
  },
  burgerExplode: {
    base: "/assets/tyo/burgers/tyo-burger-explode-master-01",
    desktop: [640, 960, 1376],
    portrait: [460, 614],
    jpg: "/assets/tyo/burgers/tyo-burger-explode-master-01.jpg",
    width: 1376,
    height: 768,
  },
  menuTyoTudo: {
    base: "/assets/tyo/burgers/tyo-tudo",
    portrait: [400, 614],
    square: [300, 600],
    width: 614,
    height: 768,
  },
  // ---------- produtos (1 imagem individual por produto) ----------
  burgerBacon: productPhoto("burgers", "tyo-burger-bacon-01"),
  burgerClassico: productPhoto("burgers", "tyo-burger-classico-01"),
  burgerDuplo: productPhoto("burgers", "tyo-burger-duplo-01"),
  pizzaCalabresa: productPhoto("pizza", "tyo-pizza-calabresa-01"),
  pizzaMarguerita: productPhoto("pizza", "tyo-pizza-marguerita-01"),
  acai300: productPhoto("acai", "tyo-acai-300-01"),
  acai500: productPhoto("acai", "tyo-acai-500-01"),
  acai700: productPhoto("acai", "tyo-acai-700-01"),
  bebidaRefri: productPhoto("bebidas", "tyo-bebida-refrigerante-lata-01"),
  bebidaSuco: productPhoto("bebidas", "tyo-bebida-suco-natural-01"),
  bebidaAgua: productPhoto("bebidas", "tyo-bebida-agua-01"),
  batataFrita: productPhoto("acompanhamentos", "tyo-acompanhamento-batata-frita-01"),
  onionRings: productPhoto("acompanhamentos", "tyo-acompanhamento-onion-rings-01"),
  comboCasa: productPhoto("combos", "tyo-combo-da-casa-01"),
  // ---------- seção "A casa" (original 1024×1536 → retrato 4:5) ----------
  storyIngredients: {
    base: "/assets/tyo/ingredients/tyo-ingredients-a-casa-01",
    portrait: [480, 800, 1024],
    width: 1024,
    height: 1280,
    illustrative: true,
  },
} satisfies Record<string, Picture>;

export type PictureKey = keyof typeof pictures;

export const assets: Asset[] = [
  {
    id: "hero-main",
    name: "tyo-hero-main-01",
    type: "image",
    file: "public/assets/tyo/hero/tyo-hero-main-01-*.{avif,webp}",
    category: "hero",
    section: "Hero · Burger Experience (estado fechado)",
    priority: "high",
    status: "ready",
    desktop: true,
    mobile: true,
    use: "Burger protagonista do hero; pôster do vídeo do hero; início/fim da Burger Experience",
  },
  {
    id: "burger-explode-master",
    name: "tyo-burger-explode-master-01",
    type: "image",
    file: "public/assets/tyo/burgers/tyo-burger-explode-master-01-*.{avif,webp}",
    category: "burgers",
    section: "Burger Experience",
    priority: "normal",
    status: "ready",
    desktop: true,
    mobile: true,
    use: "Estado desmontado — camadas reais usadas nas etapas",
  },
  {
    id: "menu-tyo-tudo",
    name: "tyo-tudo (recorte de tyo-hero-main-01)",
    type: "image",
    file: "public/assets/tyo/burgers/tyo-tudo-*.{avif,webp}",
    category: "burgers",
    section: "Cardápio · Destaques",
    priority: "normal",
    status: "ready",
    desktop: true,
    mobile: true,
    use: "Foto do produto DEMO Tyo Tudo (composição igual à do burger fotografado)",
  },
  {
    id: "hero-video",
    name: "tyo-hero-video-01",
    type: "video",
    file: "public/assets/tyo/video/tyo-hero-video-01.{mp4,webm} (PENDENTE — Higgsfield: conta gratuita não gera vídeo; exige plano Basic)",
    category: "hero",
    section: "Hero",
    priority: "high",
    status: "pending",
    desktop: true,
    mobile: true,
    use: "Loop cinematográfico 5–8s a partir de tyo-hero-main-01",
  },
  {
    id: "burger-explode-frames",
    name: "burger-explode 0001–NNNN",
    type: "frames",
    file: "public/assets/tyo/frames/burger-explode/*.webp (A GERAR)",
    category: "burgers",
    section: "Burger Experience",
    priority: "low",
    status: "pending",
    desktop: true,
    mobile: true,
    use: "Sequência real fechado→desmontado; enquanto não existir, crossfade entre as duas fotos",
  },
];

// ---------- slots usados pelos componentes ----------
export type FrameSet = {
  dir: string;
  count: number;
  ext: "webp" | "avif" | "jpg";
  pad: number;
  mobileDir?: string;
  mobileCount?: number;
};

export type MediaSlot = {
  id: string;
  kind: "video" | "image" | "frames";
  status: MediaStatus;
  src?: string;
  srcWebm?: string;
  srcMobile?: string;
  poster?: string;
  frames?: FrameSet;
  ratio: string;
  note: string;
};

export const media: Record<"heroVideo" | "story" | "burgerFrames", MediaSlot> = {
  heroVideo: {
    id: "hero-video",
    kind: "video",
    status: "pending", // → "ready" quando o vídeo do Higgsfield for gerado
    // src: "/assets/tyo/video/tyo-hero-video-01.mp4",
    // srcWebm: "/assets/tyo/video/tyo-hero-video-01.webm",
    // srcMobile: "/assets/tyo/video/tyo-hero-video-01-mobile.mp4",
    poster: pictures.heroMain.jpg,
    ratio: "16:9 · 4:5 mobile",
    note: "Loop cinematográfico do burger (push-in lento, vapor, luz)",
  },
  story: {
    id: "story-craft",
    kind: "video",
    status: "pending",
    ratio: "4:5",
    note: "Foto ilustrativa entregue (pictures.storyIngredients). Vídeo real de preparo da loja segue pendente.",
  },
  burgerFrames: {
    id: "burger-explode-frames",
    kind: "frames",
    status: "pending",
    frames: {
      dir: "/assets/tyo/frames/burger-explode",
      count: 72,
      ext: "webp",
      pad: 4,
      mobileDir: "/assets/tyo/frames/burger-explode-mobile",
      mobileCount: 48,
    },
    ratio: "16:9 · 4:5 mobile",
    note: "Sequência fechado→desmontado controlada pelo scroll",
  },
};

// ---------- fotos de produto geradas (metadados) ----------
// Origem: ChatGPT "Criar imagem" (plano Go), 2026-09-25, uma conversa, um
// prompt próprio por item. Original PNG 1254×1254 (ingredientes 1024×1536) —
// NÃO é 4K. Cópia dos originais em assets-src/ e em
// Downloads/Imagens hamburgueria. Imagens ilustrativas (não são fotos da loja).
const generated: [PictureKey, Asset["category"], string, string][] = [
  ["burgerBacon", "burgers", "Cardápio · Destaques · produto", "Tyo Bacon"],
  ["burgerClassico", "burgers", "Cardápio · Destaques · produto · Combo", "Tyo Clássico"],
  ["burgerDuplo", "burgers", "Cardápio · Destaques · produto", "Tyo Duplo"],
  ["pizzaCalabresa", "pizza", "Cardápio · produto · capa da categoria Pizzas", "Pizza Calabresa"],
  ["pizzaMarguerita", "pizza", "Cardápio · produto", "Pizza Marguerita"],
  ["acai300", "acai", "Cardápio · produto", "Açaí 300 ml"],
  ["acai500", "acai", "Cardápio · produto · capa da categoria Açaí", "Açaí 500 ml"],
  ["acai700", "acai", "Cardápio · produto", "Açaí 700 ml"],
  ["bebidaRefri", "bebidas", "Cardápio · produto", "Refrigerante lata (sem marca)"],
  ["bebidaSuco", "bebidas", "Cardápio · produto · capa da categoria Bebidas", "Suco natural (sabor ilustrado: laranja)"],
  ["bebidaAgua", "bebidas", "Cardápio · produto", "Água mineral (sem rótulo)"],
  ["batataFrita", "acompanhamentos", "Cardápio · produto · capa da categoria", "Batata frita"],
  ["onionRings", "acompanhamentos", "Cardápio · produto", "Onion rings"],
  ["comboCasa", "combos", "Cardápio · produto · capa da categoria Combos", "Combo da Casa"],
  ["storyIngredients", "ingredients", "Home · seção A casa", "Ingredientes (flat lay)"],
];
for (const [key, category, section, label] of generated) {
  const p: Picture = pictures[key];
  assets.push({
    id: key,
    name: p.base.split("/").pop()!,
    type: "image",
    file: `public${p.base}-{portrait,square}-*.{avif,webp}`,
    category,
    section,
    priority: key === "storyIngredients" ? "low" : "normal",
    status: "ready",
    desktop: true,
    mobile: true,
    use: `${label} — imagem ilustrativa gerada por IA`,
  });
}
