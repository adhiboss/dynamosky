import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const ShiftBriefing: React.FC = () => {
  const briefingOpen = useGameStore((state) => state.briefingOpen);
  const dismissBriefing = useGameStore((state) => state.dismissBriefing);

  if (!briefingOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.72)',
        backdropFilter: 'blur(6px)',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(720px, calc(100vw - 32px))',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: 18,
          padding: '28px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: '0.16em', color: '#38bdf8', fontWeight: 700 }}>
          OPERATIONS CONTROL · MUMBAI HUB
        </div>
        <h1 style={{ fontSize: 28, margin: '8px 0 12px', color: '#f8fafc' }}>Domino Sky shift brief</h1>
        <p style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.55, marginBottom: 14 }}>
          You run today&apos;s network: 16 Indian airports, 70 flights, 16 aircraft, 21 passenger connections,
          and two spare tails at BOM and DEL. The schedule is on time until you close an airport.
        </p>
        <p style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.55, marginBottom: 16 }}>
          A ground stop does not stay local. Departures hold until the field reopens, the runway queue
          stacks, delay rides the next leg, crews hit duty limits, and missed connections strand people who
          are not already counted on a cancelled flight. The simulation engine owns every number. The
          dispatcher only explains a plan the engine has already scored.
        </p>
        <ol style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, paddingLeft: 20, marginBottom: 20 }}>
          <li>Control Tower — declare Mumbai Monsoon (BOM, 06:00–07:30) or another closure.</li>
          <li>Departure board — open a late flight. Closure, queue, knock-on, slack, and crew must sum to the delay.</li>
          <li>Operations Centre — approve a spare, a cancellation, or a tail swap.</li>
          <li>Score &amp; Stars — one star beats doing nothing. Three stars match Par.</li>
        </ol>
        <button
          type="button"
          onClick={dismissBriefing}
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 18px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Begin shift
        </button>
      </div>
    </div>
  );
};
