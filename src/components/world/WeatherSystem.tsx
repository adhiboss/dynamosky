import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSimulationStore } from '../../store/simulationStore';
import { useGameStore } from '../../store/gameStore';
import { audio } from '../../services/audioService';

export const WeatherSystem: React.FC = () => {
  const { closure } = useSimulationStore();
  const { currentAirportId, simClockMins } = useGameStore();
  const { scene } = useThree();

  const isStorming = closure && closure.airport === currentAirportId;

  // Rain particles buffer
  const rainCount = 2400;
  const { rainPositions, rainVelocities } = useMemo(() => {
    const pos = new Float32Array(rainCount * 3);
    const vel = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 140;
      vel[i] = 30 + Math.random() * 30;
    }
    return { rainPositions: pos, rainVelocities: vel };
  }, [rainCount]);

  const rainPointsRef = useRef<THREE.Points>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  // Lightning timing state
  const nextFlashTime = useRef<number>(5);
  const flashIntensity = useRef<number>(0);

  // Set up scene fog
  useEffect(() => {
    scene.fog = new THREE.Fog(isStorming ? 0x1e293b : 0x0b1329, 60, 260);
    return () => {
      scene.fog = null;
    };
  }, [scene, isStorming]);

  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime();

    // 1. Day / Night Sun Position
    // simClockMins runs from 0 to 1440. 06:00 is morning flight operations start.
    const hour = simClockMins / 60; // 0 to 24
    const isDay = hour >= 5.5 && hour <= 19.0;
    const dayProgress = Math.max(0, Math.min(Math.PI, ((hour - 5) / 14) * Math.PI));
    const sunElev = isDay ? Math.sin(dayProgress) : 0.25;
    const sunAngle = ((hour - 5) / 14) * Math.PI;

    if (sunLightRef.current) {
      sunLightRef.current.position.set(
        Math.cos(sunAngle) * 80,
        Math.max(30, sunElev * 90),
        Math.sin(sunAngle) * 60
      );
      // Dim sun slightly during storm, keep airport clearly visible
      const stormMul = isStorming ? 0.55 : 1.0;
      sunLightRef.current.intensity = (0.75 + sunElev * 1.0) * stormMul;
    }

    // 2. Dynamic Fog Adjustment
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      const targetNear = isStorming ? 35 : 120;
      const targetFar = isStorming ? 180 : 380;
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, targetNear, 0.05);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, targetFar, 0.05);

      const targetFogColor = isStorming
        ? new THREE.Color(0x1e293b)
        : isDay
        ? new THREE.Color(0x1e293b)
        : new THREE.Color(0x090d16);
      scene.fog.color.lerp(targetFogColor, 0.05);
    }

    // 3. Rain Particle Simulation (inspired by source-drone-world)
    if (rainPointsRef.current) {
      if (isStorming) {
        rainPointsRef.current.visible = true;
        const positions = rainPointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < rainCount; i++) {
          positions[i * 3 + 1] -= rainVelocities[i] * delta;
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 50 + Math.random() * 20;
            positions[i * 3] = (Math.random() - 0.5) * 140;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
          }
        }
        rainPointsRef.current.geometry.attributes.position.needsUpdate = true;
        // Follow camera horizontally so rain surrounds the player
        rainPointsRef.current.position.set(camera.position.x, 0, camera.position.z);
      } else {
        rainPointsRef.current.visible = false;
      }
    }

    // 4. Procedural Storm Lightning & Thunder
    if (isStorming) {
      nextFlashTime.current -= delta;
      if (nextFlashTime.current <= 0) {
        nextFlashTime.current = 4 + Math.random() * 8; // flash every 4-12 seconds
        flashIntensity.current = 3.5;
        audio.playThunder();
      }

      if (flashIntensity.current > 0) {
        flashIntensity.current = Math.max(0, flashIntensity.current - delta * 8);
      }
    } else {
      flashIntensity.current = 0;
    }

    if (flashLightRef.current) {
      flashLightRef.current.intensity = flashIntensity.current;
      flashLightRef.current.position.set(camera.position.x, 40, camera.position.z);
    }
  });

  return (
    <group>
      {/* Dynamic Sun / Atmospheric Light */}
      <directionalLight
        ref={sunLightRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />

      {/* Procedural Lightning Flash Point Light */}
      <pointLight ref={flashLightRef} color="#bae6fd" distance={300} decay={1.5} />

      {/* Rain Particles System */}
      <points ref={rainPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[rainPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#93c5fd"
          size={0.35}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
