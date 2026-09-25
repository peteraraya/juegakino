/**
 * Probabilidad teórica (matemática exacta) del Kino.
 *
 * Modelo: el jugador elige 14 números de 1..25 (el cartón) y el sorteo
 * extrae 14 bolillas de 1..25 sin reposición. El número de aciertos sigue
 * una distribución hipergeométrica:
 *
 *   P(K = k) = C(14, k) * C(11, 14 - k) / C(25, 14)
 *
 * donde 14 son los elegidos, 11 los no elegidos, y 14 las bolillas extraídas.
 * P(K >= 10) es la probabilidad global de ganar premio (10–14 aciertos).
 */

export const KINO_SIZE = 25;
export const PICK_SIZE = 14;
export const MIN_PRIZE_MATCHES = 10;

/** Combinatoria C(n, k) — entrada pequeña, resultado exacto (<=4.5M). */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const top = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= top; i++) {
    num *= n - top + i;
    den *= i;
  }
  return num / den;
}

/** Probabilidad de exactamente `matches` aciertos (hipergeométrica). */
export function probabilityExactMatches(matches: number): number {
  return (
    (combinations(PICK_SIZE, matches) * combinations(KINO_SIZE - PICK_SIZE, PICK_SIZE - matches)) /
    combinations(KINO_SIZE, PICK_SIZE)
  );
}

/** Probabilidad de al menos `min` aciertos (10–14 en producción). */
export function probabilityAtLeast(min: number): number {
  if (min < 0 || min > PICK_SIZE) return 0;
  let acc = 0;
  for (let k = min; k <= PICK_SIZE; k++) acc += probabilityExactMatches(k);
  return acc;
}

export interface ProbabilityTableRow {
  matches: number;
  probability: number;
  prize: boolean;
}

/** Tabla completa de probabilidades por categoría de acierto (0..14). */
export function probabilityTable(): ProbabilityTableRow[] {
  return Array.from({ length: PICK_SIZE + 1 }, (_, matches) => ({
    matches,
    probability: probabilityExactMatches(matches),
    prize: matches >= MIN_PRIZE_MATCHES,
  }));
}

/** Número total de combinaciones de cartón: C(25, 14) = 4.457.400. */
export const TOTAL_COMBINATIONS: number = combinations(KINO_SIZE, PICK_SIZE);

/** Valor esperado de aciertos por cartón: 14 * 14 / 25 = 7.84. */
export const EXPECTED_MATCHES: number = (PICK_SIZE * PICK_SIZE) / KINO_SIZE;