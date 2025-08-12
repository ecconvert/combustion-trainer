# Combustion Trainer

Interactive classroom simulator for boiler combustion, tuning, and analyzer basics. Built with **React + Vite**, styled with **Tailwind**, and using **Recharts** for live trends.

> **Educational tool** — values and behaviors are simplified to teach concepts. Not intended for field calibration.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node)

## Setup and run

Install dependencies and start the development server:

```bash
npm i
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

Build & preview production:
```bash
npm run build
npm run preview
```

## Development notes

Preview deployments opened through Vercel's Live collaboration overlay may log a
cross-origin frame warning in the browser console. This message is harmless and
goes away when the overlay is disabled or when running the app locally with
`npm run dev`.

## What it simulates

- **Fuel/Air mixing & excess air**  
  Stoichiometric O₂ demand from simple fuel chemistry (CH₄, C₃H₈, #2 Oil, Biodiesel). Outputs **O₂ %**, **CO₂ %**, **CO (ppm)** and **CO air‑free**.
- **Ignition & safety sequence (EP‑style)**  
  OFF → PREPURGE → PTFI → MTFI → RUN_AUTO → POSTPURGE / LOCKOUT. Includes spark, pilot, main flame, FFRT, and EA‑window blowout.
- **Stack temperature & efficiency**  
  Proxy heat balance with stack loss + unburned penalty → **efficiency %** and **NOx** trends.
- **Rheostat / firing rate**  
  0–100% drive tied to fuel/air. Auto ramp‑down on shutdown/lockout for realism.
- **Tuning Mode with cam points**  
  Save **Fuel & Air** at 0–100% (10% steps). Recall via buttons or rheostat. Clear points individually.
- **Upstream regulator (single value)**  
  One pressure input (gas: **in. w.c.**, oil: **psi**) scales the **derived min/max fuel flow** by √pressure and bounds the fuel slider.
- **Analyzer UI**  
  Sensor lag emulation, HOLD/RESUME, **Save Reading**, and CSV export.
- **Trends**  
  Live O₂/CO/NOx/StackF/Eff chart with CSV export.
- **Troubleshooting scenarios**  
  Low air / hot stack, high draft / cold stack, dirty nozzles, biodiesel blend, and reset.

## Example usage

### 1) Pick a fuel
Choose **Natural Gas**, **Propane**, **Fuel Oil #2**, or **Biodiesel**. The UI shows HHV and typical O₂/CO‑AF targets.

### 2) Boiler power & rheostat
- Turn **Boiler Power → On**.
- Set **Firing Rate** (0–100%). If no cam point exists at that interval, fuel follows a linear map within **Derived Min/Max**; air targets ~1.2 EA.

### 3) Regulator (single value)
- Gas: set **Manifold pressure** in **in. w.c.** (NG ≈ 3.5, LP ≈ 10–11).
- Oil: set **Pump pressure** in **psi** (nozzle rated at 100 psi).  
This single value **scales both Derived Min and Derived Max fuel** by √pressure and clamps the fuel slider bounds.

> The regulator is typically set during startup, but you can adjust it anytime to simulate drift/wear.

### 4) Tuning Mode (save the cam)
- Turn **Tuning Mode → On**. Adjust **Fuel**/**Air** to hit targets.  
- Click a **cam button** (0–100%) then **Set** to store that point; **Clear** removes it.  
- With Tuning **off**, moving the rheostat recalls saved points automatically (or falls back to the linear map).

### 5) Analyzer
- **Start / Zero → Ready → Insert Probe** to sample.
- **Hold/Resume**, then **Save Reading** to log a snapshot.
- Export **Saved Readings** and the **Trend CSV** from the header.

## Under the hood

- **Chemistry:** O₂ need = C + H/4 − O/2 (dry basis for flue gas).  
- **CO air‑free:** classic 20.9/(20.9 − O₂) correction.  
- **Flame / NOx / Efficiency:** smooth proxies vs. excess air and heat loss.  
- **EP‑style state machine:** timing, FFRT, EA blowout window.

## Project structure

```
root
├─ public/            # static assets
├─ src/
│  ├─ App.jsx         # main simulator UI & logic (single file)
│  ├─ index.css       # Tailwind entry
│  └─ main.jsx        # app bootstrap
├─ index.html         # Vite entry
├─ package.json
└─ tailwind.config.js
```

## Scripts

- `npm run dev` — start dev server  
- `npm run build` — production build  
- `npm run preview` — preview the built app

## Settings

Open **Settings** from the gear icon in the header or the Technician drawer.
Sections include:

- **General** — theme, default view, and trend history length.
- **Analyzer** — sampling interval and reminders.
- **Units** — choose imperial or metric display units.
- **Ambient** — placeholders for live ambient data providers.
- **Data and privacy** — note that CSV export and import buttons will move here later.

Changes persist to `localStorage` under the `app_config_v1` key. Use
**Restore defaults** within a section to reset just that section's values.

## Notes & limitations

- This is an **instructional** model; values are tuned for trends/intuition, not absolute accuracy.
- The single regulator value **sets the available fuel range** (derived min/max) and the sliders respect those bounds.
- Saved cam points store the **exact Fuel/Air** you set at that position.

## Roadmap (ideas)

- More scenarios (draft faults, fouled HX, sensor failures)
- Persist cam maps per fuel in localStorage
- Add draft input and effect on stack losses

