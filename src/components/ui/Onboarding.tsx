import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

const STORAGE_KEY = "juega-kino-onboarding-v1";

const STEPS = [
  {
    title: "El Kino en una frase",
    body: "Eliges 14 números del 1 al 25 y el sorteo extrae 14 bolillas sin reposición. Premias con 10 a 14 aciertos.",
  },
  {
    title: "Todas las combinaciones son iguales",
    body: "No hay combinación «mejor»: todas las de 14 números tienen 1/4.457.400 de chance. Cualquier estrategia que descubras es coincidencia estadística.",
  },
  {
    title: "Simulador y verificador",
    body: "Simula miles de sorteos con semilla reproducible o pega resultados reales y compara tu cartón. Para entender, no para «ganar».",
  },
  {
    title: "Pesos y estilo",
    body: "Explora el impacto (negligible) de los pesos de las bolillas y compara el «estilo» de tus cartones frente a series ganadoras.",
  },
];

/**
 * Onboarding de primera visita.
 *
 * Antes declaraba `role="dialog" aria-modal="true"` sin atrapar foco, sin Escape y sin
 * devolver el foco: fallaba WCAG 2.1.2 y 2.4.3. Ahora usa el `Dialog` del sistema, que
 * resuelve las tres. El contenido — COPY y nombres de botón — no cambia: son parte del
 * contrato de los tests.
 */
export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onClose={finish} title={current.title}>
      <p className="mt-3 text-body leading-relaxed text-ink-600">{current.body}</p>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Paso del tutorial">
          {STEPS.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={[
                "h-1 rounded-full transition-all duration-150 ease-smooth",
                i === step ? "w-6 bg-accent-fill" : "w-3 bg-line-strong",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!isLast && (
            <button
              type="button"
              className="text-small text-ink-600 underline-offset-4 hover:text-ink-900 hover:underline"
              onClick={finish}
            >
              Saltar
            </button>
          )}
          <Button
            variant={isLast ? "primary" : "secondary"}
            size="sm"
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          >
            {isLast ? "¡Entendido, comienza!" : "Siguiente"}
          </Button>
        </div>
      </div>

      {isLast && (
        <div className="mt-5 flex items-center justify-center gap-4 border-t border-line pt-4">
          <Link
            to="/generador"
            onClick={finish}
            className="text-small font-medium text-accent-text underline-offset-4 hover:underline"
          >
            Generar cartón
          </Link>
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
          <Link
            to="/simulador"
            onClick={finish}
            className="text-small font-medium text-accent-text underline-offset-4 hover:underline"
          >
            Simular
          </Link>
        </div>
      )}
    </Dialog>
  );
}