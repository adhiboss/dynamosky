import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameStore, StationType } from '../../store/gameStore';

interface StationBeaconProps {
  id: StationType;
  name: string;
  action: string;
  position: [number, number, number];
  color?: string;
  radius?: number;
}

export const StationBeacon: React.FC<StationBeaconProps> = ({
  id,
  name,
  action,
  position,
  color = '#38bdf8',
  radius = 4.5,
}) => {
  const iconRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const setNearbyStation = useGameStore((state) => state.setNearbyStation);
  const nearbyStation = useGameStore((state) => state.nearbyStation);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (iconRef.current) {
      iconRef.current.rotation.y = t * 1.5;
      iconRef.current.position.y = position[1] + 1.2 + Math.sin(t * 2) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.8;
      const s = 1 + Math.sin(t * 3) * 0.1;
      ringRef.current.scale.set(s, s, 1);
    }

    // Distance check to player
    const dx = playerPosition[0] - position[0];
    const dy = playerPosition[1] - position[1];
    const dz = playerPosition[2] - position[2];
    const distSq = dx * dx + dy * dy + dz * dz;

    const isNearby = distSq <= radius * radius;
    if (isNearby) {
      if (!nearbyStation || nearbyStation.id !== id) {
        setNearbyStation({ id, name, action });
      }
    } else if (nearbyStation && nearbyStation.id === id) {
      setNearbyStation(null);
    }
  });

  return (
    <group position={position}>
      {/* Base Console Plinth */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.85, 0.8, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Hologram Emitter Ring on Floor */}
      <mesh ref={ringRef} position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.65, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Vertical Holographic Light Column */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 2, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Floating Rotating Beacon Icon */}
      <group ref={iconRef}>
        <mesh castShadow>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Outer Wireframe Cage */}
        <mesh>
          <octahedronGeometry args={[0.42, 0]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
        </mesh>
      </group>

      <Html position={[0, 3.1, 0]} center distanceFactor={18} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color: '#f8fafc',
            background: 'rgba(15, 23, 42, 0.82)',
            border: `1px solid ${color}`,
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {name}
        </div>
      </Html>
    </group>
  );
};
