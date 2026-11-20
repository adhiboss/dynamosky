# Domino Sky — 3D Open-World Airline Network Crisis Simulator

**Domino Sky** is a complete, gamified 3D open-world airline operations and crisis simulation game built with **React Three Fiber, Rapier Physics, ecctrl, Zustand, and TypeScript**.

You step into the boots of an airline network controller walking freely around a procedural 3D international airport hub. When an emergency strikes, you climb the control tower, declare airspace closures (e.g. Mumbai Monsoon Cloudburst, 90 minutes), and watch real-time delay cascades ripple across India's 16-airport network. You investigate causal delay chains at the departure board, observe passenger crowds surging at boarding gates, and head to the Operations Centre where an autonomous AI dispatcher proposes tactical recovery actions (standby aircraft assignments, flight cancellations, tail swaps). Approve or reject recovery plans, observe the 3D world update in real-time, and earn your star rating!

---

## 2-Minute Quickstart Demo Path

Follow this exact operational flow to experience the full gameplay loop:

1. **Walk the Airport Apron (WASD & Mouse Look)**:
   - Use `W/A/S/D` to walk, `Shift` to sprint, and mouse to orbit the camera.
   - Walk toward the glowing cyan beacon at the **Control Tower** (`[0, 0, -28]`).
2. **Declare Airspace Closure (Press E)**:
   - When near the tower beacon, press **E** to open the Airspace Closure Console.
   - Click the preset **Mumbai Monsoon Cloudburst** (BOM, 90 min, 06:00–07:30 IST).
   - Notice the immediate cascade metrics: stranded passengers jump, total delay minutes climb, and shift score drops. Press **Esc** or click outside to close the panel.
3. **Inspect the 3D Hologram & Weather Shift**:
   - The sky turns dark, volumetric storm fog rolls in, rain pours over the BOM hub, and procedural thunder rolls.
   - The central 3D Network Hologram displays all 16 Indian airports with glowing flight arcs. Delayed flights glow amber/red, and aircraft held at BOM pause on the ground.
4. **Investigate Delay Chains at the Terminal Board**:
   - Walk to the **Terminal Flight Board** beacon (`[-35, 0, 27]`) and press **E**.
   - Click on delayed flight **DS101** or **DS102** to expand the **Causal Attribution Chain**.
   - Trace the exact domino effect: `[BOM Closure Hold +90m] → [Reopening Queue Hold +8m] → [Slack Absorbs -20m] → [Net Knock-on +78m]`. View affected passenger transfer connections.
5. **Report to Operations Centre & Approve AI Recovery Plan**:
   - Walk across the apron to the **Operations Centre** beacon (`[35, 0, 27]`) and press **E**.
   - Read the **AI Dispatcher Strategy Brief** bearing the green **✓ Verified by Engine (Zero AI Math)** badge.
   - Click **Approve Action** on `Assign Spare VT-SPR1 to DS101` and `Cancel Flight DS108`.
   - Hear the positive operational chime as metrics update instantly: stranded passengers drop dramatically, crew breaches clear, and your score rises!
6. **Review Mission Score & Stars**:
   - Click **Score & Stars** in the top HUD.
   - Compare your plan against **Par Target** and earn your **★★ / ★★★ Star Rating**!

---

## Key Gameplay Controls

| Action | Control |
|---|---|
| **Move** | `W`, `A`, `S`, `D` / Arrow Keys |
| **Sprint** | `Shift` (Left or Right) |
| **Jump** | `Space` |
| **Camera Orbit** | Mouse Look |
| **Interact with Station** | `E` |
| **Close Open Console** | `Esc` / Close Button |
| **Time Scrubber** | Bottom-right timeline HUD (Play, Pause, 1x/5x/30x speeds) |
| **Audio Mute/Unmute** | Top-right audio button |

---

## Architectural Principles & Technical Design

### 1. Zero AI Math Guarantee (`/src/engine`)
All operational metrics, delays, cancellations, turnaround slacks, passenger counts, and shift scores are calculated **strictly by deterministic pure TypeScript code** in `/src/engine`. The AI Dispatcher receives structured candidates from the engine and returns explanations containing double-brace placeholders (`{{stranded_before}}`, `{{stranded_after}}`, `{{delay_saved}}`, etc.).
- **Strict Validation**: The code rejects any AI response containing raw digits outside of placeholders, unknown placeholders, or non-existent action IDs.
- **Deterministic Offline Fallback**: If no AI API key is configured or network is unavailable, the dispatcher automatically executes a verified deterministic template so the demo functions 100% offline.

