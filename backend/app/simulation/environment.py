import numpy as np
from typing import List, Tuple, Optional
from ..schemas.models import EnvironmentConfig, Obstacle, NoFlyZone


class Environment:
    def __init__(self, config: EnvironmentConfig):
        self.config = config
        self.width = config.width
        self.height = config.height
        self.cell_size = config.grid_cell_size
        
        self.cols = int(np.ceil(self.width / self.cell_size))
        self.rows = int(np.ceil(self.height / self.cell_size))
        
        # 0 = free, 1 = obstacle or no-fly zone
        self.occupancy_grid = np.zeros((self.rows, self.cols), dtype=np.uint8)
        self.inflated_grid = np.zeros((self.rows, self.cols), dtype=np.uint8)
        
        self.obstacles: List[Obstacle] = config.obstacles.copy()
        self.no_fly_zones: List[NoFlyZone] = config.no_fly_zones.copy()
        
        self.rebuild_grids()

    def rebuild_grids(self, drone_inflation_radius: float = 18.0):
        self.cols = int(np.ceil(self.width / self.cell_size))
        self.rows = int(np.ceil(self.height / self.cell_size))
        self.occupancy_grid = np.zeros((self.rows, self.cols), dtype=np.uint8)
        
        # Mark obstacles
        for obs in self.obstacles:
            self._fill_rect_on_grid(self.occupancy_grid, obs.x, obs.y, obs.width, obs.height)
            
        # Mark no-fly zones
        for nfz in self.no_fly_zones:
            self._fill_rect_on_grid(self.occupancy_grid, nfz.x, nfz.y, nfz.width, nfz.height)
            
        # Inflate for safe drone planning
        inflation_cells = int(np.ceil(drone_inflation_radius / self.cell_size))
        self.inflated_grid = self.occupancy_grid.copy()
        if inflation_cells > 0:
            r_idx, c_idx = np.where(self.occupancy_grid == 1)
            for r, c in zip(r_idx, c_idx):
                r_min = max(0, r - inflation_cells)
                r_max = min(self.rows, r + inflation_cells + 1)
                c_min = max(0, c - inflation_cells)
                c_max = min(self.cols, c + inflation_cells + 1)
                self.inflated_grid[r_min:r_max, c_min:c_max] = 1

    def _fill_rect_on_grid(self, grid: np.ndarray, x: float, y: float, w: float, h: float):
        col_start = max(0, int(x / self.cell_size))
        col_end = min(self.cols, int((x + w) / self.cell_size) + 1)
        row_start = max(0, int(y / self.cell_size))
        row_end = min(self.rows, int((y + h) / self.cell_size) + 1)
        grid[row_start:row_end, col_start:col_end] = 1

    def world_to_grid(self, x: float, y: float) -> Tuple[int, int]:
        c = int(np.clip(x / self.cell_size, 0, self.cols - 1))
        r = int(np.clip(y / self.cell_size, 0, self.rows - 1))
        return c, r

    def grid_to_world(self, c: int, r: int) -> Tuple[float, float]:
        x = (c + 0.5) * self.cell_size
        y = (r + 0.5) * self.cell_size
        return x, y

    def is_blocked(self, x: float, y: float, radius: float = 0.0) -> bool:
        """Check if a world coordinate (with optional safety radius) is inside an obstacle or NFZ."""
        if x - radius < 0 or x + radius > self.width or y - radius < 0 or y + radius > self.height:
            return True
            
        c, r = self.world_to_grid(x, y)
        if radius > 0:
            return bool(self.inflated_grid[r, c] == 1)
        return bool(self.occupancy_grid[r, c] == 1)

    def is_in_no_fly_zone(self, x: float, y: float) -> bool:
        for nfz in self.no_fly_zones:
            if nfz.x <= x <= nfz.x + nfz.width and nfz.y <= y <= nfz.y + nfz.height:
                return True
        return False

    def line_of_sight(self, x1: float, y1: float, x2: float, y2: float) -> bool:
        """Bresenham raycast line of sight check against obstacles only (ignoring NFZs for visibility)."""
        c1, r1 = self.world_to_grid(x1, y1)
        c2, r2 = self.world_to_grid(x2, y2)
        
        dc = abs(c2 - c1)
        dr = abs(r2 - r1)
        sc = 1 if c1 < c2 else -1
        sr = 1 if r1 < r2 else -1
        err = dc - dr
        
        curr_c, curr_r = c1, r1
        while True:
            # Check obstacle only
            for obs in self.obstacles:
                gx, gy = self.grid_to_world(curr_c, curr_r)
                if obs.x <= gx <= obs.x + obs.width and obs.y <= gy <= obs.y + obs.height:
                    return False
                    
            if curr_c == c2 and curr_r == r2:
                break
                
            e2 = 2 * err
            if e2 > -dr:
                err -= dr
                curr_c += sc
            if e2 < dc:
                err += dc
                curr_r += sr
                
        return True
