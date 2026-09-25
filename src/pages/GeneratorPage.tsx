import { useEffect, useMemo, useState } from "react";
import { KinoGrid } from "@/components/kino/KinoGrid";
import { InfoTip } from "@/components/ui/InfoTip";
import {
  evaluateKinoTips,
  generateCartonByStrategy,
  generateCartonWithKinoTips,
  kinoTipsMetrics,
  normalizeSeed,
  randomSeed,
} from "@/domain";
import type { GenerationStrategy, KinoTipCondition } from "@/domain";
import { KINO_TIP_DEFS } from "@/domain";
import { useSimulation } from "@/hooks/useSimulation";
import { useKinoStore } from "@/stores/kinoStore";
import { useUiStore } from "@/stores/uiStore";

const STRATEGIES: { id: GenerationStrategy; label: string; hint: string }[] = [
  { id: "random", label: "Aleatorio", hint: "Sorteo puro del PRNG" },
  { id: "hot", label: "Hot (frecuentes)", hint: "Usa los nº más sorteado - necesita frecuencias" },
  { id: "cold", label: "Cold (fríos)", hint: "Usa los nº menos sorteado - necesita frecuencias" },
  { id: "balanced", label: "Balanceado", hint: "2 por década (1-25)" },
];

const FREQ_DRAWS = 200_000;

