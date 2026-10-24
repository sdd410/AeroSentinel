# MASTER BUILD PROMPT: Security & Surveillance Using Swarm Drones

## 1. Project Overview

Build a complete, interactive MVP called **AeroSentinel — Autonomous Drone Swarm Surveillance Simulator**.

The application simulates multiple autonomous drones coordinating to monitor a designated area. It visualizes their positions, flight paths, fields of view, coverage areas, obstacles, no-fly zones, and detected objects on a real-time 2D map.

The system must implement working algorithms for multi-agent coordination, path planning, collision avoidance, area coverage, simulated object detection, and event tracking.

**Important:** This is a software-only simulation MVP. Do not require physical drones, flight controllers, cameras, external hardware, or paid APIs. The simulation must be functional using locally generated data.

The architecture should allow future integration with real drone hardware through a separate adapter interface, without requiring hardware integration now.

## 2. Primary Objectives

1. Build a visually polished, dark-themed surveillance dashboard.
2. Implement an actual 2D simulation engine rather than a pre-rendered animation.
3. Make all meaningful simulation parameters adjustable through the UI.
4. Coordinate multiple simulated drones using configurable algorithms.
5. Detect and track simulated people and vehicles using a configurable detection pipeline.
6. Display live drone telemetry, object detections, alerts, and simulation logs.
7. Support starting, pausing, resuming, resetting, and stepping through the simulation.
8. Allow users to save, load, export, and import simulation configurations.
9. Keep the code modular, testable, maintainable, and easy to extend.

## 3. Recommended Technology Stack

Use the following stack unless the existing repository has a strong reason to use an alternative.

### Frontend
- React with TypeScript.
- Vite for development and production builds.
- Tailwind CSS for styling.
- shadcn/ui for accessible UI primitives.
- Lucide icons.
- HTML Canvas for the main real-time 2D simulation.
- Zustand for application and simulation UI state.
- Recharts for optional historical telemetry charts.

### Backend
- Python 3.12 or a compatible installed Python version.
- FastAPI for the REST API.
- WebSockets for real-time simulation updates.
- Pydantic for validated configuration models.
- NumPy for vector calculations and simulation math.
- pytest for backend testing.

### Optional Computer Vision
- OpenCV and Ultralytics YOLO as an optional, pluggable detection backend.
- Provide a built-in deterministic simulated detector so the application works without downloading model weights.
- Do not claim real AI detection when running the simulated detector.
- Do not make the application depend on GPU acceleration.

### Development and Tooling
- Docker and Docker Compose.
- ESLint and Prettier for frontend quality.
- Ruff and pytest for Python quality.
- Environment variables for runtime configuration.
- A README with setup, architecture, and troubleshooting instructions.

First inspect the existing repository and installed tooling. Reuse compatible dependencies and conventions rather than replacing working infrastructure unnecessarily.

## 4. Application Layout and Visual Design

Create a professional, dense, dark command-center dashboard optimized for desktop screens.

Visual direction:
- Deep navy background.
- Slightly lighter navy panels.
- Subtle borders and restrained shadows.
- Cyan and blue for drones, routes, and telemetry.
- Green for active coverage and healthy status.
- Amber for warnings and investigation states.
- Red for detected objects, critical alerts, and prohibited areas.
- Consistent spacing, typography, and compact controls.
- Smooth, meaningful animations without excessive visual effects.
- Responsive layout that remains usable on smaller screens.

### Header

Display:
- AeroSentinel logo and application title.
- Subtitle: Autonomous Coordination · Intelligent Coverage · Simulated Detection.
- Current simulation state.
- Elapsed simulation time.
- Simulation speed indicator.
- Start, pause/resume, and reset controls.
- Settings access.

### Left Sidebar: Simulation Controls

Organize controls into collapsible sections.

**A. Environment**
- Map width and height.
- Grid visibility and grid spacing.
- Obstacle visibility.
- No-fly zone visibility.
- Target visibility.
- Terrain or environment preset.
- Add, move, resize, and delete supported map entities.
- Clear environment and restore defaults.

**B. Swarm Configuration**
- Number of drones.
- Initial drone placement.
- Formation: dynamic, line, grid, or circle.
- Minimum drone separation.
- Communication range.
- Maximum speed.
- Acceleration limit.
- Turning-rate limit.
- Battery capacity and consumption rate.
- Drone sensor field of view.
- Detection range.

