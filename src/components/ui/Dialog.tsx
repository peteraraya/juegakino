/**
 * Dialog — modal con focus trap, cierre por Escape y devolución del foco.
 *
 * El `Onboarding` anterior declaraba `role="dialog" aria-modal="true"` pero NO atrapaba
 * el foco, no cerraba con Escape y no devolvía el foco al disparador: fallaba WCAG 2.1.2
 * (sin teclado) y 2.4.3 (sin orden de foco). Declarar `aria-modal` sin cumplir el
 * comportamiento es peor que no declararlo.
 */
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Nombre accesible del diálogo. */
  title: string;
  /** Oculta el título visualmente pero lo mantiene como `aria-label` del dialog. */
  hideTitle?: boolean;
  children: ReactNode;
  /** Ancho máximo del panel. */
  size?: "md" | "lg";
  className?: string;
}

export function Dialog({ open, onClose, title, hideTitle, children, size = "md", className = "" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Devolver el foco al elemento que abrió el diálogo (WCAG 2.4.3).
  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
    } else {
      returnFocusRef.current?.focus?.();
      returnFocusRef.current = null;
    }
  }, [open]);

  // Escape cierra; Tab queda atrapado dentro del panel; el fondo no hace scroll.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Mover el foco al primer control al abrir, no al panel (WCAG 2.4.3).
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panel)?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(raf);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Scrim: es la única superficie del sistema con sombra fuerte (design-tokens.md §9). */}
      <div className="absolute inset-0 bg-ink-900/40 animate-fade-in" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[
          "relative w-full animate-slide-up rounded-lg border border-line bg-surface shadow-scrim",
          size === "lg" ? "max-w-2xl" : "max-w-md",
          className,
        ].join(" ")}
      >
        <h2
          id={titleId}
          className={hideTitle ? "sr-only" : "font-display text-h3 font-medium text-ink-900"}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}