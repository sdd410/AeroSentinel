# AeroSentinel — Autonomous Drone Swarm Surveillance Simulator

AeroSentinel is an interactive 2D simulation platform for coordinating multi-agent autonomous drone swarms in security and surveillance missions. It models swarm coordination, A* obstacle avoidance, area coverage exploration, line-of-sight sensor fields of view, and synthetic target tracking in real time.

---

## 🌟 Key Features

- **Interactive 2D Canvas Simulator**:
  - Pan, zoom, and fit-to-viewport navigation.
  - Layer toggles: Sensor FOV cones, drone movement trails, communication mesh links, planned flight paths, explored coverage heatmap, and coordinate grid.
  - Interactive selection of drones and detected targets with real-time HUD coordinate inspection.
- **Drone Coordination & Swarm Formations**:
  - Supports 1 to 16+ coordinated drone agents with configurable minimum separation.
  - Formations: **Dynamic Dispersion**, **Line Formation**, **Grid Array**, and **Perimeter Circle**.
  - Dynamic communication mesh: Drones compute local mesh graphs based on Euclidean communication range.
- **Path Planning & Collision Avoidance**:
  - **A\* Grid Pathfinding** on an occupancy grid with configurable safety obstacle inflation.
  - **Path Smoothing** via line-of-sight shortcutting.
  - **Artificial Potential Field (APF) & Reynolds Boids Repulsion** for dynamic inter-drone collision avoidance and no-fly-zone boundary clearance.
- **Autonomous Area Coverage**:
  - Grid cell decomposition tracking explored territory in real time.
  - Frontier waypoint planning directing drones to unobserved sectors while minimizing redundancy.
- **Pluggable Sensor & Object Tracking**:
  - Geometric sensor cones with angle/range filtering and raycast line-of-sight occlusion behind buildings.
  - Multi-target tracker with nearest-neighbor association, state smoothing, and lifecycle states (`active`, `stale`, `lost`).
- **Telemetry & Event-Driven Alerting**:
  - Live avionics table (speed, heading, battery drain, status, objectives).
  - Categorized alerts (`info`, `warning`, `critical`) with interactive acknowledgment.
  - Chronological, filterable mission operations event stream.
- **Preset Management**:
  - Six built-in presets: *Urban Block Surveillance*, *Small Area Patrol*, *Wide Area Coverage*, *Dense Obstacle Environment*, *Multi-Target Tracking*, and *Battery-Constrained Mission*.
  - Full JSON export and validation import for mission configurations.

---

## 🏗️ Architecture & Project Structure

The project strictly decouples backend simulation math from frontend rendering via high-frequency WebSockets:

```text
swarm-drone/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & lifespan management
│   │   ├── api/
│   │   │   ├── routes.py            # REST endpoints & WebSocket broadcasting
│   │   ├── schemas/
│   │   │   ├── models.py            # Pydantic schemas for state, config & telemetry
│   │   ├── simulation/
│   │   │   ├── engine.py            # Authoritative fixed-Δt simulation engine
│   │   │   ├── drone.py             # Drone kinematics & battery drain dynamics
│   │   │   ├── environment.py       # Occupancy grid, obstacle inflation & raycasting
│   │   │   ├── path_planning.py     # A* grid search & path smoothing
│   │   │   ├── coordination.py      # Swarm formations & mesh communication graph
│   │   │   ├── collision_avoidance.py # APF inter-drone & obstacle repulsion
│   │   │   └── coverage.py          # Cell coverage matrix & frontier explorer
│   │   ├── detection/
│   │   │   ├── base.py              # Base detector interface
│   │   │   ├── simulated.py         # Synthetic moving targets & FOV occlusion
│   │   │   └── tracking.py          # Multi-target tracker
│   │   ├── events/
│   │   │   └── event_manager.py     # Alert queue & severity event logging
│   │   └── config/
│   │       └── presets.py           # Mission presets
│   ├── tests/                       # Automated pytest suite (17 tests)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/              # High-performance 2D Canvas renderer
│   │   │   ├── controls/            # Collapsible sidebar mission parameters
│   │   │   ├── dashboard/           # Header bar, playback controls, preset selector
│   │   │   ├── drone-status/        # Live drone status table
│   │   │   ├── detections/          # Detected objects & tracks list
│   │   │   ├── alerts/              # Mission alert feed
│   │   │   ├── metrics/             # Area coverage progress bar & stats
│   │   │   └── logs/                # Event stream log
│   │   ├── stores/                  # Zustand simulation state store
│   │   ├── services/                # REST & WebSocket client
│   │   └── types/                   # TypeScript interfaces
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** & **npm**
- Or **Docker & Docker Compose**

---

### Option 1: One-Command Launcher (Recommended)

Run either of the following from the project root:
```bash
./start.sh
```
or
```bash
npm start
```
This automatically verifies dependencies, starts both the FastAPI backend (`:8000`) and the React dashboard (`:5173`), and handles clean process shutdown on `Ctrl+C`.

To stop all running services anytime with a single command:
```bash
./stop.sh
```
or
```bash
npm run stop
```

---

### Option 2: Running Services Manually

#### 1. Start the Backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start the Frontend:
In a separate terminal:
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

### Option 2: Running with Docker Compose

```bash
docker-compose up --build
```
Access the dashboard at **`http://localhost:3000`** and the API at **`http://localhost:8000/docs`**.

---

## 🧪 Testing & Verification

The backend includes a comprehensive automated test suite testing the simulation engine, path planning, obstacle avoidance, swarm coordination, coverage calculation, detection, and API endpoints:

```bash
cd backend
./venv/bin/pytest -v
```

All **17 tests pass** cleanly:
```text
tests/test_api.py::test_api_health PASSED
tests/test_api.py::test_api_presets PASSED
tests/test_api.py::test_api_simulation_controls PASSED
tests/test_api.py::test_api_state_and_metrics PASSED
tests/test_coordination.py::test_swarm_formations PASSED
tests/test_coordination.py::test_comm_links_mesh PASSED
tests/test_coordination.py::test_collision_avoidance_repulsion PASSED
tests/test_coverage.py::test_coverage_accumulation PASSED
tests/test_coverage.py::test_frontier_waypoint_selection PASSED
tests/test_detection.py::test_simulated_detection_fov_and_range PASSED
tests/test_detection.py::test_tracker_lifecycle_and_expiration PASSED
tests/test_engine.py::test_engine_initialization PASSED
tests/test_engine.py::test_engine_lifecycle_and_stepping PASSED
tests/test_engine.py::test_deterministic_execution PASSED
tests/test_path_planning.py::test_astar_clear_path PASSED
tests/test_path_planning.py::test_astar_obstacle_avoidance PASSED
tests/test_path_planning.py::test_astar_unreachable_goal_handling PASSED
============================== 17 passed in 0.45s ==============================
```

Frontend production build check:
```bash
cd frontend
npm run build
```
Builds cleanly with zero errors.

---

## 🛡️ Safety & Simulation Boundaries

This is a research and simulation engineering MVP:
- No physical drone hardware, flight controllers, or camera hardware are required or connected.
- All detections, targets, coordinates, and telemetry are synthetically simulated within the sandbox environment.
- Hardware adapters should only be introduced in a dedicated, isolated hardware-in-the-loop (HIL) phase.
