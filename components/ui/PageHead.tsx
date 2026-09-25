import type { ReactNode } from "react";
import styles from "./PageHead.module.css";

/** Cabeçalho padrão das páginas internas (menu, carrinho, checkout, pedido). */
export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className={styles.head}>
      <p className="label">{kicker}</p>
      <h1 className={`display ${styles.title}`}>{title}</h1>
      {children && <div className={styles.aside}>{children}</div>}
    </header>
  );
}
