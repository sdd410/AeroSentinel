import React, { useRef } from "react";
import { useSimulationStore } from "../../stores/simulationStore";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Shield,
  Download,
  Upload,
  Radio,
  Sliders,
} from "lucide-react";

export const Header: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const presets = useSimulationStore((s) => s.presets);
  const activePresetName = useSimulationStore((s) => s.activePresetName);
  const applyPreset = useSimulationStore((s) => s.applyPreset);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const pauseSimulation = useSimulationStore((s) => s.pauseSimulation);
  const resumeSimulation = useSimulationStore((s) => s.resumeSimulation);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);
  const stepSimulation = useSimulationStore((s) => s.stepSimulation);
  const exportConfig = useSimulationStore((s) => s.exportConfig);
  const importConfig = useSimulationStore((s) => s.importConfig);
  const isConnected = useSimulationStore((s) => s.isConnected);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const state = snapshot?.state || "stopped";
  const elapsed = snapshot?.elapsed_time || 0;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const handleExport = () => {
    const data = exportConfig();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aerosentinel-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const ok = await importConfig(text);
        if (!ok) {
          alert("Invalid configuration JSON file.");
        }
      };
      reader.readAsText(file);
    }
    if (e.target) e.target.value = "";
  };

  return (
    <header className="h-14 bg-[#111A2E] border-b border-[#1F3054] px-4 flex items-center justify-between z-20 select-none shadow-md">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Shield size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              AeroSentinel
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              v1.0 MVP
            </span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
            Autonomous Coordination · Intelligent Coverage · Simulated Detection
          </p>
        </div>
      </div>

      {/* Primary Simulation Controls */}
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 mr-2">
          <span className="text-xs text-slate-400 hidden md:inline">Preset:</span>
          <select
            value={activePresetName}
            onChange={(e) => applyPreset(e.target.value)}
            className="bg-[#0B111E] text-slate-200 text-xs px-2.5 py-1.5 rounded border border-[#1F3054] hover:border-cyan-500/50 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {Object.keys(presets).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* State Badge & Timer */}
        <div className="bg-[#0B111E] px-3 py-1 rounded border border-[#1F3054] flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                state === "running"
                  ? "bg-emerald-400 animate-pulse"
                  : state === "paused"
                  ? "bg-amber-400"
                  : "bg-slate-500"
              }`}
            />
            <span className="uppercase font-semibold tracking-wide text-slate-200">
              {state}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">{timeFormatted}</span>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-1 bg-[#0B111E] p-1 rounded border border-[#1F3054]">
          {state === "running" ? (
            <button
              onClick={pauseSimulation}
              className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
              title="Pause Simulation"
            >
              <Pause size={14} />
            </button>
          ) : (
            <button
              onClick={state === "paused" ? resumeSimulation : startSimulation}
              className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
              title="Start / Resume Simulation"
            >
              <Play size={14} />
            </button>
          )}

          <button
            onClick={stepSimulation}
            className="p-1.5 rounded hover:bg-[#18243E] text-slate-300 hover:text-cyan-400 transition"
            title="Single Step (1 Tick)"
          >
            <StepForward size={14} />
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 rounded hover:bg-[#18243E] text-slate-300 hover:text-red-400 transition"
            title="Reset Simulation"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Preset Export / Import & Live Status */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="p-1.5 rounded bg-[#0B111E] hover:bg-[#18243E] text-slate-300 hover:text-cyan-400 border border-[#1F3054] transition text-xs flex items-center gap-1"
          title="Export Config JSON"
        >
          <Download size={13} />
          <span className="hidden lg:inline">Export</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded bg-[#0B111E] hover:bg-[#18243E] text-slate-300 hover:text-cyan-400 border border-[#1F3054] transition text-xs flex items-center gap-1"
          title="Import Config JSON"
        >
          <Upload size={13} />
          <span className="hidden lg:inline">Import</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />

        {/* WebSocket Connection Light */}
        <div
          className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border ${
            isConnected
              ? "text-emerald-400 border-emerald-900 bg-emerald-950/40"
              : "text-red-400 border-red-900 bg-red-950/40"
          }`}
          title={isConnected ? "WebSocket Connected" : "Connecting..."}
        >
          <Radio size={12} className={isConnected ? "animate-pulse" : ""} />
          <span className="hidden xl:inline">{isConnected ? "ONLINE" : "OFFLINE"}</span>
        </div>
      </div>
    </header>
  );
};
