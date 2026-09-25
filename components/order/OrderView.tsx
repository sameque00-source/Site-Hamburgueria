"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCep, formatPhone, formatPrice } from "@/lib/format";
import { lastOrderRef } from "@/lib/order/client";
import { buildWhatsAppLink, buildWhatsAppMessage, storeWhatsAppTarget } from "@/lib/order/whatsapp";
import { toast } from "@/lib/toast";
import type { Order, OrderStatus } from "@/types/order";
import { PixPanel } from "./PixPanel";
import styles from "./OrderView.module.css";

const STATUS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento confirmado",
  RECEIVED: "Pedido recebido",
  PREPARING: "Em preparo",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

const METHOD = { pix: "PIX", cash: "Dinheiro na entrega", card: "Cartão na entrega" } as const;

type Load = { state: "loading" } | { state: "missing" } | { state: "error" } | { state: "ok"; order: Order };

type Ref = { id: string; token: string } | null;

/**
 * A rota /pedido não remonta quando só a query muda (?id=&t=). A chave força
 * um estado novo a cada pedido: trocar de pedido, voltar/avançar no histórico
 * ou abrir "meu último pedido" sempre recarrega do zero.
 */
export function OrderView() {
  const params = useSearchParams();
  const id = params.get("id");
  const t = params.get("t");
  const ref: Ref = id && t ? { id, token: t } : null;
  return <OrderViewFor key={ref ? `${ref.id}|${ref.token}` : "none"} orderRef={ref} />;
}

