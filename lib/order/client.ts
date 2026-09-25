"use client";

// Referências de pedidos feitos neste navegador (id + token de acesso).
// Nenhum dado pessoal é salvo aqui — só o necessário para reabrir o status.

const KEY = "tyo-orders-v1";

export type OrderRef = { id: string; token: string; at: string };

export function saveOrderRef(id: string, token: string) {
  try {
    const list: OrderRef[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const next = [{ id, token, at: new Date().toISOString() }, ...list.filter((o) => o.id !== id)].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* sem storage: o link da página do pedido continua funcionando */
  }
}

export function lastOrderRef(): OrderRef | null {
  try {
    const list: OrderRef[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return list[0] ?? null;
  } catch {
    return null;
  }
}
