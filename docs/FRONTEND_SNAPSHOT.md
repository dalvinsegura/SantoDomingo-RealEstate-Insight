# Frontend Snapshot — Estado actual (2026-03-25)

> Documento de referencia para el remake del frontend. Registra el estado funcional, estructura de datos y arquitectura actual antes de ser eliminado y reintegrado limpiamente.

---

## Stack tecnológico

| Tecnología | Versión |
|---|---|
| Next.js | 16.2.0 |
| React | 19.2.4 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |
| shadcn/ui (via Base UI) | ^4.0.8 |
| lucide-react | ^0.577.0 |

---

## Estructura de directorios

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout, fuentes Geist, lang="es"
│   ├── page.tsx            # Página principal — maneja tabs
│   └── globals.css         # Variables CSS del tema (OKLCH, dark/light)
├── components/
│   ├── dashboard/
│   │   ├── listado.tsx     # Grid de propiedades + paginación + detalle
│   │   ├── crear.tsx       # Formulario crear propiedad
│   │   ├── buscar.tsx      # Búsqueda filtrada + resultados
│   │   └── estadisticas.tsx # Resumen numérico (KPIs)
│   └── ui/                 # Primitivos ShadCN — NO editar manualmente
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
├── lib/
│   ├── api.ts              # ÚNICA fuente de llamadas al backend
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
├── types/
│   └── inmueble.ts         # Tipos e interfaces principales
├── .env.local              # NEXT_PUBLIC_API_URL
├── components.json         # Config shadcn (style: base-nova)
└── next.config.ts          # Config mínima (defaults)
```

---

## Tipos de datos (`types/inmueble.ts`)

### `Inmueble` — entidad principal

```ts
interface Inmueble {
  id: number
  titulo: string
  precio: number
  ubicacion: string
  tipo: TipoInmueble
  descripcion?: string
  habitaciones?: number
  banos?: number
  area_m2?: number
  estado?: EstadoInmueble
  caracteristicas?: string[]  // almacenado como JSON string en SQLite
  contacto?: Contacto
  fecha_creacion?: string
  fecha_actualizacion?: string
}
```

### `Contacto`

```ts
interface Contacto {
  nombre?: string
  telefono?: string
  email?: string
}
```

### Tipos enum

```ts
type TipoInmueble = 'Casa' | 'Apartamento' | 'Villa' | 'Comercio' | 'Terreno' | 'Penthouse' | 'Oficina'
type EstadoInmueble = 'disponible' | 'alquilada' | 'vendida' | 'en-tramite'

const TIPOS_INMUEBLE: TipoInmueble[]    // array de todos los tipos
const ESTADOS_INMUEBLE: EstadoInmueble[] // array de todos los estados
```

---

## Capa API (`lib/api.ts`)

URL base: `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001'`

### Interfaces de respuesta

```ts
ListarResponse   → { ok, inmuebles: Inmueble[], total: number }
ObtenerResponse  → { ok, inmueble: Inmueble }
CrearResponse    → { ok, id?: number, errores?: Record<string, string> }
MutarResponse    → { ok, message?: string }
InitResponse     → { ok, message?: string }
HealthResponse   → { ok, status?: string }
StatsResponse    → { ok, stats?: { total, precio_promedio, disponibles, tipo_mas_comun } }
```

### Funciones exportadas

| Función | Endpoint | Descripción |
|---|---|---|
| `listarInmuebles(params)` | `GET /api/inmuebles` | Lista con filtros: `ubicacion`, `precio_min`, `precio_max`, `limite`, `saltar` |
| `obtenerInmueble(id)` | `GET /api/inmuebles/:id` | Detalle por ID |
| `crearInmueble(datos)` | `POST /api/inmuebles` | Crear propiedad |
| `actualizarInmueble(id, datos)` | `PUT /api/inmuebles/:id` | Actualizar campos |
| `eliminarInmueble(id)` | `DELETE /api/inmuebles/:id` | Eliminar por ID |
| `inicializarBD()` | `POST /api/init` | Cargar 8 propiedades de prueba |
| `getStats()` | `GET /api/stats` | Estadísticas KPI |
| `healthCheck()` | `GET /api/health` | Verificar conexión |

