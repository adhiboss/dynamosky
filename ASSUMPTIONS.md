# Engineering Assumptions & Design Decisions

This document records the architectural choices and operational assumptions made during the design and development of **Domino Sky**.

## 1. Airport Closures & Network Operations
1. **Hold on the Ground**: When an airport is closed, inbound flights hold on the ground at their origin airport rather than diverting in flight, or hold en route until the destination reopens. The actual departure is held such that `actual_arr >= closure_end`.
2. **Shared Capacity for Arrivals and Departures**: After an airport closure ends, movements (both arrivals and departures) share the single runway capacity (`capacity_per_hour`). Movements are served in order of earliest-ready time, with ties broken deterministically by `flight_id`. Spacing between consecutive movements is `60 / capacity_per_hour` minutes.
3. **Turnaround & Slack**: Every aircraft turn requires at least `meta.min_turnaround_minutes = 30`. Any scheduled turnaround time exceeding 30 minutes acts as natural schedule slack that absorbs upstream delay.
4. **Cancellation Cascades**: A flight is cancelled if:
   - It is explicitly cancelled by the controller/dispatcher.
   - Its operating crew's duty would exceed `max_duty_mins` (duty calculated from `duty_start` to the actual arrival of their last scheduled flight).
   - Its delay equals or exceeds `cancellation_delay_threshold` (default 300 minutes).
   When a flight is cancelled, the aircraft remains physically at the departure airport. Any subsequent flight scheduled on that tail whose scheduled origin does not match the aircraft's physical location is cancelled as "out of position" until the tail's schedule aligns with where the aircraft actually is.

## 2. Passengers & Connections
1. **Stranded Passengers**: Total stranded passengers equals the sum of passengers on cancelled flights plus passengers on missed connections. If a flight is cancelled, its passengers are already accounted for as stranded; passengers connecting to or from that cancelled flight are NOT counted a second time.
2. **Connection Criterion**: A connection is made if and only if both the inbound and outbound flights operate and `to_flight.actual_dep >= from_flight.actual_arr + min_connect_minutes`.

## 3. Recovery Operations & Resources
1. **Spare Aircraft**: A spare aircraft can take over a delayed or cancelled flight (and the remaining chain of that tail) if and only if it is stationed at the flight's origin airport and `spare.available_from <= departure_time`.
2. **Spare Crew**: When a spare aircraft is dispatched, it comes with a fresh replacement crew whose duty window starts 45 minutes prior to departure (`duty_start = departure - 45`) with a maximum duty time of 600 minutes (10 hours).
3. **Aircraft Swaps**: Tail swaps are evaluated only at shared airports where both aircraft are present at the swap window, with valid passenger capacity and crew duty limits.

## 4. AI Dispatcher Architecture
1. **Zero Math Guarantee**: The AI model is strictly prohibited from performing any arithmetic or producing numbers. All simulation numbers originate exclusively in `/src/engine`.
2. **Placeholders**: The AI prompt requires responses using templated tokens (e.g., `{{stranded_before}}`, `{{stranded_after}}`, `{{delay_saved}}`). The application code validates and hydrates these placeholders with verified engine outputs.
3. **Validation & Fallback**: Any AI response containing unescaped digits outside placeholders, invalid action IDs, or unknown tokens is rejected and retried up to 2 times, after which the system cleanly falls back to deterministic template generation so that gameplay continues seamlessly offline or without an API key.

## 5. 3D Interaction & User Experience
1. **Open World Immersion**: The 3D world is the primary viewport. Menus and analytical screens do not appear as full-page overlays unless the player walks to a specific terminal station (Control Tower, Gate, Departure Board, Hangar, Operations Center) and presses **E**.
2. **Fast Travel & Multi-Airport Inspection**: The 3D network hologram lets the player inspect all 16 airports in the Indian network and switch stations to view local boards and ground operations.
