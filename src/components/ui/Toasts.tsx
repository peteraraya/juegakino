/**
 * Toasts — notificaciones no intrusivas.
 *
 * Antes: el contenedor no tenía `role` ni `aria-live`, así que los lectores de pantalla
 * nunca anunciaban nada (WCAG 4.1.3). Y el cuerpo entero era un `<button>` de cierre:
 * hacer click en el mensaje para descartarlo es un affordance ambiguo y hace que el
 * texto se anuncie como si fuera un control.
 *
 * Ahora: `role="status"` + `aria-live="polite"` (o `alert` para errores), el mensaje es
 * texto plano y el cierre es un control separado con su propio nombre accesible.
 */
import { useUiStore } from "@/stores/uiStore";

const TONE = {
  success: {
    box: "border-success/30 bg-success-tint",
    text: "text-success-ink",
    glyph: "✓",
    label: "Éxito",
  },
  error: {
    box: "border-danger/30 bg-danger-tint",
    text: "text-danger-ink",
    glyph: "✕",
    label: "Error",
  },
  info: {
    box: "border-line bg-surface",
    text: "text-ink-800",
    glyph: "i",
    label: "Información",
  },
} as const;

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    // Polite en el contenedor: los errores individualizados suben a alert más abajo.
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const tone = TONE[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={[
              "pointer-events-auto flex animate-slide-up items-start gap-2.5 rounded-md border p-3",
              "text-small shadow-float",
              tone.box,
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-bold leading-none text-data",
                "bg-current/10",
                tone.text,
              ].join(" ")}
            >
              {tone.glyph}
            </span>

            <p className="min-w-0 flex-1 leading-snug">
              <span className="sr-only">{tone.label}: </span>
              {t.message}
            </p>

            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label={`Cerrar notificación: ${t.message}`}
              className={[
                // 44px en touch (md), 32px en puntero fino (sm): el token objetivo
                // táctil se cumple sin dejar un hueco enorme en el toast de escritorio.
                "-m-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md leading-none sm:h-8 sm:w-8",
                "text-ink-500 transition-colors duration-150 ease-smooth hover:bg-ink-900/5 hover:text-ink-800",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text",
              ].join(" ")}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}