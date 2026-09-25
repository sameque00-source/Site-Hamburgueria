import type { Category } from "@/types/menu";

// DEMO — estrutura ilustrativa. A loja define as categorias reais.
export const categories: Category[] = [
  { id: "burgers", name: "Burgers", tagline: "A casa começa aqui", image: "menuTyoTudo", demo: true },
  { id: "combos", name: "Combos", tagline: "Burger + acompanhamento + bebida", image: "comboCasa", demo: true },
  { id: "acompanhamentos", name: "Acompanhamentos", tagline: "Pra dividir ou não", image: "batataFrita", demo: true },
  { id: "pizzas", name: "Pizzas", tagline: "Outra fome, mesma casa", image: "pizzaCalabresa", demo: true },
  { id: "acai", name: "Açaí", tagline: "Pra fechar", image: "acai500", demo: true },
  { id: "bebidas", name: "Bebidas", tagline: "Gelado, sempre", image: "bebidaSuco", demo: true },
];
