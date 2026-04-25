# Flujos y Capturas - Santo Domingo Real Estate Insight

## Descripción de Flujos de Usuario

Esta documentación describe los principales flujos de interacción en la plataforma Santo Domingo Real Estate Insight, con referencias a capturas de pantalla y pasos detallados.

---

## 1. Flujo de Listado de Propiedades

### Descripción
El usuario accede a la plataforma y visualiza todas las propiedades disponibles en un formato de grid responsivo con tarjetas informativas.

### Pasos
1. Acceder a `http://localhost:5000/`
2. Se cargan automáticamente todas las propiedades desde MongoDB
3. Cada tarjeta muestra:
   - Título de la propiedad
   - Estado (badge con color)
   - Precio en RD$
   - Ubicación con ícono
   - Área, habitaciones y baños
   - Tipo de propiedad (badge)
   - Botones de acción

### Funcionalidades
- **Ver Detalles:** Abre modal con información completa
- **Eliminar:** Elimina la propiedad con confirmación
- **Cargar Propiedades:** Recarga la lista
- **Cargar Datos de Prueba:** Inicializa 8 propiedades de ejemplo

**Captura sugerida:** `01-listado-completo.png`

---

## 2. Flujo de Creación de Nueva Propiedad

### Descripción
El usuario crea una nueva propiedad rellenando un formulario con validación del lado del servidor.

### Pasos
1. Navegar a la sección "Crear Propiedad" (botón en navegación)
2. Rellenar campos obligatorios:
   - Título (mínimo 5 caracteres)
   - Precio (número positivo, formato RD$)
   - Ubicación (mínimo 3 caracteres)
   - Tipo (select dropdown con 7 opciones)
3. Opcionalmente rellenar:
   - Descripción (textarea)
   - Área (m²)
   - Habitaciones
   - Baños
   - Estado (disponible, alquilada, vendida, en-tramite)
   - Características (separadas por comas)
   - Contacto (nombre, teléfono, email)
4. Click en "Crear Propiedad"
5. **Validación en servidor:**
   - Si hay errores: mostrar errores específicos por campo en rojo
   - Si OK: mensaje de éxito en verde, formulario se limpia
6. Redireccionamiento automático al listado

### Validaciones del Lado del Servidor
- **Título:** 5-200 caracteres, obligatorio
- **Precio:** número > 0, obligatorio  
- **Ubicación:** mínimo 3 caracteres, obligatorio
- **Tipo:** Casa | Apartamento | Villa | Penthouse | Comercio | Oficina | Terreno
- **Area/Hab/Baños:** números no negativos
- **Estado:** disponible | alquilada | vendida | en-tramite

**Capturas sugeridas:**
- `02-formulario-creacion.png` — Formulario vacío/listo para rellenar
- `03-formulario-rellenado.png` — Todos los campos con datos
- `04-mensaje-exito.png` — Confirmación de creación exitosa

---

## 3. Flujo de Búsqueda Avanzada

### Descripción
El usuario utiliza filtros para buscar propiedades específicas sin recargar la página, manteniendo la experiencia fluida.

### Pasos
1. Navegar a sección "Buscar" en la navegación
2. Ingresar criterios de búsqueda (opcional cualquiera):
   - **Ubicación:** texto libre (búsqueda case-insensitive en BD)
   - **Precio Mínimo:** número (ej: 200000)
   - **Precio Máximo:** número (ej: 500000)
3. Click en botón "Buscar"
4. Los resultados se cargan dinámicamente en el mismo grid
5. Grid muestra propiedades que cumplen criterios
6. Si no hay resultados, mostrar: "No se encontraron propiedades"
7. Puede limpiar filtros y volver a buscar

### Ejemplos de Búsqueda
- **Solo ubicación:** "La Romana" → Todas con La Romana en ubicación
- **Solo precio:** Mín 200000, Máx 600000 → Propiedades en ese rango
- **Combinado:** "Santo Domingo" + 200000-500000 → Ambos filtros aplicados

