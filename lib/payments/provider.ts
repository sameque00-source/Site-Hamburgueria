// Contrato de pagamento. O restante do sistema só conhece esta interface:
// trocar DemoPixProvider por um provedor real (Mercado Pago, Efí, Stripe…)
// não muda checkout, pedido nem interface.

import type { Cents } from "@/types/menu";
import type { PaymentStatus } from "@/types/order";

export type CreatePaymentInput = {
  orderId: string;
  amount: Cents;
  description: string;
  payer: { name: string; phone: string };
};

export type ProviderPayment = {
  id: string;
  status: PaymentStatus;
  amount: Cents;
  qrPayload: string;
  expiresAt: string;
  paidAt?: string;
};

export type WebhookResult = { ok: true; paymentId: string; status: PaymentStatus } | { ok: false; error: string };

export interface PaymentProvider {
  readonly name: "demo-pix" | string;
  readonly isDemo: boolean;
  /** cria a cobrança e devolve o conteúdo do QR */
  createPayment(input: CreatePaymentInput): Promise<ProviderPayment>;
  /** consulta o provedor (fonte da verdade do status) */
  getPaymentStatus(paymentId: string): Promise<ProviderPayment | null>;
  /** valida assinatura e aplica o evento enviado pelo provedor */
  handlePaymentWebhook(rawBody: string, signature: string | null): Promise<WebhookResult>;
  /**
   * invalida uma cobrança PENDENTE no provedor. Devolve o status final:
   * "CANCELED" (cancelada) ou o status em que ela já estava (ex.: "PAID" se
   * o pagamento chegou antes do cancelamento). null = cobrança inexistente.
   */
  cancelPayment(paymentId: string): Promise<PaymentStatus | null>;
}
