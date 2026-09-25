import type { NextRequest } from "next/server";
import { canAccess, cancelOrder, getOrder, retryPayment } from "@/lib/order/server";

// POST /api/orders/:id/payment?t=TOKEN  { action: "retry" | "cancel" }
// retry: nova cobrança PIX após falha/expiração · cancel: desiste do pedido
export async function POST(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/payment">) {
  const { id } = await ctx.params;
  if (!canAccess(id, req.nextUrl.searchParams.get("t"))) {
    return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const ok =
    body.action === "retry" ? await retryPayment(order) : body.action === "cancel" ? await cancelOrder(order) : false;
  if (!ok) return Response.json({ error: "Ação não permitida neste estado.", order }, { status: 409 });
  return Response.json({ order });
}
