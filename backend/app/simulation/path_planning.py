import heapq
import math
from typing import List, Tuple, Optional
from .environment import Environment


class Node:
    __slots__ = ('c', 'r', 'g', 'h', 'f', 'parent')

    def __init__(self, c: int, r: int, g: float = float('inf'), h: float = 0.0, parent=None):
        self.c = c
        self.r = r
        self.g = g
        self.h = h
        self.f = g + h
        self.parent = parent

    def __lt__(self, other):
        return self.f < other.f


class AStarPlanner:
    def __init__(self, env: Environment):
        self.env = env
        # 8-connectivity with diagonal movement
        self.directions = [
            (0, 1, 1.0),
            (0, -1, 1.0),
            (1, 0, 1.0),
            (-1, 0, 1.0),
            (1, 1, 1.4142),
            (1, -1, 1.4142),
            (-1, 1, 1.4142),
            (-1, -1, 1.4142),
        ]

    def plan(
        self,
        start_x: float,
        start_y: float,
        goal_x: float,
        goal_y: float,
        smooth: bool = True,
    ) -> Optional[List[Tuple[float, float]]]:
        """A* path planning from start to goal in world coordinates."""
        start_c, start_r = self.env.world_to_grid(start_x, start_y)
        goal_c, goal_r = self.env.world_to_grid(goal_x, goal_y)

        # Check start and goal bounds
        if not (0 <= start_c < self.env.cols and 0 <= start_r < self.env.rows):
            return None
        if not (0 <= goal_c < self.env.cols and 0 <= goal_r < self.env.rows):
            return None

        goal_adjusted = False
        # If goal is inside obstacle or NFZ, find the closest free cell
        if self.env.inflated_grid[goal_r, goal_c] == 1:
            closest_free = self._find_nearest_free_cell(goal_c, goal_r)
            if not closest_free:
                return None
            goal_c, goal_r = closest_free
            goal_adjusted = True

        # Priority queue
        open_set = []
        start_h = self._heuristic(start_c, start_r, goal_c, goal_r)
        start_node = Node(start_c, start_r, g=0.0, h=start_h)
        heapq.heappush(open_set, start_node)

        g_scores = {(start_c, start_r): 0.0}
        closed_set = set()

        max_iterations = 4000
        iterations = 0

        while open_set and iterations < max_iterations:
            iterations += 1
            current = heapq.heappop(open_set)

            if current.c == goal_c and current.r == goal_r:
                path_grid = self._reconstruct_path(current)
                world_path = [self.env.grid_to_world(c, r) for c, r in path_grid]
                # Replace head with exact start, tail with exact goal
                world_path[0] = (start_x, start_y)
                if goal_adjusted:
                    world_path[-1] = self.env.grid_to_world(goal_c, goal_r)
                else:
                    world_path[-1] = (goal_x, goal_y)
                if smooth and len(world_path) > 2:
                    return self.smooth_path(world_path)
                return world_path

            closed_set.add((current.c, current.r))

            for dc, dr, cost in self.directions:
                nc = current.c + dc
                nr = current.r + dr

                if not (0 <= nc < self.env.cols and 0 <= nr < self.env.rows):
                    continue

                if self.env.inflated_grid[nr, nc] == 1:
                    continue

                if (nc, nr) in closed_set:
                    continue

                tentative_g = current.g + cost * self.env.cell_size

                if (nc, nr) not in g_scores or tentative_g < g_scores[(nc, nr)]:
                    g_scores[(nc, nr)] = tentative_g
                    h = self._heuristic(nc, nr, goal_c, goal_r)
                    neighbor = Node(nc, nr, g=tentative_g, h=h, parent=current)
                    heapq.heappush(open_set, neighbor)

        # No path found
        return None

    def _heuristic(self, c1: int, r1: int, c2: int, r2: int) -> float:
        # Euclidean distance heuristic in meters
        dx = (c1 - c2) * self.env.cell_size
        dy = (r1 - r2) * self.env.cell_size
        return math.hypot(dx, dy)

    def _reconstruct_path(self, node: Node) -> List[Tuple[int, int]]:
        path = []
        curr = node
        while curr:
            path.append((curr.c, curr.r))
            curr = curr.parent
        path.reverse()
        return path

    def _find_nearest_free_cell(self, c: int, r: int, max_radius: int = 15) -> Optional[Tuple[int, int]]:
        for radius in range(1, max_radius):
            for dc in range(-radius, radius + 1):
                for dr in range(-radius, radius + 1):
                    nc, nr = c + dc, r + dr
                    if 0 <= nc < self.env.cols and 0 <= nr < self.env.rows:
                        if self.env.inflated_grid[nr, nc] == 0:
                            return nc, nr
        return None

    def smooth_path(self, path: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Greedy raycast shortcutting to eliminate jagged grid staircases."""
        if len(path) <= 2:
            return path

        smoothed = [path[0]]
        current_idx = 0

        while current_idx < len(path) - 1:
            farthest_visible = current_idx + 1
            for next_idx in range(len(path) - 1, current_idx + 1, -1):
                p1 = path[current_idx]
                p2 = path[next_idx]
                # Test line of sight clearance
                if self._clear_line(p1[0], p1[1], p2[0], p2[1]):
                    farthest_visible = next_idx
                    break
            smoothed.append(path[farthest_visible])
            current_idx = farthest_visible

        return smoothed

    def _clear_line(self, x1: float, y1: float, x2: float, y2: float, step: float = 10.0) -> bool:
        dist = math.hypot(x2 - x1, y2 - y1)
        if dist == 0:
            return True
        steps = max(1, int(dist / step))
        for i in range(1, steps):
            t = i / steps
            x = x1 + t * (x2 - x1)
            y = y1 + t * (y2 - y1)
            if self.env.is_blocked(x, y, radius=12.0):
                return False
        return True