### 2. Delay Attribution Accounting
For every flight in the network, the engine decomposes the arrival delay into:
$$\text{Arrival Delay} = \text{Closure Delay} + \text{Restart Queue Delay} + (\text{Gross Knock-on Delay} - \text{Slack Absorbed}) + \text{Crew Limit Delay}$$
Every simulated flight is verified to ensure attribution parts sum exactly to total delay.

### 3. Stranded Passenger Accounting (No Double-Counting)
$$\text{Stranded Passengers} = \text{Pax on Cancelled Flights} + \text{Passengers on Missed Transfers (both flights operating)}$$
Passengers on cancelled flights are never counted a second time under missed connections.

### 4. Shift Score & Gamification
$$\text{Score} = \max\Big(0, 10000 - 10 \times \text{Stranded} - 1 \times \text{DelayMins} - 500 \times \text{CrewBreaches} - 150 \times \text{Cancellations} - \text{ActionCosts}\Big)$$
- **Par**: Score achieved by the engine's optimal greedy plan.
- **★ 1 Star**: Any plan that beats doing nothing ($> \text{baseline}$).
- **★★ 2 Stars**: Plan score within 10% of Par ($\ge 0.9 \times \text{Par}$).
- **★★★ 3 Stars**: Plan score matching or beating Par ($\ge \text{Par}$).

### 5. Procedural Graphics & Synthesized Audio
- Built with React Three Fiber, Rapier physics, and `ecctrl` third-person character controller.
- Procedural low-poly airliners, terminal buildings, control tower, hangars, and ground baggage tugs.
- Procedural Web Audio API sound generator produces airport 2-tone chimes, thunder rumbles, and positive operational confirmation tones without external audio file dependencies.

---

## Project Structure

```
promptwars/
├── ASSUMPTIONS.md                # Recorded engineering choices and operational rules
├── CREDITS.md                    # Attributions and MIT license notices
├── README.md                     # Architecture, setup guide, and 2-minute demo path
├── index.html                    # Application entry point
├── package.json                  # Dependencies: R3F, Rapier, ecctrl, vitest, etc.
├── vite.config.ts                # Vite dev server + AI dispatcher proxy plugin
├── public/
│   └── data/
│       └── flight_network.json   # 16 airports, 70 flights, 21 connections, 16 crews, 2 spares
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # Top-level scene, canvas, physics, HUD, and station router
│   ├── index.css
│   ├── engine/                   # Pure TypeScript simulation engine (no React/Three imports)
│   │   ├── types.ts              # Data contracts and metric schemas
│   │   ├── time.ts               # Minute conversions and arithmetic
│   │   ├── validator.ts          # Dataset invariant validator
│   │   ├── simulation.ts         # Core deterministic delay & cancellation engine
│   │   ├── recovery.ts           # Candidate generation and ranking search
│   │   ├── dispatcherValidator.ts# AI placeholder validation & offline fallback
│   │   ├── worstDay.ts           # Precomputed Worst Day crisis leaderboard
│   │   ├── scoring.ts            # Score and star rating calculation
│   │   └── __tests__/            # Vitest unit test suite (10 comprehensive tests)
│   ├── components/
│   │   ├── character/            # Controller player avatar and ecctrl wrapper
│   │   ├── world/                # Airport buildings, runway, parked planes, vehicles, weather, crowds
│   │   ├── hologram/             # 3D Network Hologram with flight arcs and moving aircraft
│   │   ├── modals/               # Tower, Departure Board, Ops Center, Gates, Hangar, Score views
│   │   └── ui/                   # GameHUD overlay and TimeScrubberHUD
│   ├── services/                 # Web Audio synthesis and AI proxy client
│   └── store/                    # Zustand gameStore and simulationStore
```

---

## Development & Testing

### Install Dependencies
```bash
npm install
```

### Run Unit Tests
```bash
npm test
```
All 10 unit tests verify dataset validation, Mumbai 90m hand-computed case, delay attribution sum invariants, no double-counting of stranded passengers, determinism, AI placeholder validation, and star evaluations.

### Launch Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```
Type checks and bundles production assets with Vite.
