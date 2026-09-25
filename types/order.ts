import type { Cents } from "./menu";

export type PaymentMethod = "pix" | "cash" | "card";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELED";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "RECEIVED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELED";

export type Customer = {
  name: string;
  phone: string; // só dígitos
};

export type Delivery =
  | {
      mode: "delivery";
      street: string;
      number: string;
      complement: string;
      /** ponto de referência (opcional) */
      reference: string;
      neighborhood: string;
      city: string;
      cep: string; // só dígitos
    }
  | { mode: "pickup" };

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: Cents; // produto + adicionais
  addons: { id: string; name: string; price: Cents }[];
  note: string;
  lineTotal: Cents;
};

export type Payment = {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: "demo-pix" | "offline";
  amount: Cents;
  /** PIX: conteúdo do QR / copia-e-cola (DEMO: não é um PIX válido) */
  qrPayload?: string;
  expiresAt?: string;
  paidAt?: string;
  /** dinheiro: troco para */
  changeFor?: Cents;
  /**
   * provedor confirmou pagamento de um pedido já cancelado (só possível com
   * provedor real, se o cancelamento remoto falhar) → exige estorno manual
   */
  refundRequired?: boolean;
};

export type Order = {
  id: string; // TYO-XXXXXX (ver newOrderId)
  customer: Customer;
  items: OrderItem[];
  delivery: Delivery;
  payment: Payment;
  totals: { subtotal: Cents; deliveryFee: Cents; total: Cents };
  note: string;
  status: OrderStatus;
  /** histórico de status (mais antigo primeiro) */
  timeline: { status: OrderStatus; at: string }[];
  createdAt: string;
  demo: boolean;
};

/** payload enviado pelo checkout — preços NUNCA vêm do cliente */
export type CheckoutInput = {
  customer: Customer;
  delivery: Delivery;
  paymentMethod: PaymentMethod;
  changeFor?: Cents;
  note: string;
  lines: { productId: string; qty: number; addonIds: string[]; note: string }[];
};