**C. Detection and Tracking**
- Detection mode: simulated or optional local vision.
- Detection range.
- Detection confidence threshold.
- Object classes: person and vehicle.
- Track timeout.
- Detection update interval.
- Alert confidence threshold.
- Detection noise or uncertainty, if supported.

**D. Flight-Path Algorithm**
- Algorithm: A*, waypoint navigation, or coverage-based navigation.
- Replanning interval.
- Path smoothing toggle.
- Obstacle avoidance toggle.
- Collision avoidance mode.
- Coverage strategy.
- Target assignment strategy.
- Formation maintenance strength.
- Separation and cohesion weights.

**E. Simulation Settings**
- Simulation time step.
- Simulation speed.
- Random seed.
- Auto-pause on critical events.
- Show drone trails.
- Show sensor coverage.
- Show communication links.
- Show predicted paths.
- Deterministic replay option.

Every control must update the actual simulation configuration and affect simulation behavior. Do not create decorative sliders or controls that have no effect.

Use sensible defaults and enforce validation rules. Explain invalid values inline.

Include a Reset to Defaults action.

## 5. Main 2D Simulation Canvas

The central panel is the application's primary visualization.

Render a top-down 2D environment containing:
- Roads, buildings, vegetation, and simple environmental structures.
- Configurable rectangular and polygonal obstacles.
- Configurable no-fly zones.
- Drone markers with unique identifiers.
- Current drone headings and movement directions.
- Planned flight paths.
- Actual movement trails.
- Sensor field-of-view cones.
- Circular or configurable sensor coverage areas.
- Simulated people and vehicle targets.
- Detection bounding boxes and confidence labels.
- Drone-to-drone communication links.
- Selected drone highlighting.
- Scale indicator, coordinate grid, and compass.
- Coverage heatmap or explored-area overlay.

Implement:
- Pan and zoom.
- Fit map to viewport.
- Select a drone or target.
- Click a drone to inspect telemetry.
- Toggle visualization layers.
- Add or remove supported entities in edit mode.
- Inspect coordinates by moving the pointer.
- Distinguish planned routes from actual trajectories.

The rendering must update continuously while the simulation runs. Keep rendering separate from simulation state so rendering does not alter the underlying physics.

Use world coordinates for simulation logic and convert them to screen coordinates for rendering. Ensure that zooming and panning do not change the simulated positions.

Use Canvas efficiently and avoid unnecessary React re-renders on every simulation frame.

## 6. Simulation Engine

Implement a proper simulation engine independent of the frontend.

Each simulation tick should perform a predictable sequence:

1. Read the active configuration.
2. Update drone objectives and assignments.
3. Recalculate paths when required.
4. Calculate desired drone velocities.
5. Apply acceleration and turning constraints.
6. Apply obstacle and inter-drone collision avoidance.
7. Update drone positions and headings.
8. Update battery consumption.
9. Calculate sensor coverage.
10. Process target visibility and simulated detections.
11. Update object tracks and alerts.
12. Calculate telemetry and coverage statistics.
13. Publish the latest simulation snapshot.

Use a fixed simulation time step, with a separate wall-clock scheduler. Avoid coupling simulation correctness to browser rendering speed.

Implement start, pause, resume, reset, and single-step operations.

Provide deterministic results when the same configuration and random seed are used.

Prevent invalid states such as NaN coordinates, negative battery percentages, impossible map positions, and drones becoming stuck indefinitely.

The simulation must support multiple drones, multiple targets, obstacles, and no-fly zones.

## 7. Drone Coordination Algorithms

Implement and document the following algorithms.

### A. Path Planning
- A* pathfinding on a configurable occupancy grid.
- Obstacle inflation based on drone radius and safety margin.
- Waypoint following.
- Optional path smoothing.
- Configurable replanning interval.
- No-fly-zone avoidance.
- A fallback or failure state when no valid path exists.

### B. Swarm Coordination
- Independent drone agents.
- Configurable formations.
- Separation to reduce inter-drone collisions.
- Cohesion and formation maintenance.
- Configurable communication range.
- Distributed or centralized task assignment as a selectable strategy.
- Reassignment when a drone becomes unavailable.
- Graceful degradation when communication links are unavailable.

