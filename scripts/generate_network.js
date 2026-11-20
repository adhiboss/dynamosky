import fs from 'fs';
import path from 'path';

const airports = [
  { id: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', lat: 19.0896, lng: 72.8656, tier: 1, capacity_per_hour: 36 },
  { id: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', lat: 28.5562, lng: 77.1000, tier: 1, capacity_per_hour: 40 },
  { id: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru', lat: 13.1986, lng: 77.7066, tier: 1, capacity_per_hour: 32 },
  { id: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', lat: 17.2403, lng: 78.4294, tier: 1, capacity_per_hour: 30 },
  { id: 'MAA', name: 'Chennai Intl', city: 'Chennai', lat: 12.9941, lng: 80.1709, tier: 1, capacity_per_hour: 28 },
  { id: 'CCU', name: 'Netaji Subhash Chandra Bose Intl', city: 'Kolkata', lat: 22.6547, lng: 88.4467, tier: 1, capacity_per_hour: 26 },
  { id: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad', lat: 23.0734, lng: 72.6347, tier: 2, capacity_per_hour: 20 },
  { id: 'PNQ', name: 'Pune Intl', city: 'Pune', lat: 18.5821, lng: 73.9197, tier: 2, capacity_per_hour: 18 },
  { id: 'GOI', name: 'Dabolim Intl', city: 'Goa', lat: 15.3808, lng: 73.8314, tier: 2, capacity_per_hour: 18 },
  { id: 'COK', name: 'Cochin Intl', city: 'Kochi', lat: 10.1520, lng: 76.4019, tier: 2, capacity_per_hour: 18 },
  { id: 'JAI', name: 'Jaipur Intl', city: 'Jaipur', lat: 26.8242, lng: 75.8122, tier: 2, capacity_per_hour: 16 },
  { id: 'LKO', name: 'Chaudhary Charan Singh Intl', city: 'Lucknow', lat: 26.7606, lng: 80.8893, tier: 2, capacity_per_hour: 16 },
  { id: 'GAU', name: 'Lokpriya Gopinath Bordoloi Intl', city: 'Guwahati', lat: 26.1061, lng: 91.5859, tier: 2, capacity_per_hour: 14 },
  { id: 'PAT', name: 'Jay Prakash Narayan Intl', city: 'Patna', lat: 25.5913, lng: 85.0880, tier: 3, capacity_per_hour: 12 },
  { id: 'IXC', name: 'Shaheed Bhagat Singh Intl', city: 'Chandigarh', lat: 30.6735, lng: 76.7885, tier: 3, capacity_per_hour: 12 },
  { id: 'TRV', name: 'Thiruvananthapuram Intl', city: 'Trivandrum', lat: 8.4821, lng: 76.9200, tier: 3, capacity_per_hour: 12 },
];

const spare_aircraft = [
  { tail_id: 'VT-SPR1', base: 'BOM', available_from: '06:00', seats: 180 },
  { tail_id: 'VT-SPR2', base: 'DEL', available_from: '07:30', seats: 180 },
];

const meta = {
  version: '1.0.0',
  description: 'Domino Sky Pan-India 16-Airport Airline Schedule Network',
  min_turnaround_minutes: 30,
  timezone: 'IST',
  aircraft_capacity: 180,
  network_date: '2026-11-20',
};

// Helper: minutes to HH:MM
function toHHMM(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Routes and block times in minutes
const routeTimes = {
  'BOM-DEL': 130, 'DEL-BOM': 130,
  'BOM-BLR': 100, 'BLR-BOM': 100,
  'BOM-HYD': 85,  'HYD-BOM': 85,
  'BOM-MAA': 115, 'MAA-BOM': 115,
  'BOM-CCU': 160, 'CCU-BOM': 160,
  'BOM-AMD': 70,  'AMD-BOM': 70,
  'BOM-PNQ': 50,  'PNQ-BOM': 50,
  'BOM-GOI': 65,  'GOI-BOM': 65,
  'BOM-COK': 110, 'COK-BOM': 110,
  'BOM-JAI': 95,  'JAI-BOM': 95,
  'DEL-BLR': 165, 'BLR-DEL': 165,
  'DEL-HYD': 135, 'HYD-DEL': 135,
  'DEL-CCU': 130, 'CCU-DEL': 130,
  'DEL-AMD': 90,  'AMD-DEL': 90,
  'DEL-LKO': 65,  'LKO-DEL': 65,
  'DEL-PAT': 95,  'PAT-DEL': 95,
  'DEL-IXC': 55,  'IXC-DEL': 55,
  'DEL-GAU': 150, 'GAU-DEL': 150,
  'BLR-HYD': 65,  'HYD-BLR': 65,
  'BLR-MAA': 55,  'MAA-BLR': 55,
  'BLR-COK': 60,  'COK-BLR': 60,
  'BLR-GOI': 70,  'GOI-BLR': 70,
  'BLR-TRV': 75,  'TRV-BLR': 75,
  'HYD-MAA': 70,  'MAA-HYD': 70,
  'HYD-CCU': 120, 'CCU-HYD': 120,
  'CCU-GAU': 70,  'GAU-CCU': 70,
  'CCU-PAT': 65,  'PAT-CCU': 65,
};

function getBlock(orig, dest) {
  const key = `${orig}-${dest}`;
  return routeTimes[key] || 90;
}

// 16 tails schedule definition
// Tails 1 to 6 have 5 legs each = 30 flights
// Tails 7 to 16 have 4 legs each = 40 flights
// Total = 70 flights
const tailRotations = [
  // Tail 1: VT-AAA (BOM Base) - 5 legs
  { tail: 'VT-AAA', base: 'BOM', duty_start: 330, legs: [
    { orig: 'BOM', dest: 'DEL', dep: 360, turn: 0, pax: 168 },
    { orig: 'DEL', dest: 'BOM', dep: 540, turn: 50, pax: 172 },
    { orig: 'BOM', dest: 'BLR', dep: 720, turn: 50, pax: 164 },
    { orig: 'BLR', dest: 'BOM', dep: 870, turn: 50, pax: 155 },
    { orig: 'BOM', dest: 'GOI', dep: 1020, turn: 50, pax: 170 },
  ]},
  // Tail 2: VT-AAB (BOM Base) - 5 legs
  { tail: 'VT-AAB', base: 'BOM', duty_start: 345, legs: [
    { orig: 'BOM', dest: 'BLR', dep: 390, turn: 0, pax: 160 },
    { orig: 'BLR', dest: 'DEL', dep: 540, turn: 50, pax: 175 },
    { orig: 'DEL', dest: 'BOM', dep: 760, turn: 55, pax: 166 },
    { orig: 'BOM', dest: 'AMD', dep: 950, turn: 60, pax: 152 },
    { orig: 'AMD', dest: 'BOM', dep: 1070, turn: 50, pax: 158 },
  ]},
  // Tail 3: VT-AAC (DEL Base) - 5 legs
  { tail: 'VT-AAC', base: 'DEL', duty_start: 330, legs: [
    { orig: 'DEL', dest: 'BOM', dep: 375, turn: 0, pax: 170 },
    { orig: 'BOM', dest: 'DEL', dep: 560, turn: 55, pax: 165 },
    { orig: 'DEL', dest: 'CCU', dep: 745, turn: 55, pax: 158 },
    { orig: 'CCU', dest: 'DEL', dep: 935, turn: 60, pax: 162 },
    { orig: 'DEL', dest: 'IXC', dep: 1125, turn: 60, pax: 140 },
  ]},
  // Tail 4: VT-AAD (DEL Base) - 5 legs
  { tail: 'VT-AAD', base: 'DEL', duty_start: 350, legs: [
    { orig: 'DEL', dest: 'BLR', dep: 395, turn: 0, pax: 174 },
    { orig: 'BLR', dest: 'BOM', dep: 610, turn: 50, pax: 168 },
    { orig: 'BOM', dest: 'HYD', dep: 760, turn: 50, pax: 150 },
    { orig: 'HYD', dest: 'BOM', dep: 895, turn: 50, pax: 162 },
    { orig: 'BOM', dest: 'DEL', dep: 1030, turn: 50, pax: 175 },
  ]},
  // Tail 5: VT-AAE (BOM Base) - 5 legs
  { tail: 'VT-AAE', base: 'BOM', duty_start: 360, legs: [
    { orig: 'BOM', dest: 'HYD', dep: 410, turn: 0, pax: 155 },
    { orig: 'HYD', dest: 'DEL', dep: 545, turn: 50, pax: 165 },
    { orig: 'DEL', dest: 'BOM', dep: 730, turn: 50, pax: 170 },
    { orig: 'BOM', dest: 'COK', dep: 915, turn: 55, pax: 158 },
    { orig: 'COK', dest: 'BOM', dep: 1080, turn: 55, pax: 160 },
  ]},
  // Tail 6: VT-AAF (BLR Base) - 5 legs
  { tail: 'VT-AAF', base: 'BLR', duty_start: 340, legs: [
    { orig: 'BLR', dest: 'BOM', dep: 385, turn: 0, pax: 162 },
    { orig: 'BOM', dest: 'CCU', dep: 540, turn: 55, pax: 170 },
    { orig: 'CCU', dest: 'BOM', dep: 755, turn: 55, pax: 166 },
    { orig: 'BOM', dest: 'MAA', dep: 970, turn: 55, pax: 152 },
    { orig: 'MAA', dest: 'BOM', dep: 1140, turn: 55, pax: 148 },
  ]},
  // Tail 7: VT-AAG (BOM Base) - 4 legs
  { tail: 'VT-AAG', base: 'BOM', duty_start: 370, legs: [
    { orig: 'BOM', dest: 'MAA', dep: 420, turn: 0, pax: 160 },
    { orig: 'MAA', dest: 'BOM', dep: 590, turn: 55, pax: 158 },
    { orig: 'BOM', dest: 'DEL', dep: 760, turn: 55, pax: 172 },
    { orig: 'DEL', dest: 'BOM', dep: 950, turn: 60, pax: 169 },
  ]},
  // Tail 8: VT-AAH (DEL Base) - 4 legs
  { tail: 'VT-AAH', base: 'DEL', duty_start: 360, legs: [
    { orig: 'DEL', dest: 'HYD', dep: 405, turn: 0, pax: 165 },
    { orig: 'HYD', dest: 'BOM', dep: 590, turn: 50, pax: 159 },
    { orig: 'BOM', dest: 'DEL', dep: 730, turn: 55, pax: 174 },
    { orig: 'DEL', dest: 'LKO', dep: 920, turn: 60, pax: 145 },
  ]},
  // Tail 9: VT-AAI (BOM Base) - 4 legs
  { tail: 'VT-AAI', base: 'BOM', duty_start: 380, legs: [
    { orig: 'BOM', dest: 'GOI', dep: 430, turn: 0, pax: 164 },
    { orig: 'GOI', dest: 'BOM', dep: 545, turn: 50, pax: 162 },
    { orig: 'BOM', dest: 'DEL', dep: 665, turn: 55, pax: 170 },
    { orig: 'DEL', dest: 'PAT', dep: 850, turn: 55, pax: 150 },
  ]},
  // Tail 10: VT-AAJ (BLR Base) - 4 legs
  { tail: 'VT-AAJ', base: 'BLR', duty_start: 390, legs: [
    { orig: 'BLR', dest: 'HYD', dep: 440, turn: 0, pax: 150 },
    { orig: 'HYD', dest: 'BOM', dep: 555, turn: 50, pax: 162 },
    { orig: 'BOM', dest: 'BLR', dep: 690, turn: 50, pax: 165 },
    { orig: 'BLR', dest: 'TRV', dep: 840, turn: 50, pax: 140 },
  ]},
  // Tail 11: VT-AAK (BOM Base) - 4 legs
  { tail: 'VT-AAK', base: 'BOM', duty_start: 400, legs: [
    { orig: 'BOM', dest: 'COK', dep: 450, turn: 0, pax: 166 },
    { orig: 'COK', dest: 'BOM', dep: 615, turn: 55, pax: 163 },
    { orig: 'BOM', dest: 'JAI', dep: 780, turn: 55, pax: 154 },
    { orig: 'JAI', dest: 'BOM', dep: 925, turn: 50, pax: 152 },
  ]},
  // Tail 12: VT-AAL (DEL Base) - 4 legs
  { tail: 'VT-AAL', base: 'DEL', duty_start: 410, legs: [
    { orig: 'DEL', dest: 'AMD', dep: 460, turn: 0, pax: 160 },
    { orig: 'AMD', dest: 'DEL', dep: 600, turn: 50, pax: 158 },
    { orig: 'DEL', dest: 'BOM', dep: 745, turn: 55, pax: 175 },
    { orig: 'BOM', dest: 'PNQ', dep: 930, turn: 55, pax: 145 },
  ]},
  // Tail 13: VT-AAM (CCU Base) - 4 legs
  { tail: 'VT-AAM', base: 'CCU', duty_start: 370, legs: [
    { orig: 'CCU', dest: 'GAU', dep: 420, turn: 0, pax: 148 },
    { orig: 'GAU', dest: 'CCU', dep: 540, turn: 50, pax: 150 },
    { orig: 'CCU', dest: 'BOM', dep: 660, turn: 50, pax: 168 },
    { orig: 'BOM', dest: 'CCU', dep: 870, turn: 50, pax: 166 },
  ]},
  // Tail 14: VT-AAN (HYD Base) - 4 legs
  { tail: 'VT-AAN', base: 'HYD', duty_start: 380, legs: [
    { orig: 'HYD', dest: 'MAA', dep: 430, turn: 0, pax: 152 },
    { orig: 'MAA', dest: 'HYD', dep: 550, turn: 50, pax: 155 },
    { orig: 'HYD', dest: 'BOM', dep: 670, turn: 50, pax: 164 },
    { orig: 'BOM', dest: 'HYD', dep: 810, turn: 55, pax: 160 },
  ]},
  // Tail 15: VT-AAO (DEL Base) - 4 legs
  { tail: 'VT-AAO', base: 'DEL', duty_start: 390, legs: [
    { orig: 'DEL', dest: 'GAU', dep: 440, turn: 0, pax: 162 },
    { orig: 'GAU', dest: 'DEL', dep: 640, turn: 50, pax: 165 },
    { orig: 'DEL', dest: 'BOM', dep: 845, turn: 55, pax: 173 },
    { orig: 'BOM', dest: 'BLR', dep: 1030, turn: 55, pax: 158 },
  ]},
  // Tail 16: VT-AAP (BOM Base) - 4 legs
  { tail: 'VT-AAP', base: 'BOM', duty_start: 420, legs: [
    { orig: 'BOM', dest: 'PNQ', dep: 470, turn: 0, pax: 142 },
    { orig: 'PNQ', dest: 'BOM', dep: 570, turn: 50, pax: 146 },
    { orig: 'BOM', dest: 'DEL', dep: 675, turn: 55, pax: 175 },
    { orig: 'DEL', dest: 'BOM', dep: 860, turn: 55, pax: 170 },
  ]},
];

// Generate Flights and Crews
const flights = [];
const crews = [];
let flightNum = 101;

tailRotations.forEach((rot, tIdx) => {
  const crewFlights = [];
  let prevArr = null;

  rot.legs.forEach((leg, lIdx) => {
    const flight_id = `DS${flightNum++}`;
    const block_minutes = getBlock(leg.orig, leg.dest);
    const depMins = leg.dep;
    const arrMins = depMins + block_minutes;
    const turn_before = lIdx === 0 ? 0 : (depMins - prevArr);

    flights.push({
      flight_id,
      tail_id: rot.tail,
      leg_order: lIdx + 1,
      origin: leg.orig,
      destination: leg.dest,
      dep: toHHMM(depMins),
      arr: toHHMM(arrMins),
      block_minutes,
      pax: leg.pax,
      turnaround_before_min: turn_before,
    });

    crewFlights.push(flight_id);
    prevArr = arrMins;
  });

  const lastArrMins = prevArr;
  const dutyDuration = lastArrMins - rot.duty_start;
  // max_duty_mins is set between 660 and 720 mins (11 to 12 hours) so duty limits can trigger if delay exceeds ~90-150m
  const max_duty_mins = Math.max(660, dutyDuration + 105);

  crews.push({
    crew_id: `CRW-${rot.tail.replace('VT-', '')}`,
    tail_id: rot.tail,
    base: rot.base,
    duty_start: toHHMM(rot.duty_start),
    max_duty_mins,
    flight_ids: crewFlights,
  });
});

console.log(`Generated ${flights.length} flights across ${tailRotations.length} aircraft tails.`);

// Function to convert HH:MM to minutes
function toMins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Find candidate connections automatically
const potentialConns = [];
flights.forEach(fFrom => {
  flights.forEach(fTo => {
    if (fFrom.flight_id === fTo.flight_id) return;
    if (fFrom.tail_id === fTo.tail_id) return;
    if (fFrom.destination === fTo.origin) {
      const arr = toMins(fFrom.arr);
      const dep = toMins(fTo.dep);
      const diff = dep - arr;
      // Connect window between 45 and 150 mins
      if (diff >= 45 && diff <= 150) {
        potentialConns.push({
          airport: fFrom.destination,
          from_flight: fFrom.flight_id,
          to_flight: fTo.flight_id,
          diff,
          fFrom,
          fTo,
        });
      }
    }
  });
});

console.log(`Found ${potentialConns.length} potential connection pairs.`);

// Pick 21 diverse connections across BOM, DEL, BLR, HYD, CCU, etc.
// Prioritize connections touching BOM and DEL (crisis centers)
const selectedConns = [];
const airportCounts = {};

potentialConns.sort((a, b) => {
  // Prefer BOM and DEL
  const prioA = (a.airport === 'BOM' ? 3 : a.airport === 'DEL' ? 2 : 1);
  const prioB = (b.airport === 'BOM' ? 3 : b.airport === 'DEL' ? 2 : 1);
  if (prioA !== prioB) return prioB - prioA;
  return a.diff - b.diff;
});

const usedPairs = new Set();
for (const cand of potentialConns) {
  if (selectedConns.length >= 21) break;
  const pairKey = `${cand.from_flight}->${cand.to_flight}`;
  if (usedPairs.has(pairKey)) continue;

  const count = airportCounts[cand.airport] || 0;
  // Limit to at most 8 per airport to ensure geographical diversity
  if (count >= 8 && selectedConns.length < 18) continue;

  airportCounts[cand.airport] = count + 1;
  usedPairs.add(pairKey);
  const pax = Math.min(Math.floor(15 + Math.random() * 20), Math.min(cand.fFrom.pax, cand.fTo.pax) - 30);

  selectedConns.push({
    connection_id: `CN-${String(selectedConns.length + 1).padStart(3, '0')}`,
    airport: cand.airport,
    from_flight: cand.from_flight,
    to_flight: cand.to_flight,
    passengers: Math.max(12, pax),
    min_connect_minutes: 45,
  });
}

// Deterministic passenger counts so dataset is reproducible
const connections = [];
const fixedPax = [24, 18, 22, 19, 25, 17, 21, 16, 20, 23, 18, 26, 15, 22, 19, 21, 24, 18, 20, 16, 25];
selectedConns.forEach((c, i) => {
  c.passengers = fixedPax[i] || 20;
  connections.push(c);
});

console.log(`Selected ${connections.length} connections.`);

const dataset = {
  meta,
  airports,
  flights,
  connections,
  crews,
  spare_aircraft,
};

// Validate completely
const flightMap = new Map(flights.map(f => [f.flight_id, f]));
const airportMap = new Map(airports.map(a => [a.id, a]));

if (airports.length !== 16) throw new Error(`Expected 16 airports, got ${airports.length}`);
if (flights.length !== 70) throw new Error(`Expected 70 flights, got ${flights.length}`);
if (connections.length !== 21) throw new Error(`Expected 21 connections, got ${connections.length}`);
if (crews.length !== 16) throw new Error(`Expected 16 crews, got ${crews.length}`);
if (spare_aircraft.length !== 2) throw new Error(`Expected 2 spare aircraft, got ${spare_aircraft.length}`);

// Connections validation
connections.forEach(c => {
  const fFrom = flightMap.get(c.from_flight);
  const fTo = flightMap.get(c.to_flight);
  if (!fFrom || !fTo) throw new Error(`Connection ${c.connection_id} has invalid flights`);
  if (fFrom.destination !== c.airport || fTo.origin !== c.airport) {
    throw new Error(`Connection ${c.connection_id} airport mismatch`);
  }
  if (toMins(fTo.dep) < toMins(fFrom.arr) + c.min_connect_minutes) {
    throw new Error(`Connection ${c.connection_id} violates min_connect_minutes`);
  }
  if (c.passengers > fFrom.pax || c.passengers > fTo.pax) {
    throw new Error(`Connection ${c.connection_id} passengers exceed flight pax`);
  }
});

// Crew validation
crews.forEach(crw => {
  crw.flight_ids.forEach(fid => {
    const fl = flightMap.get(fid);
    if (!fl) throw new Error(`Crew ${crw.crew_id} has invalid flight ${fid}`);
    if (fl.tail_id !== crw.tail_id) {
      throw new Error(`Crew ${crw.crew_id} tail ${crw.tail_id} mismatch flight ${fid} tail ${fl.tail_id}`);
    }
  });
});

// Flight pax <= seats
flights.forEach(fl => {
  if (fl.pax > meta.aircraft_capacity) {
    throw new Error(`Flight ${fl.flight_id} pax exceeds capacity`);
  }
});

const outPath = path.resolve('public/data/flight_network.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`Saved validated flight network dataset to ${outPath}`);
