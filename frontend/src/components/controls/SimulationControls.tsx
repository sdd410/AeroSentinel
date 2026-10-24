import React, { useState } from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import {
  Sliders,
  Compass,
  Cpu,
  Layers,
  Eye,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

export const SimulationControls: React.FC = () => {
  const config = useSimulationStore((s) => s.config);
  const updateConfigField = useSimulationStore((s) => s.updateConfigField);
  const layerToggles = useSimulationStore((s) => s.layerToggles);
  const toggleLayer = useSimulationStore((s) => s.toggleLayer);
  const isUpdating = useSimulationStore((s) => s.isUpdatingConfig);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    layers: true,
    swarm: true,
    algorithm: true,
    detection: false,
    environment: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  if (!config) return null;

  return (
    <div className="w-80 h-full bg-[#111A2E] border-r border-[#1F3054] flex flex-col select-none overflow-y-auto text-xs">
      <div className="p-3 border-b border-[#1F3054] bg-[#0d1527] flex items-center justify-between">
        <span className="font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
          <Sliders size={14} className="text-cyan-400" />
          Mission Parameters
        </span>
        {isUpdating && <span className="text-[10px] text-cyan-400 animate-pulse">Syncing...</span>}
      </div>

      <div className="p-2 space-y-2">
        {/* Layer Toggles Section */}
        <div className="border border-[#1F3054] rounded bg-[#0b111e]/60">
          <button
            onClick={() => toggleSection("layers")}
            className="w-full p-2.5 flex items-center justify-between font-semibold text-slate-200 hover:text-cyan-400 transition"
          >
            <span className="flex items-center gap-2">
              <Layers size={13} className="text-cyan-400" /> Visualization Layers
            </span>
            {openSections.layers ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openSections.layers && (
            <div className="p-2.5 pt-0 grid grid-cols-2 gap-2 text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-100">
                <input
                  type="checkbox"
                  checked={layerToggles.fovCones}
                  onChange={() => toggleLayer("fovCones")}
                  className="rounded border-[#1F3054] text-cyan-500 focus:ring-0 bg-[#18243E]"
                />
                Sensor FOV
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-100">
                <input
                  type="checkbox"
                  checked={layerToggles.trails}
                  onChange={() => toggleLayer("trails")}
                  className="rounded border-[#1F3054] text-cyan-500 focus:ring-0 bg-[#18243E]"
                />
                Drone Trails
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-100">
                <input
                  type="checkbox"
                  checked={layerToggles.commLinks}
                  onChange={() => toggleLayer("commLinks")}
                  className="rounded border-[#1F3054] text-cyan-500 focus:ring-0 bg-[#18243E]"
                />
                Comm Mesh
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-100">
                <input
                  type="checkbox"
                  checked={layerToggles.coverage}
                  onChange={() => toggleLayer("coverage")}
                  className="rounded border-[#1F3054] text-cyan-500 focus:ring-0 bg-[#18243E]"
                />
                Coverage Heatmap
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-100">
                <input
                  type="checkbox"
                  checked={layerToggles.predictedPaths}
                  onChange={() => toggleLayer("predictedPaths")}
                  className="rounded border-[#1F3054] text-cyan-500 focus:ring-0 bg-[#18243E]"
                />
                Planned Routes
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-100">
                <input
                  type="checkbox"
                  checked={layerToggles.grid}
                  onChange={() => toggleLayer("grid")}
                  className="rounded border-[#1F3054] text-cyan-500 focus:ring-0 bg-[#18243E]"
                />
                Grid Lines
              </label>
            </div>
          )}
        </div>

        {/* Swarm Configuration Section */}
        <div className="border border-[#1F3054] rounded bg-[#0b111e]/60">
          <button
            onClick={() => toggleSection("swarm")}
            className="w-full p-2.5 flex items-center justify-between font-semibold text-slate-200 hover:text-cyan-400 transition"
          >
            <span className="flex items-center gap-2">
              <Cpu size={13} className="text-cyan-400" /> Swarm Configuration
            </span>
            {openSections.swarm ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openSections.swarm && (
            <div className="p-2.5 pt-0 space-y-3">
              {/* Drone Count */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Drone Count:</span>
                  <span className="text-cyan-400 font-mono font-bold">{config.swarm.drone_count}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={config.swarm.drone_count}
                  onChange={(e) => updateConfigField("swarm", "drone_count", parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Formation */}
              <div>
                <span className="text-slate-400 mb-1 block">Formation Pattern:</span>
                <select
                  value={config.swarm.formation}
                  onChange={(e) => updateConfigField("swarm", "formation", e.target.value)}
                  className="w-full bg-[#18243E] text-slate-200 px-2 py-1.5 rounded border border-[#1F3054] focus:outline-none"
                >
                  <option value="dynamic">Dynamic Dispersion</option>
                  <option value="line">Line Formation</option>
                  <option value="grid">Grid Array</option>
                  <option value="circle">Perimeter Circle</option>
                </select>
              </div>

              {/* Min Separation */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Min Separation:</span>
                  <span className="text-cyan-400 font-mono">{config.swarm.min_separation}m</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  step="5"
                  value={config.swarm.min_separation}
                  onChange={(e) => updateConfigField("swarm", "min_separation", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Comm Range */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Mesh Comm Range:</span>
                  <span className="text-cyan-400 font-mono">{config.swarm.communication_range}m</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="500"
                  step="20"
                  value={config.swarm.communication_range}
                  onChange={(e) => updateConfigField("swarm", "communication_range", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Max Speed */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Cruise Speed:</span>
                  <span className="text-cyan-400 font-mono">{config.swarm.max_speed} m/s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="2"
                  value={config.swarm.max_speed}
                  onChange={(e) => updateConfigField("swarm", "max_speed", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Battery Drain Rate */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Battery Drain Rate:</span>
                  <span className="text-cyan-400 font-mono">{config.swarm.battery_drain_rate}%/s</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  value={config.swarm.battery_drain_rate}
                  onChange={(e) => updateConfigField("swarm", "battery_drain_rate", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Flight-Path Algorithm Section */}
        <div className="border border-[#1F3054] rounded bg-[#0b111e]/60">
          <button
            onClick={() => toggleSection("algorithm")}
            className="w-full p-2.5 flex items-center justify-between font-semibold text-slate-200 hover:text-cyan-400 transition"
          >
            <span className="flex items-center gap-2">
              <Compass size={13} className="text-cyan-400" /> Navigation & Avoidance
            </span>
            {openSections.algorithm ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openSections.algorithm && (
            <div className="p-2.5 pt-0 space-y-3">
              <div>
                <span className="text-slate-400 mb-1 block">Pathfinding Algorithm:</span>
                <select
                  value={config.flight_path.algorithm}
                  onChange={(e) => updateConfigField("flight_path", "algorithm", e.target.value)}
                  className="w-full bg-[#18243E] text-slate-200 px-2 py-1.5 rounded border border-[#1F3054] focus:outline-none"
                >
                  <option value="coverage">Autonomous Area Coverage (Greedy Frontier)</option>
                  <option value="astar">A* Grid Search + Obstacle Inflation</option>
                  <option value="waypoint">Direct Waypoint Tracking</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Path Smoothing:</span>
                <input
                  type="checkbox"
                  checked={config.flight_path.path_smoothing}
                  onChange={(e) => updateConfigField("flight_path", "path_smoothing", e.target.checked)}
                  className="rounded border-[#1F3054] text-cyan-500 bg-[#18243E]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Obstacle Avoidance:</span>
                <input
                  type="checkbox"
                  checked={config.flight_path.obstacle_avoidance}
                  onChange={(e) => updateConfigField("flight_path", "obstacle_avoidance", e.target.checked)}
                  className="rounded border-[#1F3054] text-cyan-500 bg-[#18243E]"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Separation Force Weight:</span>
                  <span className="text-cyan-400 font-mono">{config.flight_path.separation_weight}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={config.flight_path.separation_weight}
                  onChange={(e) => updateConfigField("flight_path", "separation_weight", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Cohesion / Formation Force:</span>
                  <span className="text-cyan-400 font-mono">{config.flight_path.cohesion_weight}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.5"
                  step="0.1"
                  value={config.flight_path.cohesion_weight}
                  onChange={(e) => updateConfigField("flight_path", "cohesion_weight", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Detection & Vision Section */}
        <div className="border border-[#1F3054] rounded bg-[#0b111e]/60">
          <button
            onClick={() => toggleSection("detection")}
            className="w-full p-2.5 flex items-center justify-between font-semibold text-slate-200 hover:text-cyan-400 transition"
          >
            <span className="flex items-center gap-2">
              <Eye size={13} className="text-cyan-400" /> Sensor & Target Tracking
            </span>
            {openSections.detection ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {openSections.detection && (
            <div className="p-2.5 pt-0 space-y-3">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Camera FOV Angle:</span>
                  <span className="text-cyan-400 font-mono">{config.swarm.sensor_fov_deg}°</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="140"
                  step="5"
                  value={config.swarm.sensor_fov_deg}
                  onChange={(e) => updateConfigField("swarm", "sensor_fov_deg", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Sensor Detection Range:</span>
                  <span className="text-cyan-400 font-mono">{config.detection.detection_range}m</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={config.detection.detection_range}
                  onChange={(e) => updateConfigField("detection", "detection_range", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Confidence Threshold:</span>
                  <span className="text-cyan-400 font-mono">{Math.round(config.detection.confidence_threshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={config.detection.confidence_threshold}
                  onChange={(e) => updateConfigField("detection", "confidence_threshold", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Speed multiplier */}
        <div className="p-2 bg-[#0b111e]/60 rounded border border-[#1F3054] flex items-center justify-between">
          <span className="text-slate-400">Sim Engine Speed:</span>
          <div className="flex gap-1">
            {[0.5, 1.0, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                onClick={() => updateConfigField("settings", "simulation_speed", spd)}
                className={`px-2 py-0.5 rounded font-mono ${
                  config.settings.simulation_speed === spd
                    ? "bg-cyan-500 text-slate-900 font-bold"
                    : "bg-[#18243E] text-slate-300 hover:bg-[#1f3054]"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
