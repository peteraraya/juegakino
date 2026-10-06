import { useEffect, useMemo, useState } from "react";

import { KinoGrid } from "@/components/kino/KinoGrid";

import { InfoTip } from "@/components/ui/InfoTip";

import { Button } from "@/components/ui/Button";

import { Card, CardTitle, StatBlock } from "@/components/ui/Card";

import { CheckboxRow, Note } from "@/components/ui/Field";

import { RadioGroup } from "@/components/ui/RadioGroup";

import { StatusCell } from "@/components/ui/DataTable";

import {
  evaluateKinoTips,
  generateCartonByStrategy,
  kinoTipsMetrics,
  normalizeSeed,
  randomSeed,
  TOTAL_COMBINATIONS,
} from "@/domain";

import type { GenerationStrategy, KinoTipCondition } from "@/domain";

import { KINO_TIP_DEFS } from "@/domain";

import { useSimulation } from "@/hooks/useSimulation";
import { useKinoTipsSearch } from "@/hooks/useKinoTipsSearch";

import { useKinoStore } from "@/stores/kinoStore";

import { useUiStore } from "@/stores/uiStore";

/**


 * La estrategia pasÂ de "cuatro botones, el activo pintado como btn-primary" a un


 * `RadioGroup`. Cuatro opciones excluyentes son una pregunta con cuatro respuestas, no


 * cuatro acciones: pintarlas todas como CTA hacÂ­a que nada en la columna se leyera como


 * la acciÂn vigente.


 */

const STRATEGIES: { id: GenerationStrategy; label: string; hint: string }[] = [
  { id: "random", label: "Aleatorio", hint: "Sorteo puro del PRNG" },
  {
    id: "hot",
    label: "Hot (frecuentes)",
    hint: "Usa los nº más sorteado - necesita frecuencias",
  },
  {
    id: "cold",
    label: "Cold (fríos)",
    hint: "Usa los nº menos sorteado - necesita frecuencias",
  },
  { id: "balanced", label: "Balanceado", hint: "2 por década (1-25)" },
];

const FREQ_DRAWS = 200_000;

