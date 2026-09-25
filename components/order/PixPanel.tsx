"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Order } from "@/types/order";
import styles from "./PixPanel.module.css";

/**
 * Painel PIX DEMO. O QR contém um texto que NÃO é um BR Code (nenhum app
 * de banco o aceita como PIX). Os botões "Simular…" representam o banco
 * do cliente: disparam o webhook assinado no servidor — a interface nunca
 * marca PAGO sozinha; ela só exibe o que o provedor confirmou.
 */
export function PixPanel({
  order,
  busy,
  onSimulate,
  onRetry,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onSimulate: (outcome: "pay" | "fail") => void;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const p = order.payment;
  const [qr, setQr] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!p.qrPayload) return;
    let alive = true;
    QRCode.toDataURL(p.qrPayload, {
      margin: 1,
      width: 480,
      errorCorrectionLevel: "H",
      color: { dark: "#0a0807", light: "#f4ece2" },
    })
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [p.qrPayload]);

  // contagem regressiva da cobrança
  useEffect(() => {
    if (!p.expiresAt || p.status !== "PENDING") return;
    const tick = () => setLeft(Math.max(0, Math.round((Date.parse(p.expiresAt!) - Date.now()) / 1000)));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [p.expiresAt, p.status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.qrPayload ?? "");
      toast("success", "Código DEMO copiado.");
    } catch {
      toast("error", "Não foi possível copiar.");
    }
  };

  if (p.status === "FAILED" || p.status === "EXPIRED") {
    return (
      <section className={styles.panel} data-state="error" aria-labelledby="pix-title">
        <h2 id="pix-title" className={`display ${styles.title}`}>
          {p.status === "FAILED" ? "Pagamento não aprovado" : "PIX expirado"}
        </h2>
        <p className={styles.muted}>
          {p.status === "FAILED"
            ? "O pagamento DEMO foi recusado. Gere um novo PIX ou cancele o pedido."
            : "O tempo para pagar acabou. Gere um novo PIX para continuar."}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onRetry} disabled={busy}>
            Gerar novo PIX
          </button>
          <button type="button" className={styles.ghost} onClick={onCancel} disabled={busy}>
            Cancelar pedido
          </button>
        </div>
      </section>
    );
  }

  if (p.status !== "PENDING") return null;

  const mm = left !== null ? `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}` : "--:--";

  return (
    <section className={styles.panel} aria-labelledby="pix-title">
      <div className={styles.qrWrap}>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL gerada no cliente
          <img src={qr} alt="QR Code PIX de demonstração (não é um PIX válido)" className={styles.qr} width={240} height={240} />
        ) : (
          <div className={styles.qrLoading} aria-hidden="true" />
        )}
        <span className={styles.stamp} aria-hidden="true">
          DEMO
        </span>
      </div>

      <div className={styles.side}>
        <p className="label">PIX · ambiente de demonstração</p>
        <h2 id="pix-title" className={`display ${styles.title}`}>
          Pague com PIX
        </h2>
        <p className={styles.amount}>{formatPrice(p.amount)}</p>
        {/* sem aria-live: anunciar a contagem a cada segundo seria ruído para leitor de tela */}
        <p className={styles.muted}>
          Expira em <strong>{mm}</strong>
        </p>

        <div className={styles.copyBox}>
          <code>{p.qrPayload}</code>
          <button type="button" onClick={copy}>
            Copiar
          </button>
        </div>

        <p className={styles.warn}>
          Este QR Code é <strong>DEMO</strong>: não é uma cobrança real e nenhum banco aceita pagá-lo. Use os botões
          abaixo para simular a resposta do banco.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => onSimulate("pay")} disabled={busy}>
            Simular pagamento aprovado
          </button>
          <button type="button" className={styles.ghost} onClick={() => onSimulate("fail")} disabled={busy}>
            Simular falha
          </button>
        </div>
        <button type="button" className={styles.link} onClick={onCancel} disabled={busy}>
          Cancelar pedido
        </button>
        <p className={styles.spinner} aria-hidden="true">
          <span /> consultando o provedor…
        </p>
      </div>
    </section>
  );
}
