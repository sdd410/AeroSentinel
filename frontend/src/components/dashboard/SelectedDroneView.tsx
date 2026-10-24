import React from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import { Crosshair, Compass, Battery, Eye, Navigation, AlertCircle } from "lucide-react";

export const SelectedDroneView: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const selectedDroneId = useSimulationStore((s) => s.selectedDroneId);
  const selectDrone = useSimulationStore((s) => s.selectDrone);

  if (!snapshot || !selectedDroneId) {
    return (
      <div className="w-72 h-44 bg-[#0d1527] border-t border-l border-[#1F3054] p-3 text-xs flex flex-col items-center justify-center text-slate-500">
        <Navigation size={20} className="mb-2 text-slate-600" />
        <span>Click any drone on the map or table to inspect live avionics</span>
      </div>
    );
  }

  const drone = snapshot.drones.find((d) => d.id === selectedDroneId);
  if (!drone) return null;

  // Find targets within this drone's detection range and FOV
  const visibleTargets = snapshot.detections
    .filter((det) => det.observing_drone_id === drone.id)
    .slice(0, 3);

  const headingDeg = Math.round((drone.heading * 180) / Math.PI + 360) % 360;

  return (
    <div className="w-80 h-44 bg-[#0d1527] border-t border-l border-[#1F3054] p-2.5 text-xs flex flex-col justify-between select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1F3054]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-slate-100">{drone.id} Avionics</span>
        </div>
        <button
          onClick={() => selectDrone(null)}
          className="text-slate-400 hover:text-slate-200 text-[10px]"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 my-1 font-mono text-[11px]">
        <div>
          <span className="text-[10px] text-slate-500 block">Position</span>
          <span className="text-slate-200">
            X:{drone.x.toFixed(1)} Y:{drone.y.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Heading / Speed</span>
          <span className="text-cyan-400">
            {headingDeg}° · {drone.speed.toFixed(1)} m/s
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Battery State</span>
          <span
            className={
              drone.battery > 50
                ? "text-emerald-400"
                : drone.battery > 20
                ? "text-amber-400"
                : "text-red-400"
            }
          >
            {Math.round(drone.battery)}% (drain {drone.status})
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Sensor FOV</span>
          <span className="text-slate-200">
            {drone.sensor_fov_deg}° · {drone.detection_range}m
          </span>
        </div>
      </div>

      {/* Visible Targets in FOV */}
      <div className="bg-[#111A2E] p-1.5 rounded border border-[#1F3054] text-[10px]">
        <div className="flex items-center justify-between text-slate-400 mb-0.5">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Eye size={10} className="text-cyan-400" /> Targets in FOV:
          </span>
          <span className="font-mono text-cyan-400">{visibleTargets.length} tracked</span>
        </div>
        {visibleTargets.length === 0 ? (
          <span className="text-slate-500 italic">No targets in Line-of-Sight</span>
        ) : (
          <div className="flex gap-2">
            {visibleTargets.map((t, idx) => (
              <span
                key={idx}
                className="bg-red-950/50 text-red-300 px-1.5 py-0.5 rounded font-mono border border-red-900"
              >
                {t.object_class.toUpperCase()} ({Math.round(t.confidence * 100)}%)
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
