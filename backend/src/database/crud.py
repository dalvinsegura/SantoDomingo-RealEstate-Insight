# src/database/crud.py
# Operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para inmuebles usando SQLite
from __future__ import annotations

import math
import sqlite3
import json
from .db_config import get_connection


_SELECT_COLS = """
    id, titulo, descripcion, precio, ubicacion, tipo,
    habitaciones, banos, area, caracteristicas, contacto,
    fecha_creacion, fecha_actualizacion,
    estado, lat, lng, sector_normalizado, precio_m2,
    url_fuente, fuente, moneda, tipo_operacion
"""

def _dict_from_row(row):
    """Convierte una fila de SQLite a dict."""
    if row:
        return {
            "id": row[0],
            "titulo": row[1],
            "descripcion": row[2],
            "precio": row[3],
            "ubicacion": row[4],
            "tipo": row[5],
            "habitaciones": row[6],
            "banos": row[7],
            "area_m2": row[8],
            "caracteristicas": json.loads(row[9]) if row[9] else [],
            "contacto": json.loads(row[10]) if row[10] else {},
            "fecha_creacion": row[11],
            "fecha_actualizacion": row[12],
            "estado": row[13] or "disponible",
            "lat": row[14],
            "lng": row[15],
            "sector_normalizado": row[16],
            "precio_m2": row[17],
            "url_fuente": row[18],
            "fuente": row[19],
            "moneda": row[20] or "USD",
            "tipo_operacion": row[21] or "venta",
        }
    return None


# ---------- CREAR ----------
def crear_inmueble(datos):
    """
    Crea un nuevo inmueble en la base de datos.
    datos: dict con titulo, precio, ubicacion, etc.
    """
    # Validación mínima
    if not datos.get("titulo") or datos.get("precio") is None:
        raise ValueError("titulo y precio son obligatorios")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO inmuebles (titulo, descripcion, precio, ubicacion, tipo, habitaciones, banos, area, caracteristicas, contacto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datos["titulo"],
        datos.get("descripcion", ""),
        datos["precio"],
        datos["ubicacion"],
        datos["tipo"],
        datos.get("habitaciones"),
        datos.get("banos"),
        datos.get("area"),
        json.dumps(datos.get("caracteristicas", [])),
        json.dumps(datos.get("contacto", {}))
    ))
    
    inmueble_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return inmueble_id


# ---------- LEER ----------
def listar_inmuebles(limite=24, saltar=0):
    """Lista inmuebles con paginación."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT {_SELECT_COLS} FROM inmuebles ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?",
        (limite, saltar),
    )
    rows = cursor.fetchall()
    conn.close()
    return [_dict_from_row(row) for row in rows]


def obtener_inmueble_por_id(id_int):
    """Obtiene un inmueble por su id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT {_SELECT_COLS} FROM inmuebles WHERE id = ?",
        (id_int,),
    )
    row = cursor.fetchone()
    conn.close()
    return _dict_from_row(row)


def _build_filtros(ubicacion="", precio_min=None, precio_max=None, tipo="", excluir_id=None):
    """Construye la cláusula WHERE y params para filtros combinados."""
    where = "WHERE 1=1"
    params: list = []
    if ubicacion:
        where += " AND ubicacion LIKE ?"
        params.append(f"%{ubicacion}%")
    if precio_min is not None:
        where += " AND precio >= ?"
        params.append(precio_min)
    if precio_max is not None:
        where += " AND precio <= ?"
        params.append(precio_max)
    if tipo:
        where += " AND tipo = ?"
        params.append(tipo)
    if excluir_id is not None:
        where += " AND id != ?"
        params.append(excluir_id)
    return where, params


def buscar_por_filtros(ubicacion="", precio_min=None, precio_max=None, tipo="", limite=24, saltar=0):
    """Busca inmuebles con filtros combinados (ubicación, precio y/o tipo)."""
    where, params = _build_filtros(ubicacion, precio_min, precio_max, tipo)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT {_SELECT_COLS} FROM inmuebles {where} ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?",
        params + [limite, saltar],
    )
    rows = cursor.fetchall()
    conn.close()
    return [_dict_from_row(row) for row in rows]


