import React, { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSimulationStore } from '../../store/simulationStore';
import { toHHMM } from '../../engine';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  flightArcPath,
  flightColor,
  indiaOutlinePath,
  projectIndia,
} from '../../world/indiaMap';
import { stationById } from '../../world/stations';

export const IndiaNetworkMap: React.FC = () => {
  const nearbyStation = useGameStore((state) => state.nearbyStation);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const activeStation = useGameStore((state) => state.activeStation);
  const briefingOpen = useGameStore((state) => state.briefingOpen);
  const simClockMins = useGameStore((state) => state.simClockMins);
  const dataset = useSimulationStore((state) => state.dataset);
  const simResult = useSimulationStore((state) => state.simResult);
  const closure = useSimulationStore((state) => state.closure);

  const tower = stationById('TOWER');
  const nearTower = tower
    ? Math.hypot(playerPosition[0] - tower.position[0], playerPosition[2] - tower.position[2]) < 24
    : nearbyStation?.id === 'TOWER';
  const visible = nearTower && !activeStation && !briefingOpen;

  const outline = useMemo(() => indiaOutlinePath(), []);

  const nodes = useMemo(() => {
    if (!dataset) return [];
    return dataset.airports.map((airport) => ({
      ...airport,
      point: projectIndia(airport.lat, airport.lng),
    }));
  }, [dataset]);

  const nodeById = useMemo(() => {
    const map = new Map(nodes.map((node) => [node.id, node]));
    return map;
  }, [nodes]);

  const arcs = useMemo(() => {
    if (!dataset) return [];
    return dataset.flights.flatMap((flight) => {
      const origin = nodeById.get(flight.origin);
      const destination = nodeById.get(flight.destination);
      if (!origin || !destination) return [];
      const simulated = simResult?.flights[flight.flight_id];
      return [{
        id: flight.flight_id,
        d: flightArcPath(origin.point, destination.point),
        color: flightColor(simulated?.status),
        label: `${flight.flight_id} ${flight.origin}–${flight.destination}`,
      }];
    });
  }, [dataset, nodeById, simResult]);

  const board = useMemo(() => {
    if (!simResult) return [];
    const flights = Object.values(simResult.flights);
    const live = flights.filter(
      (flight) => simClockMins >= flight.actual_dep && simClockMins <= flight.actual_arr && flight.status !== 'CANCELLED'
    );
    const source = live.length > 0
      ? live
      : flights
          .filter((flight) => flight.actual_dep >= simClockMins && flight.status !== 'CANCELLED')
          .sort((a, b) => a.actual_dep - b.actual_dep);
    return source.slice(0, 6);
  }, [simResult, simClockMins]);

  if (!visible || nodes.length === 0) return null;

  return (
    <aside
      aria-label="India flight map"
      style={{
        position: 'absolute',
        top: 168,
        left: 24,
        zIndex: 12,
        width: 320,
        pointerEvents: 'none',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        borderRadius: 16,
        padding: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#38bdf8', fontWeight: 700 }}>
        INDIA NETWORK · {toHHMM(simClockMins)} IST
      </div>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        width="100%"
        height="250"
        role="img"
        aria-label="Flights across the Indian airport network"
      >
        <path d={outline} fill="rgba(14, 116, 144, 0.28)" stroke="#7dd3fc" strokeWidth="1.4" />
        {arcs.map((arc) => (
          <path key={arc.id} d={arc.d} fill="none" stroke={arc.color} strokeWidth="1.1" opacity="0.85">
            <title>{arc.label}</title>
          </path>
        ))}
        {nodes.map((node) => {
          const closed = closure?.airport === node.id;
          return (
            <g key={node.id}>
              <circle
                cx={node.point.x}
                cy={node.point.y}
                r={closed ? 4.5 : 3}
                fill={closed ? '#f87171' : '#f8fafc'}
              />
              <text x={node.point.x + 5} y={node.point.y - 4} fill="#e2e8f0" fontSize="8" fontWeight="700">
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {board.map((flight) => (
          <li key={flight.flight_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#e2e8f0' }}>
            <span>
              <b>{flight.flight_id}</b> {flight.origin}–{flight.destination}
            </span>
            <span style={{ color: flightColor(flight.status) }}>
              {flight.status === 'ON_TIME' ? 'On time' : flight.status === 'DELAYED' ? `+${flight.arr_delay}m` : 'Cancelled'}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
};
