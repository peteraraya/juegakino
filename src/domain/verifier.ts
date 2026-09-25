import { PICK_SIZE, probabilityAtLeast, probabilityExactMatches } from "./probabilities";
import { countMatches } from "./simulation";

/**
 * Verificador de cartón contra resultados reales (históricos) del Kino.
 *
 * El usuario pega sorteos pasados (14 números por línea) y la app cuenta
 * cuántos aciertos habría tenido su cartón, y si hubiera ganado premio.
 *
 * IMPORTANTE (juego responsable): esto NO predice ni mejora la probabilidad
 * de sorteos futuros — cada sorteo es independiente y equiprobable.
 * Simplemente responde "con este cartón, ¿estos sorteos reales habrían
 * sido premio?".
 */

export interface DrawParseError {
  line: number;
  message: string;
}

export interface DrawParseResult {
  /** Sorteos válidos (14 números distintos en 1..25). */
  draws: number[][];
  /** Líneas que no se pudieron interpretar. */
  errors: DrawParseError[];
}

/** Separa un texto en sorteos: cada línea = un sorteo; separadores espacio o coma. */
export function parseDrawResults(text: string): DrawParseResult {
  const lines = text.split(/\r?\n/);
  const draws: number[][] = [];
  const errors: DrawParseError[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (line === "") continue;

    const tokens = line.split(/[\s,]+/).filter(Boolean);
    if (tokens.length !== PICK_SIZE) {
      errors.push({ line: idx + 1, message: `Se esperaban ${PICK_SIZE} números y hay ${tokens.length}.` });
      continue;
    }

    const numbers: number[] = [];
    let invalid = false;
    for (const token of tokens) {
      if (!/^\d+$/.test(token)) {
        errors.push({ line: idx + 1, message: `"${token}" no es un número.` });
        invalid = true;
        break;
      }
      const n = Number.parseInt(token, 10);
      if (n < 1 || n > 25) {
        errors.push({ line: idx + 1, message: `El número ${n} está fuera de 1..25.` });
        invalid = true;
        break;
      }
      numbers.push(n);
    }
    if (invalid) continue;

    if (new Set(numbers).size !== PICK_SIZE) {
      errors.push({ line: idx + 1, message: "Hay números repetidos en el sorteo. Deben ser 14 distintos." });
      continue;
    }

    draws.push(numbers.sort((a, b) => a - b));
  }

  return { draws, errors };
}

export interface VerificationRow {
  /** Índice 1-based del sorteo en el texto ingresado. */
  drawNumber: number;
  numbers: number[];
  matches: number;
  /** Premio solo si el cartón está completo (14) y alcanza ≥10 aciertos. */
  prize: boolean;
  /** Probabilidad teórica exacta de ese número de aciertos (hipergeométrica). */
  exactProbability: number;
}

export interface VerificationSummary {
  totalDraws: number;
  prizeHits: number;
  bestMatches: number;
  /** Premios esperables por mero azar en esa cantidad de sorteos. */
  expectedPrizesByChance: number;
  /** Premios que habría cobrado el cartón: info por premio no disponible; se usa prizeHits. */
  avgMatches: number;
}

/** Verifica el cartón contra cada sorteo real ingresado. */
export function verifyCarton(carton: number[], draws: number[][]): VerificationRow[] {
  return draws.map((draw, i) => {
    const matches = countMatches(carton, draw);
    return {
      drawNumber: i + 1,
      numbers: draw,
      matches,
      prize: carton.length === PICK_SIZE && matches >= 10,
      exactProbability: probabilityExactMatches(matches),
    };
  });
}

export function summarizeVerification(rows: VerificationRow[]): VerificationSummary {
  const totalDraws = rows.length;
  const prizeHits = rows.filter((r) => r.prize).length;
  const bestMatches = rows.reduce((best, r) => Math.max(best, r.matches), 0);
  const avgMatches = totalDraws > 0 ? rows.reduce((a, r) => a + r.matches, 0) / totalDraws : 0;
  return {
    totalDraws,
    prizeHits,
    bestMatches,
    expectedPrizesByChance: totalDraws * probabilityAtLeast(10),
    avgMatches,
  };
}