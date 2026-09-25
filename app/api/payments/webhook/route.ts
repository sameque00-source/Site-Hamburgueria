import { applyPaymentStatus, findOrderByPayment, paymentProvider } from "@/lib/order/server";

// POST /api/payments/webhook — entrada de eventos do provedor de pagamento.
// Só aceita corpo assinado (x-tyo-signature). Com o provedor real, este é
// o endpoint configurado no painel do provedor.
export async function POST(req: Request) {
  const raw = await req.text();
  const result = await paymentProvider.handlePaymentWebhook(raw, req.headers.get("x-tyo-signature"));
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  const order = findOrderByPayment(result.paymentId);
  if (order) applyPaymentStatus(order, result.status);
  return Response.json({ received: true });
}
