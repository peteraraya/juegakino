---
name: nextjs-2026-best-practices
description: Guía de arquitectura y mejores prácticas para proyectos Next.js en 2026 (Next.js 16, App Router, Cache Components, Turbopack, React 19.2). Úsala siempre que el usuario cree un proyecto Next.js nuevo, agregue rutas/páginas/layouts, trabaje con Server Components/Server Actions, configure caching ("use cache", cacheComponents), migre de Pages Router o de Next 15 a 16, configure proxy.ts, o pida revisar/generar código Next.js siguiendo buenas prácticas actuales. También aplica si el usuario menciona "App Router", "RSC", "Server Actions", "Turbopack", "Cache Components" o pide una arquitectura full-stack con Next.js + TanStack Query + Zustand + Zod + Tailwind.
---

# Next.js 2026 — Mejores prácticas (Next.js 16.x)

Guía de referencia para generar y revisar código Next.js siguiendo el estado del arte a 2026. Next.js 16 (LTS, octubre 2025, última minor estable 16.2.x) es la base: Turbopack por defecto, Cache Components con `use cache`, `proxy.ts`, React 19.2 y React Compiler estable.

Genera siempre código completo, listo para copiar, con rutas de archivo exactas (`app/...`). Si el proyecto del usuario ya tiene lineamientos propios (ver `project-guidelines`), esos tienen prioridad; esta skill es la base "framework" cuando no hay reglas de proyecto específicas.

## 1. Decisiones de arranque

- **Router**: siempre `app/` (App Router). `pages/` solo si es un proyecto legacy que se está migrando.
- **Bundler**: Turbopack es el default en `next dev` y `next build` desde Next 16 — no se necesita flag. Si el proyecto tiene config específica de Webpack sin migrar, usar `--webpack` como salida temporal, no como decisión de diseño.
- **Node**: 20.9+ requerido.
- **React**: 19.2, con React Compiler activado (memoización automática, reduce `useMemo`/`useCallback` manuales).
- **TypeScript**: modo estricto siempre (alineado con el stack del usuario).
- **Scaffolding**: `create-next-app` ya trae App Router + TypeScript + Tailwind + ESLint por defecto — no hace falta configurarlo a mano salvo personalización.

## 2. Cache Components — el cambio más importante de 2026

Next.js 16 invierte el modelo de caching: **nada se cachea por defecto**. Todo el código dinámico se ejecuta en cada request salvo que se marque explícitamente.

```ts
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};
export default nextConfig;
```

```tsx
// app/products/page.tsx
async function ProductList() {
  'use cache';
  const products = await db.products.findMany();
  return <ProductGrid products={products} />;
}
```

Reglas prácticas:
- `'use cache'` va al inicio de la función (componente, route handler, o función de datos) que se quiere cachear.
- Combínalo con Partial Prerendering (PPR): el shell estático se sirve al instante y el contenido dinámico (auth, headers, cookies, params) hace streaming.
- No asumas caching implícito de versiones anteriores (`fetch` cacheado por defecto de Next 14/15) — eso ya no aplica bajo `cacheComponents: true`. Sé explícito siempre.
- Para invalidar: `revalidateTag`, `revalidatePath`, o tiempos de expiración explícitos en el `use cache` con `cacheLife`/`cacheTag`.

## 3. Server Components y Server Actions

- Todo componente es Server Component por defecto. Usa `'use client'` solo en la hoja del árbol que realmente necesita interactividad (estado, efectos, listeners del navegador).
- No mandes lógica de negocio ni acceso a datos a componentes cliente — mantenlos "tontos" (props in, eventos out).
- **Server Actions** reemplazan route handlers para mutaciones desde formularios/UI:

```tsx
// app/actions/create-post.ts
'use server';
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export async function createPost(formData: FormData) {
  const parsed = CreatePostSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
  });
  await db.posts.create({ data: parsed });
  revalidatePath('/posts');
}
```

- Sigue usando Zod como fuente única de verdad para validar el input de cada Server Action, igual que en el resto del stack del usuario.
- Route Handlers (`app/api/.../route.ts`) siguen siendo válidos para APIs consumidas por clientes externos, webhooks, o integraciones — no para mutaciones internas del propio front.

## 4. Middleware → `proxy.ts`

Next.js 16 reemplaza `middleware.ts` por `proxy.ts` para dejar explícito que corre en el borde de red (auth checks, redirects, rewrites), no como middleware de aplicación:

```ts
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
```

## 5. Estructura de proyecto recomendada

