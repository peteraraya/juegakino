import { createPrng } from "./prng";
import { KINO_SIZE, PICK_SIZE } from "./probabilities";

/**
 * Pesos de las bolillas del 1..25 (en kg) y sorteo ponderado para el
 * simulador.
 *
 * El modelo físico de una máquina de aire es: cada bolilla sube con
 * probabilidad ~inversa a su peso (las más livianas se elevan un pelín
 * más fácil). Bajo ese modelo, la "probabilidad de aparición" de la bolilla i
 * es proporcional a 1/peso_i. Con los pesos oficiales la diferencia es
 * ínfima (~0,05 kg sobre ~2,6 kg ≈ 2%), por lo que el sesgo es negligible —
 * se modela para que el usuario lo pueda observar, no para apostar con él.
 */

/** Pesos de referencia (kg) — datos entregados por el usuario, bola 1..25. */
export const DEFAULT_BALL_WEIGHTS: number[] = [
  2.61, 2.61, 2.6, 2.6, 2.6, 2.61, 2.59, 2.6, 2.59, 2.62,
  2.61, 2.59, 2.59, 2.6, 2.61, 2.6, 2.61, 2.62, 2.61, 2.64,
  2.64, 2.62, 2.61, 2.59, 2.61,
];

/** Rango válido para editar un peso (kg). Fuera de él, valores absurdos. */
export const BALL_WEIGHT_MIN = 0.5;
export const BALL_WEIGHT_MAX = 10;

/** Peso uniforme de referencia si no se aplica el modelo (≈ 2,61 kg). */
export const UNIFORM_BALL_WEIGHT = 2.61;

export type BallWeights = number[];

export function isValidBallWeights(weights: number[]): weights is BallWeights {
  return (
    weights.length === KINO_SIZE &&
    weights.every((w) => Number.isFinite(w) && w >= BALL_WEIGHT_MIN && w <= BALL_WEIGHT_MAX)
  );
}

/**
 * Participación teórica de cada bolilla bajo el modelo (∝ 1/peso), normalizada
 * a fracción de 1. Determinista y pura: sirve para mostrar el sesgo en UI.
 */
export function relativeSelectionShare(weights: number[]): number[] {
  const inv = weights.map((w) => (w > 0 ? 1 / w : 0));
  const sum = inv.reduce((acc, v) => acc + v, 0) || 1;
  return inv.map((v) => v / sum);
}

/**
 * Sorteo de `count` bolillas SIN reposición con selección ∝ 1/peso.
 *
 * Método de keys exponenciales (Efraimidis–Spirakis): para cada bolilla se
 * genera `u^(peso)` con `u` del PRNG y se toman las `count` keys más grandes.
 * - Con pesos iguales queda un orden uniforme (mismo comportamiento que el
 *   sorteo plano).
 * - Es determinista por semilla (usa `createPrng`), igual que `drawNumbers`.
 */
export function drawNumbersWeighted(rand: () => number, weights: number[], count: number = PICK_SIZE): number[] {
  const entries = Array.from({ length: KINO_SIZE }, (_, i) => {
    const w = weights[i] > 0 ? weights[i] : UNIFORM_BALL_WEIGHT;
    let u = rand();
    if (u === 0) u = Number.MIN_VALUE;
    return { n: i + 1, key: Math.pow(u, w) };
  });
  entries.sort((a, b) => b.key - a.key);
  return entries
    .slice(0, count)
    .map((e) => e.n)
    .sort((a, b) => a - b);
}

/**
 * Monte Carlo ponderado (mismo contrato que `runSimulation` pero usando
 * `drawNumbersWeighted`). Puro y determinista por semilla.
 */
export function runWeightedSimulation(
  seed: number,
  draws: number,
  weights: number[],
  carton?: number[],
): {
  draws: number;
  seed: number;
  matchHistogram: number[];
  prizeWins: number;
  numberFrequency: number[];
} {
  const rand = createPrng(seed);
  const matchHistogram = new Array<number>(PICK_SIZE + 1).fill(0);
  const numberFrequency = new Array<number>(KINO_SIZE).fill(0);
  let prizeWins = 0;

  for (let i = 0; i < draws; i++) {
    const draw = drawNumbersWeighted(rand, weights);
    for (const n of draw) numberFrequency[n - 1]++;
    if (carton) {
      const set = new Set(draw);
      const matches = carton.filter((n) => set.has(n)).length;
      matchHistogram[matches]++;
      if (matches >= 10) prizeWins++;
    }
  }

  return { draws, seed, matchHistogram, prizeWins, numberFrequency };
}

export interface BallEmpiricalRow {
  ball: number;
  weightKg: number;
  /** Apariciones reales acumuladas de la bolilla en los sorteos pegados. */
  observedCount: number;
  /** Frecuencia observada (share normalizado, %). */
  observedSharePct: number;
  /** Share esperado si fuera uniforme (100/KINO_SIZE). */
  uniformSharePct: number;
  /** Share esperado bajo el modelo 1/peso con estos pesos. */
  weightedSharePct: number;
  /** Desviación observada vs share uniforme (puntos porcentuales). */
  deviationPct: number;
}

/**
 * Frecuencia empírica de cada bolilla en un conjunto de sorteos reales,
 * comparada contra el modelo uniforme y contra el modelo 1/peso.
 *
 * Pura y sin I/O. Los `draws` son líneas de 14 números (ya parseadas).
 */
export function analyzeBallEmpirics(draws: number[][], weights: number[]): BallEmpiricalRow[] {
  const observedCount = new Array<number>(KINO_SIZE).fill(0);
  for (const draw of draws) for (const n of draw) observedCount[n - 1]++;

  const total = observedCount.reduce((a, b) => a + b, 0) || 1;
  const weightedShare = relativeSelectionShare(weights);
  return Array.from({ length: KINO_SIZE }, (_, i) => {
    const observedSharePct = (observedCount[i] / total) * 100;
    const uniformSharePct = (1 / KINO_SIZE) * 100;
    const weightedSharePct = weightedShare[i] * 100;
    return {
      ball: i + 1,
      weightKg: weights[i],
      observedCount: observedCount[i],
      observedSharePct,
      uniformSharePct,
      weightedSharePct,
      deviationPct: observedSharePct - uniformSharePct,
    };
  });
}