def get_similares(inmueble_id: int, tipo: str, ubicacion: str, limite: int = 4) -> list[dict]:
    """Devuelve propiedades similares (mismo tipo, misma ubicación) excluyendo el inmueble actual."""
    where, params = _build_filtros(ubicacion=ubicacion, tipo=tipo, excluir_id=inmueble_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT {_SELECT_COLS} FROM inmuebles {where} ORDER BY fecha_creacion DESC LIMIT ?",
        params + [limite],
    )
    rows = cursor.fetchall()
    # Si no hay suficientes del mismo sector, completar con mismo tipo
    if len(rows) < limite:
        where2, params2 = _build_filtros(tipo=tipo, excluir_id=inmueble_id)
        ya_ids = {r[0] for r in rows}
        cursor.execute(
            f"SELECT {_SELECT_COLS} FROM inmuebles {where2} ORDER BY RANDOM() LIMIT ?",
            params2 + [limite * 2],
        )
        extras = [r for r in cursor.fetchall() if r[0] not in ya_ids]
        rows = list(rows) + extras[: limite - len(rows)]
    conn.close()
    return [_dict_from_row(row) for row in rows]


def contar_por_filtros(ubicacion="", precio_min=None, precio_max=None, tipo=""):
    """Cuenta inmuebles que coinciden con los filtros dados."""
    where, params = _build_filtros(ubicacion, precio_min, precio_max, tipo)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM inmuebles {where}", params)
    count = cursor.fetchone()[0]
    conn.close()
    return count


# Kept for backwards compatibility
def buscar_por_ubicacion(ubicacion, limite=24, saltar=0):
    return buscar_por_filtros(ubicacion=ubicacion, limite=limite, saltar=saltar)


def buscar_por_rango_precio(precio_min=None, precio_max=None, limite=24, saltar=0):
    return buscar_por_filtros(precio_min=precio_min, precio_max=precio_max, limite=limite, saltar=saltar)


def get_stats():
    """Calcula estadísticas agregadas directamente en SQLite."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT
            COUNT(*) as total,
            AVG(precio) as promedio,
            SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles
        FROM inmuebles
    ''')
    row = cursor.fetchone()
    total = row[0] or 0
    promedio = row[1] or 0
    disponibles = row[2] or 0

    cursor.execute('''
        SELECT tipo, COUNT(*) as cnt
        FROM inmuebles
        WHERE tipo IS NOT NULL
        GROUP BY tipo
        ORDER BY cnt DESC
        LIMIT 1
    ''')
    tipo_row = cursor.fetchone()
    tipo_mas_comun = tipo_row[0] if tipo_row else "-"

    conn.close()
    return {
        "total": total,
        "promedio": round(promedio, 2),
        "disponibles": disponibles,
        "tipo_mas_comun": tipo_mas_comun,
    }


# ---------- ACTUALIZAR ----------
def actualizar_inmueble(id_int, datos):
    """
    Actualiza un inmueble por id.
    datos: dict con los campos a actualizar.
    """
    if "id" in datos:
        del datos["id"]
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Construir query dinámicamente
    set_parts = []
    params = []
    
    for key, value in datos.items():
        if key in ["titulo", "descripcion", "ubicacion", "tipo"]:
            set_parts.append(f"{key} = ?")
            params.append(value)
        elif key in ["precio", "habitaciones", "banos", "area"]:
            set_parts.append(f"{key} = ?")
            params.append(value)
        elif key in ["caracteristicas", "contacto"]:
            set_parts.append(f"{key} = ?")
            params.append(json.dumps(value))
    
    if not set_parts:
        conn.close()
        return False
    
    set_clause = ", ".join(set_parts)
    params.append(id_int)
    
    cursor.execute(f'''
        UPDATE inmuebles
        SET {set_clause}, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', params)
    
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated


# ---------- ELIMINAR ----------
def eliminar_inmueble(id_int):
    """Elimina un inmueble por id."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM inmuebles WHERE id = ?', (id_int,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def contar_inmuebles():
    """Cuenta total de inmuebles."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) FROM inmuebles')
    count = cursor.fetchone()[0]
    conn.close()
    return count


# ---------- SCRAPING ----------

def upsert_inmueble_scraped(datos: dict) -> int | None:
    """
    Insert a scraped property if its url_fuente is not already in the DB.
    Returns the new row ID, or None if it was a duplicate (skipped).
    """
    url = datos.get("url_fuente")
    conn = get_connection()
    cursor = conn.cursor()

    if url:
        existing = cursor.execute(
            "SELECT id FROM inmuebles WHERE url_fuente = ?", (url,)
        ).fetchone()
        if existing:
            conn.close()
            return None

    cursor.execute(
        """
        INSERT INTO inmuebles (
            titulo, descripcion, precio, ubicacion, tipo,
            habitaciones, banos, area, caracteristicas, contacto,
            lat, lng, sector_normalizado, precio_m2,
            url_fuente, fuente, moneda, tipo_operacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            datos.get("titulo", "Sin título")[:200],
            datos.get("descripcion", ""),
            datos.get("precio", 0),
            datos.get("ubicacion", "Santo Domingo"),
            datos.get("tipo", "Apartamento"),
            datos.get("habitaciones"),
            datos.get("banos"),
            datos.get("area"),
            json.dumps(datos.get("caracteristicas", [])),
            json.dumps(datos.get("contacto", {})),
            datos.get("lat"),
            datos.get("lng"),
            datos.get("sector_normalizado"),
            datos.get("precio_m2"),
            datos.get("url_fuente"),
            datos.get("fuente"),
            datos.get("moneda", "USD"),
            datos.get("tipo_operacion", "venta"),
        ),
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id


