import math
import numpy as np
from typing import List, Dict, Any, Optional
from ..schemas.models import (
    MasterConfig,
    SimulationState,
    SimulationSnapshot,
    DroneStatus,
    FormationType,
    PathAlgorithm,
    CoverageMetrics,
    CommLink,
    Detection,
    Track,
)
from .environment import Environment
from .drone import Drone
from .path_planning import AStarPlanner
from .coordination import SwarmCoordinator
from .collision_avoidance import CollisionAvoidance
from .coverage import CoverageManager
from ..detection.simulated import SimulatedDetector, TargetManager
from ..detection.tracking import MultiTargetTracker
from ..events.event_manager import EventManager


class SimulationEngine:
    def __init__(self, config: Optional[MasterConfig] = None):
        self.config = config or MasterConfig()
        self.state = SimulationState.STOPPED
        self.elapsed_time = 0.0
        self.tick_count = 0
        self.last_replan_time = -10.0
        self.total_detection_count = 0

        self.rng = np.random.default_rng(self.config.settings.random_seed)
        self.events = EventManager()
        self.env = Environment(self.config.environment)
        self.planner = AStarPlanner(self.env)
        self.coordinator = SwarmCoordinator(
            formation=self.config.swarm.formation,
            comm_range=self.config.swarm.communication_range,
            formation_strength=self.config.flight_path.formation_strength,
        )
        self.avoidance = CollisionAvoidance(
            self.env,
            min_separation=self.config.swarm.min_separation,
            separation_weight=self.config.flight_path.separation_weight,
        )
        self.coverage = CoverageManager(self.env, self.rng)
        self.target_mgr = TargetManager(self.env, self.rng)
        self.detector = SimulatedDetector(self.config.detection, self.env, self.rng)
        self.tracker = MultiTargetTracker(
            track_timeout=self.config.detection.track_timeout
        )

        self.drones: List[Drone] = []
        self.latest_detections: List[Detection] = []
        self.latest_tracks: List[Track] = []
        self.latest_comm_links: List[CommLink] = []

        self._init_swarm()
        self.events.info("Engine", "Simulation engine initialized.", sim_time=0.0)

    def _init_swarm(self):
        self.drones.clear()
        count = self.config.swarm.drone_count
        center_x = self.env.width * 0.5
        center_y = self.env.height * 0.85

        offsets = self.coordinator.compute_formation_offsets(count, FormationType.LINE, spacing=self.config.swarm.min_separation * 1.4)
        for i in range(count):
            ox, oy = offsets[i]
            x = np.clip(center_x + ox, 40, self.env.width - 40)
            y = np.clip(center_y + oy, 40, self.env.height - 40)

            drone = Drone(
                drone_id=f"DRONE-{i+1:02d}",
                start_x=float(x),
                start_y=float(y),
                heading=-math.pi / 2.0,  # facing North
                max_speed=self.config.swarm.max_speed,
                accel_limit=self.config.swarm.accel_limit,
                turn_rate_limit=self.config.swarm.turn_rate_limit,
                battery_drain_rate=self.config.swarm.battery_drain_rate,
                sensor_fov_deg=self.config.swarm.sensor_fov_deg,
                detection_range=self.config.swarm.detection_range,
            )
            self.drones.append(drone)

    def start(self):
        self.state = SimulationState.RUNNING
        self.events.info("Engine", "Simulation started.", sim_time=self.elapsed_time)

    def pause(self):
        self.state = SimulationState.PAUSED
        self.events.info("Engine", "Simulation paused.", sim_time=self.elapsed_time)

    def resume(self):
        self.state = SimulationState.RUNNING
        self.events.info("Engine", "Simulation resumed.", sim_time=self.elapsed_time)

    def reset(self):
        self.state = SimulationState.STOPPED
        self.elapsed_time = 0.0
        self.tick_count = 0
        self.last_replan_time = -10.0
        self.total_detection_count = 0

        self.rng = np.random.default_rng(self.config.settings.random_seed)
        self.events.clear()
        self.coverage = CoverageManager(self.env, self.rng)
        self.target_mgr = TargetManager(self.env, self.rng)
        self.tracker.clear()
        self.latest_detections.clear()
        self.latest_tracks.clear()
        self._init_swarm()
        self.events.info("Engine", "Simulation reset to initial state.", sim_time=0.0)

    def step(self):
        """Execute a single deterministic simulation tick."""
        dt = self.config.settings.time_step
        self.tick(dt)

    def update_config(self, new_config: MasterConfig):
        self.config = new_config
        self.env = Environment(new_config.environment)
        self.planner = AStarPlanner(self.env)
        self.coordinator.formation = new_config.swarm.formation
        self.coordinator.comm_range = new_config.swarm.communication_range
        self.coordinator.formation_strength = new_config.flight_path.formation_strength
        self.avoidance.min_separation = new_config.swarm.min_separation
        self.avoidance.separation_weight = new_config.flight_path.separation_weight
        self.detector.config = new_config.detection
        self.tracker.track_timeout = new_config.detection.track_timeout

        # If drone count changed, adjust swarm
        if len(self.drones) != new_config.swarm.drone_count:
            self._init_swarm()

        # Update drone dynamic parameters
        for drone in self.drones:
            drone.max_speed = new_config.swarm.max_speed
            drone.accel_limit = new_config.swarm.accel_limit
            drone.turn_rate_limit = new_config.swarm.turn_rate_limit
            drone.battery_drain_rate = new_config.swarm.battery_drain_rate
            drone.sensor_fov_deg = new_config.swarm.sensor_fov_deg
            drone.detection_range = new_config.swarm.detection_range

        self.events.info("Config", "Configuration updated dynamically.", sim_time=self.elapsed_time)

    def tick(self, dt: float):
        self.tick_count += 1
        self.elapsed_time += dt

        # 1. Update targets (people & vehicles)
        self.target_mgr.update(dt)

        # 2. Path replanning & objective assignment
        time_since_replan = self.elapsed_time - self.last_replan_time
        if time_since_replan >= self.config.flight_path.replanning_interval:
            self.last_replan_time = self.elapsed_time
            self._replan_drones()

        # 3. Compute inter-drone state dictionary for spatial queries
        drones_state = [
            {'id': d.id, 'x': d.x, 'y': d.y, 'heading': d.heading, 'speed': d.speed, 'battery': d.battery}
            for d in self.drones
        ]

        # 4. Update each drone physics and avoidance
        for drone in self.drones:
            if drone.status in (DroneStatus.UNAVAILABLE, DroneStatus.PAUSED):
                continue

            # Compute collision avoidance force (inter-drone + obstacles + NFZ)
            afx, afy, sep_warning = self.avoidance.compute_avoidance_force(
                drone.id, drone.x, drone.y, drones_state
            )
            if sep_warning and self.tick_count % 30 == 0:
                self.events.warning(
                    "Avoidance",
                    f"Proximity threshold reached for {drone.id}",
                    entity_id=drone.id,
                    sim_time=self.elapsed_time
                )

            # Compute flocking cohesion/alignment if in formation
            ffx, ffy = (0.0, 0.0)
            if self.config.swarm.formation != FormationType.DYNAMIC:
                ffx, ffy = self.coordinator.compute_flocking_force(
                    drone.id, drone.x, drone.y, drone.heading, drone.speed, drones_state,
                    cohesion_weight=self.config.flight_path.cohesion_weight
                )

            drone.update(dt, avoidance_force=(afx, afy), flocking_force=(ffx, ffy))

            # Record coverage
            new_covered = self.coverage.record_coverage(
                drone.x, drone.y, drone.heading, drone.sensor_fov_deg, drone.detection_range, self.elapsed_time
            )
            drone.coverage_contribution += new_covered

        # 5. Compute communication mesh links
        self.latest_comm_links = self.coordinator.compute_comm_links(drones_state)

        # 6. Object detection & tracking
        drone_telemetries = [d.to_telemetry() for d in self.drones]
        self.latest_detections = self.detector.detect(
            drone_telemetries, self.target_mgr.targets, self.elapsed_time
        )
        if self.latest_detections:
            self.total_detection_count += len(self.latest_detections)
            for det in self.latest_detections:
                if det.confidence >= self.config.detection.alert_threshold and self.tick_count % 20 == 0:
                    self.events.warning(
                        "Vision",
                        f"Detected {det.object_class.value.upper()} (conf: {int(det.confidence*100)}%) by {det.observing_drone_id}",
                        entity_id=det.target_id,
                        sim_time=self.elapsed_time
                    )

        self.latest_tracks = self.tracker.update(self.latest_detections, self.elapsed_time)

    def _replan_drones(self):
        """Assign coverage/patrol exploration waypoints to active drones."""
        for idx, drone in enumerate(self.drones):
            if drone.status in (DroneStatus.UNAVAILABLE, DroneStatus.LOW_BATTERY, DroneStatus.RETURNING):
                continue

            # If current waypoints exhausted or planning requested
            if len(drone.waypoints) <= 1:
                sector_angle = (2 * math.pi / len(self.drones)) * idx
                next_pt = self.coverage.find_frontier_waypoint(drone.x, drone.y, sector_angle=sector_angle)

                if next_pt:
                    if self.config.flight_path.algorithm == PathAlgorithm.ASTAR:
                        path = self.planner.plan(
                            drone.x, drone.y, next_pt[0], next_pt[1],
                            smooth=self.config.flight_path.path_smoothing
                        )
                        if path and len(path) > 1:
                            drone.waypoints = path[1:]
                            drone.status = DroneStatus.NAVIGATING
                            drone.current_objective = f"Navigating to Sector {idx+1}"
                        else:
                            drone.waypoints = [next_pt]
                            drone.status = DroneStatus.PATROLLING
                            drone.current_objective = f"Patrolling Sector {idx+1}"
                    else:
                        drone.waypoints = [next_pt]
                        drone.status = DroneStatus.PATROLLING
                        drone.current_objective = f"Patrolling Sector {idx+1}"

    def get_snapshot(self) -> SimulationSnapshot:
        drones_telemetry = [d.to_telemetry() for d in self.drones]
        cov_pct = self.coverage.get_coverage_percentage()
        explored_indices = self.coverage.get_explored_cells_indices()
        alert_counts = self.events.get_counts()

        active_drones = sum(1 for d in self.drones if d.status not in (DroneStatus.UNAVAILABLE, DroneStatus.IDLE))
        active_tracks = sum(1 for t in self.latest_tracks if t.status != "lost")
        avg_battery = float(np.mean([d.battery for d in self.drones])) if self.drones else 0.0

        metrics = CoverageMetrics(
            coverage_percentage=cov_pct,
            cells_explored=len(explored_indices),
            total_cells=self.coverage.total_valid_cells,
            active_drones=active_drones,
            active_tracked_targets=active_tracks,
            average_battery=round(avg_battery, 1),
            mission_elapsed_time=round(self.elapsed_time, 1),
            detection_count=self.total_detection_count,
            alerts_critical=alert_counts["critical"],
            alerts_warning=alert_counts["warning"],
            alerts_info=alert_counts["info"],
        )

        return SimulationSnapshot(
            state=self.state,
            elapsed_time=round(self.elapsed_time, 2),
            tick=self.tick_count,
            drones=drones_telemetry,
            targets=self.target_mgr.targets,
            detections=self.latest_detections,
            tracks=self.latest_tracks,
            alerts=self.events.get_recent(40),
            metrics=metrics,
            comm_links=self.latest_comm_links,
            explored_cells=explored_indices,
        )
