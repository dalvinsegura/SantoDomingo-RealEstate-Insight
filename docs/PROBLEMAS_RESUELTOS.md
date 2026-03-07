# Problemas resueltos

Registro de incidencias solucionadas durante el desarrollo de Santo Domingo Real Estate Insight.

---

## 1. Conexión a MongoDB no configurada

**Problema:** El archivo `db_config.py` estaba vacío y no había forma de conectar con la base de datos.

**Solución:** Se implementó la configuración en `src/database/db_config.py` con:
- Variables de entorno `MONGO_URI` y `MONGO_DB_NAME` para no hardcodear credenciales.
- Cliente singleton para reutilizar la conexión.
- Función `test_connection()` para comprobar que MongoDB responde.
- Funciones `get_db()` y `get_properties_collection()` para acceder a la colección de inmuebles.

---

## 2. Falta de operaciones CRUD sobre inmuebles

**Problema:** No existía lógica para crear, leer, actualizar ni eliminar registros de inmuebles.

**Solución:** Se creó el módulo `src/database/crud.py` con:
- **Crear:** `crear_inmueble(datos)` — inserta un documento y devuelve el `_id`.
- **Leer:** `listar_inmuebles()`, `obtener_inmueble_por_id()`, `buscar_por_ubicacion()`, `buscar_por_rango_precio()`.
- **Actualizar:** `actualizar_inmueble(id, datos)` — actualización parcial con `$set`.
- **Eliminar:** `eliminar_inmueble(id)`.
- Serialización de `ObjectId` a string para devolver JSON válido.

---

## 3. Sin API REST para el frontend

**Problema:** El dashboard no podía comunicarse con la base de datos.

**Solución:** Se implementó una API Flask en `src/app.py`:
- `GET /api/inmuebles` — listado con filtros (ubicación, precio mín/máx) y paginación.
- `GET /api/inmuebles/<id>` — detalle de un inmueble.
- `POST /api/inmuebles` — crear inmueble (body JSON).
- `PUT /api/inmuebles/<id>` — actualizar inmueble.
- `DELETE /api/inmuebles/<id>` — eliminar inmueble.
- `GET /api/health` — estado de la API y conexión a MongoDB.
- Ruta `/` sirve el dashboard estático.

---

## 4. Dashboard sin listados ni formularios

**Problema:** La página del dashboard estaba vacía, sin listados ni formularios para gestionar inmuebles.

**Solución:** Se completó el frontend en `src/dashboard/`:
- **Listado:** Tabla de inmuebles con título, ubicación, área, habitaciones, precio y botones Editar/Eliminar.
- **Filtros:** Por ubicación y rango de precio (mín/máx).
- **Formulario:** Crear y editar inmueble con campos: título, precio, ubicación, área, habitaciones, baños, tipo, enlace, fuente, descripción.
- **Flujo completo:** Listar → Nuevo/Editar → Guardar → Actualizar listado; Eliminar con confirmación.
- Estilos en `styles.css` (tema oscuro) y lógica en `app.js` (fetch a la API, renderizado, eventos).

---

## 5. Ejecución del proyecto desde la raíz del repositorio

**Problema:** Al ejecutar `python src/app.py` desde la raíz, fallaban los imports del paquete `database`.

**Solución:** Se añadió `run.py` en la raíz del proyecto, que:
- Añade `src` al `PYTHONPATH` y cambia el directorio de trabajo a `src`.
- Importa y ejecuta la aplicación Flask.
- Permite ejecutar con `python run.py` desde la raíz.

---

## Cómo añadir nuevas entradas

Para documentar un problema resuelto en el futuro:

1. Añade un título numerado (ej. `## 6. Descripción breve`).
2. **Problema:** qué fallaba o qué faltaba.
3. **Solución:** qué se implementó o cambió (archivos, funciones, pasos).
4. Opcional: fragmentos de código o referencias a commits.
