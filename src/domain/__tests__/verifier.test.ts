import { describe, expect, it } from "vitest";
import { parseDrawResults, summarizeVerification, verifyCarton } from "@/domain/verifier";

const VALID_LINE = "3 7 9 10 12 13 15 17 18 19 21 22 24 25";
const FULL_CARTON = [1, 2, 3, 5, 7, 9, 12, 14, 17, 19, 21, 23, 24, 25];

describe("parseDrawResults", () => {
  it("parsea sorteos separados por espacios", () => {
    const { draws, errors } = parseDrawResults("1 2 3 4 5 6 7 8 9 10 11 12 13 14");
    expect(draws).toHaveLength(1);
    expect(draws[0]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(errors).toHaveLength(0);
  });

  it("acepta separador coma y espacios mixtos", () => {
    const { draws, errors } = parseDrawResults("1, 2,3,4 5,6 7,8 9,10,11,12,13 14");
    expect(errors).toHaveLength(0);
    expect(draws).toHaveLength(1);
    expect(draws[0]).toHaveLength(14);
  });

  it("ignora líneas en blanco", () => {
    const { draws, errors } = parseDrawResults(`${VALID_LINE}\n\n${VALID_LINE}\n\n`);
    expect(draws).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });

  it("marca error si la línea no tiene 14 números", () => {
    const { draws, errors } = parseDrawResults("1 2 3 4 5 6 7 8 9 10 11 12 13");
    expect(draws).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("14");
  });

  it("marca error si un número está fuera de 1..25", () => {
    const { errors } = parseDrawResults("1 2 3 4 5 6 7 8 9 10 11 12 13 26");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("26");
  });

  it("marca error si hay números repetidos", () => {
    const { errors } = parseDrawResults("1 2 3 4 5 6 7 8 9 10 11 12 13 13");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("repetidos");
  });

  it("marca error si un token no es numérico", () => {
    const { errors } = parseDrawResults("1 2 3 4 5 6 7 8 9 10 11 12 13 x");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("x");
  });

  it("separa sorteos válidos de líneas inválidas", () => {
    const { draws, errors } = parseDrawResults(`${VALID_LINE}\nlínea mala\n${VALID_LINE}`);
    expect(draws).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(2);
  });
});

describe("verifyCarton", () => {
  const completo = FULL_CARTON;
  const drawBuffer = [1, 6, 9, 10, 11, 13, 14, 15, 18, 19, 20, 21, 24, 25];
  it("cuenta aciertos contra un sorteo", () => {
    // válido al completo 14: [1,2,3,5,7,9,12,14,17,19,21,23,24,25] ∩ buffer... solo 1,9,14,19,21,24,25 = 7
    const rows = verifyCarton(completo, [drawBuffer]);
    expect(rows).toHaveLength(1);
    expect(rows[0].matches).toBe(7);
  });

  it("marca premio solo con cartón completo y ≥10 aciertos", () => {
    const coincidencia = [1, 2, 3, 5, 7, 9, 12, 14, 17, 19, 21, 23, 24, 25];
    const rows = verifyCarton(completo, [coincidencia]);
    expect(rows[0].prize).toBe(true);
    const incompleto = [1, 2, 3];
    const rows2 = verifyCarton(incompleto, [coincidencia, drawBuffer]);
    expect(rows2[0].prize).toBe(false);
    expect(rows2[1].prize).toBe(false);
  });

  it("calcula la probabilidad exacta de cada nivel", () => {
    const rows = verifyCarton(completo, [drawBuffer]);
    expect(rows[0].exactProbability).toBeCloseTo(0.2540853, 6);
  });
});

describe("summarizeVerification", () => {
  it("agrega premios, mejores aciertos y promedio", () => {
    const rows = verifyCarton(FULL_CARTON, [
      [1, 2, 3, 5, 7, 9, 12, 14, 17, 19, 21, 23, 24, 25], // 14 aciertos → premio
      [1, 6, 9, 10, 11, 13, 14, 15, 18, 19, 20, 21, 24, 25], // 7 aciertos
    ]);
    const s = summarizeVerification(rows);
    expect(s.totalDraws).toBe(2);
    expect(s.prizeHits).toBe(1);
    expect(s.bestMatches).toBe(14);
    expect(s.avgMatches).toBeCloseTo(10.5, 6);
  });

  it("espera premios proporcionales a la probabilidad teórica", () => {
    const rows = verifyCarton(FULL_CARTON, [
      [1, 6, 9, 10, 11, 13, 14, 15, 18, 19, 20, 21, 24, 25],
    ]);
    const s = summarizeVerification(rows);
    expect(s.expectedPrizesByChance).toBeCloseTo(0.08874, 3);
  });
});