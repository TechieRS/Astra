import json
import logging
import threading
from datetime import UTC, datetime
from pathlib import Path
from time import monotonic

import httpx
from pydantic import BaseModel, HttpUrl, ValidationError

from app.core import settings

logger = logging.getLogger("astra.nasa")
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "scientific-references" / "sources.json"


def catalog():
    return json.loads(DATA_PATH.read_text())


class NasaMedia(BaseModel):
    nasa_id: str
    title: str
    catalog_date: str
    thumbnail: HttpUrl
    credit: str


class NasaService:
    def __init__(self):
        self.cached = None
        self.expires = 0
        self.lock = threading.Lock()

    def images(self):
        with self.lock:
            return self._images()

    def _images(self):
        if self.cached is not None and monotonic() < self.expires:
            return self.cached
        if not settings().enable_nasa_network:
            return self.fallback(
                "Network enrichment is disabled. Bundled NASA references remain available."
            )
        try:
            response = httpx.get(
                settings().nasa_images_url,
                params={"q": "lunar south pole", "media_type": "image", "page_size": 6},
                timeout=5,
                follow_redirects=False,
            )
            response.raise_for_status()
            payload = response.json()
            media = []
            for item in payload["collection"]["items"][:6]:
                datum = item["data"][0]
                thumbnail = item["links"][0]["href"]
                if not thumbnail.startswith("https://images-assets.nasa.gov/"):
                    continue
                media.append(
                    NasaMedia(
                        nasa_id=datum["nasa_id"],
                        title=datum["title"],
                        catalog_date=datum["date_created"],
                        thumbnail=thumbnail,
                        credit=datum.get(
                            "secondary_creator",
                            datum.get("photographer", datum.get("center", "NASA")),
                        ),
                    ).model_dump(mode="json")
                )
            if not media:
                raise ValueError("No validated image records returned")
            result = {
                "mode": "nasa_api",
                "retrieved_at": datetime.now(UTC).isoformat(),
                "observation_date": None,
                "items": media,
                "note": "NASA media catalog. Catalog dates are not observation dates; no live lunar or weather measurements.",
            }
            self.cached = result
            self.expires = monotonic() + settings().nasa_cache_seconds
            return result
        except (
            httpx.HTTPError,
            ValueError,
            KeyError,
            IndexError,
            TypeError,
            ValidationError,
        ) as exc:
            logger.warning("NASA enrichment unavailable", extra={"error_type": type(exc).__name__})
            result = self.fallback(
                "NASA media is unavailable. Using the bundled, attributed reference catalog."
            )
            self.cached = result
            self.expires = monotonic() + 60
            return result

    @staticmethod
    def fallback(note):
        source = next((s for s in catalog()["sources"] if s["id"] == "nasa-image-library"), {})
        sample = source.get("media_sample")
        item = (
            {
                "nasa_id": sample["nasa_id"],
                "title": sample["title"],
                "catalog_date": sample["catalog_date_created"],
                "thumbnail": sample["thumbnail_url"],
                "credit": sample["credit"],
            }
            if sample
            else None
        )
        return {
            "mode": "offline_reference",
            "retrieved_at": catalog()["retrieved_at"],
            "observation_date": None,
            "items": [item] if item else [],
            "note": note,
        }


nasa_service = NasaService()
