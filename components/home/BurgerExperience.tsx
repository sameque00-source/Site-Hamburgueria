"use client";

import { useRef, useState, type CSSProperties } from "react";
import { FrameSequence, type FrameSequenceHandle } from "@/components/media/FrameSequence";
import { Picture } from "@/components/media/Picture";
import { RevealText } from "@/components/motion/RevealText";
import { media, pictures } from "@/config/media";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, MQ } from "@/lib/motion";
import styles from "./BurgerExperience.module.css";

/**
 * BURGER EXPERIENCE — fechado → desmonta → 12 camadas → completo.
 *
 * Mídia real: tyo-hero-main-01 (fechado) e tyo-burger-explode-master-01
 * (desmontado) — mesma câmera, então o crossfade é coerente.
 * Cada etapa aponta a camada REAL da foto (coordenadas medidas na imagem
 * 1376×768). Quando existir a sequência de frames (media.burgerFrames),
 * o mesmo progresso controla a FrameSequence no lugar do crossfade.
 * Os nomes descrevem o que está na foto — composição oficial a confirmar.
 */

type Layer = { name: string; y: number; x: number };

// y/x em px da imagem desmontada (1376×768); x = borda esquerda da camada
const LAYERS: Layer[] = [
  { name: "Pão", y: 110, x: 735 },
  { name: "Ovo", y: 215, x: 757 },
  { name: "Bacon", y: 282, x: 692 },
  { name: "Queijo", y: 312, x: 748 },
  { name: "Carne", y: 346, x: 726 },
  { name: "Queijo", y: 392, x: 732 },
  { name: "Carne", y: 428, x: 726 },
  { name: "Cebola", y: 478, x: 732 },
  { name: "Tomate", y: 524, x: 742 },
  { name: "Alface", y: 556, x: 676 },
  { name: "Molho", y: 592, x: 708 },
  { name: "Pão", y: 632, x: 712 },
];
const W = 1376;
const H = 768;
const CROP_LEFT = 643; // recorte retrato (mobile): x 643–1257
const CROP_W = 614;
const TOTAL = LAYERS.length + 1; // + burger completo

