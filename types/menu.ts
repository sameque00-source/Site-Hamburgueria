// Modelo de domínio do cardápio. Preparado para receber os dados
// oficiais (planilha, admin ou backend) sem mudar os componentes.

import type { PictureKey } from "@/config/media";

/** valores sempre em centavos */
export type Cents = number;

export type CategoryId = "burgers" | "pizzas" | "acai" | "bebidas" | "acompanhamentos" | "combos";

export type Category = {
  id: CategoryId;
  name: string;
  tagline: string;
  /** foto real da categoria (config/media.ts → pictures); ausente = placeholder */
  image?: ProductImage;
  demo: boolean;
};

export type Addon = {
  id: string;
  name: string;
  price: Cents;
};

/** grupo de opções (DEMO): obrigatório = escolher ao menos 1 */
export type AddonGroup = {
  id: string;
  name: string;
  required: boolean;
  maxSelections: number;
  options: Addon[];
};

export type ProductImage = PictureKey;

export type Product = {
  id: string;
  slug: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  price: Cents;
  ingredients: string[];
  addonGroups: AddonGroup[];
  /** chave em config/media.ts → pictures; ausente = placeholder */
  image?: ProductImage;
  available: boolean;
  featured?: boolean;
  /** true enquanto nome/descrição/preço forem ilustrativos */
  demo: boolean;
};

export type CartLine = {
  /** produto + adicionais + observação → mesma escolha soma quantidade */
  key: string;
  productId: string;
  qty: number;
  addonIds: string[];
  note: string;
};
