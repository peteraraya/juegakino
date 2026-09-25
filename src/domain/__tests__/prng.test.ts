import { describe, expect, it } from "vitest";
import { createPrng, hashSeed, normalizeSeed } from "../prng";

describe("prng determinista", () => {
  it("reproduce la misma secuencia con la misma semilla", () => {
    const a = createPrng(12345);
    const b = createPrng(12345);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produce valores en [0, 1)", () => {
    const rand = createPrng(1);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("semillas distintas dan secuencias distintas", () => {
    const a = createPrng(1);
    const b = createPrng(2);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("normalizeSeed acepta números y strings idempotentes", () => {
    expect(normalizeSeed(42)).toBe(42);
    expect(normalizeSeed("42")).toBe(normalizeSeed("42"));
    expect(normalizeSeed(42.9)).toBe(42);
    expect(hashSeed("hola")).toBeTypeOf("number");
  });
});