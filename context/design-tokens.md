# Design tokens — juegaKino

**Fuente de verdad única** de color, tipografía, espaciado, radio y elevación del producto.
`tailwind.config.ts` y `src/styles/index.css` son la *implementación* de este documento: si un
valor cambia, se cambia acá primero y después se propaga.

Todos los ratios de contraste de este documento están **medidos** (fórmula WCAG 2.x), no estimados.
Los umbrales son: **4.5:1** texto normal, **3:1** texto grande (≥18.66px bold / 24px) y elementos
gráficos / bordes de control (WCAG 1.4.11).

---

## 1. Dirección visual

**Tesis: "papel, tinta y un solo rojo".** Tres materiales, sin más.

- **Papel cálido** (`paper`) como fondo, no gris azulado — la app se lee como una mesa de trabajo
  analítica, no como un dashboard corporativo.
- **Tinta cálida** para todo el texto: la jerarquía se construye con peso y tono de tinta, no con
  color de marca.
- **Un rojo usado con avarizia** — CTA, bolilla activa, jackpot. En cualquier otro lado, tinta.
- **Bordes de un pelo en lugar de sombras.** La sombra difusa es lo que más delata una plantilla
  generada; el borde nítido sobre papel lee como editorial.
- **Cero degradados, cero sombras coloreadas, cero glow.** No son un gusto: son el patrón que
  delata interfaces generadas por IA, que es justo lo que el producto evita.

### Rampa neutra: cálida-neutra, no beige

Los neutros llevan un subtono cálido muy leve (croma ≤ 0.012, matiz ~60°). El límite es
intencional: **más de croma 0.02 y el producto entra en territorio "beige + terracota"**, que es
precisamente el cliché de plantilla que se quiere evitar. El resultado debe leerse casi neutro,
solo con temperatura cálida.

---

## 2. Superficies (light / dark)

| Token | Light | Dark | Rol |
|---|---|---|---|
| `paper` | `#FAF9F7` | `#0C0A09` | Fondo de página |
| `surface` | `#FFFFFF` | `#1C1917` | Card, input, popover, dialog |
| `surface-sunken` | `#F5F5F4` | `#231F1E` | Wells de progreso, filas alternas, hovers |

`surface` sobre `paper` en light es solo **1.05:1** — deliberado. Las superficies NO se separan por
contraste de fondo: se separan por el **borde de un pelo** (§4). Por eso toda `surface` dentro de
`paper` necesita borde, y una `surface` sin borde es un error de layout, no un estilo.

---

## 3. Tinta

| Token | Light | Dark | Ratio (sobre `paper`) | Rol |
|---|---|---|---|---|
| `ink-900` | `#1C1917` | `#FAFAF9` | 16.62 / 18.92 | Titulares |
| `ink-800` | `#292524` | `#EDEAE8` | 14.42 / 16.50 | Texto fuerte, celdas |
| `ink-700` | `#44403C` | `#D6D2CF` | 9.76 / 13.15 | Texto de tabla, etiquetas |
| `ink-600` | `#57534E` | `#A8A29E` | 7.25 / 7.83 | Párrafos |
| `ink-500` | `#79716C` | `#8F8A85` | 4.54 / 5.78 | Metadatos, ejes de chart |

### `ink-500` solo es válido sobre `paper` y `surface` — en cualquier otro fondo, `ink-600`

Es el token con menos margen del sistema, y el margen se pierde en cuanto cambia el fondo. Medido:

| Fondo | `ink-500` | Veredicto | Token correcto |
|---|---|---|---|
| `paper` `#FAF9F7` | 4.54 | AA (justo) | `ink-500` |
| `surface` `#FFFFFF` | 4.78 | AA | `ink-500` |
| `surface-sunken` `#F5F5F4` | **4.38** | ✗ solo texto grande | `ink-600` (**6.99**) |
| `accent-tint` `#FEF2F3` | **4.37** | ✗ solo texto grande | `ink-600` (**6.98**) |

**Regla:** dentro de un well, una tabla, un `accent-tint` o cualquier superficie teñida, el texto
secundario es `ink-600`, no `ink-500`. `ink-500` queda para metadatos sobre `paper`/`surface` y para
los ejes de los gráficos (donde comparte fondo con el chart, no con un panel).

