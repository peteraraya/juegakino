# `/skills` — Índice de habilidades especializadas

Cada archivo `SKILL.md` en esta carpeta documenta el estándar del equipo para un dominio técnico específico: cuándo usar qué herramienta, errores comunes reales (no solo "cómo se usa" superficial), y un checklist rápido al generar código. Los agentes en `/agents` las consultan de forma autónoma cuando una tarea las activa — no hace falta pedirlo explícitamente.

Este equipo es **frontend-only** (`juegaKino`): SPA de Vite + React 19 + TanStack Router + Zustand + Tailwind 3 (ver `/context/project-context.md`). No hay backend ni APIs externas: el "dominio" a proteger es la matemática de la simulación. El catálogo de skills cubre ese stack más las librerías alternativas disponibles para otros proyectos del portafolio.

## Skills activas en `juegaKino`

| Skill | Dominio | Consumida principalmente por |
|---|---|---|
| `frontend-design` | Dirección visual, tipografía y estilo intencional; identidad Kino (`kino-red`/`navy`/`gold` en `/context/design-tokens.md`) | `frontend`, `designer` |
| `vite-tanstack-tailwind` | Vite + React 19 + TanStack Router + Zustand + Tailwind; Web Workers para cómputo intensivo | `frontend`, `designer` (restricciones de implementación) |
| `qa-qc-react-vite` | Testing de la SPA Vite: Vitest, RTL, jsdom; funciones puras deterministas del dominio; sin MSW (no hay red) | `qa-tester`, `frontend` |
| `recharts-charts` | Gráficos con recharts — tema (kino-red), accesibilidad, contenedores | `frontend`, `designer`, `qa-tester` |
| `ui-design-system` | Tokens de color kino-red, componentes UI, estados y contraste WCAG AA | `designer`, `frontend`, `qa-tester` |

## Skills de workflow reutilizable (framework-agnostic)

Workflow de metodología genérico (sin acoplar a un stack/proyecto concreto): los valores específicos viven en su sección "Parámetros del proyecto". No la consumen las tablas de activación de `/agents` para `juegaKino` como skill base; se activa cuando se trabaja sobre cualquier proyecto y se pide desarrollo/revisión de código end-to-end.

| Skill | Dominio | Cuándo se activa |
|---|---|---|
| `fullstack-metodico` | Workflow genérico de desarrollo y revisión senior end-to-end (entender contexto → planificar → implementar → revisar línea por línea → verificar), framework-agnostic | en cualquier proyecto, cuando la tarea es escribir o revisar código de punta a punta en vez de una pregunta puntual |

## Skills disponibles (stack ampliado, se activan a pedido explícito)

Estas skills existen físicamente en `/skills` y las consumen los agentes del equipo, pero **no se activan por defecto en `juegaKino`**: aplican cuando el usuario las pide explícitamente o cuando se trabaja sobre otro proyecto del portafolio (el frontend de `juegaKino` es Vite/recharts, no Next.js/Nivo/Plotly, y no tiene mapas).

| Skill | Dominio | Cuándo se activa |
|---|---|---|
| `nextjs-2026-best-practices` | Arquitectura y buenas prácticas Next.js 16 (App Router, RSC, Turbopack) | `frontend` — solo para proyectos Next.js distintos de `juegaKino` |
| `nivo-professional-charts` | Gráficos con Nivo (`@nivo/*`) | `frontend`, `designer`, `qa-tester` — a pedido explícito del usuario |
| `plotly-expert-charts` | Gráficos interactivos/científicos con react-plotly.js | `frontend`, `designer`, `qa-tester` — a pedido explícito del usuario |
| `leaflet-maps-integration` | Mapas interactivos con react-leaflet | `frontend`, `designer`, `qa-tester` — a pedido explícito del usuario |

Cada skill es una carpeta `skills/<nombre>/SKILL.md` en esta misma carpeta (formato que exige opencode: el `name` del frontmatter DEBE coincidir con el nombre de la carpeta) — si una tabla de activación en `/agents` menciona una skill que no está en estas tablas, es un error a corregir, no una skill "implícita".

## Estructura de una skill (principio de abstracción)

Toda skill del catálogo sigue dos capas separadas, para que sea reutilizable al adaptar el repo a otro proyecto:

1. **Workflow / guía reutilizable** (el cuerpo): el "cómo" — decisiones, errores comunes, checklists. No contiene valores del proyecto; donde dependa de uno, referencia los parámetros o el `/context`.
2. **Sección `## Parámetros del proyecto`** (al inicio): los únicos valores específicos — stack y versiones, deploy, fuentes de datos, paleta/tipografía, comandos de verificación. Se edita al adaptar a otro proyecto (ver `/ADAPTING.md`), nunca el workflow.

Reglas derivadas:
- Una skill cuyo contenido es conocimiento de un **framework/stack** (ej. `vite-tanstack-tailwind`) es reutilizable *tal cual* en cualquier proyecto que use ese stack — sus parámetros solo cambian versiones/valores del proyecto actual.
- Una skill cuyo dominio es la **identidad de un proyecto específico** (ej. `ui-design-system`) mantiene su valor en la metodología y mueve los valores (colores, fuentes, tokens) a la sección de parámetros, apuntando a `/context/design-tokens.md`.
- Lo que valga solo para un proyecto no se duplica en la skill: vive en `/context` y la skill lo referencia.

## Cómo se activan

Cada agente en `/agents` tiene su propia tabla de activación que mapea skills a disparadores concretos. Esta tabla es la vista global; para el detalle de activación de cada agente, ver su archivo correspondiente en `/agents`.

## Cómo evoluciona este catálogo

- Si una skill deja de aplicarse a `juegaKino` (ej. por cambio de stack), se mueve a la tabla de "disponibles" o se elimina físicamente — no se deja en "activas" sin uso real.
- Si el proyecto agrega un dominio nuevo (otra librería de gráficos, etc.), la skill correspondiente se agrega siguiendo la convención de abajo.
- Nota de adaptación: las skills de backend/NestJS/DevOps/NestJS-QA (`nestjs-secure-backend`, `devops-docker-kubernetes`, `qa-qc-react-nestjs`) y de CI/DevOps frontal (`cicd-expert-pipelines`) se **eliminaron** al adaptar a este perfil B — ver `/context/project-context.md` §5.

## Convención al agregar una nueva skill

1. Formato `SKILL.md` estándar: carpeta `skills/<nombre>/SKILL.md` con frontmatter `name` y `description` (la descripción debe listar disparadores concretos — frases/acciones que activan la skill, no solo el nombre del dominio). El `name` DEBE coincidir con el nombre de la carpeta (lo exige opencode); la carpeta se crea más las veces que haga falta, nunca como zip.
2. Estructura de dos capas (ver arriba): workflow reutilizable + sección `## Parámetros del proyecto` con lo específico, apuntando a `/context` cuando aplica.
3. Contenido orientado a decisiones reales y errores comunes, no a documentación genérica de la librería/framework.
4. Cierra siempre con un checklist rápido aplicable al generar código.
5. Agrégala a la tabla correspondiente (activas, disponibles o workflow reutilizable) y a la tabla de activación de cada agente que deba consumirla en `/agents`.
6. Si la skill introduce una convención que otras skills ya cubrían parcialmente, revisa solapamiento antes de publicarla.