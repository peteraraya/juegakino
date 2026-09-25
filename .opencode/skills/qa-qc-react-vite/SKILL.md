---
name: qa-qc-react-vite
description: Estrategia de testing de una SPA Vite/React/TanStack — Vitest, React Testing Library, MSW, jsdom y Playwright (E2E acotado), sin backend propio, que consume una API externa (los detalles del proyecto están en los Parámetros del proyecto). Úsala siempre que la tarea implique escribir o revisar tests unitarios/integración/E2E, configurar mocks de una API externa con MSW, definir cobertura o estrategia de testing, o cuando el usuario pida que el código esté "bien probado" o "sin regresiones".
---

# Testing — SPA Vite/React (Vitest + RTL + MSW + Playwright)

Estrategia de testing para una **SPA sin backend propio**: no hay endpoints propios que testear, el "contrato" a verificar es la respuesta real (o mockeada) de la API externa del proyecto (ver Parámetros). Prioriza integration tests (componente + MSW) sobre una suite E2E extensa.

## Parámetros del proyecto — juegaKino (a editar al adaptar)

> Los únicos valores específicos de esta skill. Al adaptar a otro proyecto se editan estos parámetros (y los archivos de `/context` que referencian), no el cuerpo de la skill. **Nota de alcance**: este proyecto no tiene API externa ni backend, por lo que **no hay MSW** (nada que mockear en red); el "contrato" a verificar es la matemática del dominio (determinista con semilla) y el comportamiento observable de la UI.

| Parámetro | Valor actual (`juegaKino`) |
|---|---|
| Aplicación | SPA Vite + React 19 + TanStack Router + Zustand, sin backend propio ni APIs externas |
| Fuente de datos a testear | Lógica de dominio pura (`src/domain/`): probabilidades, PRNG determinista, sorteos, frecuencias, estrategias y agregación de resultados |
| Cómputo intensivo | Lógica del Web Worker de simulación testeada a nivel de funciones puras (el worker es una capa delgada de mensajería) |
| Flujos E2E críticos | Generar una combinación; simular N sorteos y ver resultados; ver estadísticas/frecuencias |
| Ejemplos de helpers puros | `probability.matchesDistribution`, `draw.simulateDraw`, `random.mulberry32`, `strategy.generateCombo`, `statistics.aggregateDraws` |
| i18n en tests | No aplica — UI en español sin capa i18n |

## 1. Pirámide de testing de este proyecto

```
       E2E (Playwright)         ← acotado a los flujos críticos (ver Parámetros)
   Integración (RTL + MSW)      ← la mayoría de la cobertura útil vive acá
Unitarios (Vitest, funciones puras)  ← helpers, schemas Zod, lógica de derivación
```

- E2E se justifica en el puñado de flujos donde el costo de un fallo real (frente a la audiencia real del producto) es alto — no como cobertura por defecto de cada pantalla.
- Un helper puro (ver ejemplos en Parámetros) se testea unitariamente sin montar ningún componente — es más rápido y señala exactamente dónde está el bug si falla.

## 2. Mocks de la API externa con MSW

- **Nunca llamadas reales a la API en tests** — siempre mockeadas con MSW, usando el mismo schema Zod que `frontend` define en runtime como contrato del mock (si el mock no respeta el schema real, el test certifica un contrato que el código no valida de verdad).
- Casos de fallo de la API que todo hook/componente que la consume debe tener cubiertos en tests:
  - `404` — recurso inexistente (usuario/repositorio).
  - `403` — rate limit excedido (una API pública sin autenticar tiene un límite bajo; es el caso real más probable de fallo en producción).
  - Timeout / sin conexión.
  - Respuesta malformada o con campos ausentes (la API real no siempre coincide 1:1 con lo documentado).
- Un componente que solo tiene test del caso feliz (200 con datos completos) no está cubierto — el caso feliz lo escribe cualquiera, encontrar dónde se rompe es el valor del testing.

## 3. Qué testear (comportamiento observable)

- Testea lo que el usuario/consumidor experimenta (texto renderizado, estado del DOM accesible por rol), no detalles de implementación interna (nombre de variable de estado, estructura interna de un hook) — un test acoplado a implementación se rompe con cualquier refactor sin proteger nada real.
- Selectores: prioriza `getByRole`/`getByLabelText` sobre `getByTestId` — si un componente solo es testeable con `data-testid`, es una señal de que tampoco es accesible por lectores de pantalla/teclado.
- Estados de UI completos en cada componente relevante: loading, error, vacío, éxito — nunca solo el estado por defecto.

## 4. Setup técnico (Vitest + RTL + jsdom)

- Entorno `jsdom` explícito en tests de componentes (`// @vitest-environment jsdom` si el proyecto no lo fija global).
- `react-i18next` se mockea en tests de UI en vez de esperar su init asíncrono real — evita flaky tests por timing de carga de idioma.
- Al testear componentes que usan TanStack Router/Query, usa el setup de render con providers reales (`createRouter` de test, `QueryClientProvider` con un `QueryClient` nuevo por test) — no asumas comportamiento de router/query sin el provider correspondiente.
- Sin `setTimeout` real, sin fechas/horas sin mockear, sin estado compartido entre tests sin limpiar (`afterEach` con cleanup) — estas son las causas más comunes de flaky tests en este stack.

## 5. Un test flaky es un bug

- Si un test falla intermitentemente sin cambios de código, se investiga la causa raíz (timing, orden de tests, mock de red mal configurado) — nunca se resuelve reintentando ni se silencia con `skip`.
- La causa más común: un mock de MSW no reseteado entre tests, o una animación (ej. Framer Motion) no desactivada en el entorno de test que introduce timing real.

## 6. Cobertura con criterio

- La cobertura es una guía, no una meta — `expect(result).toBeDefined()` no prueba nada útil; verifica el valor real esperado.
- Cobertura de diff razonable en código nuevo/modificado, no perseguir 100% global.
- Regresión: todo bug reportado y corregido lleva un test que fallaba antes del fix y pasa después.

## 7. E2E con Playwright — cuándo sí

- Reservado a los flujos donde el fallo real importa (ver Parámetros). No se exige por defecto en cada cambio de UI — ver `/context/definition-of-done.md`.

## 8. Checklist rápido al escribir/revisar tests

- [ ] ¿Están cubiertos los casos negativos de la API externa (`404`, `403`/rate limit, timeout, respuesta malformada), no solo el `200` feliz?
- [ ] ¿Los mocks de MSW respetan el mismo schema Zod que valida `frontend` en runtime?
- [ ] ¿Se testea comportamiento observable (`getByRole`) y no implementación interna?
- [ ] ¿Están cubiertos loading/error/vacío/éxito en componentes con fetch?
- [ ] ¿Hay determinismo — sin `setTimeout` real, sin fechas sin mockear, sin estado compartido entre tests?
- [ ] ¿Un bug reportado tiene su test de regresión correspondiente?
- [ ] ¿El E2E (si existe) está reservado a un flujo crítico real, no a cobertura genérica de pantalla?
