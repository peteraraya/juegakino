import { useMemo, useState } from "react";
import {
  BALL_WEIGHT_MAX,
  BALL_WEIGHT_MIN,
  DEFAULT_BALL_WEIGHTS,
  analyzeBallEmpirics,
  parseDrawResults,
  relativeSelectionShare,
} from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";

const SAMPLE_DRAWS = [
  "3 7 9 10 12 13 15 17 18 19 21 22 24 25",
  "1 2 5 8 9 11 12 14 15 16 18 20 23 24",
  "4 6 7 8 10 11 13 14 17 19 21 22 23 25",
  "1 3 5 6 7 9 10 13 15 16 17 20 22 24",
  "2 4 5 6 8 9 11 12 14 16 18 19 21 23",
].join("\n");

/** Unidades para mostrar los kg sin decimales largos. */
const fmtKg = (kg: number) => `${kg.toFixed(2)} kg`;

export function BallWeightsPage() {
  const weights = useKinoStore((s) => s.ballWeights);
  const setBallWeight = useKinoStore((s) => s.setBallWeight);
  const resetBallWeights = useKinoStore((s) => s.resetBallWeights);
  const setUseBallWeights = useKinoStore((s) => s.setUseBallWeights);
  const useBallWeights = useKinoStore((s) => s.useBallWeights);
  const [drawn = SAMPLE_DRAWS, setDrawn] = useState(SAMPLE_DRAWS);

  const shares = useMemo(() => relativeSelectionShare(weights), [weights]);

  const parsed = useMemo(() => parseDrawResults(drawn), [drawn]);
  const empirics = useMemo(() => analyzeBallEmpirics(parsed.draws, weights), [parsed, weights]);
  const empiricalMaxDeviation = useMemo(
    () => (empirics.length > 0 ? Math.max(...empirics.map((r) => Math.abs(r.deviationPct))) : 0),
    [empirics],
  );

  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const edited = weights.some((w, i) => w !== DEFAULT_BALL_WEIGHTS[i]);
  const isUniform = new Set(weights).size === 1;

  const commit = (index: number, raw: string) => {
    const kg = Number(raw.replace(",", "."));
    if (!Number.isFinite(kg)) return;
    const clamped = Math.min(BALL_WEIGHT_MAX, Math.max(BALL_WEIGHT_MIN, kg));
    setBallWeight(index, clamped);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-gray-900">Pesos de las bolillas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Edita el peso (kg) de cada bola 1..25. El simulador puede usar estos pesos como sesgo (las más livianas
          suben levemente más fácil en una máquina de aire). La diferencia con los valores reales es tan chica que el
          efecto es negligible — esto es para observarlo, no para apostar con él.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={useBallWeights}
            onChange={(e) => setUseBallWeights(e.target.checked)}
            className="h-4 w-4 accent-kino-red-600"
          />
          <span className="font-medium">Aplicar pesos en el simulador</span>
        </label>
        <button className="btn-secondary" onClick={resetBallWeights} disabled={!edited}>
          Restaurar pesos de referencia
        </button>
        <span className="font-mono text-xs text-gray-500">
          {isUniform
            ? "Todos los pesos iguales (sin sesgo)"
            : `rango ${fmtKg(min)} – ${fmtKg(max)} (${((max / min - 1) * 100).toFixed(2)} % de diferencia)`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {weights.map((kg, i) => {
          const share = shares[i];
          // Sesgo relativo vs el valor que tendría sin sesgo (promedio 4 %).
          const deviation = (share - 1 / 25) / (1 / 25);
          const lighter = deviation > 0;
          return (
            <div key={i} className="card p-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-bold ${
                    useBallWeights
                      ? lighter
                        ? "bg-kino-red-50 text-kino-red-700"
                        : "bg-gray-100 text-gray-600"
                      : "bg-gray-50 text-gray-700"
                  }`}
                  title={useBallWeights ? "Participación teórica algo mayor (más liviana)" : undefined}
                >
                  {i + 1}
                </span>
                <label className="flex-1">
                  <span className="sr-only">Peso de la bola {i + 1} en kg</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={BALL_WEIGHT_MIN}
                    max={BALL_WEIGHT_MAX}
                    step={0.01}
                    key={`${i}-${kg}`}
                    defaultValue={kg.toFixed(2)}
                    onBlur={(e) => commit(i, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-right font-mono text-sm focus:border-kino-red-600 focus:outline-none focus:ring-2 focus:ring-kino-red-600/30"
                  />
                </label>
              </div>
              <p className="mt-1 text-right font-mono text-[10px] text-gray-400">kg</p>
              {useBallWeights && (
                <p className={`mt-0.5 text-right font-mono text-[10px] ${lighter ? "text-kino-red-600" : "text-gray-500"}`}>
                  {deviation >= 0 ? "+" : ""}
                  {(deviation * 100).toFixed(1)} % {lighter ? "más probable" : "menos probs."}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-kino-red-50 p-4 text-sm text-kino-red-900">
        <p className="font-semibold">Juego responsable:</p>
        <p>
          Aunque el sesgo físico existiera, con estos valores (diferencia ≈ 2 %) tu probabilidad de acertar 14 cambia
          en fracciones de 1 en 4.457.400. Ningún ajuste de pesos, estrategia ni cartón mejora de forma aprovechable la
          probabilidad de ganar: cada combinación sigue siendo equiprobable en el sorteo oficial.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-gray-900">
          Contrastar contra sorteos reales
          <span className="ml-2 rounded-full bg-kino-red-50 px-2 py-0.5 font-mono text-xs font-normal text-kino-red-700">
            empírico
          </span>
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Pega resultados reales (una línea por sorteo, 14 números) y compara cuánto se aleja la frecuencia observada de
          cada bola del modelo uniforme y del modelo 1/peso. Estadísticamente necesitas cientos de sorteos para ver algo
          que no sea ruido.
        </p>
        <textarea
          value={drawn}
          onChange={(e) => setDrawn(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder={`14 números por línea, separados por espacio o coma:\n3 7 9 10 12 13 15 17 18 19 21 22 24 25`}
          className="mt-3 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-kino-red-600 focus:outline-none focus:ring-2 focus:ring-kino-red-600/30"
        />
        {parsed.errors.length > 0 && (
          <p className="mt-2 text-xs text-amber-700">
            {parsed.errors.length} línea(s) ignorada(s) por formato inválido.
          </p>
        )}
        <button
          type="button"
          className="btn-secondary mt-2 px-3 py-1.5 text-xs"
          onClick={() => setDrawn(SAMPLE_DRAWS)}
        >
          Usar sorteos de ejemplo
        </button>

        {empirics.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <p>
                <span className="text-gray-500">Sorteos analizados:</span>{" "}
                <strong className="font-mono">{parsed.draws.length}</strong>
              </p>
              <p>
                <span className="text-gray-500">Máxima desviación vs uniforme:</span>{" "}
                <strong className="font-mono text-kino-red-700">{empiricalMaxDeviation.toFixed(2)} pp</strong>
              </p>
            </div>
            <div className="mt-3 max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3">Bola</th>
                    <th className="py-2 pr-3">Peso</th>
                    <th className="py-2 pr-3 text-right">Aparece</th>
                    <th className="py-2 pr-3 text-right">Observado</th>
                    <th className="py-2 pr-3 text-right">Uniforme</th>
                    <th className="py-2 pr-3 text-right">Modelo 1/peso</th>
                    <th className="py-2 text-right">Desv.</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {empirics.map((r) => (
                    <tr key={r.ball} className="border-b border-gray-100">
                      <td className="py-1.5 pr-3 font-semibold">{r.ball}</td>
                      <td className="py-1.5 pr-3 text-gray-500">{r.weightKg.toFixed(2)}</td>
                      <td className="py-1.5 pr-3 text-right">{r.observedCount}</td>
                      <td className="py-1.5 pr-3 text-right">{r.observedSharePct.toFixed(2)} %</td>
                      <td className="py-1.5 pr-3 text-right text-gray-500">{r.uniformSharePct.toFixed(2)} %</td>
                      <td className="py-1.5 pr-3 text-right text-gray-500">{r.weightedSharePct.toFixed(2)} %</td>
                      <td
                        className={`py-1.5 text-right font-semibold ${
                          Math.abs(r.deviationPct) > 2 ? "text-kino-red-700" : "text-gray-600"
                        }`}
                      >
                        {r.deviationPct >= 0 ? "+" : ""}
                        {r.deviationPct.toFixed(2)} pp
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}