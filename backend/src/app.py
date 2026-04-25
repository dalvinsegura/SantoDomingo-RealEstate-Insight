# src/app.py
# API Flask: CRUD de inmuebles y listados para Santo Domingo Real Estate Insight

import csv
import io
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from database.db_config import test_connection
from database import crud
from database.test_data import load_test_data
from forms import InmuebleForm
from ai_search import extraer_filtros
from auth import (
    generate_token, get_current_user,
    require_auth, require_admin, check_permission,
)

# Carga variables de entorno desde backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
CORS(app)


# ---------- Rutas de API (CRUD) ----------

@app.route("/api/inmuebles", methods=["GET"])
def listar():
    """Lista inmuebles con paginación y filtros opcionales."""
    try:
        limite = min(request.args.get("limite", 24, type=int), 200)
        saltar = request.args.get("saltar", 0, type=int)
        ubicacion = request.args.get("ubicacion", "").strip()
        precio_min = request.args.get("precio_min", type=float)
        precio_max = request.args.get("precio_max", type=float)
        tipo = request.args.get("tipo", "").strip()
        hay_filtros = bool(ubicacion) or precio_min is not None or precio_max is not None or bool(tipo)
        if hay_filtros:
            items = crud.buscar_por_filtros(
                ubicacion=ubicacion,
                precio_min=precio_min,
                precio_max=precio_max,
                tipo=tipo,
                limite=limite,
                saltar=saltar,
            )
            total = crud.contar_por_filtros(ubicacion, precio_min, precio_max, tipo)
        else:
            items = crud.listar_inmuebles(limite=limite, saltar=saltar)
            total = crud.contar_inmuebles()
        return jsonify({"ok": True, "total": total, "inmuebles": items})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>", methods=["GET"])
def obtener(id):
    """Obtiene un inmueble por ID."""
    try:
        item = crud.obtener_inmueble_por_id(int(id))
        if not item:
            return jsonify({"ok": False, "error": "No encontrado"}), 404
        return jsonify({"ok": True, "inmueble": item})
    except ValueError:
        return jsonify({"ok": False, "error": "ID inválido"}), 400


@app.route("/api/inmuebles", methods=["POST"])
def crear():
    """Crea un nuevo inmueble. Requiere permiso 'crear'."""
    user = get_current_user()
    pg = crud.get_permisos_globales()
    if not check_permission(user, "crear", pg):
        return jsonify({"ok": False, "error": "No tienes permiso para crear propiedades"}), 403
    try:
        datos = request.get_json() or {}
        form = InmuebleForm(datos)
        if not form.validar():
            return jsonify({"ok": False, "errores": form.errores}), 400
        datos_limpios = form.get_datos_limpios()
        id_ = crud.crear_inmueble(datos_limpios)
        return jsonify({"ok": True, "id": id_}), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>", methods=["PUT", "PATCH"])
