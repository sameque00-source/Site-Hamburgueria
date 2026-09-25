import type { MediaSlot } from "@/config/media";
import styles from "./MediaPlaceholder.module.css";

// Placeholder técnico: deixa explícito que é provisório, mas mantém
// luz e profundidade para a composição já ser avaliada.
export function MediaPlaceholder({
  slot,
  className,
}: {
  slot: MediaSlot;
  className?: string;
}) {
  return (
    <div className={`${styles.stage} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.spot} />
      <div className={styles.halo} />
      <div className={styles.ring} />
      <div className={`${styles.ring} ${styles.ring2}`} />
      <div className={styles.floor} />

      <div className={styles.frame}>
        <i className={styles.tl} />
        <i className={styles.tr} />
        <i className={styles.bl} />
        <i className={styles.br} />
        {/* slot técnico fica no DOM para inspeção; o público vê só o aviso */}
        <span className={styles.label} data-slot={`${slot.id} · ${slot.kind} · ${slot.ratio}`}>
          Imagem em breve
        </span>
      </div>
    </div>
  );
}
