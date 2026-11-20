import { FlightStatus } from '../engine';

export const MAP_WIDTH = 280;
export const MAP_HEIGHT = 320;

const BOUNDS = { minLng: 67.5, maxLng: 98.2, minLat: 6.4, maxLat: 37.2 };

/** Simplified mainland outline, [lng, lat], clockwise from the north. */
const INDIA_OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [74.4, 34.8],
  [77.2, 35.5],
  [79.6, 32.2],
  [81.2, 30.1],
  [84.2, 27.6],
  [88.0, 26.8],
  [92.2, 26.6],
  [95.4, 27.6],
  [97.0, 27.4],
  [94.8, 25.6],
  [93.0, 24.2],
  [92.2, 22.4],
  [88.8, 21.8],
  [86.6, 20.6],
  [84.6, 19.2],
  [82.6, 16.8],
  [80.3, 13.6],
  [80.2, 10.2],
  [78.4, 8.1],
  [76.8, 8.4],
  [76.2, 10.6],
  [75.4, 13.2],
  [74.4, 15.2],
  [73.2, 18.2],
  [72.6, 20.6],
  [69.2, 22.6],
  [68.6, 23.8],
  [71.2, 24.4],
  [73.4, 26.2],
  [74.6, 29.4],
  [74.2, 32.6],
  [74.4, 34.8],
];

export interface MapPoint {
  x: number;
  y: number;
}

export function projectIndia(lat: number, lng: number): MapPoint {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * MAP_WIDTH;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * MAP_HEIGHT;
  return { x, y };
}

export function indiaOutlinePath(): string {
  return INDIA_OUTLINE.map(([lng, lat], index) => {
    const { x, y } = projectIndia(lat, lng);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

export function flightArcPath(from: MapPoint, to: MapPoint): string {
  const mx = (from.x + to.x) / 2;
  const lift = Math.max(10, Math.hypot(to.x - from.x, to.y - from.y) * 0.22);
  const my = (from.y + to.y) / 2 - lift;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

export function flightColor(status: FlightStatus | undefined): string {
  if (status === 'CANCELLED' || status === 'OUT_OF_POSITION') return '#94a3b8';
  if (status === 'DELAYED') return '#fbbf24';
  return '#34d399';
}
