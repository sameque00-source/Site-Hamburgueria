import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./Button.module.css";

type Common = {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  /** movimento magnético leve (só ponteiro fino — InteractionLayer) */
  magnetic?: boolean;
  /** esconde a seta (ex.: ações que não navegam) */
  plain?: boolean;
  children: ReactNode;
};

type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className">;

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", magnetic, plain, children } = props;
  const className = `${styles.btn} ${styles[variant]} ${styles[size]}`;
  const inner = (
    <>
      <span className={styles.label}>{children}</span>
      {!plain && (
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      )}
    </>
  );
  const data = {
    "data-cursor": "button",
    ...(magnetic ? { "data-magnetic": "" } : {}),
  };

  if (props.href !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { variant: _v, size: _s, magnetic: _m, plain: _p, children: _c, ...rest } = props;
    return (
      <Link className={className} {...data} {...rest}>
        {inner}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, size: _s, magnetic: _m, plain: _p, children: _c, href: _h, ...rest } = props;
  return (
    <button type="button" className={className} {...data} {...rest}>
      {inner}
    </button>
  );
}
