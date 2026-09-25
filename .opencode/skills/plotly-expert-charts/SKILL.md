---
name: plotly-expert-charts
description: Guía experta para crear gráficos interactivos y dashboards profesionales con Plotly.js y react-plotly.js en React/Next.js/TypeScript. Úsala siempre que el usuario pida crear, mejorar o revisar un gráfico con Plotly, trabaje con datasets grandes (WebGL/scattergl), necesite gráficos 3D/científicos/financieros (candlestick, contour, heatmap, surface), configure un theme/template compartido, integre Plotly en Next.js (SSR), optimice el bundle size, o pida exportar gráficos a imagen/PDF. También aplica si menciona "plotly", "trace", "layout", "Plotly.react", "scattergl", o "dash" en contexto de gráficos.
---

# Plotly — Gráficos interactivos profesionales (2026)

Guía de referencia para generar gráficos con `react-plotly.js` (wrapper oficial de Plotly.js) que sean interactivos, performantes con datasets grandes, consistentes visualmente y no rompan en Next.js. Genera siempre código completo, listo para copiar, con rutas de archivo exactas.

Plotly.js es la elección correcta cuando el proyecto necesita: interactividad rica out-of-the-box (zoom, pan, hover, selección, range slider), tipos de chart científicos/financieros que otras libs no cubren bien (3D surface, contour, candlestick, sankey, ternary), o WebGL para datasets grandes (`scattergl` maneja hasta ~1M puntos). Si el proyecto es un dashboard SaaS estándar con charts simples y el bundle size es crítico, evalúa si Nivo/Recharts no es más liviano — Plotly sin optimizar bundle puede superar los 3-10MB.

## 1. Instalación y control de bundle size

```bash
npm install react-plotly.js plotly.js
```

- **El default (`import Plotly from 'plotly.js'`) trae TODOS los tipos de trace** — esto es lo que infla el bundle a varios MB. En producción, casi siempre conviene armar un bundle parcial con solo los traces que usas.

```ts
// lib/charts/plotly-custom.ts
import Plotly from 'plotly.js/lib/core';
import bar from 'plotly.js/lib/bar';
import scatter from 'plotly.js/lib/scatter';
import scattergl from 'plotly.js/lib/scattergl';
import heatmap from 'plotly.js/lib/heatmap';

Plotly.register([bar, scatter, scattergl, heatmap]);
export default Plotly;
```

```ts
// components/charts/plot.tsx
'use client';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from '@/lib/charts/plotly-custom';

export const Plot = createPlotlyComponent(Plotly);
```

- Con esto un bundle de traces básicos baja de ~3-10MB a ~1MB. No trates esto como opcional en producción: es la diferencia entre un buen y un mal Core Web Vital de carga inicial.
- Usa `next/dynamic` con `ssr: false` para cargar el componente `Plot` — Plotly.js depende de APIs de navegador (`window`, canvas/WebGL) que no existen en el servidor.

```tsx
const Plot = dynamic(() => import('@/components/charts/plot').then(m => m.Plot), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

## 2. Datos grandes — SVG vs WebGL (scattergl)

- `scatter`/`bar` estándar renderizan a SVG: buena calidad visual, pero degradan por encima de unos miles de puntos, sobre todo con muchas interacciones (tooltips, range slider, anotaciones).
- `scattergl` (WebGL) maneja hasta ~1M puntos manteniendo interactividad fluida — úsalo por defecto para series de tiempo largas, datasets de IoT/logs, o scatterplots exploratorios grandes.
- El salto de performance de WebGL se reduce cuando agregas hover templates custom, anotaciones o range selectors pesados — si necesitas eso sobre un dataset masivo, considera downsamplear antes de graficar (agregación temporal, LTTB) en vez de confiar solo en WebGL.

```tsx
<Plot
  data={[{ type: 'scattergl', mode: 'markers', x, y, marker: { size: 4 } }]}
  layout={layout}
