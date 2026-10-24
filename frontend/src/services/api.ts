import { MasterConfig, SimulationSnapshot, Alert } from "../types/simulation";

const API_BASE = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/api/ws/simulation";

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getDefaultConfig(): Promise<MasterConfig> {
    const res = await fetch(`${API_BASE}/config/defaults`);
    return res.json();
  },

  async getPresets(): Promise<Record<string, MasterConfig>> {
    const res = await fetch(`${API_BASE}/presets`);
    return res.json();
  },

  async start(): Promise<void> {
    await fetch(`${API_BASE}/simulation/start`, { method: "POST" });
  },

  async pause(): Promise<void> {
    await fetch(`${API_BASE}/simulation/pause`, { method: "POST" });
  },

  async resume(): Promise<void> {
    await fetch(`${API_BASE}/simulation/resume`, { method: "POST" });
  },

  async reset(): Promise<void> {
    await fetch(`${API_BASE}/simulation/reset`, { method: "POST" });
  },

  async step(): Promise<SimulationSnapshot> {
    const res = await fetch(`${API_BASE}/simulation/step`, { method: "POST" });
    return res.json();
  },

  async getState(): Promise<SimulationSnapshot> {
    const res = await fetch(`${API_BASE}/simulation/state`);
    return res.json();
  },

  async updateConfig(config: MasterConfig): Promise<MasterConfig> {
    const res = await fetch(`${API_BASE}/simulation/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    await fetch(`${API_BASE}/simulation/events/${alertId}/ack`, {
      method: "POST",
    });
  },
};

export class SimulationWebSocket {
  private ws: WebSocket | null = null;
  private onSnapshotCallback: ((snapshot: SimulationSnapshot) => void) | null = null;
  private reconnectTimer: number | null = null;
  private isManualClose = false;

  connect(onSnapshot: (snapshot: SimulationSnapshot) => void) {
    this.onSnapshotCallback = onSnapshot;
    this.isManualClose = false;
    this._initWs();
  }

  private _initWs() {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onmessage = (event) => {
        try {
          const snapshot: SimulationSnapshot = JSON.parse(event.data);
          if (this.onSnapshotCallback) {
            this.onSnapshotCallback(snapshot);
          }
        } catch (err) {
          console.error("Failed to parse simulation snapshot:", err);
        }
      };

      this.ws.onclose = () => {
        if (!this.isManualClose) {
          this.reconnectTimer = window.setTimeout(() => this._initWs(), 1500);
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      this.reconnectTimer = window.setTimeout(() => this._initWs(), 1500);
    }
  }

  sendCommand(action: "start" | "pause" | "resume" | "reset" | "step") {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action }));
    }
  }

  disconnect() {
    this.isManualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}
