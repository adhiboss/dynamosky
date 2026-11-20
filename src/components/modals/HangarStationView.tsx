import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { Wrench, CheckCircle2, AlertCircle, Plane } from 'lucide-react';

export const HangarStationView: React.FC = () => {
  const { dataset, appliedActions, simResult } = useSimulationStore();

  if (!dataset) {
    return <div style={{ color: '#94a3b8' }}>Loading hangar fleet data...</div>;
  }

  // Check which spares have been dispatched in applied actions
  const dispatchedSpares = new Map<string, string>(); // spare_tail_id -> flight_id
  appliedActions.forEach((act) => {
    if (act.type === 'ASSIGN_SPARE' && act.spare_tail_id && act.flight_id) {
      dispatchedSpares.set(act.spare_tail_id, act.flight_id);
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
          STRATEGIC STANDBY RESERVE FLEET
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
          Reserve aircraft stationed at primary network bases available to take over heavily delayed or cancelled flight rotations.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {dataset.spare_aircraft.map((spare) => {
          const isDispatched = dispatchedSpares.has(spare.tail_id);
          const assignedFlightId = dispatchedSpares.get(spare.tail_id);

          return (
            <div
              key={spare.tail_id}
              style={{
                background: isDispatched ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.6)',
                border: isDispatched ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Plane size={24} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                      {spare.tail_id}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Airbus A320neo • {spare.seats} Seats
                    </div>
                  </div>
                </div>

                {isDispatched ? (
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.2)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    DISPATCHED TO {assignedFlightId}
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    HOT STANDBY READY
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>HOME BASE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                    {spare.base}
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>AVAILABLE FROM</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                    {spare.available_from} IST
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginTop: 4 }}>
                {isDispatched ? (
                  <span>
                    Currently operating in place of original aircraft for flight <b>{assignedFlightId}</b> and downstream legs.
                  </span>
                ) : (
                  <span>
                    Stationed at {spare.base} hangar apron. Dispatched automatically via the <b>Operations Centre</b> when high-impact disruptions hit {spare.base}.
                  </span>
                )}
              </div>

              <div style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>
                <b>Rules:</b> Can only take over flights departing from <b>{spare.base}</b> at or after <b>{spare.available_from}</b>. Comes equipped with fresh replacement crew (10h max duty).
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 12, padding: 16, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
          HANGAR MAINTENANCE LOG
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
          All 16 line aircraft (VT-AAA through VT-AAP) cleared pre-flight airworthiness. 2 spare aircraft parked in readiness. Engine rules strictly prohibit dispatching spares to flights outside their station base without prior ferry flight authorization.
        </div>
      </div>
    </div>
  );
};
