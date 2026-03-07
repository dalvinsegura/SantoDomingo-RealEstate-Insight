# src/app.py
# API Flask: CRUD de inmuebles y listados para Santo Domingo Real Estate Insight

import os
from flask import Flask, request, jsonify, send_from_directory
from database.db_config import test_connection
from database import crud

app = Flask(__name__, static_folder="dashboard", static_url_path="")
app.config["JSON_AS_ASCII"] = False


# ---------- Rutas de API (CRUD) ----------

@app.route("/api/inmuebles", methods=["GET"])
def listar():
    """Lista inmuebles con paginación y filtros opcionales."""
    try:
        limite = request.args.get("limite", 100, type=int)
        saltar = request.args.get("saltar", 0, type=int)
        ubicacion = request.args.get("ubicacion", "").strip()
        precio_min = request.args.get("precio_min", type=float)
        precio_max = request.args.get("precio_max", type=float)
        if ubicacion:
            items = crud.buscar_por_ubicacion(ubicacion)[saltar : saltar + limite]
        elif precio_min is not None or precio_max is not None:
            items = crud.buscar_por_rango_precio(precio_min, precio_max)[saltar : saltar + limite]
        else:
            items = crud.listar_inmuebles(limite=limite, saltar=saltar)
        total = crud.contar_inmuebles()
        return jsonify({"ok": True, "total": total, "inmuebles": items})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>", methods=["GET"])
def obtener(id):
    """Obtiene un inmueble por ID."""
    item = crud.obtener_inmueble_por_id(id)
    if not item:
        return jsonify({"ok": False, "error": "No encontrado"}), 404
    return jsonify({"ok": True, "inmueble": item})


@app.route("/api/inmuebles", methods=["POST"])
def crear():
    """Crea un nuevo inmueble."""
    try:
        datos = request.get_json() or {}
        id_ = crud.crear_inmueble(datos)
        return jsonify({"ok": True, "id": id_}), 201
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>", methods=["PUT", "PATCH"])
def actualizar(id):
    """Actualiza un inmueble por ID."""
    datos = request.get_json() or {}
    try:
        ok = crud.actualizar_inmueble(id, datos)
        if not ok:
            return jsonify({"ok": False, "error": "No encontrado o sin cambios"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>", methods=["DELETE"])
def eliminar(id):
    """Elimina un inmueble por ID."""
    try:
        ok = crud.eliminar_inmueble(id)
        if not ok:
            return jsonify({"ok": False, "error": "No encontrado"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/health")
def health():
    """Estado de la API y conexión a MongoDB."""
    db_ok = test_connection()
    return jsonify({"ok": True, "mongodb": "ok" if db_ok else "error"})


# ---------- Dashboard (frontend) ----------
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
