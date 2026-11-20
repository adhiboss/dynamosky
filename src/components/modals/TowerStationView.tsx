import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { useGameStore } from '../../store/gameStore';
import { toHHMM } from '../../engine';
import { AlertTriangle, CloudLightning, Sun, CheckCircle2, RotateCcw, ShieldCheck, Flame } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  airport: string;
  start: number;
  duration: number;
  reason: string;
  tag: string;
}

const PRESETS: Preset[] = [
  {
    id: 'BOM_MONSOON',
    name: 'Mumbai Monsoon Cloudburst',
    airport: 'BOM',
    start: 360, // 06:00
    duration: 90,
    reason: 'Monsoon Thunderstorm & Convective Squall',
    tag: 'Recommended Scenario',
  },
  {
    id: 'DEL_FOG',
    name: 'Delhi Winter Dense Fog',
    airport: 'DEL',
    start: 420, // 07:00
    duration: 120,
    reason: 'CAT IIIc Radiation Fog — RVR < 50m',
    tag: 'Severe Metro Cascade',
  },
  {
    id: 'BLR_STORM',
    name: 'Bengaluru Severe Microburst',
    airport: 'BLR',
    start: 840, // 14:00
    duration: 60,
    reason: 'Severe Convective Windshear & Microburst',
    tag: 'Afternoon Hub Crisis',
  },
  {
    id: 'CCU_CYCLONE',
    name: 'Kolkata Bay Cyclone Warning',
    airport: 'CCU',
    start: 600, // 10:00
    duration: 150,
    reason: 'Tropical Cyclonic Gale (> 65 kts)',
    tag: 'Extended Regional Outage',
  },
];

export const TowerStationView: React.FC = () => {
  const { dataset, closure, setClosure, simResult } = useSimulationStore();
  const { setCurrentAirportId, setCurrentObjective } = useGameStore();

  const [selectedAirport, setSelectedAirport] = useState<string>(closure?.airport || 'BOM');
  const [startMins, setStartMins] = useState<number>(closure?.start || 360);
  const [durationMins, setDurationMins] = useState<number>(
    closure ? closure.end - closure.start : 90
  );
  const [customReason, setCustomReason] = useState<string>(
    closure?.reason || 'Thunderstorm & Crosswinds'
  );

  const applyCustomClosure = () => {
    setClosure({
      airport: selectedAirport,
      start: startMins,
      end: startMins + durationMins,
      reason: customReason,
    });
    setCurrentAirportId(selectedAirport);
    setCurrentObjective('');
  };

  const applyPreset = (preset: Preset) => {
    setSelectedAirport(preset.airport);
    setStartMins(preset.start);
    setDurationMins(preset.duration);
    setCustomReason(preset.reason);

    setClosure({
      airport: preset.airport,
      start: preset.start,
      end: preset.start + preset.duration,
      reason: preset.reason,
    });
    setCurrentAirportId(preset.airport);
    setCurrentObjective('');
  };

  const clearClosure = () => {
    setClosure(null);
    setCurrentObjective('');
  };

  if (!dataset) {
    return <div style={{ color: '#94a3b8' }}>Loading flight network data...</div>;
  }

  const metrics = simResult?.metrics;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, height: '100%' }}>
      {/* Left Column: Preset Scenarios & Custom Closure Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Active Crisis Presets */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>
            CRISIS PRESETS (HISTORICAL SCENARIOS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PRESETS.map((p) => {
              const isSelected =
                closure &&
                closure.airport === p.airport &&
                closure.start === p.start &&
                closure.end === p.start + p.duration;

              return (
                <div
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                    border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                      {p.airport} • {p.duration} MIN
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        background: isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.2)',
                        color: isSelected ? '#0f172a' : '#94a3b8',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {p.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', marginTop: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    {toHHMM(p.start)} – {toHHMM(p.start + p.duration)} IST
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Closure Configurator */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
            CUSTOM AIRSPACE CLOSURE ORDER
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Target Airport */}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                TARGET AIRPORT
              </label>
              <select
                value={selectedAirport}
                onChange={(e) => setSelectedAirport(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                }}
              >
                {dataset.airports.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.city} ({a.name}) [Cap: {a.capacity_per_hour}/hr]
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                CLOSURE START: <b style={{ color: '#38bdf8' }}>{toHHMM(startMins)} IST</b>
              </label>
              <input
                type="range"
                min={360} // 06:00
                max={1080} // 18:00
                step={15}
                value={startMins}
                onChange={(e) => setStartMins(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Duration */}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                DURATION: <b style={{ color: '#f59e0b' }}>{durationMins} MINUTES</b>
              </label>
              <input
                type="range"
                min={30}
                max={240}
                step={15}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
            </div>

            {/* Weather / Operational Reason */}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                WEATHER / HAZARD NOTAM
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button
              onClick={applyCustomClosure}
              style={{
                flex: 1,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CloudLightning size={16} /> Declare Airspace Closure
            </button>

            {closure && (
              <button
                onClick={clearClosure}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RotateCcw size={15} /> Clear NOTAM
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Live Cascade Telemetry & Impact */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
            CASCADE IMPACT TELEMETRY
          </div>
          {closure ? (
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <AlertTriangle size={12} /> AIRSPACE CLOSED
            </span>
          ) : (
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CheckCircle2 size={12} /> AIRSPACE CLEAR
            </span>
          )}
        </div>

        {/* Active Closure Banner */}
        {closure ? (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171' }}>
              {closure.airport} Airport Ground Stop
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
              Active Window: <b>{toHHMM(closure.start)} – {toHHMM(closure.end)} IST</b> ({closure.end - closure.start} min)
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
              "{closure.reason}"
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>
            All 16 airports operating normal schedule. Select a scenario above to test crisis propagation.
          </div>
        )}

        {/* Live Network Metrics from Engine */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em' }}>STRANDED PASSENGERS</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: metrics.stranded_passengers > 0 ? '#ef4444' : '#10b981', marginTop: 4 }}>
                {metrics.stranded_passengers.toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em' }}>TOTAL DELAY MINUTES</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: metrics.total_delay_minutes > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                {metrics.total_delay_minutes.toLocaleString()}m
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em' }}>DELAYED FLIGHTS (&gt;=15m)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                {metrics.delayed_flights} <span style={{ fontSize: 12, color: '#94a3b8' }}>/ {metrics.total_flights}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em' }}>CANCELLED FLIGHTS</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: metrics.cancelled_flights > 0 ? '#ef4444' : '#f8fafc', marginTop: 4 }}>
                {metrics.cancelled_flights}
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em' }}>MISSED TRANSFERS</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: metrics.connections_missed > 0 ? '#f59e0b' : '#f8fafc', marginTop: 4 }}>
                {metrics.connections_missed}
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em' }}>SHIFT SCORE</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
                {metrics.shift_score.toLocaleString()} <span style={{ fontSize: 12, color: '#94a3b8' }}>/ 10,000</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 8, padding: 10, border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: 11, color: '#bae6fd' }}>
          💡 <b>Controller Tip:</b> Once closure is declared, proceed to the <b>Terminal Flight Board</b> to trace the exact delay chains, or visit the <b>Operations Centre</b> to review AI dispatcher recovery recommendations.
        </div>
      </div>
    </div>
  );
};
