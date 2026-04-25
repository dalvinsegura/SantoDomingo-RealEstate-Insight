# src/auth.py
# Utilidades JWT y decoradores de autenticación / autorización

from __future__ import annotations

import jwt
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Optional
from flask import request, jsonify

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "rei-dev-secret-change-in-production")
TOKEN_EXPIRY_DAYS = 7


# ── Generación y verificación de tokens ────────────────────────────────────────

def generate_token(user_id: int, email: str, rol: str, permisos: dict) -> str:
    """Genera un JWT firmado con los datos del usuario."""
    payload = {
        "sub": user_id,
        "email": email,
        "rol": rol,
        "permisos": permisos,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> Optional[dict]:
    """Decodifica y valida un JWT. Retorna el payload o None si es inválido."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_token_from_request() -> Optional[str]:
    """Extrae el Bearer token del header Authorization."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def get_current_user() -> Optional[dict]:
    """Devuelve el payload del token del request actual, o None."""
    token = get_token_from_request()
    if not token:
        return None
    return decode_token(token)


# ── Decoradores ─────────────────────────────────────────────────────────────────

def require_auth(f):
    """Requiere token JWT válido. Inyecta `current_user` en kwargs."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"ok": False, "error": "Autenticación requerida"}), 401
        kwargs["current_user"] = user
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """Requiere token JWT válido con rol 'admin'."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"ok": False, "error": "Autenticación requerida"}), 401
        if user.get("rol") != "admin":
            return jsonify({"ok": False, "error": "Acceso denegado: se requiere rol admin"}), 403
        kwargs["current_user"] = user
        return f(*args, **kwargs)
    return decorated


# ── Lógica de permisos ──────────────────────────────────────────────────────────

def check_permission(user: Optional[dict], accion: str, permisos_globales: dict) -> bool:
    """
    Verifica si el usuario puede realizar la acción.
    accion: 'crear' | 'editar' | 'eliminar'

    Lógica (en orden):
    1. Permiso global habilitado → cualquiera puede hacerlo
    2. Sin sesión → no puede
    3. Admin → siempre puede
    4. Permiso específico del usuario → puede
    """
    if permisos_globales.get(accion, False):
        return True
    if not user:
        return False
    if user.get("rol") == "admin":
        return True
    return bool(user.get("permisos", {}).get(accion, False))
