import { KINO_SIZE, probabilityAtLeast, probabilityExactMatches, TOTAL_COMBINATIONS } from "@/domain";

export function KinoFacts() {
  const facts = [
    { label: "Combinaciones posibles", value: TOTAL_COMBINATIONS.toLocaleString("es-CL") },
    { label: "P(14 aciertos)", value: formatPct(probabilityExactMatches(14)) },
    { label: "P(ganar premio, ≥10)", value: formatPct(probabilityAtLeast(10)) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {facts.map((f) => (
        <div key={f.label} className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{f.label}</p>
          <p className="mt-1 font-mono text-lg font-bold text-kino-red-600">{f.value}</p>
        </div>
      ))}
    </div>
  );
}

function formatPct(p: number): string {
  // p puede ser 1/4_457_400 ≈ 2e-7; mostramos notación razonable.
  return p >= 0.001 ? `${(p * 100).toFixed(2)} %` : `${(p * 100).toFixed(6)} %`;
}

export const KINO_SIZE_INFO = KINO_SIZE;