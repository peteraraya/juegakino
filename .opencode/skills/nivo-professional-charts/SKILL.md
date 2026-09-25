---
name: nivo-professional-charts
description: Guía para crear gráficos profesionales y consistentes con Nivo (@nivo/bar, @nivo/line, @nivo/pie, @nivo/heatmap, etc.) en React/Next.js. Úsala siempre que el usuario pida crear, mejorar o revisar un gráfico/chart con Nivo, configure un tema visual para gráficos, trabaje con datasets grandes que necesiten Canvas, integre Nivo en Next.js (SSR/App Router), o pida dashboards con múltiples visualizaciones. También aplica si menciona "responsive chart", "tooltip personalizado", "leyendas", "accesibilidad en gráficos" o "theme" de Nivo.
---

# Nivo — Gráficos profesionales (2026)

Guía de referencia para generar gráficos con Nivo que se vean profesionales, sean accesibles, consistentes entre sí y no rompan en Next.js/SSR. Genera siempre código completo, listo para copiar, con rutas de archivo exactas.

Nivo son ~30 familias de charts (`@nivo/bar`, `@nivo/line`, `@nivo/pie`, `@nivo/heatmap`, `@nivo/radar`, `@nivo/sankey`, etc.) construidas sobre D3, con render a SVG, Canvas o HTML según el paquete. Instala solo `@nivo/core` + los paquetes específicos que uses, nunca el monorepo completo.

## 1. Elegir el paquete y el renderer correctos

- **SVG (`@nivo/bar`, `@nivo/line`, `@nivo/pie`...)**: default. Mejor para datasets pequeños/medianos (hasta ~1000–2000 puntos), accesibilidad nativa del DOM, animaciones fluidas con `react-spring`.
- **Canvas (`@nivo/bar`'s `ResponsiveBarCanvas`, `@nivo/line`'s `ResponsiveLineCanvas`, `@nivo/scatterplot` canvas)**: usa esta variante cuando el dataset supera ~2000–5000 puntos o hay updates en tiempo real frecuentes. Pierdes accesibilidad DOM nativa (hay que compensar con un resumen textual aparte) pero ganas rendimiento.
- No mezcles el renderer "porque sí": si el dataset es chico, SVG da mejor accesibilidad y DX sin costo real de performance.

```bash
npm install @nivo/core @nivo/bar @nivo/line
```

## 2. Tema centralizado — nunca styles sueltos por gráfico

Todo proyecto con más de un gráfico necesita **un solo objeto de tema** compartido, para que todos los charts se vean consistentes (misma tipografía, misma paleta, mismo estilo de grid/tooltip).

```ts
// lib/charts/nivo-theme.ts
import { Theme } from '@nivo/core';

export const nivoTheme: Theme = {
  background: 'transparent',
  text: {
    fontSize: 12,
    fill: 'var(--color-text-secondary, #52525b)',
    fontFamily: 'inherit',
  },
  axis: {
    domain: { line: { stroke: 'var(--color-border, #e4e4e7)', strokeWidth: 1 } },
    ticks: {
      line: { stroke: 'var(--color-border, #e4e4e7)', strokeWidth: 1 },
      text: { fontSize: 11, fill: 'var(--color-text-tertiary, #71717a)' },
    },
    legend: { text: { fontSize: 12, fontWeight: 600 } },
  },
  grid: { line: { stroke: 'var(--color-border-subtle, #f4f4f5)', strokeWidth: 1 } },
  legends: { text: { fontSize: 12, fill: 'var(--color-text-secondary, #52525b)' } },
  tooltip: {
    container: {
      background: 'var(--color-surface, #ffffff)',
      color: 'var(--color-text, #18181b)',
      fontSize: 12,
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      padding: '8px 12px',
    },
  },
  crosshair: { line: { stroke: 'var(--color-text-tertiary, #71717a)', strokeWidth: 1, strokeOpacity: 0.5 } },
};
```

- Usa variables CSS/design tokens del proyecto (Tailwind) en vez de colores hardcodeados, así el tema respeta modo claro/oscuro automáticamente.
- Paletas de datos (`colors` prop): usa un esquema categórico consistente (`nivo` scheme o una paleta propia de la marca) — no dejes que cada gráfico elija colores al azar; define 1–2 arrays de colores reutilizables en el mismo archivo de tema.

```ts
export const chartColors = {
  categorical: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'],
  sequential: ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#3730a3'],
};
```

## 3. Componente wrapper — no repitas configuración en cada gráfico

Crea un wrapper por tipo de chart que aplique el tema, márgenes consistentes, y defaults sensatos (`animate`, `motionConfig`, `ariaLabel`). El resto del código solo pasa `data` y overrides puntuales.

```tsx
// components/charts/bar-chart.tsx
'use client';
import { ResponsiveBar, BarSvgProps } from '@nivo/bar';
import { nivoTheme, chartColors } from '@/lib/charts/nivo-theme';

type BarChartProps = Omit<BarSvgProps<Record<string, unknown>>, 'theme'> & {
  ariaLabel: string;
};

export function BarChart({ ariaLabel, colors, margin, ...props }: BarChartProps) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ height: 360 }}>
      <ResponsiveBar
        theme={nivoTheme}
        colors={colors ?? chartColors.categorical}
        margin={margin ?? { top: 20, right: 20, bottom: 50, left: 60 }}
        animate
        motionConfig="gentle"
        enableLabel={false}
        {...props}
      />
    </div>
  );
}
```

- El contenedor con altura fija (`style={{ height: ... }}`) es obligatorio: los componentes `Responsive*` de Nivo miden su contenedor padre vía `ResizeObserver` y no tienen altura intrínseca — sin esto, el gráfico no se renderiza o colapsa a 0px.

