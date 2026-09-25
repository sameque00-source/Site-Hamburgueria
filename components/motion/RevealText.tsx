import type { ElementType, ReactNode } from "react";

// Texto revelado linha a linha (máscara). A animação é feita pelo
// ScrollFx controller — este componente só produz a marcação.
export function RevealText({
  as: Tag = "h2",
  lines,
  className,
  id,
  accentLast = false,
  accentClassName,
}: {
  as?: ElementType;
  lines: ReactNode[];
  className?: string;
  id?: string;
  accentLast?: boolean;
  accentClassName?: string;
}) {
  return (
    <Tag id={id} className={className} data-reveal-lines>
      {lines.map((line, i) => (
        <span
          key={i}
          className={`mask-line ${accentLast && i === lines.length - 1 ? (accentClassName ?? "") : ""}`}
        >
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
