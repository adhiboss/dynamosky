import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  generateRecoveryCandidates,
  ActionCandidate,
  RecoveryAction,
  HydratedDispatcherResponse,
} from '../../engine';
import { requestAIDispatcherPlan } from '../../services/aiDispatcherService';
import { audio } from '../../services/audioService';
import {
  ShieldCheck,
  Brain,
  Check,
  X,
  Sparkles,
  RotateCcw,
  Clock,
  Users,
  AlertTriangle,
  Plane,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const OpsCenterView: React.FC = () => {
  const {
    dataset,
    closure,
    simResult,
    baselineResult,
    appliedActions,
    applyAction,
    removeAction,
    clearActions,
  } = useSimulationStore();

  const [aiProposal, setAiProposal] = useState<HydratedDispatcherResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [rejectedActionIds, setRejectedActionIds] = useState<Set<string>>(new Set());

  // Generate real-time candidates based on current network state
  const candidates: ActionCandidate[] = React.useMemo(() => {
    if (!dataset) return [];
    return generateRecoveryCandidates(dataset, closure, appliedActions);
  }, [dataset, closure, appliedActions]);

  // Request AI proposal
  const requestProposal = async () => {
    if (!baselineResult || candidates.length === 0) return;
    setLoadingAi(true);
    try {
      const resp = await requestAIDispatcherPlan(candidates, baselineResult.metrics);
      setAiProposal(resp);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (candidates.length > 0 && !aiProposal && !loadingAi) {
      requestProposal();
    }
  }, [candidates.length]);

  if (!dataset || !simResult || !baselineResult) {
    return <div style={{ color: '#94a3b8' }}>Loading operations dispatch data...</div>;
  }

  const baselineMetrics = baselineResult.metrics;
  const currentMetrics = simResult.metrics;

  const handleApprove = (action: RecoveryAction) => {
    applyAction(action);
    audio.playApproveSuccess();
  };

  const handleReject = (actionId: string) => {
    setRejectedActionIds((prev) => new Set([...prev, actionId]));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, height: '100%' }}>
      {/* Left Column: AI Dispatcher Briefing & Proposed Candidates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* AI Briefing Card with "Verified by Engine" Badge */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={18} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
                AI DISPATCHER STRATEGY BRIEF
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Mandatory Verified by Engine Badge */}
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 999,
                  padding: '3px 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ShieldCheck size={12} /> VERIFIED BY ENGINE (ZERO AI MATH)
              </span>

              <button
                onClick={requestProposal}
                disabled={loadingAi}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles size={11} /> {loadingAi ? 'Analyzing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
            {loadingAi ? (
              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                Synthesizing multi-tail recovery options with engine simulation...
              </span>
            ) : aiProposal ? (
              aiProposal.explanation
            ) : (
              'Network operating nominally. No emergency recovery actions currently required.'
            )}
          </div>

          {aiProposal && (
            <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 12 }}>
              <span>Mode: {aiProposal.isFallback ? 'Deterministic Engine Template' : 'LLM Proxy Strategy'}</span>
              <span>• Placeholders Hydrated by /src/engine</span>
            </div>
          )}
        </div>

        {/* Action Candidates List */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>
            RECOMMENDED RECOVERY ACTIONS ({candidates.length} AVAILABLE)
          </div>

          {candidates.length === 0 ? (
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: 10,
                padding: 24,
                textAlign: 'center',
                color: '#64748b',
                fontSize: 13,
              }}
            >
              No additional recovery candidates identified. All disrupted rotations mitigated.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxHeight: '44vh',
                overflowY: 'auto',
              }}
            >
              {candidates
                .filter((c) => !rejectedActionIds.has(c.action.id))
                .map((cand) => {
                  const act = cand.action;
                  const isApproved = appliedActions.some((a) => a.id === act.id);

                  return (
                    <div
                      key={act.id}
                      style={{
                        background: isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                        border: isApproved ? '2px solid #10b981' : '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: 12,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                            {act.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            {act.description}
                          </div>
                        </div>

                        <span
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            color: '#cbd5e1',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          Cost: {act.cost} pts
                        </span>
                      </div>

                      {/* Engine Projected Impact Pill Row */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                          Stranded Saved: -{cand.stranded_saved} pax
                        </span>
                        <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                          Delay Saved: -{cand.delay_saved} min
                        </span>
                        {cand.crew_breaches_resolved > 0 && (
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                            Crew Breaches: -{cand.crew_breaches_resolved}
                          </span>
                        )}
                        <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', padding: '3px 8px', borderRadius: 6 }}>
                          Score Δ: +{cand.net_score_delta} pts
                        </span>
                      </div>

                      {/* Action Approval / Rejection Controls */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        {isApproved ? (
                          <button
                            onClick={() => removeAction(act.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: 6,
                              padding: '5px 12px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <X size={13} /> Revoke Action
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleReject(act.id)}
                              style={{
                                background: 'transparent',
                                color: '#94a3b8',
                                border: '1px solid rgba(148, 163, 184, 0.25)',
                                borderRadius: 6,
                                padding: '5px 12px',
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleApprove(act)}
                              style={{
                                background: '#10b981',
                                color: '#0f172a',
                                border: 'none',
                                borderRadius: 6,
                                padding: '5px 14px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Check size={13} /> Approve Action
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Before/After & Shift Score Rating */}
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
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
            OPERATIONS RECOVERY IMPACT
          </div>
          {appliedActions.length > 0 && (
            <button
              onClick={clearActions}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RotateCcw size={12} /> Reset Actions ({appliedActions.length})
            </button>
          )}
        </div>

        {/* Before / After Metrics Comparison Table */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 10, padding: 12, border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: 6 }}>
            <span>METRIC</span>
            <span style={{ textAlign: 'right' }}>CRISIS BASE</span>
            <span style={{ textAlign: 'right', color: '#10b981' }}>WITH PLAN</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, fontSize: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr' }}>
              <span style={{ color: '#cbd5e1' }}>Stranded Passengers</span>
              <span style={{ textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>
                {baselineMetrics.stranded_passengers.toLocaleString()}
              </span>
              <span style={{ textAlign: 'right', color: currentMetrics.stranded_passengers < baselineMetrics.stranded_passengers ? '#10b981' : '#f8fafc', fontWeight: 800 }}>
                {currentMetrics.stranded_passengers.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr' }}>
              <span style={{ color: '#cbd5e1' }}>Total Delay Minutes</span>
              <span style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>
                {baselineMetrics.total_delay_minutes.toLocaleString()}m
              </span>
              <span style={{ textAlign: 'right', color: currentMetrics.total_delay_minutes < baselineMetrics.total_delay_minutes ? '#10b981' : '#f8fafc', fontWeight: 800 }}>
                {currentMetrics.total_delay_minutes.toLocaleString()}m
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr' }}>
              <span style={{ color: '#cbd5e1' }}>Delayed Flights</span>
              <span style={{ textAlign: 'right', color: '#cbd5e1' }}>{baselineMetrics.delayed_flights}</span>
              <span style={{ textAlign: 'right', color: '#f8fafc', fontWeight: 700 }}>{currentMetrics.delayed_flights}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr' }}>
              <span style={{ color: '#cbd5e1' }}>Cancelled Flights</span>
              <span style={{ textAlign: 'right', color: '#cbd5e1' }}>{baselineMetrics.cancelled_flights}</span>
              <span style={{ textAlign: 'right', color: '#f8fafc', fontWeight: 700 }}>{currentMetrics.cancelled_flights}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr' }}>
              <span style={{ color: '#cbd5e1' }}>Crew Breaches</span>
              <span style={{ textAlign: 'right', color: baselineMetrics.crew_breaches > 0 ? '#ef4444' : '#cbd5e1' }}>
                {baselineMetrics.crew_breaches}
              </span>
              <span style={{ textAlign: 'right', color: currentMetrics.crew_breaches > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                {currentMetrics.crew_breaches}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: 6, fontWeight: 800 }}>
              <span style={{ color: '#f8fafc' }}>Shift Score</span>
              <span style={{ textAlign: 'right', color: '#94a3b8' }}>
                {baselineMetrics.shift_score.toLocaleString()}
              </span>
              <span style={{ textAlign: 'right', color: '#38bdf8' }}>
                {currentMetrics.shift_score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Applied Plan Actions List */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            CURRENTLY ACTIVE ACTIONS ({appliedActions.length})
          </div>
          {appliedActions.length === 0 ? (
            <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
              No actions approved yet. Click "Approve Action" above to execute mitigation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {appliedActions.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: '#f8fafc' }}>
                    <b>#{i + 1}</b> {a.title}
                  </span>
                  <button
                    onClick={() => removeAction(a.id)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 10 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, padding: 10, border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: 11, color: '#a7f3d0' }}>
          💡 <b>Immediate Network Refresh:</b> When you approve an action, the 3D airport world, flight boards, and holographic aircraft update in real time.
        </div>
      </div>
    </div>
  );
};
