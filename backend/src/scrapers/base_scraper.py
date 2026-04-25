"""Base scraper with rate-limited HTTP fetching."""
from __future__ import annotations

import time
import random
import logging
from abc import ABC, abstractmethod

import httpx

_USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]


class BaseScraper(ABC):
    def __init__(self, delay_min: float = 2.0, delay_max: float = 5.0):
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.logger = logging.getLogger(self.__class__.__name__)
        self.client = httpx.Client(
            headers={"User-Agent": random.choice(_USER_AGENTS)},
            follow_redirects=True,
            timeout=30.0,
        )

    def fetch(self, url: str) -> str | None:
        """Fetch URL with rate limiting. Returns HTML text or None on error."""
        try:
            resp = self.client.get(url)
            resp.raise_for_status()
            time.sleep(random.uniform(self.delay_min, self.delay_max))
            return resp.text
        except Exception as exc:
            self.logger.warning(f"fetch failed [{url}]: {exc}")
            return None

    @abstractmethod
    def scrape(self, max_pages: int = 10) -> list[dict]:
        """Run the scraper. Returns list of raw property dicts."""

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.client.close()
