import { StationType } from '../store/gameStore';
import { Closure, RecoveryAction } from '../engine';
import { stationById, WORLD_STATIONS } from './stations';

export interface MissionStep {
  text: string;
  targetId: Exclude<StationType, null> | null;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function missionStep(
  closure: Closure | null,
  actions: RecoveryAction[],
  visited: StationType[]
): MissionStep {
  const seen = (id: Exclude<StationType, null>) => visited.includes(id);

  if (!closure) {
    return {
      targetId: 'TOWER',
      text: 'Network is on time. Walk north to the Control Tower and declare a closure — Mumbai Monsoon is the shift case.',
    };
  }

  if (!seen('DEPARTURE_BOARD')) {
    return {
      targetId: 'DEPARTURE_BOARD',
      text: `${closure.airport} is stopped. Open a late flight at the departure board and read the causal chain. The parts sum to the delay.`,
    };
  }

  if (actions.length === 0) {
    return {
      targetId: 'OPS_CENTER',
      text: 'The engine has ranked recoveries. At the Operations Centre, approve a spare, a cancellation, or a tail swap. The dispatcher only explains those numbers.',
    };
  }

  if (!seen('SCORE_AND_WORST_DAY')) {
    return {
      targetId: null,
      text: 'Recovery is in the plan. Open Score & Stars and compare this shift with doing nothing, and with Par.',
    };
  }

  return {
    targetId: null,
    text: 'Shift is scored. Approve another action, or load a Worst Day from the score board.',
  };
}

export function bearingLabel(
  player: [number, number, number],
  target: [number, number, number]
): { meters: number; compass: string } {
  const dx = target[0] - player[0];
  const dz = target[2] - player[2];
  const meters = Math.round(Math.hypot(dx, dz));
  const angle = Math.atan2(dx, -dz);
  const index = Math.round(angle / (Math.PI / 4));
  const compass = COMPASS[((index % 8) + 8) % 8];
  return { meters, compass };
}

export function waypointFor(
  step: MissionStep,
  player: [number, number, number]
): { name: string; meters: number; compass: string; color: string } | null {
  if (!step.targetId) return null;
  const station = stationById(step.targetId);
  if (!station) return null;
  const bearing = bearingLabel(player, station.position);
  return { name: station.name, ...bearing, color: station.color };
}

export function stationCount(): number {
  return WORLD_STATIONS.length;
}
