# Presentación Final — Santo Domingo Real Estate Insight
> 30 minutos · Estructura sugerida por slide

---

## SLIDE 1 — Portada

# Santo Domingo Real Estate Insight
### Plataforma integral de gestión y análisis del mercado inmobiliario

**Materia:** [nombre de la materia]  
**Integrantes:** [nombres del grupo]  
**Fecha:** Abril 2026

---

## SLIDE 2 — El Problema

### ¿Por qué este proyecto?

- El mercado inmobiliario de RD está **fragmentado**: datos dispersos en múltiples portales (clasificados.com.do, supercasas.com, etc.)
- No existe una herramienta accesible para **comparar precios por sector**
- Difícil saber si un precio es **justo** o no sin experiencia en el mercado
- Corredores y compradores pierden tiempo buscando información manualmente

> **Nuestra propuesta:** centralizar, normalizar y analizar esa información en un solo lugar.

---

## SLIDE 3 — La Solución

### ¿Qué construimos?

Una plataforma web full-stack con tres capas:

| Capa | Qué hace |
|------|----------|
| **Scraping** | Extrae propiedades de portales reales automáticamente |
| **Backend API** | Almacena, valida y expone los datos vía REST |
| **Dashboard** | Permite gestionar propiedades, buscar, calcular precios y ver el mapa |

---

## SLIDE 4 — Stack Tecnológico

### Herramientas utilizadas

**Backend**
- Python 3.13 + Flask 3 — API REST
- SQLite — Base de datos relacional embebida
- BeautifulSoup / requests — Web scraping

**Frontend**
- Next.js 16 (App Router) + React 19
- ShadCN UI + Tailwind CSS 4 — Componentes y estilos
- Leaflet 1.9 — Mapa interactivo

**Infra / Dev**
- Git + GitHub — Control de versiones
- pnpm — Gestor de paquetes frontend

---

## SLIDE 5 — Arquitectura del Sistema

### Dos procesos independientes comunicados por API

```
┌─────────────────────┐         REST API          ┌──────────────────────┐
│   Frontend          │  ←──────────────────────→  │   Backend            │
│   Next.js :3000     │     JSON HTTP requests      │   Flask :5001        │
│                     │                             │                      │
│  components/        │                             │  src/app.py          │
│  lib/api.ts  ───────┼─────────────────────────→  │  src/database/       │
│  types/             │                             │  src/scrapers/       │
└─────────────────────┘                             └──────────┬───────────┘
                                                               │
                                                    ┌──────────▼───────────┐
                                                    │   SQLite DB          │
                                                    │   data/real_estate   │
                                                    └──────────────────────┘
```

**Regla de diseño:** todo acceso al backend pasa por `frontend/lib/api.ts` — nunca fetch directo desde componentes.

---

## SLIDE 6 — Demo: Dashboard Principal

### 4 secciones de navegación

`[SCREENSHOT: listado de propiedades en grid — 01-listado-completo.png]`

- **Listado** — Grid de tarjetas con todas las propiedades
- **Crear** — Formulario con validación server-side
- **Buscar** — Filtros por ubicación y rango de precio
- **Estadísticas** — Métricas en tiempo real

---

## SLIDE 7 — Demo: Crear y Gestionar Propiedades

### CRUD completo

`[SCREENSHOT: formulario de creación con datos — 02-formulario-creacion.png]`

**Validaciones del servidor (forms.py):**
- `titulo` — 5 a 200 caracteres, obligatorio
- `precio` — número ≥ 0, obligatorio
- `tipo` — Casa / Apartamento / Villa / Penthouse / Comercio / Oficina / Terreno
- `estado` — disponible / alquilada / vendida / en-tramite
- `contacto` — nombre, teléfono, email (opcional)

`[SCREENSHOT: modal de detalles — 06-modal-detalles.png]`

---

## SLIDE 8 — Demo: Búsqueda Avanzada

### Filtros sin recargar página

