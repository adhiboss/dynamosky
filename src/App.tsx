import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { KeyboardControls, Grid } from '@react-three/drei';
import { ControllerPlayer } from './components/character/ControllerPlayer';
import { GameHUD } from './components/ui/GameHUD';
import { AirportBuildings } from './components/world/AirportBuildings';
import { RunwayAndApron } from './components/world/RunwayAndApron';
import { GroundVehicles } from './components/world/GroundVehicles';
import { StationModal } from './components/modals/StationModal';
import { useGameStore } from './store/gameStore';

// Ecctrl keyboard map
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
];

export const App: React.FC = () => {
  const activeStation = useGameStore((state) => state.activeStation);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameHUD />

      {/* Station Panel Modal */}
      <StationModal>
        {activeStation === 'TOWER' && (
          <div style={{ color: '#f8fafc', padding: 12 }}>
            <h3 style={{ fontSize: 18, color: '#38bdf8', marginBottom: 8 }}>ATC Control Tower Console</h3>
            <p style={{ color: '#94a3b8' }}>
              Select an airport and declare emergency airspace closures. Observe real-time ripple effects across India's 16-airport network.
            </p>
          </div>
        )}
        {activeStation === 'DEPARTURE_BOARD' && (
          <div style={{ color: '#f8fafc', padding: 12 }}>
            <h3 style={{ fontSize: 18, color: '#38bdf8', marginBottom: 8 }}>Terminal Flight Information Display</h3>
            <p style={{ color: '#94a3b8' }}>Real-time flight statuses, delay minutes, and causal attribution chain.</p>
          </div>
        )}
        {activeStation === 'OPS_CENTER' && (
          <div style={{ color: '#f8fafc', padding: 12 }}>
            <h3 style={{ fontSize: 18, color: '#10b981', marginBottom: 8 }}>Airline Operations Dispatch</h3>
            <p style={{ color: '#94a3b8' }}>Autonomous AI recovery planner proposing candidate mitigations verified by the engine.</p>
          </div>
        )}
        {activeStation === 'GATES' && (
          <div style={{ color: '#f8fafc', padding: 12 }}>
            <h3 style={{ fontSize: 18, color: '#f59e0b', marginBottom: 8 }}>Gate Concourse & Passenger Crowds</h3>
            <p style={{ color: '#94a3b8' }}>Stranded passengers and missed connection transfers.</p>
          </div>
        )}
        {activeStation === 'HANGAR' && (
          <div style={{ color: '#f8fafc', padding: 12 }}>
            <h3 style={{ fontSize: 18, color: '#f59e0b', marginBottom: 8 }}>Maintenance Hangar & Spares</h3>
            <p style={{ color: '#94a3b8' }}>Standby reserve aircraft fleet status and bases.</p>
          </div>
        )}
      </StationModal>

      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{ position: [0, 5, 10], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Sky & Atmosphere Lighting */}
          <color attach="background" args={['#0b1329']} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[40, 70, 30]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-70}
            shadow-camera-right={70}
            shadow-camera-top={70}
            shadow-camera-bottom={-70}
            shadow-bias={-0.0005}
          />

          <Suspense fallback={null}>
            <Physics timeStep="vary" gravity={[0, -9.81, 0]}>
              {/* Ground Asphalt Plane */}
              <RigidBody type="fixed" friction={1.2}>
                <mesh receiveShadow position={[0, -0.5, 0]}>
                  <boxGeometry args={[400, 1, 400]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.85} />
                </mesh>
              </RigidBody>

              {/* Apron Markings Grid */}
              <Grid
                position={[0, 0.01, 0]}
                args={[350, 350]}
                cellSize={6}
                cellThickness={0.8}
                cellColor="#334155"
                sectionSize={30}
                sectionThickness={1.5}
                sectionColor="#475569"
                fadeDistance={140}
              />

              {/* Procedural Airport Buildings & Stations */}
              <AirportBuildings />

              {/* Runway, Apron, and Parked Aircraft */}
              <RunwayAndApron />

              {/* Ground Vehicles Driving Loops */}
              <GroundVehicles />

              {/* Player Character */}
              <ControllerPlayer />
            </Physics>
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default App;
