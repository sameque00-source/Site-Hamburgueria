import "server-only";

// Serviço de pedidos (servidor). Estado em memória nesta DEMO —
// a interface (create/get/applyPayment) é a mesma que um banco usaria.

import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getProductById } from "@/data/demo/products";
import { deliveryFee, storeConfig } from "@/config/store";
import { demoPixProvider } from "@/lib/payments/demo-pix";
import type { PaymentProvider } from "@/lib/payments/provider";
import { selectedAddons, unitPrice } from "@/lib/pricing";
import type { CheckoutInput, Order, OrderItem, PaymentStatus } from "@/types/order";

const g = globalThis as unknown as { __tyoOrders?: Map<string, Order>; __tyoOrderTokens?: Map<string, string> };
const orders = (g.__tyoOrders ??= new Map<string, Order>());
// ID do pedido é para humanos (curto, ditável) → leitura exige token aleatório por pedido
const tokens = (g.__tyoOrderTokens ??= new Map<string, string>());

export function orderToken(id: string) {
  return tokens.get(id);
}

/** compara token em tempo constante (em bytes: caractere multibyte não derruba a rota) */
export function canAccess(id: string, token: string | null) {
  const t = tokens.get(id);
  if (!t || !token) return false;
  const a = Buffer.from(t);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

// DEMO em memória: limita o crescimento (sem banco, pedidos antigos saem)
const MAX_ORDERS = 5000;
const ORDER_TTL_MS = 24 * 60 * 60 * 1000;

function evictOld() {
  const cutoff = Date.now() - ORDER_TTL_MS;
  for (const [id, o] of orders) {
    // Map mantém ordem de inserção → os mais antigos vêm primeiro
    if (orders.size <= MAX_ORDERS && Date.parse(o.createdAt) > cutoff) break;
    orders.delete(id);
    tokens.delete(id);
  }
}

/** pedidos com operação de pagamento em andamento (evita corrida entre awaits) */
const busy = new Set<string>();

/** provedor ativo — trocar aqui pelo provedor real quando houver credenciais */
export const paymentProvider: PaymentProvider = demoPixProvider;

// sem 0/O/1/I/L/U: fácil de ditar por telefone/WhatsApp sem confusão
const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** TYO-XXXXXX: 30^6 ≈ 729 milhões de combinações; cresce se houver colisão */
function newOrderId() {
  for (let len = 6; ; len++) {
    for (let attempt = 0; attempt < 8; attempt++) {
      let s = "";
      for (let i = 0; i < len; i++) s += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
      const id = `TYO-${s}`;
      if (!orders.has(id)) return id;
    }
  }
}

export async function createOrder(input: CheckoutInput): Promise<Order> {
  // preços recalculados no servidor a partir do catálogo
  const items: OrderItem[] = input.lines.map((l) => {
    const p = getProductById(l.productId)!;
    const unit = unitPrice(p, l.addonIds);
    return {
      productId: p.id,
      name: p.name,
      qty: l.qty,
      unitPrice: unit,
      addons: selectedAddons(p, l.addonIds).map((a) => ({ id: a.id, name: a.name, price: a.price })),
      note: l.note,
      lineTotal: unit * l.qty,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const fee = input.delivery.mode === "pickup" ? 0 : (deliveryFee(input.delivery.neighborhood) ?? 0);
  const total = subtotal + fee;
  const id = newOrderId();
  const now = new Date().toISOString();

  let order: Order;
  if (input.paymentMethod === "pix") {
    const pay = await paymentProvider.createPayment({
      orderId: id,
      amount: total,
      description: `Pedido ${id} — Tyo Burguer`,
      payer: input.customer,
    });
    order = {
      id,
      customer: input.customer,
      items,
      delivery: input.delivery,
      payment: {
        id: pay.id,
        method: "pix",
        status: pay.status,
        provider: "demo-pix",
        amount: total,
        qrPayload: pay.qrPayload,
        expiresAt: pay.expiresAt,
      },
      totals: { subtotal, deliveryFee: fee, total },
      note: input.note,
      status: "PENDING_PAYMENT",
      timeline: [{ status: "PENDING_PAYMENT", at: now }],
      createdAt: now,
      demo: storeConfig.isDemo,
    };
  } else {
    // dinheiro/cartão: cobrado na entrega → pedido já vai para a loja
    order = {
      id,
      customer: input.customer,
      items,
      delivery: input.delivery,
      payment: {
        id: `offline_${id}`,
        method: input.paymentMethod,
        status: "PENDING",
        provider: "offline",
        amount: total,
        changeFor: input.changeFor,
      },
      totals: { subtotal, deliveryFee: fee, total },
      note: input.note,
      status: "RECEIVED",
      timeline: [{ status: "RECEIVED", at: now }],
      createdAt: now,
      demo: storeConfig.isDemo,
    };
  }
  evictOld();
  orders.set(id, order);
  tokens.set(id, randomBytes(18).toString("base64url"));
  return order;
}

/** sincroniza o pedido com o status do provedor (consulta ativa) */
export async function getOrder(id: string): Promise<Order | null> {
  const order = orders.get(id);
  if (!order) return null;
  if (order.payment.provider === "demo-pix" && order.payment.status === "PENDING") {
    const p = await paymentProvider.getPaymentStatus(order.payment.id);
    if (p) applyPaymentStatus(order, p.status, p.paidAt);
  }
  return order;
}

export function findOrderByPayment(paymentId: string) {
  for (const o of orders.values()) if (o.payment.id === paymentId) return o;
  return null;
}

function setStatus(order: Order, status: Order["status"]) {
  order.status = status;
  order.timeline.push({ status, at: new Date().toISOString() });
}

/**
 * Máquina de estados do pagamento. Única transição aceita: PENDING → (PAID |
 * FAILED | EXPIRED | CANCELED). PAID/FAILED/EXPIRED/CANCELED são finais —
 * evento repetido ou atrasado não altera nada (webhook idempotente).
 */
export function applyPaymentStatus(order: Order, status: PaymentStatus, paidAt?: string) {
  if (order.payment.status === status) return;
  if (order.status === "CANCELED") {
    // provedor real cobrou um pedido já cancelado (cancelamento remoto falhou):
    // o pedido NÃO volta a valer; fica sinalizado para estorno manual
    if (status === "PAID") {
      order.payment.status = "PAID";
      order.payment.paidAt = paidAt ?? new Date().toISOString();
      order.payment.refundRequired = true;
      console.warn(`[pedidos] ${order.id}: pagamento confirmado após cancelamento — estorno necessário`);
    }
    return;
  }
  if (order.payment.status !== "PENDING") return;
  order.payment.status = status;
  if (status === "PAID" && order.status === "PENDING_PAYMENT") {
    order.payment.paidAt = paidAt ?? new Date().toISOString();
    // PENDING_PAYMENT → PAID → RECEIVED (liberado para a loja)
    setStatus(order, "PAID");
    setStatus(order, "RECEIVED");
  }
  // FAILED/EXPIRED: o pedido segue aguardando; o cliente pode gerar nova cobrança
}

/** nova cobrança PIX para um pedido cujo pagamento falhou/expirou */
export async function retryPayment(order: Order) {
  const retryable = () =>
    order.status === "PENDING_PAYMENT" &&
    order.payment.method === "pix" &&
    (order.payment.status === "FAILED" || order.payment.status === "EXPIRED");
  if (!retryable() || busy.has(order.id)) return false;
  busy.add(order.id);
  try {
    const pay = await paymentProvider.createPayment({
      orderId: order.id,
      amount: order.totals.total,
      description: `Pedido ${order.id} — Tyo Burguer`,
      payer: order.customer,
    });
    // o pedido pode ter mudado durante o await: a cobrança nova não pode ficar órfã
    if (!retryable()) {
      await paymentProvider.cancelPayment(pay.id);
      return false;
    }
    order.payment = { ...order.payment, id: pay.id, status: pay.status, qrPayload: pay.qrPayload, expiresAt: pay.expiresAt };
    return true;
  } finally {
    busy.delete(order.id);
  }
}

/**
 * Cancela um pedido que ainda aguarda pagamento. A cobrança é invalidada
 * NO PROVEDOR primeiro (fonte da verdade): se o pagamento chegou antes
 * (corrida), o provedor responde PAID e o cancelamento é recusado — o
 * pedido segue como pago. Nunca existe "pago + cancelado".
 */
export async function cancelOrder(order: Order) {
  // outra operação de pagamento em curso (ex.: nova cobrança sendo criada) → tente de novo
  if (order.status !== "PENDING_PAYMENT" || busy.has(order.id)) return false;
  busy.add(order.id);
  try {
    if (order.payment.provider === "demo-pix" && order.payment.status === "PENDING") {
      const remote = await paymentProvider.cancelPayment(order.payment.id);
      if (order.status !== "PENDING_PAYMENT") return false; // mudou durante o await
      if (remote && remote !== "CANCELED") {
        applyPaymentStatus(order, remote);
        if (remote === "PAID") return false;
      }
    }
    // só a cobrança ainda PENDENTE vira CANCELED; FAILED/EXPIRED preservam o motivo real
    if (order.payment.status === "PENDING") order.payment.status = "CANCELED";
    setStatus(order, "CANCELED");
    return true;
  } finally {
    busy.delete(order.id);
  }
}
