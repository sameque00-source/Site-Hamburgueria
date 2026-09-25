import type { AddonGroup, Product } from "@/types/menu";

// ============================================================
// CATÁLOGO DEMO — NÃO SÃO DADOS OFICIAIS DA TYO BURGUER.
// Produtos, preços, ingredientes e adicionais são ilustrativos,
// só para demonstrar o fluxo de pedido. Valores em centavos.
// Substituir pelos dados oficiais quando a loja fornecer.
// ============================================================

const burgerPonto: AddonGroup = {
  id: "g-ponto",
  name: "Ponto da carne",
  required: true,
  maxSelections: 1,
  options: [
    { id: "ponto-ao-ponto", name: "Ao ponto", price: 0 },
    { id: "ponto-bem", name: "Bem passada", price: 0 },
  ],
};

const burgerExtras: AddonGroup = {
  id: "g-extras",
  name: "Adicionais",
  required: false,
  maxSelections: 5,
  options: [
    { id: "add-bacon", name: "Bacon", price: 600 },
    { id: "add-cheddar", name: "Cheddar", price: 450 },
    { id: "add-catupiry", name: "Catupiry", price: 450 },
    { id: "add-ovo", name: "Ovo", price: 350 },
    { id: "add-carne", name: "Carne extra", price: 900 },
  ],
};

const pizzaBorda: AddonGroup = {
  id: "g-borda",
  name: "Borda recheada",
  required: false,
  maxSelections: 1,
  options: [
    { id: "borda-catupiry", name: "Catupiry", price: 900 },
    { id: "borda-cheddar", name: "Cheddar", price: 900 },
  ],
};

const acaiComplementos: AddonGroup = {
  id: "g-complementos",
  name: "Complementos",
  required: false,
  maxSelections: 4,
  options: [
    { id: "acai-leite-po", name: "Leite em pó", price: 300 },
    { id: "acai-granola", name: "Granola", price: 200 },
    { id: "acai-banana", name: "Banana", price: 200 },
    { id: "acai-morango", name: "Morango", price: 350 },
    { id: "acai-pacoca", name: "Paçoca", price: 250 },
  ],
};

const comboBebida: AddonGroup = {
  id: "g-combo-bebida",
  name: "Bebida do combo",
  required: true,
  maxSelections: 1,
  options: [
    { id: "combo-refri", name: "Refrigerante lata", price: 0 },
    { id: "combo-suco", name: "Suco natural", price: 300 },
  ],
};

const DEMO = "Descrição ilustrativa — composição real a confirmar com a loja.";

