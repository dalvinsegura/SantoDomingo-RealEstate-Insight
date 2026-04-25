# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

```
├── backend/        # Flask REST API
│   ├── src/
│   │   ├── app.py
│   │   ├── forms.py
│   │   └── database/
│   ├── data/       # SQLite DB (real_estate.db)
│   ├── run.py
│   ├── requirements.txt
│   └── venv/
├── frontend/       # Next.js 16 + ShadCN + Tailwind CSS 4
│   ├── app/        # App Router pages
│   ├── components/
│   │   ├── dashboard/  # Feature components (listado, crear, buscar, estadisticas)
│   │   └── ui/         # ShadCN primitives — do not edit manually
│   ├── lib/api.ts   # All fetch calls to Flask API
│   └── types/       # Shared TS types (Inmueble, Contacto, etc.)
├── docs/
└── README.md
```

## Running the Scrapers

```bash
cd backend
source venv/bin/activate

python scrape.py                        # all sources
python scrape.py --source clasificados  # only clasificados.com.do
python scrape.py --source supercasas --pages 10
python scrape.py --dry-run              # preview without writing to DB
python scrape.py -v                     # verbose logging
```

Scrapers live in `backend/src/scrapers/`:
- `runners/clasificados.py` — fetches all category pages once (client-side paging, all items in DOM)
- `runners/supercasas.py` — paginates via `?PagingPageSkip=N`, 24 items/page
- `pipeline/normalizer.py` — normalizes sector names, converts DOP→USD, calculates precio_m2
- Deduplication: `url_fuente` uniqueness check before insert (`upsert_inmueble_scraped` in crud.py)

New DB columns added by `migrate_scraping_columns()` (called at scrape start):
`lat`, `lng`, `sector_normalizado`, `precio_m2`, `url_fuente`, `fuente`, `moneda`, `tipo_operacion`

New table: `precio_historial(inmueble_id, precio, moneda, fecha)` — for future price tracking.

## Running the App

**Backend** — always run from `backend/`, never `src/app.py` directly:

```bash
cd backend
source venv/bin/activate

python -c "
import os, sys
sys.path.insert(0, 'src')
os.chdir('src')
from app import app
app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
"
```

The `use_reloader=False` is necessary because `run.py` does `os.chdir('src')`, which breaks Flask's auto-reloader.

**Frontend:**

```bash
cd frontend && npm run dev   # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` if the backend runs on a non-default host/port (defaults to `http://localhost:5001`).

**Lint:**

```bash
cd frontend && npm run lint
```

## Architecture Overview

Flask REST API backend + Next.js frontend. The two processes run independently and communicate only through the REST API.

**Key design decisions:**
- `frontend/lib/api.ts` is the single module for all backend calls — add new endpoints there, never fetch directly from components.
- `frontend/types/inmueble.ts` is the source of truth for `Inmueble`, `TipoInmueble`, `EstadoInmueble`, `TIPOS_INMUEBLE`, and `ESTADOS_INMUEBLE` — use these constants in both form components and validation.
- `components/ui/` contains ShadCN-generated primitives; don't modify them.
- The database layer auto-initializes on import: `db_config.py` calls `init_db()` at module level, creating the SQLite schema if it doesn't exist.
- SQLite DB is stored at `data/real_estate.db` (relative to `backend/`), resolved via `__file__` in `db_config.py`.
- `caracteristicas` (list) and `contacto` (dict) are stored as JSON strings in SQLite and deserialized in `_dict_from_row()`.

**Request flow:**
1. `app.py` receives HTTP request
2. For POST/PUT/PATCH to `/api/inmuebles`, `InmuebleForm` (from `forms.py`) validates and sanitizes input
3. `crud.py` functions execute parameterized SQLite queries via `get_connection()`
4. Response is JSON with `{"ok": true/false, ...}` envelope

**Next.js version caveat:** This project uses Next.js 16 with React 19. APIs, conventions, and file structure may differ from older versions. Check `node_modules/next/dist/docs/` before writing Next.js-specific code.

**Note:** The README mentions MongoDB/PyMongo, but the actual implementation uses SQLite.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inmuebles` | List with optional `ubicacion`, `precio_min`, `precio_max`, `limite`, `saltar` |
| GET | `/api/inmuebles/<id>` | Get by integer ID |
| POST | `/api/inmuebles` | Create (validated via `InmuebleForm`) |
| PUT/PATCH | `/api/inmuebles/<id>` | Update fields dynamically |
| DELETE | `/api/inmuebles/<id>` | Delete by ID |
| POST | `/api/init` | Load 8 test properties |
| GET | `/api/health` | Connection check |

## Validation Rules (`src/forms.py`)

- Required: `titulo` (5–200 chars), `precio` (≥0), `ubicacion` (≥3 chars), `tipo`
- Valid `tipo` values: `Casa`, `Apartamento`, `Villa`, `Comercio`, `Terreno`, `Penthouse`, `Oficina`
- Valid `estado` values: `disponible`, `alquilada`, `vendida`, `en-tramite` (defaults to `disponible`)
- `contacto` is an optional nested object with `nombre`, `telefono`, `email`
