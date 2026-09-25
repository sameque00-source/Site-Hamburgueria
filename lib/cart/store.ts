"use client";

// Carrinho no cliente: store externo + useSyncExternalStore.
// Persistência em localStorage (sobrevive a recarregar/fechar a aba).
// Leitura tolerante: dados corrompidos ou produtos removidos do catálogo
// são descartados em vez de quebrar a página.

import { useSyncExternalStore } from "react";
import { getProductById } from "@/data/demo/products";
import { deliveryFee } from "@/config/store";
import { lineTotal, validateAddons } from "@/lib/pricing";
import type { CartLine } from "@/types/menu";

const KEY = "tyo-cart-v1";
const MAX_QTY = 20;
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(raw)) {
      lines = raw
        .filter((l): l is CartLine => {
          if (!l || typeof l.key !== "string" || typeof l.productId !== "string") return false;
          if (!Number.isInteger(l.qty) || l.qty < 1 || !Array.isArray(l.addonIds)) return false;
          const p = getProductById(l.productId);
          // catálogo mudou (adicional removido/regra nova): linha antiga seria recusada no checkout
          return !!p && validateAddons(p, l.addonIds).length === 0;
        })
        .map((l) => ({ ...l, qty: Math.min(MAX_QTY, l.qty), note: typeof l.note === "string" ? l.note : "" }));
    } else {
      lines = EMPTY;
    }
  } catch {
    lines = EMPTY;
  }
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* modo privado / cota: segue só em memória */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  // outras abas
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
};

const getSnapshot = () => {
  load();
  return lines;
};

export const lineKey = (productId: string, addonIds: string[], note: string) =>
  [productId, [...addonIds].sort().join("+"), note.trim().toLowerCase()].join("|");

export type AddResult = { ok: true } | { ok: false; error: string };

export const cart = {
  add(productId: string, qty: number, addonIds: string[], note: string): AddResult {
    const product = getProductById(productId);
    if (!product) return { ok: false, error: "Produto não encontrado." };
    if (!product.available) return { ok: false, error: `${product.name} está indisponível no momento.` };
    const errors = validateAddons(product, addonIds);
    if (errors.length) return { ok: false, error: errors[0] };
    load();
    const key = lineKey(productId, addonIds, note);
    const hit = lines.find((l) => l.key === key);
    const next = hit
      ? lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
      : [...lines, { key, productId, qty: Math.min(MAX_QTY, qty), addonIds: [...addonIds], note: note.trim() }];
    commit(next);
    return { ok: true };
  },
  setQty(key: string, qty: number) {
    load();
    if (qty <= 0) return cart.remove(key);
    commit(lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)));
  },
  /** troca adicionais/observação de uma linha (mescla se virar igual a outra) */
  update(key: string, addonIds: string[], note: string): AddResult {
    load();
    const line = lines.find((l) => l.key === key);
    if (!line) return { ok: false, error: "Item não encontrado no carrinho." };
    const product = getProductById(line.productId);
    if (!product) return { ok: false, error: "Produto não encontrado." };
    if (!product.available) return { ok: false, error: `${product.name} está indisponível no momento.` };
    const errors = validateAddons(product, addonIds);
    if (errors.length) return { ok: false, error: errors[0] };
    const nextKey = lineKey(line.productId, addonIds, note);
    const twin = lines.find((l) => l.key === nextKey && l.key !== key);
    // mantém a posição; se ficou igual a outra linha, soma nela
    const next = twin
      ? lines
          .filter((l) => l.key !== key)
          .map((l) => (l.key === nextKey ? { ...l, qty: Math.min(MAX_QTY, l.qty + line.qty) } : l))
      : lines.map((l) => (l.key === key ? { ...l, key: nextKey, addonIds: [...addonIds], note: note.trim() } : l));
    commit(next);
    return { ok: true };
  },
  remove(key: string) {
    load();
    commit(lines.filter((l) => l.key !== key));
  },
  clear() {
    commit(EMPTY);
  },
};

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function cartTotals(ls: CartLine[], mode: "delivery" | "pickup" = "delivery", neighborhood?: string) {
  const subtotal = ls.reduce((s, l) => s + lineTotal(l.productId, l.qty, l.addonIds), 0);
  const fee = mode === "pickup" || ls.length === 0 ? 0 : (deliveryFee(neighborhood) ?? 0);
  return { subtotal, deliveryFee: fee, total: subtotal + fee, count: ls.reduce((s, l) => s + l.qty, 0) };
}
