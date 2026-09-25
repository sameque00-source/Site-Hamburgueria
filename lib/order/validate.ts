// Validação do checkout — a MESMA regra roda no navegador (feedback
// imediato) e no servidor (fonte da verdade). Sem dependências.

import { getProductById } from "@/data/demo/products";
import { deliveryFee, storeConfig } from "@/config/store";
import { onlyDigits } from "@/lib/format";
import { lineTotal, validateAddons } from "@/lib/pricing";
import type { CheckoutInput } from "@/types/order";

export type FieldErrors = Partial<Record<string, string>>;

const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** normaliza entrada desconhecida (JSON do request) no formato esperado */
export function parseCheckout(raw: unknown): CheckoutInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const c = (r.customer ?? {}) as Record<string, unknown>;
  const d = (r.delivery ?? {}) as Record<string, unknown>;
  const method = r.paymentMethod;
  if (method !== "pix" && method !== "cash" && method !== "card") return null;
  const lines = Array.isArray(r.lines) ? r.lines : [];
  return {
    customer: { name: str(c.name, 80), phone: onlyDigits(str(c.phone, 20)) },
    delivery:
      d.mode === "pickup"
        ? { mode: "pickup" }
        : {
            mode: "delivery",
            street: str(d.street),
            number: str(d.number, 10),
            complement: str(d.complement, 60),
            reference: str(d.reference, 80),
            neighborhood: str(d.neighborhood, 60),
            city: str(d.city, 60),
            cep: onlyDigits(str(d.cep, 12)),
          },
    paymentMethod: method,
    changeFor:
      method === "cash" && Number.isFinite(Number(r.changeFor)) && Number(r.changeFor) > 0
        ? Math.round(Number(r.changeFor))
        : undefined,
    note: str(r.note, 280),
    lines: lines.slice(0, 50).map((l) => {
      const x = (l ?? {}) as Record<string, unknown>;
      return {
        productId: str(x.productId, 40),
        qty: Math.trunc(Number(x.qty)),
        addonIds: Array.isArray(x.addonIds) ? x.addonIds.map((a) => str(a, 40)).slice(0, 20) : [],
        note: str(x.note, 140),
      };
    }),
  };
}

export function validateCheckout(input: CheckoutInput): FieldErrors {
  const e: FieldErrors = {};
  if (input.customer.name.length < 2) e.name = "Informe seu nome.";
  if (!/^\d{10,11}$/.test(input.customer.phone)) e.phone = "WhatsApp com DDD (10 ou 11 dígitos).";

  if (input.delivery.mode === "delivery") {
    if (!storeConfig.delivery.enabled) e.mode = "Entrega indisponível no momento.";
    const d = input.delivery;
    if (d.street.length < 3) e.street = "Informe a rua.";
    if (!d.number) e.number = "Informe o número (ou S/N).";
    if (d.neighborhood.length < 2) e.neighborhood = "Informe o bairro.";
    if (d.city.length < 2) e.city = "Informe a cidade.";
    if (!/^\d{8}$/.test(d.cep)) e.cep = "CEP com 8 dígitos.";
  } else if (!storeConfig.pickup.enabled) {
    e.mode = "Retirada indisponível no momento.";
  }

  if (!storeConfig.payments[input.paymentMethod]) e.payment = "Forma de pagamento indisponível.";

  if (!input.lines.length) e.cart = "Seu carrinho está vazio.";
  for (const l of input.lines) {
    const p = getProductById(l.productId);
    if (!p) {
      e.cart = "Um item do carrinho não existe mais no cardápio.";
      break;
    }
    if (!p.available) {
      e.cart = `${p.name} ficou indisponível — remova do carrinho.`;
      break;
    }
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 20) {
      e.cart = `Quantidade inválida em ${p.name}.`;
      break;
    }
    const addonErr = validateAddons(p, l.addonIds);
    if (addonErr.length) {
      e.cart = `${p.name}: ${addonErr[0]}`;
      break;
    }
  }

  // taxa: com tabela por bairro, bairro fora da tabela sem taxa padrão = não entregamos
  const fee = input.delivery.mode === "pickup" ? 0 : deliveryFee(input.delivery.neighborhood);
  if (fee === null && !e.neighborhood) e.neighborhood = "Ainda não entregamos neste bairro.";

  // troco: precisa cobrir o total (mesma conta do servidor)
  if (!e.cart && input.paymentMethod === "cash" && input.changeFor !== undefined) {
    const total = input.lines.reduce((s, l) => s + lineTotal(l.productId, l.qty, l.addonIds), 0) + (fee ?? 0);
    if (!Number.isInteger(input.changeFor) || input.changeFor < total) {
      e.changeFor = "O troco deve ser para um valor maior que o total.";
    }
  }
  return e;
}