def get_comparables_for_calculator(
    tipo: str,
    area_m2: float | None = None,
    habitaciones: int | None = None,
    ubicacion: str = "",
) -> dict | None:
    """
    Weighted-similarity pricing model.

    Scoring por comparable:
      • area_score  : gaussiana en log-ratio → 1.0 exacto, ~0.37 al doble, ~0.02 al cuádruple
      • hab_score   : 1.0 / 0.75 / 0.45 / 0.15 para diff 0/1/2/3+
      • loc_boost   : ×2.0 cuando algún token del sector coincide
      • Sin dato    : penalización neutra (0.5) en vez de excluir

    Limpieza:
      • Outliers removidos por IQR (×1.5) sobre precios crudos
      • Precio final = promedio ponderado sobre conjunto limpio

    Retorna también `comparables_similares` (peso ≥ 0.3) y `confianza` (0–100).
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Sin hard cutoffs: traemos todos los del mismo tipo y scoremos
    cursor.execute(
        "SELECT precio, area, habitaciones, ubicacion, precio_m2 "
        "FROM inmuebles WHERE tipo = ? AND precio > 0 "
        "ORDER BY fecha_creacion DESC LIMIT 200",
        (tipo,),
    )
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return None

    ub_tokens = (
        [t for t in ubicacion.lower().split() if len(t) >= 4]
        if ubicacion else []
    )

    # (precio, weight, area, pm2)
    scored: list[tuple[float, float, float | None, float | None]] = []

    for precio, area, hab, ub, pm2 in rows:
        if not precio or precio <= 0:
            continue

        weight = 1.0

        # ── Área: similitud gaussiana en espacio log-ratio ─────────────────
        if area_m2 and area_m2 > 0:
            if area and area > 0:
                log_r = math.log(area / area_m2)
                # sigma≈0.5 → score≈0.37 al doble de tamaño, ≈0.02 al cuádruple
                weight *= math.exp(-2.0 * log_r ** 2)
            else:
                weight *= 0.5   # área desconocida: penalización neutra

        # ── Habitaciones: scoring escalonado ──────────────────────────────
        if habitaciones is not None:
            if hab is not None:
                diff = abs(int(hab) - habitaciones)
                weight *= {0: 1.0, 1: 0.75, 2: 0.45}.get(diff, 0.15)
            else:
                weight *= 0.5   # hab desconocida: penalización neutra

        # ── Ubicación: multiplicador por coincidencia de sector ────────────
        if ub_tokens and ub:
            if any(tok in ub.lower() for tok in ub_tokens):
                weight *= 2.0

        scored.append((precio, weight, area, pm2))

    if not scored:
        return None

    # ── IQR: remover outliers de precio (independiente del peso) ──────────
    prices_raw = sorted(p for p, *_ in scored)
    nr = len(prices_raw)
    q1 = prices_raw[nr // 4]
    q3 = prices_raw[min(3 * nr // 4, nr - 1)]
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr

    clean = [(p, w, a, pm2) for p, w, a, pm2 in scored if lo <= p <= hi]
    if not clean:
        clean = scored   # fallback si todo cae fuera

    # ── Precio estimado: promedio ponderado ────────────────────────────────
    total_w = sum(w for _, w, *_ in clean)
    precio_estimado = sum(p * w for p, w, *_ in clean) / total_w

    # ── Percentiles sobre precios limpios (no ponderados) ─────────────────
    prices_clean = sorted(p for p, *_ in clean)
    nc = len(prices_clean)

    # ── Precio por m² ─────────────────────────────────────────────────────
    if area_m2 and area_m2 > 0:
        # La forma más precisa: usar el precio estimado sobre el área dada
        precio_m2_est: float | None = precio_estimado / area_m2
    else:
        pm2_pairs = [
            (pm2, w) for _, w, _, pm2 in clean if pm2 and pm2 > 0
        ] + [
            (p / a, w) for p, w, a, _ in clean
            if a and a > 0 and not any(pm2v and pm2v > 0 for _, _, _, pm2v in [(0, 0, a, None)])
        ]
        if pm2_pairs:
            tw = sum(w for _, w in pm2_pairs)
            precio_m2_est = sum(v * w for v, w in pm2_pairs) / tw
        else:
            precio_m2_est = None

    # ── Confianza ─────────────────────────────────────────────────────────
    # "similares" = comparables con peso ≥ 0.3 (alta similitud)
    similares = sum(1 for _, w, *_ in clean if w >= 0.3)
    confianza = min(100, similares * 8 + min(nc * 2, 20))

    return {
        "precio_estimado": round(precio_estimado, 2),
        "precio_min": round(prices_clean[0], 2),
        "precio_max": round(prices_clean[-1], 2),
        "precio_p25": round(prices_clean[nc // 4], 2),
        "precio_p75": round(prices_clean[min(3 * nc // 4, nc - 1)], 2),
        "precio_m2_promedio": round(precio_m2_est, 2) if precio_m2_est else None,
        "cantidad_comparables": nc,
        "comparables_similares": similares,
        "confianza": confianza,
    }


def get_sector_heatmap_data() -> list[dict]:
    """
    Agrupa inmuebles por sector/ubicación y calcula estadísticas de precio.
    Usa sector_normalizado si existe, si no usa ubicacion.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            COALESCE(NULLIF(sector_normalizado,''), ubicacion) AS sector,
            COUNT(*) AS cantidad,
            AVG(precio) AS precio_promedio,
            MIN(precio) AS precio_min,
            MAX(precio) AS precio_max,
            AVG(CASE WHEN precio_m2 IS NOT NULL AND precio_m2 > 0 THEN precio_m2 END) AS precio_m2_promedio,
            AVG(CASE WHEN area IS NOT NULL AND area > 0 THEN area END) AS area_promedio
        FROM inmuebles
        WHERE COALESCE(NULLIF(sector_normalizado,''), ubicacion) IS NOT NULL
        GROUP BY COALESCE(NULLIF(sector_normalizado,''), ubicacion)
        ORDER BY precio_promedio DESC
        """
    )
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "sector": row[0],
            "cantidad": row[1],
            "precio_promedio": round(row[2] or 0, 2),
            "precio_min": round(row[3] or 0, 2),
            "precio_max": round(row[4] or 0, 2),
            "precio_m2_promedio": round(row[5], 2) if row[5] else None,
            "area_promedio": round(row[6], 2) if row[6] else None,
        }
        for row in rows
    ]


def get_precio_historial(inmueble_id: int) -> list[dict]:
    """Devuelve el historial de precios de un inmueble ordenado por fecha."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT precio, moneda, fecha
        FROM precio_historial
        WHERE inmueble_id = ?
        ORDER BY fecha ASC
        """,
        (inmueble_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"precio": row[0], "moneda": row[1], "fecha": row[2]} for row in rows]


def seed_precio_historial() -> int:
    """
    Crea una entrada inicial en precio_historial para cada inmueble que
    aún no tenga ningún registro. Usa fecha_creacion como fecha base.
    Retorna la cantidad de registros insertados.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, precio, moneda, fecha_creacion
        FROM inmuebles
        WHERE id NOT IN (SELECT DISTINCT inmueble_id FROM precio_historial)
        AND precio > 0
        """
    )
    rows = cursor.fetchall()
    if rows:
        cursor.executemany(
            "INSERT INTO precio_historial (inmueble_id, precio, moneda, fecha) VALUES (?, ?, ?, ?)",
            [(row[0], row[1], row[2] if row[2] else "USD", row[3]) for row in rows],
        )
        conn.commit()
    conn.close()
    return len(rows)


def registrar_precio_historial(inmueble_id: int, precio: float, moneda: str = "USD") -> None:
    """
    Inserta un nuevo punto en precio_historial solo si el precio
    es distinto al último registrado para ese inmueble.
    """
    conn = get_connection()
    cursor = conn.cursor()
    ultimo = cursor.execute(
        "SELECT precio FROM precio_historial WHERE inmueble_id = ? ORDER BY fecha DESC LIMIT 1",
        (inmueble_id,),
    ).fetchone()
    if ultimo is None or abs(ultimo[0] - precio) > 0.01:
        cursor.execute(
            "INSERT INTO precio_historial (inmueble_id, precio, moneda) VALUES (?, ?, ?)",
            (inmueble_id, precio, moneda),
        )
        conn.commit()
    conn.close()


def get_precio_promedio_por_tipo_sector() -> list[dict]:
    """
    Precio promedio por (tipo, sector) para calcular el score de valor
    de cada inmueble en el frontend.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            tipo,
            COALESCE(NULLIF(sector_normalizado, ''), ubicacion) AS sector,
            AVG(precio) AS precio_promedio,
            COUNT(*) AS cantidad
        FROM inmuebles
        WHERE precio > 0 AND tipo IS NOT NULL
        GROUP BY tipo, COALESCE(NULLIF(sector_normalizado, ''), ubicacion)
        """
    )
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "tipo": row[0],
            "sector": row[1],
            "precio_promedio": round(row[2], 2),
            "cantidad": row[3],
        }
        for row in rows
    ]


def bulk_upsert_scraped(items: list[dict]) -> tuple[int, int]:
    """
    Insert multiple scraped properties in a single transaction.
    Skips duplicates by url_fuente.
    Returns (new_count, dup_count).
    """
    if not items:
        return 0, 0

    conn = get_connection()
    cursor = conn.cursor()
    new_count = dup_count = 0

    try:
        # Load all existing URLs once — avoids N per-item SELECT queries
        cursor.execute("SELECT url_fuente FROM inmuebles WHERE url_fuente IS NOT NULL")
        existing_urls = {row[0] for row in cursor.fetchall()}

        for datos in items:
            url = datos.get("url_fuente")
            if url and url in existing_urls:
                dup_count += 1
                continue

            cursor.execute(
                """
                INSERT INTO inmuebles (
                    titulo, descripcion, precio, ubicacion, tipo,
                    habitaciones, banos, area, caracteristicas, contacto,
                    lat, lng, sector_normalizado, precio_m2,
                    url_fuente, fuente, moneda, tipo_operacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    datos.get("titulo", "Sin título")[:200],
                    datos.get("descripcion", ""),
                    datos.get("precio", 0),
                    datos.get("ubicacion", "Santo Domingo"),
                    datos.get("tipo", "Apartamento"),
                    datos.get("habitaciones"),
                    datos.get("banos"),
                    datos.get("area"),
                    json.dumps(datos.get("caracteristicas", [])),
                    json.dumps(datos.get("contacto", {})),
                    datos.get("lat"),
                    datos.get("lng"),
                    datos.get("sector_normalizado"),
                    datos.get("precio_m2"),
                    url,
                    datos.get("fuente"),
                    datos.get("moneda", "USD"),
                    datos.get("tipo_operacion", "venta"),
                ),
            )
            new_count += 1
            if url:
                existing_urls.add(url)

        conn.commit()
    finally:
        conn.close()

    return new_count, dup_count


