"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { HeroMedia } from "@/components/media/HeroMedia";
import { Picture } from "@/components/media/Picture";
import { media, pictures } from "@/config/media";
import { site } from "@/config/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MQ } from "@/lib/motion";
import styles from "./Hero.module.css";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MQ.motionOk, () => {
        // ENTRADA — a foto "acende" e se aproxima; depois a tipografia
        const tl = gsap.timeline({ delay: 0.05, defaults: { ease: EASE.out } });
        tl.fromTo(
          "[data-hero-media]",
          { scale: 1.14, autoAlpha: 0, filter: "brightness(0.4)" },
          { scale: 1.04, autoAlpha: 1, filter: "brightness(1)", duration: 1.8 },
        )
          .fromTo("[data-hero-line] > span", { yPercent: 110 }, { yPercent: 0, duration: DUR.reveal, stagger: 0.08 }, 0.35)
          .fromTo("[data-hero-fade]", { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.9 }, 0.75);

        // SAÍDA — o burger avança em direção à câmera; a próxima seção
        // sobe por cima (cortina em Categories)
        const exit = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-stage]", { scale: 1.16, yPercent: 8, ease: EASE.none, scrollTrigger: exit });
        gsap.to("[data-hero-copy]", { yPercent: -22, autoAlpha: 0, ease: EASE.none, scrollTrigger: exit });
      });

      // PROFUNDIDADE — a foto acompanha o ponteiro de leve (desktop)
      mm.add(`${MQ.motionOk} and ${MQ.finePointer}`, () => {
        const stage = root.current;
        if (!stage) return;
        const x = gsap.quickTo("[data-hero-media]", "x", { duration: 1.2, ease: EASE.soft });
        const y = gsap.quickTo("[data-hero-media]", "y", { duration: 1.2, ease: EASE.soft });
        const onMove = (e: PointerEvent) => {
          x((e.clientX / window.innerWidth - 0.5) * -18);
          y((e.clientY / window.innerHeight - 0.5) * -10);
        };
        stage.addEventListener("pointermove", onMove);
        return () => stage.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.stage} data-hero-stage>
        <div className={styles.media} data-hero-media>
          <HeroMedia slot={media.heroVideo}>
            <Picture
              asset={pictures.heroMain}
              alt="Hambúrguer com pão brioche, ovo, bacon, dois hambúrgueres com cheddar, cebola roxa, tomate e alface sobre pedra escura"
              variant="desktop"
              mobileVariant="portrait"
              sizes="100vw"
              mobileSizes="100vw"
              priority
            />
          </HeroMedia>
          <div className={styles.shade} aria-hidden="true" />
        </div>
      </div>

      <div className={`container ${styles.copy}`} data-hero-copy>
        <p className={`label ${styles.eyebrow}`} data-hero-fade>
          <span className={styles.dot} />
          {site.location.neighborhood} · {site.location.city} — {site.location.state}
        </p>

        <h1 id="hero-title" className={`display ${styles.title}`}>
          <span className="mask-line" data-hero-line>
            <span>O sabor que</span>
          </span>
          <span className="mask-line" data-hero-line>
            <span>merece uma</span>
          </span>
          <span className={`mask-line ${styles.accent}`} data-hero-line>
            <span>coroa.</span>
          </span>
        </h1>

        <div className={styles.bottom}>
          <p className={styles.lede} data-hero-fade>
            Escolha, personalize e peça em poucos toques. O burger chega do jeito que você montou.
          </p>
          <div className={styles.ctas} data-hero-fade>
            <Button href="/menu" size="lg" magnetic>
              Pedir agora
            </Button>
            <Button href="#cardapio" variant="ghost" size="lg">
              Ver menu
            </Button>
          </div>
        </div>
      </div>

      <a href="#cardapio" className={styles.scroll} data-hero-fade aria-label="Rolar para o cardápio">
        <span>Role</span>
        <i />
      </a>
    </section>
  );
}
