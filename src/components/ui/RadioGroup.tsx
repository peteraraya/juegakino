/**
 * RadioGroup — para opciones mutuamente excluyentes.
 *
 * Existe porque el selector de estrategia de `GeneratorPage` estaba resuelto con cuatro
 * botones, pintando el activo como `btn-primary`. Eso producía cuatro CTAs visualmente
 * iguales en una columna donde solo una es la acción vigente: la jerarquía desaparece.
 * Cuatro opciones excluyentes son un radio group, no cuatro acciones.
 *
 * Implementado con `<input type="radio">` nativo dentro de `<fieldset>` en vez de
 * `role="radio"` + `tabIndex`: el navegador aporta la navegación con flechas, el
 * grupo de tabulación y el anuncio a lectores de pantalla sin ARIA a mano.
 */
import { useId } from "react";

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  /** Estado no disponible: se muestra deshabilitado con su motivo. */
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> {
  label: string;
  /** Descripción del grupo, asociada vía aria-describedby. */
  description?: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Slug estable para el `name` delfieldset; evita colisiones si hay dos grupos. */
  name: string;
  className?: string;
}

export function RadioGroup<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
  name,
  className = "",
}: RadioGroupProps<T>) {
  const uid = useId();
  const descId = `rg-${uid}-desc`;
  const groupName = `${name}-${uid}`;

  return (
    <fieldset aria-describedby={description ? descId : undefined} className={className}>
      <legend className="text-eyebrow font-medium uppercase text-ink-600">{label}</legend>
      {description && (
        <p id={descId} className="mt-1 text-small text-ink-600">
          {description}
        </p>
      )}

      <div className="mt-2.5 flex flex-col gap-1">
        {options.map((opt) => {
          const checked = opt.value === value;
          return (
            <label
              key={opt.value}
              className={[
                "group flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5",
                "transition-colors duration-150 ease-smooth",
                checked ? "border-accent-text bg-accent-tint" : "border-line bg-surface hover:bg-surface-sunken",
                opt.disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={checked}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent-fill disabled:cursor-not-allowed"
              />
              <span className="min-w-0 flex-1">
                <span
                  className={[
                    "block text-small font-medium leading-snug",
                    checked ? "text-accent-text-strong" : "text-ink-800",
                  ].join(" ")}
                >
                  {opt.label}
                </span>
                {opt.hint && <span className="mt-0.5 block text-small leading-snug text-ink-600">{opt.hint}</span>}
              </span>
              {checked && (
                <span aria-hidden="true" className="mt-0.5 text-small font-bold text-accent-text">
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}