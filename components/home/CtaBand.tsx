"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Crown } from "@/components/brand/Logo";
import { RevealText } from "@/components/motion/RevealText";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, MQ } from "@/lib/motion";
import styles from "./CtaBand.module.css";

export function CtaBand() {
  const root = useRef<HTMLElement>(null);

  // a luz de baixo "acende" conforme a seção entra — fecha a página no CTA
  useGSAP(
    () => {
      gsap.matchMedia().add(MQ.motionOk, () => {
        gsap.fromTo(
          "[data-cta-light]",
          { scale: 0.7, autoAlpha: 0.4 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: EASE.none,
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className={styles.section} aria-labelledby="cta-title">
      <div className={styles.light} data-cta-light aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <Crown className={styles.crown} />
        <RevealText id="cta-title" className={`display ${styles.title}`} lines={["Bateu a", "fome?"]} />
        <p className={styles.lede} data-reveal>
          Monte seu pedido no cardápio e finalize em poucos passos.
        </p>
        <div className={styles.ctas} data-reveal>
          <Button href="/menu" size="lg" magnetic>
            Pedir agora
          </Button>
        </div>
      </div>
    </section>
  );
}
