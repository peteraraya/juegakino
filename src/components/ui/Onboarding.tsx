import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "juega-kino-onboarding-v1";

const STEPS = [
  {
    title: "El Kino en una frase",
    body: "Eliges 14 números del 1..25 y el sorteo extrae 14 bolillas sin reposición. Premias con 10 a 14 aciertos.",
  },
  {
    title: "Todas las combinaciones son iguales",
    body: "No hay combinación 'mejor': todas las de 14 números tienen 1/4.457.400 de chance. Cualquier estrategia que descubras es coincidencia estadística.",
  },
  {
    title: "Simulador y verificador",
    body: "Simula miles de sorteos con semilla reproducible o pega resultados reales y compara tu cartón. Para entender, no para 'ganar'.",
  },
  {
    title: "Pesos y estilo",
    body: "Explora el impacto (negligible) de los pesos de las bolillas y compara el 'estilo' de tus cartones frente a series ganadoras.",
  },
];

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

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="card w-full max-w-md p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-kino-red-600">
          Bienvenido a juegaKino
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-gray-900">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{current.body}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${i === step ? "bg-kino-red-600" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="flex gap-2 text-sm">
            {!isLast && (
              <button type="button" className="text-xs text-gray-500 hover:underline" onClick={finish}>
                Saltar
              </button>
            )}
            <button
              type="button"
              className={isLast ? "btn-primary px-4 py-2 text-sm" : "btn-secondary px-4 py-2 text-sm"}
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            >
              {isLast ? "¡Entendido, comienza!" : "Siguiente"}
            </button>
          </div>
        </div>
        {isLast && (
          <div className="mt-4 flex justify-center gap-3 border-t border-gray-100 pt-4">
            <Link to="/generador" className="text-xs font-medium text-kino-red-600 hover:underline" onClick={finish}>
              Generar cartón
            </Link>
            <Link to="/simulador" className="text-xs font-medium text-kino-red-600 hover:underline" onClick={finish}>
              Simular
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}