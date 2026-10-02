/**
 * DataTable — envoltura de tabla con el mismo esqueleto en todas las vistas.
 *
 * Existían cuatro tablas (Estadísticas ×2, Verificador ×2, Pesos, Comparador) cada una
 * con su propia copia de las clases del `<thead>`/`tr`. Eso garantiza que se desincronicen.
 * Aquí el esqueleto es uno y los tokens son los mismos.
 *
 * `numeric` alinea a la derecha y aplica mono con ancho de dígito estable: las tablas de
 * probabilidad son columnas de dígitos y alinearlas a la izquierda las vuelve ilegibles.
 */
import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function DataTable({ className = "", children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={["w-full text-small", className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Th({ numeric, className = "", children, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={[
        "border-b border-line-strong pb-2 pr-4 text-eyebrow font-medium uppercase text-ink-600",
        numeric ? "text-right" : "text-left",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  numeric,
  mono = true,
  className = "",
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean; mono?: boolean }) {
  return (
    <td
      className={[
        "border-b border-line py-2.5 pr-4 align-top",
        numeric ? "text-right" : "text-left",
        mono ? "tabular font-mono text-ink-800" : "font-sans text-ink-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </td>
  );
}

export function Tr({ className = "", children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={className} {...rest}>
      {children}
    </tr>
  );
}

/**
 * Estado de una celda. Glifo + texto siempre: el color acompaña, no informa solo
 * (design-tokens.md §6). Este es el patrón que faltaba en `ComparadorPage`, donde la
 * columna de métrica comunicaba ideal/aceptable/fuera únicamente por color.
 */
export type StatusLevel = "ideal" | "aceptable" | "fuera" | "neutro";

const STATUS: Record<StatusLevel, { text: string; glyph: string; label: string }> = {
  ideal: { text: "text-success", glyph: "✓", label: "ideal" },
  aceptable: { text: "text-warning", glyph: "●", label: "aceptable" },
  fuera: { text: "text-danger", glyph: "✗", label: "fuera" },
  neutro: { text: "text-ink-500", glyph: "—", label: "—" },
};

export function StatusCell({ level, value, showLabel = false }: { level: StatusLevel; value?: ReactNode; showLabel?: boolean }) {
  const s = STATUS[level];
  return (
    <span className={["inline-flex items-center gap-1.5 font-medium", s.text].join(" ")}>
      <span aria-hidden="true">{s.glyph}</span>
      {value ?? <span className="sr-only">{s.label}</span>}
      {showLabel && <span className="sr-only">{s.label}</span>}
    </span>
  );
}