Implement a simple, understandable baseline first. Do not pretend the swarm is fully decentralized unless the implementation actually is.

### C. Area Coverage
- Divide the surveillance area into cells.
- Track which cells have been observed.
- Assign exploration or coverage objectives to drones.
- Prefer uncovered regions when selecting new waypoints.
- Avoid redundant coverage where practical.
- Reassign regions when a drone is paused or unavailable.
- Calculate coverage percentage and uncovered regions.

### D. Collision Avoidance
- Enforce configurable minimum separation.
- Detect predicted path conflicts.
- Apply separation forces or another documented avoidance strategy.
- Avoid static obstacles and prohibited areas.
- Replan when local avoidance cannot find a safe path.
- Raise a warning if no safe path exists.

Keep algorithm implementations in separate modules so they can be tested and compared.

## 8. Object Detection and Tracking

The initial MVP must work without real camera feeds.

Implement a pluggable detection interface with two modes.

### Mode 1: Simulated Detector

Generate moving target entities in the environment.

Each target contains:
- Unique ID.
- Class: person or vehicle.
- World position.
- Velocity or movement pattern.
- Bounding-box dimensions.
- Visibility state.
- Optional deterministic random movement.

A drone may detect a target when the target falls within its configured detection range and field of view, subject to visibility and configured detection uncertainty.

Generate detections containing:
- Target ID when available.
- Object class.
- Confidence score.
- Estimated position.
- Detection timestamp.
- Observing drone ID.

Apply the confidence threshold and update target tracks across frames.

The UI must clearly label this mode as **SIMULATED DETECTION**.

### Mode 2: Optional Local Vision Adapter

Define a detector interface that can later accept a local video source and an installed object-detection model.

Do not make this mode mandatory. If model weights, dependencies, or video input are unavailable, provide a clear configuration error and retain simulated mode.

Do not represent synthetic target detections as genuine camera-based AI predictions.

### Tracking

Implement:
- Track creation and updating.
- Duplicate detection handling.
- Configurable track expiration.
- Last-seen timestamps.
- Observing drone attribution.
- Confidence history.
- Object position history.
- Track status: active, stale, or lost.

Keep all initial targets synthetic and confined to the simulated environment.

## 9. Right Sidebar: Live Status Panels

### A. Drone Status Table

For every drone, display:
- Drone ID.
- Battery percentage.
- Operational status.
- Position X and Y.
- Speed.
- Heading.
- Current assigned objective.
- Coverage contribution.

Possible statuses:
- Idle.
- Patrolling.
- Navigating.
- Investigating.
- Returning.
- Low Battery.
- Paused.
- Unavailable.

Clicking a row selects the corresponding drone on the map.

### B. Detected Objects

Display:
- Object ID.
- Object type.
- Confidence.
- Position.
- First-seen and last-seen timestamps.
- Observing drone.
- Track status.

Selecting a detection highlights its location and associated drone.

### C. Alerts

Create an event-driven alert system.

Example alerts:
- Simulated person detected.
- Simulated vehicle detected.
- Drone battery low.
- Drone communication link lost.
- Obstacle avoidance activated.
- No valid path found.
- No-fly-zone boundary violation prevented.
- Coverage objective completed.
- Drone separation threshold approached.

Each alert should include severity, timestamp, relevant entity, and a short description.

Allow users to acknowledge alerts and filter by severity.

### D. Coverage Metrics

Show:
- Overall area coverage percentage.
- Unique cells explored.
- Active drones.
- Active tracked targets.
- Average drone battery.
- Mission elapsed time.
- Detection count.
- Alerts by severity.

Calculate these values from actual simulation state, not hardcoded examples.

## 10. Bottom Panels

### Simulation Event Log

Provide a chronological, scrollable event stream containing:
- Simulation start and pause events.
- Drone state changes.
- Path replanning.
- Detection and tracking events.
- Battery warnings.
- Coverage updates.
- Avoidance events.
- Configuration changes.

Add timestamp, severity, source, and message.

Support filtering and clearing the visible log. Clearing the log must not silently reset the simulation.

### Selected Drone View

Show a focused view of the selected drone, including:
- Drone ID.
- Position.
- Heading.
- Battery.
- Speed.
- Current objective.
- Field of view.
- Visible simulated targets.

For the initial MVP, represent this as a simulated sensor view or a top-down sensor visualization. Do not fabricate a real camera feed.

