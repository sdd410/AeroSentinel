import math
from typing import List, Tuple, Optional
from ..schemas.models import DroneStatus, DroneTelemetry


class Drone:
    def __init__(
        self,
        drone_id: str,
        start_x: float,
        start_y: float,
        heading: float = 0.0,
        max_speed: float = 25.0,
        accel_limit: float = 12.0,
        turn_rate_limit: float = 3.14,
        battery_drain_rate: float = 0.04,
        sensor_fov_deg: float = 80.0,
        detection_range: float = 120.0,
    ):
        self.id = drone_id
        self.x = start_x
        self.y = start_y
        self.home_x = start_x
        self.home_y = start_y
        self.heading = heading
        self.speed = 0.0
        self.max_speed = max_speed
        self.accel_limit = accel_limit
        self.turn_rate_limit = turn_rate_limit
        self.battery = 100.0
        self.battery_drain_rate = battery_drain_rate
        self.sensor_fov_deg = sensor_fov_deg
        self.detection_range = detection_range

        self.status: DroneStatus = DroneStatus.IDLE
        self.current_objective: str = "Standby"
        self.coverage_contribution: float = 0.0
        
        self.waypoints: List[Tuple[float, float]] = []
        self.planned_path: List[Tuple[float, float]] = []
        self.trail: List[Tuple[float, float]] = [(round(start_x, 1), round(start_y, 1))]
        self.max_trail_len = 30
        self.target_investigation: Optional[Tuple[float, float]] = None

    def update(
        self,
        dt: float,
        avoidance_force: Tuple[float, float] = (0.0, 0.0),
        flocking_force: Tuple[float, float] = (0.0, 0.0),
    ):
        """Update drone physics with acceleration, steering, battery drain, and waypoints."""
        if self.status == DroneStatus.UNAVAILABLE or self.status == DroneStatus.PAUSED:
            return

        # 1. Battery consumption
        # Higher speed incurs slightly more drain
        drain = self.battery_drain_rate * (0.8 + 0.4 * (self.speed / max(1.0, self.max_speed))) * dt
        self.battery = max(0.0, self.battery - drain)

        if self.battery <= 0.0:
            self.status = DroneStatus.UNAVAILABLE
            self.speed = 0.0
            self.current_objective = "Battery Depleted"
            return

        if self.battery < 20.0 and self.status != DroneStatus.RETURNING and self.status != DroneStatus.LOW_BATTERY:
            self.status = DroneStatus.LOW_BATTERY
            self.current_objective = "RTL - Low Battery"
            self.waypoints = [(self.home_x, self.home_y)]

        # 2. Steer towards next waypoint or target
        desired_vx = 0.0
        desired_vy = 0.0

        if self.waypoints:
            target_x, target_y = self.waypoints[0]
            dx = target_x - self.x
            dy = target_y - self.y
            dist = math.hypot(dx, dy)

            if dist < 12.0:
                # Reached waypoint
                self.waypoints.pop(0)
                if not self.waypoints:
                    if self.status == DroneStatus.LOW_BATTERY:
                        self.status = DroneStatus.IDLE
                        self.current_objective = "Landed at Base"
                    elif self.status == DroneStatus.INVESTIGATING:
                        self.status = DroneStatus.PATROLLING
                        self.current_objective = "Resume Patrol"
            else:
                desired_vx = (dx / dist) * self.max_speed
                desired_vy = (dy / dist) * self.max_speed

        # Incorporate external avoidance and flocking forces
        total_vx = desired_vx + avoidance_force[0] + flocking_force[0]
        total_vy = desired_vy + avoidance_force[1] + flocking_force[1]

        target_speed = math.hypot(total_vx, total_vy)
        target_speed = min(self.max_speed, target_speed)

        target_heading = self.heading
        if target_speed > 0.5:
            target_heading = math.atan2(total_vy, total_vx)

        # 3. Turning rate limitation
        heading_diff = (target_heading - self.heading + math.pi) % (2 * math.pi) - math.pi
        max_turn = self.turn_rate_limit * dt
        turn_applied = max(-max_turn, min(max_turn, heading_diff))
        self.heading = (self.heading + turn_applied) % (2 * math.pi)

        # 4. Acceleration limitation
        speed_diff = target_speed - self.speed
        max_accel = self.accel_limit * dt
        self.speed += max(-max_accel, min(max_accel, speed_diff))

        # 5. Position integration
        vx = math.cos(self.heading) * self.speed
        vy = math.sin(self.heading) * self.speed
        self.x += vx * dt
        self.y += vy * dt

        # Update trail
        if len(self.trail) == 0 or math.hypot(self.x - self.trail[-1][0], self.y - self.trail[-1][1]) > 8.0:
            self.trail.append((round(self.x, 1), round(self.y, 1)))
            if len(self.trail) > self.max_trail_len:
                self.trail.pop(0)

    def to_telemetry(self) -> DroneTelemetry:
        return DroneTelemetry(
            id=self.id,
            x=round(self.x, 2),
            y=round(self.y, 2),
            heading=round(self.heading, 3),
            speed=round(self.speed, 2),
            battery=round(self.battery, 1),
            status=self.status,
            current_objective=self.current_objective,
            coverage_contribution=round(self.coverage_contribution, 1),
            trail=self.trail,
            planned_path=self.waypoints,
            sensor_fov_deg=self.sensor_fov_deg,
            detection_range=self.detection_range,
        )
