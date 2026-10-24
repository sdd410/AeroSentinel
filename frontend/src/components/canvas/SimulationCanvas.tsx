import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, Compass, Eye, ShieldAlert, Cpu } from "lucide-react";

export const SimulationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store bindings
  const snapshot = useSimulationStore((s) => s.snapshot);
  const config = useSimulationStore((s) => s.config);
  const layerToggles = useSimulationStore((s) => s.layerToggles);
  const selectedDroneId = useSimulationStore((s) => s.selectedDroneId);
  const selectedTargetId = useSimulationStore((s) => s.selectedTargetId);
  const selectDrone = useSimulationStore((s) => s.selectDrone);
  const selectTarget = useSimulationStore((s) => s.selectTarget);
  const setHoverCoords = useSimulationStore((s) => s.setHoverCoords);

  // Camera viewport transform
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Resize
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fit to viewport
  const fitToViewport = useCallback(() => {
    if (!config || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const mapW = config.environment.width;
    const mapH = config.environment.height;

    const scaleX = (cw - 60) / mapW;
    const scaleY = (ch - 60) / mapH;
    const newZoom = Math.min(scaleX, scaleY, 1.4);

    setZoom(newZoom);
    setPan({
      x: (cw - mapW * newZoom) / 2,
      y: (ch - mapH * newZoom) / 2,
    });
  }, [config]);

  useEffect(() => {
    if (config) {
      fitToViewport();
    }
  }, [config?.environment.width, config?.environment.height]);

  // World to Screen and Screen to World
  const worldToScreen = useCallback(
    (wx: number, wy: number) => ({
      sx: wx * zoom + pan.x,
      sy: wy * zoom + pan.y,
    }),
    [zoom, pan]
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      wx: (sx - pan.x) / zoom,
      wy: (sy - pan.y) / zoom,
    }),
    [zoom, pan]
  );

  // Mouse pan/zoom handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging.current) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }

    const { wx, wy } = screenToWorld(mouseX, mouseY);
    setHoverCoords({ x: Math.round(wx), y: Math.round(wy) });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      const movedX = Math.abs(e.clientX - (dragStart.current.x + pan.x));
      const movedY = Math.abs(e.clientY - (dragStart.current.y + pan.y));

      // Click detection if barely moved
      if (movedX < 5 && movedY < 5 && snapshot) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const { wx, wy } = screenToWorld(mouseX, mouseY);

          // Click drone test
          let clickedDrone = false;
          for (const d of snapshot.drones) {
            const dist = Math.hypot(d.x - wx, d.y - wy);
            if (dist < 25) {
              selectDrone(d.id);
              clickedDrone = true;
              break;
            }
          }

          if (!clickedDrone) {
            // Click target test
            for (const t of snapshot.targets) {
              const dist = Math.hypot(t.x - wx, t.y - wy);
              if (dist < 20) {
                selectTarget(t.id);
                clickedDrone = true;
                break;
              }
            }
          }

          if (!clickedDrone) {
            selectDrone(null);
            selectTarget(null);
          }
        }
      }
    }
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.2, Math.min(3.5, zoom * zoomFactor));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom centered at mouse position
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const mapWidth = config?.environment.width || 1000;
      const mapHeight = config?.environment.height || 700;
      const cellSize = config?.environment.grid_cell_size || 20;

      // 1. World Background & Map Boundary
      const mapTopLeft = worldToScreen(0, 0);
      const mapBottomRight = worldToScreen(mapWidth, mapHeight);
      const mapDrawW = mapWidth * zoom;
      const mapDrawH = mapHeight * zoom;

      // Outer boundary fill
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Operational Map area
      ctx.fillStyle = "#0c1424";
      ctx.fillRect(mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);

      // 2. Coordinate Grid
      if (layerToggles.grid) {
        ctx.strokeStyle = "rgba(31, 48, 84, 0.4)";
        ctx.lineWidth = 1;

        // Grid lines
        for (let gx = 0; gx <= mapWidth; gx += cellSize * 2) {
          const p1 = worldToScreen(gx, 0);
          const p2 = worldToScreen(gx, mapHeight);
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
        for (let gy = 0; gy <= mapHeight; gy += cellSize * 2) {
          const p1 = worldToScreen(0, gy);
          const p2 = worldToScreen(mapWidth, gy);
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
      }

      // Map border
      ctx.strokeStyle = "#1F3054";
      ctx.lineWidth = 2;
      ctx.strokeRect(mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);

      // 3. Explored Area Coverage Heatmap
      if (layerToggles.coverage && snapshot && snapshot.explored_cells) {
        const cols = Math.ceil(mapWidth / cellSize);
        ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
        for (const idx of snapshot.explored_cells) {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          const sp = worldToScreen(c * cellSize, r * cellSize);
          ctx.fillRect(sp.sx, sp.sy, cellSize * zoom, cellSize * zoom);
        }
      }

      // 4. Obstacles
      if (layerToggles.obstacles && config?.environment.obstacles) {
        for (const obs of config.environment.obstacles) {
          const sp = worldToScreen(obs.x, obs.y);
          const ow = obs.width * zoom;
          const oh = obs.height * zoom;

          ctx.fillStyle = "rgba(24, 36, 62, 0.85)";
          ctx.fillRect(sp.sx, sp.sy, ow, oh);

          ctx.strokeStyle = "#385185";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sp.sx, sp.sy, ow, oh);

          // Diagonal structural hatch
          ctx.strokeStyle = "rgba(56, 81, 133, 0.25)";
          ctx.beginPath();
          ctx.moveTo(sp.sx, sp.sy);
          ctx.lineTo(sp.sx + ow, sp.sy + oh);
          ctx.moveTo(sp.sx + ow, sp.sy);
          ctx.lineTo(sp.sx, sp.sy + oh);
          ctx.stroke();

          // Obstacle label
          if (zoom > 0.6 && obs.label) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = `${Math.max(9, Math.round(11 * zoom))}px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(obs.label, sp.sx + ow / 2, sp.sy + oh / 2 + 4);
          }
        }
      }

      // 5. No-Fly Zones
      if (layerToggles.noFlyZones && config?.environment.no_fly_zones) {
        for (const nfz of config.environment.no_fly_zones) {
          const sp = worldToScreen(nfz.x, nfz.y);
          const nw = nfz.width * zoom;
          const nh = nfz.height * zoom;

          // Danger red diagonal stripes
          ctx.fillStyle = "rgba(239, 68, 68, 0.12)";
          ctx.fillRect(sp.sx, sp.sy, nw, nh);

          ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(sp.sx, sp.sy, nw, nh);
          ctx.setLineDash([]);

          ctx.fillStyle = "#ef4444";
          ctx.font = `bold ${Math.max(9, Math.round(11 * zoom))}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(`⛔ ${nfz.name || "RESTRICTED"}`, sp.sx + nw / 2, sp.sy + nh / 2 + 4);
        }
      }

      if (snapshot) {
        // 6. Drone-to-Drone Communication Mesh Links
        if (layerToggles.commLinks && snapshot.comm_links) {
          ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);

          const droneMap = new Map(snapshot.drones.map((d) => [d.id, d]));
          for (const link of snapshot.comm_links) {
            const d1 = droneMap.get(link.source_drone_id);
            const d2 = droneMap.get(link.target_drone_id);
            if (d1 && d2) {
              const p1 = worldToScreen(d1.x, d1.y);
              const p2 = worldToScreen(d2.x, d2.y);
              ctx.beginPath();
              ctx.moveTo(p1.sx, p1.sy);
              ctx.lineTo(p2.sx, p2.sy);
              ctx.stroke();
            }
          }
          ctx.setLineDash([]);
        }

        // 7. Drone Trails & Planned Paths
        for (const drone of snapshot.drones) {
          // Trails
          if (layerToggles.trails && drone.trail && drone.trail.length > 1) {
            ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const startP = worldToScreen(drone.trail[0][0], drone.trail[0][1]);
            ctx.moveTo(startP.sx, startP.sy);
            for (let i = 1; i < drone.trail.length; i++) {
              const pt = worldToScreen(drone.trail[i][0], drone.trail[i][1]);
              ctx.lineTo(pt.sx, pt.sy);
            }
            ctx.stroke();
          }

          // Planned Path
          if (layerToggles.predictedPaths && drone.planned_path && drone.planned_path.length > 0) {
            ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            const currP = worldToScreen(drone.x, drone.y);
            ctx.moveTo(currP.sx, currP.sy);
            for (const wp of drone.planned_path) {
              const wpScreen = worldToScreen(wp[0], wp[1]);
              ctx.lineTo(wpScreen.sx, wpScreen.sy);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Waypoint dots
            ctx.fillStyle = "#3b82f6";
            for (const wp of drone.planned_path) {
              const wpScreen = worldToScreen(wp[0], wp[1]);
              ctx.beginPath();
              ctx.arc(wpScreen.sx, wpScreen.sy, 3 * zoom, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }

        // 8. Sensor FOV Cones
        if (layerToggles.fovCones) {
          for (const drone of snapshot.drones) {
            const sp = worldToScreen(drone.x, drone.y);
            const rangePx = drone.detection_range * zoom;
            const fovRad = (drone.sensor_fov_deg * Math.PI) / 180;
            const startAngle = drone.heading - fovRad / 2;
            const endAngle = drone.heading + fovRad / 2;

            const gradient = ctx.createRadialGradient(sp.sx, sp.sy, 5, sp.sx, sp.sy, rangePx);
            gradient.addColorStop(0, "rgba(0, 240, 255, 0.25)");
            gradient.addColorStop(0.7, "rgba(0, 240, 255, 0.08)");
            gradient.addColorStop(1, "rgba(0, 240, 255, 0.0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(sp.sx, sp.sy);
            ctx.arc(sp.sx, sp.sy, rangePx, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 9. Synthetic Targets (People & Vehicles)
        for (const target of snapshot.targets) {
          const sp = worldToScreen(target.x, target.y);
          const isSelected = selectedTargetId === target.id;

          if (target.target_class === "person") {
            // Person marker
            ctx.fillStyle = isSelected ? "#f59e0b" : "#38bdf8";
            ctx.beginPath();
            ctx.arc(sp.sx, sp.sy, 5 * zoom, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            // Vehicle marker
            ctx.fillStyle = isSelected ? "#ef4444" : "#f59e0b";
            const vw = 16 * zoom;
            const vh = 10 * zoom;
            ctx.fillRect(sp.sx - vw / 2, sp.sy - vh / 2, vw, vh);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(sp.sx - vw / 2, sp.sy - vh / 2, vw, vh);
          }

          // Target Label
          if (zoom > 0.6) {
            ctx.fillStyle = "#cbd5e1";
            ctx.font = `${Math.max(9, Math.round(10 * zoom))}px monospace`;
            ctx.textAlign = "center";
            ctx.fillText(target.id, sp.sx, sp.sy - 8 * zoom);
          }
        }

        // 10. Detections & Tracking Bounding Boxes
        for (const track of snapshot.tracks) {
          const sp = worldToScreen(track.x, track.y);
          const boxSize = 22 * zoom;

          ctx.strokeStyle = track.status === "active" ? "#ef4444" : "rgba(239, 68, 68, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sp.sx - boxSize / 2, sp.sy - boxSize / 2, boxSize, boxSize);

          // Tag
          ctx.fillStyle = "#ef4444";
          ctx.font = `bold ${Math.max(9, Math.round(9 * zoom))}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(
            `${track.object_class.toUpperCase()} ${Math.round(track.confidence * 100)}%`,
            sp.sx,
            sp.sy + boxSize / 2 + 10
          );
        }

        // 11. Drones
        for (const drone of snapshot.drones) {
          const sp = worldToScreen(drone.x, drone.y);
          const isSelected = selectedDroneId === drone.id;
          const radius = 9 * zoom;

          // Highlight ring if selected
          if (isSelected) {
            ctx.strokeStyle = "#00f0ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sp.sx, sp.sy, radius + 8, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Drone body
          ctx.fillStyle = isSelected ? "#00f0ff" : "#3b82f6";
          ctx.beginPath();
          ctx.arc(sp.sx, sp.sy, radius, 0, 2 * Math.PI);
          ctx.fill();

          // Heading pointer
          const hx = sp.sx + Math.cos(drone.heading) * (radius + 6 * zoom);
          const hy = sp.sy + Math.sin(drone.heading) * (radius + 6 * zoom);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sp.sx, sp.sy);
          ctx.lineTo(hx, hy);
          ctx.stroke();

          // Quadcopter rotor cross
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
          ctx.lineWidth = 1.2;
          const rSize = 6 * zoom;
          ctx.strokeRect(sp.sx - rSize, sp.sy - rSize, rSize * 2, rSize * 2);

          // Drone ID & Battery badge
          ctx.fillStyle = "#e2e8f0";
          ctx.font = `bold ${Math.max(9, Math.round(10 * zoom))}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText(drone.id, sp.sx, sp.sy - radius - 5);

          // Mini battery indicator
          const bColor = drone.battery > 50 ? "#10b981" : drone.battery > 20 ? "#f59e0b" : "#ef4444";
          ctx.fillStyle = bColor;
          ctx.fillText(`${Math.round(drone.battery)}%`, sp.sx, sp.sy + radius + 12);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [dimensions, zoom, pan, snapshot, config, layerToggles, selectedDroneId, selectedTargetId]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#070b14] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="cursor-crosshair w-full h-full block"
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-[#111A2E]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#1F3054] shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z * 1.2))}
          className="p-1.5 hover:bg-[#18243E] text-slate-300 hover:text-cyan-400 rounded transition"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.2, z / 1.2))}
          className="p-1.5 hover:bg-[#18243E] text-slate-300 hover:text-cyan-400 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={fitToViewport}
          className="p-1.5 hover:bg-[#18243E] text-slate-300 hover:text-cyan-400 rounded transition"
          title="Fit Map to Viewport"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 40, y: 40 });
          }}
          className="p-1.5 hover:bg-[#18243E] text-slate-300 hover:text-cyan-400 rounded transition"
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Mode Indicator Overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#111A2E]/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-[#1F3054] text-xs font-mono">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-cyan-300 font-semibold tracking-wider">SIMULATED DETECTION</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Fixed Δt 20Hz Engine</span>
      </div>

      {/* Coordinate & Zoom Readout */}
      <div className="absolute bottom-4 left-4 bg-[#111A2E]/85 backdrop-blur-md px-3 py-1 rounded text-xs font-mono text-slate-400 border border-[#1F3054]">
        Scale: {Math.round(zoom * 100)}% | World Grid: {config?.environment.width}m × {config?.environment.height}m
      </div>
    </div>
  );
};
