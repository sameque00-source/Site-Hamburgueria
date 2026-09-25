// ============================================================
// CONFIGURAÇÃO COMERCIAL — valores DEMO até a loja confirmar.
// Nada aqui é dado oficial da Tyo Burguer.
// ============================================================

import type { Cents } from "@/types/menu";

export type DeliveryPricing =
  | { kind: "fixed"; fee: Cents }
  /** preparado para taxa por bairro — ainda sem dados oficiais */
  | { kind: "region"; regions: { name: string; fee: Cents }[]; fallbackFee: Cents | null };

export const storeConfig = {
  isDemo: true,
  delivery: {
    enabled: true,
    pricing: { kind: "fixed", fee: 700 } as DeliveryPricing, // TAXA DEMO
    estimate: "A CONFIRMAR",
  },
  pickup: {
    enabled: true,
    address: "Flexal I, Cariacica — ES (endereço completo A CONFIRMAR)",
  },
  payments: {
    pix: true,
    cash: true,
    card: true, // na entrega / maquininha (DEMO)
  },
  /** tempo até a cobrança PIX DEMO expirar */
  pixExpiresInSeconds: 10 * 60,
  /** formato: 55 + DDD + número; vazio enquanto a loja não informar (regra única em lib/order/whatsapp.ts) */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
} as const;

export function deliveryFee(neighborhood?: string): Cents | null {
  const p = storeConfig.delivery.pricing;
  if (p.kind === "fixed") return p.fee;
  const hit = p.regions.find((r) => r.name.toLowerCase() === neighborhood?.trim().toLowerCase());
  return hit ? hit.fee : p.fallbackFee;
}