export function BurgerExperience() {
  const root = useRef<HTMLElement>(null);
  const seq = useRef<FrameSequenceHandle>(null);
  const [step, setStep] = useState(-1); // -1 = fechado (antes de começar)
  const frames = media.burgerFrames.status === "ready" ? media.burgerFrames.frames : undefined;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MQ.motionOk, () => {
        const mobile = window.matchMedia(MQ.mobile).matches;
        const markers = gsap.utils.toArray<HTMLElement>("[data-marker]");
        gsap.set(markers, { autoAlpha: 0 });

        const tl = gsap.timeline({
          defaults: { ease: EASE.inOut },
          scrollTrigger: {
            trigger: "[data-exp-stage]",
            start: "top top",
            end: mobile ? "+=420%" : "+=560%",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
          // roda durante o scrub suavizado → etapa e frames seguem o visual
          onUpdate: () => {
            seq.current?.setProgress(tl.progress());
            const t = tl.time();
            let i = -1;
            for (let n = 0; n < TOTAL; n++) {
              if (t >= (tl.labels[`step${n}`] ?? Infinity) + 0.1) i = n;
            }
            setStep((s) => (s === i ? s : i));
          },
        });

        // 1. desmontar (crossfade fechado → desmontado)
        tl.to("[data-exp-closed]", { autoAlpha: 0, scale: 1.02, duration: 1 }, 0).fromTo(
          "[data-exp-open]",
          { autoAlpha: 0, scale: 0.98 },
          { autoAlpha: 1, scale: 1, duration: 1 },
          0,
        );

        // 2. uma camada por vez
        markers.forEach((m, n) => {
          tl.addLabel(`step${n}`);
          if (n > 0) tl.to(markers[n - 1], { autoAlpha: 0, x: -8, duration: 0.2 });
          tl.fromTo(m, { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.25 }, n > 0 ? "<" : ">");
          tl.to({}, { duration: 0.45 });
        });

        // 3. remontar → burger completo
        tl.addLabel(`step${LAYERS.length}`)
          .to(markers[markers.length - 1], { autoAlpha: 0, duration: 0.2 })
          .to("[data-exp-open]", { autoAlpha: 0, duration: 1 }, "<")
          .to("[data-exp-closed]", { autoAlpha: 1, scale: 1, duration: 1 }, "<")
          .fromTo("[data-exp-complete]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.4")
          .to({}, { duration: 0.4 });
      });

      // reduced motion: diagrama estático (desmontado + todas as camadas)
      mm.add(MQ.reduced, () => {
        gsap.set("[data-exp-closed]", { autoAlpha: 0 });
        gsap.set("[data-exp-open], [data-marker]", { autoAlpha: 1 });
      });
    },
    { scope: root },
  );

  const current = step >= 0 && step < LAYERS.length ? LAYERS[step] : null;

  return (
    <section ref={root} id="experiencia" className={styles.section} aria-labelledby="exp-title">
      <div className={styles.stage} data-exp-stage>
        <div className={styles.copy}>
          <p className="label">
            <span className="label-index">03</span>Burger experience
          </p>
          <RevealText id="exp-title" className={`display ${styles.title}`} lines={["Camada por", "camada."]} />
        </div>
        <div className={styles.frame}>
          {frames ? (
            <FrameSequence
              ref={seq}
              frames={frames}
              label="Burger sendo desmontado camada por camada"
              className={styles.layer}
              fallback={
                <Picture asset={pictures.burgerExplode} alt="" mobileVariant="portrait" sizes="100vw" className={styles.img} />
              }
            />
          ) : (
            <>
              <div className={styles.layer} data-exp-open>
                <Picture
                  asset={pictures.burgerExplode}
                  alt="O mesmo hambúrguer desmontado em camadas: pão, ovo, bacon, queijo, carne, queijo, carne, cebola, tomate, alface, molho e pão"
                  mobileVariant="portrait"
                  sizes="(max-width: 900px) 100vw, 1376px"
                  className={styles.img}
                />
              </div>
              <div className={styles.layer} data-exp-closed>
                <Picture
                  asset={pictures.heroMain}
                  alt=""
                  mobileVariant="portrait"
                  sizes="(max-width: 900px) 100vw, 1376px"
                  className={styles.img}
                />
              </div>
            </>
          )}

          <div className={styles.shade} aria-hidden="true" />

          {/* marcadores ancorados nas camadas reais da foto */}
          <ol className={styles.markers} aria-hidden="true">
            {LAYERS.map((l, i) => (
              <li
                key={i}
                className={styles.marker}
                data-marker
                style={
                  {
                    "--y": `${(l.y / H) * 100}%`,
                    "--x": `${(l.x / W) * 100}%`,
                    "--xm": `${((l.x - CROP_LEFT) / CROP_W) * 100}%`,
                  } as CSSProperties
                }
              >
                <span className={styles.mLabel}>
                  <span className={styles.mNum}>{String(i + 1).padStart(2, "0")}</span>
                  {l.name}
                </span>
                <span className={styles.mLine} />
                <span className={styles.mDot} />
              </li>
            ))}
          </ol>


          <div className={styles.hud} aria-live="polite">
            <span className={styles.counter}>
              {step < 0 ? "00" : String(Math.min(step + 1, TOTAL)).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
            </span>
            <span className={`display ${styles.current}`}>
              {step < 0 ? "Role para desmontar" : current ? current.name : "Burger completo"}
            </span>
            <span className={styles.bar} aria-hidden="true">
              <span style={{ transform: `scaleX(${Math.max(0, step + 1) / TOTAL})` }} />
            </span>
          </div>

          <p className={`display ${styles.complete}`} data-exp-complete aria-hidden="true">
            Pronto pra pedir
          </p>
        </div>

        {/* lista estática — leitores de tela e reduced motion */}
        <ol className={styles.list} aria-label="Camadas do burger da foto">
          {LAYERS.map((l, i) => (
            <li key={i}>{l.name}</li>
          ))}
        </ol>
      </div>
      <p className={`container note ${styles.note}`}>
        Camadas conforme a foto demonstrativa — composição oficial dos produtos a confirmar com a loja.
      </p>
    </section>
  );
}
