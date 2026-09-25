import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "@/components/order/OrderView";
import { PageHead } from "@/components/ui/PageHead";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false }, // página pessoal do pedido
};

export default function OrderPage() {
  return (
    <div className="container">
      <PageHead kicker="Pedido" title="Seu pedido" />
      {/* useSearchParams exige Suspense no App Router */}
      <Suspense fallback={<div style={{ minHeight: "50vh" }} aria-busy="true" />}>
        <OrderView />
      </Suspense>
    </div>
  );
}
