import { FlightNetworkData, Closure, NetworkMetrics } from './types';
import { simulateNetwork } from './simulation';
import { searchBestRecoveryPlan } from './recovery';
import { toHHMM } from './time';

export interface WorstDayCrisis {
  rank: number;
  airport: string;
  airportName: string;
  city: string;
  start: number;
  end: number;
  duration: number;
  reason: string;
  strandedWithoutAction: number;
  delayWithoutAction: number;
  crewBreaches: number;
  cancellations: number;
  baselineScore: number;
  parScore: number;
  recommendedActionsCount: number;
}

export function computeWorstDayLeaderboard(data: FlightNetworkData): WorstDayCrisis[] {
  const sampleTimes = [360, 480, 600, 720, 840, 960]; // 06:00, 08:00, 10:00, 12:00, 14:00, 16:00
  const duration = 90; // 90 min closure standard

  const airportMap = new Map(data.airports.map((a) => [a.id, a]));
  const results: Array<{
    airport: string;
    start: number;
    end: number;
    duration: number;
    reason: string;
    baselineMetrics: NetworkMetrics;
  }> = [];

  // Simulate all combinations
  data.airports.forEach((airport) => {
    sampleTimes.forEach((start) => {
      const end = start + duration;
      const closure: Closure = {
        airport: airport.id,
        start,
        end,
        reason: `${airport.city} Airfield Emergency Closure`,
      };

      const sim = simulateNetwork(data, closure, { appliedActions: [] });
      // Only include if it creates real impact
      if (sim.metrics.delayed_flights > 0 || sim.metrics.stranded_passengers > 0) {
        results.push({
          airport: airport.id,
          start,
          end,
          duration,
          reason: `${airport.city} Superstorm & Ground Stop`,
          baselineMetrics: sim.metrics,
        });
      }
    });
  });

  // Rank by damage: highest stranded passengers, then highest total delay, lowest shift score
  results.sort((a, b) => {
    if (a.baselineMetrics.stranded_passengers !== b.baselineMetrics.stranded_passengers) {
      return b.baselineMetrics.stranded_passengers - a.baselineMetrics.stranded_passengers;
    }
    if (a.baselineMetrics.total_delay_minutes !== b.baselineMetrics.total_delay_minutes) {
      return b.baselineMetrics.total_delay_minutes - a.baselineMetrics.total_delay_minutes;
    }
    return a.baselineMetrics.shift_score - b.baselineMetrics.shift_score;
  });

  // Take top 10 worst crises and calculate their Par score
  const topCrises: WorstDayCrisis[] = results.slice(0, 10).map((item, idx) => {
    const apt = airportMap.get(item.airport);
    const closure: Closure = {
      airport: item.airport,
      start: item.start,
      end: item.end,
      reason: item.reason,
    };

    // Calculate Par using engine recovery search
    const bestPlan = searchBestRecoveryPlan(data, closure, 3);
    const parScore = bestPlan.finalMetrics.shift_score;

    return {
      rank: idx + 1,
      airport: item.airport,
      airportName: apt?.name || item.airport,
      city: apt?.city || item.airport,
      start: item.start,
      end: item.end,
      duration: item.duration,
      reason: item.reason,
      strandedWithoutAction: item.baselineMetrics.stranded_passengers,
      delayWithoutAction: item.baselineMetrics.total_delay_minutes,
      crewBreaches: item.baselineMetrics.crew_breaches,
      cancellations: item.baselineMetrics.cancelled_flights,
      baselineScore: item.baselineMetrics.shift_score,
      parScore,
      recommendedActionsCount: bestPlan.plan.length,
    };
  });

  return topCrises;
}
