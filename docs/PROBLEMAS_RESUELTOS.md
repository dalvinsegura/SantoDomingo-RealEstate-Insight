# Problemas Resueltos

Registro de incidencias y tareas solucionadas durante el desarrollo de **Santo Domingo Real Estate Insight**.

---

## 1. Conexión a MongoDB no configurada

**Problema:** El archivo `db_config.py` estaba vacío y no había forma de conectar con la base de datos.

**Solución:** Se implementó la configuración en `src/database/db_config.py` con:
- Variables de entorno `MONGO_URI` y `MONGO_DB_NAME` para no hardcodear credenciales.
- Cliente singleton para reutilizar la conexión.
- Función `test_connection()` para comprobar que MongoDB responde.
- Funciones helper `get_db()` y `get_properties_collection()`.
- Manejo de errores con `ConnectionFailure`.

**Archivos afectados:**
- `src/database/db_config.py` — Configuración completa

---

## 2. Falta de operaciones CRUD sobre inmuebles

**Problema:** No existía lógica para crear, leer, actualizar ni eliminar registros de inmuebles.

**Solución:** Se creó el módulo `src/database/crud.py` con funciones CRUD completas:

### CREATE
- `crear_inmueble(datos)` — Inserta un documento y devuelve el `_id`.
- Validación mínima de campos obligatorios (título, precio).

### READ
- `listar_inmuebles(filtro, limite, saltar)` — Listado paginado.
- `obtener_inmueble_por_id(id_str)` — Obtiene un inmueble por ObjectId.
- `buscar_por_ubicacion(ubicacion)` — Búsqueda por texto en ubicación (case-insensitive).
- `buscar_por_rango_precio(precio_min, precio_max)` — Filtro por rango.
- `contar_inmuebles(filtro)` — Cuenta documentos.

### UPDATE
- `actualizar_inmueble(id_str, datos)` — Actualización parcial con `$set` de MongoDB.

### DELETE
- `eliminar_inmueble(id_str)` — Elimina por _id.

**Características especiales:**
- Serialización automática de ObjectId a string para respuestas JSON.
- Manejo de excepciones para IDs inválidos.

**Archivos afectados:**
- `src/database/crud.py` — Todas las operaciones CRUD

---

## 3. API REST no implementada

**Problema:** El dashboard no podía comunicarse con la base de datos; no existía una API RESTful.

**Solución:** Se implementó una API Flask completa en `src/app.py`:

