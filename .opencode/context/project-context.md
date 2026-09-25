# Contexto del Proyecto

Este archivo es la **fuente única de verdad** que todos los agentes (`/agents`) consultan antes de trabajar, y donde el orquestador (`/orchestration`) registra decisiones reutilizables. Se actualiza a medida que el proyecto evoluciona — no es un documento estático de kickoff.

## 1. Visión general del producto

- **Nombre del producto**: Kino Simulator (simulador del juego Kino de Lotería de Concepción)
- **Descripción en una línea**: SPA de simulación estadística del Kino — el juego chileno en el que se eligen 14 números del 1 al 25 y un sorteo extrae 14 bolillas sin reposición — con generador de combinaciones basado en análisis, simulador de sorteos masivos (Monte Carlo) y visualización de resultados y frecuencias.
- **Usuario objetivo**: Jugadores de Kino, analistas aficionados y curiosos que quieren entender riesgos/recompensas y someter combinaciones a millones de sorteos simulados antes de decidir cómo jugar.
- **Problema que resuelve**: Poner números duros y reproducibles tras el análisis del Kino — probabilidades teóricas por categoría de acierto, frecuencias de aparición por número, histogramas de aciertos y comparación empírico vs. teórico — de forma clara y visual, con un simulador masivo que no bloquea la UI.

## 2. Stack técnico confirmado

| Capa | Tecnología | Notas |
|---|---|---|
| Build | Vite 6 + esbuild | SPA estática client-side; sin SSR, sin servidor propio |
| Frontend | React 19 + TypeScript estricto | Sin Next.js, sin Server Components |
| Router | TanStack Router (`src/app/router.tsx`) | Rutas `createRoute`/`createRootRoute` — ver skill `vite-tanstack-tailwind` |
| Datos cliente | **Ninguno de servidor** | No hay API externa ni backend: toda la fuente de datos es la simulación local con PRNG con semilla |
| Estado UI | Zustand (`src/stores/kinoStore.ts`) | Estado UI + configuración de simulación; persistencia parcial en `localStorage` |
| Cómputo intensivo | Web Worker nativo de Vite (`src/workers/simulation.worker.ts`) | Monte Carlo masivo (1K–1M sorteos) fuera del hilo principal, con progreso y cancelación |
| Validación | Zod | `ComboValidator` (14 números, 1–25, únicos), schemas de config y resultados |
| Estilos | Tailwind CSS 3 | Tokens en `/context/design-tokens.md` — ver skill `ui-design-system` |
| Tipografía | Sistema (sans + mono del sistema) | Sin cargas de fuentes externas |
| Visualización | recharts | Frecuencias por número, histograma de aciertos, observado vs. esperado — ver skill `recharts-charts` |
| Testing | Vitest + RTL + jsdom | Unitarios del dominio matemático (deterministas con semilla) + integración de componentes. Sin MSW (no hay red) — ver skill `qa-qc-react-vite` |
| i18n | No aplica | UI monolingüe en español (juego regional) |

## 3. Convenciones del equipo

- **Nomenclatura de ramas**: `main` protegida; `feature/<slug>`, `fix/<slug>`, `chore/<slug>`. Ver `/context/pr-convention.md`.
- **Formato de commits**: Conventional Commits. Ver `/context/pr-convention.md`.
- **Definition of Done**: checklist de cierre por tarea. Ver `/context/definition-of-done.md`.
- **Estructura de carpetas del repo**:
  - `src/app/` — router y layout raíz
  - `src/pages/` — una vista por ruta: Home, Generador, Simulador, Estadísticas
  - `src/components/ui/` — componentes de UI base (variantes por prop, no duplicados)
  - `src/components/kino/` — componentes de dominio (grid de números, bolillas, cartón, tabla de resultados)
  - `src/domain/` — lógica pura del negocio (la capa más testeada del proyecto)
  - `src/workers/`, `src/stores/`, `src/hooks/`, `src/lib/`, `src/types/`, `src/styles/`
- **Idioma del código**: inglés (variables, funciones, commits) / español (comunicación con el usuario y documentación de negocio; la UI de la app es en español).

## 4. Restricciones de negocio conocidas

