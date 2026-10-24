import React from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import { Activity, Battery, ShieldCheck, Target, Radio } from "lucide-react";

export const CoverageMetricsPanel: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  if (!snapshot) return null;
  const m = snapshot.metrics;

  return (
    <div className="p-3 bg-[#0d1527] border-b border-[#1F3054] text-xs">
      {/* Coverage Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            Area Coverage
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            {m.coverage_percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#0B111E] rounded-full overflow-hidden border border-[#1F3054]">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            style={{ width: `${Math.min(100, m.coverage_percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>Explored: {m.cells_explored} cells</span>
          <span>Total: {m.total_cells} cells</span>
        </div>
      </div>

      {/* Grid of Key Mission Counters */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#111A2E] p-2 rounded border border-[#1F3054] flex flex-col">
          <span className="text-[10px] text-slate-400">Active Drones</span>
          <span className="font-mono font-bold text-sm text-cyan-400 mt-0.5">
            {m.active_drones} / {snapshot.drones.length}
          </span>
        </div>

        <div className="bg-[#111A2E] p-2 rounded border border-[#1F3054] flex flex-col">
          <span className="text-[10px] text-slate-400">Tracks Active</span>
          <span className="font-mono font-bold text-sm text-red-400 mt-0.5">
            {m.active_tracked_targets}
          </span>
        </div>

        <div className="bg-[#111A2E] p-2 rounded border border-[#1F3054] flex flex-col">
          <span className="text-[10px] text-slate-400">Avg Battery</span>
          <span
            className={`font-mono font-bold text-sm mt-0.5 ${
              m.average_battery > 50
                ? "text-emerald-400"
                : m.average_battery > 20
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {Math.round(m.average_battery)}%
          </span>
        </div>

        <div className="bg-[#111A2E] p-2 rounded border border-[#1F3054] flex flex-col">
          <span className="text-[10px] text-slate-400">Total Detections</span>
          <span className="font-mono font-bold text-sm text-amber-400 mt-0.5">
            {m.detection_count}
          </span>
        </div>
      </div>
    </div>
  );
};
