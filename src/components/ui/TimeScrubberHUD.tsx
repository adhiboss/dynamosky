import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSimulationStore } from '../../store/simulationStore';
import { toHHMM } from '../../engine';
import { Play, Pause, FastForward, RotateCcw } from 'lucide-react';

export const TimeScrubberHUD: React.FC = () => {
  const {
    simClockMins,
    setSimClockMins,
    isClockPlaying,
    setIsClockPlaying,
    clockSpeed,
    setClockSpeed,
  } = useGameStore();

  const closure = useSimulationStore((state) => state.closure);

  // Simulation clock ticker loop
  useEffect(() => {
    if (!isClockPlaying) return;

    // Advance 1 min every (1000 / clockSpeed) ms
    const intervalMs = Math.max(30, Math.floor(1000 / clockSpeed));
    const interval = setInterval(() => {
      const current = useGameStore.getState().simClockMins;
      const next = (current + 1) % 1440;
      setSimClockMins(next);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isClockPlaying, clockSpeed, setSimClockMins]);

  const speeds = [1, 5, 15, 30];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 20,
        pointerEvents: 'auto',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 14,
        padding: '12px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 380,
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setIsClockPlaying(!isClockPlaying)}
            style={{
              background: isClockPlaying ? '#eab308' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isClockPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isClockPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={() => setSimClockMins(360)} // reset to 06:00
            title="Reset to 06:00 IST"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Speed Toggles */}
        <div style={{ display: 'flex', gap: 4 }}>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setClockSpeed(s)}
              style={{
                background: clockSpeed === s ? '#38bdf8' : 'rgba(30, 41, 59, 0.6)',
                color: clockSpeed === s ? '#0f172a' : '#94a3b8',
                border: 'none',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Current Time Display */}
        <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
          {toHHMM(simClockMins)} IST
        </div>
      </div>

      {/* Scrubber Range Input */}
      <div style={{ position: 'relative', width: '100%', marginTop: 4 }}>
        <input
          type="range"
          min={0}
          max={1440}
          step={5}
          value={simClockMins}
          onChange={(e) => setSimClockMins(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#38bdf8',
            cursor: 'pointer',
          }}
        />

        {/* Closure Window Highlight Indicator */}
        {closure && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: `${(closure.start / 1440) * 100}%`,
              width: `${((closure.end - closure.start) / 1440) * 100}%`,
              height: 4,
              background: '#ef4444',
              borderRadius: 2,
              pointerEvents: 'none',
              boxShadow: '0 0 8px #ef4444',
            }}
            title={`${closure.airport} Closure: ${toHHMM(closure.start)} – ${toHHMM(closure.end)}`}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
        <span>00:00</span>
        <span>06:00 (Ops Start)</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
};
