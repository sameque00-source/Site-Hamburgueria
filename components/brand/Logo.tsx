import styles from "./Logo.module.css";

// Wordmark provisório: coroa desenhada + TYO.
// Será trocado pelo logo oficial vetorizado quando a loja fornecer.
export function Crown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 19.5h28M3.5 16 2 4.5l7.5 6L16 1.5l6.5 9 7.5-6L28.5 16h-25Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={`${styles.logo} ${styles[size]}`}>
      <Crown className={styles.crown} />
      <span className={styles.word}>TYO</span>
      <span className="sr-only">Tyo Burguer</span>
    </span>
  );
}