export function GeneratorPage() {
  const carton = useKinoStore((s) => s.carton);
  const setCarton = useKinoStore((s) => s.setCarton);
  const strategy = useKinoStore((s) => s.strategy);
  const setStrategy = useKinoStore((s) => s.setStrategy);
  const numberFrequency = useKinoStore((s) => s.numberFrequency);
  const setNumberFrequency = useKinoStore((s) => s.setNumberFrequency);

  const seed = useMemo(() => randomSeed(), []);
  // Cada clic de "Generar cartón" usa una semilla nueva → cartones distintos.
  const [generationSeed, setGenerationSeed] = useState(seed);
  const [tipsActive, setTipsActive] = useState<KinoTipCondition[]>([]);
  const [tipsBusy, setTipsBusy] = useState(false);
  const pushToast = useUiStore((s) => s.pushToast);
  const needsFreq = strategy === "hot" || strategy === "cold";
  const freqReady = numberFrequency !== null;
  const { running, progress, result, run, cancel } = useSimulation();

  const tipsMetrics = useMemo(() => (carton.length > 0 ? kinoTipsMetrics(carton) : null), [carton]);
  const tipsEvaluation = useMemo(
    () => (carton.length > 0 ? evaluateKinoTips(carton, tipsActive) : []),
    [carton, tipsActive],
  );

  useEffect(() => {
    // hot/cold necesitan frecuencias: si no hay, una simulación breve las genera.
    if (needsFreq && !freqReady && !running) {
      run({ seed: normalizeSeed(seed), draws: FREQ_DRAWS, prizeThreshold: 14 });
    }
  }, [needsFreq, freqReady, running, seed, run]);

  useEffect(() => {
    if (result && result.numberFrequency && !freqReady) {
      setNumberFrequency(result.numberFrequency);
    }
  }, [result, freqReady, setNumberFrequency]);

  const generate = () => {
    if (needsFreq && !freqReady) return;
    const s = randomSeed();
    setGenerationSeed(s);
    setCarton(generateCartonByStrategy(strategy, s, numberFrequency ?? []));
    pushToast(`Cartón generado (semilla ${s})`, "success");
  };

  const toggleTip = (key: KinoTipCondition) => {
    setTipsActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const generateWithTips = () => {
    if (tipsActive.length === 0) return;
    setTipsBusy(true);
    // Deja pintar el estado de espera antes de la búsqueda síncrona.
    setTimeout(() => {
      const s = randomSeed();
      setGenerationSeed(s);
      const { carton } = generateCartonWithKinoTips(s, tipsActive);
      if (carton) {
        setCarton(carton);
        pushToast(`Cartón con condiciones generado (semilla ${s})`, "success");
      } else {
        pushToast("No se encontró un cartón que cumpla esas condiciones", "error");
      }
      setTipsBusy(false);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-gray-900">Generador de cartones</h1>
        <p className="mt-1 text-sm text-gray-600">
          Marca 14 números o genera uno con semilla reproducible. Ninguna estrategia mejora tu probabilidad: todas las
          combinaciones son equiprobables.
          <InfoTip label="Equiprobabilidad">
            Cada combinación de 14 números del 1..25 tiene la misma probabilidad: 1/4.457.400. hot/cold y balanceado
            solo reorganizan tu cartón para que se parezca a series pasadas; no cambian su chance.
          </InfoTip>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card p-6">
          <KinoGrid />
        </div>

        <aside className="card h-fit p-6">
          <h2 className="font-display text-lg font-semibold text-gray-900">Estrategia</h2>
          <p className="mt-1 font-mono text-xs text-gray-500">Última semilla usada: {generationSeed}</p>
          <p className="mt-1 text-xs text-gray-400">Cada "Generar cartón" usa una semilla aleatoria nueva.</p>

          <div className="mt-4 flex flex-col gap-2">
            {STRATEGIES.map((s) => (
              <div key={s.id}>
                <button
                  className={strategy === s.id ? "btn-primary w-full" : "btn-secondary w-full"}
                  onClick={() => setStrategy(s.id)}
                >
                  {s.label}
                </button>
                {strategy === s.id && <p className="mt-1 px-1 text-xs text-gray-500">{s.hint}</p>}
              </div>
            ))}
          </div>

          {needsFreq && !freqReady && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              <p className="mb-1 font-medium text-gray-700">
                {running ? `Obteniendo frecuencias… ${progress ?? 0}%` : "Sin frecuencias aún"}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-kino-red-600 transition-all" style={{ width: `${progress ?? 0}%` }} />
              </div>
              <p className="mt-2">Corriendo {FREQ_DRAWS.toLocaleString("es-CL")} sorteos (semilla {seed}) para saber qué números fueron más/menos sorteado.</p>
              {running && (
                <button className="mt-2 text-kino-red-600 hover:underline" onClick={cancel}>
                  Cancelar
                </button>
              )}
            </div>
          )}

          <button
            className="mt-4 w-full btn-primary"
            onClick={generate}
            disabled={(needsFreq && !freqReady) || running}
          >
            Generar cartón
          </button>
          <button className="mt-2 w-full btn-secondary" onClick={() => setCarton([])} disabled={carton.length === 0}>
            Limpiar ({14 - carton.length} restantes)
          </button>

          <h3 className="mt-6 font-display text-base font-semibold text-gray-900">Condiciones (tips del Kino)</h3>
          <p className="mt-1 text-[11px] leading-tight text-gray-500">
            Genera cartones que cumplan los criterios del análisis empírico (1 y 25 fijos, separación, rachas, suma,
            pares, primos, un dígito). No alteran la probabilidad: todas las combinaciones son equiprobables.
          </p>
          <div className="mt-3 flex flex-col gap-1">
            {KINO_TIP_DEFS.map((tip) => (
              <label
                key={tip.key}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={tipsActive.includes(tip.key)}
                  onChange={() => toggleTip(tip.key)}
                  className="h-3.5 w-3.5 accent-kino-red-600"
                />
                <span className="font-medium text-gray-800">{tip.shortLabel}</span>
                <span className="sr-only">{tip.description}</span>
              </label>
            ))}
          </div>
          <button
            className="mt-3 w-full btn-primary"
            onClick={generateWithTips}
            disabled={tipsActive.length === 0 || tipsBusy || running}
          >
            {tipsBusy ? "Buscando cartón…" : `Generar con ${tipsActive.length || "0"} condición(es)`}
          </button>

          {carton.length > 0 && tipsMetrics && (
            <div className="mt-5">
              <h3 className="font-display text-base font-semibold text-gray-900">Diagnóstico del cartón</h3>
              <dl className="mt-2 space-y-1 font-mono text-xs text-gray-700">
                <div className="flex justify-between">
                  <dt>Separación máx.</dt>
                  <dd>{tipsMetrics.maxSeparacion}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Consecutivos máx.</dt>
                  <dd>{tipsMetrics.maxConsecutivos}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Suma</dt>
                  <dd>{tipsMetrics.suma}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Pares / Impares</dt>
                  <dd>
                    {tipsMetrics.pares} / {14 - tipsMetrics.pares}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Primos</dt>
                  <dd>{tipsMetrics.primos}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>1 dígito</dt>
                  <dd>{tipsMetrics.unDigito}</dd>
                </div>
              </dl>
              {tipsEvaluation.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px]">
                  {tipsEvaluation.map((r) => (
                    <li key={r.key} className="flex items-center justify-between gap-2">
                      <span className="text-gray-600">{KINO_TIP_DEFS.find((d) => d.key === r.key)?.shortLabel}</span>
                      {r.status === "ideal" ? (
                        <span className="font-semibold text-emerald-600">✓ ideal</span>
                      ) : r.status === "aceptable" ? (
                        <span className="font-semibold text-amber-600">● aceptable</span>
                      ) : (
                        <span className="font-semibold text-kino-red-600">✗ fuera</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] leading-tight text-gray-400">
                Solo se listan condiciones activas. Los valores se muestran para el cartón actual.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}