# Matriz de Roles y Responsabilidades

Referencia rápida de quién hace qué dentro del equipo de agentes. Complementa a `/orchestration/orchestrator.md` (que define el *flujo*) describiendo el *alcance* de cada rol con más detalle — útil para que el orquestador y el usuario resuelvan rápido a quién corresponde una tarea ambigua.

## Roles

| Rol | Archivo | Responsable de | No responsable de |
|---|---|---|---|
| **Frontend Senior** | `/agents/frontend.md` | Componentes React/TanStack, ruteo, estado cliente (Zustand), lógica de dominio en `src/domain/` (probabilidades, PRNG, sorteos, frecuencias, estrategias, agregación), Web Worker de simulación, visualización de datos (recharts), rendimiento de carga/render | Decisiones de identidad visual de marca, definir qué comportamiento estadístico es "correcto" a nivel de producto cuando no está definido |
| **Diseñador UX/UI** | `/agents/designer.md` | Flujo de usuario, jerarquía visual, sistema de diseño (acento `kino-red`), especificación de estados e interacción (grid de 25 números, progreso de simulación), accesibilidad de la interfaz | Implementación de código, decisiones de arquitectura técnica, viabilidad final de performance (la señala `frontend`) |
| **QA Engineer** | `/agents/qa-tester.md` | Estrategia y automatización de testing (dominio matemático determinista + UI), identificación de casos límite (validación de cartón, concurrencia del worker, cancelación), reportes de bugs reproducibles, gates de calidad | Corregir el bug que encuentra (lo reporta al agente responsable), decisiones de producto sobre qué comportamiento es "correcto" cuando no está definido |
| **Orquestador** | `/orchestration/orchestrator.md` | Clasificar solicitudes, secuenciar el flujo entre agentes, gestionar handoffs, mantener `/context` coherente, escalar conflictos al usuario | Ejecutar trabajo especializado de cualquier agente directamente |

## Matriz de decisión rápida — "¿a quién le corresponde esto?"

| Tipo de solicitud | Agente(s) principal(es) | Secuencia sugerida |
|---|---|---|
| Nueva feature de punta a punta (UI + datos) | `designer` → `frontend` → `qa-tester` | Completa, ver `orchestrator.md` |
| Lógica matemática nueva / función de dominio (probabilidades, RNG, estrategia) | `frontend` (dueño de `src/domain/`) → `qa-tester` | Corta, con tests del dominio |
| Web Worker de simulación (cómputo masivo, progreso, cancelación) | `frontend` → `qa-tester` | Corta técnica |
| Nuevo componente visual sin datos nuevos | `designer` → `frontend` | Corta |
| Definir estrategia de testing antes de implementar | `qa-tester` (criterios de aceptación) → luego el flujo normal | QA adelantado |
| Revisión de código existente | El agente dueño del dominio del código revisado | Directa |
| Dashboard con gráficos (frecuencias, histogramas) | `designer` (layout) → `frontend` (con `recharts-charts`) → `qa-tester` | Completa |
| Refactor interno sin cambio de contrato ni UI | `frontend` (dueño del código) → `qa-tester` (regresión) | Corta |
| Verificación de una afirmación estadística/probabilidad (¿cuál es P(10+)?) | `frontend` (cálculo en `src/domain/`) con verificación de `qa-tester` | Numérica |
| Decisión de negocio/producto sin especificación previa | Ninguno — se escala al usuario antes de asignar | Bloqueante |

## Incidentes en producción

Un incidente (SEV1/SEV2) suspende temporalmente esta matriz de asignación normal — sigue el procedimiento dedicado en `/orchestration/incident-runbook.md`, donde la prioridad es mitigar antes de investigar causa raíz, y la asignación al agente dueño del dominio ocurre después de restaurar el servicio, no antes.

## Principio de resolución de ambigüedad

Cuando una tarea no encaja claramente en una fila de la tabla, el criterio de desempate es: **¿qué artefacto se está modificando?**
- Se modifica UI/interacción → `frontend` (y `designer` si cambia el diseño, no solo la implementación).
- Se modifica o crea cobertura de pruebas → `qa-tester`.
- Se modifica lógica pura de simulación/probabilidad → `frontend` (dueño de `src/domain/`).
- Si toca más de uno, es multi-agente — el orquestador arma la secuencia.