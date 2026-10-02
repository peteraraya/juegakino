/**
 * PageHeader — encabezado de página.
 *
 * Las seis páginas repetían literalmente el mismo bloque `<header><h1>…</h1><p>…</p></header>`
 * con las mismas clases. Seis copias del mismo layout es una regresión esperando: este es
 * el único lugar donde se resuelve.
 *
 * Siempre un solo `<h1>` por página, con el eyebrow como texto (no como heading), para que
 * la jerarquía de encabezados sea plana y predecible.
 */
import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Eyebrow: el contexto de la herramienta. tracking amplio, versalita. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Acciones a la derecha del título (filtros, exportar, etc.). */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={["flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className].filter(Boolean).join(" ")}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-eyebrow font-medium uppercase text-accent-text">{eyebrow}</p>
        )}
        <h1 className={["font-display text-h1 font-medium text-ink-900", eyebrow ? "mt-2" : ""].join(" ")}>
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-prose text-body text-ink-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}