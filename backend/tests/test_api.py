import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_api_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["app"] == "AeroSentinel"


@pytest.mark.asyncio
async def test_api_presets():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/presets")
        assert resp.status_code == 200
        presets = resp.json()
        assert "Urban Block Surveillance" in presets
        assert "Small Area Patrol" in presets
        assert "Wide Area Coverage" in presets


@pytest.mark.asyncio
async def test_api_simulation_controls():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Start
        resp = await client.post("/api/simulation/start")
        assert resp.status_code == 200
        assert resp.json()["state"] == "running"

        # Step
        resp = await client.post("/api/simulation/step")
        assert resp.status_code == 200
        snapshot = resp.json()
        assert snapshot["tick"] >= 1

        # Pause
        resp = await client.post("/api/simulation/pause")
        assert resp.status_code == 200
        assert resp.json()["state"] == "paused"

        # Reset
        resp = await client.post("/api/simulation/reset")
        assert resp.status_code == 200
        assert resp.json()["state"] == "stopped"


@pytest.mark.asyncio
async def test_api_state_and_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/simulation/state")
        assert resp.status_code == 200
        snapshot = resp.json()
        assert "drones" in snapshot
        assert "metrics" in snapshot

        resp_metrics = await client.get("/api/simulation/metrics")
        assert resp_metrics.status_code == 200
        assert "coverage_percentage" in resp_metrics.json()
