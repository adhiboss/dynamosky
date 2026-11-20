import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const GroundVehicles: React.FC = () => {
  const tugGroupRef = useRef<THREE.Group>(null);
  const cart1Ref = useRef<THREE.Group>(null);
  const cart2Ref = useRef<THREE.Group>(null);
  const fuelTruckRef = useRef<THREE.Group>(null);

  // Path parameters for Tug loop
  // Rounded rectangle loop around apron: X in [-30, 20], Z in [-25, 5]
  useFrame(({ clock }) => {
    const t1 = clock.getElapsedTime() * 0.35;
    const t2 = clock.getElapsedTime() * 0.25;

    // Tug route
    if (tugGroupRef.current) {
      const loopWidth = 40;
      const loopHeight = 25;
      const totalPerimeter = (loopWidth + loopHeight) * 2;
      const progress = (t1 * 15) % totalPerimeter;

      let x = 0;
      let z = 0;
      let rotY = 0;

      if (progress < loopWidth) {
        // Leg 1: along X
        x = -20 + progress;
        z = 5;
        rotY = Math.PI / 2;
      } else if (progress < loopWidth + loopHeight) {
        // Leg 2: along Z
        x = 20;
        z = 5 - (progress - loopWidth);
        rotY = Math.PI;
      } else if (progress < loopWidth * 2 + loopHeight) {
        // Leg 3: along -X
        x = 20 - (progress - (loopWidth + loopHeight));
        z = -20;
        rotY = -Math.PI / 2;
      } else {
        // Leg 4: along +Z
        x = -20;
        z = -20 + (progress - (loopWidth * 2 + loopHeight));
        rotY = 0;
      }

      tugGroupRef.current.position.set(x, 0, z);
      tugGroupRef.current.rotation.y = rotY;

      // Trailing carts
      if (cart1Ref.current) {
        const c1Progress = (progress - 3.2 + totalPerimeter) % totalPerimeter;
        const c1Pos = getLoopPoint(c1Progress, loopWidth, loopHeight);
        cart1Ref.current.position.set(c1Pos.x, 0, c1Pos.z);
        cart1Ref.current.rotation.y = c1Pos.rotY;
      }
      if (cart2Ref.current) {
        const c2Progress = (progress - 5.8 + totalPerimeter) % totalPerimeter;
        const c2Pos = getLoopPoint(c2Progress, loopWidth, loopHeight);
        cart2Ref.current.position.set(c2Pos.x, 0, c2Pos.z);
        cart2Ref.current.rotation.y = c2Pos.rotY;
      }
    }

    // Fuel truck route (wider perimeter)
    if (fuelTruckRef.current) {
      const radius = 35;
      const angle = t2 * 0.8;
      fuelTruckRef.current.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * 15 - 10
      );
      fuelTruckRef.current.rotation.y = -angle + Math.PI / 2;
    }
  });

  function getLoopPoint(p: number, loopWidth: number, loopHeight: number) {
    if (p < loopWidth) {
      return { x: -20 + p, z: 5, rotY: Math.PI / 2 };
    } else if (p < loopWidth + loopHeight) {
      return { x: 20, z: 5 - (p - loopWidth), rotY: Math.PI };
    } else if (p < loopWidth * 2 + loopHeight) {
      return { x: 20 - (p - (loopWidth + loopHeight)), z: -20, rotY: -Math.PI / 2 };
    } else {
      return { x: -20, z: -20 + (p - (loopWidth * 2 + loopHeight)), rotY: 0 };
    }
  }

  return (
    <group>
      {/* 1. Baggage Tug Tractor */}
      <group ref={tugGroupRef}>
        {/* Chassis */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.5, 0.5, 2.6]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} /> {/* Airport Fleet Yellow */}
        </mesh>
        {/* Driver Cab */}
        <mesh position={[0, 1.0, -0.4]} castShadow>
          <boxGeometry args={[1.4, 0.7, 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Windshield */}
        <mesh position={[0, 1.0, 0.22]}>
          <planeGeometry args={[1.2, 0.5]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.5} />
        </mesh>
        {/* Amber Flashing Beacon */}
        <mesh position={[0, 1.45, -0.4]}>
          <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        </mesh>
        {/* Wheels */}
        {[-0.8, 0.8].map((x) =>
          [-0.7, 0.7].map((z) => (
            <mesh key={`tug-w-${x}-${z}`} position={[x, 0.25, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.25, 0.25, 0.2, 8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* Baggage Cart 1 */}
      <group ref={cart1Ref}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.4, 0.4, 2]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* Luggage pieces */}
        <mesh position={[-0.2, 0.65, 0]} castShadow>
          <boxGeometry args={[0.6, 0.3, 0.8]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0.3, 0.65, 0.2]} castShadow>
          <boxGeometry args={[0.5, 0.35, 0.7]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
        {/* Wheels */}
        {[-0.75, 0.75].map((x) =>
          [-0.6, 0.6].map((z) => (
            <mesh key={`c1-w-${x}-${z}`} position={[x, 0.2, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.18, 0.18, 0.15, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          ))
        )}
      </group>

      {/* Baggage Cart 2 */}
      <group ref={cart2Ref}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.4, 0.4, 2]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* Luggage pieces */}
        <mesh position={[0.1, 0.65, -0.2]} castShadow>
          <boxGeometry args={[0.6, 0.35, 0.9]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        {/* Wheels */}
        {[-0.75, 0.75].map((x) =>
          [-0.6, 0.6].map((z) => (
            <mesh key={`c2-w-${x}-${z}`} position={[x, 0.2, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.18, 0.18, 0.15, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          ))
        )}
      </group>

      {/* 2. Heavy Airport Fuel Bowser Tanker */}
      <group ref={fuelTruckRef}>
        {/* Cab */}
        <mesh position={[0, 0.9, 2.2]} castShadow>
          <boxGeometry args={[2, 1.4, 1.6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        {/* Windshield */}
        <mesh position={[0, 1.1, 3.02]}>
          <planeGeometry args={[1.8, 0.6]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} />
        </mesh>
        {/* Fuel Tank Cylinder */}
        <mesh position={[0, 1.3, -0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[1.1, 1.1, 4.2, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Red Aviation Fuel Hazard Band */}
        <mesh position={[0, 1.3, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.12, 1.12, 0.8, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {/* Beacon */}
        <mesh position={[0, 1.7, 2.2]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        </mesh>
        {/* Heavy Truck Wheels */}
        {[-1.1, 1.1].map((x) =>
          [-1.8, -0.6, 2.0].map((z) => (
            <mesh key={`ft-w-${x}-${z}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.45, 0.45, 0.3, 10]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
};
