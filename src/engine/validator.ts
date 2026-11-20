import { FlightNetworkData } from './types';
import { toMinutes } from './time';

export function validateFlightNetwork(data: FlightNetworkData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Top level check
  if (!data) {
    throw new Error('Dataset validation failed: data is null or undefined.');
  }

  const { meta, airports, flights, connections, crews, spare_aircraft } = data;

  if (!meta) errors.push('Missing "meta" section.');
  if (meta && typeof meta.min_turnaround_minutes !== 'number') {
    errors.push('meta.min_turnaround_minutes must be a number.');
  }

  if (!Array.isArray(airports) || airports.length === 0) {
    errors.push('Dataset must contain an "airports" array with at least one airport.');
  }
  if (!Array.isArray(flights) || flights.length === 0) {
    errors.push('Dataset must contain a "flights" array with at least one flight.');
  }
  if (!Array.isArray(connections)) {
    errors.push('Dataset must contain a "connections" array.');
  }
  if (!Array.isArray(crews)) {
    errors.push('Dataset must contain a "crews" array.');
  }
  if (!Array.isArray(spare_aircraft)) {
    errors.push('Dataset must contain a "spare_aircraft" array.');
  }

  if (errors.length > 0) {
    throw new Error(`Dataset validation failed with structural errors:\n${errors.join('\n')}`);
  }

  const airportMap = new Map<string, typeof airports[0]>();
  airports.forEach((a, idx) => {
    if (!a.id) errors.push(`Airport at index ${idx} is missing 'id'.`);
    if (!a.capacity_per_hour || a.capacity_per_hour <= 0) {
      errors.push(`Airport ${a.id} must have a positive capacity_per_hour.`);
    }
    if (airportMap.has(a.id)) {
      errors.push(`Duplicate airport id '${a.id}'.`);
    }
    airportMap.set(a.id, a);
  });

  const flightMap = new Map<string, typeof flights[0]>();
  const capacity = meta.aircraft_capacity || 180;

  flights.forEach((f, idx) => {
    if (!f.flight_id) errors.push(`Flight at index ${idx} is missing 'flight_id'.`);
    if (flightMap.has(f.flight_id)) errors.push(`Duplicate flight_id '${f.flight_id}'.`);
    flightMap.set(f.flight_id, f);

    if (!airportMap.has(f.origin)) {
      errors.push(`Flight ${f.flight_id} has unknown origin airport '${f.origin}'.`);
    }
    if (!airportMap.has(f.destination)) {
      errors.push(`Flight ${f.flight_id} has unknown destination airport '${f.destination}'.`);
    }
    if (f.origin === f.destination) {
      errors.push(`Flight ${f.flight_id} has identical origin and destination '${f.origin}'.`);
    }

    try {
      const depMins = toMinutes(f.dep);
      const arrMins = toMinutes(f.arr);
      if (arrMins <= depMins) {
        errors.push(`Flight ${f.flight_id} arrival time (${f.arr}) must be after departure time (${f.dep}).`);
      }
      if (f.block_minutes !== (arrMins - depMins)) {
        errors.push(`Flight ${f.flight_id} block_minutes (${f.block_minutes}) does not equal arr - dep (${arrMins - depMins}).`);
      }
    } catch (e: any) {
      errors.push(`Flight ${f.flight_id} invalid time: ${e.message}`);
    }

    if (f.pax > capacity) {
      errors.push(`Flight ${f.flight_id} pax (${f.pax}) exceeds aircraft capacity (${capacity}).`);
    }
    if (f.pax <= 0) {
      errors.push(`Flight ${f.flight_id} pax must be greater than 0.`);
    }
  });

  // Verify tail rotations order and airport continuity
  const tailFlights = new Map<string, typeof flights>();
  flights.forEach((f) => {
    if (!tailFlights.has(f.tail_id)) tailFlights.set(f.tail_id, []);
    tailFlights.get(f.tail_id)!.push(f);
  });

  tailFlights.forEach((legs, tailId) => {
    legs.sort((a, b) => a.leg_order - b.leg_order);
    for (let i = 1; i < legs.length; i++) {
      const prev = legs[i - 1];
      const curr = legs[i];
      if (curr.origin !== prev.destination) {
        errors.push(`Tail ${tailId} discontinuous route: leg ${prev.leg_order} ends at ${prev.destination}, but leg ${curr.leg_order} starts at ${curr.origin}.`);
      }
      const prevArr = toMinutes(prev.arr);
      const currDep = toMinutes(curr.dep);
      if (currDep < prevArr + meta.min_turnaround_minutes) {
        errors.push(`Tail ${tailId} scheduled turnaround between ${prev.flight_id} and ${curr.flight_id} is ${currDep - prevArr} min, which is less than min turnaround ${meta.min_turnaround_minutes} min.`);
      }
    }
  });

  // Connections validation
  connections.forEach((c) => {
    const fFrom = flightMap.get(c.from_flight);
    const fTo = flightMap.get(c.to_flight);
    if (!fFrom) {
      errors.push(`Connection ${c.connection_id} references non-existent from_flight '${c.from_flight}'.`);
    }
    if (!fTo) {
      errors.push(`Connection ${c.connection_id} references non-existent to_flight '${c.to_flight}'.`);
    }
    if (fFrom && fTo) {
      if (fFrom.destination !== c.airport) {
        errors.push(`Connection ${c.connection_id} stated airport '${c.airport}' does not match from_flight destination '${fFrom.destination}'.`);
      }
      if (fTo.origin !== c.airport) {
        errors.push(`Connection ${c.connection_id} stated airport '${c.airport}' does not match to_flight origin '${fTo.origin}'.`);
      }
      const diff = toMinutes(fTo.dep) - toMinutes(fFrom.arr);
      if (diff < c.min_connect_minutes) {
        errors.push(`Connection ${c.connection_id} scheduled connection window (${diff} min) is less than min_connect_minutes (${c.min_connect_minutes} min).`);
      }
      if (c.passengers > fFrom.pax || c.passengers > fTo.pax) {
        errors.push(`Connection ${c.connection_id} passengers (${c.passengers}) exceed flight pax (${fFrom.pax} or ${fTo.pax}).`);
      }
    }
  });

  // Crew validation
  crews.forEach((crw) => {
    if (!crw.tail_id) errors.push(`Crew ${crw.crew_id} is missing tail_id.`);
    if (!Array.isArray(crw.flight_ids) || crw.flight_ids.length === 0) {
      errors.push(`Crew ${crw.crew_id} has no assigned flights.`);
    } else {
      crw.flight_ids.forEach((fid) => {
        const fl = flightMap.get(fid);
        if (!fl) {
          errors.push(`Crew ${crw.crew_id} assigned non-existent flight '${fid}'.`);
        } else if (fl.tail_id !== crw.tail_id) {
          errors.push(`Crew ${crw.crew_id} (tail ${crw.tail_id}) assigned flight '${fid}' belonging to tail '${fl.tail_id}'.`);
        }
      });
    }
  });

  // Spare aircraft validation
  spare_aircraft.forEach((s) => {
    if (!airportMap.has(s.base)) {
      errors.push(`Spare aircraft ${s.tail_id} base '${s.base}' does not exist in airports.`);
    }
    try {
      toMinutes(s.available_from);
    } catch {
      errors.push(`Spare aircraft ${s.tail_id} has invalid available_from '${s.available_from}'.`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Flight network dataset validation failed with ${errors.length} errors:\n- ${errors.join('\n- ')}`);
  }

  return { valid: true, errors: [] };
}
