import React, { useState } from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import { Terminal, Trash2, Filter } from "lucide-react";

export const EventLogPanel: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const [clearedBefore, setClearedBefore] = useState<number>(0);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  if (!snapshot) return null;

  const rawAlerts = snapshot.alerts || [];
  const visibleEvents = rawAlerts.filter((a) => {
    if (a.timestamp < clearedBefore) return false;
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="h-44 bg-[#0d1527] border-t border-[#1F3054] flex flex-col text-xs select-none">
      <div className="h-8 bg-[#111A2E] px-3 flex items-center justify-between border-b border-[#1F3054]">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-cyan-400" />
          <span className="font-bold tracking-wider text-slate-200 uppercase font-mono">
            Mission Operations Log
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({visibleEvents.length} events)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity selector */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#0B111E] text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-[#1F3054] focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <button
            onClick={() => setClearedBefore(snapshot.elapsed_time)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-[#18243E]"
            title="Clear Log View"
          >
            <Trash2 size={11} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1">
        {visibleEvents.length === 0 ? (
          <div className="text-slate-500 italic p-2">Awaiting operational events...</div>
        ) : (
          visibleEvents.map((evt) => {
            const color =
              evt.severity === "critical"
                ? "text-red-400"
                : evt.severity === "warning"
                ? "text-amber-400"
                : "text-slate-300";

            return (
              <div key={evt.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0">[{evt.timestamp.toFixed(2)}s]</span>
                <span className="text-cyan-400 shrink-0 font-semibold">&lt;{evt.source}&gt;</span>
                <span className={color}>{evt.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
