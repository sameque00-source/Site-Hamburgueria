import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHead } from "@/components/ui/PageHead";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="container">
      <PageHead kicker="Pedido" title="Finalizar" />
      <CheckoutForm />
    </div>
  );
}
