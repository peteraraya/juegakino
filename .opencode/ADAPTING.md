# ADAPTING.md — Guía de adaptación a otro proyecto

> **Documento único y obligatorio de adaptación.** Si vas a usar este repositorio de agentes con un proyecto **distinto de `react-base-app`**, lee este archivo **antes** de hacer cualquier cosa. Define exactamente qué archivos tocar, en qué orden, y qué se rompe si te saltas alguno.
>
> El resto del repo está acoplado a `react-base-app`. No hay forma de usarlo "tal cual" con otro proyecto sin adaptarlo — la adaptación no es opcional ni cosmética.

---

## Índice

1. [Concepto: capas con distintos niveles de acoplamiento](#1-concepto)
2. [Mapa maestro: archivo por archivo](#2-mapa-maestro)
3. [Perfiles de adaptación](#3-perfiles)
4. [Procedimiento paso a paso](#4-procedimiento)
5. [Checklist de verificación post-adaptación](#5-verificacion)
6. [Trampas comunes](#6-trampas-comunes)

---

## 1. Concepto

Este repo describe un **equipo de agentes** (orquestador, frontend, backend, diseño, QA). Su contenido se divide en tres capas según el acoplamiento al proyecto de origen:

| Capa | Qué contiene | Dependencia de `react-base-app` |
|---|---|---|
| **Cómo funciona el equipo** | `orchestrator.md`, `incident-runbook.md`, `handoff-protocol.md`, `definition-of-done.md`, `pr-convention.md`, `roles-matrix.md`, `qa-tester.md` | Baja — define *proceso*, no *stack*. Solo se toca si cambia la composición del equipo o el tipo de flujo |
| **Cómo es el proyecto** | `project-context.md`, `design-tokens.md`, `agents/*.md` (alcance y tablas de activación), `skills/` | **Alta** — define *stack, producto, paleta y tecnología*. Es donde se adapta casi todo |
| **Consultas concretas** | `README.md`, `AGENTS.md`, las plantillas y specs de `/specs` | Alta para las specs de features; media para plantillas |

El criterio jamás falla: **si un agente debe pensar en un stack distinto, todo lo que le dice qué stack usar debe actualizarse.** Lo que olvides en esa cadena seguirá diciéndole al agente que trabaje con el proyecto anterior.

### Skills: capa de metodología reutilizable

Los cuerpos de las skills son **workflows genéricos** (criterio de uso, decisiones, checklists) con una sección `## Parámetros del proyecto` al inicio donde viven los únicos valores específicos. Por eso adaptar `skills/` es casi siempre **podar/agregar más que reescribir**: lo específico se edita en los parámetros y en `/context` (paleta, tokens, stack), no en el workflow. Si una skill quedó hardcodeada con un proyecto, se arregla moviendo el valor a parámetros — no se propaga el hardcode a otra copia.

## 2. Mapa maestro

Leyenda de columnas:
- **Clase**: 🔴 **OBLIGATORIO** (hay que editarlo en cualquier adaptación) · 🟡 **CONDICIONAL** (depende del perfil, ver §3) · ⚪ **OPCIONAL / NO TOCAR** (normalmente genérico).
- **Qué editar**: el mínimo exacto.
- **Si lo saltas**: el fallo concreto que te vas a encontrar.

| Archivo | Clase | Qué editar | Si lo saltas |
|---|---|---|---|
| `context/project-context.md` | 🔴 | §1 producto/audiencia, §2 stack (tabla completa), §4 restricciones, §6 glosario, §7 proyectos. **Empezar por aquí** | Los agentes trabajan creyendo que el proyecto es el portafolio Vite+NestJS de Pedro. Es la fuente que tiene prioridad sobre todo lo demás: el resto del repo queda mintiendo detrás |
| `README.md` | 🔴 | Descripción, stack, counts ("5 agentes / 14 skills"), tabla de estructura y de `/specs`, aviso de adaptación | Cualquiera que abra el repo lee la descripción del proyecto equivocado |
| `AGENTS.md` | 🔴 | Descripción del proyecto objetivo (§intro), counts y mapa, sección de adaptación (este archivo) | El punto de entrada de todo agente apunta al proyecto equivocado |
| `agents/agents-README.md` | 🔴 | Alcance e índices del equipo, tablas de activación por skill, notas full-stack | Los agentes activan skills o flujos que no aplican al nuevo proyecto |
| `agents/frontend.md` | 🔴 | Dominio/stack (p. ej. Vite→Next, TanStack), tabla de activación de skills que consume | El agente frontend aplica convenciones del stack anterior |
| `agents/designer.md` | 🟡 | Tokens/paleta (blue), sistema de componentes, proveedor de UI | Diseña con la marca o librería equivocadas (si el proyecto usa otras) |
| `agents/backend.md` | 🟡 | Existencia del agente según perfil (B: eliminarlo o reducirlo), stack (NestJS→otro), skills de backend | En un proyecto sin backend, `orchestrator` enruta trabajo a un agente que no pinta nada. En un proyecto con otro backend, lo diseña mal |
| `agents/qa-tester.md` | 🟡 | Estrategias de testing (Vitest/NestJS/Playwright → los del stack real), skills `qa-qc-*` que activa | QA prueba con herramientas que el proyecto no usa |
| `roles/roles-matrix.md` | 🟡 | Filas de agentes/dominios (borrar `backend` en perfil B), matriz por tipo de solicitud | Se enrutan solicitudes a dominios inexistentes |
| `orchestration/orchestrator.md` | 🟡 | Notas full-stack (flujo designer→backend→frontend→qa, dueño de contratos de API) | Coordina flujos que incluyen un backend que no existe o con otro stack |
| `orchestration/incident-runbook.md` | ⚪ | (genérico — incidentes, no stack) | Casi nunca se toca |
| `skills/skills-README.md` | 🔴 | Tabla de skills activas/disponibles y qué agente las consume | Skills huérfanas o "activas" que no existen → inconsistencias en cada tarea |
| `skills/<nombre>/SKILL.md` | 🟡 | **Podar** (borrar las que no aplican al stack, agregar las que falten) y, en las que quedan, editar **solo** su sección `## Parámetros del proyecto` (y los archivos de `/context` que referencian) — nunca el cuerpo del workflow | Skills muertas que los agentes activan porque siguen listadas (fuente #1 de inconsistencia); o skills cuyo workflow quedó hardcodeado con el proyecto anterior porque se editaron los cuerpos en vez de los parámetros |
| `context/design-tokens.md` | 🟡 | Paleta `blue` y tokens (si el proyecto no usa esta marca/sistema) | La UI sale pintada con la marca del portafolio anterior |
| `context/handoff-protocol.md` | 🟡 | Los 6 handoffs (si no hay backend: quitar `designer→backend` y `backend→frontend`) | El equipo pasa trabajo a agentes inexistentes o con contratos de API propias que nadie define |
| `context/definition-of-done.md` | 🟡 | Checklist "Backend propio" (perfil B) o adaptarlo al nuevo stack | Las entregas se consideran incompletas/incorrectas contra un backend que no aplica |
| `context/pr-convention.md` | 🟡 | Checkbox "Agentes involucrados" (`backend`), sección de deploy (Vercel/contenedores) | Los commits/PRs piden permisos o despliegues equivocados |
| `specs/feature-spec-template.md` | 🟡 | Nota de adaptación (arriba), §4 "Contrato de datos" (dueño `backend` → quien aplique) | Cada spec nueva de un proyecto sin backend asigna el contrato a un agente inexistente |
| `specs/api-contract-template.md` | 🟡 | Nota de adaptación, referencias a NestJS/Swagger (si el backend es otro o no hay) | El contrato se documenta para el framework equivocado |
| `specs/career-timeline.md` | ⚪ | Feature **ya completa** del portafolio → borrar o mover a `/specs/examples/` | Queda como spec de un feature que el nuevo proyecto no tiene |
| `specs/portfolio-engagement.md` | ⚪ | Feature **en diseño** del portafolio → borrar o mover a `/specs/examples/` | Ídem |
| `specs/api/portfolio-engagement.md` | ⚪ | Contrato de la feature anterior → borrar o archivar con ella | Ídem |
| `package.json` / `.gitignore` | ⚪ | Config del cliente (plugin `@opencode-ai/plugin`); no versionado | Raramente se toca |

## 3. Perfiles

Elige el perfil que corresponda a tu nuevo proyecto y usa sus reglas sobre la columna 🟡 del mapa.

### Perfil A — Otro proyecto full-stack (mismo/similar stack JS/TS)

El de menor trabajo. Sigue siendo frontend (da igual si Vite o Next) + backend propio con BD.

- Editar: todos los 🔴 + `design-tokens.md` (si cambia la marca) + `skills/` (podar/agregar).
- Mantener: `backend.md`, handoff full-stack, DoD backend, plantillas specs, `roles-matrix`, `orchestrator.md`.
- Ajustar en cada agente: el stack real del nuevo backend/frontend y las tablas de activación.

### Perfil B — SPA / frontend-only (SIN backend)

El más desafiante porque hay que **revertir supuestos full-stack** del repo (fue exactamente el estado original del proyecto).

- 🔴 igual. Además, **eliminar/adaptar**: `agents/backend.md`, fila `backend` en `roles/roles-matrix.md`, notas full-stack en `orchestrator.md` y `agents/agents-README.md`.
- **Revertir**: `handoff-protocol.md` (flujo designer→frontend→qa, sin handoffs de backend), `definition-of-done.md` (sin checklist backend), `feature-spec-template.md` §4 ("Contrato de datos" → a quien consuma la API externa), `api-contract-template.md` (el contrato es de la API externa, no propia).
- **Podar skills**: `nestjs-secure-backend`, `devops-docker-kubernetes`, `qa-qc-react-nestjs` (y `cicd-expert-pipelines` si no aplica). Cuenta final de agentes/skills actualizada en `README.md` y `AGENTS.md`.
- **Nota**: está bien que la SPA siga consumiendo la API de GitHub; el schema Zod del contrato externo lo define quien consuma el recurso (ver `api-contract-template.md`).

### Perfil C — Backend de otro stack (Django/FastAPI/Go/.NET, otra BD o sin BD)

El backend existe pero no es NestJS.

- 🔴 igual + `backend.md` (stack real), `api-contract-template.md` (OpenAPI u otro framework, no `@nestjs/swagger`).
- `skills/`: quitar las 4 de NestJS/DevOps/QA-NestJS, agregar las del stack real.
- `orchestrator.md` y `agents-README.md`: ajustar el flujo que incluye al backend pero sin las notas específicas de NestJS.
- `definition-of-done.md`: adaptar el checklist de backend al stack real.

## 4. Procedimiento

Orden de edición recomendado (no lo cambies — cada paso certifica que el anterior quedó bien):

1. **Define el perfil** (A/B/C) y anótalo.
2. **`context/project-context.md`**: producto, stack, restricciones, glosario, proyectos. Este archivo es la fuente de verdad; todo lo demás lo referencia.
3. **`skills/`**: poda las carpetas `SKILL.md` que no apliquen y agrega las que falten; en las que se quedan, actualiza su sección `## Parámetros del proyecto` (nunca el cuerpo del workflow) y los archivos de `/context` que referencian; deja `skills-README.md` exacto.
4. **`agents/`**: `agents-README.md`, `frontend.md`, y según perfil `backend.md`/`designer.md`/`qa-tester.md` — cada tabla de activación apuntando solo a skills que existen.
5. **`roles/roles-matrix.md`** y **`orchestration/orchestrator.md`**: composición del equipo y flujo reales.
6. **Reversión full-stack** (solo perfil B): `handoff-protocol.md`, `definition-of-done.md`, `pr-convention.md`.
7. **`specs/`**: borra o archiva las features del portafolio (`career-timeline.md`, `portfolio-engagement.md`, `api/portfolio-engagement.md`) y adapta las plantillas (nota de adaptación + §4).
8. **`context/design-tokens.md`** si cambia la marca (paleta, fuentes).
9. **`README.md`, `AGENTS.md`** y este mismo archivo si hace falta: descripción, counts, mapa, perfil elegido.
10. **Corre §5** (verificación) antes de dar cualquier tarea a un agente.

## 5. Verificacion

Checklist ejecutable antes del primer uso. Todos los comandos desde la raíz del repo.

**A. Residuos del proyecto anterior** — no deben quedar referencias al stack/producto de `react-base-app` (ajusta los términos según el perfil):

```
react-base-app | TanStack | Vite | NestJS(?!s) | TypeORM | Prisma | Vercel | GitHub | Newsreader | IBM Plex Mono | azul/blue | portafolio | reclutador(?!s) | PeterAraya | pedro
```

Busca con tu editor/ripgrep sobre `*.md` (excluyendo `.git`). Cero coincidencias de producto de origen. (Para `Nest`, excluye coincidencias parciales como `NestJS` a propósito.)

**B. Skills coherentes** — para cada skill listada como "activa" en `skills-README.md` y en las tablas de activación de los agentes:
- [ ] Existe físicamente `skills/<nombre>/SKILL.md` y el `name` del frontmatter coincide con el nombre de la carpeta (formato `carpeta + SKILL.md` que exige opencode — ver `skills/skills-README.md`).
- [ ] Ninguna skill presente queda "huérfana" (sin agente que la consuma ni listada como disponible).

**C. Enlaces internos** — todos los enlaces relativos entre `.md` apuntan a archivos reales (checa con un validador de markdown si tienes uno, o revisa los nombres a mano).

**D. Counts contra realidad** — `README.md` y `AGENTS.md` declaran números que deben cuadrar con el árbol real: nº de agentes en `/agents`, nº de skills en `/skills`, nº de archivos de `/specs` y `/context` listados.

**E. Supuestos full-stack según perfil** — en perfil B, `/specs` y `/context` no deben mencionar "API propia" / "dueño: `backend`" / "handoff backend". En perfil A/C, el stack descrito en `backend.md` == stack de `project-context.md` §2.

**F. Registro** — una vez cerrado, deja una decisión en `project-context.md` §5 tipo `[fecha] Adaptación a <proyecto>` con el perfil elegido, para que cualquier agente sepa que la adaptación se hizo deliberadamente.

## 6. Trampas comunes

- **Dejar una skill "activa" que no existe** (o al revés): es el error más frecuente; la verificación §B lo caza. Cada skill tiene su `name` en el frontmatter — lo que se lista en tablas debe coincidir tanto con el `name` como con el nombre de su carpeta.
- **Revertir full-stack a medias**: borrar el agente `backend` pero dejar `handoff-protocol.md` con el handoff `backend→frontend` o el DoD con "Backend propio". Vuelve a leer §3-B hasta que no quede ningún "backed" de más. (Este repo vivió exactamente esa inconsistencia en ambas direcciones.)
- **Editar solo `project-context.md`** y dejar `README`/`AGENTS`/plantillas con el proyecto anterior: los agentes checan el contexto, pero una persona que lea la raíz del repo ve otro proyecto.
- **Dejar specs de features del portafolio** (`career-timeline`, `portfolio-engagement`) como si fueran plantilla genérica: contaminan la idea de "qué features va a tener mi proyecto".
- **Activar skills "disponibles"** (Next.js, Nivo, Plotly, Leaflet) como default en el frontend nuevo sin revisar el `frontend.md`: solo deben activarse a pedido explícito.
- **No actualizar los counts** (`README`/`AGENTS`): el repo declara 5 agentes / 14 skills que ya no cuadran.
- **Editar el cuerpo de una skill para adaptarla** cuando el cambio es de valores (stack, colores, endpoint, comandos): los workflows son genéricos y lo específico vive en `## Parámetros del proyecto` y `/context`. Si te encuentras hardcodeando el nombre de un proyecto en un workflow, estás violando el principio de abstracción — arregla la skill moviendo el valor a parámetros, no lo propagues.