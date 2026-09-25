const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** centavos → "R$ 29,90". `null` vira marcador explícito. */
export function formatPrice(value: number | null): string {
  //   → espaço normal: evita caractere invisível em mensagens de WhatsApp
  return value === null ? "R$ —,—" : brl.format(value / 100).replace(/ /g, " ");
}

export function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** (27) 99999-9999 */
export function formatPhone(raw: string) {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 29140-000 */
export function formatCep(raw: string) {
  const d = onlyDigits(raw).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
