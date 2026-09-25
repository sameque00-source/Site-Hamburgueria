"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Media query reativa sem setState em efeito.
 * No servidor retorna `serverValue` (padrão false) — o cliente
 * corrige na hidratação sem render em cascata.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
