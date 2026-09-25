# Convención de Git, PR y Code Review

Estandariza cómo el equipo (agentes y humano) propone, revisa e integra cambios. Referenciado desde `/context/project-context.md` (sección "Convenciones del equipo").

## Ramas

- `main` — siempre desplegable, protegida (sin push directo).
- `feature/<slug-corto>` — una feature de `/specs`, ej. `feature/kino-simulator`.
- `fix/<slug-corto>` — corrección de bug, ej. `fix/worker-cancelacion`.
- `chore/<slug-corto>` — mantenimiento sin impacto funcional (deps, configuración, docs).

Slug corto en inglés, kebab-case, sin el nombre del ticket si no hay tracker externo — descriptivo por sí mismo.

## Commits — Conventional Commits

```
<tipo>(<alcance opcional>): <descripción en imperativo, minúscula, sin punto final>
```

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`.

```
feat(simulator): agregar simulador masivo con progreso en worker
fix(domain): corregir cálculo de P(10 o más aciertos)
test(probability): cubrir distribución hipergeométrica contra valores teóricos
```

- Un commit, un cambio lógico — no mezclar un fix con un refactor no relacionado en el mismo commit.
- El cuerpo del commit (si hace falta) explica el *por qué*, no el *qué* — el diff ya muestra el qué.

## Pull Requests

### Título
Mismo formato que el commit principal: `feat(simulator): simulador masivo con worker y progreso`.

### Plantilla de descripción

```markdown
## Qué cambia y por qué


## Feature/spec relacionada
Ver `/specs/[archivo].md` (si aplica)

## Agentes involucrados
- [ ] frontend
- [ ] designer
- [ ] qa-tester

## Cómo se probó
(qué tests se agregaron/corrieron — para el dominio, con semilla fija — o pasos manuales si aplica)

## Checklist de Definition of Done
Ver `/context/definition-of-done.md` — marcar solo lo aplicable a este cambio:
- [ ] Dominio matemático
- [ ] Cómputo intensivo (Web Worker)
- [ ] Frontend
- [ ] Diseño
- [ ] Testing
- [ ] CI/CD y build
- [ ] Contexto y documentación actualizados

## Riesgos conocidos / deuda técnica introducida
(declarar explícitamente si algo queda pendiente — nunca omitir en silencio)
```

### Tamaño del PR

- Preferir PRs pequeños y enfocados en un solo cambio lógico — más fáciles de revisar con rigor real, no solo de aprobar por cansancio.
- Un PR que mezcla varios dominios sin relación directa entre sí (ej. un componente nuevo + un refactor de dominio no relacionado) se divide, salvo que sean genuinamente interdependientes.

## Checklist de Code Review

Quien revisa (el agente dueño del dominio si la tarea fue asignada por `orchestrator`, o el usuario) verifica:

**Correctitud**
- [ ] El código hace lo que el PR dice que hace, verificado contra la spec en `/specs` si existe
- [ ] Casos límite y negativos contemplados (validación de cartón, N de sorteos extremos, cancelación del worker, no solo el happy path)
- [ ] Si el PR afirma una probabilidad/estadística, está respaldada por fórmula o simulación con semilla fija (valores teóricos conocidos como ancla)

**Calidad**
- [ ] Sin duplicación de conocimiento de negocio (DRY con criterio, no abstracción forzada)
- [ ] Nombres que revelan intención; funciones/componentes con una sola responsabilidad
- [ ] Sin `any` sin justificar; sin `console.log` en código de producción
- [ ] La lógica matemática vive en `src/domain/` (funciones puras), no incrustada en componentes ni en el worker

**Dominio y simulación** (si el PR toca `src/domain/` o el worker)
- [ ] Funciones puras con casos límite testeados; PRNG siempre con semilla en tests
- [ ] Simulación masiva en Web Worker con progreso y cancelación limpia — el hilo principal nunca se bloquea
- [ ] `src/domain/` sin imports de React/worker/UI

**Testing**
- [ ] Tests nuevos cubren el comportamiento agregado, no solo existen para subir el número de cobertura
- [ ] Sin tests flaky introducidos (sin `setTimeout` real, sin aleatoriedad sin semilla, sin dependencia de orden)

**Coherencia con el sistema**
- [ ] Respeta las convenciones de `/context/project-context.md`, incluida la restricción de acentos solo-`kino-red`
- [ ] No contradice una decisión de arquitectura ya registrada sin justificar por qué se aparta de ella
- [ ] Si introduce una convención nueva, está documentada, no solo implementada

### Criterio de aprobación

- **Aprobar** solo si el reviewer verificó realmente el código, no si "se ve razonable" por encima.
- **Solicitar cambios** con comentarios accionables y específicos (línea, razón, sugerencia) — nunca un rechazo vago ("esto no me convence").
- Un desacuerdo técnico entre el autor y el reviewer que no se resuelve en la discusión del PR se escala a `orchestrator` siguiendo el mismo criterio de resolución de conflictos entre agentes de `/orchestration/orchestrator.md`.

## Merge

- Squash merge a `main` por defecto — historial limpio, un commit por PR con el mensaje final revisado.
- Sin merges directos a `main` sin PR, incluso para cambios triviales — la protección de rama existe para eso.
- Lint + typecheck + tests + build deben pasar en verde antes de habilitar el merge, sin excepciones manuales. (El proyecto es una SPA estática sin plataforma de deploy definida todavía; cuando se defina, el deploy a producción ocurre al mergear a `main`.)