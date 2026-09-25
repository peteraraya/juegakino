import { describe, expect, it } from "vitest";
import { createPrng } from "../prng";
import { KINO_SIZE, PICK_SIZE } from "../probabilities";
import { countMatches, drawNumbers, generateCarton, runSimulation } from "../simulation";

describe("simulación determinista", () => {
  it("sorteo extrae 14 bolillas distintas en 1..25", () => {
    const rand = createPrng(7);
    const draw = drawNumbers(rand);
    expect(draw).toHaveLength(PICK_SIZE);
    expect(new Set(draw).size).toBe(PICK_SIZE);
    draw.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(KINO_SIZE);
    });
  });

  it("misma semilla => mismo sorteo", () => {
    const a = drawNumbers(createPrng(99));
    const b = drawNumbers(createPrng(99));
    expect(a).toEqual(b);
  });

  it("countMatches cuenta intersección", () => {
    expect(countMatches([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(10);
    expect(countMatches([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [25])).toBe(0);
  });

  it("generateCarton entrega 14 números", () => {
    const carton = generateCarton(2026);
    expect(carton).toHaveLength(PICK_SIZE);
    expect(new Set(carton).size).toBe(PICK_SIZE);
  });

  it("Monte Carlo: la frecuencia de premios converge hacia el teórico", () => {
    const draws = 200_000;
    const carton = generateCarton(1234);
    const result = runSimulation(1234, draws, carton);
    // 200k sorteos: si entre ~17.8k esperados de premios (~8.9%), tolerancia relativa 2%.
    const pObserved = result.prizeWins / draws;
    const pTheoretical = 0.089;
    expect(Math.abs(pObserved - pTheoretical) / pTheoretical).toBeLessThan(0.02);
    expect(result.draws).toBe(draws);
  });

  it("cada número aparece ~ la misma cantidad de veces (equiprobabilidad)", () => {
    const draws = 50_000;
    const result = runSimulation(555, draws);
    const expectedPerNumber = (draws * PICK_SIZE) / KINO_SIZE; // 28000
    for (const freq of result.numberFrequency) {
      expect(Math.abs(freq - expectedPerNumber) / expectedPerNumber).toBeLessThan(0.05);
    }
  });

  it("histograma con cartón evaluado", () => {
    const result = runSimulation(42, 10_000, generateCarton(42));
    const total = result.matchHistogram.reduce((a, v) => a + v, 0);
    expect(total).toBe(10_000);
    expect(result.prizeWins).toBeGreaterThanOrEqual(0);
  });
});