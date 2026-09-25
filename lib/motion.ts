// Espelho em JS dos tokens de motion de app/globals.css.
// Todo código GSAP usa estes valores — nada de durações soltas.

export const EASE = {
  out: "expo.out",
  soft: "power3.out",
  inOut: "power2.inOut",
  none: "none",
} as const;

export const DUR = {
  fast: 0.25,
  base: 0.6,
  slow: 1,
  reveal: 1.1,
} as const;

export const BP = {
  sm: 560,
  md: 900,
  lg: 1280,
} as const;

export const MQ = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
  desktop: `(min-width: ${BP.md + 1}px)`,
  mobile: `(max-width: ${BP.md}px)`,
} as const;
