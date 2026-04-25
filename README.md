# 🏠 Santo Domingo Real Estate Insight

**Plataforma integral de gestión y análisis del mercado inmobiliario en Santo Domingo, República Dominicana.**

## 📋 Descripción del Proyecto

Santo Domingo Real Estate Insight es una solución completa para centralizar datos del mercado inmobiliario utilizando un **CRUD funcional**, **API REST** y un **dashboard moderno** con:

- ✅ Sistema completo de gestión de propiedades (crear, leer, actualizar, eliminar)
- ✅ Base de datos SQLite integrada
- ✅ API REST con Flask (7 endpoints)
- ✅ Dashboard responsivo con 4 secciones de navegación
- ✅ Validación de datos del lado del servidor
- ✅ 8 propiedades de prueba precargadas
- ✅ Búsqueda avanzada por ubicación y precio
- ✅ Estadísticas en tiempo real
- ✅ Estilos modernos y responsive design

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Python 3.13** — Lenguaje principal
- **Flask 3.1.3** — Framework web y API REST
- **PyMongo 4.16.0** — Driver de MongoDB
- **MongoDB** — Base de datos NoSQL

### Frontend
- **HTML5** — Estructura
- **CSS3** — Estilos modernos y responsive
- **JavaScript (vanilla)** — Lógica sin dependencias externas

### Herramientas
- **pip** — Gestor de paquetes Python
- **Git** — Control de versiones

---

## 📁 Estructura del Proyecto

```
.
├── src/
│   ├── app.py                    # Aplicación Flask con API REST
│   ├── forms.py                  # Validación de formularios
│   ├── database/
│   │   ├── __init__.py
│   │   ├── db_config.py          # Configuración MongoDB
│   │   ├── crud.py               # Operaciones CRUD
│   │   └── test_data.py          # 8 propiedades de prueba
│   ├── scrapers/
│   │   └── base_scraper.py       # (Para futuros scrapers)
│   └── dashboard/
│       ├── index.html            # Dashboard HTML
│       ├── app.js                # Lógica AJAX
│       └── styles.css            # Estilos modernos
├── data/
│   └── data.json                 # (Datos locales opcional)
├── docs/
│   ├── PROBLEMAS_RESUELTOS.md    # Documentación de soluciones
│   ├── FLUJOS_Y_CAPTURAS.md      # Flujos de usuario
│   └── capturas/                 # Screenshots del proyecto
├── requirements.txt              # Dependencias Python
├── run.py                        # Script de ejecución
└── README.md                     # Este archivo
```

---

## 🚀 Instalación y Ejecución

### Requisitos Previos
- Python 3.10+
- MongoDB (local o Atlas)
- pip (incluido en Python)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-repositorio>
   cd <directorio-proyecto>
   ```

2. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurar variables de entorno** (opcional)
   ```bash
   # En Windows PowerShell:
   $env:MONGO_URI = "mongodb://localhost:27017/"
   $env:MONGO_DB_NAME = "real_estate_insight"
   ```

   En Linux/Mac:
   ```bash
   export MONGO_URI="mongodb://localhost:27017/"
   export MONGO_DB_NAME="real_estate_insight"
   ```

4. **Ejecutar el servidor**
   ```bash
   python run.py
   ```

5. **Acceder al dashboard**
   - Abrir en el navegador: `http://localhost:5000/`
   - La API está disponible en: `http://localhost:5000/api/`

---

## 🎯 API REST Endpoints

### Documentación de Endpoints

