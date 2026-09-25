---
name: recharts-charts
description: Guía para gráficos y visualizaciones de datos con recharts (librería activa del proyecto). Los valores de tema, fuente de datos y stack del proyecto están en los Parámetros del proyecto. Úsala siempre que la tarea implique crear o revisar un gráfico, elegir el tipo de visualización correcto, definir tema/colores de un chart, o testear/diseñar un componente de visualización de datos.
---

# Visualización de datos — recharts + react-github-calendar

Guía de decisiones reales para las dos librerías de visualización del proyecto (ver Parámetros): **recharts** (gráficos de métricas del perfil) y **react-github-calendar** (calendario de contribuciones). No es documentación genérica de la API de recharts — es el criterio del equipo para que un gráfico nuevo sea legible, accesible y coherente con el resto del producto.

## Parámetros del proyecto — juegaKino (a editar al adaptar)

> Los únicos valores específicos de esta skill. Al adaptar a otro proyecto se editan estos parámetros (y los archivos de `/context` que referencian), no el cuerpo de la skill.

| Parámetro | Valor actual (`juegaKino`) |
|---|---|
| Librerías activas | `recharts` únicamente (frecuencias por número, histograma de aciertos, observado vs. esperado). Sin `react-github-calendar` |
| Fuente de datos | Resultados de la simulación local (PRNG con semilla), agregados en `src/domain/statistics.ts` y `frequency.ts` — sin APIs ni schemas de red |
| Acento de la serie principal | `kino-red`; variaciones del acento + neutros `gray` para series secundarias; `gold` solo para la categoría "premio/pozo" |
| Colores semánticos | `green`/`amber` solo si el gráfico comunica estado real (éxito/advertencia) |
| Grillas/fondos | Escala neutra fría (`gray-200`/`gray-700` para líneas de grilla); ver `/context/design-tokens.md` |
| Dark mode | Colores propios por gráfico para ambos temas — no asumir el default de la librería sobre los fondos dark del proyecto |

## 1. Elegir el tipo de gráfico correcto

- Distribución de categorías (ej. lenguajes del perfil, ver Parámetros) → gráfico de barras o dona (recharts `BarChart`/`PieChart`), no una tabla de números sueltos si el objetivo es que el lector lo escanee en segundos.
- Actividad en el tiempo (commits, contribuciones) → `react-github-calendar` (un patrón ya familiar para quien conoce la plataforma de origen) en vez de reinventar un heatmap propio con recharts.
- Métricas de impacto puntuales (ver Parámetros) → priorizar el número grande y legible sobre un gráfico complejo — no todo dato necesita una visualización, a veces un stat tile es más claro que un gráfico con un solo punto de interés.
- No agregues un tipo de gráfico nuevo (radar, scatter, etc.) solo porque recharts lo soporta — cada tipo nuevo es una convención visual más que aprender; usa el que ya resuelve el caso si existe.

## 2. Tema y color — coherencia con el sistema de diseño

- El color de la serie de datos destacada es el acento definido en Parámetros — no introduzcas una paleta categórica de colores saturados ajena al sistema de diseño (ver `ui-design-system`).
- Cuando un gráfico necesita distinguir varias categorías (ej. lenguajes de programación), usa la escala categórica derivada del acento más los neutros (ver Parámetros), reservando los colores semánticos solo si el gráfico realmente comunica estado (éxito/alerta), no como relleno decorativo de series.
- Fondos y grillas del gráfico siguen la escala neutra fría del resto de la UI (ver Parámetros) — una grilla con subtono cálido rompe la coherencia visual inmediatamente notable.
- Dark mode: cada gráfico define explícitamente sus colores para ambos temas (no asumas que el color por defecto de la librería se ve bien sobre los fondos dark del proyecto, ver Parámetros) — verifica contraste en ambos.

## 3. Contenedor y responsividad

- Todo componente de gráfico tiene **altura de contenedor explícita** (`ResponsiveContainer` de recharts con un `height` fijo o definido por el padre) — sin esto, el gráfico puede colapsar a 0px o crecer sin control según el layout circundante. Es el error más común y silencioso con recharts.
- El gráfico se adapta al ancho disponible (mobile/desktop) sin desbordar el contenedor ni requerir scroll horizontal salvo que sea el patrón esperado (ej. un heatmap de calendario ancho en mobile).

## 4. Accesibilidad en visualizaciones

- Contraste WCAG AA también aplica a gráficos: texto de ejes/leyendas, y el color de cada serie contra el fondo.
- Nunca la única forma de distinguir una serie/categoría es el color — agrega etiqueta directa, patrón o ícono cuando la distinción importa (ej. leyenda con texto, no solo un cuadro de color).
- Tooltip con contenido accesible (texto real, no solo un `title` de SVG poco soportado por lectores de pantalla) — el dato que aporta el tooltip debe estar disponible también sin depender solo del hover con mouse.
- `react-github-calendar` en particular: verifica que el tooltip/label de cada día sea navegable o al menos legible sin depender exclusivamente de hover preciso con mouse.

## 5. Datos y estados

- Igual que cualquier componente que consume la fuente de datos del proyecto (ver Parámetros): loading (skeleton del tamaño real del gráfico, no un spinner genérico que colapsa el layout), error (mensaje explícito, no un gráfico vacío sin explicación) y vacío (ej. sin actividad en el período) — un gráfico sin datos nunca se deja en blanco sin contexto.
- El dato que llega al gráfico ya pasó por el schema Zod que valida la fuente de datos (ver la skill del stack del proyecto, en Parámetros) — el gráfico no debe re-validar ni asumir un shape distinto al contrato ya establecido.

## 6. Qué testear (y qué no) en un gráfico

- Testea el **contrato observable**: qué datos llegan al componente y qué se renderiza como consecuencia (ej. cantidad de barras/segmentos igual a la cantidad de categorías de datos) — no el renderizado interno SVG de recharts, que es responsabilidad de la librería.
- Ver la skill de testing del stack del proyecto (en Parámetros) para el patrón general de testing de componentes con datos externos.

## 7. Checklist rápido al crear/revisar un gráfico

- [ ] ¿El tipo de gráfico elegido es el más simple que comunica el dato (no un tipo más complejo "porque se ve más interesante")?
- [ ] ¿El color principal, neutros y semánticos siguen los Parámetros, con semánticos solo si comunican estado real?
- [ ] ¿Tiene altura de contenedor explícita (`ResponsiveContainer` con `height` definido)?
- [ ] ¿Funciona en dark mode con colores propios verificados, no el default de la librería?
- [ ] ¿Ninguna serie se distingue solo por color (hay etiqueta/patrón adicional)?
- [ ] ¿Tiene estados de loading/error/vacío diseñados, no solo el estado con datos completos?
- [ ] ¿El test verifica el dato que llega al componente, no el SVG interno de recharts?