## 4. Next.js / SSR — evita el error clásico

Los componentes `Responsive*` dependen de medir el DOM (`ResizeObserver`), lo cual no existe en el servidor. En App Router:

- Todo componente que use Nivo va marcado `'use client'` (como en el ejemplo de arriba).
- Si el gráfico está dentro de una ruta con SSR estricto y aparece un flash de layout o error de hidratación, usa `next/dynamic` con `ssr: false` para el wrapper del chart:

```tsx
const BarChart = dynamic(() => import('@/components/charts/bar-chart').then(m => m.BarChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

- Siempre define un `loading`/skeleton con la misma altura del gráfico final para evitar layout shift.

## 5. Accesibilidad — no es opcional

- `role="img"` + `aria-label` descriptivo en el contenedor (ver wrapper arriba) — resume qué muestra el gráfico, no solo "gráfico de barras".
- Para SVG, Nivo soporta `isFocusable` y `ariaLabel`/`ariaLabelledBy` a nivel de elemento individual (barra, punto, slice) — actívalo en gráficos donde cada dato individual importa (ej. dashboards financieros), no en sparklines decorativos.
- Nunca uses solo color para distinguir series si el gráfico puede imprimirse en blanco y negro o el usuario tiene daltonismo: combina con patrones (`defs`/`fill` con `patternLines`), formas de punto distintas, o etiquetas directas.
- Provee siempre una alternativa textual (tabla de datos oculta visualmente o un resumen) para gráficos Canvas, ya que pierden la accesibilidad DOM nativa de SVG.
- Contraste de texto (ejes, leyendas, tooltips) debe cumplir WCAG AA — verifica los colores del tema, no solo los de las series.

## 6. Tooltips y leyendas

- Tooltip custom (prop `tooltip`) en vez del default cuando necesitas mostrar más de un valor o formatear números/moneda/fecha — el default de Nivo es genérico.

```tsx
tooltip={({ id, value, color }) => (
  <div style={{ padding: 8, background: 'var(--color-surface)', borderRadius: 6 }}>
    <strong style={{ color }}>{id}</strong>: {formatCurrency(value)}
  </div>
)}
```

- Formatea siempre números/fechas con `Intl.NumberFormat`/`Intl.DateTimeFormat` (o la utilidad de formato del proyecto) — nunca muestres el valor crudo si representa moneda, porcentaje o fecha.
- Leyendas: si hay más de 6–8 series, no uses leyenda tradicional (se vuelve ilegible) — considera etiquetas directas sobre el gráfico, o un selector interactivo separado del chart para filtrar series.

## 7. Datos — tipado y transformación fuera del componente

- Nunca transformes/agregues datos dentro del JSX del componente de chart. Prepara el shape exacto que Nivo espera en una función pura, testeable por separado (`lib/charts/transform-*.ts`).
- Tipa el dataset explícitamente (con Zod si el dato viene de una API, alineado con el resto del stack) en vez de dejar que Nivo infiera `any`.

```ts
// lib/charts/transform-sales.ts
import { z } from 'zod';

const SalesPointSchema = z.object({ x: z.string(), y: z.number() });
export type SalesPoint = z.infer<typeof SalesPointSchema>;

export function toBarChartData(raw: RawSale[]): SalesPoint[] {
  return raw.map((r) => ({ x: r.month, y: r.total }));
}
```

- Memoiza la transformación (`useMemo`) cuando el dataset es grande o el componente padre re-renderiza seguido, para no recalcular en cada render.

## 8. Performance con datasets grandes

- Sobre ~2000 puntos, cambia a la variante Canvas del mismo paquete (`ResponsiveBarCanvas`, `ResponsiveLineCanvas`) — mismo tema, misma API de datos, solo cambia el renderer.
- Desactiva animaciones (`animate={false}`) en gráficos que se actualizan muy seguido (real-time) — la animación de entrada/salida de cada punto tiene costo acumulado.
- Downsampling/agregación en el backend o en la capa de transformación antes de llegar al chart — no le pidas al navegador que renderice 50k puntos cuando el usuario solo puede distinguir unos cientos visualmente.
- `enableLabel={false}` en gráficos densos (muchas barras/categorías) — las etiquetas se superponen y degradan tanto la legibilidad como el performance de render.

## 9. Consistencia entre gráficos de un mismo dashboard

- Mismo `margin`, misma altura base, mismo `motionConfig` en todos los charts de una vista — usa constantes compartidas, no valores mágicos repetidos por componente.
- Mismo mapeo semántico de color → categoría en todos los gráficos del dashboard (si "Ventas" es azul en un chart, debe ser azul en todos) — centraliza ese mapeo en un solo objeto, no lo definas por gráfico.
- Formato de números/fechas consistente (mismo locale, mismos decimales) en ejes, tooltips y leyendas de todo el dashboard.

## 10. Checklist rápido al generar un gráfico

- [ ] ¿Usa el `nivoTheme` centralizado, no estilos sueltos?
- [ ] ¿El componente está marcado `'use client'` (Next.js App Router)?
- [ ] ¿El contenedor tiene altura fija explícita?
- [ ] ¿Tiene `role="img"` + `aria-label` descriptivo?
- [ ] ¿El dataset viene ya transformado/tipado desde fuera del JSX?
- [ ] ¿El tooltip formatea moneda/fecha/porcentaje correctamente en vez de mostrar el valor crudo?
- [ ] ¿Si el dataset es grande (>2000 puntos), usa la variante Canvas?
- [ ] ¿Los colores de las series son consistentes con el resto del dashboard?