/>
```

- No uses `scattergl` para datasets chicos (<500 puntos) "por si acaso" — WebGL tiene overhead de inicialización y SVG se ve mejor a esa escala.

## 3. Actualizar datos correctamente — el error más común

`Plotly.react` (que usa react-plotly.js internamente) **solo re-renderiza si cambia la identidad de los arrays** (`data`, `layout`) o si `layout.datarevision` cambia. Mutar un array en el mismo lugar (`push`, asignar `data[0].y[3] = ...`) **no dispara un update**, aunque React haya re-renderizado el componente padre.

```tsx
// ❌ mal — mutación in-place, el chart no se actualiza
data[0].y.push(newValue);
setData(data);

// ✅ bien — nuevo array, nueva referencia
setData((prev) => [
  { ...prev[0], y: [...prev[0].y, newValue] },
]);
```

- Alternativa para casos donde inmutabilidad completa es costosa (streams de alta frecuencia): incrementa `layout.datarevision` manualmente para forzar el redraw sin clonar todo el árbol de datos.

```tsx
<Plot data={data} layout={{ ...layout, datarevision: revision }} />
```

- react-plotly.js es un **componente "dumb"**: no persiste el estado de interacción del usuario (zoom, pan) entre updates de props salvo que lo captures explícitamente. Si el usuario hace zoom y luego llega un nuevo dato, el zoom se pierde a menos que sincronices el `layout` vía el callback `onUpdate` o `onRelayout`.

```tsx
const [layout, setLayout] = useState(initialLayout);

<Plot
  data={data}
  layout={layout}
  onUpdate={(figure) => setLayout(figure.layout)}
/>
```

## 4. Template/theme centralizado — consistencia entre gráficos

Plotly soporta `layout.template` como objeto reutilizable — es el equivalente al `theme` de otras libs. Defínelo una vez y aplícalo a todos los charts del proyecto.

```ts
// lib/charts/plotly-template.ts
import { Template } from 'plotly.js';

export const appTemplate: Template = {
  layout: {
    font: { family: 'inherit', size: 12, color: 'var(--color-text-secondary, #52525b)' },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    colorway: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'],
    xaxis: { gridcolor: 'var(--color-border-subtle, #f4f4f5)', zeroline: false },
    yaxis: { gridcolor: 'var(--color-border-subtle, #f4f4f5)', zeroline: false },
    hoverlabel: { bgcolor: 'var(--color-surface, #fff)', bordercolor: 'var(--color-border, #e4e4e7)' },
    margin: { t: 30, r: 20, b: 40, l: 50 },
  },
};
```

```tsx
<Plot data={data} layout={{ template: appTemplate, ...layoutOverrides }} />
```

- Usa variables CSS/design tokens del proyecto en vez de hex hardcodeados, así el template respeta modo claro/oscuro.
- `colorway` centraliza la paleta categórica — no definas colores por trace salvo que el significado semántico lo requiera (ej. rojo=pérdida, verde=ganancia en un dashboard financiero).

## 5. Config — controla qué puede hacer el usuario

El prop `config` (no `layout`) controla la toolbar y el comportamiento de interacción — decide esto de forma explícita, no dejes el default de Plotly (que muestra logo, botones de exportar PNG, etc. que casi nunca quieres en un producto propio).

```tsx
const config: Partial<Plotly.Config> = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  toImageButtonOptions: { format: 'png', filename: 'chart', scale: 2 },
};

