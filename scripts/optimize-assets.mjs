// Gera as variantes otimizadas dos assets aprovados.
// Uso: node scripts/optimize-assets.mjs
// Fonte: assets-src/ (cópia dos originais aprovados — NÃO servida)
// Destino: public/assets/tyo/…  (servido)
// Observação: os originais recebidos são JPEG 1376×768 com extensão .png;
// aqui são tratados pelo formato real.
import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const SRC = "assets-src";
const OUT = "public/assets/tyo";

// burger ocupa x≈620–1240 nas duas imagens (mesma câmera)
const PORTRAIT = { left: 643, top: 0, width: 614, height: 768 }; // 4:5, centrado no burger
const SQUARE = { left: 620, top: 74, width: 620, height: 620 };

const jobs = [
  { src: "tyo-hero-main-01.jpg", dir: "hero", name: "tyo-hero-main-01", desktop: [1376, 960, 640], portrait: [614, 460], jpgFallback: true },
  { src: "tyo-burger-explode-master-01.jpg", dir: "burgers", name: "tyo-burger-explode-master-01", desktop: [1376, 960, 640], portrait: [614, 460], jpgFallback: true },
  // foto de produto: só onde a composição corresponde (Tyo Tudo DEMO)
  { src: "tyo-hero-main-01.jpg", dir: "burgers", name: "tyo-tudo", portrait: [614, 400], square: [600, 300] },
];

// ---------- fotos de produto (ChatGPT "Criar imagem", 2026-09-25) ----------
// Originais PNG 1254×1254 (quadrado). Recorte retrato 4:5 centrado; nenhuma
// variante passa da resolução nativa (sem upscale).
const SQ_PORTRAIT = { left: 125, top: 0, width: 1003, height: 1254 };
const product = (dir, name) => ({
  src: `${name}.png`,
  dir,
  name,
  crops: { portrait: SQ_PORTRAIT, square: null },
  portrait: [400, 640, 1000],
  square: [300, 600, 1000],
});
jobs.push(
  product("burgers", "tyo-burger-bacon-01"),
  product("burgers", "tyo-burger-classico-01"),
  product("burgers", "tyo-burger-duplo-01"),
  product("pizza", "tyo-pizza-calabresa-01"),
  product("pizza", "tyo-pizza-marguerita-01"),
  product("acai", "tyo-acai-300-01"),
  product("acai", "tyo-acai-500-01"),
  product("acai", "tyo-acai-700-01"),
  product("bebidas", "tyo-bebida-refrigerante-lata-01"),
  product("bebidas", "tyo-bebida-suco-natural-01"),
  product("bebidas", "tyo-bebida-agua-01"),
  product("acompanhamentos", "tyo-acompanhamento-batata-frita-01"),
  product("acompanhamentos", "tyo-acompanhamento-onion-rings-01"),
  product("combos", "tyo-combo-da-casa-01"),
  // seção "A casa": original 1024×1536 (2:3) → retrato 4:5 centrado
  {
    src: "tyo-ingredients-a-casa-01.png",
    dir: "ingredients",
    name: "tyo-ingredients-a-casa-01",
    crops: { portrait: { left: 0, top: 128, width: 1024, height: 1280 } },
    portrait: [480, 800, 1024],
  },
);

async function variants(input, extract, widths, base) {
  for (const w of widths) {
    let img = sharp(input);
    if (extract) img = img.extract(extract);
    img = img.resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 52, effort: 6 }).toFile(`${base}-${w}.avif`);
    await img.clone().webp({ quality: 78, effort: 6 }).toFile(`${base}-${w}.webp`);
  }
}

for (const j of jobs) {
  const input = path.join(SRC, j.src);
  const dir = path.join(OUT, j.dir);
  await mkdir(dir, { recursive: true });
  if (j.desktop) await variants(input, null, j.desktop, path.join(dir, j.name));
  // crops por job (fotos de produto); padrão = recortes da câmera do hero
  const crop = (k, def) => (j.crops && k in j.crops ? j.crops[k] : def);
  if (j.portrait) await variants(input, crop("portrait", PORTRAIT), j.portrait, path.join(dir, `${j.name}-portrait`));
  if (j.square) await variants(input, crop("square", SQUARE), j.square, path.join(dir, `${j.name}-square`));
  if (j.jpgFallback) {
    await sharp(input).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(dir, `${j.name}.jpg`));
  }
}

for (const d of [...new Set(jobs.map((j) => j.dir))]) {
  const files = await readdir(path.join(OUT, d));
  console.log(d, files.length, "arquivos");
}
