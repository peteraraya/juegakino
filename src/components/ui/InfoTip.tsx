/**
 * InfoTip — ayuda contextual que no ocupa layout.
 *
 * Antes: trigger de 16×16px (h-4 w-4), por debajo del mínimo táctil de 44px; solo
 * respondía a click (nada de hover ni de teclado); no cerraba con Escape. Tres fallas.
 *
 * Ahora: un gesto por intención, que es lo que evita el bug de "abre y cierra en el
 * mismo clic":
 *
 *   Puntero con hover → hover previsualiza, el click deja el tip "fijado" (sobrevive
 *                      al mouseleave) y el siguiente click lo suelta.
 *   Táctil (sin hover)→ el click alterna, que es el único gesto disponible.
 *   Teclado          → el foco abre; Escape cierra y devuelve el foco al trigger.
 *
 * El panel se anuncia como `tooltip` y se conecta con `aria-describedby`, que es lo
 * que un lector de pantalla necesita para ocribir el contenido asociado al botón.
 */
import { useEffect, useId, useRef, useState } from "react";

/**
 * ¿El puntero principal puede hacer hover? Sin esto, el mismo `click` tendría que
 * abrir y cerrar según el dispositivo, y con hover disponible el click alternando
 * cancelaría el hover en el mismo gesto.
 */
function useCanHover(): boolean {
  // `false` por defecto es lo conservador: si no podemos saber, tratamos el click
  // como el gesto principal.
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(hover: hover)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return canHover;
}

export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const canHover = useCanHover();
  /** Estado del gesto explícito: pin en desktop, alternancia en táctil. */
  const [pinned, setPinned] = useState(false);
  /** Hover o foco: abierto "de pasada". */
  const [peek, setPeek] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  const open = canHover ? pinned || peek : pinned;

  // Escape cierra y devuelve el foco al trigger si el foco estaba en otra parte.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(false);
        setPeek(false);
        wrapRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={`Ayuda: ${label}`}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setPinned((p) => !p)}
        onMouseEnter={() => canHover && setPeek(true)}
        onMouseLeave={() => canHover && setPeek(false)}
        onFocus={() => setPeek(true)}
        onBlur={() => setPeek(false)}
        className={[
          // 28px de caja con padding hit: el glyph sigue siendo de 16px.
          "-m-1.5 flex h-7 w-7 items-center justify-center rounded-full",
          "text-accent-text transition-colors duration-150 ease-smooth hover:bg-accent-tint",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className="flex h-4 w-4 items-center justify-center rounded-full border border-accent-text/40 bg-accent-tint font-mono font-semibold leading-none text-data"
        >
          ?
        </span>
      </button>

      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-64 max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 animate-fade-in rounded-md border border-line bg-surface p-3 text-small leading-snug text-ink-700 shadow-float"
        >
          {children}
        </span>
      )}
    </span>
  );
}