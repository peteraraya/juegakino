# Design Tokens — juegaKino

Fuente de verdad de los valores exactos de color, tipografía, espaciado y estados para todo el equipo (`designer`, `frontend`, `qa-tester`). Referenciado desde `context/project-context.md` y desde las skills `ui-design-system`, `frontend-design`, `vite-tanstack-tailwind` y `qa-qc-react-vite`. Cualquier valor nuevo de color/tipografía/espaciado que se use en la app se agrega acá primero — nunca se elige "a ojo" en un componente y se documenta después. Los valores viven únicamente en `## Parámetros del proyecto` de cada skill y en `/context` — nunca hardcodeados en el cuerpo de un workflow.

## 1. Color de marca — escala `kino-red`

Única escala usada para el acento decorativo de la app (botón primario, links, foco, bordes activos, resaltado del feature "jackpot/premios"). Corresponde al rojo Kino oficial por defecto sobre neutros fríos. Esta paleta es **Brand Kino** — identidad oficial de Lotería de Concepción (Chile) — no un rojo "genérico": al adaptar a otro proyecto se edita esta escala y el acento, no el cuerpo de los workflows.

| Token | Uso principal (light) | Uso principal (dark) |
|---|---|---|
| `kino-red-50` / `kino-red-100` | Fondos sutiles de estado activo/hover en superficies claras | — |
| `kino-red-400` | Acento secundario, iconografía de premios sobre fondo claro | Texto de acento sobre fondo oscuro cuando `kino-red-300` no alcanza contraste |
| `kino-red-500` | Acento medio — hover/pressed intermedios | — |
| `kino-red-600` | **Acento primario** — botón primario, link, borde activo, foco, ball resaltada (light) | — |
| `kino-red-700` / `kino-red-800` | Estado `active`/`pressed` de `kino-red-600` | Acento medio — cuerpo de botones primarios (dark) |
| `kino-red-300` | — | **Acento primario** — botón primario, link, borde activo, foco (dark) |

Regla: `kino-red-600` en light y `kino-red-300` en dark son los pares por defecto para "el" rojo de marca — no se mezclan indistintamente dentro del mismo modo.

## 2. Neutros — escala `gray` (fría)

Fondos, superficies, texto y bordes. Nunca un gris con subtono cálido (nada de `stone`/`neutral`/`zinc` mezclado con `gray`) — el rojo Kino vive mejor sobre neutros fríos.

| Token | Uso |
|---|---|
| `white` / `gray-50` | Fondo base y superficies elevadas (cards) en light |
| `gray-100` / `gray-200` | Bordes y divisores en light; fondo de controles inactivos |
| `gray-500` / `gray-600` | Texto secundario en light |
| `gray-900` | Texto principal en light; fondo base en dark |
| `gray-800` | Superficies elevadas (cards) en dark |
| `gray-700` | Bordes y divisores en dark |
| `gray-100` / `gray-300` | Texto principal / secundario en dark |

## 3. Colores semánticos — solo para estado, nunca decorativos

| Token | Significado | Notas |
|---|---|---|
| `emerald/green-500` / `green-600` | Acierto, éxito, validado (números acertados, snapshots correctos) | No se usa como acento estético alternativo al rojo |
| `red-500` / `red-600` | Error, fallo de simulación, acierto faltante fuera de rango | Todo estado de error va acompañado de texto/ícono, nunca solo el color |
| `amber-500`/`orange-500` | Advertencia, "cerca de premio" (9 aciertos), en progreso | Distinguible de `red` también por ícono, no solo por tono |

> **`gold` / `amber` solo para jackpot/premios.** El oro (`kino-gold` ≈ `#D4AF37`) se reserva exclusivamente para la iconografía y el resaltado del premio mayor (jackpot 14/14) y el cintillo "Premios" — nunca para acentos decorativos genéricos del layout.

Los bloques de código/sintaxis conservan su resaltado nativo del tema de highlighting elegido — no se fuerzan a la paleta `kino-red`.

## 4. Tipografía

