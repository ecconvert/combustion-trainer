import { clamp, lerp } from "./math";

export const EXCESS_AIR_PROFILES = {
  "Natural Gas": [0, 1.4, 1.35, 1.32, 1.29, 1.26, 1.24, 1.23, 1.22, 1.21, 1.2],
  Propane: [0, 1.4, 1.35, 1.32, 1.29, 1.26, 1.24, 1.23, 1.22, 1.21, 1.2],
  "Fuel Oil #2": [0, 1.45, 1.4, 1.35, 1.32, 1.3, 1.28, 1.26, 1.24, 1.22, 1.2],
  Biodiesel: [0, 1.45, 1.4, 1.35, 1.32, 1.3, 1.28, 1.26, 1.24, 1.22, 1.2],
};

export function buildSafeCamMap(fuel, minFuel, maxFuel) {
  const { C, H, O } = fuel.formula;
  const profile = EXCESS_AIR_PROFILES[fuel.key] || EXCESS_AIR_PROFILES["Natural Gas"];
  const map = {};

  for (let pct = 0; pct <= 100; pct += 10) {
    if (pct === 0) {
      map[pct] = { fuel: 0, air: 0 };
      continue;
    }
    const t = (pct - 10) / 90; // 0 at 10%, 1 at 100%
    const fuelFlow = clamp(lerp(minFuel, maxFuel, t), minFuel, maxFuel);
    const O2_needed = fuelFlow * (C + H / 4 - O / 2);
    const airStoich = O2_needed / 0.21;
    const ea = profile[pct / 10] ?? 1.2;
    const airFlow = airStoich * ea;
    map[pct] = {
      fuel: Number(fuelFlow.toFixed(2)),
      air: Number(airFlow.toFixed(2)),
    };
  }

  return map;
}