`[SCREENSHOT: búsqueda con resultados filtrados — 05-busqueda-resultados.png]`

**Filtros disponibles:**
- Ubicación (texto libre, case-insensitive)
- Precio mínimo
- Precio máximo
- Combinación de los tres

```
GET /api/inmuebles?ubicacion=Naco&precio_min=100000&precio_max=400000
```

---

## SLIDE 9 — Feature: Calculadora de Precio Justo

### ¿Cuánto vale realmente este inmueble?

`[SCREENSHOT: calculadora con resultado — calculadora.png]`

El usuario ingresa: **tipo + área + habitaciones + sector** → recibe una estimación con:

- Precio estimado
- Rango P25–P75 (banda de mercado)
- Índice de confianza (0–100%)
- Precio por m²

**Cómo funciona (modelo de similitud ponderada):**
1. Filtra comparables del mismo tipo (hasta 200 propiedades)
2. Puntúa cada comparable por área, habitaciones y sector
3. Limpia outliers con método IQR
4. Calcula promedio ponderado por similitud

---

## SLIDE 10 — Feature: Mapa de Calor por Sector

### ¿Dónde están los precios más altos en Santo Domingo?

`[SCREENSHOT: mapa con círculos de calor — mapa-calor.png]`

- Mapa real de Santo Domingo (CartoDB tiles)
- **33+ sectores** con coordenadas verificadas
- Círculos coloreados: azul (barato) → rojo (caro)
- Tamaño proporcional a cantidad de propiedades
- Click en sector: precio promedio, mín/máx, precio/m²
- Métrica alterneable: precio promedio / cantidad / precio por m²

---

## SLIDE 11 — Scrapers: Datos Reales

### Cómo obtenemos los datos del mercado

`[SCREENSHOT: consola ejecutando el scraper — opcional]`

```bash
python scrape.py --source clasificados
python scrape.py --source supercasas --pages 10
python scrape.py --dry-run   # preview sin escribir
```

**Pipeline de normalización automática:**
- Nombres de sectores normalizados (variantes → nombre canónico)
- Conversión DOP → USD
- Cálculo de `precio_m2`
- Deduplicación por `url_fuente` (no duplica si se corre dos veces)
- Historial de precios (`precio_historial`) para tracking futuro

---

## SLIDE 12 — API REST

### 7 endpoints documentados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inmuebles` | Listar con filtros opcionales |
| GET | `/api/inmuebles/<id>` | Obtener por ID |
| POST | `/api/inmuebles` | Crear propiedad |
| PUT/PATCH | `/api/inmuebles/<id>` | Actualizar |
| DELETE | `/api/inmuebles/<id>` | Eliminar |
| GET | `/api/calculator/estimate` | Calcular precio justo |
| GET | `/api/sectores/heatmap` | Datos para mapa de calor |
| GET | `/api/health` | Estado de la API |

Todas las respuestas usan el envelope: `{ "ok": true/false, ... }`

---

## SLIDE 13 — Base de Datos

### Esquema SQLite — tabla principal `inmuebles`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | Autoincremental |
| `titulo` | TEXT | Nombre del inmueble |
| `precio` | REAL | En moneda original |
| `moneda` | TEXT | DOP / USD |
| `ubicacion` | TEXT | Texto libre |
| `sector_normalizado` | TEXT | Sector canónico |
| `area_m2` | REAL | Superficie |
| `tipo` | TEXT | Casa, Apartamento… |
| `estado` | TEXT | disponible / vendida… |
| `lat`, `lng` | REAL | Coordenadas (scraping) |
| `precio_m2` | REAL | Calculado automáticamente |
| `url_fuente` | TEXT UNIQUE | Para deduplicación |
| `contacto` | TEXT | JSON serializado |
| `caracteristicas` | TEXT | JSON serializado |

---

## SLIDE 14 — Problemas Resueltos (Highlights)

### Desafíos técnicos que enfrentamos

