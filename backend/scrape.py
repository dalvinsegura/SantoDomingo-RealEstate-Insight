#!/usr/bin/env python3
"""
CLI runner for real estate scrapers.

Usage (always run from backend/):
    cd backend
    source venv/bin/activate
    python scrape.py                          # all sources, 10 pages supercasas
    python scrape.py --source supercasas --pages 20
    python scrape.py --source clasificados
    python scrape.py --dry-run                # preview without saving
    python scrape.py -v                       # verbose logging
"""

import os
import sys
import argparse
import logging

# Resolve src/ as an absolute path before chdir, so sys.path stays valid after chdir.
_SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
sys.path.insert(0, _SRC)
os.chdir(_SRC)

from scrapers.runners.clasificados import ClasificadosScraper
from scrapers.runners.supercasas import SuperCasasScraper
from scrapers.pipeline.normalizer import normalizar
from database.crud import bulk_upsert_scraped
from database.db_config import migrate_scraping_columns


def setup_logging(verbose: bool = False) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s - %(message)s",
    )


def run(source: str = "all", max_pages: int = 10, dry_run: bool = False) -> None:
    migrate_scraping_columns()

    scrapers = []
    if source in ("all", "clasificados"):
        scrapers.append(ClasificadosScraper())
    if source in ("all", "supercasas"):
        scrapers.append(SuperCasasScraper())

    total_scraped = total_new = total_invalid = total_dup = 0

    for scraper in scrapers:
        name = scraper.__class__.__name__
        print(f"\n--- {name} ---")
        with scraper:
            raw_items = scraper.scrape(max_pages=max_pages)

        normalized_items = []
        for raw in raw_items:
            total_scraped += 1
            normalized = normalizar(raw)
            if normalized is None:
                total_invalid += 1
            else:
                normalized_items.append(normalized)

        if dry_run:
            total_new += len(normalized_items)
        else:
            new_c, dup_c = bulk_upsert_scraped(normalized_items)
            total_new += new_c
            total_dup += dup_c

    mode = "[DRY RUN] " if dry_run else ""
    print(f"\n{mode}Resultados:")
    print(f"  Scraped total : {total_scraped}")
    print(f"  Inválidos     : {total_invalid}")
    print(f"  {'Insertarían' if dry_run else 'Nuevos en DB'} : {total_new}")
    if not dry_run:
        print(f"  Duplicados    : {total_dup}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scraper de inmuebles — Santo Domingo, RD")
    parser.add_argument(
        "--source",
        choices=["all", "clasificados", "supercasas"],
        default="all",
        help="Fuente a scrapear (default: all)",
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=10,
        help="Páginas máximas para SuperCasas (24 listings/página, default: 10 ≈ 240 propiedades)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mostrar resultados sin guardar en la DB",
    )
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    setup_logging(args.verbose)
    run(source=args.source, max_pages=args.pages, dry_run=args.dry_run)
