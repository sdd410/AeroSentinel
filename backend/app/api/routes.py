import asyncio
import json
from typing import Dict, Any, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from ..schemas.models import (
    MasterConfig,
    SimulationSnapshot,
    CoverageMetrics,
    Alert,
    SimulationState,
)
from ..simulation.engine import SimulationEngine
from ..config.presets import get_default_presets

router = APIRouter()

# Authoritative simulation instance
engine = SimulationEngine()
active_connections: List[WebSocket] = []
simulation_task: asyncio.Task = None


@router.get("/health")
async def health_check():
    return {"status": "ok", "app": "AeroSentinel", "state": engine.state}


@router.get("/config/defaults", response_model=MasterConfig)
async def get_default_config():
    return MasterConfig()


@router.get("/presets")
async def list_presets() -> Dict[str, MasterConfig]:
    return get_default_presets()


@router.post("/simulation/start")
async def start_sim():
    engine.start()
    return {"message": "Simulation started", "state": engine.state}


@router.post("/simulation/pause")
async def pause_sim():
    engine.pause()
    return {"message": "Simulation paused", "state": engine.state}


@router.post("/simulation/resume")
async def resume_sim():
    engine.resume()
    return {"message": "Simulation resumed", "state": engine.state}


@router.post("/simulation/reset")
async def reset_sim():
    engine.reset()
    return {"message": "Simulation reset", "state": engine.state}


@router.post("/simulation/step")
async def step_sim():
    engine.step()
    return engine.get_snapshot()


@router.get("/simulation/state", response_model=SimulationSnapshot)
async def get_simulation_state():
    return engine.get_snapshot()


@router.patch("/simulation/config", response_model=MasterConfig)
async def update_config(config: MasterConfig):
    engine.update_config(config)
    return engine.config


@router.get("/simulation/metrics", response_model=CoverageMetrics)
async def get_metrics():
    return engine.get_snapshot().metrics


@router.get("/simulation/events", response_model=List[Alert])
async def get_events():
    return engine.events.get_recent(100)


@router.post("/simulation/events/{alert_id}/ack")
async def acknowledge_alert(alert_id: str):
    success = engine.events.acknowledge(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged", "id": alert_id}


async def simulation_loop():
    """Background async simulation ticker running at fixed rate."""
    while True:
        try:
            if engine.state == SimulationState.RUNNING:
                dt = engine.config.settings.time_step
                speed = engine.config.settings.simulation_speed
                engine.tick(dt * speed)

                # Broadcast to connected WebSockets
                if active_connections:
                    snapshot = engine.get_snapshot()
                    data = snapshot.model_dump_json()
                    disconnected = []
                    for ws in active_connections:
                        try:
                            await ws.send_text(data)
                        except Exception:
                            disconnected.append(ws)
                    for dead_ws in disconnected:
                        if dead_ws in active_connections:
                            active_connections.remove(dead_ws)

            # 20 Hz base rate with dynamic speed
            base_sleep = 0.05
            await asyncio.sleep(base_sleep)
        except asyncio.CancelledError:
            break
        except Exception as e:
            await asyncio.sleep(0.1)


@router.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        # Send initial snapshot immediately
        snapshot = engine.get_snapshot()
        await websocket.send_text(snapshot.model_dump_json())

        while True:
            # Client commands over WebSocket
            text = await websocket.receive_text()
            cmd = json.loads(text)
            action = cmd.get("action")
            if action == "start":
                engine.start()
            elif action == "pause":
                engine.pause()
            elif action == "resume":
                engine.resume()
            elif action == "reset":
                engine.reset()
            elif action == "step":
                engine.step()
                await websocket.send_text(engine.get_snapshot().model_dump_json())
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)
