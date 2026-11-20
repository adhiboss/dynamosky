import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ControllerAvatarProps {
  isMoving?: boolean;
}

export const ControllerAvatar: React.FC<ControllerAvatarProps> = ({ isMoving = false }) => {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 10;
    if (isMoving) {
      const legAngle = Math.sin(t) * 0.45;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legAngle;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -legAngle * 0.6;
      if (rightArmRef.current) rightArmRef.current.rotation.x = legAngle * 0.6;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
    }
  });

  return (
    <group position={[0, -0.85, 0]}>
      {/* Pelvis & Lower Torso */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.42, 0.25, 0.26]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Torso with Airport Hi-Vis Vest */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.46, 0.45, 0.28]} />
        <meshStandardMaterial color="#facc15" roughness={0.4} /> {/* Neon Yellow Vest */}
      </mesh>
      {/* Reflective Stripes on Vest */}
      <mesh position={[0, 1.15, 0.145]}>
        <boxGeometry args={[0.47, 0.06, 0.01]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.95, 0.145]}>
        <boxGeometry args={[0.47, 0.06, 0.01]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Head & Neck */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#d4a373" />
      </mesh>
      <mesh position={[0, 1.48, 0]} castShadow>
        <boxGeometry args={[0.26, 0.26, 0.26]} />
        <meshStandardMaterial color="#e0a96d" roughness={0.5} />
      </mesh>
      {/* Airport Cap */}
      <mesh position={[0, 1.62, 0.02]} castShadow>
        <boxGeometry args={[0.28, 0.08, 0.28]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Cap Visor */}
      <mesh position={[0, 1.58, 0.16]} castShadow>
        <boxGeometry args={[0.24, 0.03, 0.12]} />
        <meshStandardMaterial color="#020617" roughness={0.8} />
      </mesh>
      {/* Communications Headset */}
      <mesh position={[0, 1.52, 0]}>
        <torusGeometry args={[0.15, 0.02, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#334155" metalness={0.5} />
      </mesh>
      <mesh position={[0.14, 1.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.14, 1.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Mic Boom */}
      <mesh position={[0.08, 1.44, 0.12]}>
        <boxGeometry args={[0.12, 0.015, 0.015]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.12, 0.65, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.16, 0.65, 0.18]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Safety Boot */}
        <mesh position={[0, -0.65, 0.04]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.26]} />
          <meshStandardMaterial color="#090d16" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.12, 0.65, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.16, 0.65, 0.18]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Safety Boot */}
        <mesh position={[0, -0.65, 0.04]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.26]} />
          <meshStandardMaterial color="#090d16" roughness={0.9} />
        </mesh>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.28, 1.2, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.14]} />
          <meshStandardMaterial color="#0284c7" /> {/* Navy Operations Shirt */}
        </mesh>
        {/* Armband */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.13, 0.08, 0.15]} />
          <meshStandardMaterial color="#ea580c" /> {/* Orange Controller Armband */}
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.28, 1.2, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.14]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>
    </group>
  );
};
