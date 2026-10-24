import pytest
from app.simulation.coordination import SwarmCoordinator
from app.simulation.collision_avoidance import CollisionAvoidance
from app.simulation.environment import Environment
from app.schemas.models import FormationType, EnvironmentConfig


def test_swarm_formations():
    coord = SwarmCoordinator(formation=FormationType.LINE, comm_range=200)
    offsets_line = coord.compute_formation_offsets(4, FormationType.LINE, spacing=40)
    assert len(offsets_line) == 4

    offsets_circle = coord.compute_formation_offsets(6, FormationType.CIRCLE, spacing=40)
    assert len(offsets_circle) == 6

    offsets_grid = coord.compute_formation_offsets(9, FormationType.GRID, spacing=40)
    assert len(offsets_grid) == 9


def test_comm_links_mesh():
    coord = SwarmCoordinator(comm_range=100.0)
    drones = [
        {'id': 'D1', 'x': 50, 'y': 50},
        {'id': 'D2', 'x': 80, 'y': 50},   # dist = 30 -> linked
        {'id': 'D3', 'x': 300, 'y': 50},  # dist > 200 -> not linked
    ]
    links = coord.compute_comm_links(drones)
    assert len(links) == 1
    assert links[0].source_drone_id == 'D1'
    assert links[0].target_drone_id == 'D2'


def test_collision_avoidance_repulsion():
    env = Environment(EnvironmentConfig(width=500, height=500))
    avoidance = CollisionAvoidance(env, min_separation=40.0)

    other_drones = [{'id': 'D2', 'x': 100, 'y': 100}]
    # Drone 1 is placed at (110, 100), distance is 10 < 40 -> repulsion to the right (fx > 0)
    fx, fy, warning = avoidance.compute_avoidance_force('D1', 110, 100, other_drones)
    assert warning is True
    assert fx > 0.0
