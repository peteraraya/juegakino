import { describe, expect, it } from "vitest";
import {
  evaluateKinoTips,
  matchesIdealKinoTips,
  kinoTipsMetrics,
} from "@/domain/kinoTips";
import { iterateAllKinoCartons } from "@/domain/generation";
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

describe("búsqueda de cartones ideales", () => {
  it("rechaza un cartón aceptable que no alcanza el rango ideal", () => {
    expect(matchesIdealKinoTips(GANADORA, ["suma"])).toBe(false);
    expect(matchesIdealKinoTips(GANADORA, ["primos"])).toBe(false);
  });

  it("itera combinaciones válidas sin saltos en el inicio", () => {
    const records = iterateAllKinoCartons();
    expect(records.next().value).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
    expect(records.next().value).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15]);
  });

  it("encuentra un cartón donde todas las condiciones están en ideal", () => {
    let candidate: number[] | undefined;
    for (const record of iterateAllKinoCartons()) {
      if (matchesIdealKinoTips(record, ALL)) {
        candidate = record;
        break;
      }
    }
    expect(candidate).toBeDefined();
    expect(matchesIdealKinoTips(candidate!, ALL)).toBe(true);
  });
});
