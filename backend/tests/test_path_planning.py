import pytest
from app.simulation.environment import Environment
from app.simulation.path_planning import AStarPlanner
from app.schemas.models import EnvironmentConfig, Obstacle, NoFlyZone


def test_astar_clear_path():
    config = EnvironmentConfig(width=500, height=500, grid_cell_size=20, obstacles=[], no_fly_zones=[])
    env = Environment(config)
    planner = AStarPlanner(env)

    path = planner.plan(50, 50, 450, 450)
    assert path is not None
    assert len(path) >= 2
    assert path[0] == (50, 50)
    assert path[-1] == (450, 450)


def test_astar_obstacle_avoidance():
    # Place a large building right in the middle
    obs = Obstacle(id="b1", x=150, y=100, width=200, height=200, label="Blocker")
    config = EnvironmentConfig(width=500, height=500, grid_cell_size=20, obstacles=[obs], no_fly_zones=[])
    env = Environment(config)
    planner = AStarPlanner(env)

    path = planner.plan(50, 200, 450, 200)
    assert path is not None

    # Verify no path points cross inside the obstacle
    for px, py in path:
        in_obstacle = (obs.x <= px <= obs.x + obs.width and obs.y <= py <= obs.y + obs.height)
        assert not in_obstacle, f"Path waypoint ({px}, {py}) penetrated obstacle {obs}"


def test_astar_unreachable_goal_handling():
    # Enclose goal completely
    obs = Obstacle(id="box", x=350, y=350, width=100, height=100)
    config = EnvironmentConfig(width=500, height=500, grid_cell_size=20, obstacles=[obs])
    env = Environment(config)
    planner = AStarPlanner(env)

    # Goal inside blocked cell should gracefully find nearest reachable free cell or terminate
    path = planner.plan(50, 50, 390, 390)
    if path is not None:
        # Destination must not be inside obstacle
        dest_x, dest_y = path[-1]
        assert not (obs.x <= dest_x <= obs.x + obs.width and obs.y <= dest_y <= obs.y + obs.height)
