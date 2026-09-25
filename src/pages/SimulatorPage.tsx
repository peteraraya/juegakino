import { useEffect, useMemo, useState } from "react";
import { KinoGrid } from "@/components/kino/KinoGrid";
import { InfoTip } from "@/components/ui/InfoTip";
import { EXPECTED_MATCHES, MIN_PRIZE_MATCHES, PICK_SIZE, probabilityAtLeast, randomSeed } from "@/domain";
import { useSimulation } from "@/hooks/useSimulation";
import { useKinoStore } from "@/stores/kinoStore";
import { useUiStore } from "@/stores/uiStore";
import { downloadTextFile, toCsv } from "@/lib/csv";

export function SimulatorPage() {
  const carton = useKinoStore((s) => s.carton);
  const config = useKinoStore((s) => s.config);
  const configure = useKinoStore((s) => s.configure);
  const setLastResult = useKinoStore((s) => s.setLastResult);
  const setNumberFrequency = useKinoStore((s) => s.setNumberFrequency);
  const ballWeights = useKinoStore((s) => s.ballWeights);
  const useBallWeights = useKinoStore((s) => s.useBallWeights);
  const setUseBallWeights = useKinoStore((s) => s.setUseBallWeights);
  const pushToast = useUiStore((s) => s.pushToast);
  const { running, progress, result, error, run, cancel } = useSimulation();

  const parseDraws = (raw: string): number => {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), 1_000_000) : 10_000;
  };

  const [drawsInput, setDrawsInput] = useState(config.draws.toString());
  const [seedInput, setSeedInput] = useState(config.seed.toString());
  // true si el usuario tocó la semilla a mano: ahí respetamos la suya (reproducible).
  const [seedManual, setSeedManual] = useState(false);

  const shareUrl = useMemo(() => {
    // Enlace reproducible: semilla actual + sorteos.
    const params = new URLSearchParams();
    let seedParam = seedInput.trim();
    if (!seedParam) seedParam = String(config.seed);
    params.set("seed", seedParam);
    params.set("draws", String(parseDraws(drawsInput)));
    if (useBallWeights) params.set("pesos", "1");
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [seedInput, drawsInput, useBallWeights, config.seed]);

  // Deep-link: ?seed=4813&draws=5000&pesos=1 en la URL precarga y corre.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromSeed = params.get("seed");
    const fromDraws = params.get("draws");
    const fromPesos = params.get("pesos");
    if (fromDraws) {
      const draws = parseDraws(fromDraws);
      setDrawsInput(draws.toString());
      configure({ draws });
    }
    if (fromPesos === "1") setUseBallWeights(true);
    if (fromSeed) {
      const cleaned = /^\d+$/.test(fromSeed) ? fromSeed : window.decodeURIComponent(fromSeed);
      setSeedInput(cleaned);
      setSeedManual(true);
      configure({ seed: /^\d+$/.test(cleaned) ? Number.parseInt(cleaned, 10) : cleaned });
      // Corre automáticamente con la configuración precargada.
      run({ seed: cleaned, draws: parseDraws(String(fromDraws ?? config.draws)), prizeThreshold: config.prizeThreshold });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir el resultado terminado en el store: Estadísticas lo usa para
  // superponer observado vs teórico, y Generador para hot/cold.
  useEffect(() => {
    if (result && !running) {
      setLastResult({
        draws: result.draws,
        seed: result.seed,
        matchHistogram: result.matchHistogram,
        prizeWins: result.prizeWins,
        numberFrequency: result.numberFrequency,
      });
      setNumberFrequency(result.numberFrequency);
    }
  }, [result, running, setLastResult, setNumberFrequency]);

  const rollSeed = () => {
    const s = randomSeed();
    setSeedInput(s.toString());
    setSeedManual(true);
    configure({ seed: s });
  };

  const start = () => {
    // Semilla: si el usuario no la escribió a mano, usamos UNA NUEVA cada vez.
    // Así el simulador "varía" entre clics (eso es Monte Carlo); para
    // reproducir un resultado basta escribir la semilla y usar la misma.
    let seedRaw: string | number;
    if (seedManual) {
      seedRaw = /^\d+$/.test(seedInput) ? Number.parseInt(seedInput, 10) : seedInput;
    } else {
      seedRaw = randomSeed();
      setSeedInput(seedRaw.toString());
    }
    const draws = parseDraws(drawsInput);
    configure({ draws, seed: seedRaw });
    run(
      { seed: seedRaw, draws, prizeThreshold: config.prizeThreshold },
      carton.length === PICK_SIZE ? carton : undefined,
      useBallWeights ? ballWeights : undefined,
    );
  };

  const applyConfig = () => {
    configure({ draws: parseDraws(drawsInput) });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-gray-900">Simulador Monte Carlo</h1>
        <p className="mt-1 text-sm text-gray-600">
          Corre miles de sorteos en un Web Worker sin bloquear la UI. Si no escribes una semilla a mano, cada{" "}
          <em>Simular</em> usa una <strong>semilla nueva</strong> (los resultados varían). Para reproducir el mismo
          sorteo, fija una semilla y úsala siempre.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit space-y-4 p-6">
          <div>
            <label htmlFor="seed" className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Semilla
            </label>
            <div className="flex gap-2">
              <input
                id="seed"
                value={seedInput}
                onChange={(e) => {
                  setSeedInput(e.target.value);
                  setSeedManual(true);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-kino-red-600 focus:outline-none focus:ring-2 focus:ring-kino-red-600/30"
              />
              <button
                type="button"
                title="Semilla aleatoria nueva"
                aria-label="Semilla aleatoria nueva"
                onClick={rollSeed}
                className="rounded-lg border border-gray-300 px-3 text-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={running}
              >
                🎲
              </button>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {seedManual ? "Semilla fijada (reproducible)." : "Semilla automática nueva por simulación."}
            </p>
          </div>

          <div>
            <label htmlFor="draws" className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Sorteos (1 a 1.000.000)
            </label>
            <input
              id="draws"
              inputMode="numeric"
              value={drawsInput}
              onChange={(e) => setDrawsInput(e.target.value)}
              onBlur={applyConfig}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-kino-red-600 focus:outline-none focus:ring-2 focus:ring-kino-red-600/30"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={useBallWeights}
              onChange={(e) => setUseBallWeights(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-kino-red-600"
            />
            <span>
              <span className="font-semibold text-gray-800">Usar pesos de bolillas</span>
              <span className="mt-0.5 block leading-snug text-gray-500">
                Sorteo ponderado por el peso editado de cada bola (modelo 1/peso). Edítalos en Pesos.
              </span>
            </span>
          </label>

          <button className="w-full btn-primary" onClick={start} disabled={running}>
            {running ? `Simulando… ${progress ?? 0}%` : "Simular"}
          </button>
          {running && (
            <button className="w-full btn-secondary" onClick={cancel}>
              Cancelar
            </button>
          )}

          <button
            type="button"
            className="w-full text-left text-[11px] text-gray-500 hover:text-kino-red-600"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl);
              pushToast("Enlace reproducible copiado", "success");
            }}
          >
            🔗 Copiar enlace reproducible (semilla {seedInput || config.seed})
            <InfoTip label="Compartir simulación">
              Abre el mismo simulador con esta semilla, sorteos y pesos ya cargados. Con la misma semilla el resultado
              es idéntico.
            </InfoTip>
          </button>

          {carton.length === PICK_SIZE && (
            <button
              type="button"
              className="w-full text-left text-[11px] text-gray-500 hover:text-kino-red-600"
              onClick={() => {
                void navigator.clipboard.writeText(carton.join(" "));
                pushToast("Cartón copiado al portapapeles", "success");
              }}
            >
              📋 Copiar cartón ({carton.join(" ")})
            </button>
          )}

          {running && progress !== null && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-kino-red-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Error: {error}</p>}
        </aside>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Cartón evaluado</h2>
            {carton.length === PICK_SIZE ? (
              <p className="mb-3 text-sm text-gray-600">
                Evalúas la frecuencia de aciertos de <strong>{carton.join(", ")}</strong> sobre los sorteos simulados.
              </p>
            ) : (
              <p className="mb-3 text-sm text-amber-700">
                Selecciona 14 números para ver la frecuencia de aciertos de tu cartón ({14 - carton.length} faltantes).
              </p>
            )}
            <KinoGrid />
          </div>

          {result && !running && (
            <div className="card p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-gray-900">
                  Resultados <span className="font-mono text-sm font-normal text-gray-500">semilla {result.seed}</span>
                </h2>
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => {
                    const rows = result.matchHistogram.map((count, k) => [
                      k,
                      count,
                      result.draws > 0 ? ((count / result.draws) * 100).toFixed(3) + "%" : "0%",
                    ]);
                    downloadTextFile(
                      `kino-simulacion-seed-${result.seed}.csv`,
                      toCsv(["Aciertos", "Sorteos", "Frecuencia"],
                        rows.concat([["—", "Total", ""], ["Sorteos", result.draws, ""], ["Premios (≥10)", result.prizeWins, ""]])),
                    );
                    pushToast("CSV de la simulación exportado", "success");
                  }}
                >
                  ⬇ Exportar CSV
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sorteos</p>
                  <p className="mt-1 font-mono text-xl font-bold text-gray-900">{result.draws.toLocaleString("es-CL")}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Premios observados (≥{MIN_PRIZE_MATCHES})
                  </p>
                  {carton.length === PICK_SIZE ? (
                    <p className="mt-1 font-mono text-xl font-bold text-emerald-600">
                      {result.prizeWins.toLocaleString("es-CL")}
                      <span className="text-xs font-normal text-gray-500">
                        {" "}({(result.prizeWins / result.draws).toFixed(4)} %)
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">sin cartón</p>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Promedio de aciertos</p>
                  {carton.length === PICK_SIZE ? (
                    <p className="mt-1 font-mono text-xl font-bold text-gray-900">
                      {(result.matchHistogram.reduce((a, v, i) => a + v * i, 0) / result.draws).toFixed(2)}
                      <span className="text-xs font-normal text-gray-500"> (teórico {EXPECTED_MATCHES.toFixed(2)})</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">sin cartón</p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-kino-red-50 p-4 text-sm text-kino-red-900">
                <p className="font-semibold">Lo importante:</p>
                <p>
                  La frecuencia observada se acerca al valor teórico (
                  {((probabilityAtLeast(MIN_PRIZE_MATCHES)) * 100).toFixed(1)} % de premios) cuando aumentas el número
                  de sorteos. Que unos números salgan más veces <em>no</em> significa que volverán a salir: tu cartón
                  siempre tiene la misma probabilidad.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}