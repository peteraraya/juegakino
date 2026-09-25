import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  KINO_TIP_DEFS,
  MIN_PRIZE_MATCHES,
  PICK_SIZE,
  analyzeDrawsAgainstTips,
  parseDrawResults,
  probabilityAtLeast,
  summarizeVerification,
  verifyCarton,
} from "@/domain";
import type { DrawParseResult } from "@/domain";
import { CartonSchema } from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";
import { useUiStore } from "@/stores/uiStore";
import { downloadTextFile, toCsv } from "@/lib/csv";

const SAMPLE_DRAWS = [
  "3 7 9 10 12 13 15 17 18 19 21 22 24 25",
  "1 2 5 8 9 11 12 14 15 16 18 20 23 24",
  "4 6 7 8 10 11 13 14 17 19 21 22 23 25",
].join("\n");

const PAGE_SIZE = 15;

type SortKey = "drawNumber" | "matches";

export function VerifierPage() {
  const carton = useKinoStore((s) => s.carton);
  const [raw, setRaw] = useState(SAMPLE_DRAWS);
  const [verified, setVerified] = useState<DrawParseResult | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("drawNumber");
  const [page, setPage] = useState(1);
  const pushToast = useUiStore((s) => s.pushToast);

  const cartonValido = carton.length > 0 && CartonSchema.safeParse(carton).success;

  const parsedNow = useMemo(() => parseDrawResults(raw), [raw]);

  const cartonCompleted = carton.length === PICK_SIZE;

  const runVerification = () => {
    if (carton.length === 0 || !cartonValido) return;
    const result = parseDrawResults(raw);
    if (result.draws.length === 0) return;
    setVerified(result);
  };

  const details = useMemo(
    () => verified && carton.length > 0 && cartonValido ? verifyCarton(carton, verified.draws) : [],
    [verified, carton, cartonValido],
  );
  const summary = useMemo(() => (details.length > 0 ? summarizeVerification(details) : null), [details]);
  const tipsStats = useMemo(
    () => (verified ? analyzeDrawsAgainstTips(verified.draws) : []),
    [verified],
  );

  const sortedDetails = useMemo(() => {
    const copy = [...details];
    if (sortKey === "matches") copy.sort((a, b) => b.matches - a.matches || a.drawNumber - b.drawNumber);
    else copy.sort((a, b) => a.drawNumber - b.drawNumber);
    return copy;
  }, [details, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedDetails.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageDetails = sortedDetails.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const exportCsv = () => {
    const rows = sortedDetails.map((d) => [
      d.drawNumber,
      d.numbers.join(" "),
      d.matches,
      `${(d.exactProbability * 100).toFixed(4)}%`,
      d.prize ? 1 : 0,
    ]);
    downloadTextFile(
      `kino-verificacion-carton-${carton.join("-")}.csv`,
      toCsv(["Sorteo", "Números", "Aciertos", "P(k) exacta %", "Premio (1=sí)"], rows),
    );
    pushToast("CSV de verificación exportado", "success");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-gray-900">Verificador de resultados reales</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pega aquí los <strong>resultados de sorteos reales del Kino</strong> (una línea por sorteo, 14 números) y la
          app verifica cuántos aciertos habría tenido tu cartón y si hubiera ganado premio.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card h-fit p-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-gray-900">Tu cartón</h2>
          {carton.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no tienes cartón. <Link to="/generador" className="font-medium text-kino-red-600 hover:underline">Genera uno aquí</Link>{" "}
              o marca 14 números en {14} bolillas.
            </p>
          ) : (
            <>
              <p className="font-mono text-sm text-gray-800">{carton.join(", ")}</p>
              {cartonValido && !cartonCompleted && (
                <p className="mt-1 text-xs text-amber-700">
                  Cartón incompleto ({carton.length}/14): la columna "premio" se evaluará solo con el cartón completo.
                </p>
              )}
              {!cartonValido && (
                <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                  Cartón inválido: tiene {carton.length} números y no cumple "14 distintos del 1..25". Límpialo y vuelve
                  a generarlo en <Link to="/generador" className="font-medium underline">Generador</Link>.
                </p>
              )}
            </>
          )}

          <h2 className="mb-2 mt-6 font-display text-lg font-semibold text-gray-900">Sorteos reales</h2>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-kino-red-600 focus:outline-none focus:ring-2 focus:ring-kino-red-600/30"
            placeholder={`14 números por línea, separados por espacio o coma:\n3 7 9 10 12 13 15 17 18 19 21 22 24 25`}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="btn-primary"
              onClick={runVerification}
              disabled={!cartonValido || carton.length === 0 || parsedNow.draws.length === 0}
            >
              Verificar ({parsedNow.draws.length} sorteos válidos)
            </button>
            <button className="btn-secondary" onClick={() => setRaw(SAMPLE_DRAWS)}>
              Usar resultados de ejemplo
            </button>
          </div>
          {carton.length === 0 && (
            <p className="mt-2 text-sm text-amber-700">
              Para verificar primero necesitas un cartón. <Link to="/generador" className="font-medium text-kino-red-600 hover:underline">Genera uno aquí</Link>{" "}
              o marca tus 14 números.
            </p>
          )}

          {parsedNow.errors.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-semibold">Líneas ignoradas ({parsedNow.errors.length}):</p>
              <ul className="mt-1 list-inside list-disc">
                {parsedNow.errors.slice(0, 5).map((e) => (
                  <li key={e.line}>
                    Línea {e.line}: {e.message}
                  </li>
                ))}
                {parsedNow.errors.length > 5 && <li>…y {parsedNow.errors.length - 5} más.</li>}
              </ul>
            </div>
          )}
        </section>

        <section className="card h-fit p-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Resultado</h2>

          {verified ? (
            carton.length === 0 ? (
              <p className="text-sm text-gray-500">
                Verificaste sorteos, pero no hay cartón guardado. <Link to="/generador" className="font-medium text-kino-red-600 hover:underline">Genera un cartón aquí</Link>{" "}
                y vuelve a la verificación.
              </p>
            ) : !cartonValido ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                Cartón inválido ({carton.length} números): valida exactamente 14 distintos del 1..25. Límpialo en{" "}
                <Link to="/generador" className="font-medium underline">Generador</Link> y vuelve a verificar.
              </p>
            ) : summary && (
              <>
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sorteos verificados</p>
                    <p className="mt-1 font-mono text-xl font-bold text-gray-900">{summary.totalDraws}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Premios (≥{MIN_PRIZE_MATCHES})</p>
                    <p className="mt-1 font-mono text-xl font-bold text-emerald-600">
                      {summary.prizeHits}
                      <span className="text-xs font-normal text-gray-500"> de {summary.totalDraws}</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Mejor acierto</p>
                    <p className="mt-1 font-mono text-xl font-bold text-gray-900">{summary.bestMatches}/14</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Promedio de aciertos</p>
                    <p className="mt-1 font-mono text-xl font-bold text-gray-900">
                      {summary.avgMatches.toFixed(2)}
                      <span className="text-xs font-normal text-gray-500"> (teórico {(PICK_SIZE * PICK_SIZE) / 25})</span>
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                  Por mero azar, en {summary.totalDraws} sorteos se esperan ≈{" "}
                  <strong className="font-mono">{summary.expectedPrizesByChance.toFixed(1)}</strong> premios de este tipo
                  (probabilidad {(probabilityAtLeast(MIN_PRIZE_MATCHES) * 100).toFixed(2)} % éxito). Compara con tus{" "}
                  {summary.prizeHits}.
                </div>

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-gray-900">Detalle por sorteo</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Ordenar sorteos"
                      value={sortKey}
                      onChange={(e) => {
                        setSortKey(e.target.value as SortKey);
                        setPage(1);
                      }}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-kino-red-600 focus:outline-none"
                    >
                      <option value="drawNumber">Por orden numérico</option>
                      <option value="matches">Por aciertos (mayor)</option>
                    </select>
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1 text-xs"
                      onClick={exportCsv}
                      disabled={sortedDetails.length === 0}
                    >
                      ⬇ CSV
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-2">#</th>
                        <th className="py-2 pr-2">Números</th>
                        <th className="py-2 pr-2 text-right">Aciertos</th>
                        <th className="py-2 pr-2 text-right">P(k)</th>
                        <th className="py-2">Premio</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {pageDetails.map((d) => (
                        <tr key={d.drawNumber} className={`border-b border-gray-100 ${d.prize ? "bg-emerald-50/60" : ""}`}>
                          <td className="py-1.5 pr-2 text-gray-500">{d.drawNumber}</td>
                          <td className="py-1.5 pr-2 text-xs text-gray-700">{d.numbers.join("·")}</td>
                          <td className="py-1.5 pr-2 text-right font-semibold">{d.matches}</td>
                          <td className="py-1.5 pr-2 text-right text-gray-500">{(d.exactProbability * 100).toFixed(3)}%</td>
                          <td className="py-1.5 text-right">
                            {d.prize ? <span className="font-bold text-emerald-700">SÍ 🎉</span> : <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1 text-xs"
                      disabled={safePage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ← Prev
                    </button>
                    <span className="font-mono text-xs text-gray-500">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1 text-xs"
                      disabled={safePage === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sig →
                    </button>
                  </div>
                )}

                {tipsStats.length > 0 && (
                  <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="font-display text-base font-semibold text-gray-900">
                      Los tips vs. esta historia real
                    </h4>
                    <p className="mt-1 text-xs text-gray-600">
                      % de sorteos que caen en cada nivel para cada condición de estilo sobre los {verified?.draws.length}{" "}
                      sorteos ingresados. Es una foto de la serie, no una predicción.
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-left uppercase tracking-wide text-gray-500">
                            <th className="py-1.5 pr-3">Condición</th>
                            <th className="py-1.5 pr-3 text-right">Ideal</th>
                            <th className="py-1.5 pr-3 text-right">Aceptable</th>
                            <th className="py-1.5 pr-3 text-right">Fuera</th>
                            <th className="py-1.5 text-right">Promedio</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono">
                          {tipsStats.map((t) => {
                            const def = KINO_TIP_DEFS.find((d) => d.key === t.key);
                            return (
                              <tr key={t.key} className="border-b border-gray-100">
                                <td className="py-1.5 pr-3 font-sans font-medium text-gray-800">{def?.label ?? t.key}</td>
                                <td className="py-1.5 pr-3 text-right text-emerald-600">{t.idealPct.toFixed(0)} %</td>
                                <td className="py-1.5 pr-3 text-right text-amber-600">{t.aceptablePct.toFixed(0)} %</td>
                                <td className="py-1.5 pr-3 text-right text-red-500">{t.fueraPct.toFixed(0)} %</td>
                                <td className="py-1.5 text-right text-gray-600">
                                  {t.averageMetric !== null ? t.averageMetric.toFixed(2) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <p className="text-sm text-gray-500">
              Presiona <strong>Verificar</strong> para comparar tu cartón contra los {parsedNow.draws.length} sorteos
              válidos ingresados.
            </p>
          )}

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <strong className="font-semibold">Juego responsable:</strong> esto solo verifica sorteos pasados. No
            aumenta tu probabilidad futura: cada sorteo es independiente y todas las combinaciones de 14 tienen la
            misma probabilidad de ganar.
          </div>
        </section>
      </div>
    </div>
  );
}