import { create } from 'zustand';
import * as THREE from 'three';

export type StationType =
  | 'TOWER'
  | 'OPS_CENTER'
  | 'DEPARTURE_BOARD'
  | 'GATES'
  | 'HANGAR'
  | 'SCORE_AND_WORST_DAY'
  | null;

interface GameState {
  // Player state
  playerPosition: [number, number, number];
  setPlayerPosition: (pos: [number, number, number]) => void;
  nearbyStation: { id: StationType; name: string; action: string } | null;
  setNearbyStation: (station: { id: StationType; name: string; action: string } | null) => void;
  activeStation: StationType;
  setActiveStation: (station: StationType) => void;

  // Simulation time
  simClockMins: number; // minutes from 00:00 (e.g. 360 = 06:00)
  setSimClockMins: (mins: number) => void;
  isClockPlaying: boolean;
  setIsClockPlaying: (playing: boolean) => void;
  clockSpeed: number; // 1x, 5x, 30x
  setClockSpeed: (speed: number) => void;

  // Selected airport focus (default 'BOM' Mumbai)
  currentAirportId: string;
  setCurrentAirportId: (id: string) => void;

  // Current objective
  currentObjective: string;
  setCurrentObjective: (obj: string) => void;

  // Audio mute
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerPosition: [0, 1, 0],
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  nearbyStation: null,
  setNearbyStation: (station) => set({ nearbyStation: station }),
  activeStation: null,
  setActiveStation: (station) => set({ activeStation: station }),

  simClockMins: 360, // 06:00 IST start
  setSimClockMins: (mins) => set({ simClockMins: mins }),
  isClockPlaying: false,
  setIsClockPlaying: (playing) => set({ isClockPlaying: playing }),
  clockSpeed: 5,
  setClockSpeed: (speed) => set({ clockSpeed: speed }),

  currentAirportId: 'BOM',
  setCurrentAirportId: (id) => set({ currentAirportId: id }),

  currentObjective: 'Climb the Control Tower to monitor the network or initiate crisis protocols',
  setCurrentObjective: (obj) => set({ currentObjective: obj }),

  soundEnabled: true,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
