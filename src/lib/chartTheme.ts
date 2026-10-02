/**
 * Tema compartido de recharts.
 *
 * Existían hex hardcodeados dentro de los componentes (`#E4002B`, `#9ca3af`, `#1f2937`,
 * `#e5e7eb`): `#9ca3af` daba 2.54:1 sobre blanco y era la serie "neutra" de un chart,
 * es decir, un dato que no cumplía WCAG AA. Además los gráficos no seguían el dark mode.
 *
 * Este módulo resuelve los tokens desde las variables CSS del documento, así que los
 * charts heredan el cambio de tema por cascada sin necesidad de JS ni de un toggle.
 */
import { useEffect, useState } from "react";

export interface ChartTheme {
  /** Serie principal: el acento de marca. */
  series: string;
  /** Serie de referencia/esperada: tinta fuerte, nunca gris de bajo contraste. */
  seriesNeutral: string;
  /** Categoría de premio. gold solo sobre navy (design-tokens.md §7). */
  prize: string;
  /** Etiquetas de eje y leyenda (4.54:1+ verificado). */
  axis: string;
  /** Grilla: decorativa, nunca punteada — leería como serie. */
  grid: string;
  /** Fondo del tooltip. */
  surface: string;
  /** Borde del tooltip. */
  border: string;
  /** Texto del tooltip. */
  text: string;
}

const TOKENS: Record<keyof ChartTheme, string> = {
  series: "--accent-fill",
  seriesNeutral: "--ink-700",
  prize: "--gold-300",
  axis: "--ink-500",
  grid: "--line",
  surface: "--surface",
  border: "--line-strong",
  text: "--ink-900",
};

/** Los mismos valores, para cuando no hay DOM (test sin jsdom, o antes de montar). */
const FALLBACK_THEME: ChartTheme = {
  series: "rgb(228 0 43)",
  seriesNeutral: "rgb(68 64 60)",
  prize: "rgb(233 196 106)",
  axis: "rgb(121 113 108)",
  grid: "rgb(231 229 228)",
  surface: "rgb(255 255 255)",
  border: "rgb(214 211 209)",
  text: "rgb(28 25 23)",
};

/** Lee un token `rgb(r g b)` del documento y lo devuelve como `rgb(r g b)`. */
function readToken(name: string, root: HTMLElement): string {
  const value = getComputedStyle(root).getPropertyValue(name).trim();
  return value || "rgb(0 0 0)";
}

function resolveTheme(): ChartTheme {
  if (typeof window === "undefined" || typeof document === "undefined") {
    // SSR / test sin DOM: valores light por defecto.
    return FALLBACK_THEME;
  }
  const root = document.documentElement;
  // Se construye campo a campo en vez de castear: si mañana se agrega una clave a
  // ChartTheme sin pasarla por TOKENS, el error aparece acá y no como un `undefined`
  // silencioso pintado dentro de un chart.
  const resolved: ChartTheme = { ...FALLBACK_THEME };
  for (const key of Object.keys(TOKENS) as (keyof ChartTheme)[]) {
    resolved[key] = readToken(TOKENS[key], root);
  }
  return resolved;
}

/**
 * Hook de tema de gráfico. Re-resuelve cuando cambia el esquema de color del sistema,
 * para que los charts no queden con la paleta del tema anterior tras un flip del SO.
 */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(resolveTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setTheme(resolveTheme());

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return theme;
}

/** Estilo del tooltip. Flota sobre contenido, así que aquí sí hay sombra (única excepción). */
export function tooltipStyle(theme: ChartTheme) {
  return {
    contentStyle: {
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      boxShadow: "0 1px 2px rgb(28 25 23 / 0.06), 0 4px 12px rgb(28 25 23 / 0.08)",
      fontSize: 12,
      color: theme.text,
    },
    labelStyle: { color: theme.text, fontWeight: 500, marginBottom: 4 },
    itemStyle: { color: theme.text, fontVariantNumeric: "tabular-nums" },
  } as const;
}

/** Ejes: sin título redundante, sin línea de eje, con grilla horizontal decorativa. */
export function axisProps(theme: ChartTheme) {
  return {
    tick: { fill: theme.axis, fontSize: 12 },
    tickLine: false,
    axisLine: false,
  } as const;
}