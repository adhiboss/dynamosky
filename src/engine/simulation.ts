import {
  FlightNetworkData,
  Closure,
  SimulatedFlight,
  ConnectionResult,
  NetworkMetrics,
  SimulationResult,
  RecoveryAction,
  DelayAttribution,
} from './types';
import { toMinutes } from './time';

interface SimulationOptions {
  cancellationDelayThreshold?: number; // default 300 mins
  appliedActions?: RecoveryAction[];
}

export function simulateNetwork(
  data: FlightNetworkData,
  closure: Closure | null = null,
  options: SimulationOptions = {}
): SimulationResult {
  const { min_turnaround_minutes } = data.meta;
  const cancellationDelayThreshold = options.cancellationDelayThreshold ?? 300;
  const appliedActions = options.appliedActions ?? [];

  // Index airports
  const airportCapacityMap = new Map<string, number>();
  data.airports.forEach((a) => {
    airportCapacityMap.set(a.id, a.capacity_per_hour);
  });

  // Parse actions
  const cancelledFlightIds = new Set<string>();
  const spareAssignments = new Map<string, { spare_tail_id: string }>(); // flight_id -> spare
  const tailSwaps: Array<{ tail1: string; tail2: string; airport: string; atTime: number }> = [];

  appliedActions.forEach((act) => {
    if (act.type === 'CANCEL_FLIGHT' && act.flight_id) {
      cancelledFlightIds.add(act.flight_id);
    } else if (act.type === 'ASSIGN_SPARE' && act.flight_id && act.spare_tail_id) {
      spareAssignments.set(act.flight_id, { spare_tail_id: act.spare_tail_id });
    } else if (act.type === 'SWAP_TAILS' && act.swap_tail_1 && act.swap_tail_2 && act.swap_airport && act.swap_time !== undefined) {
      tailSwaps.push({
        tail1: act.swap_tail_1,
        tail2: act.swap_tail_2,
        airport: act.swap_airport,
        atTime: act.swap_time,
      });
    }
  });

  // Track flight information
  const flightMap = new Map<string, (typeof data.flights)[0]>();
  data.flights.forEach((f) => flightMap.set(f.flight_id, f));

  // Build tail flights map
  const tailFlightMap = new Map<string, typeof data.flights>();
  data.flights.forEach((f) => {
    if (!tailFlightMap.has(f.tail_id)) tailFlightMap.set(f.tail_id, []);
    tailFlightMap.get(f.tail_id)!.push(f);
  });
  tailFlightMap.forEach((legs) => legs.sort((a, b) => a.leg_order - b.leg_order));

  // Crew mapping
  const crewByTail = new Map<string, (typeof data.crews)[0]>();
  data.crews.forEach((c) => {
    crewByTail.set(c.tail_id, c);
  });

  // We will simulate flight by flight in chronological order of ready-time / dependencies
  const simulatedFlights: Record<string, SimulatedFlight> = {};

  // Track aircraft current physical location and ready time for each operating tail (or spare)
  interface TailState {
    currentAirport: string;
    readyTime: number;
    lastFlightId?: string;
    lastArrDelay: number;
    rootFlightId?: string;
    isSpareInUse?: boolean;
    crewDutyStart: number;
    crewMaxDuty: number;
    crewId: string;
  }

  const tailStates = new Map<string, TailState>();

  // Initialize tails
  tailFlightMap.forEach((legs, tailId) => {
    const firstLeg = legs[0];
    const crew = crewByTail.get(tailId);
    tailStates.set(tailId, {
      currentAirport: firstLeg.origin,
      readyTime: toMinutes(firstLeg.dep),
      lastArrDelay: 0,
      rootFlightId: undefined,
      crewDutyStart: crew ? toMinutes(crew.duty_start) : toMinutes(firstLeg.dep) - 45,
      crewMaxDuty: crew ? crew.max_duty_mins : 660,
      crewId: crew ? crew.crew_id : `CRW-${tailId}`,
    });
  });

  // Spares
  const spareMap = new Map<string, (typeof data.spare_aircraft)[0]>();
  data.spare_aircraft.forEach((s) => spareMap.set(s.tail_id, s));

  // Determine effective flight tail chains considering spare assignments and swaps
  // A spare assignment assigns spare to flight_id and all subsequent legs of that tail
  const effectiveTailAssignments = new Map<string, string>(); // flight_id -> effective_tail_id
  const spareActivatedAt = new Map<string, { startDep: number; fromFlightId: string }>();

  tailFlightMap.forEach((legs, originalTail) => {
    let activeTail = originalTail;
    legs.forEach((f) => {
      if (spareAssignments.has(f.flight_id)) {
        const spareInfo = spareAssignments.get(f.flight_id)!;
        activeTail = spareInfo.spare_tail_id;
        spareActivatedAt.set(activeTail, {
          startDep: toMinutes(f.dep),
          fromFlightId: f.flight_id,
        });
      }
      effectiveTailAssignments.set(f.flight_id, activeTail);
    });
  });

  // Apply tail swaps if any
  tailSwaps.forEach((swap) => {
    // Find all flights after swap.atTime on swap.tail1 and swap.tail2
    const legs1 = (tailFlightMap.get(swap.tail1) || []).filter((f) => toMinutes(f.dep) >= swap.atTime);
    const legs2 = (tailFlightMap.get(swap.tail2) || []).filter((f) => toMinutes(f.dep) >= swap.atTime);
    legs1.forEach((f) => effectiveTailAssignments.set(f.flight_id, swap.tail2));
    legs2.forEach((f) => effectiveTailAssignments.set(f.flight_id, swap.tail1));
  });

  // Sort all flights globally by scheduled departure time
  const sortedFlights = [...data.flights].sort((a, b) => {
    const diff = toMinutes(a.dep) - toMinutes(b.dep);
    if (diff !== 0) return diff;
    return a.flight_id.localeCompare(b.flight_id);
  });

  // Temporary queue structure for airport movements
  interface AirportMovement {
    flightId: string;
    isDeparture: boolean;
    readyTime: number;
    airport: string;
  }

  // First pass: identify initial arrival & departure ready times based on closures and turnaround
  // Then resolve airport restart queues if an airport has a closure
  const movementsAtClosedAirport: AirportMovement[] = [];

  sortedFlights.forEach((f) => {
    const sDep = toMinutes(f.dep);
    const sArr = toMinutes(f.arr);
    const effTail = effectiveTailAssignments.get(f.flight_id) || f.tail_id;

    // Check if this tail has a state initialized (spare tails may initialize dynamically)
    if (!tailStates.has(effTail)) {
      const spareDef = spareMap.get(effTail);
      const actInfo = spareActivatedAt.get(effTail);
      const crewDutyStart = actInfo ? Math.max(0, actInfo.startDep - 45) : toMinutes(spareDef?.available_from || '06:00');
      tailStates.set(effTail, {
        currentAirport: spareDef?.base || f.origin,
        readyTime: actInfo ? actInfo.startDep : toMinutes(spareDef?.available_from || '06:00'),
        lastArrDelay: 0,
        rootFlightId: undefined,
        isSpareInUse: true,
        crewDutyStart,
        crewMaxDuty: 600, // Fresh crew with 10h (600m) duty limit per ASSUMPTIONS.md
        crewId: `CRW-SPR-${effTail}`,
      });
    }

    const tState = tailStates.get(effTail)!;

    // 1. Check explicit dispatcher cancellation
    if (cancelledFlightIds.has(f.flight_id)) {
      simulatedFlights[f.flight_id] = {
        flight_id: f.flight_id,
        tail_id: f.tail_id,
        effective_tail_id: effTail,
        leg_order: f.leg_order,
        origin: f.origin,
        destination: f.destination,
        scheduled_dep: sDep,
        scheduled_arr: sArr,
        actual_dep: sDep,
        actual_arr: sArr,
        dep_delay: 0,
        arr_delay: 0,
        status: 'CANCELLED',
        cancellation_reason: 'Dispatcher cancellation',
        pax: f.pax,
        block_minutes: f.block_minutes,
        attribution: {
          closure_delay: 0,
          restart_queue_delay: 0,
          knock_on_delay: 0,
          crew_delay: 0,
          slack_absorbed: 0,
          total_arrival_delay: 0,
        },
        operating_crew_id: tState.crewId,
        operating_crew_breached: false,
      };
      return;
    }

    // 2. Check aircraft physical location (Out of Position check)
    if (tState.currentAirport !== f.origin) {
      simulatedFlights[f.flight_id] = {
        flight_id: f.flight_id,
        tail_id: f.tail_id,
        effective_tail_id: effTail,
        leg_order: f.leg_order,
        origin: f.origin,
        destination: f.destination,
        scheduled_dep: sDep,
        scheduled_arr: sArr,
        actual_dep: sDep,
        actual_arr: sArr,
        dep_delay: 0,
        arr_delay: 0,
        status: 'OUT_OF_POSITION',
        cancellation_reason: `Aircraft out of position (currently at ${tState.currentAirport}, flight departs ${f.origin})`,
        pax: f.pax,
        block_minutes: f.block_minutes,
        attribution: {
          closure_delay: 0,
          restart_queue_delay: 0,
          knock_on_delay: 0,
          crew_delay: 0,
          slack_absorbed: 0,
          total_arrival_delay: 0,
        },
        operating_crew_id: tState.crewId,
        operating_crew_breached: false,
      };
      return;
    }

    // 3. Turnaround and upstream knock-on delay
    const scheduledTurnaround = f.turnaround_before_min || 0;
    const scheduledSlack = Math.max(0, scheduledTurnaround - min_turnaround_minutes);
    const upstreamDelay = tState.lastArrDelay;

    // Slack absorbs delay
    const slackAbsorbed = Math.min(scheduledSlack, upstreamDelay);
    const grossKnockOn = upstreamDelay;
    const netKnockOn = Math.max(0, grossKnockOn - slackAbsorbed);

    // Aircraft ready time at departure
    let readyDepTime = sDep + netKnockOn;
    let rootFlight = netKnockOn > 0 ? (tState.rootFlightId || tState.lastFlightId) : undefined;

    // 4. Departure airport closure check
    let closureWaitDep = 0;
    if (closure && closure.airport === f.origin) {
      if (readyDepTime < closure.end && readyDepTime >= closure.start) {
        closureWaitDep = closure.end - readyDepTime;
        readyDepTime = closure.end;
        rootFlight = rootFlight || f.flight_id;
      } else if (readyDepTime < closure.start && readyDepTime + 15 >= closure.start) {
        // If ready before start but cannot depart before start
      }
    }

    // 5. Destination airport closure check (holding on ground at origin so arrival >= closure.end)
    let closureWaitArr = 0;
    const estArr = readyDepTime + f.block_minutes;
    if (closure && closure.airport === f.destination) {
      if (estArr < closure.end && estArr >= closure.start) {
        const holdNeeded = closure.end - estArr;
        closureWaitArr = holdNeeded;
        readyDepTime += holdNeeded;
        rootFlight = rootFlight || f.flight_id;
      }
    }

    const totalClosureDelay = closureWaitDep + closureWaitArr;

    // Store tentative ready times before restart queue ordering
    simulatedFlights[f.flight_id] = {
      flight_id: f.flight_id,
      tail_id: f.tail_id,
      effective_tail_id: effTail,
      leg_order: f.leg_order,
      origin: f.origin,
      destination: f.destination,
      scheduled_dep: sDep,
      scheduled_arr: sArr,
      actual_dep: readyDepTime,
      actual_arr: readyDepTime + f.block_minutes,
      dep_delay: readyDepTime - sDep,
      arr_delay: readyDepTime - sDep, // block time fixed
      status: 'ON_TIME',
      pax: f.pax,
      block_minutes: f.block_minutes,
      attribution: {
        closure_delay: totalClosureDelay,
        restart_queue_delay: 0,
        knock_on_delay: grossKnockOn,
        knock_on_root_flight: rootFlight,
        crew_delay: 0,
        slack_absorbed: slackAbsorbed,
        total_arrival_delay: readyDepTime - sDep,
      },
      operating_crew_id: tState.crewId,
      operating_crew_breached: false,
    };

    // Track movement for closed airport queue
    if (closure && (f.origin === closure.airport || f.destination === closure.airport)) {
      movementsAtClosedAirport.push({
        flightId: f.flight_id,
        isDeparture: f.origin === closure.airport,
        readyTime: f.origin === closure.airport ? readyDepTime : readyDepTime + f.block_minutes,
        airport: closure.airport,
      });
    }

    // Update tail state tentatively
    tState.currentAirport = f.destination;
    tState.readyTime = readyDepTime + f.block_minutes;
    tState.lastFlightId = f.flight_id;
    tState.lastArrDelay = readyDepTime - sDep;
    tState.rootFlightId = rootFlight;
  });

  // Second pass: Process restart queue at the closed airport after closure ends
  if (closure) {
    const capacity = airportCapacityMap.get(closure.airport) || 30;
    const spacingMinutes = 60 / capacity;

    // Filter movements that are ready between closure.start and until queue clears
    const queueMovements = movementsAtClosedAirport
      .filter((m) => m.readyTime >= closure.end - 0.001)
      .sort((a, b) => {
        if (Math.abs(a.readyTime - b.readyTime) > 0.001) {
          return a.readyTime - b.readyTime;
        }
        return a.flightId.localeCompare(b.flightId);
      });

    let currentSlot = closure.end;

    queueMovements.forEach((mov) => {
      const fl = simulatedFlights[mov.flightId];
      if (!fl || fl.status === 'CANCELLED' || fl.status === 'OUT_OF_POSITION') return;

      const readyAtAirport = mov.readyTime;
      const scheduledSlot = Math.max(readyAtAirport, currentSlot);
      const queueDelay = Math.max(0, Math.round(scheduledSlot - readyAtAirport));

      if (queueDelay > 0) {
        if (mov.isDeparture) {
          // Delay departure by queueDelay
          fl.actual_dep += queueDelay;
          fl.actual_arr += queueDelay;
          fl.dep_delay += queueDelay;
          fl.arr_delay += queueDelay;
          fl.attribution.restart_queue_delay += queueDelay;
          fl.attribution.total_arrival_delay += queueDelay;
        } else {
          // Destination arrival queue: delay departure from origin so arrival lands at slot
          fl.actual_dep += queueDelay;
          fl.actual_arr += queueDelay;
          fl.dep_delay += queueDelay;
          fl.arr_delay += queueDelay;
          fl.attribution.restart_queue_delay += queueDelay;
          fl.attribution.total_arrival_delay += queueDelay;
        }
      }

      currentSlot = scheduledSlot + spacingMinutes;
    });

    // Re-propagate downstream delays across tail legs after queue shifts
    tailFlightMap.forEach((legs, tailId) => {
      // Find effective tail
      const effTail = legs[0] ? (effectiveTailAssignments.get(legs[0].flight_id) || tailId) : tailId;
      for (let i = 1; i < legs.length; i++) {
        const prevFlight = simulatedFlights[legs[i - 1].flight_id];
        const currFlight = simulatedFlights[legs[i].flight_id];
        if (!prevFlight || !currFlight) continue;
        if (prevFlight.status === 'CANCELLED' || prevFlight.status === 'OUT_OF_POSITION') continue;
        if (currFlight.status === 'CANCELLED' || currFlight.status === 'OUT_OF_POSITION') continue;

        const minReadyDep = prevFlight.actual_arr + min_turnaround_minutes;
        if (currFlight.actual_dep < minReadyDep) {
          const shift = minReadyDep - currFlight.actual_dep;
          currFlight.actual_dep += shift;
          currFlight.actual_arr += shift;
          currFlight.dep_delay += shift;
          currFlight.arr_delay += shift;
          currFlight.attribution.knock_on_delay += shift;
          currFlight.attribution.total_arrival_delay += shift;
          currFlight.attribution.knock_on_root_flight = prevFlight.attribution.knock_on_root_flight || prevFlight.flight_id;
        }
      }
    });
  }

  // Third pass: Evaluate crew duty limits and delay cancellation thresholds
  // Group operating flights by crew
  const crewFlightsOperating = new Map<string, SimulatedFlight[]>();
  Object.values(simulatedFlights).forEach((fl) => {
    if (fl.status !== 'CANCELLED' && fl.status !== 'OUT_OF_POSITION') {
      if (!crewFlightsOperating.has(fl.operating_crew_id)) {
        crewFlightsOperating.set(fl.operating_crew_id, []);
      }
      crewFlightsOperating.get(fl.operating_crew_id)!.push(fl);
    }
  });

  // Check crew duty and threshold
  crewFlightsOperating.forEach((legs, crewId) => {
    legs.sort((a, b) => a.leg_order - b.leg_order);
    const crewInfo = data.crews.find((c) => c.crew_id === crewId);
    const dutyStart = crewInfo ? toMinutes(crewInfo.duty_start) : legs[0].scheduled_dep - 45;
    const maxDuty = crewInfo ? crewInfo.max_duty_mins : 600;

    let dutyExceeded = false;
    legs.forEach((fl) => {
      const dutyDuration = fl.actual_arr - dutyStart;

      // Check delay cancellation threshold (default 300 min)
      if (fl.arr_delay >= cancellationDelayThreshold) {
        fl.status = 'CANCELLED';
        fl.cancellation_reason = `Delay reached cancellation threshold (${fl.arr_delay}m >= ${cancellationDelayThreshold}m)`;
        dutyExceeded = true;
      } else if (dutyDuration > maxDuty) {
        dutyExceeded = true;
        fl.operating_crew_breached = true;
        fl.status = 'CANCELLED';
        fl.cancellation_reason = `Operating crew duty exceeded (${dutyDuration}m > max ${maxDuty}m)`;
      } else if (dutyExceeded) {
        // Cascade subsequent legs on this crew
        fl.status = 'CANCELLED';
        fl.cancellation_reason = `Crew duty cascade cancellation`;
      } else if (fl.arr_delay >= 15) {
        fl.status = 'DELAYED';
      } else {
        fl.status = 'ON_TIME';
      }
    });
  });

  // If cancellations occurred during third pass, cascade "out of position" for downstream legs
  tailFlightMap.forEach((legs, originalTail) => {
    let lastValidLocation: string | null = null;
    let chainBroken = false;

    legs.forEach((f) => {
      const fl = simulatedFlights[f.flight_id];
      if (!fl) return;

      if (chainBroken) {
        fl.status = 'OUT_OF_POSITION';
        fl.cancellation_reason = `Aircraft out of position due to prior cancellation`;
      } else if (fl.status === 'CANCELLED') {
        chainBroken = true;
      } else if (fl.arr_delay >= 15) {
        fl.status = 'DELAYED';
      } else {
        fl.status = 'ON_TIME';
      }
    });
  });

  // Fourth pass: Connections evaluation
  // Rule 5: Connections made if to_flight.actual_dep >= from_flight.actual_arr + min_connect_minutes
  // If either flight is cancelled, passengers are already counted in cancelled flight's pax, so only count missed connections where both flights operate!
  const connectionResults: ConnectionResult[] = [];
  let missedConnectionsCount = 0;
  let missedConnectionPax = 0;

  data.connections.forEach((c) => {
    const fFrom = simulatedFlights[c.from_flight];
    const fTo = simulatedFlights[c.to_flight];
    if (!fFrom || !fTo) return;

    const fromOperating = fFrom.status === 'ON_TIME' || fFrom.status === 'DELAYED';
    const toOperating = fTo.status === 'ON_TIME' || fTo.status === 'DELAYED';

    const schedConnect = fTo.scheduled_dep - fFrom.scheduled_arr;
    const actualConnect = fTo.actual_dep - fFrom.actual_arr;

    if (!fromOperating || !toOperating) {
      // Either cancelled: connection not made, but passengers are already counted as stranded under cancelled flights!
      connectionResults.push({
        connection_id: c.connection_id,
        airport: c.airport,
        from_flight: c.from_flight,
        to_flight: c.to_flight,
        passengers: c.passengers,
        min_connect_minutes: c.min_connect_minutes,
        scheduled_connect_time: schedConnect,
        actual_connect_time: actualConnect,
        made: false,
        missed_reason: !fromOperating
          ? `Inbound flight ${fFrom.flight_id} was cancelled`
          : `Outbound flight ${fTo.flight_id} was cancelled`,
      });
    } else {
      // Both flights operate
      const made = actualConnect >= c.min_connect_minutes;
      if (!made) {
        missedConnectionsCount += 1;
        missedConnectionPax += c.passengers;
      }
      connectionResults.push({
        connection_id: c.connection_id,
        airport: c.airport,
        from_flight: c.from_flight,
        to_flight: c.to_flight,
        passengers: c.passengers,
        min_connect_minutes: c.min_connect_minutes,
        scheduled_connect_time: schedConnect,
        actual_connect_time: actualConnect,
        made,
        missed_reason: made
          ? undefined
          : `Tight connection: actual transfer window ${actualConnect}m < min ${c.min_connect_minutes}m`,
      });
    }
  });

  // Calculate stranded passengers:
  // Rule 6: Stranded passengers = pax on cancelled flights + passengers on missed connections (no double counting).
  let cancelledPax = 0;
  let operatingFlightsCount = 0;
  let delayedFlightsCount = 0;
  let cancelledFlightsCount = 0;
  let totalDelayMinutes = 0;
  let crewBreachesCount = 0;
  let totalFlownBlockMinutes = 0;
  let totalScheduledBlockMinutes = 0;

  Object.values(simulatedFlights).forEach((fl) => {
    totalScheduledBlockMinutes += fl.block_minutes;
    if (fl.status === 'CANCELLED' || fl.status === 'OUT_OF_POSITION') {
      cancelledFlightsCount += 1;
      cancelledPax += fl.pax;
    } else {
      operatingFlightsCount += 1;
      totalFlownBlockMinutes += fl.block_minutes;
      if (fl.arr_delay >= 15) {
        delayedFlightsCount += 1;
      }
      totalDelayMinutes += Math.max(0, fl.arr_delay);
      if (fl.operating_crew_breached) {
        crewBreachesCount += 1;
      }
    }
  });

  const strandedPassengers = cancelledPax + missedConnectionPax;

  // Calculate action costs
  let totalActionCosts = 0;
  appliedActions.forEach((act) => {
    totalActionCosts += act.cost || 0;
  });

  // Gamification Shift Score:
  // 10000 - 10*stranded - 1*total_delay_min - 500*crew_breaches - 150*cancellations - action costs, floored at 0
  const rawScore =
    10000 -
    10 * strandedPassengers -
    1 * totalDelayMinutes -
    500 * crewBreachesCount -
    150 * cancelledFlightsCount -
    totalActionCosts;
  const shiftScore = Math.max(0, Math.round(rawScore));

  const aircraftUtilisation =
    totalScheduledBlockMinutes > 0
      ? Math.round((totalFlownBlockMinutes / totalScheduledBlockMinutes) * 1000) / 10
      : 100;

  const metrics: NetworkMetrics = {
    total_flights: data.flights.length,
    operating_flights: operatingFlightsCount,
    delayed_flights: delayedFlightsCount,
    cancelled_flights: cancelledFlightsCount,
    total_delay_minutes: totalDelayMinutes,
    stranded_passengers: strandedPassengers,
    connections_total: data.connections.length,
    connections_made: data.connections.length - missedConnectionsCount - (data.connections.length - connectionResults.filter(c => c.made).length - missedConnectionsCount),
    connections_missed: missedConnectionsCount,
    crew_breaches: crewBreachesCount,
    aircraft_utilisation_pct: aircraftUtilisation,
    shift_score: shiftScore,
  };

  return {
    flights: simulatedFlights,
    connections: connectionResults,
    metrics,
    closure,
    actionsApplied: appliedActions,
  };
}
