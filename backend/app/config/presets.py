from typing import Dict, Any
from ..schemas.models import (
    MasterConfig,
    EnvironmentConfig,
    SwarmConfig,
    DetectionConfig,
    FlightPathConfig,
    SimulationSettings,
    Obstacle,
    NoFlyZone,
    FormationType,
    PathAlgorithm,
)


def get_default_presets() -> Dict[str, MasterConfig]:
    # 1. Urban Block Surveillance
    urban_obstacles = [
        Obstacle(id="obs-1", x=180, y=140, width=140, height=120, label="HQ Tower"),
        Obstacle(id="obs-2", x=420, y=140, width=160, height=120, label="Commercial Complex"),
        Obstacle(id="obs-3", x=680, y=140, width=140, height=120, label="Terminal A"),
        Obstacle(id="obs-4", x=180, y=380, width=140, height=140, label="Warehouse Alpha"),
        Obstacle(id="obs-5", x=420, y=380, width=160, height=140, label="Research Center"),
        Obstacle(id="obs-6", x=680, y=380, width=140, height=140, label="Warehouse Beta"),
    ]
    urban_nfz = [
        NoFlyZone(id="nfz-1", x=450, y=280, width=100, height=80, name="VIP Helipad"),
    ]

    urban_preset = MasterConfig(
        environment=EnvironmentConfig(
            width=1000,
            height=650,
            grid_cell_size=20,
            obstacles=urban_obstacles,
            no_fly_zones=urban_nfz,
        ),
        swarm=SwarmConfig(
            drone_count=8,
            formation=FormationType.DYNAMIC,
            min_separation=35,
            communication_range=280,
            max_speed=28,
            accel_limit=14,
            turn_rate_limit=3.14,
            sensor_fov_deg=85,
            detection_range=130,
        ),
        flight_path=FlightPathConfig(
            algorithm=PathAlgorithm.COVERAGE,
            replanning_interval=2.0,
            obstacle_avoidance=True,
            path_smoothing=True,
        ),
    )

    # 2. Small Area Patrol
    small_patrol = MasterConfig(
        environment=EnvironmentConfig(
            width=600,
            height=450,
            grid_cell_size=15,
            obstacles=[
                Obstacle(id="obs-s1", x=240, y=160, width=120, height=100, label="Substation"),
            ],
            no_fly_zones=[
                NoFlyZone(id="nfz-s1", x=260, y=180, width=80, height=60, name="Power Core"),
            ],
        ),
        swarm=SwarmConfig(
            drone_count=4,
            formation=FormationType.CIRCLE,
            min_separation=30,
            communication_range=220,
            max_speed=20,
            sensor_fov_deg=75,
            detection_range=110,
        ),
        flight_path=FlightPathConfig(
            algorithm=PathAlgorithm.WAYPOINT,
            formation_strength=0.7,
        ),
    )

    # 3. Wide Area Coverage
    wide_coverage = MasterConfig(
        environment=EnvironmentConfig(
            width=1400,
            height=900,
            grid_cell_size=25,
            obstacles=[
                Obstacle(id="obs-w1", x=300, y=250, width=100, height=100, label="Facility 1"),
                Obstacle(id="obs-w2", x=850, y=500, width=120, height=150, label="Facility 2"),
            ],
            no_fly_zones=[
                NoFlyZone(id="nfz-w1", x=600, y=350, width=180, height=120, name="Radar Station"),
            ],
        ),
        swarm=SwarmConfig(
            drone_count=12,
            formation=FormationType.GRID,
            min_separation=45,
            communication_range=350,
            max_speed=32,
            sensor_fov_deg=90,
            detection_range=150,
        ),
        flight_path=FlightPathConfig(
            algorithm=PathAlgorithm.COVERAGE,
            coverage_strategy="frontier_sector",
        ),
    )

    # 4. Dense Obstacle Environment
    dense_obstacles = MasterConfig(
        environment=EnvironmentConfig(
            width=1000,
            height=700,
            grid_cell_size=20,
            obstacles=[
                Obstacle(id="d1", x=150, y=100, width=80, height=220, label="Wall Block A"),
                Obstacle(id="d2", x=320, y=250, width=90, height=200, label="Wall Block B"),
                Obstacle(id="d3", x=500, y=80, width=110, height=180, label="Wall Block C"),
                Obstacle(id="d4", x=680, y=220, width=90, height=250, label="Wall Block D"),
                Obstacle(id="d5", x=240, y=480, width=200, height=90, label="South Bunker"),
                Obstacle(id="d6", x=560, y=480, width=180, height=100, label="Depot"),
            ],
            no_fly_zones=[
                NoFlyZone(id="dnfz-1", x=440, y=320, width=70, height=70, name="Radio Mast"),
            ],
        ),
        swarm=SwarmConfig(
            drone_count=6,
            formation=FormationType.DYNAMIC,
            min_separation=25,
            communication_range=200,
            max_speed=20,
            sensor_fov_deg=80,
            detection_range=100,
        ),
        flight_path=FlightPathConfig(
            algorithm=PathAlgorithm.ASTAR,
            replanning_interval=1.5,
            obstacle_avoidance=True,
            separation_weight=2.5,
        ),
    )

    # 5. Multi-Target Tracking
    multi_target = MasterConfig(
        environment=EnvironmentConfig(
            width=1100,
            height=700,
            grid_cell_size=20,
            obstacles=[
                Obstacle(id="mt1", x=250, y=200, width=120, height=120, label="Zone North"),
                Obstacle(id="mt2", x=650, y=350, width=140, height=140, label="Zone South"),
            ],
        ),
        swarm=SwarmConfig(
            drone_count=8,
            formation=FormationType.DYNAMIC,
            min_separation=35,
            communication_range=300,
            max_speed=30,
            sensor_fov_deg=90,
            detection_range=140,
        ),
        detection=DetectionConfig(
            detection_range=140,
            confidence_threshold=0.55,
            track_timeout=8.0,
            update_interval=0.3,
        ),
    )

    # 6. Battery-Constrained Mission
    battery_constrained = MasterConfig(
        environment=EnvironmentConfig(
            width=800,
            height=600,
            grid_cell_size=20,
            obstacles=[
                Obstacle(id="bc1", x=300, y=200, width=160, height=160, label="Reactor Wing"),
            ],
            no_fly_zones=[
                NoFlyZone(id="bcnfz", x=340, y=240, width=80, height=80, name="Hot Zone"),
            ],
        ),
        swarm=SwarmConfig(
            drone_count=6,
            battery_drain_rate=0.15,  # rapid drain to demonstrate low-battery and return behavior
            max_speed=22,
            min_separation=30,
        ),
        flight_path=FlightPathConfig(
            algorithm=PathAlgorithm.COVERAGE,
        ),
    )

    return {
        "Urban Block Surveillance": urban_preset,
        "Small Area Patrol": small_patrol,
        "Wide Area Coverage": wide_coverage,
        "Dense Obstacle Environment": dense_obstacles,
        "Multi-Target Tracking": multi_target,
        "Battery-Constrained Mission": battery_constrained,
    }
