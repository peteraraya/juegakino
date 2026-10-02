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
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, StatBlock } from "@/components/ui/Card";
import { EmptyState, Field, Note, Select, TextArea } from "@/components/ui/Field";
import { DataTable, StatusCell, Td, Th, Tr } from "@/components/ui/DataTable";

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
    () => (verified && carton.length > 0 && cartonValido ? verifyCarton(carton, verified.draws) : []),
    [verified, carton, cartonValido],
  );
  const summary = useMemo(() => (details.length > 0 ? summarizeVerification(details) : null), [details]);
  const tipsStats = useMemo(() => (verified ? analyzeDrawsAgainstTips(verified.draws) : []), [verified]);

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tu cartón"
        title="Verificador de resultados reales"
        description={
          <>
            Pega los <strong className="font-medium text-ink-900">resultados de sorteos reales del Kino</strong> (una
            línea por sorteo, 14 números) y la app verifica cuántos aciertos habría tenido tu cartón y si hubiera
            ganado premio.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="space-y-6">
          <section>
            <CardTitle>Tu cartón</CardTitle>
            {carton.length === 0 ? (
              <EmptyState
                title="Aún no tienes cartón"
                action={
                  <Link
                    to="/generador"
                    className="text-small font-medium text-accent-text underline-offset-4 hover:underline"
                  >
                    Generar un cartón →
                  </Link>
                }
              >
                Marca 14 números en las bolillas o deja que el generador arme uno por ti.
              </EmptyState>
            ) : (
              <>
                <p className="tabular mt-3 font-mono text-body text-ink-900">{carton.join("  ")}</p>
                {!cartonValido && (
                  <Note tone="danger" className="mt-3">
                    Cartón inválido: tiene {carton.length} números y no cumple «14 distintos del 1..25». Límpialo y
                    vuelve a generarlo en{" "}
                    <Link to="/generador" className="font-medium underline">
                      Generador
                    </Link>
                    .
                  </Note>
                )}
                {cartonValido && !cartonCompleted && (
                  <Note tone="warning" className="mt-3">
                    Cartón incompleto ({carton.length}/14): la columna «premio» se evalúa solo con el cartón completo.
                  </Note>
                )}
              </>
            )}
          </section>

          <section>
            <Field
              label="Sorteos reales"
              hint={`${parsedNow.draws.length} sorteos válidos de ${raw.trim() ? raw.trim().split(/\n+/).length : 0} líneas.`}
              error={
                parsedNow.errors.length > 0
                  ? `${parsedNow.errors.length} línea(s) con formato inválido. Revisa el detalle abajo.`
                  : undefined
              }
            >
              {({ controlId, describedBy, invalid }) => (
                <TextArea
                  id={controlId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  placeholder={"14 números por línea, separados por espacio o coma:\n3 7 9 10 12 13 15 17 18 19 21 22 24 25"}
                />
              )}
            </Field>

            {parsedNow.errors.length > 0 && (
              <details className="mt-3 rounded-md bg-warning-tint p-3 text-small text-warning-ink">
                <summary className="cursor-pointer font-medium">
                  Ver las {parsedNow.errors.length} líneas ignoradas
                </summary>
                <ul className="mt-2 list-inside list-disc space-y-0.5">
                  {parsedNow.errors.slice(0, 5).map((e) => (
                    <li key={e.line}>
                      Línea {e.line}: {e.message}
                    </li>
                  ))}
                  {parsedNow.errors.length > 5 && <li>…y {parsedNow.errors.length - 5} más.</li>}
                </ul>
              </details>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {/* Único primary de la vista. */}
              <Button
                variant="primary"
                onClick={runVerification}
                disabled={!cartonValido || parsedNow.draws.length === 0}
              >
                Verificar ({parsedNow.draws.length} sorteos válidos)
              </Button>
              <Button variant="secondary" onClick={() => setRaw(SAMPLE_DRAWS)}>
                Usar resultados de ejemplo
              </Button>
            </div>

            {carton.length === 0 && (
              <Note tone="warning" className="mt-4">
                Para verificar primero necesitas un cartón.
              </Note>
            )}
          </section>
        </Card>

        <Card className="space-y-6">
          <CardTitle>Resultado</CardTitle>

          {!verified ? (
            <EmptyState title="Sin verificación todavía">
              Presiona <strong className="font-medium text-ink-800">Verificar</strong> para comparar tu cartón contra
              los {parsedNow.draws.length} sorteos válidos ingresados.
            </EmptyState>
          ) : carton.length === 0 ? (
            <Note tone="warning">
              Verificaste sorteos, pero no hay cartón guardado.{" "}
              <Link to="/generador" className="font-medium underline">
                Genera un cartón
              </Link>{" "}
              y vuelve a la verificación.
            </Note>
          ) : !cartonValido ? (
            <Note tone="danger">
              Cartón inválido ({carton.length} números): debe tener exactamente 14 distintos del 1..25.
            </Note>
          ) : (
            summary && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatBlock label="Sorteos verificados" value={summary.totalDraws} />
                  <StatBlock
                    label={`Premios (≥${MIN_PRIZE_MATCHES})`}
                    value={summary.prizeHits}
                    hint={`de ${summary.totalDraws}`}
                    tone={summary.prizeHits > 0 ? "success" : "default"}
                  />
                  <StatBlock label="Mejor acierto" value={`${summary.bestMatches}/14`} />
                  <StatBlock
                    label="Promedio de aciertos"
                    value={summary.avgMatches.toFixed(2)}
                    hint={`teórico ${((PICK_SIZE * PICK_SIZE) / 25).toFixed(2)}`}
                  />
                </div>

                <Note tone="info" className="mt-4">
                  Por mero azar, en {summary.totalDraws} sorteos se esperan ≈{" "}
                  <strong className="tabular font-mono font-medium">
                    {summary.expectedPrizesByChance.toFixed(1)}
                  </strong>{" "}
                  premios de este tipo (probabilidad{" "}
                  {(probabilityAtLeast(MIN_PRIZE_MATCHES) * 100).toFixed(2)} % de éxito). Compara con tus{" "}
                  {summary.prizeHits}.
                </Note>

                <section className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Detalle por sorteo</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        inputSize="sm"
                        aria-label="Ordenar sorteos"
                        value={sortKey}
                        onChange={(e) => {
                          setSortKey(e.target.value as SortKey);
                          setPage(1);
                        }}
                      >
                        <option value="drawNumber">Por orden numérico</option>
                        <option value="matches">Por aciertos (mayor)</option>
                      </Select>
                      <Button variant="secondary" size="sm" onClick={exportCsv} disabled={sortedDetails.length === 0}>
                        ⬇ CSV
                      </Button>
                    </div>
                  </div>

                  <DataTable className="mt-3">
                    <thead>
                      <tr>
                        <Th numeric>#</Th>
                        <Th>Números</Th>
                        <Th numeric>Aciertos</Th>
                        <Th numeric>P(k)</Th>
                        <Th numeric>Premio</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageDetails.map((d) => (
                        <Tr key={d.drawNumber} className={d.prize ? "bg-success-tint/60" : undefined}>
                          <Td numeric className="text-ink-600">
                            {d.drawNumber}
                          </Td>
                          <Td className="font-mono leading-4 text-data">{d.numbers.join("·")}</Td>
                          <Td numeric className="font-semibold">
                            {d.matches}
                          </Td>
                          <Td numeric className="text-ink-600">
                            {(d.exactProbability * 100).toFixed(3)}%
                          </Td>
                          <Td numeric>
                            {d.prize ? <StatusCell level="ideal" value="SÍ" /> : <span className="text-ink-500">—</span>}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </DataTable>

                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={safePage === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        ← Anterior
                      </Button>
                      <span className="tabular font-mono text-small text-ink-600">
                        {safePage} / {totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={safePage === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Siguiente →
                      </Button>
                    </div>
                  )}
                </section>

                {tipsStats.length > 0 && (
                  <section className="mt-6 border-t border-line pt-5">
                    <CardTitle>Los tips contra esta historia real</CardTitle>
                    <p className="mt-1.5 text-small leading-snug text-ink-600">
                      Porcentaje de sorteos que cae en cada nivel, por condición, sobre los{" "}
                      {verified.draws.length} sorteos ingresados. Es una foto de la serie, no una predicción.
                    </p>

                    <DataTable className="mt-3">
                      <thead>
                        <tr>
                          <Th>Condición</Th>
                          <Th numeric>Ideal</Th>
                          <Th numeric>Aceptable</Th>
                          <Th numeric>Fuera</Th>
                          <Th numeric>Promedio</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {tipsStats.map((t) => {
                          const def = KINO_TIP_DEFS.find((d) => d.key === t.key);
                          return (
                            <Tr key={t.key}>
                              <Td mono={false} className="font-medium text-ink-800">
                                {def?.label ?? t.key}
                              </Td>
                              <Td numeric className="text-success">
                                {t.idealPct.toFixed(0)} %
                              </Td>
                              <Td numeric className="text-warning">
                                {t.aceptablePct.toFixed(0)} %
                              </Td>
                              <Td numeric className="text-danger">
                                {t.fueraPct.toFixed(0)} %
                              </Td>
                              <Td numeric className="text-ink-600">
                                {t.averageMetric !== null ? t.averageMetric.toFixed(2) : "—"}
                              </Td>
                            </Tr>
                          );
                        })}
                      </tbody>
                    </DataTable>
                  </section>
                )}
              </>
            )
          )}

          <Note tone="warning" className="border-t border-line pt-5">
            Esto solo verifica sorteos pasados. No aumenta tu probabilidad futura: cada sorteo es independiente y
            todas las combinaciones de 14 tienen la misma probabilidad de ganar.
          </Note>
        </Card>
      </div>
    </div>
  );
}