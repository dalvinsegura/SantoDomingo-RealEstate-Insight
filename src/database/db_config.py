# src/database/db_config.py
# Configuración de conexión a MongoDB para Santo Domingo Real Estate Insight

import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Configuración por defecto (usar variables de entorno en producción)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("MONGO_DB_NAME", "real_estate_insight")
COLLECTION_PROPERTIES = "inmuebles"

_client = None


def get_client():
    """Obtiene el cliente de MongoDB (singleton)."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client


def get_db():
    """Obtiene la base de datos."""
    return get_client()[DB_NAME]


def get_properties_collection():
    """Obtiene la colección de inmuebles."""
    return get_db()[COLLECTION_PROPERTIES]


def test_connection():
    """Prueba la conexión a MongoDB. Devuelve True si está OK."""
    try:
        get_client().admin.command("ping")
        return True
    except ConnectionFailure:
        return False


def close_connection():
    """Cierra la conexión a MongoDB."""
    global _client
    if _client:
        _client.close()
        _client = None
