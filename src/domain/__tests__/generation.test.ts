import { describe, expect, it } from "vitest";
import { createPrng } from "../prng";
import { generateBalancedCarton, generateCartonByStrategy } from "../generation";

// Frecuencia modelada por número: los pares (2,4,...,24) son "calientes" (100),
// los impares (1,3,...,25) "fríos" (10).
const FREQ = Array.from({ length: 25 }, (_, i) => (i + 1) % 2 === 0 ? 100 : 10);

describe("generación por estrategia", () => {
  it("hot: el cartón se llena con los números más frecuentes (los pares)", () => {
    const carton = generateCartonByStrategy("hot", 1, FREQ);
    expect(carton).toHaveLength(14);
    expect(new Set(carton).size).toBe(14);
    // Hay exactamente 12 pares "calientes" (frecuencia 100) en 1..25: entran todos.
    const evensIn = FREQ.map((f, i) => (f === 100 ? i + 1 : 0)).filter(Boolean);
    evensIn.forEach((n) => expect(carton).toContain(n));
    // Los 2 restantes son impares (frecuencia 10).
    const evenCount = carton.filter((n) => n % 2 === 0).length;
    expect(evenCount).toBe(12);
  });

  it("cold: se llenan con los menos frecuentes (los impares)", () => {
    const carton = generateCartonByStrategy("cold", 1, FREQ);
    expect(carton).toHaveLength(14);
    const oddsIn = FREQ.map((f, i) => (f === 10 ? i + 1 : 0)).filter(Boolean);
    oddsIn.forEach((n) => expect(carton).toContain(n));
    // Hay 13 impares "fríos": todos entran, más 1 par.
    const evenCount = carton.filter((n) => n % 2 === 0).length;
    expect(evenCount).toBe(1);
  });

  it("balanced reparte: 2 números por cada década (1-5, 6-10, ..., 21-25)", () => {
    const carton = generateBalancedCarton(createPrng(42));
    expect(carton).toHaveLength(14);
    expect(new Set(carton).size).toBe(14);
    for (let d = 0; d < 5; d++) {
      const inDecade = carton.filter((n) => n >= d * 5 + 1 && n <= d * 5 + 5).length;
      expect(inDecade).toBeGreaterThanOrEqual(2);
    }
  });

  it("misma semilla => mismo cartón en cada estrategia", () => {
    for (const strat of ["hot", "cold", "balanced", "random"] as const) {
      expect(generateCartonByStrategy(strat, 99, FREQ)).toEqual(generateCartonByStrategy(strat, 99, FREQ));
    }
  });

  it("distinta semilla => cartón distinto en hot con empates", () => {
    // Con varios números a frecuencia 100, la semilla decide quién entra.
    expect(generateCartonByStrategy("hot", 1, FREQ)).not.toEqual(generateCartonByStrategy("hot", 2, FREQ));
  });

  it("random cae al sorteo puro: 14 distintos", () => {
    const carton = generateCartonByStrategy("random", 7, FREQ);
    expect(carton).toHaveLength(14);
    expect(new Set(carton).size).toBe(14);
  });

  it("sin frecuencias (todo cero) todas las estrategias siguen dando 14 válidos", () => {
    const zeros = Array(25).fill(0);
    for (const strat of ["hot", "cold", "random"] as const) {
      const carton = generateCartonByStrategy(strat, 3, zeros);
      expect(carton).toHaveLength(14);
      expect(new Set(carton).size).toBe(14);
    }
  });
});