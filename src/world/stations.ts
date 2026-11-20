import { StationType } from '../store/gameStore';

export interface WorldStation {
  id: Exclude<StationType, null>;
  name: string;
  action: string;
  position: [number, number, number];
  color: string;
}

/** World-space consoles. These are not parented under building groups. */
export const WORLD_STATIONS: WorldStation[] = [
  {
    id: 'TOWER',
    name: 'Control Tower',
    action: 'Declare airspace closure',
    position: [0, 0.05, -28],
    color: '#38bdf8',
  },
  {
    id: 'DEPARTURE_BOARD',
    name: 'Terminal Departure Boards',
    action: 'Read the delay chain',
    position: [-35, 0.05, 27],
    color: '#38bdf8',
  },
  {
    id: 'GATES',
    name: 'Gate Concourse',
    action: 'Passenger crowds and transfers',
    position: [-20, 0.05, -12],
    color: '#f59e0b',
  },
  {
    id: 'OPS_CENTER',
    name: 'Operations Centre',
    action: 'Approve recovery plans',
    position: [35, 0.05, 27],
    color: '#10b981',
  },
  {
    id: 'HANGAR',
    name: 'Maintenance Hangar',
    action: 'Standby spare aircraft',
    position: [40, 0.05, -16],
    color: '#f59e0b',
  },
];

export function stationById(id: Exclude<StationType, null>): WorldStation | undefined {
  return WORLD_STATIONS.find((station) => station.id === id);
}