## 11. Configuration Management

Implement fully functional presets.

Provide built-in examples:
1. Small Area Patrol.
2. Urban Block Surveillance.
3. Wide Area Coverage.
4. Dense Obstacle Environment.
5. Multi-Target Tracking.
6. Battery-Constrained Mission.

Each preset should specify the complete relevant simulation configuration.

Users must be able to:
- Save a custom preset.
- Load a preset.
- Duplicate a preset.
- Rename a preset.
- Delete a custom preset.
- Export configuration as JSON.
- Import and validate JSON.
- Restore the default configuration.

Persist user-created presets locally for the MVP, using browser storage or another appropriate local persistence mechanism.

Validate imported configuration data before applying it.

Clearly distinguish saved configuration from live simulation state. Changing a preset must not unexpectedly mutate an active simulation unless the user confirms applying it.

## 12. Backend API and Real-Time Communication

Implement a clean FastAPI backend.

Suggested endpoints:

- GET /api/health
- GET /api/config/defaults
- GET /api/presets
- POST /api/simulation/start
- POST /api/simulation/pause
- POST /api/simulation/resume
- POST /api/simulation/reset
- POST /api/simulation/step
- GET /api/simulation/state
- PATCH /api/simulation/config
- GET /api/simulation/metrics
- GET /api/simulation/events
- WebSocket /ws/simulation

Use Pydantic schemas for configuration, state, events, drones, targets, and detections.

Use a single authoritative simulation engine on the backend. The frontend should render snapshots received from the backend rather than running a competing simulation.

The backend must safely handle repeated start/pause/reset requests, disconnecting clients, malformed configurations, and concurrent API calls.

Use WebSockets to publish periodic snapshots and events. Avoid sending excessive data every simulation tick; implement configurable publication frequency and reasonable message sizes.

Include a clear error response format and useful API documentation.

## 13. Safety and Simulation Boundaries

This is a research, visualization, and software engineering prototype.

For the MVP:
- Do not connect to real drones.
- Do not implement autonomous physical flight commands.
- Do not implement real-world target identification or facial recognition.
- Do not integrate weapon systems.
- Do not treat simulated detection coordinates as real-world coordinates.
- Do not silently convert simulation configuration into hardware commands.

Keep the hardware integration layer as an interface only. Any future physical deployment must be a separate, explicitly reviewed engineering phase with appropriate authorization, fail-safes, and operational testing.

## 14. Architecture and Project Structure

Organize the code by responsibility rather than placing the entire application in a single file.

A suggested structure:

```text
aerosentinel/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── simulation/
│   │   │   ├── controls/
│   │   │   ├── drone-status/
│   │   │   ├── detections/
│   │   │   ├── alerts/
│   │   │   └── logs/
│   │   ├── canvas/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── simulation/
│   │   │   ├── engine.py
│   │   │   ├── drone.py
│   │   │   ├── environment.py
│   │   │   ├── path_planning.py
│   │   │   ├── coordination.py
│   │   │   ├── collision_avoidance.py
│   │   │   ├── coverage.py
│   │   │   └── telemetry.py
│   │   ├── detection/
│   │   │   ├── base.py
│   │   │   ├── simulated.py
│   │   │   └── tracking.py
│   │   ├── events/
│   │   └── config/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── .gitignore
```

Adjust this structure if the existing repository already follows a sound architecture.

## 15. Testing Requirements

Write automated tests for:

### Simulation Engine
- Correct start, pause, resume, reset, and single-step behavior.
- Deterministic execution with a fixed seed.
- Valid coordinates and bounded movement.
- Battery consumption and state transitions.

### Path Planning
- A* finds a valid path when one exists.
- Paths avoid configured obstacles.
- No-fly zones are respected.
- Unreachable goals produce a valid failure result.

### Coordination
- Drones respond to assigned objectives.
- Formation settings affect behavior.
- Separation rules reduce collision risks.
- Unavailable drones trigger reassignment.

### Coverage
- Coverage increases as cells are observed.
- Coverage percentage stays between 0 and 100.
- Coverage assignments respond to changing drone availability.

### Detection
- Targets inside sensor range can be detected.
- Targets outside range are not detected.
- Confidence thresholds filter detections.
- Tracks expire after the configured timeout.
- Simulated detections are correctly labeled.

