import React, { useState, useMemo } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { useGameStore } from '../../store/gameStore';
import {
  evaluateShiftStars,
  searchBestRecoveryPlan,
  computeWorstDayLeaderboard,
  WorstDayCrisis,
  toHHMM,
} from '../../engine';
import {
  Star,
  Trophy,
  Flame,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';

export const ScoreAndWorstDayView: React.FC = () => {
  const {
    dataset,
    closure,
    setClosure,
    simResult,
    baselineResult,
    appliedActions,
  } = useSimulationStore();

  const { setCurrentObjective, setCurrentAirportId } = useGameStore();

  const [activeTab, setActiveTab] = useState<'SCORE' | 'WORST_DAY' | 'PLAYER_VS_AI'>('SCORE');
  const [revealedAiPlan, setRevealedAiPlan] = useState(false);

  // Compute Par score for active scenario using engine's best plan
  const parPlan = useMemo(() => {
    if (!dataset) return null;
    return searchBestRecoveryPlan(dataset, closure, 3);
  }, [dataset, closure]);

  // Compute Worst Day Leaderboard
  const worstDayCrises = useMemo(() => {
    if (!dataset) return [];
    return computeWorstDayLeaderboard(dataset);
  }, [dataset]);

  if (!dataset || !simResult || !baselineResult) {
    return <div style={{ color: '#94a3b8' }}>Loading score & scenario data...</div>;
  }

  const baselineScore = baselineResult.metrics.shift_score;
  const currentScore = simResult.metrics.shift_score;
  const parScore = parPlan?.finalMetrics.shift_score || baselineScore;

  const starRating = evaluateShiftStars(currentScore, baselineScore, parScore);

  const loadWorstDayCrisis = (crisis: WorstDayCrisis) => {
    setClosure({
      airport: crisis.airport,
      start: crisis.start,
      end: crisis.end,
      reason: crisis.reason,
    });
    setCurrentAirportId(crisis.airport);
    setCurrentObjective(`Worst Day Challenge #${crisis.rank}: Mitigate ${crisis.city} Ground Stop!`);
    setActiveTab('SCORE');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 4 }}>
          <button
            onClick={() => setActiveTab('SCORE')}
            style={{
              background: activeTab === 'SCORE' ? '#0284c7' : 'transparent',
              color: activeTab === 'SCORE' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Trophy size={14} /> Score & Stars
          </button>

          <button
            onClick={() => setActiveTab('WORST_DAY')}
            style={{
              background: activeTab === 'WORST_DAY' ? '#0284c7' : 'transparent',
              color: activeTab === 'WORST_DAY' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Flame size={14} color="#f59e0b" /> "Worst Day" Challenge
          </button>

          <button
            onClick={() => setActiveTab('PLAYER_VS_AI')}
            style={{
              background: activeTab === 'PLAYER_VS_AI' ? '#0284c7' : 'transparent',
              color: activeTab === 'PLAYER_VS_AI' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={14} /> Player vs AI Par
          </button>
        </div>

        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Scenario: <b>{closure ? `${closure.airport} (${closure.end - closure.start}m)` : 'All Clear'}</b>
        </div>
      </div>

      {/* Tab 1: Score & Star Rating */}
      {activeTab === 'SCORE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Star Rating Card */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 14,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: '0.06em', fontWeight: 700 }}>
              MISSION SHIFT RATING
            </div>

            {/* Glowing 3-Star Display */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[1, 2, 3].map((starIndex) => {
                const filled = starRating.stars >= starIndex;
                return (
                  <div
                    key={starIndex}
                    style={{
                      transform: filled ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <Star
                      size={44}
                      color={filled ? '#fbbf24' : '#475569'}
                      fill={filled ? '#fbbf24' : 'none'}
                      style={{
                        filter: filled ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              {starRating.verdict}
            </div>

            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>YOUR SCORE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>
                  {currentScore.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>PAR TARGET</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>
                  {parScore.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>DO NOTHING BASE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#94a3b8' }}>
                  {baselineScore.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#64748b', maxWidth: 400 }}>
              ★ Beat doing nothing (&gt;{baselineScore}) • ★★ Within 10% of Par (&ge;{Math.floor(parScore * 0.9)}) • ★★★ Match or beat Par (&ge;{parScore})
            </div>
          </div>

          {/* Shift Score Breakdown Math */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 14,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
              ENGINE SCORE DEDUCTIONS ACCOUNTING
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700 }}>
                <span>Base Shift Budget:</span>
                <span>+10,000 pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                <span>Stranded Passengers (-10 pts × {simResult.metrics.stranded_passengers}):</span>
                <span>-{simResult.metrics.stranded_passengers * 10} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                <span>Total Delay Minutes (-1 pt × {simResult.metrics.total_delay_minutes}m):</span>
                <span>-{simResult.metrics.total_delay_minutes} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                <span>Crew Breaches (-500 pts × {simResult.metrics.crew_breaches}):</span>
                <span>-{simResult.metrics.crew_breaches * 500} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Flight Cancellations (-150 pts × {simResult.metrics.cancelled_flights}):</span>
                <span>-{simResult.metrics.cancelled_flights * 150} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Action Execution Costs:</span>
                <span>
                  -{appliedActions.reduce((sum, a) => sum + a.cost, 0)} pts
                </span>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#38bdf8',
                }}
              >
                <span>Final Shift Score:</span>
                <span>{currentScore.toLocaleString()} pts</span>
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 10, borderRadius: 8, fontSize: 11, color: '#94a3b8', marginTop: 'auto' }}>
              All scores are calculated strictly in <b>/src/engine</b> with zero arithmetic performed by the AI or client view layer.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Worst Day Challenge Leaderboard */}
      {activeTab === 'WORST_DAY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Precomputed across all 16 airports × operating banks. Select any scenario to test crisis containment against the hardest disruption events in Indian aviation history!
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: '62vh',
              overflowY: 'auto',
            }}
          >
            {worstDayCrises.map((c) => (
              <div
                key={`${c.airport}-${c.start}`}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: c.rank <= 3 ? '#ef4444' : '#475569',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    #{c.rank}
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                      {c.city} ({c.airport}) Ground Stop • {c.duration}m
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      Window: {toHHMM(c.start)} – {toHHMM(c.end)} IST • "{c.reason}"
                    </div>
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>
                      Do Nothing Impact: {c.strandedWithoutAction} stranded pax • {c.delayWithoutAction}m delay
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                      Par: {c.parScore.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      Base: {c.baselineScore.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => loadWorstDayCrisis(c)}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Play Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Player vs AI Par (Player-First Mode) */}
      {activeTab === 'PLAYER_VS_AI' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Player Plan */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 14,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
              YOUR CURRENT RECOVERY PLAN
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>
              Actions Approved: <b>{appliedActions.length}</b>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {appliedActions.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic', padding: '16px 0' }}>
                  No actions applied yet. Go to Operations Centre to approve candidates.
                </div>
              ) : (
                appliedActions.map((a, i) => (
                  <div key={a.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 8, borderRadius: 6, fontSize: 11 }}>
                    <b>#{i + 1}</b> {a.title}
                  </div>
                ))
              )}
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>Player Score:</span>
              <span style={{ color: '#38bdf8' }}>{currentScore.toLocaleString()}</span>
            </div>
          </div>

          {/* AI Benchmark Plan */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 14,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
              AI PAR BENCHMARK PLAN
            </div>

            {revealedAiPlan && parPlan ? (
              <>
                <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                  Optimal Actions Identified by Engine Search: <b>{parPlan.plan.length}</b>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {parPlan.plan.map((a, i) => (
                    <div key={a.id} style={{ background: 'rgba(30, 41, 59, 0.6)', padding: 8, borderRadius: 6, fontSize: 11, borderLeft: '3px solid #fbbf24' }}>
                      <b>#{i + 1}</b> {a.title}
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Engine Par Score:</span>
                  <span style={{ color: '#fbbf24' }}>{parScore.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 14 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  In Player-First Mode, try solving the crisis with your own intuition first before viewing the engine's optimal solution.
                </div>
                <button
                  onClick={() => setRevealedAiPlan(true)}
                  style={{
                    background: '#eab308',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Reveal AI Par Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