```
app/
├── layout.tsx              # Root layout (Server Component)
├── page.tsx                # Home
├── proxy.ts
├── (marketing)/             # Route group, no afecta la URL
│   └── about/page.tsx
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx          # Streaming/Suspense boundary
│   ├── error.tsx            # Error boundary
│   └── @modal/(.)settings/  # Intercepting + parallel routes
├── actions/                 # Server Actions
├── api/                     # Route Handlers para consumidores externos
components/
├── ui/                       # Presentacionales, client cuando haga falta
lib/
├── schemas/                  # Zod schemas compartidos
├── db.ts
```

- Usa **route groups** `(nombre)` para organizar sin afectar la URL.
- Usa **parallel routes** (`@slot`) e **intercepting routes** (`(.)`, `(..)`) para modales/paneles que necesitan su propia URL sin abandonar el layout padre.
- `loading.tsx` y `error.tsx` por segmento — no envuelvas todo en un solo `Suspense` gigante en el root.

## 6. Integración con el resto del stack

Cuando el proyecto combina Next.js con TanStack Query/Zustand/Zod (stack habitual del usuario):

- **TanStack Query**: úsalo para estado de datos del lado del cliente (mutaciones optimistas, refetch, cache de UI). No lo uses para reemplazar `use cache`/RSC en la carga inicial — deja que el Server Component resuelva el fetch inicial y solo hidrata TanStack Query si el cliente necesita refetch/mutación después.
- **Zustand**: solo para estado de UI puramente cliente (modales abiertos, filtros locales, wizard steps). Nunca dupliques ahí datos que ya vienen del servidor.
- **Zod**: schema único compartido entre validación de Server Actions, route handlers y formularios cliente (`app/lib/schemas/`).
- **Tailwind CSS**: viene configurado por defecto en `create-next-app`; usa `app/globals.css` para tokens de diseño.
- **Auth**: Clerk o Auth.js (NextAuth) son las opciones estándar 2026 para App Router; ambas soportan Server Components y Server Actions de forma nativa.

## 7. Testing

- **Vitest** para unit/integration de lógica pura (schemas, utils, Server Actions aisladas con mocks de DB).
- **MSW** para mockear fetch/route handlers en tests de componentes cliente.
- **Playwright** para e2e sobre rutas reales del App Router, incluyendo streaming y Suspense boundaries.
- Los Server Components async no se testean igual que componentes cliente: para lógica de datos, extrae funciones puras testeables con Vitest en lugar de testear el componente completo.

## 8. Performance y DX

- Turbopack: 2–5x builds más rápidas, hasta 10x Fast Refresh — no requiere configuración.
- **Layout deduplication** y **prefetch incremental** reducen el payload de navegación automáticamente entre 60–80% en apps con muchos links — no hay que optimizar nada manual, pero evita romper el layout compartido innecesariamente (cada layout distinto rompe la deduplicación).
- **React Compiler** (estable): reduce la necesidad de `useMemo`/`useCallback` manuales; actívalo en `next.config.ts` y evita optimizaciones manuales redundantes salvo casos medidos.
- **DevTools MCP**: Next.js expone un servidor MCP para debugging asistido; útil si el usuario trabaja con agentes de IA en el mismo repo.
- Imágenes: sigue usando `next/image`; metadata SEO con la Metadata API (`generateMetadata`), no `<head>` manual.

## 9. Migración desde Next.js 15 / Pages Router

- Next 16 trae codemods automáticos para la mayoría de breaking changes (`params`/`searchParams` ahora son async, configs removidas).
- `middleware.ts` sigue funcionando pero se recomienda migrar a `proxy.ts`.
- Activar `cacheComponents: true` es opt-in — no lo actives sin auditar qué rutas dependían de caching implícito previo, o se romperá el rendimiento esperado (todo pasa a dinámico hasta que marques `use cache`).
- Pages Router sigue soportado y sin cambios; no hay presión por migrar código legacy estable, pero no se recomienda para proyectos nuevos.

## 10. Checklist rápido al generar código

- [ ] ¿El componente necesita ser cliente? Si no, Server Component.
- [ ] ¿La función que hace fetch/query necesita cache? Marca `'use cache'` explícitamente.
- [ ] ¿Es una mutación desde UI? Server Action con Zod, no route handler.
- [ ] ¿Hay `loading.tsx`/`error.tsx` en el segmento?
- [ ] ¿Los tipos de `params`/`searchParams` están como `Promise<...>` y se hace `await`?
- [ ] ¿SEO vía `generateMetadata`, no `<head>` manual?
