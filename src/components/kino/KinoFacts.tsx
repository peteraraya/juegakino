import { KINO_SIZE, probabilityAtLeast, probabilityExactMatches, TOTAL_COMBINATIONS } from "@/domain";
import { StatBlock } from "@/components/ui/Card";

/**
 * Los tres hechos que sostienen todo el producto. `1 / 4.457.400` es la respuesta a la
 * pregunta que el usuario trae al entrar, así que es el único bloque en tono `accent`:
 * si los tresCompiten con el mismo peso, ninguno destaca.
 */
export function KinoFacts() {
  const facts = [
    { label: "Combinaciones posibles", value: TOTAL_COMBINATIONS.toLocaleString("es-CL"), tone: "default" as const },
    { label: "P(14 aciertos)", value: formatPct(probabilityExactMatches(14)), tone: "accent" as const },
    { label: "P(premio, 10 o más)", value: formatPct(probabilityAtLeast(10)), tone: "default" as const },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {facts.map((f) => (
        <StatBlock key={f.label} label={f.label} value={f.value} tone={f.tone} />
      ))}
    </div>
  );
}

function formatPct(p: number): string {
  // p puede ser 1/4_457_400 ≈ 2e-7; mostramos notación razonable.
  return p >= 0.001 ? `${(p * 100).toFixed(2)} %` : `${(p * 100).toFixed(6)} %`;
}

export const KINO_SIZE_INFO = KINO_SIZE;