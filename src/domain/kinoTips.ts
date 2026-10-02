/**
 * Filtros de estilo basados en análisis combinatorio empírico del Kino.
 *
 * Nota honesta (juego responsable): estas condiciones no modifican la
 * probabilidad de ganar — todas las combinaciones de 14 son equiprobables
 * (1/4.457.400). Son criterios observables sobre cartillas ganadoras pasadas
 * (rangos que aparecen con mayor frecuencia) y generan cartones "parecidos"
 * a las series reales, sin aumentar su chance.
 */

export type KinoTipCondition =
  | "fijos"
  | "separacion"
  | "consecutivos"
  | "suma"
  | "pares"
  | "primos"
  | "unDigito";

export interface KinoTipDefinition {
  key: KinoTipCondition;
  label: string;
  shortLabel: string;
  description: string;
}

export const KINO_TIP_DEFS: KinoTipDefinition[] = [
  {
    key: "fijos",
    label: "Fijos 1 y 25",
    shortLabel: "1 y 25 fijos",
    description: "El 1 y el 25 siempre en la cartilla (propuesta base).",
  },
  {
    key: "separacion",
    label: "Separación máx. 3-4",
    shortLabel: "Sep. ≤4",
    description: "Entre dos números elegidos consecutivos, a lo más 3–4 números de por medio.",
  },
  {
    key: "consecutivos",
    label: "Consecutivos 3-5",
    shortLabel: "Consec. 3-5",
    description: "La racha de números seguidos más larga debe ser de 3 a 5 (lo usual 3-4).",
  },
  {
    key: "suma",
    label: "Suma 168-204",
    shortLabel: "Suma 168-204",
    description: "La suma del cartón entre 168 y 204 (85,4% de las ganadoras); ideal 180-192.",
  },
  {
    key: "pares",
    label: "Pares 6-8",
    shortLabel: "Pares 6-8",
    description: "6 pares / 8 impares (lo más frecuente), o 7-7 / 8-6.",
  },
  {
    key: "primos",
    label: "Primos 3-6",
    shortLabel: "Primos 3-6",
    description: "Entre 3 y 6 primos (ideal 4-5). Primos: 2,3,5,7,11,13,17,19,23.",
  },
  {
    key: "unDigito",
    label: "Un dígito 4-6",
    shortLabel: "1 dígito 4-6",
    description: "De 4 a 6 números de un dígito (ideal 5).",
  },
];

export const PRIMOS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);

/** Métricas extraídas de un cartón ordenado. */
export interface KinoTipsMetrics {
  /** Separación máxima: mayor cantidad de números entre dos elegidos consecutivos. */
  maxSeparacion: number;
  /** Largo de la racha más larga de números consecutivos (1 si no hay pares seguidos). */
  maxConsecutivos: number;
  /** Suma de todos los números del cartón. */
  suma: number;
  /** Cantidad de números pares. */
  pares: number;
  /** Cantidad de números primos. */
  primos: number;
  /** Cantidad de números de un dígito (1-9). */
  unDigito: number;
}

export type Status = "ideal" | "aceptable" | "fuera";

export interface KinoTipResult {
  key: KinoTipCondition;
  metric: string;
  status: Status;
}

/** Calcula las métricas de estilo de un cartón. */
export function kinoTipsMetrics(carton: number[]): KinoTipsMetrics {
  const ordenado = [...carton].sort((a, b) => a - b);
  let maxConsecutivos = 1;
  let racha = 1;
  for (let i = 1; i < ordenado.length; i++) {
    if (ordenado[i] === ordenado[i - 1] + 1) {
      racha++;
      maxConsecutivos = Math.max(maxConsecutivos, racha);
    } else {
      racha = 1;
    }
  }
  let maxSeparacion = 0;
  for (let i = 1; i < ordenado.length; i++) {
    // Entre a y b caben (b - a - 1) números; el máximo define la condición.
    maxSeparacion = Math.max(maxSeparacion, ordenado[i] - ordenado[i - 1] - 1);
  }
  return {
    maxSeparacion,
    maxConsecutivos,
    suma: ordenado.reduce((a, b) => a + b, 0),
    pares: ordenado.filter((n) => n % 2 === 0).length,
    primos: ordenado.filter((n) => PRIMOS.has(n)).length,
    unDigito: ordenado.filter((n) => n <= 9).length,
  };
}

