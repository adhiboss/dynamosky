import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { KeyboardControls, Grid } from '@react-three/drei';
import { ControllerPlayer } from './components/character/ControllerPlayer';
import { GameHUD } from './components/ui/GameHUD';
import { AirportBuildings } from './components/world/AirportBuildings';
import { RunwayAndApron } from './components/world/RunwayAndApron';
import { GroundVehicles } from './components/world/GroundVehicles';
import { NetworkHologram } from './components/hologram/NetworkHologram';
import { TimeScrubberHUD } from './components/ui/TimeScrubberHUD';
import { StationModal } from './components/modals/StationModal';
import { TowerStationView } from './components/modals/TowerStationView';
import { DepartureBoardView } from './components/modals/DepartureBoardView';
import { GatesStationView } from './components/modals/GatesStationView';
import { HangarStationView } from './components/modals/HangarStationView';
import { OpsCenterView } from './components/modals/OpsCenterView';
import { useGameStore } from './store/gameStore';
import { useSimulationStore } from './store/simulationStore';
import { validateFlightNetwork } from './engine';

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
  const setDataset = useSimulationStore((state) => state.setDataset);

  // Load and validate flight network dataset at startup
  useEffect(() => {
    fetch('/data/flight_network.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status} fetching flight network dataset`);
        return res.json();
      })
      .then((data) => {
        validateFlightNetwork(data);
        setDataset(data);
        console.log('Flight network dataset loaded and validated successfully.');
      })
      .catch((err) => {
        console.error('Fatal flight network startup validation error:', err);
        alert(`FATAL DATASET ERROR: ${err.message}`);
      });
  }, [setDataset]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameHUD />
      <TimeScrubberHUD />

      {/* Station Panel Modal */}
      <StationModal>
        {activeStation === 'TOWER' && <TowerStationView />}
        {activeStation === 'DEPARTURE_BOARD' && <DepartureBoardView />}
        {activeStation === 'GATES' && <GatesStationView />}
        {activeStation === 'HANGAR' && <HangarStationView />}
        {activeStation === 'OPS_CENTER' && <OpsCenterView />}
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

              {/* 3D Network Hologram with Flight Arcs & Moving Aircraft */}
              <NetworkHologram position={[0, 0.2, 5]} scale={0.85} />

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