Todas usan `cache: 'no-store'` y devuelven la interfaz correspondiente o `{ ok: false }` en caso de error.

---

## Componentes dashboard

### `listado.tsx` — Listado de propiedades
**Estado local:**
- `inmuebles: Inmueble[]`, `total: number`, `pagina: number`
- `cargando: boolean`, `error: string | null`
- `eliminando: number | null` (ID en proceso de borrado)
- `dialogAbierto: boolean`, `inmuebleSeleccionado: Inmueble | null`

**Funcionalidad:**
- Carga paginada (24 por página) al montar y al cambiar `pagina`
- Grid responsivo: 1 col (mobile) / 2 col (md) / 3 col (lg)
- Card por propiedad con título, precio (RD$), tipo, estado, ubicación
- Clic en card → `DetalleDialog` con info completa
- Botón eliminar por card (con estado de carga individual)
- Botón "Cargar Datos de Prueba" → llama `inicializarBD()`
- Skeleton loading en estado de carga
- Paginación manual con botones Anterior / Siguiente

### `crear.tsx` — Formulario de creación
**Secciones del formulario:**
1. Información principal: `titulo`, `precio`, `ubicacion`, `tipo`, `estado`
2. Detalles físicos: `area_m2`, `habitaciones`, `banos`
3. Descripción: `descripcion` (textarea), `caracteristicas` (texto separado por comas → array)
4. Contacto (opcional): `contacto.nombre`, `contacto.telefono`, `contacto.email`

**Comportamiento:**
- Conversión de strings a números para `precio`, `area_m2`, `habitaciones`, `banos`
- Split por coma para `caracteristicas`
- Solo incluye `contacto` si al menos un campo tiene valor
- Muestra errores de validación del backend por campo
- Mensaje de éxito con opción de "Crear otro"
- Reset completo del formulario tras éxito

### `buscar.tsx` — Búsqueda/filtrado
**Filtros disponibles:**
- `ubicacion` (texto libre)
- `precioMin` / `precioMax` (numéricos)

**Comportamiento:**
- No busca automáticamente; requiere clic en "Buscar"
- Paginación en resultados (24 por página)
- Botón "Limpiar" resetea filtros y resultados
- Card de resultado incluye botón eliminar
- Click en card → DetalleDialog con info completa
- Mensaje "no se encontraron propiedades" si resultado vacío

### `estadisticas.tsx` — KPIs
**Métricas mostradas:**
- Total de propiedades
- Precio promedio (formateado como `RD$ X,XXX,XXX`)
- Propiedades disponibles
- Tipo más común

**Comportamiento:**
- Carga automática al montar
- Muestra "..." durante carga
- Botón "Actualizar" para refrescar
- Mensaje de error si el endpoint falla

---

## Navegación (`app/page.tsx`)

Página única con 4 tabs:

| Tab | Valor | Componente |
|---|---|---|
| Listado | `"listado"` | `<Listado />` |
| Crear | `"crear"` | `<Crear />` |
| Buscar | `"buscar"` | `<Buscar />` |
| Estadísticas | `"estadisticas"` | `<Estadisticas />` |

Estado manejado con `useState("listado")`. No usa router para navegación entre tabs.

---

## Problemas conocidos (razón del remake)

- Crashing frecuente en la UI (errores no controlados)
- Integración con API deficiente / llamadas que fallan silenciosamente
- Falta de manejo robusto de errores en componentes
- Estado inconsistente entre tabs (ej: crear propiedad no refresca listado)
- No hay feedback de red (sin toasts, sin retry)
- Formulario `crear.tsx` sin validación client-side previa al envío

---

## Lo que debe conservar el remake

- Misma estructura de tabs (Listado / Crear / Buscar / Estadísticas)
- Mismos tipos (`Inmueble`, `Contacto`, `TipoInmueble`, `EstadoInmueble`) en `types/inmueble.ts`
- `lib/api.ts` como única fuente de llamadas — reescribir limpio con manejo de errores
- Mismos endpoints de API (ver tabla arriba)
- UI en español
- Moneda en RD$ (pesos dominicanos)
- Paginación de 24 items por página
- Stack: Next.js 16 + React 19 + Tailwind 4 + shadcn (base-nova)
