"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** false no servidor e na hidratação; true depois — evita "piscar" estado vazio */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
