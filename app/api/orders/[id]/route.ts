import type { NextRequest } from "next/server";
import { canAccess, getOrder } from "@/lib/order/server";

// GET /api/orders/:id?t=TOKEN — status atual (consulta o provedor de pagamento)
export async function GET(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  if (!canAccess(id, req.nextUrl.searchParams.get("t"))) {
    return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  return Response.json({ order }, { headers: { "Cache-Control": "no-store" } });
}