function OrderViewFor({ orderRef }: { orderRef: Ref }) {
  // fixo durante a vida deste componente (a chave troca quando o pedido muda)
  const [ref] = useState(orderRef);
  const [load, setLoad] = useState<Load>(ref ? { state: "loading" } : { state: "missing" });
  const [busy, setBusy] = useState(false);
  const [fallbackRef, setFallbackRef] = useState<{ id: string; token: string } | null>(null);

  const q = ref ? `?t=${encodeURIComponent(ref.token)}` : "";

  const fetchOrder = useCallback(async () => {
    if (!ref) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(ref.id)}${q}`, { cache: "no-store" });
      if (res.status === 404) return setLoad({ state: "missing" });
      const data = res.ok ? await res.json() : null;
      if (!data?.order) throw new Error(`HTTP ${res.status}`);
      setLoad({ state: "ok", order: data.order });
    } catch {
      setLoad((l) => (l.state === "ok" ? l : { state: "error" }));
    }
  }, [ref, q]);

  // primeira carga + consulta periódica enquanto aguarda pagamento
  const waiting = load.state === "ok" && load.order.status === "PENDING_PAYMENT" && load.order.payment.status === "PENDING";
  useEffect(() => {
    const first = window.setTimeout(fetchOrder, 0);
    return () => window.clearTimeout(first);
  }, [fetchOrder]);

  useEffect(() => {
    if (!waiting) return;
    const t = window.setInterval(fetchOrder, 2000);
    return () => window.clearInterval(t);
  }, [fetchOrder, waiting]);

  // sem id na URL: oferece o último pedido deste navegador
  useEffect(() => {
    if (ref) return;
    const last = lastOrderRef();
    if (last) window.setTimeout(() => setFallbackRef({ id: last.id, token: last.token }), 0);
  }, [ref]);

  const post = async (url: string, body: object, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.order) setLoad({ state: "ok", order: data.order });
      if (res.ok) toast("success", okMsg);
      else toast("error", data.error ?? "Ação não permitida.");
    } catch {
      toast("error", "Sem conexão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  if (load.state === "loading") return <div className={styles.loading} aria-busy="true" aria-label="Carregando pedido" />;

  if (load.state === "missing" || load.state === "error") {
    return (
      <div className={styles.empty}>
        <p className={`display ${styles.emptyTitle}`}>
          {load.state === "error" ? "Não foi possível carregar o pedido." : "Pedido não encontrado."}
        </p>
        <p className={styles.muted}>
          {load.state === "error"
            ? "Verifique sua conexão e recarregue a página."
            : "O link pode estar incompleto. Pedidos DEMO ficam disponíveis enquanto o servidor estiver no ar."}
        </p>
        <div className={styles.row}>
          {fallbackRef && (
            <Button
              href={`/pedido?id=${encodeURIComponent(fallbackRef.id)}&t=${encodeURIComponent(fallbackRef.token)}`}
              variant="ghost"
            >
              Ver meu último pedido
            </Button>
          )}
          <Button href="/menu">Ir ao cardápio</Button>
        </div>
      </div>
    );
  }

  const o = load.order;
  const confirmed = o.status !== "PENDING_PAYMENT" && o.status !== "CANCELED";
  const canSend = confirmed && (o.payment.method !== "pix" || o.payment.status === "PAID");
  // destino único (NEXT_PUBLIC_WHATSAPP_NUMBER): mesmo resultado para estado, botão e link
  const wa = storeWhatsAppTarget();
  const waLink = buildWhatsAppLink(o, wa);

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <header className={styles.head} data-state={o.status}>
          <p className="label">Pedido #{o.id}</p>
          <h2 className={`display ${styles.status}`} aria-live="polite">
            {o.status === "CANCELED" ? "Pedido cancelado" : confirmed ? "Pedido confirmado" : STATUS[o.status]}
          </h2>
          {confirmed && (
            <p className={styles.muted}>
              {o.payment.method === "pix" ? `Pagamento ${o.demo ? "DEMO " : ""}confirmado pelo provedor.` : "Pagamento na entrega."}
              {waLink && " Envie o pedido para a loja pelo WhatsApp."}
            </p>
          )}
          {o.status === "CANCELED" && (
            <p className={styles.muted} role={o.payment.refundRequired ? "alert" : undefined}>
              {o.payment.refundRequired
                ? "O pagamento foi confirmado depois do cancelamento. A loja precisa estornar o valor — este pedido não será preparado."
                : "A cobrança foi invalidada e nenhum valor será cobrado. Você pode fazer um novo pedido quando quiser."}
            </p>
          )}
        </header>

        {o.payment.method === "pix" && o.status === "PENDING_PAYMENT" && (
          <PixPanel
            order={o}
            busy={busy}
            onSimulate={(outcome) =>
              post(`/api/payments/demo${q}`, { orderId: o.id, outcome }, outcome === "pay" ? "Pagamento DEMO aprovado." : "Falha DEMO simulada.")
            }
            onRetry={() => post(`/api/orders/${o.id}/payment${q}`, { action: "retry" }, "Novo PIX gerado.")}
            onCancel={() => {
              // ação irreversível: confirma antes de invalidar a cobrança
              if (!window.confirm("Cancelar este pedido? A cobrança PIX será invalidada.")) return;
              post(`/api/orders/${o.id}/payment${q}`, { action: "cancel" }, "Pedido cancelado.");
            }}
          />
        )}

        {canSend && (
          <section className={styles.send} aria-labelledby="wa-title">
            <h3 id="wa-title" className={styles.h}>
              Enviar para a loja
            </h3>
            {waLink ? (
              <>
                {/* wa.me: abre o app no celular e o WhatsApp Web no desktop, com a mensagem preenchida */}
                <a className={styles.wa} href={waLink} target="_blank" rel="noopener noreferrer" data-cursor="button">
                  Enviar pedido no WhatsApp
                </a>
                <p className={styles.muted}>
                  Abre o WhatsApp da Tyo Burguer com o pedido já escrito — é só tocar em enviar.
                </p>
              </>
            ) : (
              <>
                <button type="button" className={styles.wa} disabled aria-describedby="wa-state">
                  Enviar pedido no WhatsApp
                </button>
                <p id="wa-state" className={styles.waState} data-state={wa.state} role="note">
                  {wa.state === "demo" ? (
                    <>
                      <strong>DEMO</strong> — o WhatsApp da hamburgueria ainda não foi configurado. Quando o número
                      oficial for definido, este botão abre a conversa com a loja e o pedido já preenchido.
                    </>
                  ) : (
                    <>
                      <strong>Envio bloqueado</strong> — o número configurado para a loja é inválido. Confira
                      NEXT_PUBLIC_WHATSAPP_NUMBER (DDD + número, com ou sem +55).
                    </>
                  )}
                </p>
              </>
            )}
            <details className={styles.preview}>
              <summary>Ver mensagem</summary>
              <pre>{buildWhatsAppMessage(o)}</pre>
            </details>
          </section>
        )}

        <ol className={styles.timeline} aria-label="Andamento do pedido">
          {o.timeline.map((t, i) => (
            <li key={i}>
              <span className={styles.dot} aria-hidden="true" />
              <span>{STATUS[t.status]}</span>
              <time dateTime={t.at}>{new Date(t.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
            </li>
          ))}
        </ol>
      </div>

      <aside className={styles.summary} aria-label="Resumo do pedido">
        <h3 className={styles.h}>Resumo</h3>
        <ul className={styles.items}>
          {o.items.map((i, n) => (
            <li key={n}>
              <div className={styles.itemRow}>
                <span>
                  {i.qty}× {i.name}
                </span>
                <span>{formatPrice(i.lineTotal)}</span>
              </div>
              {i.addons.map((a) => (
                <p key={a.id} className={styles.sub}>
                  + {a.name}
                </p>
              ))}
              {i.note && <p className={styles.sub}>Obs.: {i.note}</p>}
            </li>
          ))}
        </ul>
        <dl className={styles.rows}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(o.totals.subtotal)}</dd>
          </div>
          <div>
            <dt>{o.delivery.mode === "pickup" ? "Retirada" : "Entrega"}</dt>
            <dd>{formatPrice(o.totals.deliveryFee)}</dd>
          </div>
          <div className={styles.total}>
            <dt>Total</dt>
            <dd>{formatPrice(o.totals.total)}</dd>
          </div>
        </dl>
        <dl className={styles.meta}>
          <div>
            <dt>Pagamento</dt>
            <dd>
              {METHOD[o.payment.method]}
              {o.payment.changeFor ? ` · troco para ${formatPrice(o.payment.changeFor)}` : ""}
            </dd>
          </div>
          <div>
            <dt>Cliente</dt>
            <dd>
              {o.customer.name} · {formatPhone(o.customer.phone)}
            </dd>
          </div>
          <div>
            <dt>{o.delivery.mode === "pickup" ? "Retirada" : "Entrega"}</dt>
            <dd>
              {o.delivery.mode === "pickup"
                ? "No local"
                : `${o.delivery.street}, ${o.delivery.number}${o.delivery.complement ? ` — ${o.delivery.complement}` : ""} · ${o.delivery.neighborhood}, ${o.delivery.city} · ${formatCep(o.delivery.cep)}${o.delivery.reference ? ` · Ref.: ${o.delivery.reference}` : ""}`}
            </dd>
          </div>
          {o.note && (
            <div>
              <dt>Observação</dt>
              <dd>{o.note}</dd>
            </div>
          )}
        </dl>
        {o.demo && <p className="note">Pedido de demonstração — valores ilustrativos, nenhum pagamento real.</p>}
        <Link href="/menu" className={styles.more}>
          Fazer outro pedido
        </Link>
      </aside>
    </div>
  );
}
