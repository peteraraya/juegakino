---
name: vite-tanstack-tailwind
description: Guía técnica del stack Vite + React 19 + TanStack Router/Query/Form + Tailwind CSS 3 para SPA client-side sin Next.js ni SSR (stack actual del proyecto objetivo — los valores del proyecto están en los Parámetros del proyecto). Úsala siempre que la tarea implique ruteo (TanStack Router), estado de datos servidor/cliente (TanStack Query/Zustand/Form), configuración de build (Vite, PWA), o estilos con Tailwind. También aplica al revisar restricciones reales de implementación antes de proponer un patrón de interacción o al escribir/depurar código de componentes, hooks o rutas.
---

# Stack de implementación — Vite + React + TanStack + Tailwind (SPA client-side)

Referencia técnica del stack definido en los **Parámetros del proyecto** (abajo): una SPA client-side sin SSR. Todo el cuerpo de la skill asume ese stack; si tu proyecto difiere, edita los Parámetros, **nunca** el workflow de abajo.

## Parámetros del proyecto — juegaKino (a editar al adaptar)

> Los únicos valores específicos de esta skill. Al adaptar a otro proyecto se editan estos parámetros (y los archivos de `/context` que referencian), no el cuerpo de la skill. **Nota de alcance**: este proyecto no tiene APIs que consumir, así que la sección "Datos servidor — TanStack Query" del cuerpo NO se activa; la fuente de datos es la simulación local.

| Parámetro | Valor actual (`juegaKino`) |
|---|---|
| Arquitectura | SPA estática client-side, sin SSR ni servidor propio (ver `/context/project-context.md` §4) |
| Deploy | Build estático `dist/` vía `npm run build` (sin plataforma de deploy definida; sin PWA por ahora) |
| Datos de servidor | **No hay** — sin TanStack Query ni APIs; la fuente de datos es la simulación local con PRNG con semilla (`src/domain/`) |
| Cómputo intensivo | Web Worker nativo de Vite (`src/workers/simulation.worker.ts`) con progreso y cancelación — las simulaciones masivas nunca corren en el hilo principal |
| Estado UI | Zustand (`src/stores/kinoStore.ts`) para estado UI + configuración, con persistencia parcial en `localStorage` |
| Ruteo | `src/app/router.tsx` (rutas tipadas: Home, Generador, Simulador, Estadísticas); cada ruta nueva enlazada en ambos menús (desktop y mobile) |
| i18n | No aplica — UI monolingüe en español |
| Estilos | Tokens en `/context/design-tokens.md` (paleta `kino-red` / `navy` / `gold`); dark mode con variantes `dark:` |
| SEO | Mínimo por diseño (SPA sin SSR) |

## 1. Build — Vite 6

- `npm run build` produce `dist/` estático — cualquier feature que asuma un entorno de servidor (cookies httpOnly de servidor, middleware de edge, `getServerSideProps`) no aplica aquí; si algo lo necesita, es una señal de que el proyecto necesitaría un backend propio (no existe hoy, ver `/context/project-context.md` §4).
- PWA vía `vite-plugin-pwa` — cualquier cambio que afecte assets estáticos o rutas nuevas debe verificar que el manifest/service worker generado siga siendo válido (ver `/context/definition-of-done.md`, sección CI/CD).
- **React Compiler** (`babel-plugin-react-compiler`) hace memoización automática — no escribas `useMemo`/`useCallback` manuales "por si acaso"; son redundantes salvo un caso medido de perf real que el compiler no resuelve.
- SEO es mínimo por diseño (portafolio SPA sin SSR) — no inviertas esfuerzo en metadata dinámica ni prerendering salvo pedido explícito.

## 2. Ruteo — TanStack Router (`src/app/router.tsx`)

- Rutas tipadas con `createRoute`/`createRootRoute` — una ruta nueva sigue el mismo patrón que las existentes (ver el layout global y los `Link` de navegación desktop/mobile ya definidos).
- Code splitting de rutas pesadas (gráficos, 3D) vía `React.lazy`/`Suspense` o el lazy loading nativo de TanStack Router — no infles el bundle inicial con una ruta que no todos los visitantes van a abrir.
- Nueva ruta = agregar el `Link` correspondiente en **ambos** menús (desktop y mobile) siguiendo el estilo ya existente — olvidar uno de los dos es el error más común al agregar una página.
- El idioma activo (`i18n.language`) determina qué versión de `cvData` se muestra (`cvData[i18n.language]`) — una ruta nueva que muestra contenido de CV sigue ese mismo patrón, no inventa su propia fuente de datos.

