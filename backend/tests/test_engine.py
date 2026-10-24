import pytest
from app.simulation.engine import SimulationEngine
from app.schemas.models import SimulationState, MasterConfig


def test_engine_initialization():
    engine = SimulationEngine()
    assert engine.state == SimulationState.STOPPED
    assert engine.elapsed_time == 0.0
    assert len(engine.drones) == 8
    snapshot = engine.get_snapshot()
    assert snapshot.state == SimulationState.STOPPED
    assert len(snapshot.drones) == 8


def test_engine_lifecycle_and_stepping():
    engine = SimulationEngine()
    engine.start()
    assert engine.state == SimulationState.RUNNING

    # Step simulation
    initial_battery = engine.drones[0].battery
    engine.step()
    assert engine.elapsed_time > 0.0
    assert engine.tick_count == 1
    assert engine.drones[0].battery <= initial_battery

    engine.pause()
    assert engine.state == SimulationState.PAUSED

    engine.resume()
    assert engine.state == SimulationState.RUNNING

    engine.reset()
    assert engine.state == SimulationState.STOPPED
    assert engine.elapsed_time == 0.0
    assert engine.tick_count == 0


def test_deterministic_execution():
    config = MasterConfig()
    config.settings.random_seed = 12345

    engine1 = SimulationEngine(config)
    engine2 = SimulationEngine(config)

    engine1.start()
    engine2.start()

    for _ in range(20):
        engine1.step()
        engine2.step()

    snap1 = engine1.get_snapshot()
    snap2 = engine2.get_snapshot()

    assert snap1.tick == snap2.tick
    assert round(snap1.elapsed_time, 3) == round(snap2.elapsed_time, 3)
    for d1, d2 in zip(snap1.drones, snap2.drones):
        assert d1.x == d2.x
        assert d1.y == d2.y
        assert d1.battery == d2.battery