| Método | Endpoint | Descripción | Parámetros |
|--------|----------|-------------|-----------|
| **GET** | `/api/inmuebles` | Listar propiedades | `limite`, `saltar`, `ubicacion`, `precio_min`, `precio_max` |
| **GET** | `/api/inmuebles/<id>` | Obtener propiedad por ID | — |
| **POST** | `/api/inmuebles` | Crear propiedad | JSON body |
| **PUT** | `/api/inmuebles/<id>` | Actualizar propiedad | JSON body |
| **PATCH** | `/api/inmuebles/<id>` | Actualizar parcialmente | JSON body |
| **DELETE** | `/api/inmuebles/<id>` | Eliminar propiedad | — |
| **POST** | `/api/init` | Cargar datos de prueba | — |
| **GET** | `/api/health` | Estado de la API | — |
| **GET** | `/` | Servir dashboard | — |

### Ejemplos de Uso

#### Listar todas las propiedades
```bash
curl http://localhost:5000/api/inmuebles
```

#### Listar con filtros
```bash
curl "http://localhost:5000/api/inmuebles?ubicacion=Santo+Domingo&precio_min=100000&precio_max=500000"
```

#### Criar nueva propiedad
```bash
curl -X POST http://localhost:5000/api/inmuebles \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Casa moderna",
    "precio": 450000,
    "ubicacion": "La Romana, Santo Domingo",
    "area_m2": 250,
    "habitaciones": 4,
    "banos": 3,
    "tipo": "Casa"
  }'
```

#### Obtener detalles de una propiedad
```bash
curl http://localhost:5000/api/inmuebles/65a1c9f8d9e2f45612345678
```

---

## 📊 Dashboard - Secciones

### 1. Listado de Propiedades
- Grid responsivo mostrando todas las propiedades
- Cada tarjeta muestra: título, precio, ubicación, área, habitaciones, estado
- Botones: "Ver Detalles" y "Eliminar"
- Opción para cargar datos de prueba inicialmente

### 2. Crear Propiedad
- Formulario completo con validación en servidor
- Campos obligatorios: título, precio, ubicación, tipo
- Campos opcionales: descripción, área, habitaciones, baños, estado
- Características personalizadas (etiquetas)
- Información de contacto (nombre, teléfono, email)
- Mensajes de error/éxito al usuario

### 3. Buscar Propiedades
- Filtros avanzados:
  - **Ubicación:** búsqueda por texto (case-insensitive)
  - **Precio Mínimo/Máximo:** rango numérico
- Resultados en tiempo real sin recargar página
- Grid igual al listado principal

### 4. Estadísticas
- **Total de Propiedades:** cuenta total en BD
- **Precio Promedio (RD$):** media aritmética
- **Propiedades Disponibles:** solo estado "disponible"
- **Tipo más Común:** moda de tipos de vivienda
- Botón para actualizar en tiempo real

### Modal de Detalles
- Información completa de una propiedad
- Características listadas
- Datos de contacto (si existen)
- Botón para eliminar directamente

---

## 🗄️ Base de Datos (MongoDB)

### Colección: `inmuebles`

Estructura de documento:
```json
{
  "_id": "ObjectId",
  "titulo": "Casa moderna en La Romana",
  "precio": 450000,
  "ubicacion": "La Romana, Santo Domingo",
  "area_m2": 250,
  "habitaciones": 4,
  "banos": 3,
  "tipo": "Casa",
  "descripcion": "Hermosa casa de dos pisos...",
  "caracteristicas": ["Piscina", "Jardín", "Aire acondicionado"],
  "estado": "disponible",
  "enlace": "https://...",
  "fuente": "Portal Inmobiliario",
  "fecha_listado": "2026-03-06T...",
  "contacto": {
    "nombre": "Juan Pérez",
    "telefono": "+1-809-555-0101",
    "email": "juan@ejemplo.com"
  }
}
```

### Tipos de Propiedad Válidos
- Casa
- Apartamento
- Villa
- Penthouse
- Comercio
- Oficina
- Terreno

### Estados Válidos
- `disponible` — Propiedad lista para venta/alquiler
- `alquilada` — Actualmente alquilada
- `vendida` — Venta completada
- `en-tramite` — Proceso en curso

---

## 🧪 Datos de Prueba

Se incluyen **8 propiedades de ejemplo** que se cargan automáticamente:

1. Casa moderna en La Romana (RD$ 450,000)
2. Apartamento con vista al mar (RD$ 250,000)
3. Villa de lujo en Punta Cana (RD$ 850,000)
4. Local comercial céntrico (RD$ 180,000)
5. Terreno para desarrollo (RD$ 220,000)
6. Penthouse en torre residencial (RD$ 650,000)
7. Casa de campo en Higüey (RD$ 320,000)
8. Oficina ejecutiva en zona bancaria (RD$ 95,000)

Para cargar los datos de prueba, hacer click en el botón "Cargar Datos de Prueba" en el dashboard.

---

## 🔧 Módulos Internos

### `src/database/db_config.py`
Configuración de conexión a MongoDB con patrón Singleton.
- Conexión reutilizable
- Variables de entorno
- Test de conexión

### `src/database/crud.py`
Operaciones CRUD completas:
- `crear_inmueble()` — INSERT
- `listar_inmuebles()` — READ (con paginación)
- `obtener_inmueble_por_id()` — READ por ID
- `buscar_por_ubicacion()` — Búsqueda con regex
- `buscar_por_rango_precio()` — Filtro numérico
- `actualizar_inmueble()` — UPDATE ($set)
- `eliminar_inmueble()` — DELETE
- `contar_inmuebles()` — COUNT

### `src/forms.py`
Clase `InmuebleForm` para validación:
- Validadores de tipos (string, número, select)
- Errores por campo
- Datos limpios y procesados

### `src/app.py`
Aplicación Flask:
- Inicialización de datos de prueba
- 7 endpoints CRUD
- Manejo de errores
- CORS implícito (JSON)
- Servicio del dashboard estático

### `src/dashboard/app.js`
Lógica AJAX:
- Fetch GET/POST/PUT/DELETE
- Renderizado de componentes
- Manejo de eventos
- Validación en cliente
- Modal de detalles

### `src/dashboard/styles.css`
Estilos modernos:
- Paleta de colores coherente
- Grid responsive (mobile-first)
- Animaciones suaves
- Tema claro con acentos azules
- Media queries para todos los tamaños

---

## 📖 Documentación Completa

- **[PROBLEMAS_RESUELTOS.md](docs/PROBLEMAS_RESUELTOS.md)** — Detalles técnicos de cada componente implementado
- **[FLUJOS_Y_CAPTURAS.md](docs/FLUJOS_Y_CAPTURAS.md)** — Flujos de usuario y referencias a capturas
- **[capturas/](docs/capturas/)** — Directorio para screenshots

---

## 🐛 Solución de Problemas

### MongoDB no conecta
- Verificar que MongoDB está ejecutándose: `mongosh` o `mongo`
- Revisar variables de entorno `MONGO_URI` y `MONGO_DB_NAME`
- Para Atlas: usar URL completa con credenciales

### Puerto 5000 en uso
- Cambiar puerto en `run.py`: `app.run(..., port=5001, ...)`
- O liberar puerto: `lsof -i :5000` (Linux/Mac) o `netstat -ano | findstr :5000` (Windows)

### Los estilos no cargan
- Limpiar cache del navegador (Ctrl+Shift+R o Cmd+Shift+R)
- Verificar que `src/dashboard/` existe y contiene `styles.css`

### Import errors
- Asegurar que está en la raíz del proyecto
- Usar `python run.py` y no `python src/app.py`
- Verificar que `src/` tiene `__init__.py` en `database/`

---

## 📝 Licencia

Este proyecto es de código abierto bajo la licencia MIT.

---

## 👨‍💻 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes, favor abrir un Issue primero para discutir.

---

## 📞 Contacto

Para preguntas o soporte, consultar la documentación en `docs/` o abrir un Issue en el repositorio.

---

**Última actualización:** Marzo 6, 2026  
**Estado:** ✅ En producción - Funcional  
**Versión:** 1.0.0