| Problema | Solución |
|----------|----------|
| Leaflet incompatible con SSR de Next.js | `dynamic(import(...), { ssr: false })` — dos componentes |
| Columna `estado` faltante en SQLite legacy | `migrate_scraping_columns()` corre automáticamente al importar |
| Frontend esperaba `stats.precio_promedio` pero API retornaba `promedio` | Ajuste del envelope en `/api/stats` |
| Calculadora mostraba resultado del cálculo anterior | `setResultado(null)` al inicio + eliminación de closure stale |
| Sectores con nombres inconsistentes en scraping | Matcher fuzzy en 3 niveles: exacto → substring → token match |

---

## SLIDE 15 — Estado del Proyecto

### ¿Qué está listo?

| Módulo | Estado |
|--------|--------|
| CRUD de inmuebles | Funcional |
| API REST (8 endpoints) | Funcional |
| Dashboard Next.js | Funcional |
| Scraper clasificados.com.do | Funcional |
| Scraper supercasas.com | Funcional |
| Calculadora de precio justo | Funcional |
| Mapa de calor por sector | Funcional |
| Estadísticas en tiempo real | Funcional |
| Sistema de autenticación JWT/RBAC | En desarrollo |

---

## SLIDE 16 — Próximos Pasos (Roadmap)

### Lo que viene

- **Auth completo** — Login, roles (admin / agente / visitante), panel de usuarios
- **Alertas de precio** — Notificar cuando un sector baja de umbral
- **Historial de precios** — Gráfico de evolución por propiedad (tabla `precio_historial` ya creada)
- **Exportar a PDF/Excel** — Para corredores inmobiliarios
- **App móvil** — React Native consumiendo la misma API

---

## SLIDE 17 — Cierre

### Lo que logramos

> Pasamos de datos dispersos en múltiples portales web a una plataforma unificada que permite **buscar, comparar, calcular y visualizar** el mercado inmobiliario de Santo Domingo.

**Tecnologías aprendidas en este proyecto:**
- API REST con Flask y SQLite
- Next.js App Router + React 19
- Web scraping con normalización de datos
- Algoritmos de similitud para estimación de precios
- Mapas interactivos con Leaflet
- Arquitectura cliente-servidor desacoplada

---

### ¿Preguntas?

**Repositorio:** [URL del repo]  
**Demo en vivo:** `http://localhost:3000`

---

## GUÍA DE SCREENSHOTS A TOMAR
> Para insertar en los slides antes de presentar. Reemplaza los placeholders `[SCREENSHOT: ...]` de arriba.

| Archivo sugerido | Qué capturar | Slide |
|------------------|--------------|-------|
| `01-listado-completo.png` | Dashboard con grid de propiedades cargadas | 6 |
| `02-formulario-creacion.png` | Formulario de creación con campos llenos | 7 |
| `06-modal-detalles.png` | Modal abierto con info completa de una propiedad | 7 |
| `05-busqueda-resultados.png` | Búsqueda con filtros activos y resultados | 8 |
| `calculadora.png` | Calculadora con un resultado de estimación | 9 |
| `mapa-calor.png` | Mapa con los círculos de sectores coloreados | 10 |
| `estadisticas.png` | Sección de estadísticas con las 4 tarjetas | (opcional) |

**Cómo tomar screenshots en Mac:** `Cmd + Shift + 4` para área seleccionada.  
**Cómo tomar screenshots en Windows:** `Win + Shift + S`.

---

## DISTRIBUCIÓN DE TIEMPO (30 min)

| Sección | Slides | Tiempo |
|---------|--------|--------|
| Intro: problema y solución | 1–3 | 3 min |
| Stack y arquitectura | 4–5 | 3 min |
| Demo en vivo del dashboard | 6–8 | 8 min |
| Features analíticas (calculadora + mapa) | 9–10 | 5 min |
| Scrapers + API + BD | 11–13 | 5 min |
| Retos técnicos + estado + roadmap | 14–16 | 4 min |
| Cierre + preguntas | 17 | 2 min |
| **Total** | | **30 min** |
