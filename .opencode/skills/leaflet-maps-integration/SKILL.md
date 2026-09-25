---
name: leaflet-maps-integration
description: Guía experta para integrar mapas interactivos con Leaflet y react-leaflet en React/Next.js/TypeScript. Úsala siempre que el usuario pida crear o revisar un mapa, agregar markers/popups/polígonos/capas, resolver el error "window is not defined" en SSR, implementar clustering de marcadores, cargar GeoJSON, integrar geocoding, o pida un mapa "profesional", "performante" o "a prueba de fallos" con Leaflet. También aplica si menciona "react-leaflet", "tile layer", "marker cluster", "Leaflet.draw", o comparar Leaflet vs Mapbox/MapLibre.
---

# Leaflet — Integración experta de mapas (2026)

Guía de referencia para integrar `react-leaflet` (wrapper oficial de Leaflet para React) de forma robusta, performante y sin romper en Next.js. Genera siempre código completo, listo para copiar, con rutas de archivo exactas.

Leaflet es la elección correcta para: mapas con markers/popups/capas/dibujo, GeoJSON de tamaño moderado, y donde la simplicidad de API y el ecosistema de plugins (clustering, geocoding, draw) importan más que la personalización visual extrema. Si el proyecto necesita **vector tiles** con estilo dinámico tipo Mapbox Studio, o miles de features vectoriales complejas renderizando fluido a todo zoom, esa es la frontera real de Leaflet — considera MapLibre GL JS/Mapbox GL JS en ese caso, o `leaflet.vectorGrid` como puente si el resto del stack ya es Leaflet.

## 1. Instalación

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

```ts
// El CSS de Leaflet es obligatorio — sin esto los tiles y controles se ven rotos
import 'leaflet/dist/leaflet.css';
```

## 2. El problema #1: SSR y `window is not defined`

Leaflet **no soporta renderizado en servidor** — accede a `window`/`document` al importarse. En Next.js (App Router o Pages), esto rompe el build si el componente del mapa se importa de forma estática.

- Todo componente que use `react-leaflet` va marcado `'use client'`.
- El componente del mapa se carga con `next/dynamic` y `ssr: false` desde el componente padre — no basta con `'use client'` solo, porque Next igual intenta prerenderizar el módulo en el servidor al recolectar el bundle.

```tsx
// components/map/leaflet-map.tsx
'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function LeafletMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
```

```tsx
// components/map/leaflet-map.lazy.tsx — punto de entrada real de la página
'use client';
import dynamic from 'next/dynamic';

export const LeafletMap = dynamic(
  () => import('./leaflet-map').then((m) => m.LeafletMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);
```

- El contenedor padre (`MapContainer`) necesita **altura explícita** en CSS — Leaflet no tiene altura intrínseca, si el padre colapsa a 0px el mapa se renderiza roto o invisible.
- Skeleton/loading con la misma altura del mapa final, siempre, para evitar layout shift.

## 3. Iconos rotos — el segundo problema clásico

Los íconos default de Leaflet se rompen con bundlers modernos (Webpack/Turbopack/Vite) porque las rutas a los PNG se resuelven mal. Arréglalo una sola vez, centralizado:

```ts
// lib/leaflet-icon-fix.ts
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon.src ?? icon,
  shadowUrl: iconShadow.src ?? iconShadow,
});
```

Importa este archivo una sola vez, en el mismo módulo que se carga con `ssr: false` (nunca en un módulo que el servidor pueda evaluar).

- Para íconos custom por marker (más común en apps reales), define un `L.Icon` propio en vez de parchear el default — más explícito y no depende de assets del paquete:

```tsx
const customIcon = new L.Icon({
  iconUrl: '/icons/pin.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

<Marker position={position} icon={customIcon}>
  <Popup>{label}</Popup>
</Marker>
```

## 4. Estructura de componente — declarativo, no imperativo

- Usa los componentes declarativos de `react-leaflet` (`MapContainer`, `TileLayer`, `Marker`, `Popup`, `Polygon`, `GeoJSON`) como primera opción — se sincronizan con el ciclo de vida de React automáticamente.
- Cuando necesites acceso a la instancia imperativa de Leaflet (`L.Map`) para algo que react-leaflet no expone como prop (ej. `flyTo` programático, listeners de bajo nivel), usa el hook `useMap()` dentro de un componente hijo del `MapContainer` — nunca guardes la instancia del mapa en un ref global fuera del árbol de React.

```tsx
function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);
  return null;
}
```

- No mezcles manipulación directa del DOM de Leaflet (`map.addLayer(...)` manual) con capas declarativas del mismo tipo de dato — elige un enfoque por capa para evitar desincronización entre el estado de React y el estado interno de Leaflet.

## 5. Clustering — necesario desde unos cientos de markers

Renderizar miles de `<Marker>` individuales degrada tanto el DOM como el performance de interacción. A partir de unos cientos de puntos densos en la misma zona, usa clustering.

- **`react-leaflet-markercluster`** (o `@changey/react-leaflet-markercluster` para compatibilidad con versiones más nuevas de React/react-leaflet): la opción estándar, buena hasta ~100k markers.
- **Supercluster** (`supercluster` + `use-supercluster`): para datasets grandes (100k–500k+ puntos), es sensiblemente más rápido — usa un índice espacial en vez de reclustering ingenuo. Prefiérelo cuando el dataset supera el rango donde `markercluster` empieza a degradar.

