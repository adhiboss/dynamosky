import React from 'react';
import { useGameStore, StationType } from '../../store/gameStore';
import { X, Radio, Plane, ShieldAlert, Users, Wrench } from 'lucide-react';

interface StationModalProps {
  children?: React.ReactNode;
}

export const StationModal: React.FC<StationModalProps> = ({ children }) => {
  const activeStation = useGameStore((state) => state.activeStation);
  const setActiveStation = useGameStore((state) => state.setActiveStation);

  if (!activeStation) return null;

  const getStationMeta = (type: StationType) => {
    switch (type) {
      case 'TOWER':
        return {
          title: 'ATC CONTROL TOWER — AIRSPACE & CRISIS PROTOCOLS',
          icon: <Radio size={20} color="#38bdf8" />,
          borderColor: 'rgba(56, 189, 248, 0.4)',
        };
      case 'DEPARTURE_BOARD':
        return {
          title: 'TERMINAL MASTER FLIGHT BOARD & DELAY ATTRIBUTION',
          icon: <Plane size={20} color="#38bdf8" />,
          borderColor: 'rgba(56, 189, 248, 0.4)',
        };
      case 'OPS_CENTER':
        return {
          title: 'AIRLINE OPERATIONS CENTRE — DISPATCH & RECOVERY',
          icon: <ShieldAlert size={20} color="#10b981" />,
          borderColor: 'rgba(16, 185, 129, 0.4)',
        };
      case 'GATES':
        return {
          title: 'GATE CONCOURSE — PASSENGER CROWDS & TRANSFER DESK',
          icon: <Users size={20} color="#f59e0b" />,
          borderColor: 'rgba(245, 158, 11, 0.4)',
        };
      case 'HANGAR':
        return {
          title: 'MAINTENANCE HANGAR — STANDBY SPARE FLEET',
          icon: <Wrench size={20} color="#f59e0b" />,
          borderColor: 'rgba(245, 158, 11, 0.4)',
        };
      default:
        return {
          title: 'STATION CONSOLE',
          icon: <Radio size={20} color="#38bdf8" />,
          borderColor: 'rgba(148, 163, 184, 0.3)',
        };
    }
  };

  const meta = getStationMeta(activeStation);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: 'rgba(11, 15, 25, 0.78)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveStation(null);
      }}
    >
      <div
        style={{
          width: '92%',
          maxWidth: 1100,
          maxHeight: '88vh',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${meta.borderColor}`,
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {meta.icon}
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', color: '#f8fafc' }}>
              {meta.title}
            </span>
          </div>

          <button
            onClick={() => setActiveStation(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: 24,
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
