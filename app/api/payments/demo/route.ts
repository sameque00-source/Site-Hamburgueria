import type { NextRequest } from "next/server";
import { demoPixProvider } from "@/lib/payments/demo-pix";
import { applyPaymentStatus, canAccess, findOrderByPayment, getOrder, paymentProvider } from "@/lib/order/server";

// POST /api/payments/demo?t=TOKEN  { orderId, outcome: "pay" | "fail" }
// SOMENTE DEMO: simula o banco do cliente. O "pagamento" passa pelo mesmo
// webhook assinado de um provedor real — o navegador não define status.
// Com provedor real (isDemo=false) esta rota responde 404.
export async function POST(req: NextRequest) {
  if (!paymentProvider.isDemo) return Response.json({ error: "Não disponível." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { orderId?: string; outcome?: string };
  const id = String(body.orderId ?? "");
  if (!canAccess(id, req.nextUrl.searchParams.get("t"))) {
    return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (body.outcome !== "pay" && body.outcome !== "fail") {
    return Response.json({ error: "Ação inválida." }, { status: 400 });
  }
  const order = await getOrder(id);
  if (!order || order.payment.method !== "pix") {
    return Response.json({ error: "Pedido sem cobrança PIX." }, { status: 409 });
  }
  const result = await demoPixProvider.simulateBankEvent(order.payment.id, body.outcome);
  if (!result.ok) return Response.json({ error: result.error, order }, { status: 409 });
  const target = findOrderByPayment(result.paymentId);
  if (target) applyPaymentStatus(target, result.status);
  return Response.json({ order: target });
}
