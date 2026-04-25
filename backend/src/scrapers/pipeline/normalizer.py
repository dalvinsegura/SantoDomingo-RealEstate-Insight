"""
Normalization pipeline: takes raw scraped dicts and returns DB-ready dicts.

Both scrapers produce dicts with these keys (some may be None):
  fuente, titulo, precio, moneda, ubicacion, tipo, tipo_operacion,
  habitaciones, banos, area, url_fuente, descripcion, caracteristicas, contacto
"""
from __future__ import annotations

import unicodedata
import logging

logger = logging.getLogger(__name__)

# Approximate DOP → USD rate. Update periodically.
TASA_DOP_USD = 59.0

TIPOS_VALIDOS = {"Casa", "Apartamento", "Villa", "Comercio", "Terreno", "Penthouse", "Oficina"}

# Canonical sector names keyed by normalized (accent-stripped, lowercase, hyphens→spaces) form.
SECTORES: dict[str, str] = {
    "piantini": "Piantini",
    "naco": "Ensanche Naco",
    "ensanche naco": "Ensanche Naco",
    "naco ii": "Ensanche Naco",
    "evaristo morales": "Evaristo Morales",
    "evaristo": "Evaristo Morales",
    "serralles": "Serrallés",
    "serrallés": "Serrallés",
    "los cacicazgos": "Los Cacicazgos",
    "cacicazgos": "Los Cacicazgos",
    "bella vista": "Bella Vista",
    "mirador sur": "Mirador Sur",
    "mirador norte": "Mirador Norte",
    "la esperilla": "La Esperilla",
    "esperilla": "La Esperilla",
    "arroyo hondo": "Arroyo Hondo",
    "arroyo hondo viejo": "Arroyo Hondo Viejo",
    "los prados": "Los Prados",
    "gazcue": "Gazcue",
    "ciudad nueva": "Ciudad Nueva",
    "miraflores": "Miraflores",
    "urbanizacion real": "Urbanización Real",
    "urb real": "Urbanización Real",
    "ensanche fernandez": "Ensanche Fernández",
    "ensanche fernández": "Ensanche Fernández",
    "fernandez": "Ensanche Fernández",
    "alma rosa": "Alma Rosa",
    "alma rosa i": "Alma Rosa I",
    "alma rosa ii": "Alma Rosa II",
    "los rios": "Los Ríos",
    "los ríos": "Los Ríos",
    "el millon": "El Millón",
    "el millón": "El Millón",
    "quisqueya": "Quisqueya",
    "jardines del norte": "Jardines del Norte",
    "los jardines del sur": "Los Jardines del Sur",
    "jardines del sur": "Los Jardines del Sur",
    "las mercedes": "Las Mercedes",
    "san isidro": "San Isidro",
    "villa mella": "Villa Mella",
    "los alcarrizos": "Los Alcarrizos",
    "alcarrizos": "Los Alcarrizos",
    "herrera": "Herrera",
    "los mameyes": "Los Mameyes",
    "mameyes": "Los Mameyes",
    "ensanche ozama": "Ensanche Ozama",
    "zona colonial": "Zona Colonial",
    "ciudad colonial": "Zona Colonial",
    "boca chica": "Boca Chica",
    "autopista las americas": "Autopista Las Américas",
    "autopista las américas": "Autopista Las Américas",
    "renacimiento": "Renacimiento",
    "paraiso": "Paraíso",
    "el paraiso": "El Paraíso",
    "la julia": "La Julia",
    "cristo rey": "Cristo Rey",
    "simon bolivar": "Simón Bolívar",
    "los restauradores": "Los Restauradores",
    "el vergel": "El Vergel",
    "vergel": "El Vergel",
    "centro olimpico": "Centro Olímpico",
    "la romana": "La Romana",
    "manoguayabo": "Manoguayabo",
    "la zurza": "La Zurza",
}


def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def normalizar_sector(sector_raw: str) -> str:
    if not sector_raw:
        return "Santo Domingo"
    key = _strip_accents(sector_raw.lower().strip()).replace("-", " ")
    # Direct match
    if key in SECTORES:
        return SECTORES[key]
    # Partial match (longer key contains our input or vice-versa)
    for k, canonical in SECTORES.items():
        if k in key or key in k:
            return canonical
    return sector_raw.strip().title()


def normalizar(raw: dict) -> dict | None:
    """
    Validates and normalizes a raw scraped dict into a DB-ready dict.
    Returns None if the listing is invalid.
    """
    precio = raw.get("precio")
    if not precio or precio <= 0:
        logger.debug(f"skip: no price — {raw.get('url_fuente')}")
        return None

    moneda = raw.get("moneda", "USD")
    precio_usd = round(precio / TASA_DOP_USD, 2) if moneda == "DOP" else float(precio)

    # Sanity check — different thresholds for sale vs rental
    tipo_op = raw.get("tipo_operacion", "venta")
    if tipo_op == "alquiler":
        valid_range = (100, 50_000)       # monthly rent in USD
    else:
        valid_range = (5_000, 50_000_000) # sale price in USD
    if not (valid_range[0] <= precio_usd <= valid_range[1]):
        logger.debug(f"skip: price out of range ({precio_usd}, {tipo_op}) — {raw.get('url_fuente')}")
        return None

    tipo = raw.get("tipo", "Apartamento")
    if tipo not in TIPOS_VALIDOS:
        tipo = "Apartamento"

    sector_normalizado = normalizar_sector(raw.get("ubicacion", ""))
    area = raw.get("area")
    precio_m2 = round(precio_usd / area, 2) if area and area > 0 else None

    return {
        "titulo": raw.get("titulo", f"{tipo} en {sector_normalizado}")[:200],
        "descripcion": raw.get("descripcion", ""),
        "precio": precio_usd,
        "moneda": "USD",
        "ubicacion": sector_normalizado,
        "tipo": tipo,
        "tipo_operacion": raw.get("tipo_operacion", "venta"),
        "habitaciones": raw.get("habitaciones"),
        "banos": raw.get("banos"),
        "area": area,
        "precio_m2": precio_m2,
        "sector_normalizado": sector_normalizado,
        "url_fuente": raw.get("url_fuente", ""),
        "fuente": raw.get("fuente", ""),
        "caracteristicas": raw.get("caracteristicas", []),
        "contacto": raw.get("contacto", {}),
        "lat": None,
        "lng": None,
    }
