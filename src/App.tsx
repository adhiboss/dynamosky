import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { KeyboardControls, Grid } from '@react-three/drei';
import { ControllerPlayer } from './components/character/ControllerPlayer';
import { GameHUD } from './components/ui/GameHUD';

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
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameHUD />

      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{ position: [0, 5, 10], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[40, 60, 30]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />

          <Suspense fallback={null}>
            <Physics timeStep="vary" gravity={[0, -9.81, 0]}>
              {/* Player Character */}
              <ControllerPlayer />

              {/* Ground Plane */}
              <RigidBody type="fixed" friction={1.2}>
                <mesh receiveShadow position={[0, -0.5, 0]}>
                  <boxGeometry args={[300, 1, 300]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
              </RigidBody>

              {/* Airport Apron Ground Grid & Marking Lines */}
              <Grid
                position={[0, 0.01, 0]}
                args={[300, 300]}
                cellSize={5}
                cellThickness={0.8}
                cellColor="#334155"
                sectionSize={25}
                sectionThickness={1.5}
                sectionColor="#475569"
                fadeDistance={120}
              />

              {/* Sample Welcome Pillar / Landmark */}
              <RigidBody type="fixed">
                <mesh position={[0, 2, -10]} castShadow receiveShadow>
                  <boxGeometry args={[4, 4, 4]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.4} />
                </mesh>
              </RigidBody>
            </Physics>
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default App;
