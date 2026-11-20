import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Ecctrl, type EcctrlHandle } from 'ecctrl';
import { EcctrlCameraControls, type EcctrlCameraControlsHandle } from 'ecctrl/camera';
import { ControllerAvatar } from './ControllerAvatar';
import { useGameStore } from '../../store/gameStore';

export const ControllerPlayer: React.FC = () => {
  const ecctrlRef = useRef<EcctrlHandle | null>(null);
  const cameraControlsRef = useRef<EcctrlCameraControlsHandle | null>(null);
  const [, getKeys] = useKeyboardControls();
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const [isMoving, setIsMoving] = useState(false);

  // Position throttle for store updates (every 5 frames to avoid excessive re-renders)
  const frameCount = useRef(0);

  useFrame(() => {
    const keys = getKeys();
    const forward = Boolean(keys.forward);
    const backward = Boolean(keys.backward);
    const leftward = Boolean(keys.leftward);
    const rightward = Boolean(keys.rightward);
    const run = Boolean(keys.run);
    const jump = Boolean(keys.jump);

    const moving = forward || backward || leftward || rightward;
    if (moving !== isMoving) {
      setIsMoving(moving);
    }

    if (ecctrlRef.current && ecctrlRef.current.body) {
      // Send movement to ecctrl
      ecctrlRef.current.setMovement({
        forward,
        backward,
        leftward,
        rightward,
        run,
        jump,
      });

      // Update camera follow target
      const currPos = ecctrlRef.current.currPos;
      if (currPos && cameraControlsRef.current) {
        cameraControlsRef.current.setTarget(currPos.x, currPos.y + 0.9, currPos.z, true);
      }

      // Update global player position for interaction range checks
      frameCount.current += 1;
      if (frameCount.current % 4 === 0 && currPos) {
        setPlayerPosition([currPos.x, currPos.y, currPos.z]);
      }
    }
  });

  return (
    <>
      <EcctrlCameraControls
        ref={cameraControlsRef}
        makeDefault
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.05}
        smoothTime={0.2}
      />
      <Ecctrl
        ref={ecctrlRef}
        position={[0, 2, 0]}
        maxWalkVel={3.2}
        maxRunVel={7.0}
        jumpVel={6}
        capsuleRadius={0.35}
        capsuleHalfHeight={0.45}
        floatHeight={0.25}
        springK={4000}
        dampingC={600}
        autoBalance={true}
      >
        <ControllerAvatar isMoving={isMoving} />
      </Ecctrl>
    </>
  );
};