## 3. Datos servidor — TanStack Query (API externa — ver Parámetros)

- Todo fetch pasa por TanStack Query (hooks tipados), nunca un `useEffect` con `fetch` a pelo — caché, invalidación y reintentos configurados de forma centralizada.
- Toda respuesta de la API se valida con un **schema Zod propio** antes de usarse en la UI — la API externa (Parámetros) es la fuente de verdad en runtime, pero su forma real (campos ausentes en ciertos perfiles, límites de paginación) no es 100% la documentada; el schema es lo que realmente protege al componente.
- Casos de fallo a contemplar siempre: `404` (usuario/repo inexistente), `403` (rate limit de la API pública sin autenticar), timeout, respuesta malformada — un hook nuevo que consume la API externa (ver Parámetros) sin manejar estos casos no está completo (ver `qa-qc-react-vite` para cómo se testean).
- No hay contrato de API propio que coordinar entre agentes: `frontend` define el schema Zod directamente a partir de la respuesta real de la API externa (ver `/context/handoff-protocol.md`, handoff 2).

## 4. Estado UI — Zustand

- Zustand es **solo** para estado de UI puro (ej. `uiStore` — tema, modales, toggles de `recruiterMode`/`vscodeMode`). Si un dato viene de TanStack Query, no se duplica en Zustand "para tenerlo más a mano" — la caché de Query ya es la fuente de verdad para datos de servidor.
- Antes de agregar un store nuevo, confirma que realmente es estado de interacción (no derivable de props/datos existentes) — un valor que se puede calcular a partir de algo que ya existe no necesita su propio store.

## 5. Formularios — TanStack Form + Zod

- Validación de formularios con Zod vía `@tanstack/zod-form-adapter` — el schema es la única fuente de las reglas de validación, no dupliques la regla en el JSX (ej. un `required` HTML además del schema, que puede desincronizarse).
- Errores de validación se muestran en el momento oportuno (no todo al final, no en cada tecla) — ver `frontend-design`/`ui-design-system` para el patrón de estado de error.

## 6. Estilos — Tailwind CSS 3

- Tokens de color/tipografía/espaciado en `/context/design-tokens.md` — no elijas un valor de color o espaciado "a ojo" cuando el token ya existe.
- Sin clases utilitarias repetidas sin abstraer: si el mismo combo de 6+ clases se repite en 3+ lugares, es un componente o una clase compuesta con `@apply`, no copy-paste indefinido.
- Dark mode vía las variantes `dark:` de Tailwind en cada componente nuevo — no se agrega como un paso posterior; se piensa junto con el estilo light.

## 7. Arquitectura por capas — dónde va cada cosa

```
Ruteo tipado (TanStack Router)
  → hook TanStack Query (datos servidor, API externa (Parámetros))
    → store Zustand (estado UI puro, si aplica)
      → schema Zod (contrato de validación de datos/formularios)
        → componente de presentación ("tonto", recibe props/hooks)
```

- La obtención de datos vive en hooks de TanStack Query, no dispersa en `useEffect` dentro de componentes de UI.
- Componentes de presentación separados del hook/contenedor que trae los datos — permite testear cada capa por separado (ver `qa-qc-react-vite`).

## 8. Checklist rápido al escribir código de este stack

- [ ] ¿El fetch usa un hook de TanStack Query, nunca un `useEffect` con fetch directo?
- [ ] ¿La respuesta de la API externa (ver Parámetros) se valida con un schema Zod antes de usarse?
- [ ] ¿Están cubiertos los estados loading/error/vacío/éxito, no solo el happy path?
- [ ] ¿Zustand se usa solo para estado de UI puro, no para duplicar datos de servidor?
- [ ] ¿La ruta nueva está registrada en `router.tsx` y enlazada en ambos menús (desktop y mobile)?
- [ ] ¿Rutas o componentes pesados (gráficos, 3D) usan code splitting?
- [ ] ¿Los estilos usan los tokens de `/context/design-tokens.md`, con variantes `dark:` desde el inicio?
- [ ] ¿Hay algún supuesto de servidor/SSR que no aplica a esta SPA?
