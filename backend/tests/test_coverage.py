import pytest
import math
from app.simulation.environment import Environment
from app.simulation.coverage import CoverageManager
from app.schemas.models import EnvironmentConfig


def test_coverage_accumulation():
    config = EnvironmentConfig(width=400, height=400, grid_cell_size=20)
    env = Environment(config)
    mgr = CoverageManager(env)

    initial_pct = mgr.get_coverage_percentage()
    assert initial_pct == 0.0

    # Drone records coverage at center facing East
    new_cells = mgr.record_coverage(
        drone_x=200,
        drone_y=200,
        heading=0.0,
        sensor_fov_deg=90.0,
        detection_range=100.0,
        sim_time=1.0,
    )
    assert new_cells > 0
    updated_pct = mgr.get_coverage_percentage()
    assert 0.0 < updated_pct <= 100.0


def test_frontier_waypoint_selection():
    config = EnvironmentConfig(width=400, height=400, grid_cell_size=20)
    env = Environment(config)
    mgr = CoverageManager(env)

    # Initial state: everything is frontier
    frontier = mgr.find_frontier_waypoint(drone_x=200, drone_y=200)
    assert frontier is not None
    assert 0 <= frontier[0] <= 400
    assert 0 <= frontier[1] <= 400
