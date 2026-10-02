/**
 * Card — superficie base del producto.
 *
 * La separación de `surface` sobre `paper` es de solo 1.05:1: el fondo NO separa nada,
 * lo separa el borde de un pelo. Por eso toda Card lleva `border-line`. Una Card sin
 * borde y sin `sunken` es un error de layout, no un estilo.
 *
 * `sunken` (fondo surface-sunken, sin borde) es para wells: progreso, filas alternas,
 * zonas secundarias — donde el contenido debe retroceder.
 */
import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "sunken";
export type CardPadding = "none" | "sm" | "md" | "lg";

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

export function Card({ variant = "default", padding = "lg", className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={[
        variant === "sunken" ? "bg-surface-sunken" : "border border-line bg-surface",
        "rounded-lg",
        PADDING[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Título de sección dentro de una Card. Un solo nivel h2 por Card para que la
 * jerarquía de encabezados sea plana y predecible (WCAG: orden de encabezados sin saltos).
 */
export function CardTitle({ className = "", children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={["font-display text-h3 font-medium text-ink-900", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </h2>
  );
}

/** Grupo label/valor para los bloques de dato (los "KinoFacts" y las stat cards). */
export function StatBlock({
  label,
  value,
  hint,
  tone = "default",
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** `accent` solo para el dato que es la respuesta a la pregunta de la vista. */
  tone?: "default" | "accent" | "success";
  className?: string;
}) {
  const valueTone =
    tone === "accent" ? "text-accent-text" : tone === "success" ? "text-success" : "text-ink-900";
  return (
    <div className={["bg-surface-sunken p-4", className].filter(Boolean).join(" ")}>
      <p className="text-eyebrow font-medium uppercase text-ink-600">{label}</p>
      <p className={["tabular mt-1.5 font-mono text-h2 font-medium", valueTone].join(" ")}>{value}</p>
      {hint && <p className="mt-1 text-small text-ink-600">{hint}</p>}
    </div>
  );
}

/** Chip / badge. Un solo nivel: no se usan para jerarquía, solo para contexto. */
export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: "neutral" | "accent" | "gold";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-sunken text-ink-700",
    accent: "bg-accent-tint text-accent-text-strong",
    // gold es exclusivo de premio/pozo (design-tokens.md §7).
    gold: "bg-navy-900 text-gold-300",
  } as const;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-eyebrow font-medium",
        tones[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}