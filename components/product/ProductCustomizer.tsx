"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { unitPrice, validateAddons } from "@/lib/pricing";
import { toast } from "@/lib/toast";
import type { Product } from "@/types/menu";
import styles from "./ProductCustomizer.module.css";

/**
 * Personalização: grupos (obrigatório/opcional + limite), quantidade,
 * observação, total ao vivo e ação de adicionar (ou salvar edição).
 * Usado no painel expandido, na página do produto e na edição do carrinho.
 */
export function ProductCustomizer({
  product,
  editKey,
  initial,
  onDone,
  headingLevel = "h3",
}: {
  product: Product;
  /** presente = editar linha existente do carrinho */
  editKey?: string;
  initial?: { qty: number; addonIds: string[]; note: string };
  onDone?: () => void;
  headingLevel?: "h2" | "h3";
}) {
  const H = headingLevel;
  const uid = useId();
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [addonIds, setAddonIds] = useState<string[]>(initial?.addonIds ?? []);
  const [note, setNote] = useState(initial?.note ?? "");
  const [tried, setTried] = useState(false);

  const errors = useMemo(() => validateAddons(product, addonIds), [product, addonIds]);
  const unit = unitPrice(product, addonIds);

  const toggle = (groupId: string, optionId: string) => {
    const group = product.addonGroups.find((g) => g.id === groupId);
    if (!group) return;
    setAddonIds((cur) => {
      const inGroup = cur.filter((id) => group.options.some((o) => o.id === id));
      if (cur.includes(optionId)) return cur.filter((id) => id !== optionId);
      // escolha única: troca a opção
      if (group.maxSelections === 1) return [...cur.filter((id) => !inGroup.includes(id)), optionId];
      if (inGroup.length >= group.maxSelections) {
        toast("info", `Máximo de ${group.maxSelections} em ${group.name}.`);
        return cur;
      }
      return [...cur, optionId];
    });
  };

  /** "Nenhum": limpa a escolha de um grupo opcional de seleção única */
  const clearGroup = (groupId: string) => {
    const group = product.addonGroups.find((g) => g.id === groupId);
    if (!group) return;
    setAddonIds((cur) => cur.filter((id) => !group.options.some((o) => o.id === id)));
  };

  const submit = () => {
    setTried(true);
    if (!product.available) return;
    if (errors.length) {
      toast("error", errors[0]);
      return;
    }
    const res = editKey ? cart.update(editKey, addonIds, note) : cart.add(product.id, qty, addonIds, note);
    if (!res.ok) {
      toast("error", res.error);
      return;
    }
    toast("success", editKey ? "Item atualizado." : `${qty}× ${product.name} no pedido.`, {
      label: "Ver carrinho",
      href: "/carrinho",
    });
    onDone?.();
  };

  return (
    <div className={styles.root}>
      {product.addonGroups.map((g) => {
        const count = g.options.filter((o) => addonIds.includes(o.id)).length;
        const missing = tried && g.required && count < 1;
        return (
          <fieldset key={g.id} className={styles.group} data-missing={missing || undefined}>
            <legend className={styles.legend}>
              <H className={styles.h}>{g.name}</H>
              <span className={styles.rule}>
                {g.required ? "Obrigatório" : "Opcional"} · {g.maxSelections === 1 ? "escolha 1" : `até ${g.maxSelections}`}
                {g.maxSelections > 1 && ` (${count}/${g.maxSelections})`}
              </span>
            </legend>
            {/* radio não desmarca sozinho: grupo opcional de escolha única ganha "Nenhum" */}
            {!g.required && g.maxSelections === 1 && (
              <label className={styles.option} data-on={count === 0 || undefined}>
                <input type="radio" name={`${uid}-${g.id}`} checked={count === 0} onChange={() => clearGroup(g.id)} />
                <span className={styles.check} data-round aria-hidden="true" />
                <span className={styles.oName}>Nenhum</span>
                <span className={styles.oPrice} />
              </label>
            )}
            {g.options.map((o) => {
              const on = addonIds.includes(o.id);
              return (
                <label key={o.id} className={styles.option} data-on={on || undefined}>
                  <input
                    type={g.maxSelections === 1 ? "radio" : "checkbox"}
                    name={`${uid}-${g.id}`}
                    checked={on}
                    onChange={() => toggle(g.id, o.id)}
                  />
                  <span className={styles.check} data-round={g.maxSelections === 1 || undefined} aria-hidden="true" />
                  <span className={styles.oName}>{o.name}</span>
                  <span className={styles.oPrice}>{o.price ? `+ ${formatPrice(o.price)}` : "incluso"}</span>
                </label>
              );
            })}
            {missing && <p className={styles.error}>Escolha uma opção em {g.name}.</p>}
          </fieldset>
        );
      })}

      <label className={styles.noteField}>
        <span className={styles.h}>Observação</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 140))}
          rows={2}
          placeholder="Ex.: sem cebola, molho à parte…"
          maxLength={140}
        />
        <span className={styles.counter}>{note.length}/140</span>
      </label>

      <div className={styles.buy}>
        {!editKey && (
          <div className={styles.qty} role="group" aria-label="Quantidade">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Diminuir quantidade">
              −
            </button>
            <output aria-live="polite">{qty}</output>
            <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} disabled={qty >= 20} aria-label="Aumentar quantidade">
              +
            </button>
          </div>
        )}
        <div className={styles.total}>
          <span className="label">{editKey ? "Por unidade" : "Total"}</span>
          <span className={`display ${styles.price}`}>{formatPrice(editKey ? unit : unit * qty)}</span>
          {product.demo && <span className={styles.demo}>valor DEMO</span>}
        </div>
      </div>

      {product.available ? (
        <Button plain onClick={submit} data-cursor="button">
          {editKey ? "Salvar alterações" : "Adicionar ao pedido"}
        </Button>
      ) : (
        <p className={styles.unavailable} role="note">
          Indisponível no momento.
        </p>
      )}
    </div>
  );
}
