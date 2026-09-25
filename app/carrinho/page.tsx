import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { PageHead } from "@/components/ui/PageHead";

export const metadata: Metadata = { title: "Carrinho" };

export default function CartPage() {
  return (
    <div className="container">
      <PageHead kicker="Pedido" title="Carrinho" />
      <CartView />
    </div>
  );
}
