# src/ai_search.py
# Asistente de búsqueda en lenguaje natural usando DeepSeek

import json
import os
from typing import Optional
from openai import OpenAI

DEEPSEEK_BASE_URL = "https://api.deepseek.com"
MODEL = "deepseek-chat"

SYSTEM_PROMPT = """
Eres un asistente de búsqueda de bienes raíces en Santo Domingo, República Dominicana.
Tu única tarea es extraer filtros de búsqueda de un texto en lenguaje natural y devolverlos
como un objeto JSON. No expliques nada, no saludes, solo responde con el JSON.

Tipos válidos de inmueble: Casa, Apartamento, Villa, Comercio, Terreno, Penthouse, Oficina
Tipos de operación: venta, alquiler

Responde SIEMPRE con este esquema JSON (omite los campos que no apliquen):
{
  "tipo": "string | null",
  "ubicacion": "string | null",
  "habitaciones": "number | null",
  "precio_min": "number | null",
  "precio_max": "number | null",
  "tipo_operacion": "venta | alquiler | null",
  "resumen": "string (explica en 1 línea qué está buscando el usuario)"
}

Reglas:
- Los precios siempre en USD. Si el usuario dice "millones" asume pesos (DOP) y convierte (1 USD ≈ 60 DOP).
- Si dice "menos de X" → precio_max = X. Si dice "más de X" → precio_min = X.
- Si dice "alquiler" o "renta" → tipo_operacion = "alquiler".
- Si no menciona tipo de operación → tipo_operacion = null.
- Nunca inventes datos. Si algo no está claro, déjalo null.
""".strip()


def extraer_filtros(query: str) -> dict:
    """
    Llama a DeepSeek para extraer filtros de búsqueda de una consulta en lenguaje natural.
    Retorna un dict con los filtros y un campo 'resumen'.
    Lanza ValueError si la API key no está configurada.
    """
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key or api_key == "your-deepseek-api-key-here":
        raise ValueError("DEEPSEEK_API_KEY no configurada en el archivo .env")

    client = OpenAI(api_key=api_key, base_url=DEEPSEEK_BASE_URL)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        temperature=0,
        max_tokens=256,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    filtros = json.loads(raw)

    # Normalizar tipos y sanear valores
    resultado = {
        "tipo":          filtros.get("tipo") or None,
        "ubicacion":     filtros.get("ubicacion") or None,
        "habitaciones":  _to_int(filtros.get("habitaciones")),
        "precio_min":    _to_float(filtros.get("precio_min")),
        "precio_max":    _to_float(filtros.get("precio_max")),
        "tipo_operacion": filtros.get("tipo_operacion") or None,
        "resumen":       filtros.get("resumen", "Búsqueda procesada"),
    }
    return resultado


def _to_int(val) -> Optional[int]:
    try:
        return int(val) if val is not None else None
    except (TypeError, ValueError):
        return None


def _to_float(val) -> Optional[float]:
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None
