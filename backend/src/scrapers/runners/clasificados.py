"""
Scraper for clasificados.com.do — real estate listings in Santo Domingo.

Structure (verified):
  - HTML is fully server-rendered; all items are in the initial response.
  - Client-side JS (List.js) handles pagination display only — no server paging needed.
  - Each listing: div.item  > strong.titulo (full text blob) + p > a[href*="buscar.aspx?se="] (sector)
  - All field data (habitaciones, baños, area, precio) is embedded in the titulo text.
  - URL pattern: /veranuncio.aspx?idClass=NNNNNN
"""
from __future__ import annotations

import re
import logging
from bs4 import BeautifulSoup, Tag

from ..base_scraper import BaseScraper

logger = logging.getLogger(__name__)

BASE_URL = "https://clasificados.com.do"

# Category IDs → property type
CATEGORIAS: dict[str, int] = {
    "Apartamento": 101,
    "Casa": 102,
    "Terreno": 104,
    "Comercio": 107,
    "Oficina": 108,
}

_PRECIO_RE = re.compile(r"(US\$|RD\$)\s*([\d,]+(?:\.\d+)?)", re.IGNORECASE)
_HAB_RE = re.compile(r"(\d+)\s*hab", re.IGNORECASE)
_BANO_RE = re.compile(r"(\d+)\s*ba[ñn]o", re.IGNORECASE)
_AREA_RE = re.compile(r"([\d,.]+)\s*[Mm][Tt]?2", re.IGNORECASE)
_SECTOR_RE = re.compile(r"\ben\s+([A-ZÁÉÍÓÚÜÑa-záéíóúüñ][^,]+)", re.IGNORECASE)


class ClasificadosScraper(BaseScraper):
    def scrape(self, max_pages: int = 1) -> list[dict]:
        """max_pages is unused — all items load server-side on one request per category."""
        results: list[dict] = []
        for tipo, cat_id in CATEGORIAS.items():
            url = f"{BASE_URL}/buscar.aspx?ca={cat_id}"
            html = self.fetch(url)
            if html is None:
                logger.warning(f"No response for category {tipo} (ca={cat_id})")
                continue
            items = self._parse_page(html, tipo)
            logger.info(f"clasificados [{tipo}]: {len(items)} listings")
            results.extend(items)
        return results

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_page(self, html: str, tipo_default: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        items = []
        # Real structure: li.product-item inside ul#ContentPlaceHolder1_DivResultados
        for card in soup.select("li.product-item"):
            item = self._parse_card(card, tipo_default)
            if item:
                items.append(item)
        return items

    def _parse_card(self, card: Tag, tipo_default: str) -> dict | None:
        # Title is in <a class="titulo">, not <strong>
        titulo_el = card.select_one("a.titulo")
        if not titulo_el:
            return None
        titulo_text = titulo_el.get_text(strip=True)

        # Only include Santo Domingo / Distrito Nacional listings
        texto_lower = titulo_text.lower()
        if "santo domingo" not in texto_lower and "distrito nacional" not in texto_lower:
            return None

        # Listing URL (use href from titulo link — most reliable)
        href = titulo_el.get("href", "")
        url_fuente = f"{BASE_URL}/{href}" if href else ""

        # Sector from dedicated link (most reliable source)
        sector_el = card.select_one('a[href*="buscar.aspx?se="]')
        ubicacion = sector_el.get_text(strip=True) if sector_el else self._sector_from_titulo(titulo_text)

        # Operation type
        tipo_operacion = (
            "alquiler"
            if re.search(r"\b(alquil[ao]|renta|alquiler)\b", titulo_text, re.IGNORECASE)
            else "venta"
        )

        # Prefer the dedicated price span; fall back to parsing the title text
        price_el = card.select_one("span.price")
        precio, moneda = self._parse_precio(
            price_el.get_text(strip=True) if price_el else titulo_text
        )
        # If span.price didn't have currency marker, also try the title
        if precio is None:
            precio, moneda = self._parse_precio(titulo_text)

        hab_m = _HAB_RE.search(titulo_text)
        bano_m = _BANO_RE.search(titulo_text)
        area_m = _AREA_RE.search(titulo_text)

        return {
            "fuente": "clasificados",
            "titulo": titulo_text[:200],
            "precio": precio,
            "moneda": moneda,
            "ubicacion": ubicacion,
            "tipo": tipo_default,
            "tipo_operacion": tipo_operacion,
            "habitaciones": int(hab_m.group(1)) if hab_m else None,
            "banos": int(bano_m.group(1)) if bano_m else None,
            "area": float(area_m.group(1).replace(",", "")) if area_m else None,
            "url_fuente": url_fuente,
            "descripcion": "",
            "caracteristicas": [],
            "contacto": {},
        }

    def _parse_precio(self, text: str) -> tuple[float | None, str]:
        m = _PRECIO_RE.search(text)
        if not m:
            return None, "USD"
        moneda = "USD" if "US" in m.group(1).upper() else "DOP"
        precio = float(m.group(2).replace(",", ""))
        return precio, moneda

    def _sector_from_titulo(self, titulo: str) -> str:
        """Fallback: extract 'en X' from title text."""
        m = _SECTOR_RE.search(titulo)
        return m.group(1).strip() if m else "Santo Domingo"
