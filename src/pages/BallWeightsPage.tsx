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
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CheckboxRow, Field, Note, TextArea, TextInput } from "@/components/ui/Field";
import { DataTable, Td, Th, Tr } from "@/components/ui/DataTable";

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
  const [drawn, setDrawn] = useState(SAMPLE_DRAWS);

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Explorar"
        title="Pesos de las bolillas"
        description="Edita el peso (kg) de cada bola 1..25. El simulador puede usar estos pesos como sesgo (las más livianas suben levemente más fácil en una máquina de aire). La diferencia con los valores reales es tan chica que el efecto es negligible — esto es para observarlo, no para apostar con él."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-md bg-surface-sunken p-1">
          <CheckboxRow
            checked={useBallWeights}
            onChange={setUseBallWeights}
            label="Aplicar pesos en el simulador"
          />
        </div>
        <Button variant="secondary" onClick={resetBallWeights} disabled={!edited}>
          Restaurar pesos de referencia
        </Button>
        <span className="tabular font-mono text-small text-ink-600">
          {isUniform
            ? "Todos los pesos iguales (sin sesgo)"
            : `rango ${fmtKg(min)} – ${fmtKg(max)} (${((max / min - 1) * 100).toFixed(2)} % de diferencia)`}
        </span>
      </div>

      {/* El estado de la bolilla se codifica por color + signo + texto ("más probable"),
          para que no dependa solo del tono. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {weights.map((kg, i) => {
          const share = shares[i];
          // Sesgo relativo vs el valor que tendría sin sesgo (promedio 4 %).
          const deviation = (share - 1 / 25) / (1 / 25);
          const lighter = deviation > 0;
          return (
            <Card key={i} padding="sm">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={[
                    "tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-small font-medium",
                    useBallWeights
                      ? lighter
                        ? "bg-accent-tint text-accent-text-strong"
                        : "bg-surface-sunken text-ink-700"
                      : "bg-surface-sunken text-ink-700",
                  ].join(" ")}
                  title={useBallWeights ? "Participación teórica algo mayor (más liviana)" : undefined}
                >
                  {i + 1}
                </span>
                <TextInput
                  inputSize="sm"
                  mono
                  type="number"
                  inputMode="decimal"
                  min={BALL_WEIGHT_MIN}
                  max={BALL_WEIGHT_MAX}
                  step={0.01}
                  aria-label={`Peso de la bola ${i + 1} en kg`}
                  key={`${i}-${kg}`}
                  defaultValue={kg.toFixed(2)}
                  onBlur={(e) => commit(i, e.target.value)}
                  className="text-right"
                />
              </div>
              <p className="mt-1 text-right font-mono text-eyebrow text-ink-600">kg</p>
              {useBallWeights && (
                <p
                  className={[
                    "mt-0.5 text-right font-mono text-eyebrow",
                    lighter ? "text-accent-text" : "text-ink-600",
                  ].join(" ")}
                >
                  {deviation >= 0 ? "+" : ""}
                  {(deviation * 100).toFixed(1)} % {lighter ? "más probable" : "menos probable"}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Note tone="warning" title="Juego responsable">
        Aunque el sesgo físico existiera, con estos valores (diferencia ≈ 2 %) tu probabilidad de acertar 14 cambia
        en fracciones de 1 en 4.457.400. Ningún ajuste de pesos, estrategia ni cartón mejora de forma aprovechable la
        probabilidad de ganar: cada combinación sigue siendo equiprobable en el sorteo oficial.
      </Note>

      <Card>
        <CardTitle>Contrastar contra sorteos reales</CardTitle>
        <p className="mt-2 max-w-prose text-body text-ink-600">
          Pega resultados reales (una línea por sorteo, 14 números) y compara cuánto se aleja la frecuencia observada
          de cada bola del modelo uniforme y del modelo 1/peso. Estadísticamente necesitas cientos de sorteos para ver
          algo que no sea ruido.
        </p>

        <div className="mt-5">
          <Field
            label="Sorteos reales"
            hint={`${parsed.draws.length} sorteos válidos.`}
            error={
              parsed.errors.length > 0
                ? `${parsed.errors.length} línea(s) ignorada(s) por formato inválido.`
                : undefined
            }
          >
            {({ controlId, describedBy, invalid }) => (
              <TextArea
                id={controlId}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                value={drawn}
                onChange={(e) => setDrawn(e.target.value)}
                rows={6}
                spellCheck={false}
                placeholder={"14 números por línea, separados por espacio o coma:\n3 7 9 10 12 13 15 17 18 19 21 22 24 25"}
              />
            )}
          </Field>
        </div>

        <Button variant="secondary" size="sm" className="mt-3" onClick={() => setDrawn(SAMPLE_DRAWS)}>
          Usar sorteos de ejemplo
        </Button>

        {empirics.length > 0 && (
          <>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-small">
              <p>
                <span className="text-ink-600">Sorteos analizados:</span>{" "}
                <strong className="tabular font-mono font-medium text-ink-900">{parsed.draws.length}</strong>
              </p>
              <p>
                <span className="text-ink-600">Máxima desviación vs uniforme:</span>{" "}
                <strong className="tabular font-mono font-medium text-accent-text">
                  {empiricalMaxDeviation.toFixed(2)} pp
                </strong>
              </p>
            </div>

            <DataTable className="mt-4 max-h-96 overflow-y-auto">
              <thead className="sticky top-0 bg-surface">
                <tr>
                  <Th numeric>Bola</Th>
                  <Th numeric>Peso</Th>
                  <Th numeric>Aparece</Th>
                  <Th numeric>Observado</Th>
                  <Th numeric>Uniforme</Th>
                  <Th numeric>Modelo 1/peso</Th>
                  <Th numeric>Desv.</Th>
                </tr>
              </thead>
              <tbody>
                {empirics.map((r) => (
                  <Tr key={r.ball}>
                    <Td numeric className="font-semibold">
                      {r.ball}
                    </Td>
                    <Td numeric className="text-ink-600">
                      {r.weightKg.toFixed(2)}
                    </Td>
                    <Td numeric>{r.observedCount}</Td>
                    <Td numeric>{r.observedSharePct.toFixed(2)} %</Td>
                    <Td numeric className="text-ink-600">
                      {r.uniformSharePct.toFixed(2)} %
                    </Td>
                    <Td numeric className="text-ink-600">
                      {r.weightedSharePct.toFixed(2)} %
                    </Td>
                    <Td
                      numeric
                      className={
                        Math.abs(r.deviationPct) > 2
                          ? "font-semibold text-accent-text"
                          : "text-ink-700"
                      }
                    >
                      {r.deviationPct >= 0 ? "+" : ""}
                      {r.deviationPct.toFixed(2)} pp
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          </>
        )}
      </Card>
    </div>
  );
}