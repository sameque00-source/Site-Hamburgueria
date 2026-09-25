"use client";

import type { ReactNode } from "react";
import type { MediaSlot } from "@/config/media";
import { MQ } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./HeroMedia.module.css";

/**
 * Mídia do hero.
 *  - Sempre renderiza a imagem (children) — é o pôster e o fallback.
 *  - Vídeo só entra quando: slot "ready" + movimento permitido.
 *    Com reduced motion: nunca toca vídeo, fica a imagem estática.
 *  - preload="none" + poster: o vídeo não disputa banda com o LCP;
 *    fonte mobile separada quando existir.
 */
export function HeroMedia({ slot, children }: { slot: MediaSlot; children: ReactNode }) {
  const motionOk = useMediaQuery(MQ.motionOk);
  const mobile = useMediaQuery(MQ.mobile);
  const playVideo = slot.status === "ready" && slot.kind === "video" && !!slot.src && motionOk;

  return (
    <div className={styles.fill}>
      {children}
      {playVideo && (
        <video
          className={styles.media}
          poster={slot.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        >
          {mobile && slot.srcMobile ? (
            <source src={slot.srcMobile} type="video/mp4" />
          ) : (
            <>
              {slot.srcWebm && <source src={slot.srcWebm} type="video/webm" />}
              <source src={slot.src} type="video/mp4" />
            </>
          )}
        </video>
      )}
    </div>
  );
}
