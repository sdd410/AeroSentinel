import { create } from "zustand";
import {
  MasterConfig,
  SimulationSnapshot,
  DroneTelemetry,
  Target,
  Alert,
} from "../types/simulation";
import { api, SimulationWebSocket } from "../services/api";

interface LayerToggles {
  trails: boolean;
  coverage: boolean;
  commLinks: boolean;
  fovCones: boolean;
  predictedPaths: boolean;
  grid: boolean;
  obstacles: boolean;
  noFlyZones: boolean;
}

interface SimulationStateStore {
  snapshot: SimulationSnapshot | null;
  config: MasterConfig | null;
  presets: Record<string, MasterConfig>;
  activePresetName: string;
  selectedDroneId: string | null;
  selectedTargetId: string | null;
  hoverCoords: { x: number; y: number } | null;
  layerToggles: LayerToggles;
  alertFilter: "all" | "critical" | "warning" | "info";
  isConnected: boolean;
  isUpdatingConfig: boolean;

  // Actions
  initialize: () => Promise<void>;
  setSnapshot: (snapshot: SimulationSnapshot) => void;
  selectDrone: (droneId: string | null) => void;
  selectTarget: (targetId: string | null) => void;
  setHoverCoords: (coords: { x: number; y: number } | null) => void;
  toggleLayer: (layer: keyof LayerToggles) => void;
  setAlertFilter: (filter: "all" | "critical" | "warning" | "info") => void;
  applyPreset: (name: string) => Promise<void>;
  updateConfigField: (section: keyof MasterConfig, field: string, value: any) => Promise<void>;
  importConfig: (jsonString: string) => Promise<boolean>;
  exportConfig: () => string;
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  stepSimulation: () => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
}

const simWs = new SimulationWebSocket();

export const useSimulationStore = create<SimulationStateStore>((set, get) => ({
  snapshot: null,
  config: null,
  presets: {},
  activePresetName: "Urban Block Surveillance",
  selectedDroneId: null,
  selectedTargetId: null,
  hoverCoords: null,
  layerToggles: {
    trails: true,
    coverage: true,
    commLinks: true,
    fovCones: true,
    predictedPaths: true,
    grid: true,
    obstacles: true,
    noFlyZones: true,
  },
  alertFilter: "all",
  isConnected: false,
  isUpdatingConfig: false,

  initialize: async () => {
    try {
      const [defaults, presets, initialSnapshot] = await Promise.all([
        api.getDefaultConfig(),
        api.getPresets(),
        api.getState(),
      ]);

      set({
        config: defaults,
        presets,
        snapshot: initialSnapshot,
        isConnected: true,
      });

      // Connect WebSocket
      simWs.connect((snapshot) => {
        set({ snapshot, isConnected: true });
      });
    } catch (e) {
      console.error("Initialization error:", e);
    }
  },

  setSnapshot: (snapshot) => set({ snapshot }),

  selectDrone: (droneId) =>
    set({
      selectedDroneId: droneId,
      selectedTargetId: null,
    }),

  selectTarget: (targetId) =>
    set({
      selectedTargetId: targetId,
      selectedDroneId: null,
    }),

  setHoverCoords: (coords) => set({ hoverCoords: coords }),

  toggleLayer: (layer) =>
    set((state) => ({
      layerToggles: {
        ...state.layerToggles,
        [layer]: !state.layerToggles[layer],
      },
    })),

  setAlertFilter: (filter) => set({ alertFilter: filter }),

  applyPreset: async (name: string) => {
    const { presets } = get();
    if (presets[name]) {
      const chosenConfig = presets[name];
      set({ isUpdatingConfig: true, activePresetName: name });
      const updated = await api.updateConfig(chosenConfig);
      set({ config: updated, isUpdatingConfig: false });
    }
  },

  updateConfigField: async (section, field, value) => {
    const { config } = get();
    if (!config) return;

    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    };

    set({ config: newConfig as MasterConfig, isUpdatingConfig: true });
    try {
      const saved = await api.updateConfig(newConfig as MasterConfig);
      set({ config: saved, isUpdatingConfig: false });
    } catch (e) {
      console.error("Failed to update config field:", e);
      set({ isUpdatingConfig: false });
    }
  },

  importConfig: async (jsonString: string): Promise<boolean> => {
    try {
      const parsed: MasterConfig = JSON.parse(jsonString);
      if (!parsed.environment || !parsed.swarm || !parsed.flight_path) {
        return false;
      }
      set({ isUpdatingConfig: true });
      const saved = await api.updateConfig(parsed);
      set({ config: saved, isUpdatingConfig: false, activePresetName: "Custom Import" });
      return true;
    } catch {
      set({ isUpdatingConfig: false });
      return false;
    }
  },

  exportConfig: () => {
    const { config } = get();
    return JSON.stringify(config, null, 2);
  },

  startSimulation: async () => {
    simWs.sendCommand("start");
  },

  pauseSimulation: async () => {
    simWs.sendCommand("pause");
  },

  resumeSimulation: async () => {
    simWs.sendCommand("resume");
  },

  resetSimulation: async () => {
    simWs.sendCommand("reset");
  },

  stepSimulation: async () => {
    simWs.sendCommand("step");
  },

  acknowledgeAlert: async (id: string) => {
    await api.acknowledgeAlert(id);
    const { snapshot } = get();
    if (snapshot) {
      const updatedAlerts = snapshot.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      );
      set({ snapshot: { ...snapshot, alerts: updatedAlerts } });
    }
  },
}));
