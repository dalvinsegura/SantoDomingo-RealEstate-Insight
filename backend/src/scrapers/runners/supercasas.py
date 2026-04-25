"""
Scraper for supercasas.com — real estate listings in Santo Domingo.

Structure (verified):
  - HTML is server-rendered; listings are in the initial response.
  - Pagination: ?location=santo-domingo&PagingPageSkip=N (N = 0-based page index, 24 items/page)
  - Each listing: li > a[href]  — no CSS classes on fields; all data as plain text nodes.
  - URL pattern: /tipo-operacion-sector/id/  (encodes type, operation, sector, and unique ID)
  - Fields extracted via text parsing (regex on line-separated content)
"""
from __future__ import annotations

import re
import logging
from bs4 import BeautifulSoup, Tag

from ..base_scraper import BaseScraper

logger = logging.getLogger(__name__)

BASE_URL = "https://www.supercasas.com"
SEARCH_URL = f"{BASE_URL}/buscar"

# Map URL slug tipo (plural) → canonical tipo
_TIPO_SLUG: dict[str, str] = {
    "apartamentos": "Apartamento",
    "apartamento": "Apartamento",
    "casas": "Casa",
    "casa": "Casa",
    "villas": "Villa",
    "villa": "Villa",
    "terrenos": "Terreno",
    "terreno": "Terreno",
    "solares": "Terreno",
    "solar": "Terreno",
    "locales": "Comercio",
    "local": "Comercio",
    "comercios": "Comercio",
    "comercio": "Comercio",
    "oficinas": "Oficina",
    "oficina": "Oficina",
    "penthouses": "Penthouse",
    "penthouse": "Penthouse",
    "edificios": "Comercio",
    "edificio": "Comercio",
}

_PRECIO_RE = re.compile(r"(US\$|RD\$)\s*([\d,]+)", re.IGNORECASE)
_HAB_RE = re.compile(r"Habitaciones?:\s*(\d+)", re.IGNORECASE)
_BANO_RE = re.compile(r"Ba[ñn]os?:\s*([\d.]+)", re.IGNORECASE)
_AREA_RE = re.compile(r"Construcci[oó]n:\s*([\d,.]+)", re.IGNORECASE)


class SuperCasasScraper(BaseScraper):
    def scrape(self, max_pages: int = 10) -> list[dict]:
        results: list[dict] = []
        for page in range(max_pages):
            url = f"{SEARCH_URL}?location=santo-domingo&PagingPageSkip={page}"
            html = self.fetch(url)
            if html is None:
                break
            items = self._parse_page(html)
            if not items:
                logger.info(f"supercasas: no items on page {page}, stopping")
                break
            logger.info(f"supercasas page {page}: {len(items)} listings")
            results.extend(items)
        return results

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_page(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        items = []
        # Real structure: li.special[data-id] — verified from live HTML
        for card in soup.select("li.special[data-id]"):
            item = self._parse_card(card)
            if item:
                items.append(item)
        return items

    def _parse_card(self, card: Tag) -> dict | None:
        # URL from the <a> inside the card
        a_tag = card.select_one("a[href]")
        if not a_tag:
            return None
        href = a_tag.get("href", "")
        if not href or not re.search(r"/\d+/$", href):
            return None

        tipo, tipo_operacion, sector_slug = self._parse_slug(href)
        url_fuente = BASE_URL + href

        # Type, location, price from dedicated divs
        type_el = card.select_one("div.type")
        loc_el = card.select_one("div.title1")
        price_el = card.select_one("div.title2")

        tipo_text = type_el.get_text(strip=True) if type_el else ""
        tipo = _TIPO_SLUG.get(tipo_text.lower(), tipo)  # override slug-based tipo if div.type is present

        ubicacion = loc_el.get_text(strip=True) if loc_el else sector_slug.replace("-", " ").title()
        precio_text = price_el.get_text(strip=True) if price_el else ""
        precio, moneda = self._parse_precio(precio_text)

        # Fields from <section> labels: Habitaciones, Baños, Parqueos, Construcción
        section_text = ""
        section = card.select_one("section")
        if section:
            section_text = section.get_text(separator=" ", strip=True)

        hab_m = _HAB_RE.search(section_text)
        bano_m = _BANO_RE.search(section_text)
        area_m = _AREA_RE.search(section_text)

        titulo = f"{tipo} en {ubicacion}"

        return {
            "fuente": "supercasas",
            "titulo": titulo[:200],
            "precio": precio,
            "moneda": moneda,
            "ubicacion": ubicacion,
            "tipo": tipo,
            "tipo_operacion": tipo_operacion,
            "habitaciones": int(hab_m.group(1)) if hab_m else None,
            "banos": int(float(bano_m.group(1))) if bano_m else None,
            "area": float(area_m.group(1).replace(",", "")) if area_m else None,
            "url_fuente": url_fuente,
            "descripcion": "",
            "caracteristicas": [],
            "contacto": {},
        }

    def _parse_slug(self, href: str) -> tuple[str, str, str]:
        """
        Parse /tipo-operacion-sector/id/ into (tipo, operacion, sector_slug).
        Example: /apartamentos-venta-arroyo-hondo-viejo/1423196/ →
                 ("Apartamento", "venta", "arroyo-hondo-viejo")
        """
        for op in ("alquiler", "venta"):
            pattern = f"-{op}-"
            if pattern in href:
                before, after = href.split(pattern, 1)
                tipo_slug = before.lstrip("/")
                tipo = _TIPO_SLUG.get(tipo_slug, "Apartamento")
                sector_slug = re.sub(r"/\d+/$", "", after).rstrip("/")
                return tipo, op, sector_slug
        return "Apartamento", "venta", ""

    def _parse_precio(self, text: str) -> tuple[float | None, str]:
        m = _PRECIO_RE.search(text)
        if not m:
            return None, "USD"
        moneda = "USD" if "US" in m.group(1).upper() else "DOP"
        precio = float(m.group(2).replace(",", ""))
        return precio, moneda
