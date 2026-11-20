import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { useGameStore } from '../../store/gameStore';
import { toHHMM, SimulatedFlight } from '../../engine';
import { Plane, AlertTriangle, ArrowRight, GitCommit, CheckCircle2, XCircle, Clock, Link2 } from 'lucide-react';

export const DepartureBoardView: React.FC = () => {
  const { dataset, simResult, selectedFlightId, setSelectedFlightId } = useSimulationStore();
  const { currentAirportId, setCurrentAirportId } = useGameStore();

  const [filterType, setFilterType] = useState<'DEPARTURES' | 'ARRIVALS' | 'ALL'>('DEPARTURES');

  if (!dataset || !simResult) {
    return <div style={{ color: '#94a3b8' }}>Loading simulation data...</div>;
  }

  // Filter flights for active airport
  const allFlights = Object.values(simResult.flights);
  const airportFlights = allFlights.filter((f) => {
    if (filterType === 'DEPARTURES') return f.origin === currentAirportId;
    if (filterType === 'ARRIVALS') return f.destination === currentAirportId;
    return f.origin === currentAirportId || f.destination === currentAirportId;
  });

  // Sort by scheduled departure
  airportFlights.sort((a, b) => a.scheduled_dep - b.scheduled_dep);

  const selectedFlight = selectedFlightId ? simResult.flights[selectedFlightId] : null;

  // Build cause chain for selected flight
  const getCauseChain = (fl: SimulatedFlight): SimulatedFlight[] => {
    const chain: SimulatedFlight[] = [fl];
    let curr = fl;

    // Follow root flight / upstream knock-on backward
    while (curr.attribution.knock_on_root_flight && curr.attribution.knock_on_root_flight !== curr.flight_id) {
      const root = simResult.flights[curr.attribution.knock_on_root_flight];
      if (!root || chain.some((c) => c.flight_id === root.flight_id)) break;
      chain.unshift(root);
      curr = root;
    }

    return chain;
  };

  const causeChain = selectedFlight ? getCauseChain(selectedFlight) : [];

  // Find connections affected by selected flight
  const affectedConnections = selectedFlight
    ? simResult.connections.filter(
        (c) => c.from_flight === selectedFlight.flight_id || c.to_flight === selectedFlight.flight_id
      )
    : [];

  const getStatusBadge = (status: SimulatedFlight['status'], delay: number) => {
    switch (status) {
      case 'CANCELLED':
        return (
          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
            CANCELLED
          </span>
        );
      case 'OUT_OF_POSITION':
        return (
          <span style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
            OUT OF POSITION
          </span>
        );
      case 'DELAYED':
        return (
          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
            +{delay}M LATE
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
            ON TIME
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedFlight ? '1.2fr 0.8fr' : '1fr', gap: 24, height: '100%' }}>
      {/* Flight Board Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Top Controls: Airport Selector & Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>HUB AIRPORT:</span>
            <select
              value={currentAirportId}
              onChange={(e) => {
                setCurrentAirportId(e.target.value);
                setSelectedFlightId(null);
              }}
              style={{
                background: '#0f172a',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 8,
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {dataset.airports.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.city}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', borderRadius: 8, padding: 3 }}>
            {(['DEPARTURES', 'ARRIVALS', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                style={{
                  background: filterType === tab ? '#0284c7' : 'transparent',
                  color: filterType === tab ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Board Flight Table */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 12,
            overflow: 'hidden',
            maxHeight: '62vh',
            overflowY: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>
                <th style={{ padding: '10px 14px' }}>FLIGHT</th>
                <th style={{ padding: '10px 14px' }}>TAIL</th>
                <th style={{ padding: '10px 14px' }}>ROUTE</th>
                <th style={{ padding: '10px 14px' }}>SCHED</th>
                <th style={{ padding: '10px 14px' }}>ACTUAL</th>
                <th style={{ padding: '10px 14px' }}>STATUS</th>
                <th style={{ padding: '10px 14px' }}>PRIMARY CAUSE</th>
              </tr>
            </thead>
            <tbody>
              {airportFlights.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    No flights found matching criteria at {currentAirportId}.
                  </td>
                </tr>
              ) : (
                airportFlights.map((fl) => {
                  const isSelected = selectedFlightId === fl.flight_id;
                  const primaryCause =
                    fl.attribution.closure_delay > 0
                      ? `Closure (+${fl.attribution.closure_delay}m)`
                      : fl.attribution.restart_queue_delay > 0
                      ? `Restart Queue (+${fl.attribution.restart_queue_delay}m)`
                      : fl.attribution.knock_on_delay > 0
                      ? `Knock-on (+${fl.attribution.knock_on_delay - fl.attribution.slack_absorbed}m)`
                      : 'Scheduled';

                  return (
                    <tr
                      key={fl.flight_id}
                      onClick={() => setSelectedFlightId(isSelected ? null : fl.flight_id)}
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                        background: isSelected
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>
                        {fl.flight_id}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {fl.effective_tail_id}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                        {fl.origin} → {fl.destination}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                        {toHHMM(fl.scheduled_dep)}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: fl.arr_delay > 0 ? '#f59e0b' : '#f8fafc' }}>
                        {toHHMM(fl.actual_dep)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {getStatusBadge(fl.status, fl.arr_delay)}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 11 }}>
                        {primaryCause}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          💡 Click any flight row to trace its full causal delay domino chain and affected passenger transfers.
        </div>
      </div>

      {/* Cause Chain Panel */}
      {selectedFlight && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '74vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
                CAUSAL ATTRIBUTION CHAIN
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                Flight {selectedFlight.flight_id} ({selectedFlight.origin} → {selectedFlight.destination})
              </div>
            </div>
            <button
              onClick={() => setSelectedFlightId(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}
            >
              Close
            </button>
          </div>

          {/* Delay Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>TOTAL ARRIVAL DELAY</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: selectedFlight.arr_delay > 0 ? '#f59e0b' : '#10b981', marginTop: 2 }}>
                +{selectedFlight.arr_delay} min
              </div>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>PASSENGERS ONBOARD</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                {selectedFlight.pax} pax
              </div>
            </div>
          </div>

          {/* Exact Math Attribution Accounting */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 10, padding: 12, border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
              ENGINE DELAY DECOMPOSITION
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Airspace Closure Hold:</span>
                <b style={{ color: selectedFlight.attribution.closure_delay > 0 ? '#ef4444' : '#64748b' }}>
                  +{selectedFlight.attribution.closure_delay}m
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Reopening Runway Queue:</span>
                <b style={{ color: selectedFlight.attribution.restart_queue_delay > 0 ? '#f59e0b' : '#64748b' }}>
                  +{selectedFlight.attribution.restart_queue_delay}m
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Knock-on from Prior Flight:</span>
                <b style={{ color: selectedFlight.attribution.knock_on_delay > 0 ? '#f59e0b' : '#64748b' }}>
                  +{selectedFlight.attribution.knock_on_delay}m
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span>Turnaround Slack Absorbed:</span>
                <b>-{selectedFlight.attribution.slack_absorbed}m</b>
              </div>
              <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#f8fafc' }}>
                <span>Net Delay Verified:</span>
                <span style={{ color: selectedFlight.arr_delay > 0 ? '#f59e0b' : '#10b981' }}>
                  +{selectedFlight.attribution.closure_delay + selectedFlight.attribution.restart_queue_delay + (selectedFlight.attribution.knock_on_delay - selectedFlight.attribution.slack_absorbed)}m
                </span>
              </div>
            </div>
          </div>

          {/* Visual Step-by-Step Chain */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
              PROPAGATION CHAIN (DOMINO EFFECT)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {causeChain.map((stepFl, idx) => (
                <div
                  key={stepFl.flight_id}
                  style={{
                    background: stepFl.flight_id === selectedFlight.flight_id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                    border: stepFl.flight_id === selectedFlight.flight_id ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                      Step {idx + 1}: Flight {stepFl.flight_id}
                    </span>
                    {getStatusBadge(stepFl.status, stepFl.arr_delay)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    {stepFl.origin} → {stepFl.destination} • Tail: {stepFl.effective_tail_id}
                  </div>
                  {stepFl.attribution.closure_delay > 0 && (
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>
                      ⚠️ Ground stop at {stepFl.origin} held flight by {stepFl.attribution.closure_delay}m
                    </div>
                  )}
                  {stepFl.cancellation_reason && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                      ❌ {stepFl.cancellation_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Connecting Passengers Impact */}
          {affectedConnections.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
                CONNECTED PASSENGER TRANSFERS ({affectedConnections.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {affectedConnections.map((c) => (
                  <div
                    key={c.connection_id}
                    style={{
                      background: c.made ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: c.made ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 8,
                      padding: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 11,
                    }}
                  >
                    <div>
                      <b style={{ color: '#f8fafc' }}>{c.passengers} passengers</b> to {c.to_flight} at {c.airport}
                      <div style={{ color: '#94a3b8' }}>
                        Actual transfer window: {c.actual_connect_time}m (min {c.min_connect_minutes}m)
                      </div>
                    </div>
                    <div>
                      {c.made ? (
                        <span style={{ color: '#10b981', fontWeight: 700 }}>TRANSFER MADE</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>MISSED / STRANDED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
