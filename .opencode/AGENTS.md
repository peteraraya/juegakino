# AGENTS.md — Guía de navegación de este repositorio

Este archivo es la **punto de entrada** para cualquier agente de IA (opencode, Claude Code, Cursor, etc.) que trabaje en un proyecto donde esté disponible este repositorio. Su propósito es explicar **cómo se conectan los archivos `.md`** de este repo: qué contiene cada carpeta, qué leer antes de empezar, y qué convenciones respetar.

> Adaptado a **`juegaKino`** (perfil B de [`ADAPTING.md`](./ADAPTING.md)): **frontend-only** — SPA de Vite + React 19 + TanStack Router + Zustand + Tailwind 3. **No hay backend ni APIs** (ni propias ni externas): toda la lógica (matemática de la simulación: picking 14 de 25, Monte Carlo con PRNG con semilla, frecuencias y probabilidades) corre en el cliente, en `src/domain/` y en un Web Worker. El equipo son 4 agentes (`orchestrator`, `frontend`, `designer`, `qa-tester`) — **no hay agente `backend`**.

## Cómo usar este repo en cualquier proyecto

Copia/ubica este repositorio junto al proyecto objetivo (`juegaKino`) y configura tu cliente de agentes para que:

1. **Cargue `AGENTS.md`** del directorio raíz (la mayoría de los clientes lo hacen por convención al abrir el repo).
2. Use los archivos de `agents/` como definiciones de agente y `orchestration/orchestrator.md` como coordinador.
3. Conceda acceso de lectura a `skills/`, `context/` y `specs/` a todos los agentes.

## Orden de lectura al arrancar (nunca te saltes este flujo)

| # | Archivo | Por qué leerlo primero |
|---|---|---|
| 1 | `AGENTS.md` (este) | Te da el mapa de navegación completo |
| 2 | `README.md` | Vista general del repo, estructura y aviso de adaptación |
| 3 | `context/project-context.md` | Contexto vivo del proyecto — **tiene prioridad sobre cualquier guía genérica** |
| 4 | `roles/roles-matrix.md` | Para saber a qué agente enrutar cada tipo de solicitud |
| 5 | `context/definition-of-done.md` | Para saber cuándo una entrega está realmente completa |

Después de este arranque, lee solo los archivos que tu tarea active (ver más abajo).

> **¿Vas a trabajar con un proyecto distinto a `juegaKino`?** Antes del flujo anterior, lee [`ADAPTING.md`](./ADAPTING.md): dice qué archivos hay que modificar y en qué orden para adaptar el equipo a otro proyecto.

## Mapa de los archivos `.md` y sus conexiones

| Carpeta | Contiene | Archivos `.md` | Se conecta a |
|---|---|---|---|
| `/agents` | Definiciones de cada agente del equipo | `agents-README.md` (índice), `frontend.md`, `designer.md`, `qa-tester.md` | `/orchestration` (coordinador), `/skills` (conocimiento que consumen), `/context` (reglas que respetan), `/roles` (a quién le toca qué) |
| `/orchestration` | El agente coordinador y el runbook de incidentes | `orchestrator.md`, `incident-runbook.md` | `/agents` (a quién enruta), `/context` (reglas que hace respetar), `/specs` (cuándo una feature está completa) |
| `/roles` | Matriz de responsabilidades | `roles-matrix.md` | `/agents` (a quién corresponde cada dominio), `/orchestration` (flujo de decisión) |
| `/skills` | Conocimiento especializado por dominio (carpetas `<nombre>/SKILL.md`, formato que carga opencode) | `skills-README.md` (índice) | `/agents` (tablas de activación: qué agente consume qué skill), `/context` (tokens y convenciones que las skills referencian) |
| `/context` | Contexto vivo del proyecto (convenciones, tokens, protocolos) | `project-context.md`, `design-tokens.md`, `handoff-protocol.md`, `definition-of-done.md`, `pr-convention.md` | Todo el repo: **es la fuente de verdad que todos deben consultar** |
| `/specs` | Especificaciones de features y plantillas | `feature-spec-template.md`, `kino-generator.md`, `kino-simulator.md`, `kino-stats.md` | `/context` (DoD y handoffs), `/agents` (qué agente construye el feature) |

## Cómo se relacionan las piezas

```
El usuario pide algo
        │
        ▼
orchestration/orchestrator.md      ──► clasifica la solicitud
        │
        ├──► roles/roles-matrix.md      qué agente(s) corresponden
        ├──► context/project-context.md reglas a respetar (prioridad máxima)
        │
        ▼
agents/*.md (frontend | designer | qa-tester)
        │
        ├──► skills/SKILL.md           conocimiento que ACTIVA la tarea
        │        (vía la tabla de activación del agente)
        ├──► context/handoff-protocol   al pasar trabajo al siguiente agente
        │
        ▼
specs/[feature].md ──► context/definition-of-done.md → "feature completa"
```

