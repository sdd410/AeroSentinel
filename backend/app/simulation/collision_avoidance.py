import math
from typing import List, Tuple, Dict, Any, Optional
from .environment import Environment


class CollisionAvoidance:
    def __init__(self, env: Environment, min_separation: float = 35.0, separation_weight: float = 1.8):
        self.env = env
        self.min_separation = min_separation
        self.separation_weight = separation_weight

    def compute_avoidance_force(
        self,
        drone_id: str,
        pos_x: float,
        pos_y: float,
        other_drones: List[Dict[str, Any]],
        obstacle_clearance: float = 25.0,
    ) -> Tuple[float, float, bool]:
        """Calculates repulsive force vector (fx, fy) and alert flag if separation violated."""
        fx = 0.0
        fy = 0.0
        separation_warning = False

        # 1. Inter-drone repulsion
        for other in other_drones:
            if other['id'] == drone_id:
                continue

            ox, oy = other['x'], other['y']
            dx = pos_x - ox
            dy = pos_y - oy
            dist = math.hypot(dx, dy)

            if dist < 0.001:
                # Direct overlap jitter
                fx += 5.0
                fy += 5.0
                separation_warning = True
                continue

            if dist < self.min_separation:
                separation_warning = True
                # Strong inverse-square repulsion
                magnitude = self.separation_weight * ((self.min_separation - dist) / dist) * 15.0
                fx += (dx / dist) * magnitude
                fy += (dy / dist) * magnitude

        # 2. Static obstacle and boundary repulsion
        # Map boundaries
        margin = 30.0
        if pos_x < margin:
            fx += ((margin - pos_x) / margin) * 20.0
        elif pos_x > self.env.width - margin:
            fx -= ((pos_x - (self.env.width - margin)) / margin) * 20.0

        if pos_y < margin:
            fy += ((margin - pos_y) / margin) * 20.0
        elif pos_y > self.env.height - margin:
            fy -= ((pos_y - (self.env.height - margin)) / margin) * 20.0

        # Obstacles repulsion
        for obs in self.env.obstacles:
            cx = obs.x + obs.width / 2.0
            cy = obs.y + obs.height / 2.0
            half_w = obs.width / 2.0 + obstacle_clearance
            half_h = obs.height / 2.0 + obstacle_clearance

            # Distance to rectangle
            dx = max(abs(pos_x - cx) - half_w, 0)
            dy = max(abs(pos_y - cy) - half_h, 0)
            dist = math.hypot(dx, dy)

            if dist < obstacle_clearance:
                repel_x = pos_x - cx
                repel_y = pos_y - cy
                repel_dist = math.hypot(repel_x, repel_y)
                if repel_dist > 0.001:
                    mag = ((obstacle_clearance - dist) / obstacle_clearance) * 25.0
                    fx += (repel_x / repel_dist) * mag
                    fy += (repel_y / repel_dist) * mag

        # No-fly zones repulsion
        for nfz in self.env.no_fly_zones:
            cx = nfz.x + nfz.width / 2.0
            cy = nfz.y + nfz.height / 2.0
            half_w = nfz.width / 2.0 + obstacle_clearance
            half_h = nfz.height / 2.0 + obstacle_clearance

            dx = max(abs(pos_x - cx) - half_w, 0)
            dy = max(abs(pos_y - cy) - half_h, 0)
            dist = math.hypot(dx, dy)

            if dist < obstacle_clearance:
                repel_x = pos_x - cx
                repel_y = pos_y - cy
                repel_dist = math.hypot(repel_x, repel_y)
                if repel_dist > 0.001:
                    mag = ((obstacle_clearance - dist) / obstacle_clearance) * 30.0
                    fx += (repel_x / repel_dist) * mag
                    fy += (repel_y / repel_dist) * mag

        return fx, fy, separation_warning
