import { describe, expect, it } from "vitest";
import {
  EXPECTED_MATCHES,
  MIN_PRIZE_MATCHES,
  TOTAL_COMBINATIONS,
  combinations,
  probabilityAtLeast,
  probabilityExactMatches,
  probabilityTable,
} from "../probabilities";

describe("probabilidades del Kino (hipergeométrica)", () => {
  it("C(25,14) = 4.457.400 combinaciones", () => {
    expect(TOTAL_COMBINATIONS).toBe(4_457_400);
    expect(combinations(25, 14)).toBe(4_457_400);
  });

  it("P(exactamente 14) = 1 / c(25,14)", () => {
    const p = probabilityExactMatches(14);
    expect(p).toBeCloseTo(1 / 4_457_400, 12);
  });

  it("la suma de P(k) para k=0..14 es 1", () => {
    const sum = probabilityTable().reduce((acc, row) => acc + row.probability, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("P(ganar premio, >=10) ~ 8,9% (el hito del negocio)", () => {
    const p = probabilityAtLeast(MIN_PRIZE_MATCHES);
    expect(p).toBeGreaterThan(0.08);
    expect(p).toBeLessThan(0.10);
  });

  it("esperanza de aciertos = 7,84", () => {
    const ex = probabilityTable().reduce((acc, row) => acc + row.matches * row.probability, 0);
    expect(ex).toBeCloseTo(EXPECTED_MATCHES, 6);
    expect(EXPECTED_MATCHES).toBeCloseTo((14 * 14) / 25, 10);
  });

  it("P(>=10) contiene exactamente el 10..14 como premio", () => {
    const table = probabilityTable();
    const prizes = table.filter((r) => r.prize).map((r) => r.matches);
    expect(prizes).toEqual([10, 11, 12, 13, 14]);
  });

  it("combinations(0,0)=1 y casos límite", () => {
    expect(combinations(0, 0)).toBe(1);
    expect(combinations(25, 0)).toBe(1);
    expect(combinations(25, 25)).toBe(1);
    expect(combinations(25, -1)).toBe(0);
    expect(combinations(25, 30)).toBe(0);
  });
});