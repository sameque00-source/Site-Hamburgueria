// Cálculo de preços — mesma função no cliente (carrinho) e no servidor
// (pedido). O servidor sempre recalcula a partir do catálogo: preço
// enviado pelo navegador nunca é confiável.

import { getProductById } from "@/data/demo/products";
import type { Addon, AddonGroup, Cents, Product } from "@/types/menu";

export function selectedAddons(product: Product, addonIds: string[]): Addon[] {
  const all = product.addonGroups.flatMap((g) => g.options);
  return addonIds.map((id) => all.find((a) => a.id === id)).filter((a): a is Addon => !!a);
}

export function unitPrice(product: Product, addonIds: string[]): Cents {
  return product.price + selectedAddons(product, addonIds).reduce((s, a) => s + a.price, 0);
}

/** erros de escolha por grupo (mínimo/máximo); vazio = válido */
export function validateAddons(product: Product, addonIds: string[]): string[] {
  const errors: string[] = [];
  const known = new Set(product.addonGroups.flatMap((g) => g.options.map((o) => o.id)));
  if (addonIds.some((id) => !known.has(id))) errors.push("Adicional inválido para este produto.");
  if (new Set(addonIds).size !== addonIds.length) errors.push("Adicional repetido.");
  product.addonGroups.forEach((g: AddonGroup) => {
    const n = g.options.filter((o) => addonIds.includes(o.id)).length;
    if (g.required && n < 1) errors.push(`Escolha: ${g.name}.`);
    if (n > g.maxSelections) errors.push(`Máximo de ${g.maxSelections} em ${g.name}.`);
  });
  return errors;
}

export function lineTotal(productId: string, qty: number, addonIds: string[]): Cents {
  const p = getProductById(productId);
  return p ? unitPrice(p, addonIds) * qty : 0;
}