### API and Frontend
- Invalid configurations are rejected.
- API state matches simulation state.
- WebSocket clients receive valid snapshots.
- Controls update the intended settings.
- Presets can be saved and loaded.
- The dashboard handles empty, paused, and error states.

Run the tests and fix failures rather than merely creating test files.

## 16. Performance and Reliability

- Keep the simulation responsive with a reasonable number of drones and targets.
- Make the default scenario run smoothly on an ordinary developer laptop.
- Separate simulation timing from rendering and network publishing.
- Use typed interfaces and validated data contracts.
- Handle WebSocket disconnections and reconnections.
- Clean up background tasks on application shutdown.
- Avoid unbounded event logs and telemetry histories.
- Add sensible limits for drone count, map size, and target count.
- Expose simulation errors in a user-friendly way.
- Avoid excessive abstractions and unnecessary dependencies.

## 17. MVP Acceptance Criteria

The MVP is complete only when all of the following work:

1. The application starts locally using documented instructions.
2. The dashboard displays a real, interactive 2D environment.
3. At least eight simulated drones can be coordinated.
4. Drones move continuously according to actual simulation logic.
5. Drone positions, headings, paths, and coverage areas update live.
6. The user can change the number of drones, their speed, sensor range, formation, and algorithm settings.
7. Changes to applicable parameters produce observable changes in simulation behavior.
8. Drones navigate around obstacles and respect no-fly zones.
9. Coverage metrics update based on explored areas.
10. Synthetic people and vehicles can be detected and tracked.
11. Drone status, detections, alerts, and event logs show real simulation data.
12. Start, pause, resume, reset, and single-step controls work correctly.
13. Configuration presets can be saved, loaded, exported, and imported.
14. Backend tests pass, and the frontend builds successfully.
15. The README contains setup steps, architecture, algorithm explanations, limitations, and troubleshooting instructions.

Do not mark a feature complete if it is only a visual placeholder.

## 18. Implementation Workflow

Work directly in the current repository.

**Phase 1 — Repository Inspection**
- Inspect existing files, dependencies, scripts, and conventions.
- Identify what already exists.
- Produce a short implementation plan.
- Do not overwrite unrelated work.

**Phase 2 — Functional Simulation Core**
- Define data models and configuration validation.
- Implement the simulation engine.
- Implement movement, pathfinding, coverage, and collision avoidance.
- Implement simulated detections and tracking.
- Write and run backend tests.

**Phase 3 — Dashboard**
- Build the visual layout and component hierarchy.
- Implement the interactive Canvas renderer.
- Connect controls to the real backend configuration.
- Render live drone state, coverage, detections, and obstacles.
- Implement the status panels, alerts, logs, and metrics.

**Phase 4 — Real-Time Integration**
- Connect REST endpoints and WebSockets.
- Implement simulation controls and configuration updates.
- Handle reconnections, validation errors, and lifecycle edge cases.

**Phase 5 — Presets and Polish**
- Add built-in and custom presets.
- Add import/export.
- Refine responsiveness, loading states, and error messages.
- Optimize rendering and event publishing.

**Phase 6 — Verification**
- Run backend tests.
- Run frontend linting and production build.
- Run the complete application locally.
- Verify the acceptance criteria manually.
- Fix the issues discovered.

## 19. How to Work as a Coding Agent

Do not stop after generating a plan or a static mockup.

Implement the project incrementally and keep the application runnable throughout development.

Before adding dependencies, check whether an equivalent capability already exists.

Do not replace functioning files without understanding their purpose.

Avoid giant components, duplicated simulation logic, hardcoded dashboard metrics, fake control behavior, and silent exception handling.

Use meaningful names, type annotations, focused modules, logging, and automated tests.

If a requirement is ambiguous, choose the simplest defensible implementation, document the decision, and continue.

If the full scope cannot be completed in one pass, prioritize a fully working end-to-end MVP over partially implemented advanced features.

At the end, report:
- Features implemented.
- Algorithms implemented.
- Files and modules created.
- Commands to install and run the application.
- Tests and build results.
- Known limitations.
- Recommended next steps.

**Final instruction:** Start by inspecting the repository. Then implement and verify a working AeroSentinel simulation dashboard with genuine interactive behavior. Do not finish with a proposal, design document, or screenshot alone.