import { useMemo, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import {
  KINO_TIP_DEFS,
  countActive,
  evaluateKinoTips,
  generateCarton,
  kinoStyleScore,
} from "@/domain";
import type { KinoTipCondition } from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";
import { useUiStore } from "@/stores/uiStore";

const DEFAULT_COUNT = 200;

export function ComparadorPage() {
  const setCarton = useKinoStore((s) => s.setCarton);
  const pushToast = useUiStore((s) => s.pushToast);

  const [active, setActive] = useState<KinoTipCondition[]>(["suma", "pares", "primos", "unDigito", "separacion", "consecutivos"]);
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [runId, setRunId] = useState(1);

  const toggleTip = (key: KinoTipCondition) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const candidates = useMemo(() => {
    // Corremos la comparación por cada runId; determinista por semilla 0..N-1.
    const out: { carton: number[]; score: number; ideal: number; aceptable: number; fuera: number }[] = [];
    for (let i = 0; i < count; i++) {
      const carton = generateCarton(i);
      const s = kinoStyleScore(carton, active);
      out.push({ carton, ...s });
    }
    const sorted = [...out].sort((a, b) => b.score - a.score || a.carton.join().localeCompare(b.carton.join()));
    const top = sorted.slice(0, Math.min(5, count));
    return { sorted, top, avgScore: out.reduce((a, c) => a + c.score, 0) / out.length };
  }, [active, count, runId]);

  const best = candidates.top[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-gray-900">Comparador de cartones</h1>
        <p className="mt-1 text-sm text-gray-600">
          Genera N cartones al azar, los ordena por <strong>score de estilo</strong> (qué tan bien cumplen los tips de
          cartillas ganadoras) y muestra los mejores. El score <em>describe el estilo</em>, no aumenta tu probabilidad:
          todas las combinaciones de 14 son equiprobables.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit space-y-4 p-6">
          <div>
            <h2 className="font-display text-base font-semibold text-gray-900">
              Condiciones
              <InfoTip label="Score de estilo">
                Ideal = 2 pts, aceptable = 1 pt, fuera = 0. El score es el % del máximo posible (2 pts × condiciones
                activas). Es un resumen descriptivo del cartón, no una probabilidad de ganar.
              </InfoTip>
            </h2>
          </div>
          <div className="flex flex-col gap-1">
            {KINO_TIP_DEFS.map((tip) => (
              <label key={tip.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={active.includes(tip.key)}
                  onChange={() => toggleTip(tip.key)}
                  className="h-3.5 w-3.5 accent-kino-red-600"
                />
                <span className="font-medium text-gray-800">{tip.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label htmlFor="cantidad" className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Cartones a comparar ({count})
            </label>
            <input
              id="cantidad"
              type="number"
              min={10}
              max={2000}
              step={10}
              value={count}
              onChange={(e) => setCount(Math.min(2000, Math.max(10, Number(e.target.value) || DEFAULT_COUNT)))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-kino-red-600 focus:outline-none focus:ring-2 focus:ring-kino-red-600/30"
            />
          </div>

          <button className="w-full btn-primary" onClick={() => setRunId((r) => r + 1)}>
            Volver a comparar
          </button>
        </aside>

        <div className="space-y-6">
          {candidates.sorted.length === 0 ? (
            <p className="text-sm text-gray-500">No hay cartones para comparar.</p>
          ) : (
            <>
              <section className="card p-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Mejor del lote (estilo)</h2>
                {best && (
                  <div className="rounded-lg bg-kino-red-50 p-4">
                    <p className="font-mono text-lg font-bold text-gray-900">{best.carton.join(" · ")}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Score <strong className="font-mono">{best.score}</strong>/100 · {best.ideal} ideal, {best.aceptable}{" "}
                      aceptable, {best.fuera} fuera
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="btn-primary px-3 py-1.5 text-xs"
                        onClick={() => {
                          setCarton(best.carton);
                          pushToast("Cartón elegido y guardado", "success");
                        }}
                      >
                        Usar este cartón
                      </button>
                      <button
                        className="btn-secondary px-3 py-1.5 text-xs"
                        onClick={() => {
                          void navigator.clipboard.writeText(best.carton.join(" "));
                          pushToast("Cartón copiado al portapapeles", "success");
                        }}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-500">
                  Promedio del lote: <strong className="font-mono">{candidates.avgScore.toFixed(1)}</strong>/100 en{" "}
                  {countActive(active)} condiciones activas.
                </p>
              </section>

              <section className="card p-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Análisis por condición (top 5)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-4">#</th>
                        {KINO_TIP_DEFS.filter((t) => active.includes(t.key)).map((t) => (
                          <th key={t.key} className="py-2 pr-4">
                            {t.label}
                          </th>
                        ))}
                        <th className="py-2 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {candidates.top.map((c, i) => {
                        const evals = evaluateKinoTips(c.carton, active);
                        return (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-400">#{i + 1}</td>
                            {KINO_TIP_DEFS.filter((t) => active.includes(t.key)).map((t) => {
                              const r = evals.find((e) => e.key === t.key)!;
                              return (
                                <td key={t.key} className="py-2 pr-4">
                                  <span
                                    title={r.metric}
                                    className={
                                      r.status === "ideal"
                                        ? "text-emerald-600"
                                        : r.status === "aceptable"
                                          ? "text-amber-600"
                                          : "text-red-500"
                                    }
                                  >
                                    {r.metric}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="py-2 text-right font-semibold">{c.score}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}