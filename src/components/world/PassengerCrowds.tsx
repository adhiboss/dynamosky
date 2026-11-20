import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { useGameStore } from '../../store/gameStore';

export const PassengerCrowds: React.FC = () => {
  const { simResult } = useSimulationStore();
  const { currentAirportId } = useGameStore();

  const maxPassengers = 140;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const luggageRef = useRef<THREE.InstancedMesh>(null);

  // Compute how many stranded passengers are at the current airport
  const localStrandedPax = useMemo(() => {
    if (!simResult) return 0;

    let strandedAtCurrent = 0;
    // Cancelled flights departing current airport
    Object.values(simResult.flights).forEach((fl) => {
      if (fl.origin === currentAirportId && (fl.status === 'CANCELLED' || fl.status === 'OUT_OF_POSITION')) {
        strandedAtCurrent += fl.pax;
      }
    });

    // Missed transfers at current airport
    simResult.connections.forEach((c) => {
      if (c.airport === currentAirportId && !c.made) {
        strandedAtCurrent += c.passengers;
      }
    });

    return strandedAtCurrent;
  }, [simResult, currentAirportId]);

  // Active crowd count (min 8 normal travelers, up to 140 if stranded)
  const activeCrowdCount = useMemo(() => {
    if (localStrandedPax === 0) return 8; // calm normal airport
    return Math.min(maxPassengers, Math.max(12, Math.floor(localStrandedPax / 3.5)));
  }, [localStrandedPax, maxPassengers]);

  // Precompute random passenger spawn positions around Gate Concourse (X: -35 to -22, Z: -22 to 5)
  const passengerOffsets = useMemo(() => {
    const list: Array<{ x: number; z: number; rotY: number; scaleY: number }> = [];
    for (let i = 0; i < maxPassengers; i++) {
      // Cluster around Gate Concourse floor
      const x = -33 + (Math.random() * 10 - 5);
      const z = -12 + (Math.random() * 20 - 10);
      const rotY = Math.random() * Math.PI * 2;
      const scaleY = 0.85 + Math.random() * 0.3;
      list.push({ x, z, rotY, scaleY });
    }
    return list;
  }, [maxPassengers]);

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    const colors = [
      new THREE.Color('#3b82f6'),
      new THREE.Color('#ef4444'),
      new THREE.Color('#10b981'),
      new THREE.Color('#f59e0b'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#64748b'),
    ];

    for (let i = 0; i < maxPassengers; i++) {
      if (i < activeCrowdCount) {
        const p = passengerOffsets[i];
        dummy.position.set(p.x, 0.7, p.z);
        dummy.rotation.set(0, p.rotY, 0);
        dummy.scale.set(0.35, p.scaleY * 0.45, 0.35);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);

        // Random clothing color
        const color = colors[i % colors.length];
        meshRef.current.setColorAt(i, color);

        if (luggageRef.current) {
          dummy.position.set(p.x + 0.3, 0.25, p.z + 0.2);
          dummy.scale.set(0.2, 0.3, 0.25);
          dummy.updateMatrix();
          luggageRef.current.setMatrixAt(i, dummy.matrix);
        }
      } else {
        // Hide unused instances below floor
        dummy.position.set(0, -50, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        if (luggageRef.current) {
          luggageRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    if (luggageRef.current) luggageRef.current.instanceMatrix.needsUpdate = true;
  }, [activeCrowdCount, passengerOffsets, maxPassengers]);

  return (
    <group>
      {/* Instanced Passenger Bodies */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, maxPassengers]}
        castShadow
      >
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>

      {/* Instanced Passenger Suitcases */}
      <instancedMesh
        ref={luggageRef}
        args={[undefined, undefined, maxPassengers]}
        castShadow
      >
        <boxGeometry args={[0.7, 0.8, 0.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </instancedMesh>
    </group>
  );
};
