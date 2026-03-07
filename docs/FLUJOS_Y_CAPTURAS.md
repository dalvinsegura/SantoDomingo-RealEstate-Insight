# Flujos completos y capturas

Descripción de los flujos de la aplicación y dónde colocar capturas de pantalla que los ilustren.

---

## Flujo 1: Ver listado de inmuebles

1. Iniciar el servidor: `python run.py` (desde la raíz del proyecto).
2. Abrir en el navegador: `http://localhost:5000/`.
3. El dashboard carga y muestra el listado de inmuebles (vacío si no hay datos).
4. En la parte superior se muestra el estado de conexión (API y MongoDB).

**Captura sugerida:** Pantalla principal del dashboard con el listado visible (y, si aplica, filtros usados).  
**Guardar en:** `docs/capturas/01-listado.png`

---

## Flujo 2: Crear un nuevo inmueble

1. En el dashboard, pulsar **«+ Nuevo inmueble»**.
2. Se abre el formulario a la derecha (o debajo en móvil).
3. Rellenar: Título, Precio (USD), Ubicación, y opcionalmente Área, Habitaciones, Baños, Tipo, Enlace, Fuente, Descripción.
4. Pulsar **«Guardar»**.
5. El formulario se cierra y el listado se actualiza con el nuevo inmueble.

**Captura sugerida:** Formulario rellenado antes de guardar, o listado justo después de crear.  
**Guardar en:** `docs/capturas/02-formulario-nuevo.png` y/o `03-despues-crear.png`

---

## Flujo 3: Editar un inmueble existente

1. En el listado, pulsar **«Editar»** en la fila del inmueble.
2. Se carga el formulario con los datos actuales.
3. Modificar los campos deseados y pulsar **«Guardar»**.
4. El listado se actualiza con los cambios.

**Captura sugerida:** Formulario en modo edición con datos cargados.  
**Guardar en:** `docs/capturas/04-editar.png`

---

## Flujo 4: Eliminar un inmueble

1. En el listado, pulsar **«Eliminar»** en la fila del inmueble.
2. Confirmar en el cuadro de diálogo.
3. El inmueble desaparece del listado y de la base de datos.

**Captura sugerida:** Cuadro de confirmación de eliminación, o listado después de eliminar.  
**Guardar en:** `docs/capturas/05-eliminar.png`

---

## Flujo 5: Filtrar por ubicación y precio

1. En los filtros del listado, escribir una ubicación (ej. «Naco») o un rango de precio (mín y/o máx).
2. Pulsar **«Buscar»**.
3. El listado se actualiza mostrando solo los inmuebles que coinciden.

**Captura sugerida:** Filtros rellenados y listado filtrado.  
**Guardar en:** `docs/capturas/06-filtros.png`

---

## Dónde guardar las capturas

Crear la carpeta `docs/capturas/` y colocar ahí las imágenes con nombres descriptivos, por ejemplo:

- `01-listado.png` — Vista principal del listado.
- `02-formulario-nuevo.png` — Formulario al crear.
- `03-despues-crear.png` — Listado tras crear un inmueble.
- `04-editar.png` — Formulario en edición.
- `05-eliminar.png` — Confirmación o listado tras eliminar.
- `06-filtros.png` — Uso de filtros.

En este documento se pueden enlazar después con Markdown, por ejemplo:

```markdown
![Listado de inmuebles](capturas/01-listado.png)
```

---

## Resumen de flujos

| Flujo        | Acción principal        | Pantalla clave              |
|-------------|--------------------------|-----------------------------|
| Listado     | Ver todos los inmuebles  | Dashboard principal         |
| Crear       | Nuevo inmueble + Guardar| Formulario + listado        |
| Editar      | Editar + Guardar         | Formulario con datos        |
| Eliminar    | Eliminar + Confirmar     | Diálogo + listado           |
| Filtros     | Buscar por ubicación/precio | Filtros + listado        |
