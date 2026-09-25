# Definition of Done

Checklist único que el `orchestrator` usa para cerrar una feature o tarea como completa. Ninguna feature se marca `completa` en `/specs/[feature].md` si no cumple lo aplicable a su alcance. No todo ítem aplica a toda tarea (un fix puntual no pasa por `designer`), pero cuando aplica, es obligatorio — no una sugerencia.

> Adaptado a `juegaKino`: proyecto **frontend-only** — SPA de Vite + React 19 + TanStack Router + Zustand, sin backend ni APIs (ver `/context/project-context.md`). Hay secciones para el dominio matemático, el frontend, diseño y testing; aplica la que corresponda al alcance de la tarea.

## Dominio matemático — `src/domain/` (si la tarea toca lógica de simulación/probabilidad)

- [ ] Cada función pura está testeada con casos límite: combinatoria (C(0,0), C(25,14)=4.457.400), PRNG (misma semilla → misma secuencia), sorteo (14 números distintos en 1–25, sin repetición), frecuencias, estrategias (siempre 14, únicos, respetan números bloqueados), agregación
- [ ] Las probabilidades/core del cálculo se comparan contra **valores teóricos conocidos** y no solo contra "lo que devuelve el código" (ej. P(14 aciertos)=1/C(25,14); media de aciertos por sorteo → 7,84)
- [ ] Todo uso de aleatoriedad en tests fija la semilla — ningún test depende del azar real
- [ ] Sin `any` implícito ni explícito sin justificación documentada
- [ ] `src/domain/` no importa de React, del worker ni de librerías de UI (capa pura, reutilizable por worker y tests)

## Cómputo intensivo — Web Worker (si la tarea tocó simulación masiva)

- [ ] La simulación corre en un Web Worker, nunca en el hilo principal; la UI nunca se bloquea durante N sorteos
- [ ] Hay progreso reportado y cancelación limpia (no deja resultados huérfanos ni estados inconsistentes al cancelar)
- [ ] El worker es una capa delgada de mensajería: la lógica vive en funciones puras de `src/domain/` compartidas con tests

## Frontend (si la tarea tocó UI)

- [ ] Estados completos implementados: loading, error, vacío, éxito (no solo el happy path)
- [ ] Code splitting con `React.lazy`/`Suspense` en rutas o componentes pesados (gráficos), no todo el bundle cargado de entrada
- [ ] Sin `any` implícito ni explícito sin justificación documentada
- [ ] Componentes de gráficos (recharts) con altura de contenedor explícita
- [ ] Grid de selección de números: exactamente 14, sin repetidos, feedback visible de cuántos quedan, navegable por teclado con `aria-pressed`
- [ ] Persistencia en `localStorage` (si aplica) con manejo de datos corruptos/ausentes (fallback limpio)

## Diseño (si la tarea tocó UX/UI)

- [ ] Contraste WCAG AA verificado, no asumido
- [ ] Todo elemento interactivo alcanzable por teclado con foco visible
- [ ] Ningún estado/información crítica comunicada solo por color
- [ ] Acentos decorativos usan únicamente la paleta `kino-red` de marca; `navy` solo en superficies institucionales; `gold` solo para premio/pozo (colores semánticos — green/red/amber — aparte, para estado; el rojo de error usa un tono distinto del rojo de marca, ver restricción en `/context/project-context.md` §4)
- [ ] Especificación con valores exactos (no "un poco más de espacio") entregada a `frontend`

## Testing (siempre, salvo excepción explícita del usuario)

- [ ] Casos negativos cubiertos: cartón con 0/13/15 números, números fuera de 1–25, repetidos, N de sorteos extremos (1, muy grande), cancelación de la simulación a mitad de camino, `localStorage` corrupto
- [ ] Test de regresión si la tarea se originó en un bug reportado
- [ ] Sin tests flaky introducidos (determinismo verificado — semilla fija, sin `setTimeout` real, sin estado compartido sin limpiar)
- [ ] Cobertura de diff razonable en el código nuevo/modificado — no perseguir 100% global

## CI/CD y build (si la tarea afecta el build)

- [ ] Pipeline pasa lint → typecheck → tests → build sin pasos salteados
- [ ] Build de Vite (`npm run build`) completa sin warnings de bundle size no revisados
- [ ] Sin secretos en texto plano en el repo (no aplica por diseño, una SPA local sin API)

## Contexto y documentación

- [ ] Decisiones reutilizables registradas en `/context/project-context.md` (sección "Decisiones de arquitectura registradas")
- [ ] Si la tarea introdujo una convención nueva (nomenclatura, patrón adoptado), documentada donde el resto del equipo la va a encontrar, no solo mencionada en la conversación
- [ ] Handoffs entre agentes documentados según `/context/handoff-protocol.md` si la tarea fue multi-agente

## Cierre

- [ ] El `orchestrator` confirma que cada agente involucrado dio su artefacto por completo (no "a medias, se termina después" sin que quede declarado explícitamente como pendiente)
- [ ] Si algún ítem aplicable no se cumplió, se declara explícitamente como deuda técnica conocida — nunca se omite en silencio