import math
import uuid
import numpy as np
from typing import List, Tuple, Optional
from ..schemas.models import Target, TargetClass, Detection, DroneTelemetry, DetectionConfig
from ..simulation.environment import Environment
from .base import BaseDetector


class SimulatedDetector(BaseDetector):
    def __init__(self, config: DetectionConfig, env: Environment, rng: Optional[np.random.Generator] = None):
        self.config = config
        self.env = env
        self.rng = rng or np.random.default_rng(42)

    def detect(self, drones: List[DroneTelemetry], targets: List[Target], sim_time: float) -> List[Detection]:
        detections: List[Detection] = []

        for drone in drones:
            fov_rad = math.radians(drone.sensor_fov_deg)

            for target in targets:
                if not target.visible:
                    continue

                dx = target.x - drone.x
                dy = target.y - drone.y
                dist = math.hypot(dx, dy)

                # 1. Range test
                if dist > drone.detection_range:
                    continue

                # 2. Field of view angular test
                angle_to_target = math.atan2(dy, dx)
                angle_diff = (angle_to_target - drone.heading + math.pi) % (2 * math.pi) - math.pi
                if abs(angle_diff) > (fov_rad / 2.0):
                    continue

                # 3. Line of sight test against obstacles
                if not self.env.line_of_sight(drone.x, drone.y, target.x, target.y):
                    continue

                # 4. Confidence calculation based on range and angle
                range_factor = 1.0 - (dist / drone.detection_range) * 0.4
                angle_factor = 1.0 - (abs(angle_diff) / (fov_rad / 2.0)) * 0.3
                base_confidence = range_factor * angle_factor

                # Add noise
                noise = self.rng.normal(0.0, self.config.detection_noise * 0.01)
                confidence = float(np.clip(base_confidence + noise, 0.1, 0.99))

                if confidence >= self.config.confidence_threshold:
                    # Measured position with slight sensor uncertainty
                    pos_noise_x = self.rng.normal(0.0, self.config.detection_noise)
                    pos_noise_y = self.rng.normal(0.0, self.config.detection_noise)

                    detections.append(Detection(
                        id=str(uuid.uuid4())[:8],
                        target_id=target.id,
                        object_class=target.target_class,
                        confidence=round(confidence, 2),
                        x=round(target.x + pos_noise_x, 1),
                        y=round(target.y + pos_noise_y, 1),
                        timestamp=round(sim_time, 2),
                        observing_drone_id=drone.id,
                    ))

        return detections


class TargetManager:
    """Spawns and moves synthetic people and vehicles across the environment."""
    def __init__(self, env: Environment, rng: Optional[np.random.Generator] = None):
        self.env = env
        self.rng = rng or np.random.default_rng(42)
        self.targets: List[Target] = []
        self._init_targets()

    def _init_targets(self):
        self.targets.clear()
        # Spawn synthetic people
        for i in range(4):
            x = float(self.rng.uniform(100, self.env.width - 100))
            y = float(self.rng.uniform(100, self.env.height - 100))
            speed = float(self.rng.uniform(3.0, 7.0))
            angle = float(self.rng.uniform(0, 2 * math.pi))
            self.targets.append(Target(
                id=f"tgt-p{i+1}",
                target_class=TargetClass.PERSON,
                x=x,
                y=y,
                vx=speed * math.cos(angle),
                vy=speed * math.sin(angle),
                width=10.0,
                height=10.0,
            ))

        # Spawn synthetic vehicles (faster, road-like paths)
        for i in range(3):
            x = float(self.rng.uniform(100, self.env.width - 100))
            y = float(self.rng.uniform(100, self.env.height - 100))
            speed = float(self.rng.uniform(12.0, 20.0))
            angle = float(self.rng.choice([0, math.pi / 2, math.pi, 3 * math.pi / 2]))
            self.targets.append(Target(
                id=f"tgt-v{i+1}",
                target_class=TargetClass.VEHICLE,
                x=x,
                y=y,
                vx=speed * math.cos(angle),
                vy=speed * math.sin(angle),
                width=22.0,
                height=14.0,
            ))

    def update(self, dt: float):
        for t in self.targets:
            new_x = t.x + t.vx * dt
            new_y = t.y + t.vy * dt

            # Bounce off map borders
            if new_x < 30 or new_x > self.env.width - 30:
                t.vx = -t.vx
                new_x = np.clip(new_x, 30, self.env.width - 30)
            if new_y < 30 or new_y > self.env.height - 30:
                t.vy = -t.vy
                new_y = np.clip(new_y, 30, self.env.height - 30)

            # Bounce off obstacles
            if self.env.is_blocked(new_x, new_y, radius=8.0):
                # Reverse or randomize direction
                angle = float(self.rng.uniform(0, 2 * math.pi))
                speed = math.hypot(t.vx, t.vy)
                t.vx = speed * math.cos(angle)
                t.vy = speed * math.sin(angle)
            else:
                t.x = new_x
                t.y = new_y
