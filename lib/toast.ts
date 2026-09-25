"use client";

import { useSyncExternalStore } from "react";

export type Toast = { id: number; kind: "success" | "error" | "info"; text: string; action?: { label: string; href: string } };

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(kind: Toast["kind"], text: string, action?: Toast["action"]) {
  const t = { id: ++seq, kind, text, action };
  toasts = [...toasts.slice(-2), t];
  emit();
  window.setTimeout(() => dismiss(t.id), kind === "error" ? 6000 : 4000);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const EMPTY: Toast[] = [];

export function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => EMPTY,
  );
}
