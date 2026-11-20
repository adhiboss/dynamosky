import { create } from 'zustand';
import {
  FlightNetworkData,
  Closure,
  SimulationResult,
  RecoveryAction,
  simulateNetwork,
} from '../engine';

interface SimulationState {
  dataset: FlightNetworkData | null;
  setDataset: (data: FlightNetworkData) => void;
  closure: Closure | null;
  setClosure: (closure: Closure | null) => void;
  appliedActions: RecoveryAction[];
  applyAction: (action: RecoveryAction) => void;
  removeAction: (actionId: string) => void;
  clearActions: () => void;

  simResult: SimulationResult | null;
  baselineResult: SimulationResult | null; // Sim with closure but NO recovery actions (for before/after comparison)
  selectedFlightId: string | null;
  setSelectedFlightId: (id: string | null) => void;

  recomputeSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  dataset: null,
  setDataset: (data) => {
    set({ dataset: data });
    get().recomputeSimulation();
  },

  closure: null,
  setClosure: (closure) => {
    set({ closure, appliedActions: [] });
    get().recomputeSimulation();
  },

  appliedActions: [],
  applyAction: (action) => {
    const next = [...get().appliedActions, action];
    set({ appliedActions: next });
    get().recomputeSimulation();
  },
  removeAction: (actionId) => {
    const next = get().appliedActions.filter((a) => a.id !== actionId);
    set({ appliedActions: next });
    get().recomputeSimulation();
  },
  clearActions: () => {
    set({ appliedActions: [] });
    get().recomputeSimulation();
  },

  simResult: null,
  baselineResult: null,
  selectedFlightId: null,
  setSelectedFlightId: (id) => set({ selectedFlightId: id }),

  recomputeSimulation: () => {
    const { dataset, closure, appliedActions } = get();
    if (!dataset) return;

    // 1. Baseline with closure and ZERO actions
    const baseline = simulateNetwork(dataset, closure, { appliedActions: [] });

    // 2. Active simulation with applied recovery actions
    const sim = simulateNetwork(dataset, closure, { appliedActions });

    set({
      baselineResult: baseline,
      simResult: sim,
    });
  },
}));
