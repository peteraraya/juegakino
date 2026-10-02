import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { DataTable, Td, Th, Tr } from "@/components/ui/DataTable";
import { Note } from "@/components/ui/Field";
import { axisProps, tooltipStyle, useChartTheme } from "@/lib/chartTheme";
import { EXPECTED_MATCHES, MIN_PRIZE_MATCHES, probabilityAtLeast, probabilityTable } from "@/domain";
import { useKinoStore } from "@/stores/kinoStore";

/** Formatea un porcentaje: 4 decimales, salvo valores muy chicos (notación "1 en"). */
function formatPercent(pct: number): string {
  if (pct >= 0.01) return `${pct.toFixed(4)} %`;
  if (pct === 0) return "0 %";
  return `${pct.toExponential(3)} %`;
}

/** "1 en N" usando la probabilidad cruda (no el porcentaje). */
function formatOneIn(probability: number): string {
  if (probability <= 0) return "∞";
  return Math.round(1 / probability).toLocaleString("es-CL");
}

export function StatsPage() {
  const lastResult = useKinoStore((s) => s.lastResult);
  const theme = useChartTheme();

  const data = useMemo(() => {
    const theoretical = probabilityTable();
    const hasHistogram = lastResult !== null && lastResult.matchHistogram.reduce((a, b) => a + b, 0) > 0;
    return theoretical.map((row, i) => ({
      aciertos: row.matches,
      probabilidad: row.probability,
      teorico: row.probability * 100,
      observado:
        hasHistogram && lastResult.draws > 0 ? ((lastResult.matchHistogram[i] ?? 0) / lastResult.draws) * 100 : null,
    }));
  }, [lastResult]);

  const hasHistogram = data.some((r) => r.observado !== null);
  const observedPrizePct = hasHistogram
    ? ((lastResult!.matchHistogram.slice(MIN_PRIZE_MATCHES).reduce((a, b) => a + b, 0) /
        lastResult!.draws) *
        100)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Simular"
        title="Estadísticas"
        description={
          <>
            Distribución hipergeométrica teórica de aciertos por cartón (14 de 25). Si corres una simulación en{" "}
            <em>Simulador</em>, sus frecuencias observadas se superponen aquí y se acercan al teórico al aumentar los
            sorteos. Valor esperado:{" "}
            <strong className="tabular font-mono text-ink-900">{EXPECTED_MATCHES}</strong> aciertos.
          </>
        }
      />

      <Card>
        <CardTitle>P(K = k aciertos), en %</CardTitle>

        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              {/* Grilla horizontal decorativa: sin punteado, porque punteado lee como serie. */}
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis dataKey="aciertos" {...axisProps(theme)} />
              <YAxis {...axisProps(theme)} width={56} />
              <Tooltip
                {...tooltipStyle(theme)}
                formatter={(value) => `${Number(value).toFixed(4)} %`}
                labelFormatter={(label) => `${String(label)} aciertos`}
                cursor={{ fill: theme.grid }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: theme.axis, paddingTop: 8 }} />
              <Bar dataKey="teorico" name="Teórico" radius={[3, 3, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.aciertos}
                    fill={
                      entry.aciertos >= MIN_PRIZE_MATCHES
                        ? theme.series
                        : entry.aciertos >= EXPECTED_MATCHES
                          ? theme.axis
                          : theme.grid
                    }
                  />
                ))}
              </Bar>
              {hasHistogram && lastResult && (
                <Bar
                  dataKey="observado"
                  name={`Observado (${lastResult.draws.toLocaleString("es-CL")} sorteos)`}
                  fill={theme.seriesNeutral}
                  radius={[3, 3, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/*
          La categoría de premio se codifica por color en el chart, así que el color NO
          puede ser el único portador: el marcador de eje lo repite en texto
          ("Premio desde 10") y la tabla de abajo lo dice con "Sí"/"—".
        */}
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink-600">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: theme.series }}
            />
            Premio desde {MIN_PRIZE_MATCHES} aciertos
          </span>
          <span>Las barras oscuras son la simulación observada: al correr más sorteos se alinean con el teórico.</span>
        </p>

        {hasHistogram && observedPrizePct !== null && (
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 rounded-md bg-surface-sunken p-4 text-small">
            <p>
              <span className="text-ink-600">Premios observados reales:</span>{" "}
              <strong className="tabular font-mono font-medium text-success">{observedPrizePct.toFixed(3)} %</strong>
            </p>
            <p>
              <span className="text-ink-600">Premios teóricos:</span>{" "}
              <strong className="tabular font-mono font-medium text-accent-text">
                {(probabilityAtLeast(MIN_PRIZE_MATCHES) * 100).toFixed(3)} %
              </strong>
            </p>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Probabilidad por categoría</CardTitle>
        <DataTable className="mt-4">
          <thead>
            <tr>
              <Th numeric>Aciertos</Th>
              <Th numeric>Probabilidad</Th>
              <Th numeric>1 en N</Th>
              <Th>Premio</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <Tr key={row.aciertos}>
                <Td numeric className="font-semibold">
                  {row.aciertos}
                </Td>
                <Td numeric>{formatPercent(row.teorico)}</Td>
                <Td numeric>{formatOneIn(row.probabilidad)}</Td>
                <Td mono={false}>
                  {row.aciertos >= MIN_PRIZE_MATCHES ? (
                    <span className="font-medium text-accent-text-strong">Sí</span>
                  ) : (
                    <span className="text-ink-500">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      </Card>

      <Card>
        <CardTitle>
          Categorías de premio
          <InfoTip label="Premios reales">
            El Kino reparte su pozo según aciertos (10–14). Estos valores son referenciales y los fija Lotería en cada
            sorteo: un monto fijo no está garantizado por esta app.
          </InfoTip>
        </CardTitle>

        <DataTable className="mt-4">
          <thead>
            <tr>
              <Th numeric>Aciertos</Th>
              <Th numeric>Probabilidad</Th>
              <Th numeric>1 en N</Th>
              <Th>Categoría</Th>
              <Th>Referencia de premio</Th>
            </tr>
          </thead>
          <tbody>
            {data
              .filter((row) => row.aciertos >= MIN_PRIZE_MATCHES)
              .map((row) => (
                <Tr key={row.aciertos}>
                  <Td numeric className="font-semibold">
                    {row.aciertos}
                  </Td>
                  <Td numeric>{formatPercent(row.teorico)}</Td>
                  <Td numeric>1 en {formatOneIn(row.probabilidad)}</Td>
                  <Td mono={false}>{row.aciertos === 14 ? "Kino" : `Categoría ${15 - row.aciertos}`}</Td>
                  <Td mono={false}>{prizeReference(row.aciertos)}</Td>
                </Tr>
              ))}
          </tbody>
        </DataTable>

        <Note tone="info" className="mt-4">
          Jugando 14 números tu boleto cuesta lo que fije Lotería de Concepción; el pozo y el monto por categoría
          varían en cada sorteo según la recaudación.
        </Note>
      </Card>
    </div>
  );
}

function prizeReference(matches: number): string {
  switch (matches) {
    case 14:
      return "Jackpot (pozo acumulado)";
    case 13:
      return "Premio mayor de categoría (aprox. CLP 20.000.000+)";
    case 12:
      return "Premio intermedio (aprox. CLP 100.000–1.000.000)";
    case 11:
      return "Premio menor (aprox. CLP 20.000–100.000)";
    case 10:
      return "Premio base (aprox. ~CLP 10.000 o equivalente)";
    default:
      return "Sin premio";
  }
}