def actualizar(id):
    """Actualiza un inmueble. Requiere permiso 'editar'."""
    user = get_current_user()
    pg = crud.get_permisos_globales()
    if not check_permission(user, "editar", pg):
        return jsonify({"ok": False, "error": "No tienes permiso para editar propiedades"}), 403
    datos = request.get_json() or {}
    try:
        ok = crud.actualizar_inmueble(int(id), datos)
        if not ok:
            return jsonify({"ok": False, "error": "No encontrado o sin cambios"}), 404
        return jsonify({"ok": True})
    except ValueError:
        return jsonify({"ok": False, "error": "ID inválido"}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>", methods=["DELETE"])
def eliminar(id):
    """Elimina un inmueble. Requiere permiso 'eliminar'."""
    user = get_current_user()
    pg = crud.get_permisos_globales()
    if not check_permission(user, "eliminar", pg):
        return jsonify({"ok": False, "error": "No tienes permiso para eliminar propiedades"}), 403
    try:
        ok = crud.eliminar_inmueble(int(id))
        if not ok:
            return jsonify({"ok": False, "error": "No encontrado"}), 404
        return jsonify({"ok": True})
    except ValueError:
        return jsonify({"ok": False, "error": "ID inválido"}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/stats")
def stats():
    """Estadísticas agregadas (sin cargar todas las filas)."""
    try:
        data = crud.get_stats()
        return jsonify({
            "ok": True,
            "stats": {
                "total": data["total"],
                "precio_promedio": data["promedio"],
                "disponibles": data["disponibles"],
                "tipo_mas_comun": data["tipo_mas_comun"],
            }
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/health")
def health():
    """Estado de la API y conexión a MongoDB."""
    db_ok = test_connection()
    return jsonify({"ok": True, "mongodb": "ok" if db_ok else "error"})


@app.route("/api/calculator/estimate")
def calculator_estimate():
    """Estima el precio justo de un inmueble según comparables en la BD."""
    try:
        tipo = request.args.get("tipo", "").strip()
        if not tipo:
            return jsonify({"ok": False, "error": "El campo 'tipo' es requerido"}), 400

        area_m2 = request.args.get("area_m2", type=float)
        habitaciones = request.args.get("habitaciones", type=int)
        ubicacion = request.args.get("ubicacion", "").strip()

        resultado = crud.get_comparables_for_calculator(
            tipo=tipo,
            area_m2=area_m2,
            habitaciones=habitaciones,
            ubicacion=ubicacion,
        )
        if resultado is None:
            return jsonify({"ok": False, "error": "Sin datos comparables para estos parámetros"}), 404
        return jsonify({"ok": True, **resultado})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/sectores/heatmap")
def sectores_heatmap():
    """Datos agregados por sector para el mapa de calor."""
    try:
        data = crud.get_sector_heatmap_data()
        return jsonify({"ok": True, "sectores": data})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/export")
def exportar_csv():
    """Exporta el listado de inmuebles como archivo CSV."""
    try:
        ubicacion = request.args.get("ubicacion", "").strip()
        precio_min = request.args.get("precio_min", type=float)
        precio_max = request.args.get("precio_max", type=float)
        tipo = request.args.get("tipo", "").strip()
        hay_filtros = bool(ubicacion) or precio_min is not None or precio_max is not None or bool(tipo)

        items = (
            crud.buscar_por_filtros(
                ubicacion=ubicacion, precio_min=precio_min,
                precio_max=precio_max, tipo=tipo, limite=5000,
            )
            if hay_filtros
            else crud.listar_inmuebles(limite=5000)
        )

        columnas = [
            "id", "titulo", "tipo", "precio", "moneda", "precio_m2",
            "ubicacion", "sector_normalizado", "tipo_operacion",
            "habitaciones", "banos", "area_m2", "estado",
            "fuente", "url_fuente", "fecha_creacion",
        ]

        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=columnas, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(items)

        return Response(
            buf.getvalue(),
            mimetype="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=propiedades.csv"},
        )
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>/similares")
def similares(id):
    """Propiedades similares (mismo tipo y sector)."""
    try:
        inm = crud.obtener_inmueble_por_id(int(id))
        if not inm:
            return jsonify({"ok": False, "error": "No encontrado"}), 404
        limite = min(request.args.get("limite", 4, type=int), 12)
        data = crud.get_similares(
            inmueble_id=inm["id"],
            tipo=inm["tipo"],
            ubicacion=inm["ubicacion"],
            limite=limite,
        )
        return jsonify({"ok": True, "similares": data})
    except ValueError:
        return jsonify({"ok": False, "error": "ID inválido"}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/inmuebles/<id>/historial")
def precio_historial(id):
    """Historial de precios de un inmueble."""
    try:
        data = crud.get_precio_historial(int(id))
        return jsonify({"ok": True, "historial": data})
    except ValueError:
        return jsonify({"ok": False, "error": "ID inválido"}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/sectores/stats")
def sectores_stats():
    """Precio promedio por tipo y sector para calcular el score de valor."""
    try:
        data = crud.get_precio_promedio_por_tipo_sector()
        return jsonify({"ok": True, "stats": data})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/search/natural", methods=["POST"])
def busqueda_natural():
    """Búsqueda en lenguaje natural usando DeepSeek para extraer filtros."""
    try:
        datos = request.get_json() or {}
        query = datos.get("query", "").strip()
        if not query:
            return jsonify({"ok": False, "error": "El campo 'query' es requerido"}), 400

        filtros = extraer_filtros(query)

        items = crud.buscar_por_filtros(
            ubicacion=filtros.get("ubicacion") or "",
            precio_min=filtros.get("precio_min"),
            precio_max=filtros.get("precio_max"),
            tipo=filtros.get("tipo") or "",
            limite=24,
        )

        return jsonify({
            "ok": True,
            "filtros": filtros,
            "inmuebles": items,
            "total": len(items),
        })
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 503
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/init", methods=["POST"])
def initialize():
    """Carga datos de prueba en la base de datos."""
    try:
        load_test_data()
        total = crud.contar_inmuebles()
        return jsonify({"ok": True, "mensaje": "Base de datos inicializada", "inmuebles": total})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# AUTENTICACIÓN
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    """Registra un nuevo usuario. El primero en registrarse es admin."""
    try:
        datos = request.get_json() or {}
        email = datos.get("email", "").strip().lower()
        password = datos.get("password", "")
        nombre = datos.get("nombre", "").strip() or None
        apellido = datos.get("apellido", "").strip() or None

        if not email or "@" not in email:
            return jsonify({"ok": False, "error": "Email inválido"}), 400
        if len(password) < 6:
            return jsonify({"ok": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400

        if crud.obtener_usuario_por_email(email):
            return jsonify({"ok": False, "error": "Este email ya está registrado"}), 409

        password_hash = generate_password_hash(password, method="pbkdf2:sha256")
        id_ = crud.crear_usuario(email, password_hash, nombre, apellido)

        # El primer usuario registrado es admin automáticamente
        total_usuarios = len(crud.listar_usuarios())
        if total_usuarios == 1:
            crud.actualizar_rol_usuario(id_, "admin")

        usuario = crud.obtener_usuario_por_id(id_)
        token = generate_token(usuario["id"], usuario["email"], usuario["rol"], usuario["permisos"])
        return jsonify({"ok": True, "token": token, "usuario": usuario}), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """Inicia sesión con email y contraseña. Retorna JWT."""
    try:
        datos = request.get_json() or {}
        email = datos.get("email", "").strip().lower()
        password = datos.get("password", "")

        if not email or not password:
            return jsonify({"ok": False, "error": "Email y contraseña son requeridos"}), 400

        usuario = crud.obtener_usuario_por_email(email)
        if not usuario or not check_password_hash(usuario["password_hash"], password):
            return jsonify({"ok": False, "error": "Credenciales incorrectas"}), 401

        # Quitar hash del response
        usuario_public = {k: v for k, v in usuario.items() if k != "password_hash"}
        token = generate_token(
            usuario["id"], usuario["email"], usuario["rol"], usuario["permisos"]
        )
        return jsonify({"ok": True, "token": token, "usuario": usuario_public})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def auth_me(current_user):
    """Retorna el perfil del usuario autenticado."""
    try:
        usuario = crud.obtener_usuario_por_id(current_user["sub"])
        if not usuario:
            return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404
        return jsonify({"ok": True, "usuario": usuario})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/profile", methods=["PUT"])
@require_auth
def auth_update_profile(current_user):
    """Actualiza el perfil del usuario autenticado."""
    try:
        datos = request.get_json() or {}
        crud.actualizar_perfil_usuario(current_user["sub"], datos)
        usuario = crud.obtener_usuario_por_id(current_user["sub"])
        return jsonify({"ok": True, "usuario": usuario})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/change-password", methods=["POST"])
@require_auth
def auth_change_password(current_user):
    """Cambia la contraseña del usuario autenticado."""
    try:
        datos = request.get_json() or {}
        password_actual = datos.get("password_actual", "")
        password_nuevo = datos.get("password_nuevo", "")

        if len(password_nuevo) < 6:
            return jsonify({"ok": False, "error": "La nueva contraseña debe tener al menos 6 caracteres"}), 400

        usuario = crud.obtener_usuario_por_email(current_user["email"])
        if not usuario or not check_password_hash(usuario["password_hash"], password_actual):
            return jsonify({"ok": False, "error": "Contraseña actual incorrecta"}), 401

        nuevo_hash = generate_password_hash(password_nuevo)
        crud.actualizar_password_usuario(current_user["sub"], nuevo_hash)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/usuarios", methods=["GET"])
@require_admin
def admin_listar_usuarios(current_user):
    """Lista todos los usuarios (solo admin)."""
    try:
        usuarios = crud.listar_usuarios()
        return jsonify({"ok": True, "usuarios": usuarios})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/admin/usuarios/<int:id>/rol", methods=["PUT"])
@require_admin
def admin_cambiar_rol(id, current_user):
    """Cambia el rol de un usuario (solo admin)."""
    try:
        datos = request.get_json() or {}
        rol = datos.get("rol", "")
        if rol not in ("admin", "usuario"):
            return jsonify({"ok": False, "error": "Rol inválido. Use 'admin' o 'usuario'"}), 400

        # No permitir que el último admin se quite a sí mismo el rol
        if id == current_user["sub"] and rol == "usuario":
            if crud.contar_admins() <= 1:
                return jsonify({"ok": False, "error": "No puedes quitarte el rol admin siendo el único admin"}), 400

        ok = crud.actualizar_rol_usuario(id, rol)
        if not ok:
            return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/admin/usuarios/<int:id>/permisos", methods=["PUT"])
@require_admin
def admin_cambiar_permisos(id, current_user):
    """Actualiza los permisos de un usuario (solo admin)."""
    try:
        datos = request.get_json() or {}
        permisos = {
            "crear": bool(datos.get("crear", False)),
            "editar": bool(datos.get("editar", False)),
            "eliminar": bool(datos.get("eliminar", False)),
        }
        ok = crud.actualizar_permisos_usuario(id, permisos)
        if not ok:
            return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/admin/usuarios/<int:id>", methods=["DELETE"])
@require_admin
def admin_desactivar_usuario(id, current_user):
    """Desactiva un usuario (soft-delete, solo admin)."""
    try:
        if id == current_user["sub"]:
            return jsonify({"ok": False, "error": "No puedes desactivar tu propia cuenta"}), 400
        ok = crud.desactivar_usuario(id)
        if not ok:
            return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/admin/permisos-globales", methods=["GET"])
def admin_get_permisos_globales():
    """Retorna los permisos globales (público, para que el frontend sepa qué mostrar)."""
    try:
        return jsonify({"ok": True, "permisos": crud.get_permisos_globales()})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/admin/permisos-globales", methods=["PUT"])
@require_admin
def admin_set_permisos_globales(current_user):
    """Actualiza los permisos globales (solo admin)."""
    try:
        datos = request.get_json() or {}
        crud.set_permisos_globales(datos)
        return jsonify({"ok": True, "permisos": crud.get_permisos_globales()})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