/** Evalúa cada condición (presente o no en el cartón) contra las métricas. */
export function evaluateKinoTips(carton: number[], active: KinoTipCondition[]): KinoTipResult[] {
  const m = kinoTipsMetrics(carton);
  const results: KinoTipResult[] = [];
  const has = (k: KinoTipCondition) => active.includes(k);

  if (has("fijos")) {
    const ok = carton.includes(1) && carton.includes(25);
    results.push({ key: "fijos", metric: `${ok ? "1 y 25 presente" : "falta 1 o 25"}`, status: ok ? "ideal" : "fuera" });
  }
  if (has("separacion")) {
    // "Máximo de separación de 3 ó 4 números" es lo más frecuente (74,9%).
    const s = m.maxSeparacion;
    const status: Status = s >= 3 && s <= 4 ? "ideal" : s === 2 || s === 5 ? "aceptable" : "fuera";
    results.push({ key: "separacion", metric: `${s}`, status });
  }
  if (has("consecutivos")) {
    results.push({
      key: "consecutivos",
      metric: `${m.maxConsecutivos}`,
      status:
        m.maxConsecutivos >= 3 && m.maxConsecutivos <= 5
          ? m.maxConsecutivos <= 4
            ? "ideal"
            : "aceptable"
          : "fuera",
    });
  }
  if (has("suma")) {
    results.push({
      key: "suma",
      metric: `${m.suma}`,
      status: m.suma >= 168 && m.suma <= 204 ? (m.suma >= 180 && m.suma <= 192 ? "ideal" : "aceptable") : "fuera",
    });
  }
  if (has("pares")) {
    results.push({
      key: "pares",
      metric: `${m.pares} pares`,
      status: m.pares >= 6 && m.pares <= 8 ? (m.pares === 6 ? "ideal" : "aceptable") : "fuera",
    });
  }
  if (has("primos")) {
    results.push({
      key: "primos",
      metric: `${m.primos} primos`,
      status: m.primos >= 3 && m.primos <= 6 ? (m.primos >= 4 && m.primos <= 5 ? "ideal" : "aceptable") : "fuera",
    });
  }
  if (has("unDigito")) {
    results.push({
      key: "unDigito",
      metric: `${m.unDigito} de 1 dígito`,
      status: m.unDigito >= 4 && m.unDigito <= 6 ? (m.unDigito === 5 ? "ideal" : "aceptable") : "fuera",
    });
  }
  return results;
}

/** Solo acepta cartones donde todas las condiciones activas están en nivel ideal. */
export function matchesIdealKinoTips(carton: number[], active: KinoTipCondition[]): boolean {
  if (active.length === 0) return false;
  const results = evaluateKinoTips(carton, active);
  return results.length === active.length && results.every((result) => result.status === "ideal");
}

/** Total de condiciones activas (para contadores). */
export function countActive(active: KinoTipCondition[]): number {
  return active.length;
}

/**
 * Score de estilo de un cartón: 0–100 según cuántas condiciones activas
 * queden en nivel ideal (2 pts) o aceptable (1 pt). Es purely descriptivo:
 * un score alto NO implica mayor probabilidad de ganar.
 */
export function kinoStyleScore(carton: number[], active: KinoTipCondition[]): { score: number; ideal: number; aceptable: number; fuera: number } {
  if (active.length === 0) return { score: 0, ideal: 0, aceptable: 0, fuera: 0 };
  const results = evaluateKinoTips(carton, active);
  let ideal = 0;
  let aceptable = 0;
  let fuera = 0;
  let pts = 0;
  for (const r of results) {
    if (r.status === "ideal") {
      ideal++;
      pts += 2;
    } else if (r.status === "aceptable") {
      aceptable++;
      pts += 1;
    } else {
      fuera++;
    }
  }
  const score = Math.round((pts / (active.length * 2)) * 100);
  return { score, ideal, aceptable, fuera };
}

export interface TipEmpiricalStats {
  key: KinoTipCondition;
  total: number;
  idealPct: number;
  aceptablePct: number;
  fueraPct: number;
  /** Ejemplo representativo del valor observado (media de la métrica). */
  averageMetric: number | null;
}

/**
 * Cuántos sorteos reales caen en cada nivel de cada condición de estilo.
 * Útil para contrastar los "tips" contra historia real: si el 80%+ de los
 * sorteos cae en "aceptable", la condición describe bien la serie real.
 * Esto documenta tendencias; no hace a una combinación más probable.
 */
export function analyzeDrawsAgainstTips(draws: number[][], active: KinoTipCondition[] = ALL_TIP_CONDITIONS): TipEmpiricalStats[] {
  if (draws.length === 0) return [];
  const perKey = new Map<KinoTipCondition, { ideal: number; aceptable: number; fuera: number; metricSum: number; metricCount: number }>();

  for (const draw of draws) {
    for (const r of evaluateKinoTips(draw, active)) {
      const acc = perKey.get(r.key) ?? { ideal: 0, aceptable: 0, fuera: 0, metricSum: 0, metricCount: 0 };
      acc[r.status]++;
      const numeric = Number.parseFloat(r.metric.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(numeric)) {
        acc.metricSum += numeric;
        acc.metricCount++;
      }
      perKey.set(r.key, acc);
    }
  }

  return active.map((key) => {
    const acc = perKey.get(key) ?? { ideal: 0, aceptable: 0, fuera: 0, metricSum: 0, metricCount: 0 };
    return {
      key,
      total: draws.length,
      idealPct: (acc.ideal / draws.length) * 100,
      aceptablePct: (acc.aceptable / draws.length) * 100,
      fueraPct: (acc.fuera / draws.length) * 100,
      averageMetric: acc.metricCount > 0 ? acc.metricSum / acc.metricCount : null,
    };
  });
}

const ALL_TIP_CONDITIONS: KinoTipCondition[] = [
  "fijos",
  "separacion",
  "consecutivos",
  "suma",
  "pares",
  "primos",
  "unDigito",
];