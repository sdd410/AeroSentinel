import React, { useEffect, useState } from "react";
import { useSimulationStore } from "./stores/simulationStore";
import { Header } from "./components/dashboard/Header";
import { SimulationCanvas } from "./components/canvas/SimulationCanvas";
import { SimulationControls } from "./components/controls/SimulationControls";
import { DroneTable } from "./components/drone-status/DroneTable";
import { DetectionList } from "./components/detections/DetectionList";
import { AlertPanel } from "./components/alerts/AlertPanel";
import { CoverageMetricsPanel } from "./components/metrics/CoverageMetricsPanel";
import { EventLogPanel } from "./components/logs/EventLogPanel";
import { SelectedDroneView } from "./components/dashboard/SelectedDroneView";
import { Navigation, Crosshair, AlertTriangle } from "lucide-react";

export function App() {
  const initialize = useSimulationStore((s) => s.initialize);
  const snapshot = useSimulationStore((s) => s.snapshot);
  const [activeRightTab, setActiveRightTab] = useState<"drones" | "detections" | "alerts">("drones");

  useEffect(() => {
    initialize();
  }, [initialize]);

  const droneCount = snapshot?.drones.length || 0;
  const trackCount = snapshot?.tracks.length || 0;
  const alertCount = snapshot?.alerts.filter((a) => !a.acknowledged).length || 0;

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0B111E] text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <Header />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Simulation Controls Sidebar */}
        <SimulationControls />

        {/* Center: 2D Simulation Canvas */}
        <div className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 relative overflow-hidden">
            <SimulationCanvas />
          </div>

          {/* Bottom Panels Row */}
          <div className="flex h-44 w-full">
            <div className="flex-1 min-w-0">
              <EventLogPanel />
            </div>
            <SelectedDroneView />
          </div>
        </div>

        {/* Right: Telemetry & Status Panels */}
        <div className="w-84 h-full bg-[#111A2E] border-l border-[#1F3054] flex flex-col">
          {/* Top Metrics Banner */}
          <CoverageMetricsPanel />

          {/* Right Panel Tabs */}
          <div className="flex bg-[#0d1527] border-b border-[#1F3054] text-xs font-semibold">
            <button
              onClick={() => setActiveRightTab("drones")}
              className={`flex-1 py-2 px-1 flex items-center justify-center gap-1.5 transition border-b-2 ${
                activeRightTab === "drones"
                  ? "border-cyan-400 text-cyan-400 bg-[#111A2E]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Navigation size={12} />
              Drones ({droneCount})
            </button>
            <button
              onClick={() => setActiveRightTab("detections")}
              className={`flex-1 py-2 px-1 flex items-center justify-center gap-1.5 transition border-b-2 ${
                activeRightTab === "detections"
                  ? "border-red-400 text-red-400 bg-[#111A2E]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Crosshair size={12} />
              Tracks ({trackCount})
            </button>
            <button
              onClick={() => setActiveRightTab("alerts")}
              className={`flex-1 py-2 px-1 flex items-center justify-center gap-1.5 transition border-b-2 ${
                activeRightTab === "alerts"
                  ? "border-amber-400 text-amber-400 bg-[#111A2E]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle size={12} />
              Alerts {alertCount > 0 && <span className="bg-amber-500/20 text-amber-400 px-1 rounded-full text-[10px]">{alertCount}</span>}
            </button>
          </div>

          {/* Active Tab Body */}
          <div className="flex-1 overflow-hidden">
            {activeRightTab === "drones" && <DroneTable />}
            {activeRightTab === "detections" && <DetectionList />}
            {activeRightTab === "alerts" && <AlertPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
