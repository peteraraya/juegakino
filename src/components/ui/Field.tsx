/**
 * Field — inputs, textarea, select, checkbox y el patrón de nota de estado.
 *
 * Reglas:
 *  - Label real, nunca placeholder como única etiqueta.
 *  - El error se comunica con ícono + texto, NUNCA solo con borde rojo (WCAG 1.4.1).
 *  - `aria-describedby` apunta al helper o al error; `aria-invalid` marca el inválido.
 *  - Borde `line-control` (4.78:1) + relleno `surface-sunken`: el borde es la única pista
 *    de que el elemento es un control, así que tiene que cumplir 3:1 (design-tokens.md §4).
 */
import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const CONTROL_BASE = [
  "w-full rounded-md border border-line-control bg-surface-sunken px-3 py-2 font-sans text-body text-ink-900",
  "placeholder:text-ink-500",
  "transition-colors duration-150 ease-smooth",
  "focus-visible:outline-none focus-visible:border-accent-text focus-visible:ring-2 focus-visible:ring-accent-text/25",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

/* ------------------------------------------------------------------------------------ */
/* Field (envoltorio)                                                                  */
/* ------------------------------------------------------------------------------------ */

export interface FieldProps {
  label: string;
  /** Texto de apoyo bajo el control. Se anuncia con el control. */
  hint?: ReactNode;
  /** Mensaje de error. Presente = inválido. Se anuncia con el control. */
  error?: ReactNode;
  /** Oculta visualmente el label pero lo mantiene para lectores de pantalla. */
  hideLabel?: boolean;
  children: (ids: { controlId: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}

/**
 * Wrapper con label + hint/error. Usa render prop para que el control reciba los ids
 * correctos sin que el llamador los wiree a mano (y los olvide).
 */
export function Field({ label, hint, error, hideLabel, children, className = "" }: FieldProps) {
  const uid = useId();
  const controlId = `f-${uid}`;
  const hintId = `f-${uid}-hint`;
  const errorId = `f-${uid}-err`;

  // Con error presente, el error reemplaza al hint en la descripción: anunciar dos
  // mensajes contradictorios es peor que anunciar solo el que importa.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={controlId}
        className={hideLabel ? "sr-only" : "mb-1.5 block text-eyebrow font-medium uppercase text-ink-600"}
      >
        {label}
      </label>
      {children({ controlId, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-small text-danger">
          <span aria-hidden="true" className="font-bold leading-5">
            ✕
          </span>
          <span>{error}</span>
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1.5 text-small text-ink-600">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------------ */
/* Controles                                                                           */
/* ------------------------------------------------------------------------------------ */

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  mono?: boolean;
  invalid?: boolean;
  inputSize?: "md" | "sm";
  /** Se declara explícitamente: `className` está omitido de las attrs nativas. */
  className?: string;
}

export function TextInput({ mono, invalid, inputSize = "md", className = "", ...rest }: TextInputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={[
        CONTROL_BASE,
        mono ? "font-mono tabular text-small" : "",
        inputSize === "sm" ? "px-2.5 py-1.5" : "",
        invalid ? "border-danger" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  mono?: boolean;
  className?: string;
}

export function TextArea({ mono = true, className = "", ...rest }: TextAreaProps) {
  return <textarea className={[CONTROL_BASE, mono ? "font-mono text-small" : "", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  inputSize?: "md" | "sm";
  className?: string;
}

export function Select({ inputSize = "md", className = "", ...rest }: SelectProps) {
  return (
    <select
      className={[
        CONTROL_BASE,
        "cursor-pointer pr-8",
        inputSize === "sm" ? "px-2.5 py-1.5 text-small" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------------------------ */
/* Checkbox                                                                            */
/* ------------------------------------------------------------------------------------ */

export interface CheckboxRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  /** Descripción opcional; se anuncia con la opción. */
  hint?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Fila de checkbox. Mínimo 44px de alto para target táctil, y el `<label>` envuelve todo,
 * de modo que el texto completo es área de click (el E2E usa `label:has-text(...) input`).
 */
export function CheckboxRow({ checked, onChange, label, hint, disabled, className = "" }: CheckboxRowProps) {
  return (
    <label
      className={[
        "flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5",
        "transition-colors duration-150 ease-smooth hover:bg-surface-sunken",
        disabled ? "cursor-not-allowed opacity-60" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent-fill"
      />
      <span className="min-w-0">
        <span className="block text-small font-medium leading-snug text-ink-800">{label}</span>
        {hint && <span className="mt-0.5 block text-small leading-snug text-ink-600">{hint}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------------------------ */
/* Notas de estado                                                                      */
/* ------------------------------------------------------------------------------------ */

export type NoteTone = "info" | "warning" | "danger" | "success" | "accent";

const NOTE_TONES: Record<NoteTone, { box: string; text: string; glyph: string }> = {
  info: { box: "bg-info-tint text-info-ink", text: "text-info", glyph: "i" },
  warning: { box: "bg-warning-tint text-warning-ink", text: "text-warning", glyph: "!" },
  danger: { box: "bg-danger-tint text-danger-ink", text: "text-danger", glyph: "✕" },
  success: { box: "bg-success-tint text-success-ink", text: "text-success", glyph: "✓" },
  accent: { box: "bg-accent-tint text-accent-text-strong", text: "text-accent-text", glyph: "◆" },
};

/**
 * Nota inline. Cada tono trae glifo + texto: el color acompaña, nunca informa solo.
 * Este componente reemplaza las ~12 cajas amber/red/emerald escritas a mano que había.
 */
export function Note({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: NoteTone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const t = NOTE_TONES[tone];
  return (
    <div
      className={["flex items-start gap-2.5 rounded-md p-3.5 text-small", t.box, className].filter(Boolean).join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-bold leading-none",
          "bg-current/10",
          t.text,
          "text-data",
        ].join(" ")}
      >
        {t.glyph}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}

/** Estado vacío: explica qué falta y qué hacer a continuación, nunca un espacio en blanco. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-line-strong bg-surface-sunken px-5 py-8 text-center">
      <p className="font-display text-h3 text-ink-800">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-prose text-small text-ink-600">{children}</p>}
      {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
    </div>
  );
}