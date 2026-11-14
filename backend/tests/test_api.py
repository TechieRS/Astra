from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import httpx
import pytest

from app.core import settings
from app.nasa import NasaService


def create(client):
    response = client.post("/api/sessions", json={"callsign": "Explorer"})
    assert response.status_code == 201
    return response.json()


def send(client, state, kind, **extra):
    return client.post(
        f"/api/sessions/{state['id']}/actions",
        json={"action_id": str(uuid4()), "version": state["version"], "kind": kind, **extra},
    )


def test_health_catalog_and_openapi(client):
    assert client.get("/api/health").json()["status"] == "ok"
    assert len(client.get("/api/missions").json()) == 1
    assert client.get("/api/missions/lunar-outpost").json()["map"]["width"] == 16
    assert client.get("/api/missions/missing").status_code == 404
    assert client.get("/openapi.json").status_code == 200


def test_persistence_and_duplicates(client):
    state = create(client)
    payload = {
        "action_id": str(uuid4()),
        "version": 0,
        "kind": "prepare",
        "equipment": ["oxygen_tank"],
    }
    path = f"/api/sessions/{state['id']}/actions"
    first = client.post(path, json=payload)
    retry = client.post(path, json=payload)
    assert first.status_code == 200 and first.json() == retry.json()
    assert client.get(f"/api/sessions/{state['id']}").json()["version"] == 1
    assert len(client.get(f"/api/sessions/{state['id']}/events").json()) == 1
    payload["equipment"] = []
    assert client.post(path, json=payload).status_code == 409


def test_stale_version_and_invalid_commands(client):
    state = create(client)
    assert send(client, state, "launch").status_code == 422
    prepared = send(client, state, "prepare").json()
    assert send(client, state, "launch").status_code == 409
    assert send(client, prepared, "move", x=-1, y=4).status_code == 422
    assert client.get(f"/api/sessions/{state['id']}").json()["status"] == "PREPARATION"


def test_concurrent_requests_apply_at_most_once(client):
    state = create(client)
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: send(client, state, "prepare"), range(2)))
    assert sorted(r.status_code for r in responses) == [200, 409]
    assert client.get(f"/api/sessions/{state['id']}").json()["version"] == 1


def test_full_persisted_mission_and_report(client):
    state = create(client)
    assert client.get(f"/api/sessions/{state['id']}/report").status_code == 422
    for kind, extra in [
        ("prepare", {"equipment": ["oxygen_tank", "solar_tools"]}),
        ("launch", {}),
        ("inspect", {}),
        ("travel", {"target": "solar"}),
        ("repair", {}),
        ("travel", {"target": "ridge"}),
        ("sample", {"target": "ridge"}),
        ("travel", {"target": "crater"}),
        ("sample", {"target": "crater"}),
        ("travel", {"target": "habitat"}),
        ("return", {}),
    ]:
        response = send(client, state, kind, **extra)
        assert response.status_code == 200, response.text
        state = response.json()
    report = client.get(f"/api/sessions/{state['id']}/report").json()
    assert report["outcome"] == "excellent" and report["samples"] == 2
    assert "Power engineer" in report["badges"]
    assert send(client, state, "wait").status_code == 422


def test_oversized_requests_and_input_validation(client):
    assert client.post("/api/sessions", content="a" * 9000).status_code == 413
    assert client.post("/api/sessions", json={"callsign": "real name"}).status_code == 422
    assert (
        client.post("/api/sessions", json={"callsign": "Explorer", "oxygen": 999}).status_code
        == 422
    )
    assert client.get("/api/sessions/unknown").status_code == 404


def test_cors_and_security_headers(client):
    response = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in response.headers
    assert response.headers["x-content-type-options"] == "nosniff"
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    response = client.post(
        "/api/sessions", content="a" * 9000, headers={"Origin": "http://localhost:5173"}
    )
    assert response.status_code == 413
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_rate_limits_are_bounded(client):
    for _ in range(180):
        response = client.post("/api/education/explain", json={"topic": "oxygen"})
        assert response.status_code == 200
    assert client.post("/api/education/explain", json={"topic": "oxygen"}).status_code == 429


def test_nasa_offline_and_science_guide(client):
    sources = client.get("/api/nasa/sources").json()
    assert len(sources["sources"]) == 5
    assert all(s["url"].startswith("https://") and s["retrieved_at"] for s in sources["sources"])
    result = client.get("/api/nasa/images").json()
    assert result["mode"] == "offline_reference" and result["items"][0]["nasa_id"] == "PIA13523"
    assert result["items"][0]["thumbnail"].startswith("https://images-assets.nasa.gov")
    assert (
        client.post("/api/education/explain", json={"topic": "radiation"}).json()["mode"]
        == "deterministic"
    )


@pytest.mark.parametrize("failure", ["timeout", "schema", "http"])
def test_nasa_failure_fallback(monkeypatch, failure):
    monkeypatch.setattr(settings(), "enable_nasa_network", True)

    def fail(*args, **kwargs):
        if failure == "timeout":
            raise httpx.TimeoutException("offline")
        if failure == "http":
            return httpx.Response(503, request=httpx.Request("GET", "https://images-api.nasa.gov"))
        return httpx.Response(
            200, json={"oops": []}, request=httpx.Request("GET", "https://images-api.nasa.gov")
        )

    monkeypatch.setattr(httpx, "get", fail)
    assert NasaService().images()["mode"] == "offline_reference"


def test_validated_nasa_cache(monkeypatch):
    monkeypatch.setattr(settings(), "enable_nasa_network", True)
    calls = []

    def fetch(*args, **kwargs):
        calls.append(1)
        return httpx.Response(
            200,
            json={
                "collection": {
                    "items": [
                        {
                            "data": [
                                {
                                    "nasa_id": "TEST",
                                    "title": "Historical moon",
                                    "date_created": "2010-01-01",
                                    "center": "NASA",
                                }
                            ],
                            "links": [
                                {"href": "https://images-assets.nasa.gov/image/test/test.jpg"}
                            ],
                        }
                    ]
                }
            },
            request=httpx.Request("GET", "https://images-api.nasa.gov"),
        )

    monkeypatch.setattr(httpx, "get", fetch)
    service = NasaService()
    first = service.images()
    assert first["mode"] == "nasa_api" and first == service.images()
    assert len(calls) == 1