Además, aun sobre `paper`, **no usar `ink-500` para texto de más de 60 caracteres por línea** ni
como única fuente de un dato crítico: 4.54:1 no tiene margen para error.

> Nota dark: el equivalente directo de `ink-500` light (`#78716C`) da **4.12:1 sobre `paper` — falla
> AA**. Por eso el token dark es `#8F8A85` y no una traducción simétrica de la rampa light. Las
> rampas cálidas no se reflejan al 100% entre temas.

---

## 4. Bordes

| Token | Light | Dark | Uso | Ratio |
|---|---|---|---|---|
| `line` | `#E7E5E4` | `#2C2827` | Separadores decorativos, borde de `surface` | decorativo |
| `line-strong` | `#D6D3D1` | `#3A3634` | Borde de tabla, divisor de nav | decorativo |
| `line-control` | `#79716C` | `#6E6865` | **Borde de input y select** | **4.78 / 3.60** |

`line` y `line-strong` son **decorativos por diseño** (1.19–1.65:1). No cumplen 1.4.11 y no pretenden
cumplir: separan, no comunican. La regla es explícita — **`line-control` es el único borde que puede
ser la única pista de un control.** Si un borde tiene que *informar* algo (que es un input, que el
elemento está deshabilitado, dónde está el foco), usa `line-control`.

### Por qué el borde de input es `ink-500` y no un hairline

El reflejo "premium" es un input con borde casi invisible. Eso **falla WCAG 1.4.11**, y en este
proyecto el borde *es* la única pista de que el elemento es un control. Medido:

| Candidato | Sobre `surface` | 3:1 |
|---|---|---|
| `#D6D3D1` (`line-strong`) | 1.42 | ✗ |
| `#A8A29E` | 2.52 | ✗ |
| **`#79716C` (`line-control`)** | **4.78** | **✓** |

A 1px, `line-control` se ve discreto y cumple. **No se sacrifica contraste por estética en un
control.** Además el input lleva `bg-surface-sunken` como relleno, que da una segunda pista de
afordancia además del borde.

El token dark `#6E6865` da 3.60:1 sobre `paper` — pasa 3:1 sin necesidad de workaround, por eso es el
valor definitivo y no un parche documentado.

---

## 5. Acento — `kino-red` (único acento decorativo)

Se conserva el rojo oficial del logotipo Kino. **No se agrega un segundo acento.**

| Token | Hex | Rol | Ratio verificado |
|---|---|---|---|
| `accent-fill` | `#E4002B` | Botón primario, bolilla seleccionada, barra de progreso | blanco encima **4.85** |
| `accent-fill-hover` | `#C00025` | Hover del primario | blanco encima **6.43** |
| `accent-text` | `#C00025` | Links, nav activo, texto de énfasis | sobre paper **6.11** |
| `accent-text-strong` | `#9E001F` | Texto sobre `accent-tint` | sobre tint **7.77** |
| `accent-tint` | `#FEF2F3` | Fondo de chip, hover de nav, well de énfasis | — |
| `accent-line` | `#FBC4CA` | Borde de `accent-tint` | decorativo |
| `accent-on-dark` | `#F79AA5` | Acento legible sobre `paper` dark | **9.52** |

### Regla de asignación (obligatoria)

> **`-600` / `accent-fill` es SOLO relleno de botón y bolilla seleccionada.**
> **Texto y bordes usan `accent-text` (`#C00025`) o `accent-text-strong` (`#9E001F`).**

Esta única distinción corrige los 13 incumplimientos de contraste que arrastraba la versión anterior
(`text-kino-red-600` a 4.43:1, `kino-red-400` a 2.94:1). `#E4002B` es un rojo saturado designed para
logo: funciona como superficie de color, no como tinta sobre blanco.

### El acento en dark no es el mismo rojo

`#E4002B` sobre `#0C0A09` no alcanza para texto. En dark, el acento **de texto** pasa a `#F79AA5`
(9.52:1) mientras el **relleno** sigue siendo `#E4002B` (blanco encima, 4.85:1). Es el mismo rojo de
marca, ajustado por función, no un color nuevo.

---

