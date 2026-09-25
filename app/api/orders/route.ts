import { createOrder, orderToken } from "@/lib/order/server";
import { parseCheckout, validateCheckout } from "@/lib/order/validate";

// limite simples por IP (memória do processo): evita inundar a DEMO de pedidos
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function rateLimited(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

// POST /api/orders — cria o pedido a partir do carrinho.
// Preços/total são recalculados no servidor; o cliente só envia escolhas.
export async function POST(req: Request) {
  if (rateLimited(req)) {
    return Response.json({ error: "Muitos pedidos em sequência. Aguarde um minuto." }, { status: 429 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }
  const input = parseCheckout(raw);
  if (!input) return Response.json({ error: "Dados do pedido inválidos." }, { status: 400 });

  const errors = validateCheckout(input);
  if (Object.keys(errors).length) return Response.json({ error: "Revise os campos.", fields: errors }, { status: 422 });

  const order = await createOrder(input);
  return Response.json({ order, token: orderToken(order.id) }, { status: 201 });
}