### Endpoint HTTP
```
GET /api/inmuebles?ubicacion=La+Romana&precio_min=200000&precio_max=600000
```

**Captura sugerida:** `05-busqueda-resultados.png`

---

## 4. Flujo de Ver Detalles en Modal

### Descripción
El usuario abre un modal con información completa de una propiedad seleccionada.

### Pasos
1. En cualquier sección (Listado, Búsqueda), hacer click en botón "Ver"
2. Se abre modal centrado con:
   - Título de la propiedad (prominente)
   - Grid de detalles en 2-3 columnas:
     - Precio (RD$)
     - Tipo de propiedad
     - Ubicación
     - Estado
     - Área (m²)
     - Habitaciones
     - Baños
   - Descripción completa (si existe)
   - Lista de características (bullets)
   - Información de contacto (nombre, teléfono, email)
3. Botones en modal:
   - **Eliminar:** Pregunta confirmación
   - **Cerrar:** Cierra modal regresando al listado
4. Click fuera del modal (en área oscura) también cierra

### Punto Técnico
```
Llamada: GET /api/inmuebles/{id}
Respuesta incluye todos los campos del documento MongoDB
```

**Captura sugerida:** `06-modal-detalles.png`

---

## 5. Flujo de Eliminación de Propiedad

### Descripción
El usuario elimina una propiedad con confirmación para evitar acciones accidentales.

### Pasos
1. Desde el listado, modal o grid de búsqueda, click en botón "Eliminar"
2. Sistema abre cuadro de confirmación:
   ```
   "¿Está seguro de que desea eliminar esta propiedad?"
   [Cancelar] [Confirmar]
   ```
3. **Si confirma:**
   - Envía DELETE /api/inmuebles/{id}
   - Muestra alerta: "Propiedad eliminada correctamente"
   - Recarga el listado automáticamente
   - Propiedad desaparece de la vista
4. **Si cancela:** no ejecuta ningún cambio

### Validaciones Backend
- ID debe ser ObjectId válido
- Si propiedad no existe → error 404
- Si hay error BD → error 500

**Captura sugerida:** `07-confirmacion-eliminacion.png`

---

## 6. Flujo de Estadísticas en Tiempo Real

### Descripción
El usuario visualiza análisis agregados de todas las propiedades sin necesidad de exportar.

### Pasos
1. Navegar a sección "Estadísticas"
2. Sistema carga y calcula automáticamente:
   - **Total de Propiedades:** Cuenta total de documentos
   - **Precio Promedio:** (Suma de precios) / (Cantidad de propiedades)
   - **Disponibles:** Conteo donde estado = "disponible"
   - **Tipo Más Común:** Tipo con mayor frecuencia
3. Se muestran en 4 tarjetas coloridas con fondos distintos
4. Números formateados con separadores de miles (RD$)
5. Click en "Actualizar Estadísticas" recalcula en tiempo real

### Ejemplo de Cálculos
```
Total de propiedades = 8
Precio promedio = (450k + 250k + 850k + ...) / 8 = 543,750
Disponibles = 7 (solo 1 está alquilada)
Tipo común = Casa (aparece 2 veces)
```

**Captura sugerida:** `08-estadisticas.png`

---

## 7. Flujo de Inicialización de Datos de Prueba

### Descripción
Carga automáticamente 8 propiedades de ejemplo para demostración sin configuración manual.

### Pasos
1. En página de Listado, hacer click en "Cargar Datos de Prueba"
2. Sistema muestra confirmación:
   ```
   "¿Cargar 8 propiedades de prueba en la base de datos?"
   [Cancelar] [Confirmar]
   ```
3. **Si confirma:**
   - Envía POST /api/init
   - Backend verifica si colección está vacía
   - Si vacía: inserta los 8 documentos
   - Muestra: `"Base de datos inicializada con 8 propiedades"`
   - Recarga listado mostrando las nuevas propiedades
