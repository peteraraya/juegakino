# Runbook de Incidentes y Rollback

Proceso operativo para cuando algo falla en producción. Coordinado por `orchestrator`. El equipo son 4 agentes (`frontend`, `designer`, `qa-tester`) con `orchestrator` — **no hay agente `backend`** porque `juegaKino` es frontend-only.

> Adaptado a `juegaKino`: proyecto **frontend-only** — SPA de Vite + React 19 + TanStack Router + Zustand + Tailwind 3, **sin backend ni APIs** (ni propias ni externas; no hay Vercel como infra de servidor, ni contenedores, ni NestJS; la fuente de datos es la **simulación local con PRNG con semilla** corriendo en un Web Worker del propio cliente). No existe "API propia" que pueda fallar: el único contrato a verificar es el **schema Zod de dominio** (`src/domain/`) y el comportamiento observable de la UI. Los incidentes de infraestructura (contenedores, base de datos, deploys de servidor) no aplican — no existen en este proyecto.

## Principio rector

En un incidente activo, **primero se restaura el servicio, después se investiga la causa raíz**. No se debate arquitectura ni se busca el fix "correcto" mientras el sitio está caído o roto — se mitiga rápido (rollback de deploy, feature flag) y se investiga con el sistema ya estable.

## Severidades

| Nivel | Definición | Tiempo de respuesta esperado |
|---|---|---|
| **SEV1 — Crítico** | El sitio no carga, un secreto quedó expuesto en el repo, o hay una vulnerabilidad activa (ej. XSS) explotable | Inmediato, todo lo demás se pausa |
| **SEV2 — Alto** | Una funcionalidad core del proyecto está rota o inaccesible (ej. el tablero del Kino no renderiza, la simulación Monte Carlo no arranca, o la matemática da resultados inconsistentes para todos) | Mismo día |
| **SEV3 — Medio** | Una funcionalidad secundaria o un widget puntual falla, hay workaround (ej. el historial de frecuencias no se actualiza pero el resto funciona) | Próximo ciclo de trabajo |
| **SEV4 — Bajo** | Cosmético o edge case de bajo impacto | Backlog normal |

## Procedimiento — SEV1/SEV2

### 1. Detección y triage
- Quien detecta el incidente (reporte del propio usuario, `qa-tester` en un chequeo, o un error visible en producción) lo declara con severidad estimada.
- `orchestrator` confirma la severidad y activa el flujo de incidente — esto tiene prioridad sobre cualquier trabajo en curso de los agentes involucrados.

### 2. Mitigación inmediata (antes de investigar la causa)
Opciones en orden de preferencia según el caso:
- **Rollback al deployment anterior (Vercel)** — cada deploy queda versionado automáticamente; promover el deployment previo a producción es inmediato y no requiere rebuild.
- **Redeploy de una versión anterior de la app** si el incidente es de la propia app frontend (build/estático) — antes de corregir, se restaura el estado previo que funcionaba.
- **Feature flag / desactivar el widget o sección afectada** (ej. ocultar temporalmente una vista del análisis estadístico que se rompió) si el resto del sitio puede seguir operando sin él.
- Si el secreto/token expuesto es la causa (SEV1), **revocar y rotar el secreto de inmediato**, independientemente de si ya se hizo rollback — un rollback de código no invalida un secreto ya filtrado en el historial de git.
- Se documenta la acción tomada y la hora exacta — es el primer insumo del post-mortem.

> Como `juegaKino` es **frontend-only sin backend ni servicio de datos propio**, el rollback de deploy de Vercel es casi siempre la mitigación dominante; no hay migraciones de base de datos, contenedores ni API propia que revertir.

### 3. Asignación al agente responsable
`orchestrator` identifica el dominio del incidente y asigna diagnóstico al agente dueño:
- Error de renderizado/UI/performance de carga → `frontend`
- Falla de la matemática de simulación (PRNG con semilla, Monte Carlo en el Web Worker, frecuencias/probabilidades inconsistentes) → `frontend`
- Falla del schema Zod de dominio (validación del cartón, config de simulación, resultados) → `frontend`
- Un estado de error/vacío que nunca se diseñó y ahora causa una pantalla rota → `designer` (gap de especificación) + `frontend` (implementación del fix)
- Confirmación de que el incidente está resuelto y no regresó → `qa-tester`

> **No hay ruta a `backend`**: no existe esa responsabilidad en `juegaKino` (ver `/context/project-context.md` §2 y `agents/agents-README.md`).

### 4. Verificación de la mitigación
- El agente responsable confirma que la mitigación restauró el sitio (verificación real en el deployment de producción, no solo "debería estar bien").
- `qa-tester` valida con los criterios de aceptación de la feature afectada, si existen en `/specs`.

### 5. Causa raíz y fix definitivo
- Una vez estable el sitio, el agente responsable investiga la causa raíz sin la presión del incidente activo.
- El fix definitivo sigue el flujo normal (handoff, Definition of Done) — no se salta testing por haber sido un incidente urgente.

### 6. Post-mortem (obligatorio en SEV1, recomendado en SEV2)
Documento breve, sin buscar culpables, con:
- **Qué pasó** (línea de tiempo con horas exactas)
- **Impacto** (qué quedó roto/expuesto, duración)
- **Causa raíz**
- **Qué mitigó y qué resolvió definitivamente**
- **Acción preventiva** — y quién es responsable de implementarla, con la tarea creada, no solo mencionada

El post-mortem se registra en `/context/project-context.md` (sección "Decisiones de arquitectura registradas") si la causa raíz revela algo a corregir de forma permanente (ej. "falta manejo de la semilla del PRNG en el Web Worker" pasa a ser una restricción conocida para el equipo, no solo un fix puntual).

## Procedimiento — SEV3/SEV4

- Se documenta como una tarea normal (usar `/specs/feature-spec-template.md` si el fix es sustancial, o un reporte directo de `qa-tester` si es puntual).
- Sigue el flujo estándar del `orchestrator`, sin el tratamiento de urgencia de SEV1/SEV2.

## Checklist rápido durante un incidente activo

- [ ] ¿Se declaró la severidad y se activó el flujo de incidente?
- [ ] ¿Se mitigó (rollback de deploy / feature flag / rotación de secreto) antes de buscar la causa raíz?
- [ ] ¿Se documentó la hora exacta de cada acción tomada?
- [ ] ¿Se asignó al agente dueño del dominio (`frontend` para UI/build front o matemática de simulación, o `designer` si es un gap de especificación), no al primero disponible?
- [ ] ¿`qa-tester` validó que el sitio está realmente estable en producción, no solo "parece estar bien"?
- [ ] ¿Se programó el post-mortem si es SEV1/SEV2?
