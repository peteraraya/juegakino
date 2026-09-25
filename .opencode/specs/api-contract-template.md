# Plantilla de Contrato de API

Formaliza como artefacto publicado y versionado el contrato de datos que un componente define al consumir una API, en vez de dejarlo solo como un bloque de código Zod pegado en la conversación. Copia esta plantilla a `/specs/api/[recurso].md` por cada recurso/endpoint externo nuevo o modificado.

> Adaptado a `juegaKino`: proyecto **frontend-only** — **NO hay APIs** (ni propias ni externas; ver `/context/project-context.md` §2). Esta plantilla se conserva como referencia para un **futuro consumo de API externa si el producto lo necesitara** (no existe hoy). En el estado actual, el "contrato" del proyecto es el **schema Zod de dominio** (`src/domain/`), documentado dentro de cada `/specs/[feature].md` (sección "Contrato de datos") — no se abre `specs/api/` sin que exista un recurso externo real que documentar.

## Por qué existe esto además del schema Zod

El schema Zod en el código es la fuente de verdad en tiempo de ejecución, pero **no es documentación consultable** sin leer el código fuente. Este archivo es la vista legible del contrato — para que `qa-tester` (y cualquiera del equipo) lo consulte sin depender de releer el código cada vez, y para mantener alineado el spec OpenAPI cuando `backend` expone Swagger (NestJS `@nestjs/swagger`).

---

## [Recurso] — ej. `Users`

**Base path**: `/api/v1/users`
**Agente dueño**: `backend` (API propia). Para recursos externos consumidos (ej. API de GitHub), el dueño es quien consuma el recurso — ver nota de adaptación arriba.
**Consumido por**: `frontend` (especificar página/feature), `qa-tester`

### `POST /api/v1/users`

**Descripción**: Crea un nuevo usuario.

**Autenticación requerida**: Sí / No — tipo (Bearer JWT, etc.)
**Permisos**: (ej. rol `admin`, o público)
**Rate limit**: (ej. 5 req/min)

**Request body**:
```ts
{
  email: string;      // formato email válido, requerido
  password: string;   // mínimo 8 caracteres, requerido
  name: string;        // 1-100 caracteres, requerido
}
```

**Response 201 (éxito)**:
```ts
{
  id: string;          // UUID
  email: string;
  name: string;
  createdAt: string;   // ISO 8601
  // nunca se expone password/hash
}
```

**Response 400 (validación fallida)**:
```ts
{
  statusCode: 400;
  message: string[];   // lista de errores de validación, uno por campo
  timestamp: string;
}
```

**Response 409 (email ya existe)**:
```ts
{
  statusCode: 409;
  message: string;
  timestamp: string;
}
```

**Casos límite conocidos** (para `qa-tester`):
- Email con mayúsculas/minúsculas mixtas — ¿se trata como duplicado del mismo email?
- Password exactamente en el límite mínimo/máximo de longitud
- Campos con solo espacios en blanco

---

## Convención general para cada endpoint documentado aquí

- **Un bloque por endpoint**, con método + path como encabezado.
- **Todo código de estado HTTP posible** documentado, no solo el camino feliz — si el endpoint puede devolver 401/403/404/409/422/500 en circunstancias reales, se listan todos.
- **Forma exacta del body**, no una descripción en prosa ("devuelve el usuario creado") — el tipo TypeScript/schema real.
- **Casos límite conocidos** explícitos: esto alimenta directamente los criterios de aceptación en `/specs/feature-spec-template.md` y el trabajo de `qa-tester`.
- Cuando el contrato cambia, se actualiza este archivo en el mismo PR que el código — un contrato desactualizado es peor que no tener contrato documentado, porque genera falsa confianza.

## Relación con OpenAPI/Swagger

Si el proyecto expone `@nestjs/swagger`, este archivo es la referencia de diseño antes de anotar los decorators (`@ApiProperty`, `@ApiResponse`) en el código — evita que la documentación autogenerada sea la única fuente y quede acoplada a que alguien recuerde anotar correctamente cada DTO. Para proyectos sin Swagger expuesto, este archivo *es* la documentación de contrato.
