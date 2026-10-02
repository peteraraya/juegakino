import { useEffect, useMemo, useState } from "react";
import { KinoGrid } from "@/components/kino/KinoGrid";
import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, StatBlock } from "@/components/ui/Card";
import { CheckboxRow, Field, Note, TextInput } from "@/components/ui/Field";
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Simular"
        title="Simulador Monte Carlo"
        description={
          <>
            Corre miles de sorteos en un Web Worker sin bloquear la interfaz. Si no escribes una semilla a mano, cada{" "}
            <strong className="font-medium text-ink-900">Simular</strong> usa una semilla nueva. Para reproducir el
            mismo sorteo, fija una semilla y úsala siempre.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <Card className="space-y-5 lg:sticky lg:top-24">
          <Field
            label="Semilla"
            hint={seedManual ? "Fijada: el resultado es reproducible." : "Automática: cambia en cada simulación."}
          >
            {({ controlId, describedBy }) => (
              <div className="flex gap-2">
                <TextInput
                  id={controlId}
                  aria-describedby={describedBy}
                  mono
                  value={seedInput}
                  onChange={(e) => {
                    setSeedInput(e.target.value);
                    setSeedManual(true);
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={rollSeed}
                  disabled={running}
                  aria-label="Semilla aleatoria nueva"
                  title="Semilla aleatoria nueva"
                  className="shrink-0"
                >
                  <span aria-hidden="true">⤨</span>
                </Button>
              </div>
            )}
          </Field>

          <Field label="Sorteos" hint="Entre 1 y 1.000.000.">
            {({ controlId, describedBy }) => (
              <TextInput
                id={controlId}
                aria-describedby={describedBy}
                mono
                inputMode="numeric"
                value={drawsInput}
                onChange={(e) => setDrawsInput(e.target.value)}
                onBlur={applyConfig}
              />
            )}
          </Field>

          <div className="rounded-md bg-surface-sunken p-1">
            <CheckboxRow
              checked={useBallWeights}
              onChange={setUseBallWeights}
              label="Usar pesos de bolillas"
              hint="Sorteo ponderado por el peso editado de cada bola (modelo 1/peso). Edítalos en Pesos."
            />
          </div>

          <div className="space-y-2">
            {/* Único primary de la vista. */}
            <Button
              variant="primary"
              fullWidth
              onClick={start}
              disabled={running}
              loading={running}
              loadingLabel={`Simulando… ${progress ?? 0}%`}
            >
              Simular
            </Button>
            {running && (
              <Button variant="secondary" fullWidth onClick={cancel}>
                Cancelar
              </Button>
            )}
          </div>

          {running && progress !== null && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Progreso de la simulación"
              className="h-1.5 w-full overflow-hidden rounded-full bg-line-strong"
            >
              <div
                className="h-full rounded-full bg-accent-fill transition-all duration-150 ease-smooth"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <Note tone="danger" title="No se pudo simular">
              {error}
            </Note>
          )}

          <div className="space-y-1 border-t border-line pt-4">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="justify-start"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                pushToast("Enlace reproducible copiado", "success");
              }}
            >
              Copiar enlace reproducible
              <InfoTip label="Compartir simulación">
                Abre el mismo simulador con esta semilla (semilla {seedInput || config.seed}), sorteos y pesos ya
                cargados. Con la misma semilla el resultado es idéntico.
              </InfoTip>
            </Button>

            {carton.length === PICK_SIZE && (
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                className="justify-start"
                onClick={() => {
                  void navigator.clipboard.writeText(carton.join(" "));
                  pushToast("Cartón copiado al portapapeles", "success");
                }}
              >
                Copiar cartón ({carton.join(" ")})
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Cartón evaluado</CardTitle>
            {carton.length === PICK_SIZE ? (
              <p className="mt-2 text-small text-ink-600">
                Evalúas la frecuencia de aciertos de{" "}
                <strong className="tabular font-mono font-medium text-ink-900">{carton.join(" ")}</strong> sobre los
                sorteos simulados.
              </p>
            ) : (
              <Note tone="warning" className="mt-2">
                Selecciona 14 números para ver la frecuencia de aciertos de tu cartón (faltan{" "}
                {14 - carton.length}).
              </Note>
            )}
            <div className="mt-4">
              <KinoGrid />
            </div>
          </Card>

          {result && !running && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>
                  Resultados{" "}
                  <span className="tabular font-sans text-small font-normal text-ink-600">semilla {result.seed}</span>
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const rows = result.matchHistogram.map((count, k) => [
                      k,
                      count,
                      result.draws > 0 ? ((count / result.draws) * 100).toFixed(3) + "%" : "0%",
                    ]);
                    downloadTextFile(
                      `kino-simulacion-seed-${result.seed}.csv`,
                      toCsv(
                        ["Aciertos", "Sorteos", "Frecuencia"],
                        rows.concat([
                          ["—", "Total", ""],
                          ["Sorteos", result.draws, ""],
                          ["Premios (≥10)", result.prizeWins, ""],
                        ]),
                      ),
                    );
                    pushToast("CSV de la simulación exportado", "success");
                  }}
                >
                  ⬇ Exportar CSV
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatBlock label="Sorteos" value={result.draws.toLocaleString("es-CL")} />
                <StatBlock
                  label={`Premios observados (≥${MIN_PRIZE_MATCHES})`}
                  value={
                    carton.length === PICK_SIZE ? (
                      <>
                        {result.prizeWins.toLocaleString("es-CL")}
                        <span className="text-small font-normal text-ink-600">
                          {" "}
                          ({(result.prizeWins / result.draws).toFixed(4)} %)
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-small text-ink-600">sin cartón</span>
                    )
                  }
                  tone={carton.length === PICK_SIZE && result.prizeWins > 0 ? "success" : "default"}
                />
                <StatBlock
                  label="Promedio de aciertos"
                  value={
                    carton.length === PICK_SIZE ? (
                      <>
                        {(result.matchHistogram.reduce((a, v, i) => a + v * i, 0) / result.draws).toFixed(2)}
                        <span className="text-small font-normal text-ink-600">
                          {" "}
                          (teórico {EXPECTED_MATCHES.toFixed(2)})
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-small text-ink-600">sin cartón</span>
                    )
                  }
                />
              </div>

              <Note tone="accent" title="Lo importante" className="mt-5">
                La frecuencia observada se acerca al valor teórico (
                {(probabilityAtLeast(MIN_PRIZE_MATCHES) * 100).toFixed(1)} % de premios) cuando aumentas el número de
                sorteos. Que unos números salgan más veces <em>no</em> significa que volverán a salir: tu cartón siempre
                tiene la misma probabilidad.
              </Note>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}