## 6. Semánticos (estado — nunca decoración)

Comunican estado, no decorean. Se usan exclusivamente para eso.

| Rol | Texto | Tint | Texto sobre tint | Verificado |
|---|---|---|---|---|
| `success` | `#15803D` | `#F0FDF4` | `#166534` | 4.77 / 6.81 |
| `warning` | `#B45309` | `#FFFBEB` | `#92400E` | 4.77 / 6.84 |
| `danger` | `#B91C1C` | `#FEF2F2` | `#991B1B` | 6.15 / 7.60 |
| `info` | `#1D4ED8` | `#EFF6FF` | `#1E40AF` | 6.37 / 8.01 |

En dark: `success` `#4ADE80` (11.34), `warning` `#FBBF24` (11.83), `danger` `#F87171` (7.14),
`info` `#60A5FA` (7.77). Tints dark: `success` `#122A17`, `warning` `#2E2410`, `danger` `#331616` —
texto `ink-900` encima: 14.68 / 14.61 / 15.87.

### Regla innegociable

> **Ningún estado se comunica solo por color.** Siempre va acompañado de glifo + texto.
> `✓ ideal` / `● aceptable` / `✗ fuera`, `Sí` / `—`, `Sí` / `—`.

Esto ya se respetaba en `GeneratorPage` (evaluación de tips) y `StatsPage` (tabla de premios); el
sistema lo extiende a todas las tablas de estado, incluidas las de `ComparadorPage` y `VerifierPage`,
donde hoy el color es el único portador en la columna de métrica.

---

## 7. Superficies institucionales — `navy`

`navy` queda **exclusivo** para superficies institucionales (footer, hero oscuro, chip de premio).
No se usa para texto ni para bordes.

| Token | Hex | Verificado |
|---|---|---|
| `navy-900` | `#071420` | blanco encima **18.58** |
| `navy-800` | `#0A1929` | — |
| `gold-300` | `#E9C46A` | sobre navy-900 **11.82** |
| `gold-400` | `#D4AF37` | sobre navy-900 **8.84** |

**`gold` es exclusivo de premio/pozo.** `#B89425` sobre blanco da 2.88:1 — **no se usa `gold` como
texto ni borde en superficie clara.** Solo sobre `navy-900`, o con `gold-300` como relleno de chip.

---

## 8. Tipografía

Tres familias, por rol. **Una familia nueva es una decisión de identidad**, no un ajuste de componente.

| Rol | Familia | Pesos | Uso |
|---|---|---|---|
| Display | **Newsreader** | 400/500/600 | h1, h2, logo, cifras grandes |
| Texto | **Inter** | 400/500/600 | Todo el cuerpo |
| Datos | **IBM Plex Mono** | 400/500 | Semillas, frecuencias, probabilidades, tablas |

Newsreader es serif humanista de contraste medio: editorial y sobrio, no geométrico ni decorativo.
Inter se elige por x-height alta y `font-variant-numeric: tabular-nums` disponible — esta app muestra
`1/4.457.400` en tabla tras tabla y la alineación en coma decimal no es negociable.

### Escala — 8 tokens, nada fuera de la escala

| Token | rem / px | Line-height | Tracking | Rol |
|---|---|---|---|---|
| `display` | 3 / 48 | 1.08 | −0.02em | Hero de inicio |
| `h1` | 2.25 / 36 | 1.15 | −0.015em | Título de página |
| `h2` | 1.5 / 24 | 1.25 | −0.01em | Sección |
| `h3` | 1.125 / 18 | 1.35 | 0 | Subsección |
| `body` | 1 / 16 | 1.6 | 0 | Párrafo |
| `small` | 0.875 / 14 | 1.5 | 0 | Metadatos |
| `eyebrow` | 0.75 / 12 | 1.4 | **+0.14em** | Label en versalita |
| `data` | 0.75 / 12 | 1 | 0 | Cifra densa y glifo de estado |

`eyebrow` **reemplaza los `text-[11px]` y `text-[10px]`** de la versión anterior. Concentrar el
tracking amplio en un solo rol es lo que convierte un label en un label de sistema en vez de un texto
chico arbitrario. **12px es el piso absoluto del sistema** — nada más chico.

