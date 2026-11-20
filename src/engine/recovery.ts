import {
  FlightNetworkData,
  Closure,
  RecoveryAction,
  ActionCandidate,
  SimulationResult,
} from './types';
import { simulateNetwork } from './simulation';
import { toMinutes } from './time';

export function generateRecoveryCandidates(
  data: FlightNetworkData,
  closure: Closure | null,
  currentAppliedActions: RecoveryAction[] = []
): ActionCandidate[] {
  // Baseline simulation with currently applied actions
  const baseline = simulateNetwork(data, closure, { appliedActions: currentAppliedActions });
  const candidates: ActionCandidate[] = [];
  const currentActionIds = new Set(currentAppliedActions.map((a) => a.id));

  // 1. Candidate Spare Aircraft Assignments
  data.spare_aircraft.forEach((spare) => {
    // Check which flights originate at this spare's base and depart after spare is available
    const spareAvailMins = toMinutes(spare.available_from);

    data.flights.forEach((fl) => {
      const simFl = baseline.flights[fl.flight_id];
      if (!simFl) return;

      // Only consider if flight is delayed or cancelled and originates at the spare's base
      if (fl.origin === spare.base && (simFl.arr_delay >= 20 || simFl.status === 'CANCELLED' || simFl.status === 'OUT_OF_POSITION')) {
        const schedDep = toMinutes(fl.dep);
        if (schedDep >= spareAvailMins) {
          const actionId = `ACT-SPARE-${spare.tail_id}-${fl.flight_id}`;
          if (currentActionIds.has(actionId)) return;

          const action: RecoveryAction = {
            id: actionId,
            type: 'ASSIGN_SPARE',
            flight_id: fl.flight_id,
            spare_tail_id: spare.tail_id,
            cost: 100,
            title: `Assign Spare ${spare.tail_id} to ${fl.flight_id}`,
            description: `Deploy standby ${spare.tail_id} at ${spare.base} to rescue ${fl.flight_id} (${fl.origin}→${fl.destination}) and rest of rotation.`,
          };

          const sim = simulateNetwork(data, closure, {
            appliedActions: [...currentAppliedActions, action],
          });

          const delaySaved = baseline.metrics.total_delay_minutes - sim.metrics.total_delay_minutes;
          const strandedSaved = baseline.metrics.stranded_passengers - sim.metrics.stranded_passengers;
          const breachesResolved = baseline.metrics.crew_breaches - sim.metrics.crew_breaches;
          const scoreDelta = sim.metrics.shift_score - baseline.metrics.shift_score;

          // Only keep if it improves or relieves the situation
          if (delaySaved > 0 || strandedSaved > 0 || breachesResolved > 0 || scoreDelta > 0) {
            candidates.push({
              action,
              projected_metrics: sim.metrics,
              delay_saved: delaySaved,
              stranded_saved: strandedSaved,
              crew_breaches_resolved: breachesResolved,
              net_score_delta: scoreDelta,
            });
          }
        }
      }
    });
  });

  // 2. Candidate Flight Cancellations
  // Look for heavily delayed flights where cancellation arrests massive downstream cascade
  Object.values(baseline.flights).forEach((simFl) => {
    if (simFl.status === 'DELAYED' && simFl.arr_delay >= 45) {
      const actionId = `ACT-CANCEL-${simFl.flight_id}`;
      if (currentActionIds.has(actionId)) return;

      const action: RecoveryAction = {
        id: actionId,
        type: 'CANCEL_FLIGHT',
        flight_id: simFl.flight_id,
        cost: 200,
        title: `Cancel Flight ${simFl.flight_id} (${simFl.origin}→${simFl.destination})`,
        description: `Cancel ${simFl.flight_id} to halt propagating delays and recover tail schedule.`,
      };

      const sim = simulateNetwork(data, closure, {
        appliedActions: [...currentAppliedActions, action],
      });

      const delaySaved = baseline.metrics.total_delay_minutes - sim.metrics.total_delay_minutes;
      const strandedSaved = baseline.metrics.stranded_passengers - sim.metrics.stranded_passengers;
      const breachesResolved = baseline.metrics.crew_breaches - sim.metrics.crew_breaches;
      const scoreDelta = sim.metrics.shift_score - baseline.metrics.shift_score;

      // Keep if it reduces delay or crew breaches substantially
      if (breachesResolved > 0 || delaySaved > 100 || scoreDelta > 0) {
        candidates.push({
          action,
          projected_metrics: sim.metrics,
          delay_saved: delaySaved,
          stranded_saved: strandedSaved,
          crew_breaches_resolved: breachesResolved,
          net_score_delta: scoreDelta,
        });
      }
    }
  });

  // 3. Candidate Aircraft Swaps
  // Find pairs of aircraft that meet at an airport around the same time where one is on-time and one is delayed
  const operatingTails = Array.from(new Set(data.flights.map((f) => f.tail_id)));
  for (let i = 0; i < operatingTails.length; i++) {
    for (let j = i + 1; j < operatingTails.length; j++) {
      const tail1 = operatingTails[i];
      const tail2 = operatingTails[j];

      const legs1 = data.flights.filter((f) => f.tail_id === tail1).sort((a, b) => a.leg_order - b.leg_order);
      const legs2 = data.flights.filter((f) => f.tail_id === tail2).sort((a, b) => a.leg_order - b.leg_order);

      // Look for a shared airport where both are present
      for (const leg1 of legs1) {
        for (const leg2 of legs2) {
          if (leg1.origin === leg2.origin && leg1.origin !== closure?.airport) {
            const dep1 = toMinutes(leg1.dep);
            const dep2 = toMinutes(leg2.dep);
            if (Math.abs(dep1 - dep2) <= 90) {
              const sharedAirport = leg1.origin;
              const swapTime = Math.min(dep1, dep2);
              const actionId = `ACT-SWAP-${tail1}-${tail2}-${sharedAirport}`;
              if (currentActionIds.has(actionId)) continue;

              const action: RecoveryAction = {
                id: actionId,
                type: 'SWAP_TAILS',
                swap_tail_1: tail1,
                swap_tail_2: tail2,
                swap_airport: sharedAirport,
                swap_time: swapTime,
                cost: 150,
                title: `Swap Aircraft ${tail1} ↔ ${tail2} at ${sharedAirport}`,
                description: `Exchange rotation chains at ${sharedAirport} to absorb delay using available slack.`,
              };

              const sim = simulateNetwork(data, closure, {
                appliedActions: [...currentAppliedActions, action],
              });

              const delaySaved = baseline.metrics.total_delay_minutes - sim.metrics.total_delay_minutes;
              const strandedSaved = baseline.metrics.stranded_passengers - sim.metrics.stranded_passengers;
              const breachesResolved = baseline.metrics.crew_breaches - sim.metrics.crew_breaches;
              const scoreDelta = sim.metrics.shift_score - baseline.metrics.shift_score;

              if (delaySaved > 0 || strandedSaved > 0 || breachesResolved > 0 || scoreDelta > 0) {
                candidates.push({
                  action,
                  projected_metrics: sim.metrics,
                  delay_saved: delaySaved,
                  stranded_saved: strandedSaved,
                  crew_breaches_resolved: breachesResolved,
                  net_score_delta: scoreDelta,
                });
              }
            }
          }
        }
      }
    }
  }

  // Deterministic ranking:
  // 1. Crew breaches (hard penalty)
  // 2. Stranded passengers (lowest first)
  // 3. Total delay (lowest first)
  // 4. Stable tie breaker by action.id
  candidates.sort((a, b) => {
    // Hard penalty on crew breaches
    if (a.projected_metrics.crew_breaches !== b.projected_metrics.crew_breaches) {
      return a.projected_metrics.crew_breaches - b.projected_metrics.crew_breaches;
    }
    // Lowest stranded passengers
    if (a.projected_metrics.stranded_passengers !== b.projected_metrics.stranded_passengers) {
      return a.projected_metrics.stranded_passengers - b.projected_metrics.stranded_passengers;
    }
    // Lowest total delay
    if (a.projected_metrics.total_delay_minutes !== b.projected_metrics.total_delay_minutes) {
      return a.projected_metrics.total_delay_minutes - b.projected_metrics.total_delay_minutes;
    }
    // Highest shift score
    if (a.projected_metrics.shift_score !== b.projected_metrics.shift_score) {
      return b.projected_metrics.shift_score - a.projected_metrics.shift_score;
    }
    return a.action.id.localeCompare(b.action.id);
  });

  return candidates;
}

export function searchBestRecoveryPlan(
  data: FlightNetworkData,
  closure: Closure | null,
  maxActions = 3
): {
  plan: RecoveryAction[];
  finalMetrics: SimulationResult['metrics'];
  candidatesByStep: ActionCandidate[][];
} {
  const plan: RecoveryAction[] = [];
  const candidatesByStep: ActionCandidate[][] = [];
  let currentMetrics = simulateNetwork(data, closure, { appliedActions: [] }).metrics;

  for (let step = 0; step < maxActions; step++) {
    const candidates = generateRecoveryCandidates(data, closure, plan);
    candidatesByStep.push(candidates);
    if (candidates.length === 0) break;

    const best = candidates[0];
    // Only add if it improves the situation
    if (
      best.crew_breaches_resolved > 0 ||
      best.stranded_saved > 0 ||
      best.delay_saved > 20 ||
      best.net_score_delta > 0
    ) {
      plan.push(best.action);
      currentMetrics = best.projected_metrics;
    } else {
      break;
    }
  }

  return {
    plan,
    finalMetrics: currentMetrics,
    candidatesByStep,
  };
}
