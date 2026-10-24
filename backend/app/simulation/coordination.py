import math
from typing import List, Dict, Any, Tuple
from ..schemas.models import FormationType, CommLink


class SwarmCoordinator:
    def __init__(
        self,
        formation: FormationType = FormationType.DYNAMIC,
        comm_range: float = 250.0,
        formation_strength: float = 0.5,
    ):
        self.formation = formation
        self.comm_range = comm_range
        self.formation_strength = formation_strength

    def compute_comm_links(self, drones: List[Dict[str, Any]]) -> List[CommLink]:
        """Compute mesh communication graph based on Euclidean distance within comm_range."""
        links = []
        n = len(drones)
        for i in range(n):
            for j in range(i + 1, n):
                d1 = drones[i]
                d2 = drones[j]
                dist = math.hypot(d1['x'] - d2['x'], d1['y'] - d2['y'])
                if dist <= self.comm_range:
                    links.append(CommLink(
                        source_drone_id=d1['id'],
                        target_drone_id=d2['id'],
                        distance=round(dist, 1)
                    ))
        return links

    def compute_formation_offsets(self, count: int, formation: FormationType, spacing: float = 60.0) -> List[Tuple[float, float]]:
        """Calculate local (dx, dy) offsets relative to swarm centroid for designated formation."""
        offsets = []
        if formation == FormationType.LINE:
            # Horizontal or diagonal line centered at (0,0)
            start_x = -((count - 1) * spacing) / 2.0
            for i in range(count):
                offsets.append((start_x + i * spacing, 0.0))

        elif formation == FormationType.CIRCLE:
            radius = max(spacing, (count * spacing) / (2 * math.pi))
            angle_step = (2 * math.pi) / count
            for i in range(count):
                angle = i * angle_step
                offsets.append((radius * math.cos(angle), radius * math.sin(angle)))

        elif formation == FormationType.GRID:
            cols = math.ceil(math.sqrt(count))
            rows = math.ceil(count / cols)
            offset_x = -((cols - 1) * spacing) / 2.0
            offset_y = -((rows - 1) * spacing) / 2.0
            for i in range(count):
                c = i % cols
                r = i // cols
                offsets.append((offset_x + c * spacing, offset_y + r * spacing))

        else:  # DYNAMIC / dispersed
            for i in range(count):
                offsets.append((0.0, 0.0))

        return offsets

    def compute_flocking_force(
        self,
        drone_id: str,
        pos_x: float,
        pos_y: float,
        heading: float,
        speed: float,
        all_drones: List[Dict[str, Any]],
        cohesion_weight: float = 0.6,
    ) -> Tuple[float, float]:
        """Computes cohesion and alignment forces toward connected in-range neighbors."""
        neighbors = []
        avg_vx = 0.0
        avg_vy = 0.0
        center_x = 0.0
        center_y = 0.0

        for other in all_drones:
            if other['id'] == drone_id:
                continue
            dist = math.hypot(pos_x - other['x'], pos_y - other['y'])
            if dist <= self.comm_range:
                neighbors.append(other)
                center_x += other['x']
                center_y += other['y']
                avg_vx += math.cos(other['heading']) * other['speed']
                avg_vy += math.sin(other['heading']) * other['speed']

        if not neighbors:
            return 0.0, 0.0

        count = len(neighbors)
        center_x /= count
        center_y /= count
        avg_vx /= count
        avg_vy /= count

        # Cohesion towards center of connected cluster
        dx = center_x - pos_x
        dy = center_y - pos_y
        dist_to_center = math.hypot(dx, dy)
        cohesion_fx = 0.0
        cohesion_fy = 0.0
        if dist_to_center > 40.0:
            cohesion_fx = (dx / dist_to_center) * cohesion_weight * 5.0
            cohesion_fy = (dy / dist_to_center) * cohesion_weight * 5.0

        # Alignment
        align_fx = avg_vx * 0.1
        align_fy = avg_vy * 0.1

        return cohesion_fx + align_fx, cohesion_fy + align_fy
