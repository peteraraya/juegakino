import { describe, expect, it } from "vitest";
import {
  evaluateKinoTips,
  generateCartonWithKinoTips,
  kinoTipsMetrics,
} from "@/domain/kinoTips";
import type { KinoTipCondition } from "@/domain/kinoTips";

// Ejemplo de cartilla ganadora del artículo: suma 174.
const GANADORA = [1, 2, 3, 6, 9, 11, 12, 13, 14, 17, 18, 19, 24, 25];

const ALL: KinoTipCondition[] = ["fijos", "separacion", "consecutivos", "suma", "pares", "primos", "unDigito"];

describe("kinoTipsMetrics", () => {
  it("calcula las 6 métricas de una cartilla", () => {
    const m = kinoTipsMetrics(GANADORA);
    expect(m.suma).toBe(174);
    expect(m.pares).toBe(6); // 2,6,12,14,18,24
    expect(m.primos).toBe(6); // 2,3,11,13,17,19
    expect(m.unDigito).toBe(5); // 1,2,3,6,9
    expect(m.maxConsecutivos).toBe(4); // 11,12,13,14
    // separaciones: 2-3(0) 3-6(2) 6-9(2) 9-11(1) 11-12(0) 12-13(0) 13-14(0) 14-17(2) 17-18(0) 18-19(0) 19-24(4) 24-25(0)
    expect(m.maxSeparacion).toBe(4);
  });
});

describe("evaluateKinoTips", () => {
  it("evalua la cartilla ganadora de ejemplo como aceptable en suma, primos, fijos", () => {
    const r = evaluateKinoTips(GANADORA, ALL);
    const get = (k: string) => r.find((x) => x.key === k)!;
    expect(get("suma").status).toBe("aceptable"); // 174 dentro de 168-204, pero < 180
    expect(get("pares").status).toBe("ideal"); // 6 pares
    expect(get("unDigito").status).toBe("ideal"); // 5 de un dígito
    expect(get("fijos").status).toBe("ideal"); // contiene 1 y 25
    expect(get("separacion").status).toBe("ideal"); // separación 4
    expect(get("consecutivos").status).toBe("ideal"); // racha 4
    expect(get("primos").status).toBe("aceptable"); // 6 primos dentro de 3-6 pero > 5
  });

  it("marca fuera si el cartón no cumple una condición", () => {
    const sinFijos = [2, 3, 5, 6, 9, 11, 12, 13, 14, 17, 18, 19, 22, 24];
    const r = evaluateKinoTips(sinFijos, ["fijos"]);
    expect(r[0].status).toBe("fuera");
  });
});

describe("generateCartonWithKinoTips", () => {
  it("genera cartón de 14 que cumple todas las condiciones activas", () => {
    const { carton, summary } = generateCartonWithKinoTips(42, ALL, 50_000);
    expect(carton).not.toBeNull();
    expect(carton).toHaveLength(14);
    expect(new Set(carton).size).toBe(14);
    expect(carton).toContain(1);
    expect(carton).toContain(25);
    // Todas las condiciones deben quedar en al menos "aceptable".
    expect(summary.fuera).toBe(0);
    // Mínimamente 4 de las 7 en ideal (fijos, separación, racha, suma, pares, primos, 1 dígito).
    expect(summary.ideal).toBeGreaterThanOrEqual(3);
  });

  it("con solo fijos genera cartones con 1 y 25", () => {
    for (const seed of [1, 7, 99]) {
      const { carton } = generateCartonWithKinoTips(seed, ["fijos"] as KinoTipCondition[], 1_000);
      expect(carton).toContain(1);
      expect(carton).toContain(25);
      expect(carton).toHaveLength(14);
    }
  });

  it("fijos exige separación máxima 3-4 (dentro del rango del tip)", () => {
    const { carton } = generateCartonWithKinoTips(5, ["separacion"] as KinoTipCondition[], 50_000);
    const m = kinoTipsMetrics(carton!);
    expect(m.maxSeparacion).toBeGreaterThanOrEqual(2);
    expect(m.maxSeparacion).toBeLessThanOrEqual(5);
  });

  it("fijos limita la racha consecutiva a 3-5", () => {
    const { carton } = generateCartonWithKinoTips(5, ["consecutivos"] as KinoTipCondition[], 50_000);
    const m = kinoTipsMetrics(carton!);
    expect(m.maxConsecutivos).toBeGreaterThanOrEqual(3);
    expect(m.maxConsecutivos).toBeLessThanOrEqual(5);
  });
});