import { describe, expect, it } from "vitest";
import { analyzeDrawsAgainstTips, kinoStyleScore } from "@/domain/kinoTips";
import { analyzeBallEmpirics, relativeSelectionShare } from "@/domain/ballWeights";
import { toCsv } from "@/lib/csv";

describe("kinoStyleScore", () => {
  it("score 100 si todas las condiciones activas son ideales", () => {
    // Suma 174 (aceptable), pares 6 (ideal), 5 de un dígito (ideal).
    const carton = [1, 2, 3, 6, 9, 11, 12, 13, 14, 17, 18, 19, 24, 25];
    const s = kinoStyleScore(carton, ["pares", "unDigito"]);
    expect(s.score).toBe(100);
    expect(s.ideal).toBe(2);
    expect(s.fuera).toBe(0);
  });

  it("todas ideales + una fuera baja el score", () => {
    const carton = [1, 2, 3, 6, 9, 11, 12, 13, 14, 17, 18, 19, 24, 25];
    const s = kinoStyleScore(carton, ["pares", "unDigito", "suma"]);
    // suma 174 → aceptable (1 pt de 2), pares y unDigito → 4 pts; total 5/6.
    expect(s.score).toBe(83); // Math.round(5/6*100)
  });

  it("sin condiciones devuelve 0", () => {
    expect(kinoStyleScore([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], []).score).toBe(0);
  });
});

describe("analyzeDrawsAgainstTips", () => {
  const drawn: number[][] = [
    [1, 2, 3, 6, 9, 11, 12, 13, 14, 17, 18, 19, 24, 25],
    [1, 2, 3, 6, 9, 11, 12, 13, 14, 17, 18, 19, 24, 25],
    [3, 7, 9, 10, 12, 13, 15, 17, 18, 19, 21, 22, 24, 25],
  ];

  it("suma total igual a la cantidad de configuraciones x sorteos", () => {
    const stats = analyzeDrawsAgainstTips(drawn, ["suma", "pares"]);
    expect(stats).toHaveLength(2);
    for (const s of stats) {
      expect(s.idealPct + s.aceptablePct + s.fueraPct).toBeCloseTo(100, 5);
    }
  });

  it("todas las filas reportan cantidad de sorteos analizados", () => {
    const stats = analyzeDrawsAgainstTips(drawn, ["fijos"]);
    expect(stats[0].total).toBe(3);
  });

  it("devolver vacío si no hay sorteos", () => {
    expect(analyzeDrawsAgainstTips([], ["suma"])).toEqual([]);
  });
});

describe("analyzeBallEmpirics", () => {
  it("suma a cuentas igual al total de números ingresados", () => {
    const draws: number[][] = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    ];
    const rows = analyzeBallEmpirics(draws, new Array(25).fill(2.61));
    const total = rows.reduce((a, r) => a + r.observedCount, 0);
    expect(total).toBe(28);
    expect(rows).toHaveLength(25);
  });

  it("desviación 0 si cada bola aparece la misma cantidad de veces", () => {
    // 25 sorteos circulares [i..i+13] mod 25: cada bola aparece exactamente 14 veces.
    const draws: number[][] = Array.from({ length: 25 }, (_, i) =>
      Array.from({ length: 14 }, (_, k) => ((i + k) % 25) + 1),
    );
    const rows = analyzeBallEmpirics(draws, new Array(25).fill(2.61));
    for (const r of rows) {
      expect(r.observedCount).toBe(14);
      expect(r.deviationPct).toBeCloseTo(0, 5);
    }
  });

  it("usa el modelo 1/peso para la columna ponderada", () => {
    const draws: number[][] = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]];
    const liviana = DEFAULT_LIGHT;
    const rows = analyzeBallEmpirics(draws, liviana);
    const shares = relativeSelectionShare(liviana);
    expect(rows[0].weightedSharePct).toBeCloseTo(shares[0] * 100, 5);
  });
});

const DEFAULT_LIGHT = [0.5, ...new Array(24).fill(2.61)];

describe("toCsv", () => {
  it("genera CSV con punto y coma y decimal con coma", () => {
    const csv = toCsv(["A", "B"], [[1, 2.5], ["x;y", 3]]);
    expect(csv).toContain("A;B");
    expect(csv).toContain("1;2,5");
    expect(csv).toContain('"x;y";3');
  });
});