### Endpoints CRUD

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/inmuebles` | Listado con filtros y paginación |
| GET | `/api/inmuebles/<id>` | Detalle de un inmueble |
| POST | `/api/inmuebles` | Crear inmueble |
| PUT/PATCH | `/api/inmuebles/<id>` | Actualizar inmueble |
| DELETE | `/api/inmuebles/<id>` | Eliminar inmueble |
| POST | `/api/init` | Cargar datos de prueba |
| GET | `/api/health` | Estado de la API y MongoDB |
| GET | `/` | Servir dashboard |

### Parámetros de Filtrado (GET /api/inmuebles)
- `limite` (default 100)
- `saltar` (default 0)
- `ubicacion` (búsqueda text)
- `precio_min` (filtro numérico)
- `precio_max` (filtro numérico)

### Respuestas
Todas las respuestas siguen el formato:
```json
{
  "ok": true/false,
  "mensaje": "...",
  "inmuebles": [...],
  "error": "..."
}
```

**Archivos afectados:**
- `src/app.py` — Aplicación Flask con todos los endpoints

---

## 4. Validación de formularios ausente

**Problema:** No había validación de datos del lado del servidor antes de insertar en MongoDB.

**Solución:** Se creó `src/forms.py` con la clase `InmuebleForm`:

### Validaciones implementadas
- **titulo:** obligatorio, 5-200 caracteres
- **precio:** número positivo (float)
- **ubicacion:** obligatoria, mínimo 3 caracteres
- **area_m2, habitaciones, banos:** números no negativos
- **tipo:** uno de valores predefinidos (Casa, Apartamento, Villa, etc.)
- **estado:** uno de predefinidos (disponible, alquilada, vendida, en-tramite)
- **contacto:** validación de nombre, teléfono, email (opcionales)

### Características
- Método `validar()` devuelve `True/False`
- Almacena errores en diccionario por campo
- `get_datos_limpios()` devuelve datos validados y procesados
- Integración en endpoint POST `/api/inmuebles`

**Archivos afectados:**
- `src/forms.py` — Clase de validación con 8 tipos de validadores

---

## 5. Datos de prueba no disponibles

**Problema:** La base de datos estaba vacía y no había forma fácil de cargar datos para probar.

**Solución:** Se creó `src/database/test_data.py` con:

### 8 Propiedades de Ejemplo
- Casa moderna en La Romana (RD$ 450,000)
- Apartamento con vista al mar (RD$ 250,000)
- Villa de lujo en Punta Cana (RD$ 850,000)
- Local comercial céntrico (RD$ 180,000)
- Terreno para desarrollo (RD$ 220,000)
- Penthouse en torre residencial (RD$ 650,000)
- Casa de campo en Higüey (RD$ 320,000)
- Oficina ejecutiva en zona bancaria (RD$ 95,000)

### Funciones
- `load_test_data()` — Carga datos si la colección está vacía (idempotente)
- `clear_test_data()` — Borra todos los inmuebles (para tests)

### Datos Completos Incluyen
- Ubicación con ciudad y provincia
- Características (lista)
- Contacto (nombre, teléfono, email)
- Descripción detallada
- Estado (disponible, alquilada, vendida, etc.)

**Archivos afectados:**
- `src/database/test_data.py` — 8 propiedades con datos realistas

---

## 6. Dashboard sin listados ni formularios

**Problema:** La página del dashboard estaba incompleta; no permitía listar, crear, editar ni eliminar inmuebles desde la interfaz.

**Solución:** Se rediseñó completamente el frontend:

### Estructura HTML (index.html)

#### 1. Navegación por Secciones
- Barra de navegación con botones: Listado, Crear Propiedad, Buscar, Estadísticas
- Sistema de pestañas funcional

#### 2. Sección Listado
- Grid responsivo de propiedades (tarjetas)
- Cada tarjeta muestra:
  - Título y estado (badge)
  - Precio formateado
  - Ubicación con ícono
  - Área, habitaciones, baños
  - Botones Ver y Eliminar
- Botones: "Cargar Propiedades" e "Inicializar BD"

#### 3. Sección Crear
- Formulario completo con campos:
  - Obligatorios: título, precio, ubicación, tipo
  - Opcionales: descripción, estado, características
  - Información de contacto (nombre, teléfono, email)
- Validación en tiempo real en el servidor
- Mensajes de error/éxito al usuario

#### 4. Sección Buscar
- Filtros avanzados:
  - Por ubicación (búsqueda de texto)
  - Por rango de precio (mín/máx)
- Resultados en tiempo real
- Grid igual al listado

#### 5. Sección Estadísticas
- 4 tarjetas mostrando:
  - Total de propiedades
  - Precio promedio (RD$)
  - Propiedades disponibles
  - Tipo más común
- Botón para actualizar en tiempo real

#### 6. Modal de Detalles
- Despliega información completa
- Características listadas
- Información de contacto
- Botón para eliminar

**Archivos afectados:**
- `src/dashboard/index.html` — Rediseño completo con todas las secciones
- `src/dashboard/styles.css` — Estilos nuevos, grid moderno, responsive
- `src/dashboard/app.js` — Lógica completa de interacción

---

## 7. Estilos del dashboard inconsistentes

**Problema:** El CSS era básico y no ofrecía una experiencia visual moderna ni responsive.

**Solución:** Se reescribió completamente `src/dashboard/styles.css`:

### Características del Diseño
- **Paleta de colores moderna:** Azul (primario), verde (éxito), rojo (peligro), gris (neutral)
- **Variables CSS:** Define colores, sombras y espaciados centralizados
- **Responsivo:** Media queries para móvil, tablet y desktop
- **Grid Layout:** Para tarjetas de propiedades (auto-fill, minmax)
- **Animaciones:** Fade-in para secciones, hover effects para botones
- **Badges:** Estados coloreados distintos (disponible, alquilada, vendida, en-trámite)
- **Formularios:** Estilos modernos con focus states
- **Estadísticas:** Tarjetas con hover animations
- **Modal:** Fondo oscuro, contenido centrado, overflow scrollable

### Responsive Design
- Desktop: grid 3-4 columnas
- Tablet: grid 2 columnas
- Móvil: grid 1 columna
- Navegación flexible

**Archivos afectados:**
- `src/dashboard/styles.css` — 500+ líneas de CSS moderno

---

## 8. JavaScript del dashboard sin funcionalidades AJAX

**Problema:** El archivo `app.js` estaba parcialmente funcional y faltaban operaciones AJAX para CRUD completo.

**Solución:** Se reimplementó `src/dashboard/app.js` con:

### Funciones Principales

#### Navegación
- `mostrarSeccion(seccion)` — Cambia entre secciones activas

#### Listado
- `cargarInmuebles()` — Fetch GET `/api/inmuebles`
- `mostrarInmuebles(inmuebles)` — Renderiza grid de propiedades

#### Crear/Actualizar
- `crearPropiedad(event)` — Fetch POST con validación
- Manejo de errores con display de mensajes

#### Búsqueda
- `buscar()` — Fetch con parámetros de ubicación y precio
- `mostrarInmueblesEnElemento()` — Renderiza resultados

#### Detalles y Eliminación
- `verDetalles(id)` — Fetch GET detalle y abre modal
- `mostrarModal(propiedad)` — Formatea y muestra en modal
- `eliminarPropiedad(id)` — Fetch DELETE con confirmación
- `cerrarModal()` — Cierra modal

#### Estadísticas
- `cargarEstadisticas()` — Fetch y calcula: total, promedio, disponibles, tipo común

#### Inicialización
- `inicializarBD()` — Fetch POST `/api/init` para cargar datos prueba

### Utilidades
- `formatearNumero(num)` — Formatea números con separadores de miles
- `mostrarError(mensaje)` — Muestra mensajes de error

**Archivos afectados:**
- `src/dashboard/app.js` — 400+ líneas de lógica AJAX funcional

---

## 9. Integración de formulario con API

**Problema:** El formulario no estaba integrado con la validación del servidor ni la API.

**Solución:**
- Endpoint POST `/api/inmuebles` usa `InmuebleForm` para validar
- Devuelve errores por campo si validación falla
- JavaScript captura errores y los muestra al usuario
- Integración en `app.js`: evento `submit` del formulario

**Flujo:**
1. Usuario llena form y hace click en "Crear"
2. JavaScript recolecta datos (incluyendo características y contacto)
3. POST fetch a `/api/inmuebles`
4. Si hay errores de validación: mostrar en `#formMensaje`
5. Si OK: mostrar éxito, limpiar form, recargar listado

