# Protocolo de Handoff entre Agentes

Este documento define **cómo se pasa trabajo de un agente a otro** dentro de un flujo coordinado por el orquestador (`/orchestration/orchestrator.md`). Un handoff mal definido es la causa más común de que dos agentes produzcan resultados incompatibles. Todo handoff sigue este formato — no se pasa trabajo de forma implícita o resumida en prosa.

> Adaptado a `juegaKino`: proyecto **frontend-only** (SPA Vite + React + TanStack Router + Zustand, sin backend ni APIs). El flujo de una feature con UI y datos es `designer → frontend → qa-tester`. El "contrato de datos" de este proyecto son los schemas Zod de dominio (cartón, config de simulación, resultados) que define `frontend` y verifica `qa-tester` — no hay contratos de API porque no hay servidores.

## Estructura de un handoff

```markdown
### Handoff: [Agente origen] → [Agente destino]

**Artefacto entregado**: (qué se produjo — spec, schema de datos, contrato de simulación, componente, suite de tests)

**Contenido**:
(el artefacto completo o la referencia exacta a él — nunca un resumen que omita detalles accionables)

**Restricciones que el agente destino debe respetar**:
- (ej. "el schema Zod del cartón lo valida `frontend` en src/domain — no debe reinterpretarse sin actualizarlo primero")
- (ej. "el estado de error diseñado incluye estos 3 casos, todos deben cubrirse en la UI")

**Pendiente de confirmar** (si aplica):
- (cualquier ambigüedad que el agente destino debe resolver o escalar, no asumir en silencio)
```

## Handoffs típicos del flujo estándar

### 1. `designer` → `frontend`

**Entrega**: especificación de UX/UI — flujo de usuario, wireframe/mockup (o descripción visual detallada si no hay render), estados completos del componente (default/hover/focus/loading/error/vacío), valores exactos de diseño (espaciado, color del acento `kino-red`, tipografía), y el comportamiento del grid de números (25 celdas, máx. 14, feedback de selección).

**Restricción clave**: `frontend` no reinterpreta ni simplifica los estados definidos por `designer` sin señalarlo — si un estado es técnicamente costoso de implementar, se reporta como conflicto al orquestador, no se omite silenciosamente.

### 2. `frontend` → `qa-tester` (implementación + dominio)

**Entrega (implementación)**: componentes/hooks implementados (incluidos los de la simulación vía Web Worker), más los casos límite ya identificados durante la implementación.

**Entrega (dominio)**: las funciones puras de `src/domain/` (probabilidades, PRNG, sorteos, frecuencias, estrategias, agregación) con sus valores teóricos de anclaje (ej. P(14 aciertos)=1/C(25,14), media de aciertos→7,84) para que `qa-tester` verifique la corrección matemática, no solo que "no revienta".

**Restricción clave**: `qa-tester` no se limita a los casos que el agente señaló — los toma como punto de partida, no como el universo completo de casos a cubrir. Verifica la matemática contra valores teóricos conocidos y los tests usan siempre PRNG con semilla fija.

### 3. Contrato de dominio (schemas Zod de `src/domain/`)

**Aplica cuando**: una feature introduce o cambia un schema de validación de dominio — el cartón (14 números del 1 al 25, únicos), la config de simulación (N de sorteos en rango, semilla opcional) o el shape de resultados.

**Entrega**: el schema Zod exacto (definido por `frontend` en `src/domain/`), los tipos derivados, y los casos de borde conocidos (14 exactos, números fuera de rango, repetidos, N extremos).

**Restricción clave**: ese schema es la fuente de verdad para la validación de la UI **y** para los tests de `qa-tester` — si se cambia, se actualizan los tests que lo fijan, no se adivina un shape distinto en cada lado.

### 4. `qa-tester` → `frontend` o `designer` (hallazgo de bug o gap)

**Entrega**: reporte estructurado (pasos para reproducir — incluida la semilla si aplica —, esperado vs. actual, severidad) dirigido específicamente al agente responsable del artefacto donde está el gap — `frontend` si es de implementación o de matemática, `designer` si el gap es que un estado nunca fue especificado.

**Restricción clave**: el hallazgo no se cierra hasta que el agente responsable confirma el fix y `qa-tester` valida con un test de regresión — no se da por resuelto solo porque se corrigió el código.

## Reglas generales

- **El artefacto de un handoff es siempre concreto y completo** — contrato real, schema real, código real, especificación real. Nunca "el componente debería tener algo como..." sin la definición exacta.
- **Toda restricción no respetada se reporta como conflicto al orquestador**, no se resuelve unilateralmente entre dos agentes sin que quede registrado.
- **Un handoff que introduce una convención reutilizable** (ej. un patrón de simulación determinista adoptado, un patrón de manejo de errores del worker) se registra en `/context/project-context.md`, sección "Decisiones de arquitectura registradas" — para que el próximo flujo no tenga que redescubrirlo.
- Un contrato de dominio desactualizado es peor que no tener contrato, porque genera falsa confianza — el schema y sus tests se actualizan en el mismo PR que el código.