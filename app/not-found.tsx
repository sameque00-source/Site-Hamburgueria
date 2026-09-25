import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHead } from "@/components/ui/PageHead";

export const metadata: Metadata = { title: "Página não encontrada" };

// 404 da marca (produto inexistente, link quebrado, rota inválida)
export default function NotFound() {
  return (
    <div className="container">
      <PageHead kicker="Erro 404" title="Não achamos essa página" />
      <p style={{ maxWidth: "46ch", color: "var(--cream-dim)", marginBottom: "var(--space-6)" }}>
        O link pode estar incompleto ou o item saiu do cardápio. Recomece por aqui:
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", paddingBottom: "var(--space-8)" }}>
        <Button href="/menu" size="lg">
          Ver cardápio
        </Button>
        <Button href="/" variant="ghost" size="lg">
          Voltar ao início
        </Button>
      </div>
    </div>
  );
}
