import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSimulationStore } from '../../store/simulationStore';
import { audio } from '../../services/audioService';
import { missionStep, waypointFor } from '../../world/mission';
import { toHHMM } from '../../engine';
import { Clock, Radio, Volume2, VolumeX, Navigation, Trophy, Users, Timer, Plane } from 'lucide-react';

export const GameHUD: React.FC = () => {
  const {
    simClockMins,
    nearbyStation,
    currentObjective,
    soundEnabled,
    toggleSound,
    currentAirportId,
    activeStation,
    setActiveStation,
    playerPosition,
    stationsVisited,
    markStationVisited,
  } = useGameStore();

  const closure = useSimulationStore((state) => state.closure);
  const simResult = useSimulationStore((state) => state.simResult);
  const appliedActions = useSimulationStore((state) => state.appliedActions);
  const metrics = simResult?.metrics;
  const step = missionStep(closure, appliedActions, stationsVisited);
  const objective = currentObjective.startsWith('Worst Day') ? currentObjective : step.text;
  const waypoint = waypointFor(step, playerPosition);

  // Convert minutes from 00:00 to HH:MM format
  const formatTime = (totalMins: number) => {
    const hours = Math.floor(totalMins / 60) % 24;
    const mins = Math.floor(totalMins % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} IST`;
  };

  // Keyboard listener for 'KeyE' and 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        if (activeStation) {
          // If already in a station panel, pressing E or Esc can close it
          setActiveStation(null);
          audio.playClick();
        } else if (nearbyStation) {
          markStationVisited(nearbyStation.id);
          setActiveStation(nearbyStation.id);
          audio.playAirportChime();
        }
      } else if (e.code === 'Escape' && activeStation) {
        setActiveStation(null);
        audio.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nearbyStation, activeStation, setActiveStation, markStationVisited]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* Top Bar: Telemetry, Clock, Airport Hub */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          right: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand & Airport Hub Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 12,
            padding: '8px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8',
            }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: '#f8fafc' }}>
              DOMINO SKY
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Navigation size={10} /> Active Hub: <b style={{ color: '#38bdf8' }}>{currentAirportId}</b>
            </div>
          </div>
        </div>

        {/* Sim Clock */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: 12,
              padding: '8px 16px',
              color: '#f8fafc',
            }}
          >
            <Clock size={16} color="#38bdf8" />
            <span style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em' }}>
              {formatTime(simClockMins)}
            </span>
          </div>

          <button
            type="button"
            aria-label="Open score and stars"
            onClick={() => {
              markStationVisited('SCORE_AND_WORST_DAY');
              setActiveStation('SCORE_AND_WORST_DAY');
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: 12,
              padding: '8px 14px',
              color: '#fbbf24',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              pointerEvents: 'auto',
            }}
            title="View Score, Star Rating & Worst Day Challenges"
          >
            <Trophy size={15} />
            <span>Score & Stars</span>
          </button>
        </div>

        {/* Audio Toggle & Network Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: 10,
              padding: '8px 12px',
              color: soundEnabled ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>
        </div>
      </div>

      {/* Current Objective Banner */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 24,
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        }}
      >
        <Radio size={14} color="#f59e0b" />
        <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500, maxWidth: 640, textAlign: 'center' }}>
          {objective}
        </span>
      </div>

      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          top: 128,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <MetricPill
          label={closure ? 'Ground stop' : 'Network'}
          value={closure ? `${closure.airport} ${toHHMM(closure.start)}–${toHHMM(closure.end)}` : `On time · ${currentAirportId}`}
          tone={closure ? 'alert' : 'ok'}
        />
        <MetricPill icon={<Users size={13} />} label="Stranded" value={metrics ? String(metrics.stranded_passengers) : '—'} />
        <MetricPill icon={<Timer size={13} />} label="Delay min" value={metrics ? String(metrics.total_delay_minutes) : '—'} />
        <MetricPill icon={<Plane size={13} />} label="Cancelled" value={metrics ? String(metrics.cancelled_flights) : '—'} />
        <MetricPill label="Score" value={metrics ? String(metrics.shift_score) : '—'} tone="score" />
      </div>

      {waypoint && !activeStation && (
        <div
          style={{
            position: 'absolute',
            bottom: 78,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.8)',
            border: `1px solid ${waypoint.color}`,
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 12,
            color: '#e2e8f0',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <Navigation size={13} color={waypoint.color} />
          Next: <b>{waypoint.name}</b> · {waypoint.meters}m {waypoint.compass}
        </div>
      )}

      {/* Interaction Prompt (Press E) */}
      {nearbyStation && !activeStation && (
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #38bdf8',
            borderRadius: 14,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)',
            animation: 'pulse 1.5s infinite',
          }}
        >
          <div
            style={{
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: 14,
              padding: '4px 10px',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.6)',
            }}
          >
            E
          </div>
          <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600 }}>
            {nearbyStation.action} — <span style={{ color: '#94a3b8' }}>{nearbyStation.name}</span>
          </div>
        </div>
      )}

      {/* Bottom Controls Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 12,
          color: '#94a3b8',
          display: 'flex',
          gap: 16,
        }}
      >
        <div><b style={{ color: '#f1f5f9' }}>WASD</b> Move</div>
        <div><b style={{ color: '#f1f5f9' }}>Shift</b> Sprint</div>
        <div><b style={{ color: '#f1f5f9' }}>Mouse</b> Orbit View</div>
        <div><b style={{ color: '#f1f5f9' }}>E</b> Interact</div>
        <div><b style={{ color: '#f1f5f9' }}>Esc</b> Close Panel</div>
      </div>
    </div>
  );
};

function MetricPill({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'ok' | 'alert' | 'score';
}) {
  const border =
    tone === 'alert' ? 'rgba(248, 113, 113, 0.7)' : tone === 'ok' ? 'rgba(52, 211, 153, 0.7)' : tone === 'score' ? 'rgba(251, 191, 36, 0.7)' : 'rgba(148, 163, 184, 0.35)';
  const valueColor = tone === 'alert' ? '#fecaca' : tone === 'ok' ? '#6ee7b7' : tone === 'score' ? '#fde68a' : '#f8fafc';

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.82)',
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: '6px 10px',
        minWidth: 86,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: '0.06em', color: '#94a3b8', display: 'flex', gap: 4, alignItems: 'center' }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: valueColor, marginTop: 2 }}>{value}</div>
    </div>
  );
}
