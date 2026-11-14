"""Opt-in integration against a real PostgreSQL server, in a disposable test-owned schema."""

import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from uuid import uuid4

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from alembic import command
from app.core import settings
from app.db import get_db
from app.main import app, limits


@pytest.mark.skipif(
    not os.getenv("ASTRA_TEST_POSTGRES_URL"),
    reason="Set ASTRA_TEST_POSTGRES_URL to test PostgreSQL",
)
def test_postgres_migration_persistence_and_concurrent_idempotency(monkeypatch):
    root_url = make_url(os.environ["ASTRA_TEST_POSTGRES_URL"])
    schema = "astra_test_" + uuid4().hex
    admin = create_engine(root_url)
    with admin.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA "{schema}"'))
    test_url = root_url.update_query_dict({"options": f"-csearch_path={schema}"})
    url_string = test_url.render_as_string(hide_password=False)
    monkeypatch.setenv("DATABASE_URL", url_string)
    settings.cache_clear()
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("script_location", str(Path(__file__).parents[1] / "alembic"))
    engine = create_engine(test_url)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with factory() as db:
            yield db

    try:
        command.upgrade(config, "head")
        app.dependency_overrides[get_db] = override
        limits.clear()
        with TestClient(app) as client:
            state = client.post("/api/sessions", json={}).json()
            path = f"/api/sessions/{state['id']}/actions"
            payload = {
                "action_id": str(uuid4()),
                "version": 0,
                "kind": "prepare",
                "equipment": ["oxygen_tank"],
            }
            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(lambda _: client.post(path, json=payload), range(2)))
            assert all(r.status_code == 200 for r in responses)
            assert responses[0].json() == responses[1].json()
            assert client.get(f"/api/sessions/{state['id']}").json()["version"] == 1
            with factory() as db:
                assert db.scalar(text("SELECT count(*) FROM mission_actions")) == 1
                assert db.scalar(text("SELECT version_num FROM alembic_version")) == "0001"
    finally:
        app.dependency_overrides.clear()
        settings.cache_clear()
        engine.dispose()
        with admin.begin() as conn:
            conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()
