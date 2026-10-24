from enum import Enum
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field


class DroneStatus(str, Enum):
    IDLE = "Idle"
    PATROLLING = "Patrolling"
    NAVIGATING = "Navigating"
    INVESTIGATING = "Investigating"
    RETURNING = "Returning"
    LOW_BATTERY = "Low Battery"
    PAUSED = "Paused"
    UNAVAILABLE = "Unavailable"


class FormationType(str, Enum):
    DYNAMIC = "dynamic"
    LINE = "line"
    GRID = "grid"
    CIRCLE = "circle"


class PathAlgorithm(str, Enum):
    ASTAR = "astar"
    WAYPOINT = "waypoint"
    COVERAGE = "coverage"


class TargetClass(str, Enum):
    PERSON = "person"
    VEHICLE = "vehicle"


class TrackStatus(str, Enum):
    ACTIVE = "active"
    STALE = "stale"
    LOST = "lost"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class SimulationState(str, Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"


class Point2D(BaseModel):
    x: float
    y: float


class Obstacle(BaseModel):
    id: str
    x: float
    y: float
    width: float
    height: float
    label: Optional[str] = "Building"


class NoFlyZone(BaseModel):
    id: str
    x: float
    y: float
    width: float
    height: float
    name: Optional[str] = "Restricted Area"


class Target(BaseModel):
    id: str
    target_class: TargetClass
    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    width: float = 12.0
    height: float = 12.0
    visible: bool = True


class Detection(BaseModel):
    id: str
    target_id: Optional[str] = None
    object_class: TargetClass
    confidence: float
    x: float
    y: float
    timestamp: float
    observing_drone_id: str


class Track(BaseModel):
    id: str
    target_id: Optional[str] = None
    object_class: TargetClass
    confidence: float
    x: float
    y: float
    first_seen: float
    last_seen: float
    observing_drone_id: str
    status: TrackStatus = TrackStatus.ACTIVE
    history: List[Tuple[float, float]] = Field(default_factory=list)


class DroneTelemetry(BaseModel):
    id: str
    x: float
    y: float
    heading: float  # radians
    speed: float
    battery: float  # 0 to 100%
    status: DroneStatus = DroneStatus.IDLE
    current_objective: str = "Patrol Sector"
    coverage_contribution: float = 0.0  # cells visited or sq meters
    trail: List[Tuple[float, float]] = Field(default_factory=list)
    planned_path: List[Tuple[float, float]] = Field(default_factory=list)
    sensor_fov_deg: float = 80.0
    detection_range: float = 120.0


class Alert(BaseModel):
    id: str
    severity: AlertSeverity
    timestamp: float
    source: str
    message: str
    acknowledged: bool = False
    entity_id: Optional[str] = None


class SwarmConfig(BaseModel):
    drone_count: int = Field(default=8, ge=1, le=32)
    formation: FormationType = FormationType.DYNAMIC
    min_separation: float = Field(default=35.0, ge=10.0, le=200.0)
    communication_range: float = Field(default=250.0, ge=50.0, le=1000.0)
    max_speed: float = Field(default=25.0, ge=5.0, le=100.0)
    accel_limit: float = Field(default=12.0, ge=2.0, le=50.0)
    turn_rate_limit: float = Field(default=3.14, ge=0.5, le=6.28)  # rad/s
    battery_capacity_min: float = Field(default=25.0, ge=5.0, le=60.0)
    battery_drain_rate: float = Field(default=0.04, ge=0.005, le=0.5)  # % per second
    sensor_fov_deg: float = Field(default=80.0, ge=30.0, le=180.0)
    detection_range: float = Field(default=120.0, ge=30.0, le=400.0)


class EnvironmentConfig(BaseModel):
    width: float = Field(default=1000.0, ge=200.0, le=5000.0)
    height: float = Field(default=800.0, ge=200.0, le=5000.0)
    grid_cell_size: float = Field(default=20.0, ge=5.0, le=50.0)
    obstacles: List[Obstacle] = Field(default_factory=list)
    no_fly_zones: List[NoFlyZone] = Field(default_factory=list)


class DetectionConfig(BaseModel):
    mode: str = "simulated"  # "simulated" or "local_vision"
    detection_range: float = Field(default=120.0, ge=20.0, le=500.0)
    confidence_threshold: float = Field(default=0.6, ge=0.1, le=1.0)
    object_classes: List[TargetClass] = Field(default_factory=lambda: [TargetClass.PERSON, TargetClass.VEHICLE])
    track_timeout: float = Field(default=5.0, ge=1.0, le=30.0)
    update_interval: float = Field(default=0.5, ge=0.1, le=2.0)
    alert_threshold: float = Field(default=0.75, ge=0.1, le=1.0)
    detection_noise: float = Field(default=1.5, ge=0.0, le=15.0)


class FlightPathConfig(BaseModel):
    algorithm: PathAlgorithm = PathAlgorithm.COVERAGE
    replanning_interval: float = Field(default=2.0, ge=0.5, le=10.0)
    path_smoothing: bool = True
    obstacle_avoidance: bool = True
    collision_avoidance_mode: str = "boids_apf"
    coverage_strategy: str = "frontier_sector"
    target_assignment_strategy: str = "distributed_closest"
    formation_strength: float = Field(default=0.5, ge=0.0, le=1.0)
    separation_weight: float = Field(default=1.8, ge=0.1, le=5.0)
    cohesion_weight: float = Field(default=0.6, ge=0.0, le=3.0)


class SimulationSettings(BaseModel):
    time_step: float = Field(default=0.05, ge=0.01, le=0.2)  # 20 Hz tick
    simulation_speed: float = Field(default=1.0, ge=0.1, le=5.0)
    random_seed: int = 42
    auto_pause_on_critical: bool = False
    show_drone_trails: bool = True
    show_sensor_coverage: bool = True
    show_communication_links: bool = True
    show_predicted_paths: bool = True


class MasterConfig(BaseModel):
    environment: EnvironmentConfig = Field(default_factory=EnvironmentConfig)
    swarm: SwarmConfig = Field(default_factory=SwarmConfig)
    detection: DetectionConfig = Field(default_factory=DetectionConfig)
    flight_path: FlightPathConfig = Field(default_factory=FlightPathConfig)
    settings: SimulationSettings = Field(default_factory=SimulationSettings)


class CoverageMetrics(BaseModel):
    coverage_percentage: float = 0.0
    cells_explored: int = 0
    total_cells: int = 0
    active_drones: int = 0
    active_tracked_targets: int = 0
    average_battery: float = 100.0
    mission_elapsed_time: float = 0.0
    detection_count: int = 0
    alerts_critical: int = 0
    alerts_warning: int = 0
    alerts_info: int = 0


class CommLink(BaseModel):
    source_drone_id: str
    target_drone_id: str
    distance: float


class SimulationSnapshot(BaseModel):
    state: SimulationState
    elapsed_time: float
    tick: int
    drones: List[DroneTelemetry]
    targets: List[Target]
    detections: List[Detection]
    tracks: List[Track]
    alerts: List[Alert]
    metrics: CoverageMetrics
    comm_links: List[CommLink]
    # Encoded explored cells for rendering (list of cell indices or sparse coords)
    explored_cells: List[int] = Field(default_factory=list)
