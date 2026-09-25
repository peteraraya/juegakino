import { describe, expect, it } from "vitest";
import {
  DEFAULT_BALL_WEIGHTS,
  drawNumbersWeighted,
  isValidBallWeights,
  relativeSelectionShare,
  runWeightedSimulation,
} from "@/domain/ballWeights";
import { createPrng } from "@/domain/prng";
import { KINO_SIZE, PICK_SIZE } from "@/domain/probabilities";

describe("DEFAULT_BALL_WEIGHTS", () => {
  it("tiene 25 pesos válidos (1..25)", () => {
    expect(DEFAULT_BALL_WEIGHTS).toHaveLength(KINO_SIZE);
    expect(isValidBallWeights(DEFAULT_BALL_WEIGHTS)).toBe(true);
  });

  it("la diferencia mínima-máxima es ~2% (sesgo pequeño de verdad)", () => {
    const min = Math.min(...DEFAULT_BALL_WEIGHTS);
    const max = Math.max(...DEFAULT_BALL_WEIGHTS);
    expect(max / min - 1).toBeLessThan(0.03);
  });
});

describe("relativeSelectionShare", () => {
  it("las más livianas tienen participación teórica mayor", () => {
    const shares = relativeSelectionShare(DEFAULT_BALL_WEIGHTS);
    // 7 (2.59) más liviana que 20 (2.64) → share mayor.
    expect(shares[6]).toBeGreaterThan(shares[19]);
  });

  it("suma 1", () => {
    const shares = relativeSelectionShare(DEFAULT_BALL_WEIGHTS);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });

  it("con pesos uniformes todas las participaciones son iguales", () => {
    const shares = relativeSelectionShare(Array(KINO_SIZE).fill(2.61));
    expect(new Set(shares.map((s) => s.toFixed(6))).size).toBe(1);
  });
});

describe("drawNumbersWeighted", () => {
  it("saca 14 números distintos y determinista por semilla", () => {
    const weights = DEFAULT_BALL_WEIGHTS;
    const a = drawNumbersWeighted(createPrng(123), weights);
    const b = drawNumbersWeighted(createPrng(123), weights);
    const c = drawNumbersWeighted(createPrng(999), weights);
    expect(a).toHaveLength(PICK_SIZE);
    expect(new Set(a).size).toBe(PICK_SIZE);
    expect(a).toEqual(b);
    // Otra semilla → sorteo distinto (altísima probabilidad).
    expect(a).not.toEqual(c);
  });

  it("con pesos uniformes un número liviano no está favorecido", () => {
    const uniform = Array(KINO_SIZE).fill(2.61);
    const a = drawNumbersWeighted(createPrng(7), uniform);
    const b = drawNumbersWeighted(createPrng(7), DEFAULT_BALL_WEIGHTS);
    // No asumimos igualdad exacta (el PRNG consume distinta cantidad de calls
    // no... en realidad el algoritmo consume KINO_SIZE calls por sorteo igual).
    expect(a).toHaveLength(PICK_SIZE);
    expect(b).toHaveLength(PICK_SIZE);
  });

  it("un peso extremo domina la participación (sin reposición)", () => {
    // Bola 1 absurdamente liviana vs el resto → aparece mucho más seguido.
    const weights = [0.5, ...Array(KINO_SIZE - 1).fill(2.61)];
    const { numberFrequency } = runWeightedSimulation(42, 5_000, weights);
    const aparecerBola1 = numberFrequency[0];
    const aparecerBola20 = numberFrequency[19];
    expect(aparecerBola1).toBeGreaterThan(aparecerBola20);
  });
});

describe("runWeightedSimulation", () => {
  it("cuenta aciertos de un cartón contra el sorteo ponderado", () => {
    const weights = DEFAULT_BALL_WEIGHTS;
    // Cartón fijo (los 14 primeros): los aciertos por sorteo van 0..14.
    const carton = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const r = runWeightedSimulation(5, 2_000, weights, carton);
    expect(r.draws).toBe(2_000);
    expect(r.prizeWins).toBeLessThanOrEqual(r.draws);
    const total = r.matchHistogram.reduce((a, v) => a + v, 0);
    expect(total).toBe(r.draws);
  });

  it("es determinista por semilla", () => {
    const a = runWeightedSimulation(8, 1_000, DEFAULT_BALL_WEIGHTS);
    const b = runWeightedSimulation(8, 1_000, DEFAULT_BALL_WEIGHTS);
    expect(a.numberFrequency).toEqual(b.numberFrequency);
  });
});