import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { useGameStore } from '../../store/gameStore';
import { Users, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';

export const GatesStationView: React.FC = () => {
  const { dataset, simResult } = useSimulationStore();
  const { currentAirportId, setCurrentAirportId } = useGameStore();

  if (!dataset || !simResult) {
    return <div style={{ color: '#94a3b8' }}>Loading gate operations data...</div>;
  }

  // Calculate stranded passengers by airport
  const strandedByAirport: Record<string, { cancelledPax: number; missedTransferPax: number; total: number }> = {};
  dataset.airports.forEach((a) => {
    strandedByAirport[a.id] = { cancelledPax: 0, missedTransferPax: 0, total: 0 };
  });

  // Cancelled flights pax stranded at origin
  Object.values(simResult.flights).forEach((fl) => {
    if (fl.status === 'CANCELLED' || fl.status === 'OUT_OF_POSITION') {
      if (strandedByAirport[fl.origin]) {
        strandedByAirport[fl.origin].cancelledPax += fl.pax;
        strandedByAirport[fl.origin].total += fl.pax;
      }
    }
  });

  // Missed transfer passengers stranded at connection hub
  simResult.connections.forEach((c) => {
    const fFrom = simResult.flights[c.from_flight];
    const fTo = simResult.flights[c.to_flight];
    const fromOp = fFrom && (fFrom.status === 'ON_TIME' || fFrom.status === 'DELAYED');
    const toOp = fTo && (fTo.status === 'ON_TIME' || fTo.status === 'DELAYED');

    if (fromOp && toOp && !c.made) {
      if (strandedByAirport[c.airport]) {
        strandedByAirport[c.airport].missedTransferPax += c.passengers;
        strandedByAirport[c.airport].total += c.passengers;
      }
    }
  });

  // Connections for current airport
  const airportConnections = simResult.connections.filter((c) => c.airport === currentAirportId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 24, height: '100%' }}>
      {/* Left: Airport Hub Passenger Crowds Monitor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
          STRANDED PASSENGERS BY AIRPORT HUB
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: '64vh',
            overflowY: 'auto',
          }}
        >
          {dataset.airports
            .map((a) => ({ ...a, ...strandedByAirport[a.id] }))
            .sort((a, b) => b.total - a.total)
            .map((a) => {
              const isSelected = a.id === currentAirportId;
              const hasCrowd = a.total > 0;

              return (
                <div
                  key={a.id}
                  onClick={() => setCurrentAirportId(a.id)}
                  style={{
                    background: isSelected
                      ? 'rgba(56, 189, 248, 0.15)'
                      : hasCrowd
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(30, 41, 59, 0.5)',
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : hasCrowd
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                        {a.id}
                      </span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {a.city}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      Cancelled pax: <b style={{ color: '#cbd5e1' }}>{a.cancelledPax}</b> • Missed transfers: <b style={{ color: '#cbd5e1' }}>{a.missedTransferPax}</b>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: a.total > 0 ? '#ef4444' : '#10b981',
                      }}
                    >
                      {a.total.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>STRANDED</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Right: Hub Gate Transfers */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
              GATE CONNECTION TRANSFERS
            </span>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
              {currentAirportId} Hub Transfers ({airportConnections.length})
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Min Transfer Window: <b>45m</b>
          </span>
        </div>

        {airportConnections.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
            No scheduled connecting itineraries touch {currentAirportId}. Select a major hub like BOM or DEL.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: '62vh',
              overflowY: 'auto',
            }}
          >
            {airportConnections.map((c) => {
              const fFrom = simResult.flights[c.from_flight];
              const fTo = simResult.flights[c.to_flight];

              return (
                <div
                  key={c.connection_id}
                  style={{
                    background: c.made ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: c.made ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 10,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                      <span>{c.from_flight} ({fFrom?.origin}→{c.airport})</span>
                      <ArrowRight size={14} color="#94a3b8" />
                      <span>{c.to_flight} ({c.airport}→{fTo?.destination})</span>
                    </div>

                    {c.made ? (
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} /> CONNECTED
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertOctagon size={13} /> MISSED ({c.passengers} PAX STRANDED)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                    <span>Transfer Window: <b>{c.actual_connect_time} min</b> (Sched: {c.scheduled_connect_time}m)</span>
                    <span>Passengers: <b style={{ color: '#cbd5e1' }}>{c.passengers}</b></span>
                  </div>

                  {c.missed_reason && (
                    <div style={{ fontSize: 11, color: '#f87171' }}>
                      Reason: {c.missed_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
