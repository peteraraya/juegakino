import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InfoTip } from "@/components/ui/InfoTip";
import { EXPECTED_MATCHES, MIN_PRIZE_MATCHES, probabilityAtLeast, probabilityTable } from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";

/** Formatea un porcentaje: 4 decimales, salvo valores muy chicos (notación "1 en"). */
function formatPercent(pct: number): string {
  if (pct >= 0.01) return `${pct.toFixed(4)} %`;
  if (pct === 0) return "0 %";
  return `${pct.toExponential(3)} %`;
}

/** "1 en N" usando la probabilidad cruda (no el porcentaje). */
function formatOneIn(probability: number): string {
  if (probability <= 0) return "∞";
  return Math.round(1 / probability).toLocaleString("es-CL");
}

export function StatsPage() {
  const lastResult = useKinoStore((s) => s.lastResult);

  const data = useMemo(() => {
    const theoretical = probabilityTable();
    const hasHistogram = lastResult !== null && lastResult.matchHistogram.reduce((a, b) => a + b, 0) > 0;
    return theoretical.map((row, i) => ({
      aciertos: row.matches,
      probabilidad: row.probability,
      teorico: row.probability * 100,
      observado:
        hasHistogram && lastResult.draws > 0 ? ((lastResult.matchHistogram[i] ?? 0) / lastResult.draws) * 100 : null,
    }));
  }, [lastResult]);

  const hasHistogram = data.some((r) => r.observado !== null);
  const observedPrizePct = hasHistogram
    ? ((lastResult!.matchHistogram.slice(MIN_PRIZE_MATCHES).reduce((a, b) => a + b, 0) /
        lastResult!.draws) *
        100)
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-gray-900">Estadísticas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Distribución hipergeométrica teórica de aciertos por cartón (14 de 25). Si corres una simulación en{" "}
          <em>Simulador</em>, sus frecuencias observadas se superponen aquí y se acercan al teórico al aumentar los
          sorteos. Valor esperado: <strong className="font-mono">{EXPECTED_MATCHES}</strong> aciertos.
        </p>
      </header>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">P(K = k aciertos), en %</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="aciertos" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(4)} %`} labelFormatter={(label) => `${String(label)} aciertos`} />
              <Legend />
              <Bar dataKey="teorico" name="Teórico" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.aciertos}
                    fill={entry.aciertos >= MIN_PRIZE_MATCHES ? "#E4002B" : entry.aciertos >= EXPECTED_MATCHES ? "#F79AA5" : "#9ca3af"}
                  />
                ))}
              </Bar>
              {hasHistogram && lastResult && (
                <Bar dataKey="observado" name={`Observado (${lastResult.draws.toLocaleString("es-CL")} sorteos)`} fill="#1f2937" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          En rojo, categorías de premio (10–14 aciertos). Las barras oscuras son la simulación observada; al correr más
          sorteos se alinean con el teórico (ley de los grandes números).
        </p>
        {hasHistogram && observedPrizePct !== null && (
          <div className="mt-3 flex flex-wrap gap-3 rounded-lg bg-gray-50 p-3 text-sm">
            <p>
              <span className="text-gray-500">Premios observados reales:</span>{" "}
              <strong className="font-mono text-emerald-700">{observedPrizePct.toFixed(3)} %</strong>
            </p>
            <p>
              <span className="text-gray-500">Premios teóricos:</span>{" "}
              <strong className="font-mono text-kino-red-700">{(probabilityAtLeast(MIN_PRIZE_MATCHES) * 100).toFixed(3)} %</strong>
            </p>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Tabla de probabilidades</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4">Aciertos</th>
                <th className="py-2 pr-4">Probabilidad</th>
                <th className="py-2 pr-4">1 en N</th>
                <th className="py-2">Premio</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {data.map((row) => (
                <tr key={row.aciertos} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-semibold">{row.aciertos}</td>
                  <td className="py-2 pr-4">{formatPercent(row.teorico)}</td>
                  <td className="py-2 pr-4">{formatOneIn(row.probabilidad)}</td>
                  <td className="py-2">{row.aciertos >= MIN_PRIZE_MATCHES ? <span className="font-bold text-kino-red-600">Sí</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">
          Categorías de premio
          <InfoTip label="Premios reales">
            El Kino reparte su pozo según aciertos (10–14). Estos valores son referenciales y los fija Lotería en cada
            sorteo: un monto fijo no está garantizado por esta app.
          </InfoTip>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4">Aciertos</th>
                <th className="py-2 pr-4">Probabilidad</th>
                <th className="py-2 pr-4">1 en N</th>
                <th className="py-2 pr-4">Categoría</th>
                <th className="py-2">Referencia de premio</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {data
                .filter((row) => row.aciertos >= MIN_PRIZE_MATCHES)
                .map((row) => (
                  <tr key={row.aciertos} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-semibold">{row.aciertos}</td>
                    <td className="py-2 pr-4">{formatPercent(row.teorico)}</td>
                    <td className="py-2 pr-4">1 en {formatOneIn(row.probabilidad)}</td>
                    <td className="py-2 pr-4">{row.aciertos === 14 ? "Kino" : `Categoría ${15 - row.aciertos}`}</td>
                    <td className="py-2">{prizeReference(row.aciertos)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Jugando 14 números tu boleto cuesta lo que fije Lotería de Concepción; el pozo y el monto por categoría varían
          en cada sorteo según la recaudación.
        </p>
      </section>
    </div>
  );
}

function prizeReference(matches: number): string {
  switch (matches) {
    case 14:
      return "Jackpot (pozo acumulado)";
    case 13:
      return "Premio mayor de categoría (aprox. CLP 20.000.000+)";
    case 12:
      return "Premio intermedio (aprox. CLP 100.000–1.000.000)";
    case 11:
      return "Premio menor (aprox. CLP 20.000–100.000)";
    case 10:
      return "Premio base (aprox. ~CLP 10.000 o equivalente)";
    default:
      return "Sin premio";
  }
}