4. **Si cancela:** cancela la acción

### Las 8 Propiedades de Prueba
1. **Casa moderna en La Romana** — RD$ 450,000 (250m², 4 hab, 3 baños)
2. **Apartamento con vista al mar** — RD$ 250,000 (120m², 3 hab, 2 baños)
3. **Villa de lujo en Punta Cana** — RD$ 850,000 (400m², 5 hab, 4 baños)
4. **Local comercial céntrico** — RD$ 180,000 (80m², 0 hab, 1 baño)
5. **Terreno para desarrollo** — RD$ 220,000 (5000m², 0 hab, 0 baños)
6. **Penthouse en torre residencial** — RD$ 650,000 (280m², 4 hab, 3 baños)
7. **Casa de campo en Higüey** — RD$ 320,000 (300m², 3 hab, 2 baños) - ALQUILADA
8. **Oficina ejecutiva en zona bancaria** — RD$ 95,000 (60m², 0 hab, 1 baño)

**Captura sugerida:** `09-datos-prueba-cargados.png`

---

## 8. Flujo con Filtros Combinados (Avanzado)

### Descripción
Ejemplo de búsqueda compleja combinando múltiples criterios.

### Caso de Uso
Usuario busca: "Propiedades en Santo Domingo entre RD$ 200k y RD$ 500k"

### Pasos
1. Ir a "Buscar"
2. Ingresar:
   - Ubicación: "Santo Domingo"
   - Precio Mín: 200000
   - Precio Máx: 500000
3. Click "Buscar"
4. Sistema ejecuta:
   ```
   GET /api/inmuebles?ubicacion=Santo+Domingo&precio_min=200000&precio_max=500000
   ```
5. Backend busca:
   - Ubicación contiene "Santo Domingo" (case-insensitive regex)
   - Precio >= 200000 AND precio <= 500000
6. Devuelve propiedades que cumplen AMBAS condiciones
7. Grid muestra resultados filtrados

---

## Estructura Visual del Dashboard

### Barra de Navegación
```
┌────────────────────────────────────────────────────────┐
│ [Listado] [Crear Propiedad] [Buscar] [Estadísticas]   │
│  (azul)                                                │
└────────────────────────────────────────────────────────┘
```
- Primera sección activa por defecto
- Indicador visual (color azul) de sección actual
- Responsive: stackea verticalmente en móvil

### Grid de Propiedades
```
┌──────────────┬──────────────┬──────────────┐
│ [Tarjeta 1]  │ [Tarjeta 2]  │ [Tarjeta 3]  │
└──────────────┴──────────────┴──────────────┘
┌──────────────┬──────────────┬──────────────┐
│ [Tarjeta 4]  │ [Tarjeta 5]  │ [Tarjeta 6]  │
└──────────────┴──────────────┴──────────────┘
```
- 3 columnas en desktop
- 2 columnas en tablet
- 1 columna en móvil
- Gap de 1.5rem entre tarjetas

### Tarjeta de Propiedad
```
┌─────────────────────────────┐
│ Casa moderna      [disponible]│
│ RD$ 450,000.00              │
│ 📍 La Romana, Santo Domingo │
│ • 250 m² • 4 hab • 3 baños  │
│ [Casa]                      │
│ [Ver] [Eliminar]            │
└─────────────────────────────┘
```

### Formulario de Creación
```
Sección: Crear Propiedad

[Título *]          [Precio (RD$) *]    [Tipo *]
[Ubicación *]
[Área m²] [Habitaciones] [Baños]
[Descripción]
[Estado]
[Características]
[Contacto: Nombre | Teléfono | Email]
                [Crear Propiedad]
```

