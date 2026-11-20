import React from 'react';
import * as THREE from 'three';

interface ProceduralAircraftProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  tailNumber?: string;
  isSpare?: boolean;
}

export const ProceduralAircraft: React.FC<ProceduralAircraftProps> = ({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  isSpare = false,
}) => {
  const primaryColor = isSpare ? '#f59e0b' : '#0284c7'; // Amber for Spares, Sky Blue for Active
  const liveryColor = isSpare ? '#b45309' : '#0369a1';

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main Fuselage Body */}
      <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Aerodynamic Nose Cone */}
      <mesh position={[0, 2.2, 9]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[1.2, 2.8, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Cockpit Windshield */}
      <mesh position={[0, 2.7, 8.2]} rotation={[Math.PI / 5, 0, 0]}>
        <boxGeometry args={[1.1, 0.45, 0.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Tail Cone */}
      <mesh position={[0, 2.2, -9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[1.2, 2.6, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* Airline Fuselage Livery Stripe */}
      <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.22, 1.22, 12, 16, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color={primaryColor} roughness={0.4} />
      </mesh>

      {/* Main Wings (Left and Right Swept Wings) */}
      <mesh position={[0, 1.8, 0.5]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 0.25, 3.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Winglets (Vertical Tips) */}
      <mesh position={[11, 2.5, 0.5]} rotation={[0, 0, 0.25]} castShadow>
        <boxGeometry args={[0.2, 1.4, 1.5]} />
        <meshStandardMaterial color={liveryColor} />
      </mesh>
      <mesh position={[-11, 2.5, 0.5]} rotation={[0, 0, -0.25]} castShadow>
        <boxGeometry args={[0.2, 1.4, 1.5]} />
        <meshStandardMaterial color={liveryColor} />
      </mesh>

      {/* Left Engine */}
      <group position={[-4.5, 1.2, 1.2]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.65, 3.2, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Engine Intake Fan */}
        <mesh position={[0, 0, 1.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.1, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Engine Pylon Mount to Wing */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.2, 0.8, 1.4]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* Right Engine */}
      <group position={[4.5, 1.2, 1.2]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.65, 3.2, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 1.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.1, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.2, 0.8, 1.4]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* Horizontal Stabilizers (Tail Wings) */}
      <mesh position={[0, 3.2, -8.5]} castShadow>
        <boxGeometry args={[7.5, 0.18, 1.8]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Vertical Stabilizer (Tail Fin) */}
      <mesh position={[0, 4.4, -8.2]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.25, 3.6, 2.4]} />
        <meshStandardMaterial color={primaryColor} roughness={0.3} />
      </mesh>

      {/* Landing Gear Wheels (Tricycle Gear) */}
      {/* Nose Gear */}
      <group position={[0, 0.45, 6.8]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* Main Gear Left */}
      <group position={[-2.4, 0.45, -0.6]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.35, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* Main Gear Right */}
      <group position={[2.4, 0.45, -0.6]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.35, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};
