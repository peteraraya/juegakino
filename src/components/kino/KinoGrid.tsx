/**
 * KinoGrid — la superficie de identidad del producto: las 25 bolillas.
 *
 * Referencia visual: el selector del Kino oficial (Lotería de Concepción). Bolita
 * circular, relleno sólido en rojo de marca cuando está marcada, número en sans
 * bold. Ese es el motivo por el que el número va en `font-sans font-semibold` y no
 * en mono: el mono resolvía la alineación de columnas de una grilla de celdas, y
 * en un círculo no hay columna que alinear — lo que dejaba era un set de chips
 * con aire, no 25 bolitas de lotería.
 *
 * Geometría: `h-* w-*` fijo por breakpoint, nunca `w-full`. Con `h-11 w-full` y
 * `rounded-full` las bolitas salían **ovales** en cuanto la columna pasaba de ~44px
 * (que es lo que pasa en desktop), y el cajón del cartón se leía como una tabla de
 * celdas. Además las pistas del grid son `auto` (`grid-cols-[repeat(5,auto)]` con
 * `justify-center`), así que la composición mide lo que miden las bolitas y se
 * centra sola: no depende del ancho del contenedor ni se desborda en móvil.
 *
 * Contraste (medido, ver /context/design-tokens.md §3 y §4):
 *  - Sin marcar: `surface` + `ink-800` = 14.42:1, borde `line-control` = 4.78:1.
 *  - Marcada: `accent-fill` + blanco = 4.85:1.
 *  - Bloqueada: `surface-sunken` + `ink-600` = 6.99:1. La versión anterior usaba
 *    `ink-500` sobre `surface-sunken` = **4.38:1**, por debajo de AA, y el propio
 *    documento de tokens lo marca como incorrecto en superficies teñidas.
 *
 * Estados: default / hover / focus-visible / active / disabled (cartón lleno).
 * El estado "no se puede marcar más" no se comunica solo por color: el `aria-label`
 * del grupo incluye el conteo, el texto de estado dice "✓ Cartón completo" y el
 * track de progreso se llena.
 */
import { PICK_SIZE } from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";

export function KinoGrid() {
  const carton = useKinoStore((s) => s.carton);
  const toggleBall = useKinoStore((s) => s.toggleBall);

  const remaining = PICK_SIZE - carton.length;
  const pct = Math.round((carton.length / PICK_SIZE) * 100);
  const complete = remaining === 0;

  return (
    <div className="mx-auto max-w-xs">
      {/* Estado del cartón. La lectura de "cuánto me falta" tiene que ser de un
          vistazo: antes eran dos palabras en los extremos opuestos de una card
          ancha, sin ninguna señal de proporción. El track de progreso reutiliza el
          patrón que el producto ya usa para la simulación, así que la respuesta a
          "¿voy bien?" se ve igual en toda la app. */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-eyebrow font-medium uppercase text-ink-600">Cartón</p>
          <p className="tabular font-mono text-small font-medium text-ink-900">
            {carton.length}
            <span className="text-ink-500">/{PICK_SIZE}</span>
          </p>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={PICK_SIZE}
          aria-valuenow={carton.length}
          aria-valuetext={`${carton.length} de ${PICK_SIZE} números marcados`}
          aria-label="Números marcados en el cartón"
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-strong"
        >
          <div
            className="h-full rounded-full bg-accent-fill transition-[width] duration-150 ease-smooth"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-2 text-small text-ink-600" aria-live="polite">
          {complete ? (
            <span className="font-medium text-success">✓ Cartón completo</span>
          ) : (
            <>
              Faltan{" "}
              <span className="tabular font-mono font-medium text-ink-900">{remaining}</span>{" "}
              {remaining === 1 ? "número" : "números"}
            </>
          )}
        </p>
      </div>

      <div
        role="group"
        aria-label={
          complete
            ? `Bolillas del 1 al 25. Cartón completo con ${PICK_SIZE} números.`
            : `Bolillas del 1 al 25. ${carton.length} de ${PICK_SIZE} números marcados.`
        }
        className="grid grid-cols-[repeat(5,auto)] justify-center gap-2 sm:gap-2.5"
      >
        {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => {
          const selected = carton.includes(n);
          const full = !selected && carton.length >= PICK_SIZE;

          return (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              // El nombre accesible contiene el dígito visible (WCAG 2.5.3 label in
              // name) pero lo descriptoriza: "7" solo, 25 veces en el grupo, no dice
              // qué es.
              aria-label={`Número ${n}`}
              disabled={full}
              onClick={() => toggleBall(n)}
              className={[
                "flex items-center justify-center rounded-full leading-none",
                "font-sans font-semibold",
                "h-11 w-11 text-body sm:h-12 sm:w-12 sm:text-h3 lg:h-14 lg:w-14",
                "transition-[background-color,border-color,color,transform] duration-150 ease-smooth",
                // El offset del anillo lleva el color de la superficie que lo rodea
                // (una Card es `surface`, no `paper`): con `ring-offset-paper` el
                // foco dejaba un halo más claro que la card en la que vive.
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                selected
                  ? "border border-transparent bg-accent-fill text-white hover:bg-accent-fill-hover active:scale-95"
                  : full
                    ? "cursor-not-allowed border border-line bg-surface-sunken text-ink-600"
                    : "border border-line-control bg-surface text-ink-800 hover:border-accent-text hover:bg-accent-tint hover:text-accent-text-strong active:scale-95",
              ].join(" ")}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
