"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "@/components/product/ProductMedia";
import { useProductExpand } from "@/components/product/ProductExpand";
import { storeConfig } from "@/config/store";
import { getProductById } from "@/data/demo/products";
import { cart, cartTotals, useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { selectedAddons, unitPrice } from "@/lib/pricing";
import { useHydrated } from "@/lib/useHydrated";
import styles from "./CartView.module.css";

export function CartView() {
  const lines = useCart();
  const hydrated = useHydrated();
  const expand = useProductExpand();
  const totals = cartTotals(lines, "delivery");

  if (!hydrated) {
    return <div className={styles.loading} aria-busy="true" aria-label="Carregando carrinho" />;
  }

  if (!lines.length) {
    return (
      <div className={styles.empty}>
        <p className={`display ${styles.emptyTitle}`}>Seu carrinho está vazio.</p>
        <p className={styles.emptyText}>Escolha um burger no cardápio — ele aparece aqui na hora.</p>
        <Button href="/menu" size="lg" magnetic>
          Ver cardápio
        </Button>
      </div>
    );
  }

  const unavailable = lines.some((l) => !getProductById(l.productId)?.available);

  return (
    <div className={styles.layout}>
      <ul className={styles.lines} aria-label="Itens do pedido">
        {lines.map((l) => {
          const p = getProductById(l.productId);
          if (!p) return null;
          const addons = selectedAddons(p, l.addonIds);
          const unit = unitPrice(p, l.addonIds);
          return (
            <li key={l.key} className={styles.line} data-off={!p.available || undefined}>
              <div className={styles.thumb}>
                <ProductMedia product={p} shape="square" sizes="96px" showNote={false} />
              </div>
              <div className={styles.info}>
                <p className={`display ${styles.name}`}>{p.name}</p>
                {addons.length > 0 && (
                  <ul className={styles.addons}>
                    {addons.map((a) => (
                      <li key={a.id}>
                        + {a.name}
                        {a.price ? ` · ${formatPrice(a.price)}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
                {l.note && <p className={styles.note}>Obs.: {l.note}</p>}
                {!p.available && <p className={styles.warn}>Indisponível — remova para continuar.</p>}
                <div className={styles.actions}>
                  {expand && p.available && (
                    <button
                      type="button"
                      className={styles.link}
                      onClick={(e) =>
                        expand(p, e.currentTarget, { key: l.key, qty: l.qty, addonIds: l.addonIds, note: l.note })
                      }
                    >
                      Editar
                    </button>
                  )}
                  <button type="button" className={styles.link} onClick={() => cart.remove(l.key)}>
                    Remover
                  </button>
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.qty} role="group" aria-label={`Quantidade de ${p.name}`}>
                  <button type="button" onClick={() => cart.setQty(l.key, l.qty - 1)} aria-label={l.qty === 1 ? `Remover ${p.name}` : "Diminuir"}>
                    −
                  </button>
                  <output aria-live="polite">{l.qty}</output>
                  <button type="button" onClick={() => cart.setQty(l.key, l.qty + 1)} disabled={l.qty >= 20} aria-label="Aumentar">
                    +
                  </button>
                </div>
                <p className={styles.lineTotal}>{formatPrice(unit * l.qty)}</p>
                {l.qty > 1 && <p className={styles.unit}>{formatPrice(unit)} cada</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <aside className={styles.summary} aria-label="Resumo">
        <h2 className={styles.sTitle}>Resumo</h2>
        <dl className={styles.rows}>
          <div>
            <dt>Itens ({totals.count})</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{formatPrice(totals.deliveryFee)}*</dd>
          </div>
          <div className={styles.total}>
            <dt>Total estimado</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>
        <p className="note">
          *Taxa DEMO. Retirada no local não tem taxa — escolha no checkout.
          {storeConfig.isDemo && " Valores demonstrativos."}
        </p>
        {unavailable ? (
          <p className={styles.warn} role="alert">
            Remova os itens indisponíveis para finalizar.
          </p>
        ) : (
          <Button href="/checkout" size="lg" magnetic>
            Finalizar pedido
          </Button>
        )}
        <Link href="/menu" className={styles.more}>
          + Adicionar mais itens
        </Link>
      </aside>
    </div>
  );
}
