import React from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import { AlertTriangle, Info, ShieldAlert, Check } from "lucide-react";
import { AlertSeverity } from "../../types/simulation";

export const AlertPanel: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const alertFilter = useSimulationStore((s) => s.alertFilter);
  const setAlertFilter = useSimulationStore((s) => s.setAlertFilter);
  const acknowledgeAlert = useSimulationStore((s) => s.acknowledgeAlert);
  const selectDrone = useSimulationStore((s) => s.selectDrone);

  if (!snapshot) return null;
  const alerts = snapshot.alerts || [];

  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === "all") return true;
    return a.severity === alertFilter;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return {
          icon: <ShieldAlert size={12} className="text-red-400" />,
          style: "bg-red-950/50 text-red-400 border-red-800",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={12} className="text-amber-400" />,
          style: "bg-amber-950/50 text-amber-400 border-amber-800",
        };
      default:
        return {
          icon: <Info size={12} className="text-cyan-400" />,
          style: "bg-cyan-950/50 text-cyan-400 border-cyan-800",
        };
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2.5 bg-[#0d1527] border-b border-[#1F3054] flex items-center justify-between">
        <span className="font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-amber-400" />
          Mission Alerts
        </span>

        {/* Severity filter pills */}
        <div className="flex gap-1 font-mono text-[10px]">
          {(["all", "critical", "warning", "info"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setAlertFilter(lvl)}
              className={`px-1.5 py-0.5 rounded uppercase ${
                alertFilter === lvl
                  ? "bg-cyan-500 text-slate-900 font-bold"
                  : "bg-[#18243E] text-slate-400 hover:text-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-[#1F3054]/50">
        {filteredAlerts.length === 0 ? (
          <div className="p-4 text-center text-slate-500 italic">No alerts recorded.</div>
        ) : (
          filteredAlerts.slice().reverse().map((alert) => {
            const badge = getSeverityBadge(alert.severity);

            return (
              <div
                key={alert.id}
                className={`p-2 transition flex items-start justify-between gap-2 ${
                  alert.acknowledged ? "opacity-50" : "hover:bg-[#18243E]/60"
                }`}
              >
                <div className="flex items-start gap-1.5 flex-1">
                  <div className="mt-0.5">{badge.icon}</div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        {alert.timestamp.toFixed(1)}s
                      </span>
                      <span className="font-semibold text-slate-300">[{alert.source}]</span>
                    </div>
                    <p
                      onClick={() => alert.entity_id && selectDrone(alert.entity_id)}
                      className={`text-slate-200 ${
                        alert.entity_id ? "cursor-pointer hover:underline text-cyan-300" : ""
                      }`}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="p-1 rounded bg-[#18243E] hover:bg-[#1f3054] text-slate-300 hover:text-emerald-400"
                    title="Acknowledge Alert"
                  >
                    <Check size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
