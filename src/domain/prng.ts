/**
 * PRNG determinista (mulberry32) y utilidades de semilla.
 *
 * Fijar la semilla reproduce exactamente la misma secuencia de sorteos:
 * imprescindible para tests y para que el usuario verifique un resultado.
 * El determinismo es una restricción de negocio de juegaKino
 * (ver `/context/project-context.md` §4).
 */

export function hashSeed(input: string): number {
  // FNV-1a de 32 bits sobre la string de la semilla → número entero.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: RNG de 32 bits de David Bau, determinista por semilla. */
export function createPrng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla normalizada a un entero 0..2^32-1 usable por mulberry32. */
export function normalizeSeed(seed: number | string): number {
  if (typeof seed === "string") return hashSeed(seed);
  return Math.floor(seed) >>> 0;
}

/** Semilla aleatoria criptográfica (32 bits). Para variar la simulación. */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] >>> 0;
}