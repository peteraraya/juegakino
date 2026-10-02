import { useMemo, useState } from "react";
import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CheckboxRow, Field, TextInput } from "@/components/ui/Field";
import { DataTable, StatusCell, Td, Th, Tr } from "@/components/ui/DataTable";
import { KINO_TIP_DEFS, countActive, evaluateKinoTips, generateCarton, kinoStyleScore } from "@/domain";
import type { KinoTipCondition } from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";
import { useUiStore } from "@/stores/uiStore";

const DEFAULT_COUNT = 200;

export function ComparadorPage() {
  const setCarton = useKinoStore((s) => s.setCarton);
  const pushToast = useUiStore((s) => s.pushToast);

  const [active, setActive] = useState<KinoTipCondition[]>([
    "suma",
    "pares",
    "primos",
    "unDigito",
    "separacion",
    "consecutivos",
  ]);
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Explorar"
        title="Comparador de cartones"
        description={
          <>
            Genera N cartones al azar, los ordena por <strong className="font-medium text-ink-900">score de
            estilo</strong> (qué tan bien cumplen los tips de cartillas ganadoras) y muestra los mejores. El score{" "}
            <em>describe el estilo</em>, no aumenta tu probabilidad: todas las combinaciones de 14 son equiprobables.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <Card className="space-y-5 lg:sticky lg:top-24">
          <div>
            <CardTitle>
              Condiciones
              <InfoTip label="Score de estilo">
                Ideal = 2 pts, aceptable = 1 pt, fuera = 0. El score es el % del máximo posible (2 pts × condiciones
                activas). Es un resumen descriptivo del cartón, no una probabilidad de ganar.
              </InfoTip>
            </CardTitle>
            <div className="mt-2 flex flex-col">
              {KINO_TIP_DEFS.map((tip) => (
                <CheckboxRow
                  key={tip.key}
                  checked={active.includes(tip.key)}
                  onChange={() => toggleTip(tip.key)}
                  label={tip.label}
                />
              ))}
            </div>
          </div>

          <Field label={`Cartones a comparar (${count})`} hint="Entre 10 y 2.000.">
            {({ controlId, describedBy }) => (
              <TextInput
                id={controlId}
                aria-describedby={describedBy}
                type="number"
                inputMode="numeric"
                min={10}
                max={2000}
                step={10}
                mono
                value={count}
                onChange={(e) => setCount(Math.min(2000, Math.max(10, Number(e.target.value) || DEFAULT_COUNT)))}
              />
            )}
          </Field>

          <Button variant="primary" fullWidth onClick={() => setRunId((r) => r + 1)}>
            Volver a comparar
          </Button>
        </Card>

        <div className="space-y-6">
          {candidates.sorted.length === 0 ? (
            <Card>
              <p className="text-small text-ink-600">No hay cartones para comparar.</p>
            </Card>
          ) : (
            <>
              <Card>
                <CardTitle>Mejor del lote (estilo)</CardTitle>
                {best && (
                  <div className="mt-3 rounded-md bg-accent-tint p-4">
                    <p className="tabular font-mono text-h3 font-medium text-ink-900">{best.carton.join(" · ")}</p>
                    <p className="mt-2 text-small text-ink-600">
                      Score <strong className="tabular font-mono font-medium text-accent-text-strong">{best.score}</strong>
                      /100 · {best.ideal} ideal, {best.aceptable} aceptable, {best.fuera} fuera
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setCarton(best.carton);
                          pushToast("Cartón elegido y guardado", "success");
                        }}
                      >
                        Usar este cartón
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(best.carton.join(" "));
                          pushToast("Cartón copiado al portapapeles", "success");
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-small text-ink-600">
                  Promedio del lote:{" "}
                  <strong className="tabular font-mono font-medium text-ink-900">
                    {candidates.avgScore.toFixed(1)}
                  </strong>
                  /100 en {countActive(active)} condiciones activas.
                </p>
              </Card>

              <Card>
                <CardTitle>Análisis por condición (top 5)</CardTitle>
                <DataTable className="mt-4">
                  <thead>
                    <tr>
                      <Th numeric>#</Th>
                      {KINO_TIP_DEFS.filter((t) => active.includes(t.key)).map((t) => (
                        <Th key={t.key}>{t.label}</Th>
                      ))}
                      <Th numeric>Score</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.top.map((c, i) => {
                      const evals = evaluateKinoTips(c.carton, active);
                      return (
                        <Tr key={i}>
                          <Td numeric className="text-ink-600">
                            #{i + 1}
                          </Td>
                          {KINO_TIP_DEFS.filter((t) => active.includes(t.key)).map((t) => {
                            const r = evals.find((e) => e.key === t.key)!;
                            return (
                              // El estado ya no vive solo en el color: glifo + sr-only con el
                              // nivel (ideal/aceptable/fuera), según design-tokens.md §6.
                              <Td key={t.key} title={`${r.metric} — ${r.status}`}>
                                <span className="inline-flex items-center gap-1.5">
                                  <StatusCell level={r.status} value={r.metric} />
                                </span>
                              </Td>
                            );
                          })}
                          <Td numeric className="font-semibold">
                            {c.score}
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </DataTable>
                <p className="mt-3 text-small text-ink-600">
                  Cada celda muestra el valor medido del cartón junto a su nivel (ideal, aceptable o fuera). El color
                  acompaña; el glifo y el texto en pantalla lo dicen explícitamente.
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}