| Token | Familia | Uso |
|---|---|---|
| `font-display` | Newsreader | Títulos, headings, momentos editoriales (marcador oficial, card del sorteo) |
| `font-mono` | IBM Plex Mono | Código, datos del simulador, widgets tipo terminal/IDE (tabla de resultados, output del Monte Carlo con semilla) |
| `font-sans` (base) | Fuente sans del sistema/Tailwind por defecto | Cuerpo de texto general |

### Escala tipográfica (máximo 6 tamaños activos)

| Token | Tamaño | Uso |
|---|---|---|
| `text-xs` | 12px | Metadatos, labels auxiliares, probabilidades en tablas |
| `text-sm` | 14px | Texto secundario, controles |
| `text-base` | 16px | Cuerpo de texto |
| `text-lg` | 18px | Subtítulos, cards del cartón |
| `text-2xl` | 24px | Títulos de sección |
| `text-4xl`/`text-5xl` | 36px/48px | Título principal (hero) / números del resultado |

## 5. Espaciado

Escala de Tailwind en múltiplos de 4px (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px, `p-12` = 48px, `p-16` = 64px). Ningún valor arbitrario (`p-[13px]`) sin que primero se descarte que un token de la escala ya resuelve el caso.

## 6. Radios y sombras

| Token | Uso |
|---|---|
| `rounded-lg` (8px) | Cards, inputs, botones, cell del cartón — radio por defecto del sistema |
| `rounded-full` | Elementos circulares (balls del cartón seleccionadas/no, badges de estado, avatares) |
| `shadow-sm` | Elevación sutil (cards en reposo) |
| `shadow-md` | Elevación en hover/foco de elementos interactivos elevados |

## 7. Estados de componentes interactivos

Todo componente interactivo (botón, cell del cartón, control del simulador, card clicable) define explícitamente:

| Estado | Regla |
|---|---|
| `default` | Color base según §1/§2 |
| `hover` | Un paso más oscuro en la escala del color base (ej. `kino-red-600` → `kino-red-700` en light) |
| `focus` | Ring visible en `kino-red-600`/`kino-red-300` (2px mínimo), nunca `outline: none` sin reemplazo |
| `active` | Un paso adicional más oscuro/`pressed` respecto a `hover` |
| `disabled` | `gray-300`/`gray-600` con opacidad reducida (~50%), cursor `not-allowed` (ej. cartón con 14 seleccionados bloquea seleccionar más) |
| `loading` | Skeleton (`animate-pulse` sobre `gray-200`/`gray-700`) del tamaño del contenido real, nunca un spinner que colapsa el layout |
| `error` | Borde/texto `red-600`/`red-400` + ícono/mensaje — nunca solo el color (ej. semilla inválida) |
| `vacío` (empty) | Ícono + texto explicando qué pasó y qué puede hacer el usuario a continuación (ej. "aún no has corrido una simulación") |

## 8. Contraste — mínimos verificados

- Texto normal sobre fondo: **4.5:1** (WCAG AA).
- Texto grande (≥18px o ≥14px bold) y elementos gráficos/iconografía: **3:1** (aplica a las balls del cartón y al cintillo de premios).
- Pares verificados como conformes en este sistema: `kino-red-600` sobre `white`/`gray-50`; `kino-red-300` sobre `gray-900`/`gray-800`; `gray-900` sobre `white`/`gray-50`; `gray-500` sobre `white` como mínimo para texto secundario.
- Un tono de la escala `kino-red` que no cumpla AA en un fondo específico (ej. `kino-red-500` sobre `gray-100` en algunos casos límite) no se usa para texto en ese fondo — se sube a `kino-red-600`/`kino-red-700` o se usa solo como acento no textual (borde, bola decorativa, ícono grande).

## 9. Cómo se actualiza este archivo

- Cambios de token siguen el mismo flujo que cualquier decisión de arquitectura: se registran también en `context/project-context.md` (§4 "Decisiones de arquitectura registradas") cuando el cambio afecta a todo el sistema (ej. el paso a la paleta `kino-red` unificada documentado ahí).
- `designer` es quien propone un token nuevo o modificado; `frontend` confirma la implementación real en `tailwind.config.js`; ambos deben quedar sincronizados en el mismo PR — un token documentado acá que no existe en el config (o viceversa) es una inconsistencia a corregir de inmediato.
