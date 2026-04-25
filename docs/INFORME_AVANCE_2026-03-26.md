# Informe de Avance — Sprint Features Analíticas
**Proyecto:** Santo Domingo Real Estate Insight (REI)
**Fecha:** 26 de marzo de 2026
**Autor:** Dalvin Segura

---

## Resumen Ejecutivo

Se implementaron dos nuevas funcionalidades analíticas sobre el dashboard existente de REI: una **calculadora interactiva de precio justo** basada en similitud ponderada y un **mapa de calor geográfico** con precios por sector de Santo Domingo. Ambas features están integradas como nuevos tabs en el dashboard principal y consumen datos reales de la base de datos SQLite del proyecto.

Adicionalmente se corrigieron tres bugs preexistentes detectados durante el desarrollo.

---

## Feature 1: Calculadora de Precio Justo

### Descripción
Herramienta interactiva que estima el valor de mercado de un inmueble comparándolo contra propiedades similares en la base de datos. El usuario ingresa tipo, área, habitaciones y sector, y recibe una estimación con rango de confianza.

### Endpoint
```
GET /api/calculator/estimate
Params: tipo* | area_m2 | habitaciones | ubicacion
```

### Algoritmo — Modelo de Similitud Ponderada

El modelo opera en tres etapas sobre todas las propiedades del mismo tipo (hasta 200, sin hard cutoffs):

**Etapa 1 — Scoring por dimensión**

| Dimensión | Método | Comportamiento |
|-----------|--------|----------------|
| Área | Gaussiana en log-ratio: `exp(-2 · ln(area/target)²)` | 2× diferencia → score 0.37 · 4× diferencia → score 0.02 |
| Habitaciones | Escalonado: 1.0 / 0.75 / 0.45 / 0.15 | Para diff 0 / 1 / 2 / 3+ |
| Ubicación | Multiplicador ×2.0 por token match (≥4 chars) | Mismo sector = doble peso |
| Dato ausente | Penalización neutra 0.5 | No excluye, solo reduce influencia |

**Etapa 2 — Limpieza de outliers**

Remoción por método IQR (×1.5) sobre precios crudos antes de calcular el promedio. Evita que propiedades con precios anómalos distorsionen la estimación.

**Etapa 3 — Promedio ponderado**

```
precio_estimado = Σ(precio_i × peso_i) / Σ(peso_i)
```

El precio por m² se calcula como `precio_estimado / area_m2` cuando el usuario provee el área, siendo más preciso que promediar los valores de comparables.

**Ejemplo de respuesta:**
```json
{
  "precio_estimado": 228797,
  "precio_p25": 147840,
  "precio_p75": 430000,
  "precio_m2_promedio": 2860,
  "cantidad_comparables": 101,
  "comparables_similares": 56,
  "confianza": 92
}
```

### UI / Frontend

El panel de resultados incluye:

- **Precio estimado** en tamaño prominente con precio/m²
- **Barra de rango** visual con marcador sobre el estimado y banda IQR sombreada (P25–P75)
- **Barra de confianza** con color semántico (verde ≥60% / amarillo ≥30% / rojo <30%) y contador `X similares / Y comparables`
- **Sección metodológica** en el formulario explicando cómo funciona el algoritmo

---

## Feature 2: Mapa de Calor por Sector

### Descripción
Visualización geográfica interactiva sobre un mapa real de Santo Domingo. Cada sector aparece como un círculo coloreado posicionado en sus coordenadas reales, con intensidad proporcional a la métrica seleccionada.

### Endpoint
```
GET /api/sectores/heatmap
```

La query agrupa propiedades por `sector_normalizado` (data scrapeada) o por `ubicacion` como fallback para registros manuales, calculando count, precio promedio, mín/máx y precio/m² por sector.

### Implementación Técnica

Leaflet requiere acceso al DOM y es incompatible con el SSR de Next.js. Se resolvió con una arquitectura de dos componentes:

