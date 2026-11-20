import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSimulationStore } from '../../store/simulationStore';
import { useGameStore } from '../../store/gameStore';
import { projectLatLng } from './latLngProjection';

interface NetworkHologramProps {
  position?: [number, number, number];
  scale?: number;
}

export const NetworkHologram: React.FC<NetworkHologramProps> = ({
  position = [0, 1.5, 5],
  scale = 0.8,
}) => {
  const { dataset, simResult, closure } = useSimulationStore();
  const { simClockMins, currentAirportId, setCurrentAirportId } = useGameStore();

  const scanlineRef = useRef<THREE.Mesh>(null);

  // Compute 3D positions for all 16 airports
  const airportNodes = useMemo(() => {
    if (!dataset) return [];
    return dataset.airports.map((a) => {
      const p = projectLatLng(a.lat, a.lng, 20.5, 79.0, 1.35, 1.6, 0.4);
      return {
        ...a,
        pos3D: new THREE.Vector3(p.x, p.y, p.z),
      };
    });
  }, [dataset]);

  const airportMap = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    airportNodes.forEach((n) => map.set(n.id, n.pos3D));
    return map;
  }, [airportNodes]);

  // Compute 3D Arcs for all scheduled flights
  const flightArcs = useMemo(() => {
    if (!dataset) return [];
    return dataset.flights.map((f) => {
      const origPos = airportMap.get(f.origin);
      const destPos = airportMap.get(f.destination);
      if (!origPos || !destPos) return null;

      const mid = new THREE.Vector3()
        .addVectors(origPos, destPos)
        .multiplyScalar(0.5);
      const dist = origPos.distanceTo(destPos);
      mid.y += Math.max(1.8, dist * 0.28); // Elevated arc

      const curve = new THREE.QuadraticBezierCurve3(origPos, mid, destPos);
      const points = curve.getPoints(24);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return {
        flight_id: f.flight_id,
        orig: f.origin,
        dest: f.destination,
        curve,
        geometry,
      };
    }).filter(Boolean) as Array<{
      flight_id: string;
      orig: string;
      dest: string;
      curve: THREE.QuadraticBezierCurve3;
      geometry: THREE.BufferGeometry;
    }>;
  }, [dataset, airportMap]);

  // Moving aircraft state calculated based on simClockMins
  const activeAircraft = useMemo(() => {
    if (!simResult) return [];

    return Object.values(simResult.flights).map((fl) => {
      const arc = flightArcs.find((a) => a.flight_id === fl.flight_id);
      if (!arc) return null;

      const isCancelled = fl.status === 'CANCELLED' || fl.status === 'OUT_OF_POSITION';
      const isDelayed = fl.arr_delay >= 15;
      const isSevere = fl.arr_delay >= 60;

      let color = '#38bdf8'; // on-time cyan
      if (isCancelled) color = '#64748b'; // grey
      else if (isSevere) color = '#ef4444'; // red
      else if (isDelayed) color = '#f59e0b'; // amber

      // Determine flight progress
      let pos: THREE.Vector3;
      let inFlight = false;

      if (isCancelled) {
        // Stays at origin
        pos = arc.curve.getPoint(0);
      } else if (simClockMins < fl.actual_dep) {
        // Waiting at origin
        pos = arc.curve.getPoint(0);
      } else if (simClockMins >= fl.actual_arr) {
        // Landed at destination
        pos = arc.curve.getPoint(1);
      } else {
        // In flight
        inFlight = true;
        const totalDuration = Math.max(1, fl.actual_arr - fl.actual_dep);
        const t = Math.max(0, Math.min(1, (simClockMins - fl.actual_dep) / totalDuration));
        pos = arc.curve.getPoint(t);
      }

      return {
        flight_id: fl.flight_id,
        tail_id: fl.effective_tail_id,
        status: fl.status,
        delay: fl.arr_delay,
        color,
        pos,
        inFlight,
      };
    }).filter(Boolean) as Array<{
      flight_id: string;
      tail_id: string;
      status: string;
      delay: number;
      color: string;
      pos: THREE.Vector3;
      inFlight: boolean;
    }>;
  }, [simResult, flightArcs, simClockMins]);

  useFrame(({ clock }) => {
    if (scanlineRef.current) {
      scanlineRef.current.position.y = 0.2 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* =========================================================================
          1. HOLOGRAPHIC PROJECTOR TABLE BASE
         ========================================================================= */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[18, 19, 0.4, 32]} />
        <meshStandardMaterial color="#090d16" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Outer Hologram Grid Rings */}
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[16, 16.3, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10, 10.15, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>

      {/* Scanning Laser Disc */}
      <mesh ref={scanlineRef} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[16, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* =========================================================================
          2. 16 AIRPORT NODES & 3D LABELS
         ========================================================================= */}
      {airportNodes.map((airport) => {
        const isCurrent = airport.id === currentAirportId;
        const isClosed = closure && closure.airport === airport.id;
        const nodeColor = isClosed ? '#ef4444' : isCurrent ? '#38bdf8' : '#0284c7';

        return (
          <group
            key={airport.id}
            position={[airport.pos3D.x, airport.pos3D.y, airport.pos3D.z]}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentAirportId(airport.id);
            }}
          >
            {/* Holographic Light Pillar */}
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
              <meshBasicMaterial color={nodeColor} transparent opacity={0.7} />
            </mesh>

            {/* Base Glowing Disc */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[isCurrent ? 0.7 : 0.45, 16]} />
              <meshBasicMaterial color={nodeColor} transparent opacity={0.8} />
            </mesh>

            {/* Floating Node Core */}
            <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Weather Storm Indicator Cone if Closed */}
            {isClosed && (
              <group position={[0, 2.5, 0]}>
                <mesh>
                  <coneGeometry args={[0.8, 1.4, 8]} />
                  <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.8} />
                </mesh>
                <mesh position={[0, 0.8, 0]}>
                  <sphereGeometry args={[0.3, 8, 8]} />
                  <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
                </mesh>
              </group>
            )}

            {/* 3D Floating Airport Label */}
            <Html position={[0, 1.6, 0]} center distanceFactor={18} zIndexRange={[100, 0]}>
              <div
                style={{
                  background: isClosed
                    ? 'rgba(239, 68, 68, 0.9)'
                    : isCurrent
                    ? 'rgba(56, 189, 248, 0.9)'
                    : 'rgba(15, 23, 42, 0.85)',
                  color: isCurrent || isClosed ? '#0f172a' : '#f8fafc',
                  border: isCurrent
                    ? '2px solid #ffffff'
                    : isClosed
                    ? '2px solid #fee2e2'
                    : '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'auto',
                }}
                onClick={() => setCurrentAirportId(airport.id)}
              >
                {airport.id} {isClosed ? '⚠️' : ''}
              </div>
            </Html>
          </group>
        );
      })}

      {/* =========================================================================
          3. 3D FLIGHT ROUTE ARCS
         ========================================================================= */}
      {flightArcs.map((arc) => (
        <primitive
          key={`arc-${arc.flight_id}`}
          object={
            new THREE.Line(
              arc.geometry,
              new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 })
            )
          }
        />
      ))}

      {/* =========================================================================
          4. MOVING AIRCRAFT ON THE HOLOGRAPHIC NETWORK
         ========================================================================= */}
      {activeAircraft.map((plane) => (
        <group key={`craft-${plane.flight_id}`} position={[plane.pos.x, plane.pos.y, plane.pos.z]}>
          {/* Miniature Airplane Marker */}
          <mesh castShadow>
            <coneGeometry args={[0.2, 0.5, 6]} />
            <meshStandardMaterial
              color={plane.color}
              emissive={plane.color}
              emissiveIntensity={0.8}
            />
          </mesh>
          {/* Glow Halo */}
          {plane.inFlight && (
            <mesh>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshBasicMaterial color={plane.color} transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};