<Plot data={data} layout={layout} config={config} style={{ width: '100%', height: '100%' }} />
```

- `responsive: true` + un contenedor padre con altura definida es obligatorio — Plotly no tiene altura intrínseca, igual que otras libs basadas en contenedor medido.
- Para exportar a imagen/PDF programáticamente (no solo el botón de la toolbar): `Plotly.toImage(gd, { format: 'png', width, height, scale })` o `Plotly.downloadImage(...)`.

## 6. Tipos de chart — cuándo usar cada uno

- **`scatter`/`scattergl`**: líneas, dispersión, series de tiempo.
- **`bar`**: comparación categórica; usa `barmode: 'group'|'stack'` explícito, nunca dejes el default sin decidir.
- **`heatmap`**: matrices de correlación, densidad.
- **`candlestick`/`ohlc`**: datos financieros — trae hover y rangeslider financiero nativo, no lo repliques con `bar`+`scatter`.
- **`surface`/`mesh3d`/`scatter3d`**: visualización científica 3D — usa WebGL automáticamente, cuidado con el límite de contextos WebGL simultáneos del navegador (evita más de un puñado de charts 3D en la misma vista).
- **`sankey`**: flujos entre categorías.
- **`contour`**: superficies de densidad 2D.
- No fuerces un tipo de chart genérico (`bar`, `scatter`) para representar algo que Plotly ya modela nativamente (candlestick, sankey) — el trace nativo trae interacciones y semántica de hover correctas que replicar a mano no vale la pena.

## 7. TypeScript

- Tipos oficiales: `@types/plotly.js` (o los que exporta `react-plotly.js` si el proyecto usa una versión reciente que los incluye).
- Tipa explícitamente `data: Partial<Plotly.Data>[]` y `layout: Partial<Plotly.Layout>` — evita `any` en la construcción de traces, sobre todo cuando la data viene transformada desde una API.
- Transforma y valida los datos crudos (idealmente con Zod, alineado al resto del stack) en una función pura separada del componente de chart, igual que con cualquier otra lib de gráficos — nunca arme el array `data` de Plotly inline dentro de un JSX complejo.

```ts
// lib/charts/transform-timeseries.ts
import { z } from 'zod';

const PointSchema = z.object({ date: z.string(), value: z.number() });
export type SeriesPoint = z.infer<typeof PointSchema>;

export function toScatterTrace(points: SeriesPoint[]): Partial<Plotly.Data> {
  return {
    type: 'scattergl',
    mode: 'lines',
    x: points.map((p) => p.date),
    y: points.map((p) => p.value),
  };
}
```

## 8. Accesibilidad

- Plotly no tiene accesibilidad DOM nativa fuerte (renderiza a SVG/Canvas/WebGL según el trace) — provee siempre un resumen textual o tabla de datos alternativa junto al gráfico para lectores de pantalla, especialmente en traces WebGL.
- Envuelve el `Plot` en un contenedor con `role="img"` y `aria-label` descriptivo del insight principal del gráfico, no solo el tipo de chart.
- Verifica contraste de `colorway` contra el fondo (`plot_bgcolor`) — cumple WCAG AA, no confíes en el colorway default de Plotly sin revisarlo contra tu tema.
- No uses solo color para diferenciar series críticas: combina con `line.dash` (sólido/punteado), símbolos de marker distintos, o etiquetas directas.

## 9. Testing

- Extrae toda la lógica de transformación de datos (`toScatterTrace`, agregaciones, downsampling) a funciones puras testeables con Vitest, separadas del componente — el componente de chart en sí no se testea con detalle de renderizado, se testea la data que le llega.
- Para tests de integración/e2e (Playwright), verifica el contrato observable: que el contenedor del chart exista, que el `aria-label` refleje los datos correctos, que los controles de config (`modeBar`) muestren solo los botones esperados — no intentes aserciones sobre el canvas/SVG interno de Plotly.

## 10. Checklist rápido al generar un gráfico

- [ ] ¿El bundle usa `plotly.js/lib/core` + traces registrados explícitamente, no el paquete completo?
- [ ] ¿El componente carga con `next/dynamic` y `ssr: false`?
- [ ] ¿Los updates de datos crean nuevas referencias (o usan `datarevision`), no mutación in-place?
- [ ] ¿Usa el `template` centralizado del proyecto?
- [ ] ¿El `config` desactiva `displaylogo` y define explícitamente los botones de la toolbar?
- [ ] ¿El dataset grande usa `scattergl` en vez de `scatter`?
- [ ] ¿Hay `role="img"` + `aria-label` y alternativa textual para datasets WebGL?
- [ ] ¿La transformación de datos está fuera del JSX, tipada y testeada por separado?
