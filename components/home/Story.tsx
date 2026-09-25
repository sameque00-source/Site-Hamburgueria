import { Picture } from "@/components/media/Picture";
import { RevealText } from "@/components/motion/RevealText";
import { pictures } from "@/config/media";
import styles from "./Story.module.css";

// Narrativa: a jornada do pedido (o que o site realmente faz).
// A história da casa entra quando a loja fornecer — nada inventado aqui.
// A coluna de mídia é o slot "story" (vídeo/food photography, Fase 3).
const chapters = [
  {
    n: "01",
    title: "Escolha",
    text: "O cardápio inteiro na palma da mão, organizado para decidir rápido.",
  },
  {
    n: "02",
    title: "Personalize",
    text: "Adicionais, quantidade e observação — do jeito que você quer comer.",
  },
  {
    n: "03",
    title: "Peça",
    text: "Pagamento e confirmação em poucos passos, com o pedido organizado para a loja.",
  },
];

export function Story() {
  return (
    <section id="a-casa" className={styles.section} aria-labelledby="story-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.mediaCol}>
          <div className={styles.media} data-reveal>
            <div className={styles.mediaInner} data-parallax="0.18">
              <Picture
                asset={pictures.storyIngredients}
                alt="Ingredientes de hambúrguer sobre a bancada: pão brioche, carne, cheddar, bacon, tomate, alface e cebola"
                variant="portrait"
                sizes="(max-width: 900px) 100vw, 45vw"
                className={styles.photo}
              />
              <span className={styles.note}>Imagem ilustrativa</span>
            </div>
          </div>
        </div>

        <div className={styles.copy}>
          <p className="label" data-reveal>
            <span className="label-index">04</span>A casa
          </p>
          <RevealText
            id="story-title"
            className={`display ${styles.title}`}
            lines={["Feito pra", "ser pedido."]}
            accentLast
            accentClassName={styles.accent}
          />
          <p className={styles.lede} data-reveal>
            Da vontade ao pedido confirmado, sem atrito. Cada etapa foi pensada para o celular — onde a fome
            acontece.
          </p>

          <ol className={styles.chapters}>
            {chapters.map((c) => (
              <li key={c.n} className={styles.chapter} data-reveal>
                <span className={styles.n}>{c.n}</span>
                <div>
                  <h3 className={`display ${styles.cTitle}`}>{c.title}</h3>
                  <p className={styles.cText}>{c.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
