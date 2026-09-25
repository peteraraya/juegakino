# Repositorio de agentes de IA para `juegaKino`

> **Aviso de adaptación:** este repositorio se adaptó desde `react-base-app` (equipo **full-stack** de 5 agentes: frontend + backend + diseño + QA + orquestador) al **perfil B (frontend-only)**. Ya no existe el agente `backend`, ni las skills de backend, ni las notas full-stack en `specs/` y `context/`. Si necesitas volver a un perfil full-stack u otro stack, lee [`ADAPTING.md`](./ADAPTING.md) antes de tocar nada.

Este repositorio define un **equipo de agentes de IA especializados** (orquestador, frontend, diseño, QA) con sus **skills**, **contexto vivo**, **roles** y **especificaciones**, preparado para construir un **proyecto objetivo**:
**`juegaKino`** — SPA **frontend-only** (Vite + React 19 + TanStack Router + TanStack State + Zustand + Tailwind 3) que simula el Kino de la Lotería de Concepción (Chile): elegir 14 de 25 números, sorteo de 14 sin repetición, premios por 10–14 aciertos, y análisis de probabilidades con Monte Carlo (PRNG con semilla) y matemática exacta (hipergeométrica).

## Estructura del repositorio

```
.
├── AGENTS.md                  # Punto de entrada para agentes de IA (mapa de navegación)
├── README.md                  # Este archivo
├── ADAPTING.md                # Guía de adaptación perfil <!-- GENERADO:full-stack|frontend-only -->
├── agents/
│   ├── agents-README.md       # Índice y alcances del equipo (4 agentes)
│   ├── orchestrator.md        # Agente coordinador
│   ├── frontend.md            # Agente frontend (dueño de la SPA)
│   ├── designer.md            # Agente de diseño visual
│   ├── qa-tester.md           # Agente de QA (Vitest + RTL)
│   └── (backend.md fue eliminado en el perfil frontend-only)
├── orchestration/
│   ├── orchestrator.md        # Flujo de coordinación
│   └── incident-runbook.md    # Runbook de incidentes (frontend-only)
├── roles/
│   └── roles-matrix.md        # Matriz de responsabilidades por agente
├── skills/
│   └── skills-README.md       # Índice de skills (5 activas + ampliadas a pedido)
├── context/
│   ├── project-context.md     # Contexto vivo del proyecto (fuente de verdad)
│   ├── design-tokens.md       # Tokens de diseño (paleta kino-red)
│   ├── handoff-protocol.md    # Protocolo de handoff entre agentes
│   ├── definition-of-done.md  # Definición de hecho (frontend-only)
│   └── pr-convention.md       # Convención de PRs
├── specs/
│   └── (specs de features del proyecto)
└── orchestration/             # (ver más arriba)
```

## Para qué sirve

Este repo **no es código de aplicación**: describe al **equipo de agentes** que trabaja sobre `juegaKino`. Los agentes de IA cargan `AGENTS.md` (por convención) y luego navegan el repo según el mapa que ahí se define.

## Uso

1. Coloca/ubica este repositorio junto al proyecto `juegaKino`.
2. Configura tu cliente de agentes (opencode, Claude Code, Cursor) para cargar `AGENTS.md` y dar lectura a `agents/`, `roles/`, `skills/`, `context/`, `specs/` y `orchestration/`.
3. Delega las solicitudes al orquestador o a un agente por dominio.

Lee siempre [`AGENTS.md`](./AGENTS.md) y [`context/project-context.md`](./context/project-context.md) antes de empezar.

## Licencia

Todos los archivos de este repositorio están bajo la [licencia MIT](https://opensource.org/licenses/MIT).

---

_Adaptado y mantenido para el proyecto juegaKino. Autor: Pedro Araya Gálvez._
