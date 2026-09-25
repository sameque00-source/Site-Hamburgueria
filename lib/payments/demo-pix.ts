import "server-only";

// ============================================================
// DemoPixProvider — AMBIENTE DE DEMONSTRAÇÃO. NÃO MOVIMENTA DINHEIRO.
//  - não usa chave PIX real; o QR contém um texto que NÃO é um
//    BR Code válido (apps de banco não o aceitam como PIX);
//  - o "banco" é simulado por simulateBankEvent(), que emite um
//    webhook ASSINADO (HMAC-SHA256) e passa pelo mesmo caminho que
//    um provedor real usaria → o cliente nunca marca "PAGO" sozinho.
// Estado em memória do processo (demo). Produção: provedor real + banco.
// ============================================================

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { storeConfig } from "@/config/store";
import type { CreatePaymentInput, PaymentProvider, ProviderPayment, WebhookResult } from "./provider";
import type { PaymentStatus } from "@/types/order";

type DemoState = { payments: Map<string, ProviderPayment>; secret: string };

// sobrevive ao hot reload em desenvolvimento
const g = globalThis as unknown as { __tyoDemoPix?: DemoState };
const state: DemoState = (g.__tyoDemoPix ??= {
  payments: new Map(),
  // segredo por processo; em produção viria de variável de ambiente
  secret: process.env.DEMO_PIX_WEBHOOK_SECRET || randomBytes(32).toString("hex"),
});

const sign = (body: string) => createHmac("sha256", state.secret).update(body).digest("hex");

function expireIfNeeded(p: ProviderPayment) {
  if (p.status === "PENDING" && Date.parse(p.expiresAt) <= Date.now()) {
    p.status = "EXPIRED";
  }
  return p;
}

export const demoPixProvider: PaymentProvider & {
  simulateBankEvent(paymentId: string, outcome: "pay" | "fail"): Promise<WebhookResult>;
} = {
  name: "demo-pix",
  isDemo: true,

  async createPayment(input: CreatePaymentInput) {
    const id = `pix_demo_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const payment: ProviderPayment = {
      id,
      status: "PENDING",
      amount: input.amount,
      // intencionalmente NÃO é um BR Code (sem 000201…): não é pagável
      qrPayload: `TYO-BURGUER|PIX-DEMO|${id}|${input.orderId}|NAO-E-UM-PIX-REAL`,
      expiresAt: new Date(Date.now() + storeConfig.pixExpiresInSeconds * 1000).toISOString(),
    };
    // DEMO em memória: descarta cobranças vencidas há mais de 24 h (mesma janela dos pedidos)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [pid, p] of state.payments) {
      if (Date.parse(p.expiresAt) > cutoff) break; // ordem de inserção ≈ ordem de vencimento
      state.payments.delete(pid);
    }
    state.payments.set(id, payment);
    return { ...payment };
  },

  async getPaymentStatus(paymentId: string) {
    const p = state.payments.get(paymentId);
    return p ? { ...expireIfNeeded(p) } : null;
  },

  async handlePaymentWebhook(rawBody: string, signature: string | null): Promise<WebhookResult> {
    if (!signature) return { ok: false, error: "assinatura ausente" };
    const expected = Buffer.from(sign(rawBody), "hex");
    const got = Buffer.from(signature, "hex");
    if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
      return { ok: false, error: "assinatura inválida" };
    }
    let evt: { paymentId?: string; status?: PaymentStatus };
    try {
      evt = JSON.parse(rawBody);
    } catch {
      return { ok: false, error: "corpo inválido" };
    }
    const p = evt.paymentId ? state.payments.get(evt.paymentId) : undefined;
    if (!p) return { ok: false, error: "pagamento não encontrado" };
    expireIfNeeded(p);
    // transições permitidas: só a partir de PENDING
    if (p.status !== "PENDING") return { ok: false, error: `pagamento já está ${p.status}` };
    if (evt.status !== "PAID" && evt.status !== "FAILED") return { ok: false, error: "status inválido" };
    p.status = evt.status;
    if (evt.status === "PAID") p.paidAt = new Date().toISOString();
    return { ok: true, paymentId: p.id, status: p.status };
  },

  async cancelPayment(paymentId: string) {
    const p = state.payments.get(paymentId);
    if (!p) return null;
    expireIfNeeded(p);
    // só uma cobrança PENDENTE pode ser cancelada; qualquer outro status é final
    if (p.status === "PENDING") p.status = "CANCELED";
    return p.status;
  },

  /** DEMO: simula o banco do cliente enviando o webhook assinado */
  async simulateBankEvent(paymentId: string, outcome: "pay" | "fail") {
    const body = JSON.stringify({ paymentId, status: outcome === "pay" ? "PAID" : "FAILED" });
    return demoPixProvider.handlePaymentWebhook(body, sign(body));
  },
};

/** assinatura para testes/integração do webhook DEMO (não expor ao cliente) */
export const signDemoWebhook = sign;
