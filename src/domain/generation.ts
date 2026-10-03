import { createPrng } from "./prng";
import { KINO_SIZE, PICK_SIZE } from "./probabilities";
import { CartonSchema } from "./schemas";
import type { GenerationStrategy } from "./schemas";
import { drawNumbers } from "./simulation";

/** Recorre el espacio completo de cartones sin materializarlo en memoria. */
export function* iterateAllKinoCartons(startAt?: number[]): Generator<number[]> {
  if (startAt) CartonSchema.parse(startAt);
  const carton = startAt
    ? [...startAt].sort((a, b) => a - b)
    : Array.from({ length: PICK_SIZE }, (_, index) => index + 1);
  const start = [...carton];

  while (true) {
    yield [...carton];

    let index = PICK_SIZE - 1;
    while (index >= 0 && carton[index] === KINO_SIZE - PICK_SIZE + index + 1) index--;
    if (index < 0) {
      for (let next = 0; next < PICK_SIZE; next++) carton[next] = next + 1;
    } else {
      carton[index]++;
      for (let next = index + 1; next < PICK_SIZE; next++) {
        carton[next] = carton[next - 1] + 1;
      }
    }

    if (carton.every((number, position) => number === start[position])) return;
  }
}

/**
 * Generación de cartones por estrategia.
 *
 * Las estrategias hot/cold usan el arreglo de frecuencias observadas
 * (`numberFrequency`, largo 25, índice = número - 1). Sin frecuencias no hay
 * "calientes" ni "fríos": la UI las obtiene de una simulación previa (si no
 * hay, corre una breve de base). Todo determinista por semilla (PRNG
 * mulberry32).
 */

/**
 * Cartón "balanceado": dos números por cada década (1-5, 6-10, 11-15, 16-20,
 * 21-25) y los 4 restantes repartidos uno por década — evita cartones
 * agrupados en un solo tramo del 1..25.
 */
export function generateBalancedCarton(rand: () => number, count: number = PICK_SIZE): number[] {
  const decades: number[][] = [];
  for (let d = 0; d < 5; d++) {
    const decade = Array.from({ length: 5 }, (_, i) => d * 5 + i + 1);
    // Fisher-Yates determinista para variar el orden interno con la semilla.
    for (let i = decade.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [decade[i], decade[j]] = [decade[j], decade[i]];
    }
    decades.push(decade);
  }

  const picks: number[] = [];
  for (const decade of decades) picks.push(decade[0], decade[1]); // base: 2 por década

  let decadeIdx = 0;
  let offset = 2;
  while (picks.length < count) {
    if (offset < decades[decadeIdx].length) picks.push(decades[decadeIdx][offset]);
    decadeIdx = (decadeIdx + 1) % 5;
    if (decadeIdx === 0) offset++;
  }

  return picks.sort((a, b) => a - b);
}

/**
 * Ordena 1..25 por frecuencia y toma el extremo pedido. Los empates de
 * frecuencia se desempatan por semilla (Fisher-Yates interno) para que dos
 * generaciones con la misma estrategia pero distinta semilla varíen, sin
 * alterar cuáles son los "más/menos frecuentes".
 */
function pickByFrequency(
  rand: () => number,
  freq: number[],
  mode: "hot" | "cold",
  count: number = PICK_SIZE,
): number[] {
  const entries = Array.from({ length: KINO_SIZE }, (_, i) => i + 1).map((n) => ({ n, f: freq[n - 1] }));
  entries.sort((a, b) => {
    if (a.f !== b.f) return mode === "hot" ? b.f - a.f : a.f - b.f;
    return a.n - b.n;
  });

  // Shuffle por grupos de frecuencia idéntica: reordena el tie-break con la
  // semilla pero conserva la jerarquía (los de mayor frecuencia siguen al frente).
  let i = 0;
  while (i < entries.length) {
    let j = i;
    while (j + 1 < entries.length && entries[j + 1].f === entries[i].f) j++;
    for (let k = j; k > i; k--) {
      const swap = i + Math.floor(rand() * (k - i + 1));
      [entries[k], entries[swap]] = [entries[swap], entries[k]];
    }
    i = j + 1;
  }

  return entries
    .slice(0, count)
    .map((e) => e.n)
    .sort((a, b) => a - b);
}

/** Genera un cartón según la estrategia y una semilla. hot/cold requieren `freq`. */
export function generateCartonByStrategy(
  strategy: GenerationStrategy,
  seed: number,
  freq: number[],
): number[] {
  const rand = createPrng(seed);
  switch (strategy) {
    case "balanced":
      return generateBalancedCarton(rand);
    case "hot":
      return pickByFrequency(rand, freq, "hot");
    case "cold":
      return pickByFrequency(rand, freq, "cold");
    case "random":
    default:
      return drawNumbers(rand);
  }
}