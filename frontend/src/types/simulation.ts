export type DroneStatus =
  | "Idle"
  | "Patrolling"
  | "Navigating"
  | "Investigating"
  | "Returning"
  | "Low Battery"
  | "Paused"
  | "Unavailable";

export type FormationType = "dynamic" | "line" | "grid" | "circle";
export type PathAlgorithm = "astar" | "waypoint" | "coverage";
export type TargetClass = "person" | "vehicle";
export type TrackStatus = "active" | "stale" | "lost";
export type AlertSeverity = "info" | "warning" | "critical";
export type SimulationState = "stopped" | "running" | "paused";

export interface Obstacle {
  id: string;
  x: float;
  y: float;
  width: float;
  height: float;
  label?: string;
}

export interface NoFlyZone {
  id: string;
  x: float;
  y: float;
  width: float;
  height: float;
  name?: string;
}

export interface Target {
  id: string;
  target_class: TargetClass;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface Detection {
  id: string;
  target_id?: string;
  object_class: TargetClass;
  confidence: number;
  x: number;
  y: number;
  timestamp: number;
  observing_drone_id: string;
}

export interface Track {
  id: string;
  target_id?: string;
  object_class: TargetClass;
  confidence: number;
  x: number;
  y: number;
  first_seen: number;
  last_seen: number;
  observing_drone_id: string;
  status: TrackStatus;
  history: [number, number][];
}

export interface DroneTelemetry {
  id: string;
  x: number;
  y: number;
  heading: number;
  speed: number;
  battery: number;
  status: DroneStatus;
  current_objective: string;
  coverage_contribution: number;
  trail: [number, number][];
  planned_path: [number, number][];
  sensor_fov_deg: number;
  detection_range: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  timestamp: number;
  source: string;
  message: string;
  acknowledged: boolean;
  entity_id?: string;
}

export interface CommLink {
  source_drone_id: string;
  target_drone_id: string;
  distance: number;
}

export interface CoverageMetrics {
  coverage_percentage: number;
  cells_explored: number;
  total_cells: number;
  active_drones: number;
  active_tracked_targets: number;
  average_battery: number;
  mission_elapsed_time: number;
  detection_count: number;
  alerts_critical: number;
  alerts_warning: number;
  alerts_info: number;
}

export interface EnvironmentConfig {
  width: number;
  height: number;
  grid_cell_size: number;
  obstacles: Obstacle[];
  no_fly_zones: NoFlyZone[];
}

export interface SwarmConfig {
  drone_count: number;
  formation: FormationType;
  min_separation: number;
  communication_range: number;
  max_speed: number;
  accel_limit: number;
  turn_rate_limit: number;
  battery_capacity_min: number;
  battery_drain_rate: number;
  sensor_fov_deg: number;
  detection_range: number;
}

export interface DetectionConfig {
  mode: string;
  detection_range: number;
  confidence_threshold: number;
  object_classes: TargetClass[];
  track_timeout: number;
  update_interval: number;
  alert_threshold: number;
  detection_noise: number;
}

export interface FlightPathConfig {
  algorithm: PathAlgorithm;
  replanning_interval: number;
  path_smoothing: boolean;
  obstacle_avoidance: boolean;
  collision_avoidance_mode: string;
  coverage_strategy: string;
  target_assignment_strategy: string;
  formation_strength: number;
  separation_weight: number;
  cohesion_weight: number;
}

export interface SimulationSettings {
  time_step: number;
  simulation_speed: number;
  random_seed: number;
  auto_pause_on_critical: boolean;
  show_drone_trails: boolean;
  show_sensor_coverage: boolean;
  show_communication_links: boolean;
  show_predicted_paths: boolean;
}

export interface MasterConfig {
  environment: EnvironmentConfig;
  swarm: SwarmConfig;
  detection: DetectionConfig;
  flight_path: FlightPathConfig;
  settings: SimulationSettings;
}

export interface SimulationSnapshot {
  state: SimulationState;
  elapsed_time: number;
  tick: number;
  drones: DroneTelemetry[];
  targets: Target[];
  detections: Detection[];
  tracks: Track[];
  alerts: Alert[];
  metrics: CoverageMetrics;
  comm_links: CommLink[];
  explored_cells: number[];
}
type float = number;
