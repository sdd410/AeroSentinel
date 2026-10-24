import React from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import { Crosshair, User, Car } from "lucide-react";
import { Track } from "../../types/simulation";

export const DetectionList: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const selectedTargetId = useSimulationStore((s) => s.selectedTargetId);
  const selectTarget = useSimulationStore((s) => s.selectTarget);
  const selectDrone = useSimulationStore((s) => s.selectDrone);

  if (!snapshot) return null;
  const tracks = snapshot.tracks || [];

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2.5 bg-[#0d1527] border-b border-[#1F3054] flex items-center justify-between">
        <span className="font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
          <Crosshair size={13} className="text-red-400" />
          Active Targets & Tracks ({tracks.length})
        </span>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-[#1F3054]/50">
        {tracks.length === 0 ? (
          <div className="p-4 text-center text-slate-500 italic">
            Scanning perimeter... No targets in sensor FOV.
          </div>
        ) : (
          tracks.map((track) => {
            const isSelected = selectedTargetId === track.target_id;
            const isPerson = track.object_class === "person";

            return (
              <div
                key={track.id}
                onClick={() => {
                  selectTarget(track.target_id || null);
                  if (track.observing_drone_id) {
                    selectDrone(track.observing_drone_id);
                  }
                }}
                className={`p-2.5 cursor-pointer transition flex flex-col gap-1 ${
                  isSelected
                    ? "bg-red-950/30 border-l-2 border-red-500"
                    : "hover:bg-[#18243E]/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    {isPerson ? (
                      <User size={13} className="text-cyan-400" />
                    ) : (
                      <Car size={13} className="text-amber-400" />
                    )}
                    {track.id} · {track.object_class.toUpperCase()}
                  </span>

                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      track.confidence > 0.8
                        ? "text-red-400 bg-red-950/60"
                        : "text-amber-400 bg-amber-950/60"
                    }`}
                  >
                    {Math.round(track.confidence * 100)}% CONF
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Observed by: {track.observing_drone_id}</span>
                  <span className="font-mono text-slate-300">
                    pos: {Math.round(track.x)}, {Math.round(track.y)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Status: <span className="uppercase text-slate-300">{track.status}</span></span>
                  <span>T-{Math.max(0, (snapshot.elapsed_time - track.last_seen)).toFixed(1)}s ago</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