export function GeneratorPage() {
  const cartón = useKinoStore((s) => s.carton);

  const setCarton = useKinoStore((s) => s.setCarton);

  const strategy = useKinoStore((s) => s.strategy);

  const setStrategy = useKinoStore((s) => s.setStrategy);

  const numberFrequency = useKinoStore((s) => s.numberFrequency);

  const setNumberFrequency = useKinoStore((s) => s.setNumberFrequency);

  const seed = useMemo(() => randomSeed(), []);

  // Cada clic de "Generar cartón" usa una semilla nueva ÂÂ cartónes distintos.

  const [generationSeed, setGenerationSeed] = useState(seed);

  const [tipsActive, setTipsActive] = useState<KinoTipCondition[]>([]);

  const pushToast = useUiStore((s) => s.pushToast);
  const {
    running: tipsBusy,
    checked: tipsChecked,
    total: tipsTotal,
    result: tipsResult,
    error: tipsError,
    search: searchTips,
    cancel: cancelTipsSearch,
  } = useKinoTipsSearch();

  const needsFreq = strategy === "hot" || strategy === "cold";

  const freqReady = numberFrequency !== null;

  const { running, progress, result, run, cancel } = useSimulation();

  const tipsMetrics = useMemo(
    () => (cartón?.length > 0 ? kinoTipsMetrics(cartón) : null),
    [cartón],
  );

  const tipsEvaluation = useMemo(
    () => (cartón.length > 0 ? evaluateKinoTips(cartón, tipsActive) : []),

    [cartón, tipsActive],
  );

  useEffect(() => {
    // hot/cold necesitan frecuencias si no hay, una simulaciÂn breve las genera.

    if (needsFreq && !freqReady && !running) {
      run({ seed: normalizeSeed(seed), draws: FREQ_DRAWS, prizeThreshold: 14 });
    }
  }, [needsFreq, freqReady, running, seed, run]);

  useEffect(() => {
    if (result && result.numberFrequency && !freqReady) {
      setNumberFrequency(result.numberFrequency);
    }
  }, [result, freqReady, setNumberFrequency]);

  useEffect(() => {
    if (!tipsResult) return;
    if (tipsResult.carton) {
      setCarton(tipsResult.carton);
      pushToast(
        tipsResult.onlyCurrentCarton
          ? "No hay otro cartón distinto que cumpla estas condiciones"
          : `Cartón ideal encontrado tras ${tipsResult.checked.toLocaleString("es-CL")} combinaciones`,
        tipsResult.onlyCurrentCarton ? "info" : "success",
      );
    } else {
      pushToast(
        "No existe un cartón que cumpla todos los parámetros ideales",
        "error",
      );
    }
  }, [tipsResult, setCarton, pushToast]);

  useEffect(() => {
    if (tipsError) pushToast(tipsError, "error");
  }, [tipsError, pushToast]);

  const generate = () => {
    if (needsFreq && !freqReady) return;

    const s = randomSeed();

    setGenerationSeed(s);

    setCarton(generateCartonByStrategy(strategy, s, numberFrequency ?? []));

    pushToast(`cartón generado (semilla ${s})`, "success");
  };

  const toggleTip = (key: KinoTipCondition) => {
    setTipsActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const generateWithTips = () => {
    if (tipsActive.length === 0) return;
    searchTips(tipsActive, cartón);
  };

  return (
    <div className="space-y-8">
      <header className="mx-auto max-w-5xl">
        <p className="text-eyebrow font-medium uppercase text-accent-text  ">
          Tu cartón 
        </p>

        <h1 className="mt-2 font-display text-h1 font-medium text-ink-900">
          Generador de cartónes 
        </h1>

        <p className="mt-2 max-w-prose text-body text-ink-600">
          Marca 14 números o genera uno con semilla reproducible. Ninguna
          estrategia mejora tu probabilidad: todas las combinaciónes son
          equiprobables. 
          <InfoTip label="Equiprobabilidad">
            Cada combinaciÂn de 14 números del 1..25 tiene la msma probabilidad:
            1/4.457.400. hot/cold y balanceado solo reorganizan tu cartón para
            que se parezca a series pasadas; no cambian su chance. 
          </InfoTip>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,380px)] lg:items-start xl:gap-8 ">
        {/* La card del cartón lleva solo la grilla: `w-fit` + `mx-auto` la ajustan al
            ancho real de la composiciÂn de bolitas (max-w-xs + padding) en vez de
            estirarla a la columna entera. Sin esto el cartón queda flotando en ~900px
            de superficie vacÂ­a y las 25 bolitas se pierden. */}
        <Card
          padding="lg"
          className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none"
        >
          <KinoGrid />
          {cartón.length > 0 && tipsMetrics && (
            <section>
              <CardTitle className="text-h2">Diagnóstico del cartón</CardTitle>

              <p className="mt-2 max-w-prose text-body text-ink-600">
                Cómo se ve tu cartón actual frente a los criterios de estilo.
                Descriptivo, no predictivo.
              </p>

              <div className="border-t border-line pt-5">
                {tipsBusy && (
                  <div className="mb-4 space-y-2">
                    <div
                      role="progressbar"
                      aria-label="Combinaciones revisadas"
                      aria-valuemin={0}
                      aria-valuemax={tipsTotal || TOTAL_COMBINATIONS}
                      aria-valuenow={tipsChecked}
                      className="h-1.5 w-full overflow-hidden rounded-full bg-line-strong"
                    >
                      <div
                        className="h-full rounded-full bg-accent-fill transition-all duration-150 ease-smooth"
                        style={{
                          width: `${tipsTotal ? (tipsChecked / tipsTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-small text-ink-600">
                      <span>
                        Revisadas {tipsChecked.toLocaleString("es-CL")}{" "}
                        combinaciones
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelTipsSearch}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <CardTitle>Condiciones</CardTitle>

                <p className="mt-1.5 text-small leading-snug text-ink-600 ">
                  Genera cartónes que cumplan criterios del análisis empírico (1
                  y 25 fijos, separación, rachas, suma, pares, prims, un
                  digito). No alteran la probabilidad.
                </p>

                <div className="mt-3 flex flex-row flex-wrap gap-x-5 gap-y-2 pt-2">
                  {KINO_TIP_DEFS.map((tip) => (
                    <CheckboxRow
                      key={tip.key}
                      checked={tipsActive.includes(tip.key)}
                      onChange={() => toggleTip(tip.key)}
                      label={tip.shortLabel}
                    />
                  ))}
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-3"
                  onClick={generateWithTips}
                  disabled={tipsActive.length === 0}
                  loading={tipsBusy}
                  loadingLabel="Buscando cartón"
                >
                  Generar con {tipsActive.length || "0"} condición(es)
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                <StatBlock
                  label="SeparaciÂn máx."
                  value={tipsMetrics.maxSeparacion}
                />

                <StatBlock
                  label="Consecutivos máx."
                  value={tipsMetrics.maxConsecutivos}
                />

                <StatBlock label="Suma" value={tipsMetrics.suma} />

                <StatBlock
                  label="Pares / Impares"
                  value={`${tipsMetrics.pares} / ${14 - tipsMetrics.pares}`}
                />

                <StatBlock label="Prims" value={tipsMetrics.primos} />

                <StatBlock label="1 digito" value={tipsMetrics.unDigito} />
              </div>

              {tipsEvaluation.length > 0 && (
                <Card className="mt-4">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {tipsEvaluation.map((r) => (
                      <li
                        key={r.key}
                        className="flex items-center justify-between gap-3 text-small"
                      >
                        <span className="text-ink-600">
                          {
                            KINO_TIP_DEFS.find((d) => d.key === r.key)
                              ?.shortLabel
                          }
                        </span>

                        <span className="font-mono text-ink-500">
                          {r.metric}
                        </span>

                        <StatusCell level={r.status} showLabel />
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 border-t border-line pt-3 text-small text-ink-500">
                    Solo se listan las condicines activas.
                  </p>
                </Card>
              )}

              {tipsEvaluation.length === 0 && (
                <Note tone="info" className="mt-4">
                  Activa alguna condición arriba para ver el diagnóstico de
                  estilo de ese criterio.
                </Note>
              )}
            </section>
          )}
        </Card>

        <Card className="space-y-6 lg:sticky lg:top-24">
          <div className="space-y-4">
            <div>
              <CardTitle>Configuración</CardTitle>
              <p className="mt-1.5 text-small leading-snug text-ink-600">
                Elige cómo generar el cartón. Las combinaciones siguen siendo
                equiprobables.
              </p>
            </div>

            <RadioGroup
              name="estrategia"
              label="Estrategia"
              description="Cómo se arman los 14 números."
              value={strategy}
              onChange={setStrategy}
              options={STRATEGIES.map((s) => ({
                value: s.id,

                label: s.label,

                hint: s.hint,

                disabled:
                  (s.id === "hot" || s.id === "cold") && !freqReady && running,
              }))}
            />

            <p className="tabular font-mono text-small text-ink-600">
              Última semilla:{" "}
              <span className="text-ink-800">{generationSeed}</span>
            </p>
          </div>

          {needsFreq && !freqReady && (
            <div className="rounded-md bg-surface-sunken p-3">
              <p className="text-small font-medium text-ink-800">
                {running
                  ? `Obteniendo frecuencias ${progress ?? 0}%`
                  : "Sin frecuenciasaÂºn"}
              </p>

              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress ?? 0}
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-strong"
              >
                <div
                  className="h-full rounded-full bg-accent-fill transition-all duration-150 ease-smooth"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>

              <p className="mt-2 text-small text-ink-600">
                Corriendo {FREQ_DRAWS.toLocaleString("es-CL")} sorteos (semilla{" "}
                {seed}) para saber que números fueron más y menos sorteados.
              </p>

              {running && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancel}
                  className="mt-2"
                >
                  Cancelar
                </Button>
              )}
            </div>
          )}

          {/* Un solo primary en la vista: "Generar cartón" es la acciÂn vigente. */}

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              fullWidth
              onClick={generate}
              disabled={(needsFreq && !freqReady) || running}
              loading={running}
              loadingLabel="Generando..."
            >
              Generar cartón
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={() => setCarton([])}
              disabled={cartón.length === 0}
            >
              Limpiar ({14 - cartón.length} restantes)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
