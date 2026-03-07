# src/database/crud.py
# Operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para inmuebles

from bson import ObjectId
from .db_config import get_properties_collection


def _serialize_id(doc):
    """Convierte _id ObjectId a string para JSON."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ---------- CREAR ----------
def crear_inmueble(datos):
    """
    Crea un nuevo inmueble en la base de datos.
    datos: dict con titulo, precio, ubicacion, area_m2, habitaciones, banos, tipo, enlace, fuente, etc.
    """
    col = get_properties_collection()
    # Validación mínima
    if not datos.get("titulo") or datos.get("precio") is None:
        raise ValueError("titulo y precio son obligatorios")
    result = col.insert_one(datos)
    return str(result.inserted_id)


# ---------- LEER ----------
def listar_inmuebles(filtro=None, limite=100, saltar=0):
    """Lista inmuebles con filtro opcional y paginación."""
    col = get_properties_collection()
    filtro = filtro or {}
    cursor = col.find(filtro).skip(saltar).limit(limite)
    return [_serialize_id(doc) for doc in cursor]


def obtener_inmueble_por_id(id_str):
    """Obtiene un inmueble por su _id."""
    col = get_properties_collection()
    try:
        doc = col.find_one({"_id": ObjectId(id_str)})
        return _serialize_id(doc)
    except Exception:
        return None


def buscar_por_ubicacion(ubicacion):
    """Busca inmuebles por texto en ubicación."""
    col = get_properties_collection()
    cursor = col.find({"ubicacion": {"$regex": ubicacion, "$options": "i"}})
    return [_serialize_id(doc) for doc in cursor]


def buscar_por_rango_precio(precio_min=None, precio_max=None):
    """Busca inmuebles por rango de precio."""
    col = get_properties_collection()
    q = {}
    if precio_min is not None or precio_max is not None:
        q["precio"] = {}
        if precio_min is not None:
            q["precio"]["$gte"] = float(precio_min)
        if precio_max is not None:
            q["precio"]["$lte"] = float(precio_max)
    cursor = col.find(q) if q else col.find()
    return [_serialize_id(doc) for doc in cursor]


# ---------- ACTUALIZAR ----------
def actualizar_inmueble(id_str, datos):
    """
    Actualiza un inmueble por _id.
    datos: dict con los campos a actualizar (no incluir _id).
    """
    col = get_properties_collection()
    if "_id" in datos:
        del datos["_id"]
    result = col.update_one(
        {"_id": ObjectId(id_str)},
        {"$set": datos}
    )
    return result.modified_count > 0


# ---------- ELIMINAR ----------
def eliminar_inmueble(id_str):
    """Elimina un inmueble por _id."""
    col = get_properties_collection()
    result = col.delete_one({"_id": ObjectId(id_str)})
    return result.deleted_count > 0


def contar_inmuebles(filtro=None):
    """Cuenta documentos que coinciden con el filtro."""
    col = get_properties_collection()
    return col.count_documents(filtro or {})
