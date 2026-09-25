import { createPrng } from "./prng";
import { KINO_SIZE, PICK_SIZE } from "./probabilities";

/**
 * Núcleo del sorteo: seleccionar `count` bolillas distintas de 1..KINO_SIZE
 * sin reposición, usando el PRNG determinista provisto. El orden del shuffle
 * depende de la semilla — con la misma semilla se reproduce idéntica extracción.
 */
export function drawNumbers(rand: () => number, count: number = PICK_SIZE): number[] {
  // Fisher-Yates parcial sobre el universo 1..25.
  const pool = Array.from({ length: KINO_SIZE }, (_, i) => i + 1);
  for (let i = KINO_SIZE - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

/** Cuenta cuántos números del cartón coinciden con el sorteo. */
export function countMatches(carton: number[], draw: number[]): number {
  const set = new Set(draw);
  return carton.filter((n) => set.has(n)).length;
}

/** Genera un cartón (14 números seleccionados) mediante el PRNG. */
export function generateCarton(seed: number): number[] {
  const rand = createPrng(seed);
  return drawNumbers(rand, PICK_SIZE);
}

export interface SimulationResult {
  /** Número de sorteos simulados. */
  draws: number;
  /** Semilla usada (para reproducibilidad). */
  seed: number;
  /** Frecuencia observada por categoría de acierto (índice = n° aciertos). */
  matchHistogram: number[];
  /** Frecuencia global de al menos MIN_PRIZE_MATCHES aciertos en la muestra. */
  prizeWins: number;
  /** Frecuencia de aparición de cada número del 1..25 en los sorteos. */
  numberFrequency: number[];
}

/**
 * Monte Carlo determinista: corre `draws` sorteos con una semilla fija y
 * agrega histogramas. Pura (sin I/O), pensada para correr en un Web Worker.
 */
export function runSimulation(seed: number, draws: number, carton?: number[]): SimulationResult {
  const rand = createPrng(seed);
  const matchHistogram = new Array<number>(PICK_SIZE + 1).fill(0);
  const numberFrequency = new Array<number>(KINO_SIZE).fill(0);

  let prizeWins = 0;
  for (let i = 0; i < draws; i++) {
    const draw = drawNumbers(rand);
    for (const n of draw) numberFrequency[n - 1]++;

    if (carton) {
      const matches = countMatches(carton, draw);
      matchHistogram[matches]++;
      if (matches >= 10) prizeWins++;
    }
  }

  return {
    draws,
    seed,
    matchHistogram,
    prizeWins,
    numberFrequency,
  };
}