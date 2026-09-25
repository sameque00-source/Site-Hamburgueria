"use client";

import Link from "next/link";
import { dismiss, useToasts } from "@/lib/toast";
import styles from "./Toaster.module.css";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast} data-kind={t.kind}>
          <span className={styles.icon} aria-hidden="true">
            {t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}
          </span>
          <span className={styles.text}>{t.text}</span>
          {t.action && (
            <Link href={t.action.href} className={styles.action} onClick={() => dismiss(t.id)}>
              {t.action.label}
            </Link>
          )}
          <button type="button" className={styles.close} onClick={() => dismiss(t.id)} aria-label="Fechar aviso">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