# ═══════════════════════════════════════════════════════════════════════════════
# USUARIOS
# ═══════════════════════════════════════════════════════════════════════════════

_USUARIO_COLS = "id, email, nombre, apellido, telefono, bio, avatar_url, rol, permisos, activo, fecha_creacion, fecha_actualizacion"
_USUARIO_COLS_HASH = "id, email, password_hash, nombre, apellido, telefono, bio, avatar_url, rol, permisos, activo, fecha_creacion, fecha_actualizacion"


def _usuario_from_row(row) -> dict:
    """Convierte fila de `usuarios` a dict (sin password_hash)."""
    return {
        "id": row[0],
        "email": row[1],
        "nombre": row[2],
        "apellido": row[3],
        "telefono": row[4],
        "bio": row[5],
        "avatar_url": row[6],
        "rol": row[7] or "usuario",
        "permisos": json.loads(row[8]) if row[8] else {},
        "activo": bool(row[9]),
        "fecha_creacion": row[10],
        "fecha_actualizacion": row[11],
    }


def _usuario_con_hash_from_row(row) -> dict:
    """Convierte fila de `usuarios` a dict incluyendo password_hash."""
    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "nombre": row[3],
        "apellido": row[4],
        "telefono": row[5],
        "bio": row[6],
        "avatar_url": row[7],
        "rol": row[8] or "usuario",
        "permisos": json.loads(row[9]) if row[9] else {},
        "activo": bool(row[10]),
        "fecha_creacion": row[11],
        "fecha_actualizacion": row[12],
    }