**Archivos afectados:**
- `src/forms.py` — Validadores
- `src/app.py` — Endpoint con validación
- `src/dashboard/app.js` — Manejo de respuestas y errores

---

## 10. Ejecución del proyecto desde la raíz

**Problema:** Ejecutar `python src/app.py` fallaba con ImportError en `database` y `forms`.

**Solución:** Se creó `run.py` en la raíz:
```python
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
os.chdir(os.path.join(os.path.dirname(__file__), 'src'))
from app import app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

**Ahora:** Ejecutar `python run.py` desde la raíz funciona correctamente.

**Archivos afectados:**
- `run.py` — Script de ejecución en la raíz

---

## 11. Ausencia de documentación de flujos y capturas

**Problema:** No había documentación visual de cómo funciona el sistema.

**Solución:** Se completó la documentación:
- Este archivo (`PROBLEMAS_RESUELTOS.md`) con descripción detallada de cada solución
- Referencia en `docs/FLUJOS_Y_CAPTURAS.md` para flujos de usuario
- Carpeta `docs/capturas/` para screenshots de UX

**Archivos afectados:**
- `docs/PROBLEMAS_RESUELTOS.md` (este archivo)
- `README.md` — Información general del proyecto

---

## Resumen de Implementación

### Tecnologías Utilizadas
- **Backend:** Python 3.13, Flask 3.1.3
- **Base de Datos:** MongoDB (local o Atlas)
- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **ORM/Query:** PyMongo, CRUD directo
- **Validación:** Clase personalizada InmuebleForm

### Módulos Creados
1. `src/database/db_config.py` — Configuración MongoDB
2. `src/database/crud.py` — Operaciones CRUD
3. `src/database/test_data.py` — 8 propiedades de prueba
4. `src/forms.py` — Validación de formularios
5. `src/app.py` — API Flask con 7 endpoints
6. `src/dashboard/index.html` — Dashboard rediseñado
7. `src/dashboard/app.js` — Lógica completa AJAX
8. `src/dashboard/styles.css` — Estilos modernos y responsive
9. `run.py` — Script de ejecución
10. `docs/PROBLEMAS_RESUELTOS.md` — Esta documentación

### Características Completadas
✅ Conexión a MongoDB con singleton pattern  
✅ CRUD completo (Create, Read, Update, Delete)  
✅ API REST con 7 endpoints funcionales  
✅ Validación de datos en servidor  
✅ 8 propiedades de prueba realistas  
✅ Dashboard con 4 secciones de naveg  
✅ Listado responsivo con filtros  
✅ Formulario de creación con validación  
✅ Búsqueda avanzada por ubicación y precio  
✅ Estadísticas en tiempo real  
✅ Modal de detalles  
✅ Estilos modernos y responsive  
✅ Lógica AJAX completa sin necesidad de librerías  

---

## Próximas Mejoras Sugeridas

- [ ] Autenticación y autorización (JWT)
- [ ] Edición de propiedades existentes (PUT)
- [ ] Subida de imágenes
- [ ] Paginación en frontend
- [ ] Exportar a PDF
- [ ] Mapa interactivo
- [ ] Sistema de favoritos
- [ ] Notificaciones por email
- [ ] API GraphQL opcional
- [ ] Tests unitarios y E2E

---

**Última actualización:** Marzo 2026  
**Estado:** ✅ Proyecto funcional y completamente documentado
