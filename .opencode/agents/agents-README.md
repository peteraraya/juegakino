# `/agents` — Índice del equipo

Cada archivo en esta carpeta define la personalidad y las pautas operativas de un agente especializado. Todos comparten estructura (identidad, tono, dominio técnico, uso autónomo de `/skills`, estándar de entrega, autonomía operativa) y están coordinados por `/orchestration/orchestrator.md`.

## Agentes

| Archivo | Rol | Cuándo invocarlo directamente |
|---|---|---|
| [`orchestrator.md`](../orchestration/orchestrator.md) | Tech lead / coordinador | Cuando la tarea no está claramente acotada a un solo dominio, o involucra a más de un agente en secuencia |
| [`frontend.md`](./frontend.md) | Ingeniero Senior de Frontend (React/TanStack/Vite) | Componentes, estado cliente (Zustand), ruteo, lógica de dominio, visualización de datos, Web Worker de simulación |
| [`designer.md`](./designer.md) | Diseñador Senior UX/UI | Flujo de usuario, sistema de diseño, especificación de estados, accesibilidad |
| [`qa-tester.md`](./qa-tester.md) | QA Engineer Senior | Estrategia de testing, automatización, reportes de bugs, gates de calidad |

Para una tabla de responsabilidades más detallada (qué SÍ y qué NO le corresponde a cada uno) y la matriz de decisión "¿a quién le corresponde esto?", ver [`/roles/roles-matrix.md`](../roles/roles-matrix.md).

### Cómo se relacionan los agentes entre sí

Ningún agente memoriza las mejores prácticas de su dominio — las consulta en `/skills` de forma autónoma cuando la tarea las activa. Ver el índice completo en [`/skills/skills-README.md`](../skills/skills-README.md).

Además de `/skills`, los agentes consultan `/context` antes de empezar cualquier tarea: `project-context.md` (convenciones y decisiones del proyecto), `design-tokens.md` (acento `kino-red` de marca y tokens semánticos — fuente de verdad para `designer` y `frontend`), `handoff-protocol.md` (cómo se pasa trabajo de un agente a otro) y, si existe, `definition-of-done.md` para saber cuándo una entrega está realmente completa.

## Nota de alcance del proyecto

Este equipo está configurado para **`juegaKino` (Kino Simulator), un proyecto frontend-only**: SPA con **Vite + React 19 + TanStack Router + Zustand** (sin backend, sin Next.js, sin SSR, sin APIs externas) cuyo dominio es la **simulación estadística del Kino** (elegir 14 de 25; Monte Carlo con PRNG con semilla; frecuencias y probabilidades). Por eso el equipo **no tiene agente `backend`** — no es full-stack, toda la lógica corre en el cliente.

## Convención al agregar un nuevo agente

1. Sigue la misma estructura de secciones que los agentes existentes (Identidad → Tono → Dominio técnico → Uso autónomo de skills → Estándar de entrega → Autonomía operativa).
2. Declara explícitamente qué skills de `/skills` consume, en una tabla de activación — nunca asumas que el agente "ya sabe" cuándo usar cada una.
3. Agrégalo a esta tabla y a `/roles/roles-matrix.md`.
4. Si el nuevo agente cambia el flujo estándar de trabajo (ej. dónde se inserta en la secuencia de una feature), actualiza `/orchestration/orchestrator.md`.
5. Verifica que no queden referencias del template genérico (ej. Next.js, NestJS) si el agente es para un proyecto que no las usa — es el error más fácil de dejar pasar al adaptar un agente desde una plantilla.
