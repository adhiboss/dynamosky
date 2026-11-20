import React from 'react';
import * as THREE from 'three';
import { ProceduralAircraft } from './ProceduralAircraft';

export const RunwayAndApron: React.FC = () => {
  // Generate runway edge lights along the runway length
  const runwayLength = 320;
  const runwayWidth = 26;
  const lightSpacing = 20;
  const lightCount = Math.floor(runwayLength / lightSpacing);

  const edgeLights: Array<[number, number, number]> = [];
  for (let i = 0; i <= lightCount; i++) {
    const x = -runwayLength / 2 + i * lightSpacing;
    edgeLights.push([x, 0.15, -75 - runwayWidth / 2]);
    edgeLights.push([x, 0.15, -75 + runwayWidth / 2]);
  }

  // Generate centerline dashes
  const dashes: Array<[number, number, number]> = [];
  for (let i = 0; i < lightCount; i++) {
    const x = -runwayLength / 2 + 10 + i * lightSpacing;
    dashes.push([x, 0.02, -75]);
  }

  return (
    <group>
      {/* =========================================================================
          1. MAIN RUNWAY SURFACE (Asphalt Dark Grey)
         ========================================================================= */}
      <mesh position={[0, 0.01, -75]} receiveShadow>
        <planeGeometry args={[runwayLength, runwayWidth]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Runway Shoulders / Blast Pads */}
      <mesh position={[0, 0.005, -75]} receiveShadow>
        <planeGeometry args={[runwayLength + 20, runwayWidth + 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} />
      </mesh>

      {/* Runway Threshold Piano Key Stripes (West End: Runway 09) */}
      {[-8, -5, -2, 1, 4, 7].map((offsetZ, idx) => (
        <mesh key={`pwest-${idx}`} position={[-runwayLength / 2 + 15, 0.02, -75 + offsetZ]}>
          <planeGeometry args={[18, 1.4]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}

      {/* Runway Threshold Piano Key Stripes (East End: Runway 27) */}
      {[-8, -5, -2, 1, 4, 7].map((offsetZ, idx) => (
        <mesh key={`peast-${idx}`} position={[runwayLength / 2 - 15, 0.02, -75 + offsetZ]}>
          <planeGeometry args={[18, 1.4]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}

      {/* Runway Dashed Centerlines */}
      {dashes.map((pos, idx) => (
        <mesh key={`dash-${idx}`} position={pos}>
          <planeGeometry args={[10, 1.2]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}

      {/* Runway Edge Lights (Small glowing beacons) */}
      {edgeLights.map((pos, idx) => (
        <mesh key={`light-${idx}`} position={pos}>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}

      {/* =========================================================================
          2. TAXIWAYS & APRON CONNECTORS
         ========================================================================= */}
      {/* Taxiway Alpha (Connecting Apron to Runway) */}
      <mesh position={[-20, 0.015, -45]} receiveShadow>
        <planeGeometry args={[16, 40]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>
      {/* Taxiway Yellow Centerline */}
      <mesh position={[-20, 0.02, -45]}>
        <planeGeometry args={[0.5, 40]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>

      {/* Taxiway Bravo (Connecting Hangar to Runway) */}
      <mesh position={[25, 0.015, -45]} receiveShadow>
        <planeGeometry args={[16, 40]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>
      <mesh position={[25, 0.02, -45]}>
        <planeGeometry args={[0.5, 40]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>

      {/* =========================================================================
          3. PARKED AIRCRAFT
         ========================================================================= */}
      {/* Aircraft 1 parked at Terminal Gate 1 */}
      <ProceduralAircraft
        position={[-18, 0, -18]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.9}
        tailNumber="VT-AAA"
      />

      {/* Aircraft 2 parked at Terminal Gate 2 */}
      <ProceduralAircraft
        position={[-18, 0, -6]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.9}
        tailNumber="VT-AAB"
      />

      {/* Spare Aircraft 1 parked on the Apron outside Hangar */}
      <ProceduralAircraft
        position={[40, 0, -32]}
        rotation={[0, 0, 0]}
        scale={0.9}
        tailNumber="VT-SPR1"
        isSpare={true}
      />

      {/* Airliner holding on taxiway */}
      <ProceduralAircraft
        position={[-20, 0, -58]}
        rotation={[0, Math.PI, 0]}
        scale={0.9}
        tailNumber="VT-AAC"
      />
    </group>
  );
};