- **Reglas del juego (no negociables, fuente: reglamento del Kino de Lotería de Concepción)**: el jugador elige exactamente **14 números del 1 al 25**; el sorteo extrae **14 bolillas sin reposición**; premios para **10, 11, 12, 13 y 14 aciertos**; el pozo mayor (14) se acumula si no hay ganador. No se consideran módulos anexos (ReKino, RequeteKino, Chao Jefe, etc.).
- **Honestidad estadística**: ninguna combinación es más probable que otra; el análisis (frecuencias, Monte Carlo) sirve para *comprender riesgo/recompensa y verificar la teoría*, nunca para prometer aciertos. Toda la UI que sugiera "mejores números" lo deja explícito.
- **Determinismo**: toda simulación usa un PRNG con semilla visible/editable; con la misma semilla y configuración se reproduce idéntico resultado (imprescindible para tests y para que el usuario verifique).
- **Simulación intensiva siempre en Web Worker** con progreso y cancelación — nunca bloquear el hilo principal con sorteo masivo.
- **Juego responsable**: la app avisa que jugar tiene costos reales y que la simulación no garantiza resultados; nunca presenta la simulación como un "truco para ganar el Kino".
- **Acentos decorativos solo`kino-red`** (paleta Kino, ver `/context/design-tokens.md`); colores semánticos solo para estado (éxito/error/advertencia/premio).

## 5. Decisiones de arquitectura registradas

El orquestador agrega una entrada aquí cada vez que una tarea produce una decisión reutilizable (patrón adoptado, convención nueva, restricción técnica descubierta). Formato:

```
### [Fecha] Título de la decisión
**Contexto**: por qué surgió
**Decisión**: qué se resolvió
**Agentes afectados**: cuáles deben respetarla
```

### [2026-09-24] Adaptación a juegaKino (perfil B — SPA frontend-only, sin backend)
**Contexto**: el repo `.opencode` venía adaptado a `react-base-app` (portafolio full-stack Vite + NestJS con API propia y consumo de la API pública de GitHub). El nuevo proyecto (Kino Simulator) no tiene backend ni APIs: toda la lógica (probabilidades, Monte Carlo, frecuencias) corre en el cliente.
**Decisión**: se adopta el **perfil B de `/ADAPTING.md`**: se elimina el agente `backend` y las skills `nestjs-secure-backend`, `devops-docker-kubernetes`, `qa-qc-react-nestjs` y `cicd-expert-pipelines`; se revierten los supuestos full-stack en `handoff-protocol.md`, `definition-of-done.md`, `pr-convention.md` y las plantillas de `/specs`; el flujo de feature es `designer → frontend → qa-tester`. La fuente de datos de la app es la simulación local con PRNG con semilla (sin TanStack Query ni MSW).
**Agentes afectados**: designer, frontend, qa-tester, orchestrator.

### [2026-09-24] Identidad visual inspirada en el Kino de Lotería de Chile
**Contexto**: se pidió una dirección visual propia, inspirada en la identidad del Kino oficial (Lotería de Concepción), no en la paleta `blue` del portafolio anterior ni en una identidad "Chiloé".
**Decisión**: la paleta de marca es `kino-red` (rojo coral/carmesí del logotipo Kino) como único acento decorativo, `navy` institucional para superficies oscuras, `gold`/ámbar exclusivo para la semántica de premio/pozo, neutros fríos `gray` y semánticos `green`/`red`/`amber` para estado (el rojo de *error* usa un tono distinto del rojo de marca para no confundir estado con acento). Documentado en `/context/design-tokens.md`.
**Agentes afectados**: designer, frontend, qa-tester.

## 6. Glosario del dominio

Términos específicos del negocio/producto que no son obvios desde el código. Evita que cada agente interprete un concepto de forma distinta.

- **Cartón / boleto**: una elección de 14 números del 1 al 25 marcados por el jugador.
- **Sorteo (draw)**: extracción simulada de 14 bolillas distintas (sin reposición) del universo 1–25.
- **Acierto**: coincidencia de un número del cartón con uno de los números extraídos en el sorteo (0 a 14 posibles).
- **Categoría de premio`: 14 aciertos es el pozo mayor (acumulable); 10–13 son premios secundarios. La app simula el conteo de aciertos por categoría.
- **Monte Carlo / simulación masiva**: repetición de N sorteos para estimar frecuencias empíricas de aciertos y de aparición de números.
- **Semilla (seed)**: valor que inicializa el PRNG; fijarla reproduce la misma secuencia de sorteos (determinismo para tests).
- **Estrategia de generación**: regla para producir un cartón (aleatorio uniforme, ponderado por frecuencia, fríos, balanceado bajo/alto, con números bloqueados).
- **Hot/cold**: números con frecuencia de aparición por encima (hot) o por debajo (cold) de la esperada en la muestra simulada.
- **Probabilidad teórica**: valor exacto calculado con combinatoria (hipergeométrica) — vs. la frecuencia observada en la simulación.

## 7. Proyectos activos

- `juegaKino` — Kino Simulator (repo actual).

Referencias externas (Lotería de Concepción, loteria.cl) se usan solo como reglas del juego documentadas, no como APIs ni datos a consumir.