```
mapa-calor.tsx            ← lógica, estado, ranking, toggle de métrica
  └─ dynamic(import('./mapa-sd-leaflet'), { ssr: false })
       └─ mapa-sd-leaflet.tsx   ← mapa Leaflet inicializado en useEffect
```

**Configuración del mapa:**
- Tiles: CartoDB Dark Matter (fondo oscuro que contrasta con los círculos de calor)
- Centro inicial: 18.490°N, 69.920°W · Zoom 12
- Librería: `leaflet 1.9.4` instalada via pnpm

**Círculos por sector:**
- Radio: proporcional a cantidad de propiedades (10–36 px)
- Color: gradiente HSL continuo `hue = (1 − t) × 220` → azul (barato) a rojo (caro)
- Click: popup con precio promedio, mín/máx y precio/m²
- Hover: tooltip con nombre del sector

**Matching de sectores:**
Los nombres de sectores que devuelve la BD son texto libre. Se implementó un matcher fuzzy en tres niveles: exacto → substring → token match (≥4 chars), para vincularlos a las coordenadas predefinidas.

**Coordenadas:** 33 sectores con coordenadas verificadas + ~20 sectores adicionales con coordenadas aproximadas para cubrir la data scrapeada.

**Métricas alternables:** Precio Promedio / Cantidad de propiedades / Precio por m²

Al cambiar métrica, los colores se recalculan y los círculos se redibujan sin recargar el mapa base.

---

## Bugs Corregidos

| # | Error | Causa Raíz | Fix Aplicado |
|---|-------|-----------|--------------|
| 1 | `no such column: estado` en Estadísticas | Columna `estado` referenciada en `get_stats()` pero nunca creada en el schema SQLite | Agregada a `init_db()` y a `migrate_scraping_columns()`. La migración ahora corre automáticamente al importar `db_config` |
| 2 | "Error al cargar estadísticas" en frontend | `/api/stats` retornaba campos flat (`promedio`) pero el frontend esperaba estructura anidada `stats.precio_promedio` | Ruta ajustada para retornar `{ ok, stats: { total, precio_promedio, disponibles, tipo_mas_comun } }` |
| 3 | Calculadora mostraba datos del cálculo anterior | `useCallback` mantenía closure stale con parámetros viejos | Reemplazado por función directa; `setResultado(null)` ejecutado al inicio de cada cálculo |

---

## Archivos Modificados / Creados

| Archivo | Operación | Descripción |
|---------|-----------|-------------|
| `backend/src/database/crud.py` | Modificado | `get_comparables_for_calculator()` y `get_sector_heatmap_data()` |
| `backend/src/database/db_config.py` | Modificado | Columna `estado`, migración automática al importar |
| `backend/src/app.py` | Modificado | Rutas `/api/calculator/estimate`, `/api/sectores/heatmap`, fix `/api/stats` |
| `frontend/types/inmueble.ts` | Modificado | Interfaces `EstimacionPrecio`, `SectorHeatmapItem` |
| `frontend/lib/api.ts` | Modificado | `calcularPrecioJusto()`, `getSectorHeatmap()`, tipos de respuesta |
| `frontend/app/page.tsx` | Modificado | Tabs "Calculadora" y "Mapa de Calor" |
| `frontend/components/dashboard/calculadora.tsx` | Creado | Componente calculadora |
| `frontend/components/dashboard/mapa-calor.tsx` | Creado | Wrapper del mapa con ranking y toggle |
| `frontend/components/dashboard/mapa-sd-leaflet.tsx` | Creado | Mapa Leaflet sin SSR |

---

## Dependencias Agregadas

| Paquete | Versión | Motivo |
|---------|---------|--------|
| `leaflet` | 1.9.4 | Mapa interactivo |
| `@types/leaflet` | 1.9.21 | Tipos TypeScript para Leaflet |

---

## Estado Actual

| Feature | Estado |
|---------|--------|
| Calculadora de precio justo | Funcional |
| Mapa de calor por sector | Funcional |
| Fix columna `estado` | Aplicado |
| Fix respuesta `/api/stats` | Aplicado |
| Fix stale closure calculadora | Aplicado |
