import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  FlightNetworkData,
  validateFlightNetwork,
  simulateNetwork,
  generateRecoveryCandidates,
  searchBestRecoveryPlan,
  validateDispatcherResponse,
  hydrateDispatcherResponse,
  generateFallbackDispatcherResponse,
  toMinutes,
  toHHMM,
} from '../index';

describe('Flight Network Dataset & Engine Invariants', () => {
  const jsonPath = path.resolve('public/data/flight_network.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const dataset: FlightNetworkData = JSON.parse(raw);

  it('validates the flight network dataset successfully', () => {
    const result = validateFlightNetwork(dataset);
    expect(result.valid).toBe(true);
    expect(dataset.airports.length).toBe(16);
    expect(dataset.flights.length).toBe(70);
    expect(dataset.connections.length).toBe(21);
    expect(dataset.crews.length).toBe(16);
    expect(dataset.spare_aircraft.length).toBe(2);
    expect(dataset.meta.min_turnaround_minutes).toBe(30);
  });

  it('throws descriptive errors on corrupted data', () => {
    const corrupted = JSON.parse(JSON.stringify(dataset)) as FlightNetworkData;
    // Corrupt flight passenger capacity
    corrupted.flights[0].pax = 999;
    expect(() => validateFlightNetwork(corrupted)).toThrow(/exceeds aircraft capacity/);

    // Corrupt connection airport
    const corrupted2 = JSON.parse(JSON.stringify(dataset)) as FlightNetworkData;
    corrupted2.connections[0].airport = 'JAI'; // doesn't match
    expect(() => validateFlightNetwork(corrupted2)).toThrow(/stated airport 'JAI' does not match/);
  });

  it('runs on-time baseline simulation when no closure occurs', () => {
    const sim = simulateNetwork(dataset, null);
    expect(sim.metrics.total_flights).toBe(70);
    expect(sim.metrics.operating_flights).toBe(70);
    expect(sim.metrics.delayed_flights).toBe(0);
    expect(sim.metrics.cancelled_flights).toBe(0);
    expect(sim.metrics.total_delay_minutes).toBe(0);
    expect(sim.metrics.stranded_passengers).toBe(0);
    expect(sim.metrics.crew_breaches).toBe(0);
    expect(sim.metrics.shift_score).toBe(10000);
  });

  it('hand-computed case: Mumbai (BOM) 90-minute closure cascade', () => {
    // BOM closed 06:00 to 07:30 IST (360m to 450m)
    const closure = {
      airport: 'BOM',
      start: 360,
      end: 450,
      reason: 'Monsoon Thunderstorm',
    };

    const sim = simulateNetwork(dataset, closure);

    // Hand checks:
    // Flight DS101 is scheduled BOM -> DEL dep 06:00 (360m).
    // Because BOM is closed until 450m, DS101 cannot depart until 450m.
    const f101 = sim.flights['DS101'];
    expect(f101).toBeDefined();
    expect(f101.actual_dep).toBeGreaterThanOrEqual(450);
    expect(f101.attribution.closure_delay).toBeGreaterThanOrEqual(90);

    // Total delay minutes must be positive
    expect(sim.metrics.total_delay_minutes).toBeGreaterThan(0);
    expect(sim.metrics.delayed_flights).toBeGreaterThan(0);

    // Shift score must be impacted (< 10000)
    expect(sim.metrics.shift_score).toBeLessThan(10000);
  });

  it('delay attribution parts must add up to total arrival delay for every flight', () => {
    const closure = {
      airport: 'BOM',
      start: 360,
      end: 480, // 2 hour closure
      reason: 'Severe Convective Cell',
    };

    const sim = simulateNetwork(dataset, closure);

    Object.values(sim.flights).forEach((fl) => {
      if (fl.status === 'CANCELLED' || fl.status === 'OUT_OF_POSITION') return;

      const attr = fl.attribution;
      // Net delay: (closure + queue + knock_on + crew - slack)
      // Since gross knock-on contains slack absorbed, (knock_on - slack_absorbed) is net knock-on.
      const computedNet =
        attr.closure_delay +
        attr.restart_queue_delay +
        (attr.knock_on_delay - attr.slack_absorbed) +
        attr.crew_delay;

      expect(computedNet).toBe(fl.arr_delay);
      expect(attr.total_arrival_delay).toBe(fl.arr_delay);
    });
  });

  it('stranded passenger count strictly avoids double-counting', () => {
    const closure = {
      airport: 'BOM',
      start: 360,
      end: 540,
      reason: 'Typhoon Gale',
    };

    const sim = simulateNetwork(dataset, closure);

    // Calculate manual sum of cancelled flight pax
    let manualCancelledPax = 0;
    Object.values(sim.flights).forEach((fl) => {
      if (fl.status === 'CANCELLED' || fl.status === 'OUT_OF_POSITION') {
        manualCancelledPax += fl.pax;
      }
    });

    // Calculate manual sum of missed connection pax WHERE BOTH FLIGHTS OPERATED
    let manualMissedConnPax = 0;
    sim.connections.forEach((c) => {
      const fromFl = sim.flights[c.from_flight];
      const toFl = sim.flights[c.to_flight];
      const fromOp = fromFl.status === 'ON_TIME' || fromFl.status === 'DELAYED';
      const toOp = toFl.status === 'ON_TIME' || toFl.status === 'DELAYED';

      if (fromOp && toOp && !c.made) {
        manualMissedConnPax += c.passengers;
      }
    });

    // Invariant: stranded_passengers === manualCancelledPax + manualMissedConnPax
    expect(sim.metrics.stranded_passengers).toBe(manualCancelledPax + manualMissedConnPax);
  });

  it('engine produces strictly deterministic output on repeated runs', () => {
    const closure = {
      airport: 'DEL',
      start: 420,
      end: 510,
      reason: 'Dense Fog CAT IIIc',
    };

    const run1 = simulateNetwork(dataset, closure);
    const run2 = simulateNetwork(dataset, closure);

    expect(run1.metrics).toEqual(run2.metrics);
    expect(run1.flights).toEqual(run2.flights);
    expect(run1.connections).toEqual(run2.connections);
  });

  it('generates recovery candidates and deterministic best plan', () => {
    const closure = {
      airport: 'BOM',
      start: 360,
      end: 480,
      reason: 'Monsoon Flooding',
    };

    const candidates = generateRecoveryCandidates(dataset, closure);
    expect(candidates.length).toBeGreaterThan(0);

    // Candidates should be ranked (best candidate at index 0)
    const best = candidates[0];
    expect(best.action.id).toBeDefined();

    // Search greedy sequence of up to 3 actions
    const search = searchBestRecoveryPlan(dataset, closure, 3);
    expect(search.plan.length).toBeGreaterThan(0);
    expect(search.finalMetrics.shift_score).toBeGreaterThan(
      simulateNetwork(dataset, closure).metrics.shift_score
    );
  });

  it('strictly validates AI dispatcher output: rejects digits outside placeholders and hydrates engine values', () => {
    const closure = {
      airport: 'BOM',
      start: 360,
      end: 450,
      reason: 'Monsoon Thunderstorm',
    };

    const candidates = generateRecoveryCandidates(dataset, closure);
    const baseline = simulateNetwork(dataset, closure);

    // 1. Valid AI response with placeholders and NO bare digits
    const validRaw = {
      chosen_action_ids: [candidates[0].action.id],
      explanation:
        'Immediate recovery order: Deploying spare to rescue passengers, reducing stranded travelers from {{stranded_before}} down to {{stranded_after}}, saving {{delay_saved}} minutes.',
    };

    const validCheck = validateDispatcherResponse(validRaw, candidates);
    expect(validCheck.valid).toBe(true);

    const hydrated = hydrateDispatcherResponse(validRaw, candidates, baseline.metrics);
    expect(hydrated.isVerified).toBe(true);
    expect(hydrated.explanation).not.toContain('{{stranded_before}}');
    expect(hydrated.explanation).toContain(baseline.metrics.stranded_passengers.toLocaleString());

    // 2. Invalid AI response: contains bare digit outside placeholder (Violation!)
    const invalidWithDigit = {
      chosen_action_ids: [candidates[0].action.id],
      explanation: 'We saved 120 minutes of delay by dispatching a spare.',
    };
    const invalidCheck1 = validateDispatcherResponse(invalidWithDigit, candidates);
    expect(invalidCheck1.valid).toBe(false);
    expect(invalidCheck1.error).toMatch(/raw numbers or digits outside a placeholder/);

    // 3. Invalid AI response: unknown placeholder
    const invalidWithUnknownPlaceholder = {
      chosen_action_ids: [candidates[0].action.id],
      explanation: 'This action saves {{unauthorized_metric_name}} passengers.',
    };
    const invalidCheck2 = validateDispatcherResponse(invalidWithUnknownPlaceholder, candidates);
    expect(invalidCheck2.valid).toBe(false);
    expect(invalidCheck2.error).toMatch(/Unknown placeholder/);

    // 4. Invalid AI response: invalid action ID not in candidate list
    const invalidWithFakeAction = {
      chosen_action_ids: ['ACT-FAKE-ID-999'],
      explanation: 'Action executed saving {{delay_saved}} minutes.',
    };
    const invalidCheck3 = validateDispatcherResponse(invalidWithFakeAction, candidates);
    expect(invalidCheck3.valid).toBe(false);
    expect(invalidCheck3.error).toMatch(/not in the valid candidate list/);

    // 5. Deterministic fallback response passes validation cleanly
    const fallback = generateFallbackDispatcherResponse(candidates, baseline.metrics);
    const fallbackValidation = validateDispatcherResponse(fallback, candidates);
    expect(fallbackValidation.valid).toBe(true);
    const hydratedFallback = hydrateDispatcherResponse(fallback, candidates, baseline.metrics, true);
    expect(hydratedFallback.isFallback).toBe(true);
    expect(hydratedFallback.isVerified).toBe(true);
  });
});
