/**
 * Cam map helpers for the tuning system.
 *
 * Relies on basic math helpers and combustion constants to build a
 * "safe" default cam map for each fuel. This map specifies the target
 * fuel and air flow at 10% increments of the firing rate.
 */
import { clamp, lerp } from "./math";
import { OXYGEN_IN_AIR_FRACTION } from "./chemistry";

/**
 * Default excess-air profiles used when generating a cam map.
 * Values represent the desired excess-air ratio at 0–100% load.
 */
export const EXCESS_AIR_PROFILES = {
  "Natural Gas": [0, 1.4, 1.35, 1.32, 1.29, 1.26, 1.24, 1.23, 1.22, 1.21, 1.2],
  Propane: [0, 1.4, 1.35, 1.32, 1.29, 1.26, 1.24, 1.23, 1.22, 1.21, 1.2],
  "Fuel Oil #2": [0, 1.45, 1.4, 1.35, 1.32, 1.3, 1.28, 1.26, 1.24, 1.22, 1.2],
  Biodiesel: [0, 1.45, 1.4, 1.35, 1.32, 1.3, 1.28, 1.26, 1.24, 1.22, 1.2],
};

/**
 * Build a safe default cam map covering 0–100% firing rate.
 *
 * The function computes a baseline fuel flow between `minFuel` and
 * `maxFuel` and then calculates the required combustion air using the
 * stoichiometric formula `O2_needed = C + H/4 - O/2` (dry basis) and a
 * predefined excess-air profile.
 *
 * @param {Object} fuel - Fuel definition including elemental formula.
 * @param {number} minFuel - Minimum fuel flow allowed.
 * @param {number} maxFuel - Maximum fuel flow allowed.
 * @returns {Object} Mapping of cam positions to fuel and air flows.
 */
export function buildSafeCamMap(fuel, minFuel, maxFuel) {
  const { C, H, O } = fuel.formula;
  const profile = EXCESS_AIR_PROFILES[fuel.key] || EXCESS_AIR_PROFILES["Natural Gas"];
  const map = {};

  // Step through 0–100% firing rate in 10% increments
  for (let pct = 0; pct <= 100; pct += 10) {
    // 0% always forces both flows to zero
    if (pct === 0) {
      map[pct] = { fuel: 0, air: 0 };
      continue;
    }

    // Convert percentage to interpolation factor (0 at 10%, 1 at 100%)
    const t = (pct - 10) / 90;
    const fuelFlow = clamp(lerp(minFuel, maxFuel, t), minFuel, maxFuel);

    // Use classic O2 requirement formula: O2 = C + H/4 − O/2
    const O2_needed = fuelFlow * (C + H / 4 - O / 2);

    // Convert oxygen requirement to actual air requirement at 20.9% O2
    const airStoich = O2_needed / OXYGEN_IN_AIR_FRACTION;

    // Apply an excess-air multiplier based on firing rate profile
    const ea = profile[pct / 10] ?? 1.2;
    const airFlow = airStoich * ea;

    map[pct] = {
      fuel: Number(fuelFlow.toFixed(2)),
      air: Number(airFlow.toFixed(2)),
    };
  }

  return map;
}
