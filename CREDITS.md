# Credits & Licenses

This document lists all libraries, references, and borrowed ideas used in **Domino Sky**, along with their licenses and attributions.

## 1. Libraries and Packages (via npm)

- **ecctrl** (v2.0.2)
  - Author: Erdong Chen
  - License: MIT License (Copyright (c) 2023-2026 Erdong Chen)
  - Usage: Third-person character controller and camera follow system. Installed as an npm dependency.
  - Repository: https://github.com/pmndrs/ecctrl

- **@react-three/fiber** & **@react-three/drei**
  - Author: Poimandres (pmndrs)
  - License: MIT License
  - Usage: Declarative Three.js scene graph in React, camera controls, keyboard mappings, text rendering, HTML overlays.

- **@react-three/rapier** & **@dimforge/rapier3d-compat**
  - Author: Poimandres / Dimforge
  - License: Apache-2.0 / MIT
  - Usage: 3D rigid body physics simulation.

- **three**
  - Author: Ricardo Cabello (Mr.doob) and Three.js authors
  - License: MIT License
  - Usage: 3D WebGL rendering engine, geometries, materials, vector math.

- **zustand**
  - Author: Poimandres
  - License: MIT License
  - Usage: Lightweight client-side reactive state management.

- **lucide-react**
  - Author: Lucide Project
  - License: ISC License
  - Usage: Clean icons for UI buttons, status indicators, and badges.

- **vitest**
  - Author: Vitest team
  - License: MIT License
  - Usage: Fast unit testing framework for the pure TypeScript simulation engine.

## 2. Borrowed Concepts & Architectures

- **source-drone-world**
  - Author: Edwin Johannes
  - License: MIT License (Copyright (c) 2026 Edwin Johannes)
  - Usage: Architectural patterns for procedural weather (rain particle fields, wind vectors, fog distance transitions, procedural thunder lightning flash) and Web Audio API synthesized procedural sound effects (thunder and ambient audio). Reimplemented cleanly in React Three Fiber.
  - Repository: https://github.com/stateloop-connected/source-drone-world

- **Three.js Flight Tracker & ATC concepts**
  - Reference only: 3D flight arc spline visualization concepts (calculating Great-circle arcs between latitude/longitude points elevated above a ground/map surface) and airport departure board delay cause chains. No code copied.