El piso aparece en dos variantes porque el tracking y la tarea son incompatibles: `eyebrow` para
rótulos (el tracking es lo que los delata como sistema), `data` para lo que debe ser compacto —
glifos de estado dentro de un badge de 16px y celdas con 14 cifras como `3·7·9·10·12·13·15·17·18·19·21·22·24·25`.
Usar `eyebrow` ahí ensancha justo lo que tiene que caber; usar `text-[10px]` reabre el piso. Ninguno
de los dos errores.

### Cifras

Todo número que sea dato (semilla, probabilidad, frecuencia, premio, peso) usa `font-mono` +
`tabular-nums`. En tablas, alineación a la derecha en la columna numérica.

---

## 9. Espaciado, radio y elevación

- **Espaciado:** escala de Tailwind (múltiplos de 4px). Ningún valor arbitrario (`mt-[13px]`) — es
  señal de que el layout no está resuelto.
- **Anchos de lectura:** `prose` 720px (60–75 caracteres a 16px) · herramienta con sidebar 1280px ·
  dashboard/tablas 1440px.
- **Breakpoints con comportamiento explícito:** `sm 640` (grid de bolillas a 5 columnas) ·
  `md 768` (sidebar pasa bajo el grid) · `lg 1024` (nav completa) · `xl 1280` (ancho de herramienta).
- **Radio:** `sm 6px` (chip, input) · `md 8px` (botón, card) · `lg 12px` (dialog) · `full` (bolilla).
  Un solo radio por categoría de componente — no se mezclan radios en la misma familia visual.
- **Elevación:** `shadow-none` es el default. `shadow-sm` solo en tooltip y menu flotante (necesitan
  flotar sobre contenido). `shadow-lg` solo en el scrim del dialog.
- **Objetivo táctil:** `sm` 32px (solo puntero fino) · `md` 44px · `lg` 48px. Todo control pensado
  para touch es `md` o mayor. El caso que fallaba era `InfoTip` en 16×16px.

---

## 10. Movimiento

- Duración: **120ms** (micro-estados: hover, focus) · **200ms** (aparición de dialog, toast).
- Easing: `cubic-bezier(0.2, 0, 0.2, 1)`.
- **Todo el movimiento respeta `prefers-reduced-motion: reduce`** (skeletons, shimmer, transiciones).
- Sin animación decorativa. Si un movimiento no confirma una acción o no guía la atención, no existe.

---

## 11. Reglas de componente

1. **Variantes antes que duplicados.** Un componente de UI base resuelve sus diferencias por prop
   (`variant`, `size`), nunca por copia con estilos parecidos. Dos formas de resolver lo mismo es una
   regresión.
2. **Estados completos.** `default / hover / focus-visible / active / disabled / loading` (+ `error` y
   vacío donde aplique). Un componente que solo define `default` está incompleto.
3. **Foco siempre visible**: `ring-2 ring-accent-text ring-offset-2 ring-offset-paper` (6.11:1).
   Nunca `outline: none` sin reemplazo visible.
4. **Un solo `primary` por vista.** Donde había 4 botones que parecían CTA, los no-vigentes pasan a
   `secondary` o `ghost`.
5. **Dark mode no es un paso posterior.** Cada token tiene su par; un componente nuevo se entrega
   con ambos.

---

## 12. Deploy a producción

Lo que sigue es **deuda consciente**, documentada para no que se pierda:

1. **Auto-hostear los woff2.** `index.html` hoy usa el CDN de Google Fonts con `preconnect` +
   `display=swap` y `@font-face` de fallback con `size-adjust` (evita layout shift). Para producción,
   bajar los `woff2` latin a `public/fonts/` y servir desde el mismo origen: quita una dependencia de
   tercero en el primer render y mejora el LCP.
2. **Foco por teclado en el dialog.** `Dialog` ya atrapa foco, cierra con `Escape` y devuelve el foco
   al disparador; falta el test unitario que lo cubra (ver `qa-qc-react-vite`).
3. **`prefers-color-scheme` como única fuente de tema.** El toggle manual de tema es una decisión de
   producto, no de diseño: si se agrega, necesita token en `uiStore` + `color-scheme` en `<html>`.