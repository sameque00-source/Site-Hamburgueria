"use client";

// Ponto único de registro do GSAP. Todo componente importa daqui
// para garantir que os plugins sejam registrados uma vez só.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DUR, EASE } from "./motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: EASE.soft, duration: DUR.slow });
}

export { gsap, ScrollTrigger, useGSAP };
