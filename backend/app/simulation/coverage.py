import numpy as np
import math
from typing import List, Tuple, Optional
from .environment import Environment


class CoverageManager:
    def __init__(self, env: Environment, rng: Optional[np.random.Generator] = None):
        self.env = env
        self.rng = rng or np.random.default_rng(42)
        # 0 = unvisited, >0 = visit count / last visit timestamp
        self.visit_grid = np.zeros((env.rows, env.cols), dtype=np.float32)
        # Track valid operational cells (excluding obstacles and no-fly zones)
        self.valid_cell_mask = (env.occupancy_grid == 0)
        self.total_valid_cells = int(np.sum(self.valid_cell_mask))

    def reset(self):
        self.visit_grid.fill(0)
        self.valid_cell_mask = (self.env.occupancy_grid == 0)
        self.total_valid_cells = int(np.sum(self.valid_cell_mask))

    def record_coverage(
        self,
        drone_x: float,
        drone_y: float,
        heading: float,
        sensor_fov_deg: float,
        detection_range: float,
        sim_time: float,
    ) -> int:
        """Mark cells within drone sensor footprint (cone/sector) as covered."""
        c_drone, r_drone = self.env.world_to_grid(drone_x, drone_y)
        range_cells = int(np.ceil(detection_range / self.env.cell_size))
        fov_rad = math.radians(sensor_fov_deg)

        r_min = max(0, r_drone - range_cells)
        r_max = min(self.env.rows, r_drone + range_cells + 1)
        c_min = max(0, c_drone - range_cells)
        c_max = min(self.env.cols, c_drone + range_cells + 1)

        newly_covered = 0
        for r in range(r_min, r_max):
            for c in range(c_min, c_max):
                if not self.valid_cell_mask[r, c]:
                    continue

                cx, cy = self.env.grid_to_world(c, r)
                dx = cx - drone_x
                dy = cy - drone_y
                dist = math.hypot(dx, dy)

                if dist <= detection_range:
                    angle_to_cell = math.atan2(dy, dx)
                    angle_diff = (angle_to_cell - heading + math.pi) % (2 * math.pi) - math.pi
                    if abs(angle_diff) <= (fov_rad / 2.0):
                        # Line of sight check
                        if self.env.line_of_sight(drone_x, drone_y, cx, cy):
                            if self.visit_grid[r, c] == 0:
                                newly_covered += 1
                            self.visit_grid[r, c] = sim_time

        return newly_covered

    def get_coverage_percentage(self) -> float:
        if self.total_valid_cells == 0:
            return 100.0
        visited_count = np.count_nonzero(self.visit_grid * self.valid_cell_mask)
        return round(float(visited_count / self.total_valid_cells * 100.0), 2)

    def get_explored_cells_indices(self) -> List[int]:
        """Returns 1D indices of explored valid cells for frontend rendering."""
        visited = (self.visit_grid > 0) & self.valid_cell_mask
        indices = np.flatnonzero(visited)
        return indices.tolist()

    def find_frontier_waypoint(
        self,
        drone_x: float,
        drone_y: float,
        sector_angle: Optional[float] = None,
        sector_spread: float = math.pi / 2.0,
    ) -> Optional[Tuple[float, float]]:
        """Find an unvisited or least-visited valid cell to explore."""
        unvisited = (self.visit_grid == 0) & self.valid_cell_mask
        r_idx, c_idx = np.where(unvisited)

        if len(r_idx) == 0:
            # If all visited, pick the oldest visited cell
            valid_visits = np.where(self.valid_cell_mask, self.visit_grid, np.inf)
            min_r, min_c = np.unravel_index(np.argmin(valid_visits), valid_visits.shape)
            return self.env.grid_to_world(min_c, min_r)

        # Score candidate frontiers by distance and sector alignment
        best_point = None
        best_score = float('inf')

        # Sample up to 50 candidates for performance
        sample_size = min(len(r_idx), 50)
        chosen_indices = self.rng.choice(len(r_idx), sample_size, replace=False)

        for idx in chosen_indices:
            r = r_idx[idx]
            c = c_idx[idx]
            gx, gy = self.env.grid_to_world(c, r)
            dx = gx - drone_x
            dy = gy - drone_y
            dist = math.hypot(dx, dy)

            # Avoid waypoints too close or too far
            if dist < 40.0:
                continue

            score = dist
            if sector_angle is not None:
                cell_angle = math.atan2(dy, dx)
                diff = abs((cell_angle - sector_angle + math.pi) % (2 * math.pi) - math.pi)
                if diff > sector_spread:
                    score += 500.0

            if score < best_score:
                best_score = score
                best_point = (gx, gy)

        if best_point is None and len(r_idx) > 0:
            rand_pick = int(self.rng.integers(0, len(r_idx)))
            best_point = self.env.grid_to_world(c_idx[rand_pick], r_idx[rand_pick])

        return best_point
