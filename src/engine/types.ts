export interface Airport {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  tier: number;
  capacity_per_hour: number;
}

export interface Flight {
  flight_id: string;
  tail_id: string;
  leg_order: number;
  origin: string;
  destination: string;
  dep: string; // HH:MM IST
  arr: string; // HH:MM IST
  block_minutes: number;
  pax: number;
  turnaround_before_min: number;
}

export interface Connection {
  connection_id: string;
  airport: string;
  from_flight: string;
  to_flight: string;
  passengers: number;
  min_connect_minutes: number;
}

export interface Crew {
  crew_id: string;
  tail_id: string;
  base: string;
  duty_start: string; // HH:MM IST
  max_duty_mins: number;
  flight_ids: string[];
}

export interface SpareAircraft {
  tail_id: string;
  base: string;
  available_from: string; // HH:MM IST
  seats: number;
}

export interface NetworkMeta {
  version: string;
  description: string;
  min_turnaround_minutes: number;
  timezone: string;
  aircraft_capacity: number;
  network_date: string;
}

export interface FlightNetworkData {
  meta: NetworkMeta;
  airports: Airport[];
  flights: Flight[];
  connections: Connection[];
  crews: Crew[];
  spare_aircraft: SpareAircraft[];
}

export interface Closure {
  airport: string;
  start: number; // minutes from 00:00
  end: number;   // minutes from 00:00
  reason?: string;
}

export interface DelayAttribution {
  closure_delay: number;
  restart_queue_delay: number;
  knock_on_delay: number;
  knock_on_root_flight?: string;
  crew_delay: number;
  slack_absorbed: number;
  total_arrival_delay: number;
}

export type FlightStatus = 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'OUT_OF_POSITION' | 'DIVERTED';

export interface SimulatedFlight {
  flight_id: string;
  tail_id: string;
  effective_tail_id: string;
  leg_order: number;
  origin: string;
  destination: string;
  scheduled_dep: number;
  scheduled_arr: number;
  actual_dep: number;
  actual_arr: number;
  dep_delay: number;
  arr_delay: number;
  status: FlightStatus;
  cancellation_reason?: string;
  pax: number;
  block_minutes: number;
  attribution: DelayAttribution;
  operating_crew_id: string;
  operating_crew_breached: boolean;
}

export interface ConnectionResult {
  connection_id: string;
  airport: string;
  from_flight: string;
  to_flight: string;
  passengers: number;
  min_connect_minutes: number;
  scheduled_connect_time: number;
  actual_connect_time: number;
  made: boolean;
  missed_reason?: string;
}

export interface NetworkMetrics {
  total_flights: number;
  operating_flights: number;
  delayed_flights: number; // arr_delay >= 15
  cancelled_flights: number;
  total_delay_minutes: number;
  stranded_passengers: number;
  connections_total: number;
  connections_made: number;
  connections_missed: number;
  crew_breaches: number;
  aircraft_utilisation_pct: number;
  shift_score: number;
}

export type ActionType = 'CANCEL_FLIGHT' | 'ASSIGN_SPARE' | 'SWAP_TAILS';

export interface RecoveryAction {
  id: string;
  type: ActionType;
  flight_id?: string;
  spare_tail_id?: string;
  swap_tail_1?: string;
  swap_tail_2?: string;
  swap_airport?: string;
  swap_time?: number;
  cost: number;
  title: string;
  description: string;
}

export interface ActionCandidate {
  action: RecoveryAction;
  projected_metrics: NetworkMetrics;
  delay_saved: number;
  stranded_saved: number;
  crew_breaches_resolved: number;
  net_score_delta: number;
}

export interface SimulationResult {
  flights: Record<string, SimulatedFlight>;
  connections: ConnectionResult[];
  metrics: NetworkMetrics;
  closure: Closure | null;
  actionsApplied: RecoveryAction[];
}
