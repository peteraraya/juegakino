# juegaKino — Kino Simulator

SPA de análisis estadístico del **Kino (Lotería de Concepción)** que combina matemática exacta, simulación Monte Carlo con semilla reproducible y herramientas de contraste de resultados reales. Construida para **entender riesgo y recompensa** — no para prometer aciertos.

> **Juego responsable:** cada combinación de 14 números del 1 al 25 tiene exactamente la misma probabilidad de ganar (1/4.457.400). Ninguna estrategia, peso o "tip" la cambia. Esta herramienta es educativa y no implica dinero real.

## Stack

| Capa | Tecnología |
| --- | --- |
| UI | React 19 + TypeScript estricto |
| Build | Vite 6 (Turbopack-ready, target `es2022`) |
| Router | TanStack Router (lazy routes) |
| Estado | Zustand 5 (persistencia en `localStorage`) |
| Estilos | Tailwind CSS 3 + tokens de marca en `tailwind.config.ts` |
| Gráficos | Recharts 3 |
| Validación | Zod 3 |
| Tests | Vitest 3 + Testing Library + jsdom · Playwright (E2E) |

Sin backend: todo corre en el cliente, incluida la simulación en un **Web Worker** (`src/workers/simulation.worker.ts`) para no bloquear la UI.

## Funcionalidades

- **Generador de cartones** — estrategias al azar, hot/cold (por frecuencias observadas), balanceado y números bloqueados; diagnóstico de "estilo" y generación con *tips* del Kino (1 y 25 fijos, separación, rachas, suma, pares, primos, un dígito).
- **Simulador Monte Carlo** — miles de sorteos con PRNG determinista (`mulberry32`) y semilla reproducible; progreso y cancelación; deep-link `?seed=&draws=&pesos=1`; enlace reproducible y exportación CSV.
- **Estadísticas** — probabilidades teóricas vs. frecuencias observadas, histograma de aciertos y aparición por número, y tabla de categorías de premio.
- **Verificador** — contrasta un cartón contra sorteos reales pegados por el usuario (paginación, ordenamiento, exportación CSV) y analiza los tips contra esa historia.
- **Comparador** — genera N cartones y los ordena por puntaje de "estilo" frente a series ganadoras.
- **Pesos de bolillas** — modela el sesgo físico (probabilidad ∝ 1/peso, sorteo ponderado de Efraimidis–Spirakis) y contrasta frecuencias reales contra el modelo uniforme y el ponderado.

## Estructura

```
src/
  app/            # Router y layout raíz
  components/     # UI (grid, toasts, tooltips, onboarding) y Kino
  domain/         # Lógica pura y testeable (PRNG, probabilidad, pesos, tips, análisis)
  hooks/          # useSimulation (Worker)
  lib/            # utilidades (CSV, descargas)
  pages/          # Rutas de nivel 1
  stores/         # Zustand (kinoStore con persist, uiStore)
  workers/        # simulation.worker.ts
e2e/              # Smoke tests de Playwright
```

## Requisitos

- Node.js ≥ 20
- npm ≥ 10

## Uso

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (Vite)
npm run build        # typecheck (tsc -b) + build de producción
npm run preview      # servir el build
npm run lint         # typecheck sin emitir
```

## Testing

```bash
npm test             # unit e integración: Vitest + Testing Library (jsdom)
npm run test:e2e     # smoke E2E: Playwright (Chromium) sobre `vite preview`
npm run test:coverage
```

La primera vez conviene `npx playwright install chromium`. Los tests E2E validan: carga de todas las páginas, generación de cartones, deep-link del simulador y persistencia del cartón tras recargar.

## Capas de datos clave

- `src/domain/ballWeights.ts` — pesos por defecto de las bolillas (kg), validación y sorteo ponderado con keys exponenciales.
- `src/domain/kinoTips.ts` — definiciones de condiciones/tips, umbrales (ideal/aceptable/fuera) y puntaje de estilo (0–100).
- `src/domain/probabilities.ts` — matemática combinatoria del Kino (probabilidades exactas de 0..14 aciertos).

---

**Disclaimer:** Simulación con fines estadísticos y educativos. No garantiza ni predice resultados. Jugar Kino tiene costo real; aquí no se juega con dinero.