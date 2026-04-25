# src/database/db_config.py
# Configuración de conexión a SQLite para Santo Domingo Real Estate Insight

import sqlite3
import os
import json
from datetime import datetime

# Configuración
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "real_estate.db")

def get_connection():
    """Obtiene conexión a SQLite."""
    return sqlite3.connect(DB_PATH)

def init_db():
    """Inicializa la base de datos y crea tablas si no existen."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Crear tabla de inmuebles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inmuebles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            precio REAL NOT NULL,
            ubicacion TEXT NOT NULL,
            tipo TEXT NOT NULL,
            habitaciones INTEGER,
            banos INTEGER,
            area REAL,
            estado TEXT DEFAULT 'disponible',
            caracteristicas TEXT,  -- JSON string
            contacto TEXT,  -- JSON string
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def migrate_scraping_columns():
    """Add scraping-specific columns and tables if they don't exist yet."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(inmuebles)")
    existing_cols = {row[1] for row in cursor.fetchall()}

    new_cols = [
        ("estado", "TEXT DEFAULT 'disponible'"),
        ("lat", "REAL"),
        ("lng", "REAL"),
        ("sector_normalizado", "TEXT"),
        ("precio_m2", "REAL"),
        ("url_fuente", "TEXT"),
        ("fuente", "TEXT"),
        ("moneda", "TEXT DEFAULT 'USD'"),
        ("tipo_operacion", "TEXT DEFAULT 'venta'"),
    ]
    for col_name, col_def in new_cols:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE inmuebles ADD COLUMN {col_name} {col_def}")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS precio_historial (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            inmueble_id INTEGER NOT NULL,
            precio      REAL    NOT NULL,
            moneda      TEXT    DEFAULT 'USD',
            fecha       TEXT    DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (inmueble_id) REFERENCES inmuebles(id)
        )
    """)

    conn.commit()
    conn.close()


def migrate_auth_tables():
    """Crea tablas de usuarios y permisos globales si no existen."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            email               TEXT UNIQUE NOT NULL,
            password_hash       TEXT NOT NULL,
            nombre              TEXT,
            apellido            TEXT,
            telefono            TEXT,
            bio                 TEXT,
            avatar_url          TEXT,
            rol                 TEXT DEFAULT 'usuario',
            permisos            TEXT DEFAULT '{}',
            activo              INTEGER DEFAULT 1,
            fecha_creacion      TEXT DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS permisos_globales (
            id                  INTEGER PRIMARY KEY DEFAULT 1,
            crear               INTEGER DEFAULT 0,
            editar              INTEGER DEFAULT 0,
            eliminar            INTEGER DEFAULT 0,
            fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Fila única con valores por defecto
    cursor.execute("""
        INSERT OR IGNORE INTO permisos_globales (id, crear, editar, eliminar)
        VALUES (1, 0, 0, 0)
    """)

    conn.commit()
    conn.close()


def test_connection():
    """Prueba la conexión a SQLite. Devuelve True si está OK."""
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        return True
    except Exception:
        return False

# Inicializar DB y aplicar migraciones al importar
init_db()
migrate_scraping_columns()
migrate_auth_tables()
