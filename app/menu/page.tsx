import type { Metadata } from "next";
import { MenuView } from "@/components/menu/MenuView";
import { PageHead } from "@/components/ui/PageHead";

export const metadata: Metadata = {
  title: "Cardápio",
  description: "Cardápio digital da Tyo Burguer — escolha, personalize e peça (demonstração).",
};

export default function MenuPage() {
  return (
    <>
      <div className="container">
        <PageHead kicker="Cardápio · Demo" title="Cardápio">
          Toque em um item para personalizar e adicionar ao pedido.
        </PageHead>
      </div>
      <MenuView />
    </>
  );
}
