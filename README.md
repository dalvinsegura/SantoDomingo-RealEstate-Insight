# Santo Domingo Real Estate Insight

## Descripcion

Plataforma analitica para centralizar datos del mercado inmobiliario en Santo Domingo y reducir la asimetria de informacion. Este proyecto utiliza tecnicas de Big Data para predecir precios justos de inmuebles.

## Tecnologias Utilizadas

- Python (Selenium, BeautifulSoup, Pandas, NumPy)
- MongoDB
- Flask (API REST)
- Frontend Web (HTML, CSS, JavaScript)

---

## Modulos adicionales (CRUDs, listados, formularios)

- **Dashboard** (`src/dashboard/`): listado de inmuebles, filtros por ubicación y rango de precio, formulario para crear y editar inmuebles, botones Editar/Eliminar por fila.
- **API REST** (`src/app.py`): endpoints para listar, obtener por ID, crear, actualizar y eliminar inmuebles.
- **CRUD en base de datos** (`src/database/crud.py`): funciones para crear, leer, actualizar y eliminar documentos en la colección de inmuebles, más búsquedas por ubicación y rango de precio.

---

## Integracion con base de datos (crear, leer, actualizar, eliminar)

- **Configuración:** `src/database/db_config.py` — conexión a MongoDB (variables de entorno `MONGO_URI`, `MONGO_DB_NAME`), colección `inmuebles`.
- **Crear:** `POST /api/inmuebles` con body JSON; en código `crud.crear_inmueble(datos)`.
- **Leer:** `GET /api/inmuebles` (listado con filtros/paginación), `GET /api/inmuebles/<id>`; en código `crud.listar_inmuebles()`, `crud.obtener_inmueble_por_id(id)`.
- **Actualizar:** `PUT /api/inmuebles/<id>` con body JSON; en código `crud.actualizar_inmueble(id, datos)`.
- **Eliminar:** `DELETE /api/inmuebles/<id>`; en código `crud.eliminar_inmueble(id)`.

---

## Capturas mostrando flujos completos

En la carpeta **`docs/capturas/`** se pueden colocar capturas de pantalla que ilustren:

1. Listado de inmuebles.
2. Crear nuevo inmueble (formulario y resultado).
3. Editar inmueble.
4. Eliminar inmueble (confirmación y listado).
5. Filtros por ubicación y precio.

La descripción detallada de cada flujo está en **[docs/FLUJOS_Y_CAPTURAS.md](docs/FLUJOS_Y_CAPTURAS.md)**.

---

## Problemas resueltos

Registro de incidencias solucionadas durante el desarrollo (conexión MongoDB, CRUD, API, dashboard, ejecución desde raíz) en **[docs/PROBLEMAS_RESUELTOS.md](docs/PROBLEMAS_RESUELTOS.md)**.

---

## Cómo ejecutar el proyecto

1. Instalar dependencias: `pip install -r requirements.txt`
2. Tener MongoDB en ejecución (local o configurar `MONGO_URI` y `MONGO_DB_NAME`).
3. Desde la raíz del repositorio: `python run.py`
4. Abrir en el navegador: `http://localhost:5000/`

Para probar solo la API: `GET http://localhost:5000/api/health` y `GET http://localhost:5000/api/inmuebles`.
