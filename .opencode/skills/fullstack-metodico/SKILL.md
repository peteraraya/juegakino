---
name: fullstack-metodico
description: Use when implementing, fixing, refactoring, or reviewing FULL-STACK code (frontend + backend + APIs + DB) in the active project. Workflow por fases: entender contexto, planificar, implementar con buenas practicas, y revisar cada linea de codigo como un senior (complejidad, nombres, errores silenciosos, seguridad, accesibilidad, rendimiento, patrones). Framework-agnostic: los únicos valores específicos del proyecto viven en la seccion de parametros al inicio de esta skill. Use ONLY when the task involves writing or reviewing code end-to-end across layers, not for one-off questions.
---

# Full Stack Metodico — workflow de desarrollo y revision

Workflow riguroso para cualquier tarea de desarrollo y revision de codigo, sin importar el framework, lenguaje o arquitectura del proyecto. El objetivo: codigo **correcto, claro, seguro y mantenible**, producido de forma sistematica y revisado linea por linea con criterio senior.

**Regla de abstraccion**: esta skill es 100% reutilizable. La unica parte especifica del proyecto son los **parametros** de la seccion siguiente — al adaptar la skill a otro proyecto se editan esos parametros (o se apunta a los archivos de contexto del proyecto), **nunca** el workflow.

## Parametros del proyecto (a editar al adaptar)

> Rellena esta tabla con los valores de TU proyecto antes de usar la skill. Donde ya exista contexto del proyecto (ej. `AGENTS.md`, `CLAUDE.md`, `/context/project-context.md`), referencialo en vez de duplicarlo. La columna "ejemplo" muestra los valores de un monorepo full-stack JS para entender el formato, no es un default a copiar. La columna "juegaKino" muestra este proyecto.