1. El usuario le pide algo a `orchestrator`, quien clasifica la solicitud y decide qué agente(s) la resuelven y en qué secuencia.
2. Cada agente consulta de forma autónoma las skills de `/skills` que su tarea activa y siempre revisa `/context` antes de empezar — el contexto del proyecto tiene prioridad sobre cualquier guía genérica.
3. El trabajo entre agentes se pasa con un **handoff explícito** ([`context/handoff-protocol.md`](./context/handoff-protocol.md)), nunca de forma implícita o resumida.
4. Una feature se marca `completa` en `/specs` solo cuando cumple el checklist de [`context/definition-of-done.md`](./context/definition-of-done.md).
5. Un incidente en producción suspende el flujo normal y sigue [`orchestration/incident-runbook.md`](./orchestration/incident-runbook.md).

## Empezar a usar los agentes

Este repositorio se consume desde un cliente/orquestador de agentes de IA (ej. opencode, Claude Code) que apunte al proyecto objetivo:

1. Clona este repositorio junto al proyecto (`juegaKino`) que va a trabajar.
2. Configura tu cliente para que cargue los archivos de `/agents` como definiciones de agente y conceda acceso de lectura a `/skills`, `/context` y `/specs`.
3. Dirige las solicitudes a `orchestrator.md` cuando no estén claramente acotadas a un solo dominio; invoca un agente de `/agents` directamente cuando el dominio es obvio (ver el índice en `agents/agents-README.md`).

## Al adaptar este repo a otro proyecto

Si el proyecto objetivo **no es `juegaKino`** (SPA frontend-only con Vite + React + TanStack), lee obligatoriamente [`ADAPTING.md`](./ADAPTING.md) **antes** de empezar. Es el documento único que define exactamente qué archivos tocar, en qué orden y qué se rompe si te saltas alguno, con tres perfiles según el tipo de proyecto (full-stack / frontend-only / otro stack de backend).

Resumen de lo no negociable:

1. Empieza por `context/project-context.md` — es la fuente de verdad; todo lo demás lo referencia.
2. Revisa `skills/` (poda y alta, con `skills/skills-README.md` al día) y cada tabla de activación en `agents/` — la fuente más común de inconsistencia.
3. Ajusta `roles/roles-matrix.md` y las notas de alcance en `agents/agents-README.md` y `orchestration/orchestrator.md`.
4. Si el nuevo proyecto **no tiene backend** (perfil B), elimina `agents/backend.md` y revierte las notas full-stack en `specs/`, `context/handoff-protocol.md` y `context/definition-of-done.md`.
5. En cada skill que adaptes, edita sus valores únicamente en la sección `## Parámetros del proyecto` (y en los archivos de `/context` que referencie) — nunca el cuerpo del workflow; si algo quedó hardcodeado en un cuerpo está violando el principio de abstracción y se arregla, no se propaga.
6. Actualiza `README.md`, `AGENTS.md` y `ADAPTING.md`, y corre la checklist de verificación §5 de `ADAPTING.md` antes del primer uso.

## Reglas de navegación no negociables

- **`/context` manda.** Si un archivo en cualquier carpeta contradice `context/project-context.md`, gana el contexto — nunca la guía genérica.
- **No inventes archivos.** Solo existe lo que está físicamente en `agents/`, `skills/`, `context/`, `roles/`, `specs/` y `orchestration/`. Si una tabla menciona un archivo que no existe, es un error a corregir, no un archivo implícito.
- **Las skills se activan, no se leen por defecto.** Un agente consulta una skill de `skills/` solo cuando su tabla de activación la dispara. No leas todo `/skills` en cada tarea.
- **El trabajo se pasa con handoffs explícitos** (`context/handoff-protocol.md`), nunca de forma implícita o resumida.
- **Los workflows son genéricos; lo específico vive en `/context` y en `## Parámetros del proyecto` de cada skill.** Ningún workflow (skill, agente, orquestador) debe hardcodear valores del proyecto (stack, versiones, colores, fuentes, endpoints, comandos) — al adaptar a otro proyecto se editan los parámetros y el contexto, no los cuerpos de las skills (ver `ADAPTING.md`).
- **No confundas el repositorio de agentes con el proyecto objetivo.** Este repo describe al equipo; el proyecto objetivo es el código sobre el que se trabaja. Edita el código del proyecto objetivo, y este repo solo cuando cambie el equipo, sus skills o sus convenciones.

## Apéndice — diferencias con `react-base-app` (plantilla de origen)

Este repo se adaptó desde `react-base-app` (perfil full-stack: frontend Vite/NestJS con backend propio). Al adaptar al perfil B frontend-only se eliminaron: el agente `backend` (y `agents/backend.md`), las skills `nestjs-secure-backend`, `devops-docker-kubernetes`, `qa-qc-react-nestjs` y `cicd-expert-pipelines`, y todas las notas full-stack en `specs/`, `context/handoff-protocol.md` y `context/definition-of-done.md`. La fuente de datos de `juegaKino` es la **simulación local con PRNG con semilla** (sin TanStack Query, sin MSW, sin APIs).

## Licencia y autor

Todos los archivos de este repositorio están bajo la [licencia MIT](https://opensource.org/licenses/MIT).

Autor: [Pedro Araya Gálvez](https://github.com/peteraraya).