```tsx
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';

<MarkerClusterGroup chunkedLoading>
  {points.map((p) => (
    <Marker key={p.id} position={p.position} icon={customIcon}>
      <Popup>{p.label}</Popup>
    </Marker>
  ))}
</MarkerClusterGroup>
```

- Con datasets grandes, memoiza la lista de markers (`useMemo`) y evita recrear objetos `position`/`icon` en cada render — React re-renderizando miles de elementos hijos es tan costoso como el clustering mismo si no se controla.
- Para actualizaciones frecuentes de posición (tracking en tiempo real), no reconstruyas todo el array de markers en cada tick — actualiza solo los que cambiaron y deja que el `key` estable evite remounts innecesarios.

## 6. GeoJSON y capas de datos

- El componente `<GeoJSON>` acepta un `key` para forzar remount cuando cambian los datos (a diferencia de otras props, Leaflet no diffea el contenido de un GeoJSON ya montado automáticamente).

```tsx
<GeoJSON key={dataVersion} data={geoJsonData} style={geoJsonStyle} onEachFeature={bindPopup} />
```

- Para GeoJSON grande (miles de features complejas), evalúa simplificar la geometría en el backend (ej. con `turf.js` o `mapshaper`) antes de mandarlo al cliente — no le pidas al navegador que renderice geometría a una resolución mayor de la que el zoom actual puede mostrar.
- Si el dato es dinámico y de alta frecuencia (tracking, sensores), considera `leaflet.vectorGrid` para servir vector tiles en vez de un GeoJSON monolítico — es el techo de performance real de Leaflet para datos vectoriales pesados.

## 7. Geocoding y búsqueda

- No implementes geocoding a mano contra Nominatim sin rate limiting propio — respeta la política de uso (máx. 1 req/seg, `User-Agent` identificable) o usa un proveedor con SLA (Mapbox Geocoding, Google) si el volumen es de producción.
- `leaflet-geosearch` es el plugin estándar si necesitas una barra de búsqueda integrada al mapa con múltiples providers intercambiables.

## 8. Estilo y consistencia visual

- Centraliza la URL del tile layer y su atribución en una constante — no la repitas por cada mapa del proyecto, y respeta siempre la atribución del proveedor de tiles (OpenStreetMap u otro) como requisito de licencia, no como detalle opcional.

```ts
// lib/leaflet/tile-config.ts
export const tileLayers = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
};
```

- Para modo oscuro, cambia el `TileLayer` a un basemap oscuro (CARTO dark, Stadia) en vez de aplicar un filtro CSS (`invert`) al mapa entero — el filtro rompe la legibilidad de los propios markers/popups superpuestos.
- Popups y tooltips custom vía `className` en el componente `Popup`/`Tooltip` + CSS propio, para que coincidan con el design system del resto de la app en vez de quedar con el estilo default de Leaflet.

## 9. Performance general

- `MapContainer` con `preferCanvas` activado cuando hay muchas capas vectoriales (polígonos, círculos) — renderiza a Canvas en vez de SVG/DOM, más liviano con cientos de shapes.
- Debounce en handlers de eventos de alta frecuencia (`moveend`, `zoomend`) si disparan fetches o cálculos costosos — no dispares un fetch en cada frame de un `move` continuo.
- `whenReady`/`whenCreated` para ejecutar lógica de inicialización una sola vez, no en cada render.
- Limita el `minZoom`/`maxZoom` y usa `maxBounds` cuando el dominio del mapa es acotado (un país, una ciudad) — evita que el usuario navegue a tiles vacíos innecesariamente.

## 10. Testing

- Extrae la lógica no visual (transformación de coordenadas, cálculo de bounds, clustering manual, parsing de GeoJSON) a funciones puras testeables con Vitest, separadas del componente de mapa.
- Para e2e (Playwright), testea el comportamiento observable (que el mapa se monte, que un click en un marker abra su popup con el contenido esperado) — no intentes aserciones sobre el estado interno de Leaflet o los tiles cargados, que dependen de red externa.
- Mockea `react-leaflet` en tests unitarios de componentes que envuelven el mapa (ej. un panel lateral que reacciona a selección) para no depender de `window`/DOM real en el entorno de test.

## 11. Checklist rápido al generar un mapa

- [ ] ¿El componente del mapa se carga con `next/dynamic` y `ssr: false`?
- [ ] ¿El contenedor tiene altura explícita?
- [ ] ¿Los íconos custom están definidos explícitamente (no dependiendo del default roto)?
- [ ] ¿Hay clustering si el dataset supera unos cientos de markers densos?
- [ ] ¿El `<GeoJSON>` tiene un `key` que cambia cuando cambian los datos?
- [ ] ¿Se respeta la atribución del proveedor de tiles?
- [ ] ¿Los handlers de eventos de alta frecuencia (`move`, `zoom`) están debounced si disparan trabajo costoso?
- [ ] ¿La lógica de transformación de datos geoespaciales está fuera del componente y testeada por separado?
