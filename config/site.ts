// Configuração central da marca. Tudo marcado como A CONFIRMAR
// deve ser substituído pelos dados oficiais da loja.

export const site = {
  name: "Tyo Burguer",
  shortName: "TYO",
  isDemo: true,
  location: {
    neighborhood: "Flexal I",
    city: "Cariacica",
    state: "ES",
    fullAddress: null as string | null, // A CONFIRMAR
  },
  contact: {
    whatsapp: null as string | null, // A CONFIRMAR
    instagram: null as string | null, // A CONFIRMAR
  },
  hours: null as string | null, // A CONFIRMAR
} as const;

export const nav = [
  { label: "Cardápio", href: "/menu" },
  { label: "Destaques", href: "/#destaques" },
  { label: "Experiência", href: "/#experiencia" },
  { label: "A casa", href: "/#a-casa" },
] as const;

export const PENDING = "A CONFIRMAR";