### Modal de Detalles
```
                        [X]
┌─────────────────────────────┐
│ Casa moderna en La Romana   │
├─────────────────────────────┤
│ Precio: RD$ 450,000         │ Área: 250 m²
│ Tipo: Casa                  │ Habitaciones: 4
│ Ubicación: La Romana        │ Baños: 3
│ Estado: disponible          │
│                             │
│ Descripción:                │
│ Hermosa casa de dos pisos.. │
│                             │
│ Características:            │
│ • Piscina                   │
│ • Jardín                    │
│ • Aire acondicionado        │
│                             │
│ Contacto:                   │
│ Juan Pérez                  │
│ +1-809-555-0101             │
│ juan@ejemplo.com             │
│                             │
│ [Eliminar] [Cerrar]         │
└─────────────────────────────┘
```

---

## Códigos de Estado HTTP

### Respuestas Exitosas
| Código | Operación | Ejemplo |
|--------|-----------|---------|
| 200 | GET, PUT, DELETE | Listado cargado correctamente |
| 201 | POST | Propiedad creada exitosamente |

### Respuestas de Error
| Código | Causa | Solución |
|--------|-------|----------|
| 400 | Bad Request - validación fallida | Revisar campos del formulario |
| 404 | Not Found - propiedad no existe | Recargar listado |
| 500 | Server Error - error de BD | Verificar MongoDB está corriendo |

---

## Tiempos de Respuesta Esperados

| Operación | Tiempo | Notas |
|-----------|--------|-------|
| Cargar listado (8 props) | < 200ms | GET sin filtros |
| Buscar (con filtros) | < 300ms | Regex en MongoDB |
| Crear propiedad | < 500ms | Incluye validación |
| Ver detalles | < 100ms | GET por ObjectId |
| Eliminar | < 300ms | DELETE + confirmación |
| Actualizar estadísticas | < 200ms | Cálculos en memoria |

---

## Estructura de Capturas Recomendada

```
docs/capturas/
├── 01-listado-completo.png          # Vista principal con 8 propiedades
├── 02-formulario-creacion.png       # Formulario vacío
├── 03-formulario-rellenado.png      # Formulario con datos
├── 04-mensaje-exito.png             # Confirmación de creación
├── 05-busqueda-resultados.png       # Búsqueda con filtros
├── 06-modal-detalles.png            # Modal abierto con información
├── 07-confirmacion-eliminacion.png  # Dialog de confirmación
├── 08-estadisticas.png              # Vista de estadísticas
├── 09-datos-prueba-cargados.png     # Listado después de init
├── 10-responsive-mobile.png         # Vista en móvil
└── README.md                        # Descripción de cada captura
```

---

## Notas Técnicas para Pruebas

### Curl para Pruebas de API
```bash
# Listar todas las propiedades
curl http://localhost:5000/api/inmuebles

# Buscar en La Romana
curl "http://localhost:5000/api/inmuebles?ubicacion=La+Romana"

# Crear propiedad
curl -X POST http://localhost:5000/api/inmuebles \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Casa","precio":450000,"ubicacion":"La Romana","tipo":"Casa"}'

# Obtener detalles
curl http://localhost:5000/api/inmuebles/{id}

# Eliminar
curl -X DELETE http://localhost:5000/api/inmuebles/{id}
```

---

## Resumén de Flujos

| Flujo | Sección | Acción Principal | APIs Utilizadas |
|-------|---------|------------------|-----------------|
| 1 | Listado | Ver todas las propiedades | GET /inmuebles |
| 2 | Crear | Formulario + Guardar | POST /inmuebles |
| 3 | Buscar | Filtros + Buscar | GET /inmuebles?... |
| 4 | Detalles | Modal con info completa | GET /inmuebles/{id} |
| 5 | Eliminar | Confirmación + Delete | DELETE /inmuebles/{id} |
| 6 | Estadísticas | Análisis en tiempo real | GET /inmuebles... |
| 7 | Init | Cargar datos de prueba | POST /init |

---

**Última actualización:** Marzo 6, 2026  
**Versión:** 1.0.0  
**Estado:** Documentación completa
