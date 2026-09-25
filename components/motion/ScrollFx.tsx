"use client";

import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MQ } from "@/lib/motion";

/**
 * Controlador único dos efeitos declarativos de scroll:
 *  - [data-reveal]         fade + subida (batch, 1 trigger p/ grupo)
 *  - [data-reveal-lines]   linhas mascaradas (RevealText)
 *  - [data-parallax="n"]   deslocamento vertical scrubado (n = intensidade, ex. 0.15)
 * Efeitos específicos de seção (pin, timelines) ficam no próprio componente.
 */
export function ScrollFx() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MQ.motionOk, () => {
        const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        gsap.set(reveals, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(reveals, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: DUR.slow, stagger: 0.07, ease: EASE.out }),
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-lines]").forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll(".mask-line > span"),
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: DUR.reveal,
              stagger: 0.08,
              ease: EASE.out,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amount = parseFloat(el.dataset.parallax || "0.15");
          gsap.fromTo(
            el,
            { yPercent: -amount * 50 },
            {
              yPercent: amount * 50,
              ease: EASE.none,
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });

      // fontes alteram alturas: recalcula posições quando carregarem
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => mm.revert();
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
