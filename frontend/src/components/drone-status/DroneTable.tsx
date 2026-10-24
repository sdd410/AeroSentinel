import React from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import { Battery, BatteryLow, BatteryCharging, Compass, Navigation } from "lucide-react";
import { DroneTelemetry, DroneStatus } from "../../types/simulation";

export const DroneTable: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const selectedDroneId = useSimulationStore((s) => s.selectedDroneId);
  const selectDrone = useSimulationStore((s) => s.selectDrone);

  if (!snapshot || !snapshot.drones) return null;

  const getStatusColor = (status: DroneStatus) => {
    switch (status) {
      case "Patrolling":
      case "Navigating":
        return "text-emerald-400 bg-emerald-950/40 border-emerald-800";
      case "Investigating":
        return "text-amber-400 bg-amber-950/40 border-amber-800";
      case "Low Battery":
      case "Returning":
        return "text-orange-400 bg-orange-950/40 border-orange-800";
      case "Unavailable":
        return "text-red-400 bg-red-950/40 border-red-800";
      default:
        return "text-slate-400 bg-slate-900 border-slate-700";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2.5 bg-[#0d1527] border-b border-[#1F3054] flex items-center justify-between">
        <span className="font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
          <Navigation size={13} className="text-cyan-400" />
          Active Swarm Drones ({snapshot.drones.length})
        </span>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-[#1F3054]/50">
        {snapshot.drones.map((drone) => {
          const isSelected = selectedDroneId === drone.id;
          const batteryColor =
            drone.battery > 50
              ? "bg-emerald-500"
              : drone.battery > 20
              ? "bg-amber-500"
              : "bg-red-500";

          return (
            <div
              key={drone.id}
              onClick={() => selectDrone(isSelected ? null : drone.id)}
              className={`p-2.5 cursor-pointer transition flex flex-col gap-1.5 ${
                isSelected
                  ? "bg-cyan-950/30 border-l-2 border-cyan-400"
                  : "hover:bg-[#18243E]/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-cyan-400 animate-ping" : "bg-cyan-500"
                    }`}
                  />
                  {drone.id}
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusColor(
                    drone.status
                  )}`}
                >
                  {drone.status}
                </span>
              </div>

              {/* Objective & Telemetry row */}
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="truncate max-w-[140px]" title={drone.current_objective}>
                  {drone.current_objective}
                </span>
                <span className="font-mono text-slate-300">
                  {drone.speed.toFixed(1)} m/s · {Math.round(drone.x)},{Math.round(drone.y)}
                </span>
              </div>

              {/* Battery bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#0B111E] rounded-full overflow-hidden border border-[#1F3054]">
                  <div
                    className={`h-full ${batteryColor} transition-all duration-300`}
                    style={{ width: `${Math.max(0, drone.battery)}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-slate-400 w-8 text-right">
                  {Math.round(drone.battery)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
