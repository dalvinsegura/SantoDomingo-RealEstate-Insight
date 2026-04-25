# Roadmap de Nuevas Features — SantoDomingo RealEstate Insight

Documento de planificación para las próximas mejoras de la plataforma. Cada feature está descrita a alto nivel para alinear el equipo antes del desarrollo.

---

## 1. Score de Valor Automático

Cada propiedad en el listado y en su detalle mostrará un badge visual que indica si la propiedad está **barata**, tiene un **precio justo** o está **sobrevalorada**, comparando su precio por metro cuadrado contra el promedio de propiedades similares en el mismo sector.

El objetivo es que el usuario, de un vistazo, identifique las oportunidades más atractivas sin tener que hacer cálculos manuales.

---

## 2. Comparador de Propiedades Side-by-Side

El usuario podrá seleccionar entre 2 y 3 propiedades y verlas en una tabla comparativa lado a lado. La comparación incluirá los atributos más relevantes: precio, precio por metro cuadrado, habitaciones, baños, sector y tipo de operación.

Es una herramienta clave para quienes están evaluando opciones y necesitan tomar una decisión informada rápidamente.

---

## 3. Historial de Precio con Gráfico de Tendencia

En la página de detalle de cada propiedad se mostrará un gráfico de línea con la evolución histórica del precio a lo largo del tiempo.

Esto permite al usuario ver si una propiedad ha bajado de precio recientemente, si lleva mucho tiempo en el mercado sin moverse, o si su valor ha ido en aumento — información crítica para negociar mejor.

---

## 4. Página de Detalle de Inmueble

Actualmente no existe una vista dedicada por propiedad. Se creará una página individual (`/inmuebles/[id]`) que mostrará toda la información disponible: descripción, características, contacto, ubicación en el mapa y el score de valor.

Al final de la página se mostrará una sección de **"Propiedades Similares"** con otras opciones del mismo sector y tipo de inmueble.

---

## 6. Exportar Listado a CSV

Desde el listado de propiedades, el usuario podrá descargar en un solo clic un archivo CSV con todas las propiedades que coincidan con los filtros activos en ese momento.

Pensado especialmente para agentes inmobiliarios y analistas que necesitan trabajar con los datos fuera de la plataforma.

---

## 10. Asistente de Búsqueda en Lenguaje Natural (DeepSeek)

Un campo de búsqueda conversacional donde el usuario escribe lo que está buscando en sus propias palabras, por ejemplo: *"Quiero un apartamento de 2 habitaciones en Piantini por menos de 200 mil dólares"*.

El asistente, impulsado por **DeepSeek**, interpreta el texto y lo convierte automáticamente en filtros de búsqueda que consultan la base de datos, devolviendo resultados relevantes sin que el usuario tenga que tocar ningún filtro manual.

---

## Orden de implementación

| # | Feature | Estado |
|---|---------|--------|
| 1 | Score de Valor Automático | Completado |
| 2 | Comparador Side-by-Side | Completado |
| 3 | Historial de Precio con Gráfico | Completado |
| 4 | Página de Detalle de Inmueble | Completado |
| 6 | Exportar Listado a CSV | Completado |
| 10 | Asistente de Búsqueda con DeepSeek | Completado |