| Parámetro | Qué define | Ejemplo (monorepo full-stack JS) | juegaKino |
|---|---|---|---|
| `REPO` | Estructura del repositorio (monorepo, workspaces, apps/paquetes/carpetas) y comandos raíz | Turborepo + npm workspaces · apps `api`, `web`, `mobile`; packages `schemas`, `ui`, `charts` | SPA Vite en la raíz + repo de agentes en `.opencode/` (no confundir; el código de la app vive en la raíz) |
| `FRONTEND` | Framework web y convenciones propias de esa capa | Next.js App Router: server actions, `proxy.ts` para rutas protegidas, `export const instant = false` para páginas dinámicas | Vite + React 19 + TanStack Router + Zustand + Tailwind 3 (ver skill `vite-tanstack-tailwind`) |
| `BACKEND` | Framework de API y arquitectura de módulos | NestJS: controllers → services → repositorios → DTOs | **No hay backend** (perfil B): la lógica es client-side en `src/domain/` (funciones puras) |
| `DATA` | Capa de datos (DB, transacciones, in-memory) y supuestos de persistencia | Sin DB en MVP: repos en memoria, los datos se pierden al reiniciar | Sin servidor: la "fuente de datos" es la simulación con PRNG con semilla; solo persistencia parcial de UI en `localStorage` |
| `VALIDATION` | Cómo se valida la entrada en el borde (librería + pipe/filtro global) | Zod con schemas compartidos en `packages/schemas`, aplicados con un `ZodValidationPipe` global | Zod para validar cartones (14 números, 1–25, únicos), config de simulación y resultados |
| `AUTH` | Sesión/autorización de la capa web (cookies, tokens, proxy) | Cookies httpOnly de sesión/refresh; el proxy protege `/dashboard/*` | No aplica — app 100% local, sin cuentas ni sesiones |
| `ERRORS` | Convención de códigos de error por dominio | 404 si el recurso no existe, 401/403 por auth, 400 por input inválido; ownership del recurso responde 404 | Sin códigos HTTP: errores de validación (card invalid) y estados vacíos de la UI; errores del Web Worker reportados con mensaje claro |
| `ARCH_GUARD` | Límites de arquitectura automatizados (si existen) y su comando | dependency-cruiser (ADR-002); `npm run depcruise` | No hay guard automatizado; regla manual: `src/domain/` no importa de React ni del worker |
| `GATE` | Comandos de verificación completos (los mismos de CI) | lint, typecheck, test, coverage, e2e, depcruise, build | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` |
| `CONTENT` | Dónde vive el contenido/negocio y cómo se valida | Repo + `npm run lint:content`; no inventar contenido, hay `<placeholder>` | Reglas del juego en `src/domain/kino.ts` (25/14/categorías). No inventar reglas anexas (ReKino etc. fuera de alcance) |
| `SECRETS` | Reglas de secretos/credenciales del proyecto | Nunca en logs, respuestas ni `.env.example` con valores reales; rotación periódica | No hay secretos en una SPA 100% local (sin API, sin tokens) |

---

## Principios fundamentales

1. **Entender antes de tocar.** Nunca modifiques codigo sin conocer el contexto, las convenciones del repo y las consecuencias del cambio.
2. **Cambios minimos y quirurgicos.** No refactorices de paso: toca solo lo necesario para el objetivo.
3. **Las buenas practicas no son opcionales.** Aplica los patrones del stack del proyecto (parametro `BACKEND`/`FRONTEND`) — no inventes arquitectura nueva sin justificacion.
4. **Cada linea se revisa de verdad.** Lee el diff como un reviewer senior, no confies en que "compila" = "esta bien".
5. **Verificalo, no lo asumas.** Corre las verificaciones del repo (parametro `GATE`) antes de declarar terminado.
6. **Sin comentarios de relleno.** Los comentarios solo explican el "por que" no evidente. No agregues comentarios a menos que se pidan o haya una razon no obvia.

---

## Fase 0 — Entender el contexto (obligatoria, sin prisa)

Antes de escribir o corregir una linea:

- Lee los documentos que situan al proyecto: `README.md`, `AGENTS.md`/`CLAUDE.md` de la app afectada, y las carpetas de decisiones (`docs/adr/`, `docs/ROADMAP.md`) si existen — aparecen en el parametro `REPO`/`CONTENT`.
- Lee los tests y specs existentes de la zona a tocar (documentan el contrato): `*.spec.ts`/`*.test.*`/e2e de la app correspondiente.
- Confirma el stack real del paquete a tocar en su `package.json`/manager y en la config del monorepo. **Nunca asumas una libreria**; verifica que este instalada y como se usa.
- Si existe CodeGraph (`codegraph_status`/`codegraph_context`), usalo para preguntas estructurales: quien llama a que, que romperia un cambio.
- Responde en una linea: **que hace el sistema, que hace la zona a cambiar, y que me piden**. Si no puedes responder esas tres cosas, investiga mas.

## Fase 1 — Plan (antes de editar)

- Define el objetivo del cambio en una frase medible.
- Enumera archivos a tocar (y por que) y los que NO se deben tocar (ej. schemas publicos a menos que el cambio sea de contrato).
- Identifica limites: schemas/DTOs compartidos, contratos de API, deps entre paquetes (`^build`, `^dev`), imports circulares.
- Decide la estrategia de verificacion ANTES de codificar (que comando del `GATE` se corre y cuando).
- Si hay decisiones de diseno (nombres, estructura), exponlas y aplica las convenciones existentes; no introduzcas un patron paralelo.

## Fase 2 — Implementar con buenas practicas

> Cada seccion aplica a la capa que corresponda segun los parametros `FRONTEND`/`BACKEND`/`DATA`/`VALIDATION` del proyecto.

### Backend / API / logica

- Respeta la arquitectura de modulos del framework (parametro `BACKEND`): nada de logica en decoradores/helpers del framework, la logica vive en el servicio/repositorio.
- **Validacion siempre en el borde**: valida la entrada al entrar (parametro `VALIDATION`); no valides a mano dentro de la logica.
- **Nunca confies en datos ajenos**: revisa tipos en runtime si el dato sale de una API/DB/colas (ej. `Array.isArray`, `typeof`), aunque el tipado estatico diga lo contrario.
- Manejo de errores explicito: usa la convencion `ERRORS` (status correcto por dominio). No tragar excepciones; si no sabes manejar el error, deja que el filtro/pipe global lo responda. No loguees secretos ni datos sensibles.
- Async: `await` en vez de `.then()`; evita fire-and-forget sin manejo.

### Frontend / UI

- Usa los patrones de la capa que el proyecto ya definio (parametro `FRONTEND`): no mezcles paradigmas (ej. intervenir en el borde servidor vs. cliente segun convencion del repo).
- Validacion de formularios con el mismo sistema `VALIDATION` que el resto del proyecto; muestra mensajes reales del servidor.
- Accesibilidad: `<label>` ligado, `aria-*` necesario, contraste AA, foco recuperable. Nada de `onClick` en div sin rol. Estados loading/error/vacio siempre cubiertos (no solo el feliz).
- Rendimiento: evita re-renders obvios (objetos nuevos en deps de hooks, claves no estables en listas, datos pedidos dos veces).
- HTML valido: nesting correcto, `<form>` con submit nativo, no `<a>` vacios.
- Estilos: usa el sistema de tokens del proyecto (no incrustes colores magicos).

### Estilo de codigo

- Nombres claros (verbos para funciones, sustantivos para datos). Sin iniciales cripticas (`data`, `res`, `x`) fuera de scope de una linea.
- Complejidad: si una funcion supera ~30 lineas o anida >3 niveles, extrae con nombre descriptivo.
- Sigue el formato del repo (formatter/linter configurados); mantente consistente con el codigo circundante. No dejes imports/vars sin usar.
- Sin duplicacion: si el patron ya existe, usalo; si repites >2 veces, extrae.

## Fase 3 — Revision senior, linea por linea (la mas importante)

Revisa TUS propios cambios (y los ajenos) como si los firmaras. Por cada archivo del diff, segun su rol, checa lo siguiente:

### 1. Correccion (bugs silenciosos)
- Off-by-one, condiciones invertidas, `===` vs `==`, null/undefined (si el repo tiene `noUncheckedIndexedAccess`, los indices pueden ser `undefined`).
- Errores en la firma: tipos incoherentes entre llamador y callee.
- Datos de red/DB/colas asumidos `string`/`number` sin validar en runtime (mira la seccion "Nunca confies en datos ajenos").
- Flujos: estado inicial, vacios (`NaN`, `Infinity`, `""`, `0`), caso limite.
- Re-ejecucion: funciones impuras con efectos colaterales inesperados.

### 2. Nombre y claridad
- ¿Lee el nombre lo que hace? ¿Podra entenderlo alguien en 6 meses sin abrir la implementacion?
- Nombres de nivel semantico (dominio) y no de implementacion de solo detalle.
- ¿Hay magia numerica o strings literales repetidos sin constante?

### 3. Seguridad
- Entrada de usuario: validada en el borde (parametro `VALIDATION`), no interpolada en SQL/HTML/URLs.
- Auth/authorization: cada endpoint/pub check; no solo el primero. Ownership con la convencion del parametro `ERRORS`. El decorador/metodo de "publico" solo donde debe serlo.
- Informacion: no expongas campos internos en respuestas/rendering.
- Secretos (parametro `SECRETS`): nunca en output, logs, respuestas, ni en `.env.example` que se commitea con valores reales.
- Sesion/cookies: respeta el mecanismo del parametro `AUTH` (httpOnly, seteado solo desde el modulo de sesion).

### 4. Accesibilidad y UX (si hay UI)
- Contraste AA, foco visible y recuperable, labels y `aria-*`.
- Estados de loading/error/vacio siempre cubiertos (no solo el feliz).
- Interaccion por teclado funcional.

### 5. Rendimiento
- Complejidad innecesaria (busquedas O(n^2), recomputacion en cada render).
- Cargas: datos pedidos dos veces por mismo dato, duplicados en estados.
- Assets grandes importados sin lazy donde proceda.

### 6. Patrones y arquitectura
- ¿El cambio respeta la arquitectura del repo o la salta para "rapidito"?
- ¿Dependencias en la direccion que exige el proyecto (parametro `ARCH_GUARD` si existe)?
- ¿Duplica responsabilidad que ya existe en otro sitio (ej. otro modulo DTO)?

### Resultado de la revision
- Lista de hallazgos ordenados por severidad (critico/mayor/menor/sugerencia).
- Solo entonces decides si aplicar cambios o aprobar. **Corregir hallazgos criticos y mayores es obligatorio antes de dar por terminado.**

## Fase 4 — Verificacion (nunca opcional)

- Corre el gate completo del repositorio (parametro `GATE`): el mismo conjunto de comandos que corre CI. Corre al menos los tres primeros + build tras cada cambio.
- Ejecuta SOLO los comandos definidos en el repo (no afirmes "paso el lint" sin correrlo de verdad).
- Si una verificacion falla, arregla la causa real (no un workaround).
- Nada de "no test" como excusa: agrega test unitario si el cambio tiene logica pura, o e2e (framework del proyecto) si cambia flujo de usuario.
- Confirma que el diff es solo lo planeado (sin archivos accidentales como `AGENTS.md`/`CLAUDE.md` regenerados, `.env` o salidas de build).

---

## Checklist rapido antes de cerrar

- [ ] Entendi el contexto (fase 0) y lo puedo enunciar (que hace el sistema, que hace la zona, que me piden)
- [ ] Plan con archivos a tocar aprobado/consciente
- [ ] Cambios minimos, siguiendo patrones existentes (sin patrones paralelos)
- [ ] Validacion en el borde, errores segun convencion, sin secretos
- [ ] Accesibilidad y estados loading/error/vacio cubiertos (si UI)
- [ ] Revision linea por linea hecha; criticos/mayores corregidos
- [ ] Tests escritos si hay logica nueva
- [ ] `GATE` del repo pasado de verdad (typecheck, lint, test, build, y el resto de CI)
- [ ] Diff limpio y acotado, sin archivos accidentales
 
> Si esta skill se usa en otro proyecto, repasa la tabla [Parametros del proyecto](#parametros-del-proyecto-a-editar-al-adaptar) antes de empezar — edita los valores, no el workflow.