import { Link } from "@tanstack/react-router";
import { KinoFacts } from "@/components/kino/KinoFacts";
import { Onboarding } from "@/components/ui/Onboarding";

export function HomePage() {
  return (
    <div className="space-y-10">
      <Onboarding />
      <section className="text-center">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-kino-red-600">
          Kino Simulator · Lotería de Concepción
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-gray-900 sm:text-5xl">
          Entiende el Kino con <span className="text-kino-red-600">números duros</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
          Eliges <strong className="text-gray-900">14 números del 1 al 25</strong>; el sorteo extrae 14 bolillas sin
          reposición y premia de 10 a 14 aciertos. Esta SPA pone matemática exacta y simulaciones masivas
          (Monte Carlo con semilla reproducible) al servicio de tu análisis — sin prometerte aciertos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/generador" className="btn-primary">
            Generar cartón
          </Link>
          <Link to="/simulador" className="btn-secondary">
            Simular sorteos
          </Link>
        </div>
      </section>

      <section>
        <KinoFacts />
      </section>

      <section className="card p-6 text-sm text-gray-700">
        <h2 className="mb-2 font-display text-xl font-semibold text-gray-900">¿Qué puedes hacer aquí?</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-gray-900">Generador</strong> — arma cartones con distintas estrategias (al azar,
            por frecuencias hot/cold, balanceado, con números bloqueados).
          </li>
          <li>
            <strong className="text-gray-900">Simulador</strong> — corre miles de sorteos en un Web Worker sin
            bloquear la UI, con progreso y cancelación; mismo resultado con la misma semilla.
          </li>
          <li>
            <strong className="text-gray-900">Estadísticas</strong> — probabilidades teóricas vs. frecuencias
            observadas, histograma de aciertos y aparición por número.
          </li>
          <li>
            <strong className="text-gray-900">Verificador</strong> — pega sorteos reales y mira cuántos aciertos habría
            tenido tu cartón, con análisis de los tips contra esa historia.
          </li>
          <li>
            <strong className="text-gray-900">Comparador</strong> — genera N cartones y los ordena por "estilo" de
            cartillas ganadoras; sin que eso cambie la probabilidad.
          </li>
          <li>
            <strong className="text-gray-900">Pesos</strong> — edita el peso de cada bolilla y contrasta frecuencias
            observadas contra el modelo uniforme y 1/peso.
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong className="font-semibold">Juego responsable:</strong> toda combinación de 14 números tiene la misma
        probabilidad de ganar. La simulación sirve para comprender riesgo y recompensa, nunca para "descubrir"
        números ganadores. Jugar tiene costo real.
      </section>
    </div>
  );
}