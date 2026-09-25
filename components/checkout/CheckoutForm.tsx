"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cloneElement,
  useId,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/Button";
import { storeConfig } from "@/config/store";
import { getProductById } from "@/data/demo/products";
import { cart, cartTotals, useCart } from "@/lib/cart/store";
import { formatCep, formatPhone, formatPrice, onlyDigits } from "@/lib/format";
import { saveOrderRef } from "@/lib/order/client";
import { lineTotal } from "@/lib/pricing";
import { validateCheckout, type FieldErrors } from "@/lib/order/validate";
import { toast } from "@/lib/toast";
import { useHydrated } from "@/lib/useHydrated";
import type { CheckoutInput, PaymentMethod } from "@/types/order";
import styles from "./CheckoutForm.module.css";

type Mode = "delivery" | "pickup";

const PAY: { id: PaymentMethod; title: string; text: string }[] = [
  { id: "pix", title: "PIX", text: "QR Code na próxima tela · confirmação automática" },
  { id: "cash", title: "Dinheiro", text: "Pagamento na entrega" },
  { id: "card", title: "Cartão", text: "Maquininha na entrega (débito/crédito)" },
];

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCart();
  const [mode, setMode] = useState<Mode>(storeConfig.delivery.enabled ? "delivery" : "pickup");
  const [pay, setPay] = useState<PaymentMethod>("pix");
  const [f, setF] = useState({
    name: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    reference: "",
    neighborhood: "",
    city: "",
    note: "",
    changeFor: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);

  const totals = cartTotals(lines, mode, f.neighborhood);
  const set = (k: keyof typeof f) => (v: string) => {
    setF((s) => ({ ...s, [k]: v }));
    // o erro some assim que o campo é corrigido (volta a validar no envio)
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  const buildInput = (): CheckoutInput => ({
    customer: { name: f.name.trim(), phone: onlyDigits(f.phone) },
    delivery:
      mode === "pickup"
        ? { mode: "pickup" }
        : {
            mode: "delivery",
            street: f.street.trim(),
            number: f.number.trim(),
            complement: f.complement.trim(),
            reference: f.reference.trim(),
            neighborhood: f.neighborhood.trim(),
            city: f.city.trim(),
            cep: onlyDigits(f.cep),
          },
    paymentMethod: pay,
    changeFor: pay === "cash" && f.changeFor ? Math.round(parseFloat(f.changeFor.replace(",", ".")) * 100) : undefined,
    note: f.note.trim(),
    lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, addonIds: l.addonIds, note: l.note })),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const input = buildInput();
    // mesma validação do servidor (inclui troco ≥ total)
    const errs = validateCheckout(input);
    if (pay === "cash" && f.changeFor.trim() && !Number.isFinite(input.changeFor)) {
      errs.changeFor = "Valor de troco inválido.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast("error", "Revise os campos destacados.");
      // foca o primeiro campo com erro
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        toast("error", data.error ?? "Não foi possível criar o pedido.");
        setSending(false);
        return;
      }
      saveOrderRef(data.order.id, data.token);
      cart.clear();
      router.push(`/pedido?id=${encodeURIComponent(data.order.id)}&t=${encodeURIComponent(data.token)}`);
    } catch {
      toast("error", "Sem conexão. Tente de novo.");
      setSending(false);
    }
  };

  if (!hydrated) return <div className={styles.loading} aria-busy="true" />;

  if (!lines.length) {
    return (
      <div className={styles.empty}>
        <p className={`display ${styles.emptyTitle}`}>Nada para finalizar ainda.</p>
        <p className={styles.muted}>Seu carrinho está vazio — escolha seus itens no cardápio.</p>
        <Button href="/menu" size="lg">
          Ver cardápio
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.layout} onSubmit={onSubmit} noValidate>
      <div className={styles.steps}>
        {errors.cart && (
          <p className={styles.alert} role="alert">
            {errors.cart} <Link href="/carrinho">Ir ao carrinho</Link>
          </p>
        )}

        <Step n="01" title="Seus dados">
          <div className={styles.row2}>
            <Field label="Nome" error={errors.name}>
              <input value={f.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" maxLength={80} />
            </Field>
            <Field label="WhatsApp" error={errors.phone} hint="Com DDD">
              <input
                value={f.phone}
                onChange={(e) => set("phone")(formatPhone(e.target.value))}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(27) 99999-9999"
              />
            </Field>
          </div>
        </Step>

        <Step n="02" title="Entrega">
          <div className={styles.toggle} role="radiogroup" aria-label="Como receber">
            {storeConfig.delivery.enabled && (
              <Choice checked={mode === "delivery"} onChange={() => setMode("delivery")} name="mode" title="Entrega" text={`Taxa ${formatPrice(cartTotals(lines, "delivery").deliveryFee)} (DEMO)`} />
            )}
            {storeConfig.pickup.enabled && (
              <Choice checked={mode === "pickup"} onChange={() => setMode("pickup")} name="mode" title="Retirada" text="Sem taxa" />
            )}
          </div>
          {errors.mode && <p className={styles.error}>{errors.mode}</p>}

          {mode === "delivery" ? (
            <div className={styles.address}>
              <Field label="CEP" error={errors.cep} className={styles.cep}>
                <input value={f.cep} onChange={(e) => set("cep")(formatCep(e.target.value))} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />
              </Field>
              <Field label="Rua" error={errors.street} className={styles.street}>
                <input value={f.street} onChange={(e) => set("street")(e.target.value)} autoComplete="address-line1" />
              </Field>
              <Field label="Número" error={errors.number} className={styles.num}>
                <input value={f.number} onChange={(e) => set("number")(e.target.value)} maxLength={10} />
              </Field>
              <Field label="Complemento" hint="Opcional" className={styles.comp}>
                <input value={f.complement} onChange={(e) => set("complement")(e.target.value)} autoComplete="address-line2" maxLength={60} />
              </Field>
              <Field label="Bairro" error={errors.neighborhood} className={styles.bairro}>
                <input value={f.neighborhood} onChange={(e) => set("neighborhood")(e.target.value)} maxLength={60} />
              </Field>
              <Field label="Cidade" error={errors.city} className={styles.city}>
                <input value={f.city} onChange={(e) => set("city")(e.target.value)} autoComplete="address-level2" maxLength={60} />
              </Field>
              <Field label="Ponto de referência" hint="Opcional" className={styles.ref}>
                <input
                  value={f.reference}
                  onChange={(e) => set("reference")(e.target.value)}
                  maxLength={80}
                  placeholder="Ex.: ao lado da padaria, portão azul"
                />
              </Field>
            </div>
          ) : (
            <p className={styles.muted}>Retirar em: {storeConfig.pickup.address}</p>
          )}
        </Step>

        <Step n="03" title="Pagamento">
          <div className={styles.pays} role="radiogroup" aria-label="Forma de pagamento">
            {PAY.filter((p) => storeConfig.payments[p.id]).map((p) => (
              <Choice key={p.id} checked={pay === p.id} onChange={() => setPay(p.id)} name="pay" title={p.title} text={p.text} />
            ))}
          </div>
          {errors.payment && <p className={styles.error}>{errors.payment}</p>}
          {pay === "pix" && (
            <p className={styles.info}>
              Ambiente de <strong>demonstração</strong>: o QR Code gerado é DEMO e não cobra dinheiro real.
            </p>
          )}
          {pay === "cash" && (
            <Field label="Troco para" hint="Opcional · ex.: 100,00" error={errors.changeFor} className={styles.change}>
              <input
                value={f.changeFor}
                onChange={(e) => set("changeFor")(e.target.value.replace(/[^\d,]/g, ""))}
                inputMode="decimal"
                placeholder="R$"
              />
            </Field>
          )}
          {pay === "card" && <p className={styles.info}>O entregador leva a maquininha (DEMO).</p>}
        </Step>

        <Step n="04" title="Observação">
          <Field label="Observação do pedido" hint="Opcional">
            <textarea value={f.note} onChange={(e) => set("note")(e.target.value.slice(0, 280))} rows={3} placeholder="Ex.: interfone quebrado, ligar ao chegar…" />
          </Field>
        </Step>
      </div>

      <aside className={styles.summary} aria-label="Resumo do pedido">
        <h2 className={styles.sTitle}>Seu pedido</h2>
        <ul className={styles.items}>
          {lines.map((l) => {
            const p = getProductById(l.productId);
            return (
              <li key={l.key}>
                <span>
                  {l.qty}× {p?.name}
                </span>
                <span>{formatPrice(lineTotal(l.productId, l.qty, l.addonIds))}</span>
              </li>
            );
          })}
        </ul>
        <dl className={styles.rows}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          <div>
            <dt>{mode === "pickup" ? "Retirada" : "Entrega (DEMO)"}</dt>
            <dd>{formatPrice(totals.deliveryFee)}</dd>
          </div>
          <div className={styles.total}>
            <dt>Total</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>
        <Button plain type="submit" disabled={sending} aria-busy={sending}>
          {sending ? "Enviando…" : pay === "pix" ? "Gerar PIX e finalizar" : "Confirmar pedido"}
        </Button>
        <p className="note">Valores demonstrativos. O total é recalculado pelo sistema ao confirmar.</p>
      </aside>
    </form>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.step}>
      <legend className={styles.legend}>
        <span className="label-index">{n}</span>
        <span className="display">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactElement<InputHTMLAttributes<HTMLElement>>;
}) {
  const errId = useId();
  const inputId = useId();
  // estado de erro vai no próprio campo (leitores de tela + foco no 1º erro)
  const control = cloneElement(children, {
    id: inputId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errId : undefined,
  });
  return (
    <label htmlFor={inputId} className={`${styles.field} ${className ?? ""}`} data-error={error ? true : undefined}>
      <span className={styles.fLabel}>
        {label}
        {hint && <em>{hint}</em>}
      </span>
      {control}
      {error && (
        <span id={errId} className={styles.error}>
          {error}
        </span>
      )}
    </label>
  );
}

function Choice({
  checked,
  onChange,
  name,
  title,
  text,
}: {
  checked: boolean;
  onChange: () => void;
  name: string;
  title: string;
  text: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={styles.choice} data-on={checked || undefined}>
      <input id={id} type="radio" name={name} checked={checked} onChange={onChange} />
      <span className={styles.radio} aria-hidden="true" />
      <span>
        <span className={styles.cTitle}>{title}</span>
        <span className={styles.cText}>{text}</span>
      </span>
    </label>
  );
}
