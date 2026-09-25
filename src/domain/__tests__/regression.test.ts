import { describe, expect, it } from "vitest";
import { generateCartonByStrategy } from "@/domain/generation";
import { runSimulation } from "@/domain/simulation";
import { parseDrawResults, verifyCarton } from "@/domain/verifier";

// Misma muestra que usa la UI (SAMPLE_DRAWS).
const SAMPLE = [
  "3 7 9 10 12 13 15 17 18 19 21 22 24 25",
  "1 2 5 8 9 11 12 14 15 16 18 20 23 24",
  "4 6 7 8 10 11 13 14 17 19 21 22 23 25",
].join("\n");

describe("reproducción verificación con frecuencias realistas", () => {
  it("cartón hot/cold (frecuencias de simulación real) vs sorteos: nunca 14 salvo idéntico", () => {
    const freq = runSimulation(12345, 200_000).numberFrequency;
    for (const strategy of ["random", "balanced", "hot", "cold"] as const) {
      const carton = generateCartonByStrategy(strategy, 999, freq);
      expect(carton).toHaveLength(14);
      const { draws, errors } = parseDrawResults(SAMPLE);
      expect(errors).toHaveLength(0);
      const rows = verifyCarton(carton, draws);
      for (const r of rows) {
        if (r.matches === 14) {
          // Solo es legítimo si el sorteo ES el cartón.
          expect(r.numbers).toEqual(carton);
        }
      }
    }
  });

  it("cartones distintos arrojan aciertos distintos", () => {
    const freq = runSimulation(54321, 200_000).numberFrequency;
    const c1 = generateCartonByStrategy("cold", 1, freq);
    const c2 = generateCartonByStrategy("hot", 2, freq);
    const { draws } = parseDrawResults(SAMPLE);
    const m1 = verifyCarton(c1, draws).map((r) => r.matches);
    const m2 = verifyCarton(c2, draws).map((r) => r.matches);
    expect(m1.join()).not.toBe(m2.join());
  });

  it("un cartón completo con todos los 25 números daría 14 en todo sorteo (el síntoma real)", () => {
    const cartonCompleto = Array.from({ length: 25 }, (_, i) => i + 1);
    const { draws } = parseDrawResults(SAMPLE);
    const rows = verifyCarton(cartonCompleto, draws);
    for (const r of rows) expect(r.matches).toBe(14);
  });
});