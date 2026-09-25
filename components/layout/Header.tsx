"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { nav } from "@/config/site";
import { cartTotals, useCart } from "@/lib/cart/store";
import styles from "./Header.module.css";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const cartCount = cartTotals(useCart()).count;

  // some ao descer (mais espaço para o conteúdo), volta ao subir
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        const delta = y - lastY.current;
        if (Math.abs(delta) > 6) setHidden(delta > 0 && y > 320);
        lastY.current = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const cls = [
    styles.header,
    scrolled && styles.scrolled,
    hidden && !open && styles.hidden,
    open && styles.isOpen,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={cls} data-hidden={(hidden && !open) || undefined} onFocusCapture={() => setHidden(false)}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.brand} aria-label="Tyo Burguer — início">
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label="Principal">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/carrinho" className={styles.cart} aria-label={`Carrinho, ${cartCount} itens`}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z M9 7V6a3 3 0 0 1 6 0v1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {cartCount > 0 && (
              <span key={cartCount} className={styles.count}>
                {cartCount}
              </span>
            )}
          </Link>

          <Link href="/menu" className={styles.cta} data-cursor="button">
            Pedir agora
          </Link>

          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* sempre no DOM para animar; inert tira do teclado/leitor quando fechado */}
      <div id="mobile-nav" className={styles.sheet} data-open={open || undefined} inert={!open}>
        <nav className="container" aria-label="Menu móvel">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.sheetLink}
              style={{ transitionDelay: open ? `${0.08 + i * 0.05}s` : "0s" }}
              onClick={() => setOpen(false)}
            >
              <span className={styles.sheetIndex}>0{i + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link href="/menu" className={styles.sheetCta} onClick={() => setOpen(false)}>
            Pedir agora →
          </Link>
        </nav>
      </div>
    </header>
  );
}
