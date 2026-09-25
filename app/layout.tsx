import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollFx } from "@/components/motion/ScrollFx";
import { InteractionLayer } from "@/components/motion/InteractionLayer";
import { ProductExpandProvider } from "@/components/product/ProductExpand";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Tyo Burguer em Flexal I, Cariacica — ES. Cardápio digital e pedidos online (versão de demonstração).";

export const metadata: Metadata = {
  title: {
    default: "Tyo Burguer — Flexal I, Cariacica",
    template: "%s · Tyo Burguer",
  },
  description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Tyo Burguer",
    title: "Tyo Burguer — Flexal I, Cariacica",
    description,
    // og:image entra na Fase 3 junto com os assets oficiais
  },
  robots: { index: false, follow: false }, // demo: não indexar
};

export const viewport: Viewport = {
  themeColor: "#0a0807",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${manrope.variable}`}>
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        {/* provider global: qualquer card/linha do carrinho abre a personalização */}
        <ProductExpandProvider>
          <Header />
          <main id="conteudo">{children}</main>
          <Footer />
        </ProductExpandProvider>
        <Toaster />
        <ScrollFx />
        <InteractionLayer />
      </body>
    </html>
  );
}
