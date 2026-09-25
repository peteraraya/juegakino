# Plantilla de Especificación de Feature

Usada por el `orchestrator` al iniciar una feature multi-agente, y por `designer`/`frontend` al definir el punto de partida de un handoff (ver `/context/handoff-protocol.md`). Copia esta plantilla a un nuevo archivo por feature dentro de `/specs` (ej. `/specs/kino-simulator.md`) y complétala antes de asignar trabajo a los agentes.

> Adaptado a `juegaKino`: el equipo es `designer`, `frontend`, `qa-tester` — proyecto **frontend-only**, ver `/context/project-context.md` §2 y §4 y `/agents/agents-README.md`. La sección 4 ("Contrato de datos") la define `frontend`: en este proyecto el contrato es de **dominio** (schemas Zod del cartón, config de simulación y resultados en `src/domain/`), NO de API — no hay backend ni APIs externas. No se deja vacía ni se asigna a un agente que no corresponde.

---

## [Nombre de la feature]

**Estado**: `borrador` / `en diseño` / `en desarrollo` / `en QA` / `completa`
**Agentes involucrados**: (ej. designer, frontend, qa-tester)

### 1. Problema y objetivo

- **Problema que resuelve**:
- **Usuario objetivo**:
- **Criterio de éxito** (¿cómo se sabe que funcionó?):

### 2. Alcance

**Incluye**:
-

**No incluye (fuera de alcance para esta iteración)**:
-

### 3. Especificación UX/UI (`designer`)

- **Flujo de usuario** (pasos, en orden):
- **Estados a diseñar**: default / hover / focus / active / disabled / loading / error / vacío
- **Casos de error a contemplar**:
- **Requisitos de accesibilidad específicos** (si hay algo más allá del estándar base):

### 4. Contrato de datos (`frontend` — schema de dominio, no API — ver nota arriba)

```ts
// Esquema Zod de dominio (src/domain/) que define frontend y valida la entrada en el borde.
// NO es un contrato de API: no hay backend. Documentado completo en /specs/[feature].md.
// Ejemplos: Combo (14 números, 1–25, únicos), SimulationConfig (N sorteos, semilla opcional),
// SimulationResult (histograma por categoría, empírico vs. teórico).

// Schema (éxito)
// (type/Zod schema)

// Casos de borde (validación)
// (14 exactos, fuera de rango, repetidos, N extremos, localStorage corrupto, cancelación del worker)
```

- **Reglas de negocio/validación** (reglas del juego: 14/25, premios 10–14 aciertos, sin reposición):
- **Casos límite a contemplar** (cancelación de simulación, N de sorteos extremos, semilla inválida):

### 5. Implementación de UI (`frontend`)

- **Componentes nuevos o modificados**:
- **Estado cliente necesario** (Zustand, persistencia en `localStorage` si aplica) vs. **datos derivados/derivables**:
- **Consumo del contrato**: `frontend` consume/valida con el schema de dominio que él mismo define en `src/domain/` (handoff interno) — la UI no reinventa la validación.
- **Cómputo intensivo**: si la feature corre simulación masiva, va en el Web Worker de simulación (`src/workers/simulation.worker.ts`) con progreso y cancelación — nunca en el hilo principal.
- **Dependencias de visualización** (recharts — ver skill `recharts-charts`; Nivo/Plotly/Leaflet solo a pedido explícito), si aplica:

### 6. Criterios de aceptación (`qa-tester`)

Lista de condiciones verificables, no ambiguas — cada una debe poder convertirse directamente en un test (para el dominio, siempre con PRNG de semilla fija y anclado a valores teóricos conocidos):

- [ ]
- [ ]
- [ ]

**Casos negativos/límite a cubrir explícitamente**:
- [ ]
- [ ]

### 7. Decisiones registradas

Cualquier decisión tomada durante esta feature que deba persistir en `/context/project-context.md`:

-

### 8. Historial de handoffs

| Fecha | De → A | Artefacto | Notas |
|---|---|---|---|
| | | | |
