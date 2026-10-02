/**
 * Button — la única fuente de estilos de botón del producto.
 *
 * Reglas del sistema (design-tokens.md §11):
 *  - Un solo `primary` visible por vista. Donde había varios botones que parecían CTA,
 *    los no vigentes pasan a `secondary` o `ghost`.
 *  - Estados completos: default / hover / focus-visible / active / disabled / loading.
 *  - Foco visible en ring de acento (6.11:1 sobre paper), nunca `outline: none` suelto.
 *  - `sm` mide 32px y es solo para puntero fino; cualquier control de touch es `md` (44px).
 *
 * `buttonStyles()` se exporta aparte para poder aplicar los mismos estilos a un <Link>
 * de TanStack Router sin duplicar el criterio: el botón tiene UNA definición.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-fill text-white border border-transparent hover:bg-accent-fill-hover active:bg-accent-fill-hover",
  secondary:
    "bg-surface text-ink-800 border border-line-control hover:bg-surface-sunken active:bg-surface-sunken",
  ghost:
    "bg-transparent text-ink-700 border border-transparent hover:bg-surface-sunken active:bg-surface-sunken",
  danger: "bg-danger text-white border border-transparent hover:opacity-90 active:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-[32px] px-2.5 py-1 text-small gap-1.5",
  md: "min-h-[44px] px-4 py-2 text-body gap-2",
  lg: "min-h-[48px] px-5 py-2.5 text-body gap-2",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Clases de un botón. Usar en <Button> o directamente en un <Link>/<a>. */
export function buttonStyles({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyleOptions = {}): string {
  return [
    "inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium",
    "transition-colors duration-150 ease-smooth",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Estado de carga: deshabilita, marca aria-busy y muestra el spinner. */
  loading?: boolean;
  loadingLabel?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingLabel,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading && <Spinner />}
      <span className={loading ? "opacity-70" : undefined}>{loadingLabel ?? children}</span>
    </button>
  );
}

/** Spinner: un anillo de acento con animación del sistema (respeta reduced-motion). */
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}