export const products: Product[] = [
  // ---------- burgers ----------
  {
    id: "p-tudo",
    slug: "tyo-tudo",
    categoryId: "burgers",
    name: "Tyo Tudo",
    description: "Pão brioche, ovo, bacon, dois hambúrgueres com cheddar, cebola roxa, tomate, alface e molho.",
    price: 3990,
    ingredients: ["Pão", "Ovo", "Bacon", "Cheddar", "2 carnes", "Cebola roxa", "Tomate", "Alface", "Molho"],
    addonGroups: [burgerPonto, burgerExtras],
    image: "menuTyoTudo",
    available: true,
    featured: true,
    demo: true,
  },
  {
    id: "p-bacon",
    slug: "tyo-bacon",
    categoryId: "burgers",
    name: "Tyo Bacon",
    description: DEMO,
    price: 3290,
    ingredients: ["Pão", "Carne", "Queijo", "Bacon", "Molho"],
    addonGroups: [burgerPonto, burgerExtras],
    image: "burgerBacon",
    available: true,
    featured: true,
    demo: true,
  },
  {
    id: "p-classico",
    slug: "tyo-classico",
    categoryId: "burgers",
    name: "Tyo Clássico",
    description: DEMO,
    price: 2690,
    ingredients: ["Pão", "Carne", "Queijo", "Salada", "Molho"],
    addonGroups: [burgerPonto, burgerExtras],
    image: "burgerClassico",
    available: true,
    featured: true,
    demo: true,
  },
  {
    id: "p-duplo",
    slug: "tyo-duplo",
    categoryId: "burgers",
    name: "Tyo Duplo",
    description: DEMO,
    price: 3490,
    ingredients: ["Pão", "2 carnes", "Queijo", "Molho"],
    addonGroups: [burgerPonto, burgerExtras],
    image: "burgerDuplo",
    available: true,
    featured: true,
    demo: true,
  },
  // ---------- pizzas ----------
  {
    id: "p-pizza-calabresa",
    slug: "pizza-calabresa",
    categoryId: "pizzas",
    name: "Pizza Calabresa",
    description: DEMO,
    price: 4990,
    ingredients: ["Molho de tomate", "Mussarela", "Calabresa", "Cebola"],
    addonGroups: [pizzaBorda],
    image: "pizzaCalabresa",
    available: true,
    demo: true,
  },
  {
    id: "p-pizza-marguerita",
    slug: "pizza-marguerita",
    categoryId: "pizzas",
    name: "Pizza Marguerita",
    description: DEMO,
    price: 4690,
    ingredients: ["Molho de tomate", "Mussarela", "Tomate", "Manjericão"],
    addonGroups: [pizzaBorda],
    image: "pizzaMarguerita",
    available: true,
    demo: true,
  },
  // ---------- açaí ----------
  {
    id: "p-acai-300",
    slug: "acai-300",
    categoryId: "acai",
    name: "Açaí 300 ml",
    description: DEMO,
    price: 1690,
    ingredients: ["Açaí"],
    addonGroups: [acaiComplementos],
    image: "acai300",
    available: true,
    demo: true,
  },
  {
    id: "p-acai-500",
    slug: "acai-500",
    categoryId: "acai",
    name: "Açaí 500 ml",
    description: DEMO,
    price: 2290,
    ingredients: ["Açaí"],
    addonGroups: [acaiComplementos],
    image: "acai500",
    available: true,
    demo: true,
  },
  {
    id: "p-acai-700",
    slug: "acai-700",
    categoryId: "acai",
    name: "Açaí 700 ml",
    description: DEMO,
    price: 2890,
    ingredients: ["Açaí"],
    addonGroups: [acaiComplementos],
    image: "acai700",
    available: false, // DEMO: demonstra o estado "indisponível"
    demo: true,
  },
  // ---------- bebidas ----------
  {
    id: "p-refri",
    slug: "refrigerante-lata",
    categoryId: "bebidas",
    name: "Refrigerante lata",
    description: "350 ml — sabores a confirmar.",
    price: 650,
    ingredients: [],
    addonGroups: [],
    image: "bebidaRefri",
    available: true,
    demo: true,
  },
  {
    id: "p-suco",
    slug: "suco-natural",
    categoryId: "bebidas",
    name: "Suco natural",
    description: "Sabores a confirmar.",
    price: 990,
    ingredients: [],
    addonGroups: [],
    image: "bebidaSuco",
    available: true,
    demo: true,
  },
  {
    id: "p-agua",
    slug: "agua",
    categoryId: "bebidas",
    name: "Água mineral",
    description: "500 ml.",
    price: 400,
    ingredients: [],
    addonGroups: [],
    image: "bebidaAgua",
    available: true,
    demo: true,
  },
  // ---------- acompanhamentos ----------
  {
    id: "p-batata",
    slug: "batata-frita",
    categoryId: "acompanhamentos",
    name: "Batata frita",
    description: DEMO,
    price: 1890,
    ingredients: ["Batata"],
    addonGroups: [],
    image: "batataFrita",
    available: true,
    demo: true,
  },
  {
    id: "p-onion",
    slug: "onion-rings",
    categoryId: "acompanhamentos",
    name: "Onion rings",
    description: DEMO,
    price: 2190,
    ingredients: ["Cebola empanada"],
    addonGroups: [],
    image: "onionRings",
    available: true,
    demo: true,
  },
  // ---------- combos ----------
  {
    id: "p-combo-casa",
    slug: "combo-da-casa",
    categoryId: "combos",
    name: "Combo da Casa",
    description: "Tyo Clássico + batata frita + bebida (composição DEMO).",
    price: 4990,
    ingredients: ["Tyo Clássico", "Batata frita", "Bebida"],
    addonGroups: [comboBebida, burgerExtras],
    image: "comboCasa",
    available: true,
    demo: true,
  },
];

export const featuredProducts = products.filter((p) => p.featured);

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}