def crear_usuario(email: str, password_hash: str, nombre: str = None, apellido: str = None) -> int:
    """Inserta un nuevo usuario. Retorna el ID."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO usuarios (email, password_hash, nombre, apellido) VALUES (?, ?, ?, ?)",
            (email.lower().strip(), password_hash, nombre, apellido),
        )
        id_ = cursor.lastrowid
        conn.commit()
        return id_
    finally:
        conn.close()


def obtener_usuario_por_email(email: str) -> dict | None:
    """Busca usuario por email incluyendo hash (para verificar contraseña)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT {_USUARIO_COLS_HASH} FROM usuarios WHERE email = ? AND activo = 1",
            (email.lower().strip(),),
        )
        row = cursor.fetchone()
        return _usuario_con_hash_from_row(row) if row else None
    finally:
        conn.close()


def obtener_usuario_por_id(id_: int) -> dict | None:
    """Busca usuario por ID (sin password_hash)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT {_USUARIO_COLS} FROM usuarios WHERE id = ?",
            (id_,),
        )
        row = cursor.fetchone()
        return _usuario_from_row(row) if row else None
    finally:
        conn.close()


def actualizar_perfil_usuario(id_: int, datos: dict) -> bool:
    """Actualiza campos de perfil (nombre, apellido, telefono, bio, avatar_url)."""
    campos_permitidos = {"nombre", "apellido", "telefono", "bio", "avatar_url"}
    updates = {k: v for k, v in datos.items() if k in campos_permitidos}
    if not updates:
        return False
    updates["fecha_actualizacion"] = "CURRENT_TIMESTAMP"
    sets = ", ".join(
        f"{k} = CURRENT_TIMESTAMP" if v == "CURRENT_TIMESTAMP" else f"{k} = ?"
        for k, v in updates.items()
    )
    valores = [v for v in updates.values() if v != "CURRENT_TIMESTAMP"] + [id_]
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE usuarios SET {sets} WHERE id = ?", valores)
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def actualizar_password_usuario(id_: int, nuevo_hash: str) -> bool:
    """Actualiza el hash de contraseña."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE usuarios SET password_hash = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?",
            (nuevo_hash, id_),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def listar_usuarios() -> list:
    """Retorna todos los usuarios (sin password_hash)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT {_USUARIO_COLS} FROM usuarios ORDER BY fecha_creacion DESC"
        )
        return [_usuario_from_row(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def actualizar_rol_usuario(id_: int, rol: str) -> bool:
    """Cambia el rol de un usuario ('admin' o 'usuario')."""
    if rol not in ("admin", "usuario"):
        return False
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE usuarios SET rol = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?",
            (rol, id_),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def actualizar_permisos_usuario(id_: int, permisos: dict) -> bool:
    """Reemplaza los permisos de un usuario."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE usuarios SET permisos = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?",
            (json.dumps(permisos), id_),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def desactivar_usuario(id_: int) -> bool:
    """Desactiva (soft-delete) un usuario."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE usuarios SET activo = 0, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?",
            (id_,),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def contar_admins() -> int:
    """Cuenta cuántos administradores activos hay."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1")
        return cursor.fetchone()[0]
    finally:
        conn.close()


# ── Permisos Globales ──────────────────────────────────────────────────────────

def get_permisos_globales() -> dict:
    """Retorna los permisos globales (fila única en la tabla)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT crear, editar, eliminar FROM permisos_globales WHERE id = 1")
        row = cursor.fetchone()
        if row:
            return {"crear": bool(row[0]), "editar": bool(row[1]), "eliminar": bool(row[2])}
        return {"crear": False, "editar": False, "eliminar": False}
    finally:
        conn.close()


def set_permisos_globales(permisos: dict) -> None:
    """Actualiza los permisos globales."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE permisos_globales
               SET crear = ?, editar = ?, eliminar = ?, fecha_actualizacion = CURRENT_TIMESTAMP
               WHERE id = 1""",
            (
                int(bool(permisos.get("crear", False))),
                int(bool(permisos.get("editar", False))),
                int(bool(permisos.get("eliminar", False))),
            ),
        )
        conn.commit()
    finally:
        conn.close()
