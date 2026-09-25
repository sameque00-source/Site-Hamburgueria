import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { nav, site, PENDING } from "@/config/site";
import styles from "./Footer.module.css";

export function Footer() {
  const { location, contact, hours } = site;

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <Logo size="lg" />
          <p>
            {location.neighborhood} · {location.city} — {location.state}
          </p>
        </div>

        <nav className={styles.col} aria-labelledby="ft-nav">
          <h2 id="ft-nav">Navegar</h2>
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="/carrinho">Carrinho</Link>
        </nav>

        <div className={styles.col}>
          <h2>Contato</h2>
          <p>WhatsApp: {contact.whatsapp ?? PENDING}</p>
          <p>Instagram: {contact.instagram ?? PENDING}</p>
        </div>

        <div className={styles.col}>
          <h2>Funcionamento</h2>
          <p>{hours ?? PENDING}</p>
          <p>Endereço: {location.fullAddress ?? PENDING}</p>
        </div>
      </div>

      {/* assinatura da marca — fecha a página com o nome em escala de outdoor */}
      <div className={styles.wordmark} aria-hidden="true" data-parallax="0.1">
        TYO BURGUER
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} Tyo Burguer</span>
        {site.isDemo && <span className={styles.demo}>Versão de demonstração — dados ilustrativos</span>}
      </div>
    </footer>
  );
}
