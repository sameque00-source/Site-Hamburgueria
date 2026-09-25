// Pedido → WhatsApp DA HAMBURGUERIA.
// O WhatsApp é canal de envio — a fonte da verdade é o pedido no sistema.
//
// Produção: basta definir NEXT_PUBLIC_WHATSAPP_NUMBER (ex.: "+55 27 9XXXX-XXXX")
// e refazer o build. Checkout, pedido, mensagem e botão não mudam.

import { storeConfig } from "@/config/store";
import { formatCep, formatPhone, formatPrice } from "@/lib/format";
import type { Order } from "@/types/order";

// ------------------------------------------------------------
// NÚMERO — regra ÚNICA (UI, botão, link, validação e estado DEMO)
// ------------------------------------------------------------

// DDDs em uso no Brasil (Anatel)
const BR_DDD = new Set(
  "11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99".split(
    " ",
  ),
);

/**
 * Normaliza um número brasileiro para o formato do wa.me (só dígitos, com 55).
 * Aceita "+55 (27) 99999-8888", "5527999998888", "27999998888", "(27) 3333-4444"…
 *   DDD válido (lista Anatel) + fixo (8 dígitos, começa em 2–5) ou celular (9 dígitos, começa em 9).
 * Qualquer outra coisa (incompleto, DDD inválido, outro país) → null.
 * Nunca "adivinhamos" o país de um número incompleto.
 */
export function normalizeWhatsAppNumber(raw: string | undefined | null): string | null {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 12 || d.length === 13) {
    if (!d.startsWith("55")) return null;
    d = d.slice(2);
  }
  if (!/^\d{2}(?:9\d{8}|[2-5]\d{7})$/.test(d) || !BR_DDD.has(d.slice(0, 2))) return null;
  return `55${d}`;
}

export type WhatsAppTarget =
  /** número válido: envio direto para a hamburgueria */
  | { state: "ready"; number: string }
  /** variável ausente: ambiente DEMO */
  | { state: "demo" }
  /** variável definida mas inválida: envio bloqueado (erro de configuração) */
  | { state: "invalid" };

/** resolve o destino a partir de um valor bruto (testável sem build) */
export function resolveWhatsAppTarget(raw: string | undefined | null): WhatsAppTarget {
  if (!(raw ?? "").trim()) return { state: "demo" };
  const number = normalizeWhatsAppNumber(raw);
  return number ? { state: "ready", number } : { state: "invalid" };
}

/** destino da loja (NEXT_PUBLIC_WHATSAPP_NUMBER) */
export const storeWhatsAppTarget = () => resolveWhatsAppTarget(storeConfig.whatsappNumber);

// ------------------------------------------------------------
// MENSAGEM
// ------------------------------------------------------------

const METHOD = { pix: "PIX", cash: "Dinheiro (na entrega)", card: "Cartão (maquininha na entrega)" } as const;

function paymentStatus(o: Order) {
  if (o.payment.method === "pix") {
    if (o.payment.status === "PAID") return o.demo ? "PAGO (PIX DEMO — sem valor real)" : "PAGO";
    return "PENDENTE";
  }
  return "A PAGAR na entrega";
}

const dash = (v: string | undefined) => (v && v.trim() ? v.trim() : "—");

export function buildWhatsAppMessage(o: Order) {
  const L: string[] = ["🍔 *NOVO PEDIDO — TYO BURGUER*"];
  if (o.demo) L.push("_(pedido de DEMONSTRAÇÃO — valores ilustrativos)_");

  L.push("", `*Pedido:* ${o.id}`);

  L.push("", "*CLIENTE*", `Nome: ${o.customer.name}`, `WhatsApp: ${formatPhone(o.customer.phone)}`);

  L.push("", "*ENTREGA*");
  if (o.delivery.mode === "delivery") {
    const d = o.delivery;
    L.push(
      "Tipo: Entrega",
      `Endereço: ${d.street} — ${d.neighborhood}, ${d.city} · CEP ${formatCep(d.cep)}`,
      `Número: ${dash(d.number)}`,
      `Complemento: ${dash(d.complement)}`,
      `Referência: ${dash(d.reference)}`,
    );
  } else {
    L.push("Tipo: Retirada no local");
  }

  L.push("", "*ITENS*");
  o.items.forEach((i, n) => {
    if (n > 0) L.push("");
    L.push(`${n + 1}) ${i.name}`, `   Quantidade: ${i.qty}`);
    L.push(
      `   Adicionais: ${
        i.addons.length
          ? i.addons.map((a) => `${a.name}${a.price ? ` (+${formatPrice(a.price)})` : ""}`).join(", ")
          : "—"
      }`,
    );
    if (i.note) L.push(`   Observação: ${i.note}`);
    L.push(`   Valor: ${formatPrice(i.lineTotal)}${i.qty > 1 ? ` (${formatPrice(i.unitPrice)} cada)` : ""}`);
  });

  L.push(
    "",
    "*RESUMO*",
    `Subtotal: ${formatPrice(o.totals.subtotal)}`,
    `Entrega: ${
      o.delivery.mode === "pickup"
        ? "Retirada — sem taxa"
        : `${formatPrice(o.totals.deliveryFee)}${o.demo ? " (taxa DEMO)" : ""}`
    }`,
    `*Total: ${formatPrice(o.totals.total)}*`,
  );

  L.push("", "*PAGAMENTO*", `Forma: ${METHOD[o.payment.method]}`, `Status: ${paymentStatus(o)}`);
  if (o.payment.method === "cash" && o.payment.changeFor) L.push(`Troco para: ${formatPrice(o.payment.changeFor)}`);

  L.push("", `*Observação geral:* ${dash(o.note)}`);
  return L.join("\n");
}

/** encodeURIComponent lança URIError com surrogate solto (colar texto quebrado) → saneia antes */
function encodeText(s: string) {
  const wellFormed = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "�");
  return encodeURIComponent(wellFormed);
}

/**
 * Link DIRETO para o WhatsApp da hamburgueria: https://wa.me/{NUMERO}?text={MENSAGEM}
 * (wa.me abre o app no celular e o WhatsApp Web no desktop).
 * Sem número válido → null: nunca geramos link sem destinatário nem para número inventado.
 */
export function buildWhatsAppLink(o: Order, target: WhatsAppTarget = storeWhatsAppTarget()): string | null {
  if (target.state !== "ready") return null;
  return `https://wa.me/${target.number}?text=${encodeText(buildWhatsAppMessage(o))}`;
}
