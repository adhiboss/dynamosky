import React from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { StationBeacon } from './StationBeacon';

export const AirportBuildings: React.FC = () => {
  return (
    <group>
      {/* =========================================================================
          1. CONTROL TOWER (Tower Shaft & Observation Cab)
          Location: X: 0, Z: -35
         ========================================================================= */}
      <group position={[0, 0, -35]}>
        {/* Foundation Plinth */}
        <RigidBody type="fixed">
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[5, 6, 1, 16]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
          {/* Main Tower Shaft */}
          <mesh position={[0, 7, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.8, 3.8, 12, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.2} />
          </mesh>
        </RigidBody>

        {/* Observation Cab Base Deck */}
        <mesh position={[0, 13.2, 0]} castShadow>
          <cylinderGeometry args={[6.5, 3.2, 0.8, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>

        {/* Glass Windows of Observation Cab */}
        <mesh position={[0, 14.5, 0]}>
          <cylinderGeometry args={[6.2, 6.2, 1.8, 16, 1, true]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {/* Observation Cab Roof */}
        <mesh position={[0, 15.6, 0]} castShadow>
          <cylinderGeometry args={[6.6, 6.2, 0.6, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* Roof Radome & Communications Antennas */}
        <mesh position={[0, 16.5, 0]} castShadow>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        <mesh position={[1.8, 17, 1.5]}>
          <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[-1.8, 17, -1.5]}>
          <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>

        {/* Rotating Radar Scanner */}
        <mesh position={[0, 18.2, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[3, 0.4, 0.1]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} />
        </mesh>

        {/* Ground Access Lobby & Ramp for Player */}
        <RigidBody type="fixed">
          <mesh position={[0, 1.5, 4.5]} castShadow receiveShadow>
            <boxGeometry args={[4.5, 3, 4]} />
            <meshStandardMaterial color="#475569" roughness={0.6} />
          </mesh>
        </RigidBody>

        {/* Station Interaction Beacon for Control Tower */}
        <StationBeacon
          id="TOWER"
          name="Control Tower"
          action="Airspace & Airport Closures"
          position={[0, 0.05, -28]}
          color="#38bdf8"
        />
      </group>

      {/* =========================================================================
          2. MAIN TERMINAL BUILDING & DEPARTURE CONCOURSE
          Location: X: -35, Z: 15
         ========================================================================= */}
      <group position={[-35, 0, 15]}>
        <RigidBody type="fixed">
          {/* Main Concourse Structure */}
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[26, 8, 22]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Curved Modern Terminal Canopy / Overhang */}
          <mesh position={[0, 8.2, 2]} castShadow receiveShadow>
            <boxGeometry args={[28, 0.6, 26]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          {/* Curbside Columns */}
          <mesh position={[-12, 4, 12]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 8, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
          </mesh>
          <mesh position={[0, 4, 12]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 8, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
          </mesh>
          <mesh position={[12, 4, 12]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 8, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
          </mesh>
        </RigidBody>

        {/* Glass Front Wall / Windows */}
        <mesh position={[0, 3.5, 11.05]}>
          <planeGeometry args={[24, 6]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.1} />
        </mesh>

        {/* Terminal Signage */}
        <mesh position={[0, 7.2, 11.2]}>
          <boxGeometry args={[14, 1.2, 0.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Departure Board Station Beacon */}
        <StationBeacon
          id="DEPARTURE_BOARD"
          name="Terminal Departure Boards"
          action="Flight Delay Breakdown"
          position={[-35, 0.05, 27]}
          color="#38bdf8"
        />
      </group>

      {/* =========================================================================
          3. BOARDING GATES CONCOURSE & JET BRIDGES
          Location: X: -35, Z: -15
         ========================================================================= */}
      <group position={[-35, 0, -12]}>
        <RigidBody type="fixed">
          {/* Concourse Pier */}
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <boxGeometry args={[16, 6, 24]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
          {/* Jet Bridge Gate 1 (extending toward Apron) */}
          <mesh position={[12, 2.5, -6]} castShadow receiveShadow>
            <boxGeometry args={[10, 2.4, 2.4]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} />
          </mesh>
          {/* Jet Bridge Gate 2 */}
          <mesh position={[12, 2.5, 6]} castShadow receiveShadow>
            <boxGeometry args={[10, 2.4, 2.4]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} />
          </mesh>
        </RigidBody>

        {/* Gate Pier Observation Glass */}
        <mesh position={[8.05, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[20, 4]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.1} />
        </mesh>

        {/* Gate Concourse Station Beacon */}
        <StationBeacon
          id="GATES"
          name="Gate Concourse"
          action="Passenger Crowds & Transfers"
          position={[-23, 0.05, -12]}
          color="#f59e0b"
        />
      </group>

      {/* =========================================================================
          4. OPERATIONS CENTRE (Airlines Crisis Control)
          Location: X: 35, Z: 15
         ========================================================================= */}
      <group position={[35, 0, 15]}>
        <RigidBody type="fixed">
          {/* High-Tech Bunker / Hub Building */}
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[22, 7, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Accent Glow Fascia */}
          <mesh position={[0, 6.8, 0]} castShadow>
            <boxGeometry args={[22.4, 0.5, 20.4]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </mesh>
          {/* Satellite Dishes on Roof */}
          <mesh position={[-6, 7.8, -5]} rotation={[-0.4, 0.5, 0]}>
            <sphereGeometry args={[1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
            <meshStandardMaterial color="#e2e8f0" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[6, 7.8, -5]} rotation={[-0.3, -0.4, 0]}>
            <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
            <meshStandardMaterial color="#e2e8f0" side={THREE.DoubleSide} />
          </mesh>
        </RigidBody>

        {/* Entrance Portal */}
        <mesh position={[0, 2, 10.1]}>
          <boxGeometry args={[6, 4, 0.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>

        {/* Ops Centre Station Beacon */}
        <StationBeacon
          id="OPS_CENTER"
          name="Operations Centre"
          action="AI Crisis Dispatcher"
          position={[35, 0.05, 27]}
          color="#10b981"
        />
      </group>

      {/* =========================================================================
          5. MAINTENANCE HANGAR (Houses Spare Aircraft)
          Location: X: 40, Z: -35
         ========================================================================= */}
      <group position={[40, 0, -35]}>
        <RigidBody type="fixed">
          {/* Hangar Walls and Arched Roof */}
          <mesh position={[0, 6, 0]} castShadow receiveShadow>
            <boxGeometry args={[28, 12, 32]} />
            <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
          </mesh>
          {/* Main Hangar Open Bay Cutout (Represented by Open Portal Facing Runway) */}
          <mesh position={[0, 5, -16.1]}>
            <planeGeometry args={[22, 10]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
        </RigidBody>

        {/* Industrial Support Columns */}
        <mesh position={[-12, 5, -16.2]} castShadow>
          <boxGeometry args={[1.5, 10, 1]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
        <mesh position={[12, 5, -16.2]} castShadow>
          <boxGeometry args={[1.5, 10, 1]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>

        {/* Hangar Station Beacon */}
        <StationBeacon
          id="HANGAR"
          name="Maintenance Hangar"
          action="Standby Spare Aircraft"
          position={[40, 0.05, -17]}
          color="#f59e0b"
        />
      </group>
    </group>
  );
};
