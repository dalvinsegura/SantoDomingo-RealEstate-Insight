/* Santo Domingo Real Estate Insight - Lógica del dashboard (CRUD, listados, formularios) */

const API = "/api";

async function fetchApi(path, options = {}) {
    const res = await fetch(API + path, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
}

function mostrarEstado(msg, tipo = "info") {
    const el = document.getElementById("estadoConexion");
    el.textContent = msg;
    el.className = "estado " + tipo;
}

function renderLista(inmuebles) {
    const list = document.getElementById("listaInmuebles");
    if (!inmuebles || inmuebles.length === 0) {
        list.innerHTML = "<p class='estado'>No hay inmuebles. Crea uno con «Nuevo inmueble».</p>";
        return;
    }
    list.innerHTML = inmuebles.map((i) => `
        <div class="item-inmueble" data-id="${i._id}">
            <div>
                <span class="titulo">${escapeHtml(i.titulo || "Sin título")}</span>
                <div class="detalle">${escapeHtml(i.ubicacion || "")} · ${i.area_m2 ? i.area_m2 + " m²" : ""} ${i.habitaciones ? "· " + i.habitaciones + " hab." : ""}</div>
            </div>
            <div class="precio">${formatPrecio(i.precio)}</div>
            <div class="actions">
                <button type="button" class="editar" data-id="${i._id}">Editar</button>
                <button type="button" class="eliminar" data-id="${i._id}">Eliminar</button>
            </div>
        </div>
    `).join("");
    list.querySelectorAll(".editar").forEach((btn) => btn.addEventListener("click", () => abrirEditar(btn.dataset.id)));
    list.querySelectorAll(".eliminar").forEach((btn) => btn.addEventListener("click", () => eliminar(btn.dataset.id)));
}

function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
}

function formatPrecio(n) {
    if (n == null) return "—";
    return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(n);
}

async function cargarListado() {
    const ubicacion = document.getElementById("filtroUbicacion").value.trim();
    const precioMin = document.getElementById("filtroPrecioMin").value;
    const precioMax = document.getElementById("filtroPrecioMax").value;
    let path = "/inmuebles?limite=50";
    if (ubicacion) path += "&ubicacion=" + encodeURIComponent(ubicacion);
    if (precioMin) path += "&precio_min=" + precioMin;
    if (precioMax) path += "&precio_max=" + precioMax;
    try {
        const data = await fetchApi(path);
        renderLista(data.inmuebles);
        document.getElementById("paginacion").textContent = `Total: ${data.total} inmuebles`;
        mostrarEstado("Listado actualizado.", "info");
    } catch (e) {
        mostrarEstado("Error al cargar: " + e.message, "error");
        renderLista([]);
    }
}

async function abrirEditar(id) {
    try {
        const data = await fetchApi("/inmuebles/" + id);
        const i = data.inmueble;
        document.getElementById("tituloForm").textContent = "Editar inmueble";
        document.getElementById("inmuebleId").value = i._id;
        document.getElementById("titulo").value = i.titulo || "";
        document.getElementById("precio").value = i.precio ?? "";
        document.getElementById("ubicacion").value = i.ubicacion || "";
        document.getElementById("area_m2").value = i.area_m2 ?? "";
        document.getElementById("habitaciones").value = i.habitaciones ?? "";
        document.getElementById("banos").value = i.banos ?? "";
        document.getElementById("tipo").value = i.tipo || "casa";
        document.getElementById("enlace").value = i.enlace || "";
        document.getElementById("fuente").value = i.fuente || "";
        document.getElementById("descripcion").value = i.descripcion || "";
        document.getElementById("seccionFormulario").hidden = false;
    } catch (e) {
        mostrarEstado("Error al cargar inmueble: " + e.message, "error");
    }
}

function abrirNuevo() {
    document.getElementById("tituloForm").textContent = "Nuevo inmueble";
    document.getElementById("formInmueble").reset();
    document.getElementById("inmuebleId").value = "";
    document.getElementById("seccionFormulario").hidden = false;
}

async function guardar(ev) {
    ev.preventDefault();
    const id = document.getElementById("inmuebleId").value;
    const payload = {
        titulo: document.getElementById("titulo").value.trim(),
        precio: parseFloat(document.getElementById("precio").value) || 0,
        ubicacion: document.getElementById("ubicacion").value.trim(),
        area_m2: parseFloat(document.getElementById("area_m2").value) || null,
        habitaciones: parseInt(document.getElementById("habitaciones").value, 10) || null,
        banos: parseFloat(document.getElementById("banos").value) || null,
        tipo: document.getElementById("tipo").value,
        enlace: document.getElementById("enlace").value.trim() || null,
        fuente: document.getElementById("fuente").value.trim() || null,
        descripcion: document.getElementById("descripcion").value.trim() || null,
    };
    try {
        if (id) {
            await fetchApi("/inmuebles/" + id, { method: "PUT", body: JSON.stringify(payload) });
            mostrarEstado("Inmueble actualizado correctamente.", "info");
        } else {
            await fetchApi("/inmuebles", { method: "POST", body: JSON.stringify(payload) });
            mostrarEstado("Inmueble creado correctamente.", "info");
        }
        document.getElementById("seccionFormulario").hidden = true;
        cargarListado();
    } catch (e) {
        mostrarEstado("Error: " + e.message, "error");
    }
}

async function eliminar(id) {
    if (!confirm("¿Eliminar este inmueble?")) return;
    try {
        await fetchApi("/inmuebles/" + id, { method: "DELETE" });
        mostrarEstado("Inmueble eliminado.", "info");
        cargarListado();
    } catch (e) {
        mostrarEstado("Error al eliminar: " + e.message, "error");
    }
}

async function checkHealth() {
    try {
        const data = await fetchApi("/health");
        mostrarEstado("Conectado. MongoDB: " + (data.mongodb || "—"), data.mongodb === "ok" ? "info" : "error");
    } catch {
        mostrarEstado("No se pudo conectar con la API. ¿Está ejecutándose el servidor?", "error");
    }
}

document.getElementById("btnBuscar").addEventListener("click", cargarListado);
document.getElementById("btnNuevo").addEventListener("click", abrirNuevo);
document.getElementById("formInmueble").addEventListener("submit", guardar);
document.getElementById("btnCancelar").addEventListener("click", () => {
    document.getElementById("seccionFormulario").hidden = true;
});

checkHealth();
cargarListado();
