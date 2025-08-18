/**
 * Core combustion chemistry calculations.
 *
 * This module exposes functions and constants that model basic
 * stoichiometric relationships for hydrocarbon fuels. It depends only
 * on the small math helper library.
 */
import { clamp } from "./math";

/**
 * Percentage of oxygen present in ambient air. Used for converting
 * between oxygen mass/volume and actual air flow.
 */
export const OXYGEN_IN_AIR_PERCENT = 20.9;
/** Fractional oxygen concentration in air (0–1). */
export const OXYGEN_IN_AIR_FRACTION = OXYGEN_IN_AIR_PERCENT / 100;
/** Fractional nitrogen concentration, assuming only O₂ and N₂. */
export const NITROGEN_IN_AIR_FRACTION = 1 - OXYGEN_IN_AIR_FRACTION;

/**
 * Convert measured CO to an "air free" value.
 *
 * The classic 20.9/(20.9 − O₂) correction removes dilution effects so
 * readings from different excess-air levels can be compared.
 * @param {number} co - Measured CO in ppm.
 * @param {number} o2 - Measured O₂ percentage.
 * @returns {number} Air-free CO in ppm.
 */
function coAirFree(co, o2) {
  return Math.round(co * (OXYGEN_IN_AIR_PERCENT / Math.max(0.1, OXYGEN_IN_AIR_PERCENT - o2)));
}

/**
 * Compute flue-gas composition and auxiliary values from fuel/air inputs.
 *
 * Uses simple conservation-of-mass for C/H/O atoms and a few empirical
 * correlations to approximate flame temperature, efficiency and NOx.
 * The formulas are intentionally simplified for instructional purposes.
 *
 * @param {Object} params - Input parameters.
 * @param {Object} params.fuel - Fuel definition with elemental formula.
 * @param {number} params.fuelFlow - Moles of fuel per minute.
 * @param {number} params.airFlow - Moles of air per minute.
 * @param {number} params.stackTempF - Stack temperature in °F.
 * @param {number} params.ambientF - Ambient temperature in °F.
 * @returns {Object} Calculated gas readings and warnings.
 */
export function computeCombustion({ fuel, fuelFlow, airFlow, stackTempF, ambientF, draft = 0 }) {
  const { C, H, O } = fuel.formula;
  const fuelMol = Math.max(0, fuelFlow);
  const airActual = Math.max(0.0001, airFlow);

  // Required oxygen based on C/H/O balance (dry basis for flue gas)
  const O2_needed = fuelMol * (C + H / 4 - O / 2);
  // Convert oxygen requirement to stoichiometric air using 20.9% O₂
  const airStoich = O2_needed / OXYGEN_IN_AIR_FRACTION;
  const excessAir = airStoich > 0 ? airActual / airStoich : 0;

  // Break total incoming air into O₂ and N₂ portions
  const O2_in = OXYGEN_IN_AIR_FRACTION * airActual;
  const N2_in = NITROGEN_IN_AIR_FRACTION * airActual;

  // Hydrogen consumes half an O₂ molecule per H₂O produced
  const O2_for_H2O = fuelMol * (H / 4);
  const O2_after_H = Math.max(0, O2_in - O2_for_H2O);

  // Carbon reacts to CO₂ if oxygen is available, otherwise to CO
  const carbon = fuelMol * C;
  let CO2 = 0;
  let CO = 0;
  let O2_left = 0;

  if (O2_after_H >= carbon) {
    CO2 = carbon; // all carbon fully oxidized
    O2_left = O2_after_H - carbon; // leftover oxygen exits stack
  } else {
    CO2 = O2_after_H; // oxygen limits CO₂ production
    CO = carbon - CO2; // remaining carbon becomes CO
    O2_left = 0;
  }

  // Convert molar amounts to flue-gas percentages
  const totalDry = CO2 + CO + O2_left + N2_in;
  const tiny = 1e-9; // prevent divide-by-zero
  const O2_pct = clamp((O2_left / (totalDry + tiny)) * 100, 0, 20.9);
  const CO2_pct = clamp((CO2 / (totalDry + tiny)) * 100, 0, 20);
  const CO_ppm = clamp((CO / (totalDry + tiny)) * 1e6, 0, 40000);

  // Estimate flame temperature: base ambient + bell curve vs excess air
  const ea = clamp(excessAir, 0.2, 3);
  const flameTempF =
    ambientF + 1800 * Math.exp(-Math.pow((ea - 1.1) / 0.35, 2)) + 400 * Math.tanh(fuelMol / 10);

  const burning = fuelMol > 0.05;

  // Simple heat balance to estimate stack loss and efficiency
  const cp = 1.0; // specific heat placeholder
  const flueFlow = airActual + fuelMol;
  const dT = stackTempF - ambientF;
  const fuelEnergyRate = fuelMol * 100; // arbitrary scaling to keep numbers reasonable
  const stackLoss = clamp((flueFlow * cp * dT) / Math.max(1, fuelEnergyRate) / 1000, 0, 0.45);
  const unburnedLoss = clamp(CO_ppm / 40000, 0, 0.12);

  // Empirical NOx curve vs flame temperature and excess air
  const kT = 6;
  const NOx_ppm = burning
    ? clamp(
        kT *
          Math.exp((flameTempF - 1400) / 300) *
          clamp(1 + 0.5 * (ea - 1), 0.2, 1.8),
        0,
        2000,
      )
    : 0;

  // Net efficiency after subtracting stack and unburned losses
  const efficiency = burning ? clamp(1 - stackLoss - unburnedLoss, 0.45, 0.995) : 0;

  const warnings = {
    soot: CO_ppm > 400, // high CO suggests incomplete combustion
    overTemp: stackTempF > 500,
    underTemp: stackTempF < 180,
  };

  const CO_airfree = coAirFree(CO_ppm, O2_pct);

  return {
    O2_pct: Number(O2_pct.toFixed(2)),
    CO2_pct: Number(CO2_pct.toFixed(2)),
    CO_ppm: Math.round(CO_ppm),
    CO_airfree,
    NOx_ppm: Math.round(NOx_ppm),
    stackTempF: Math.round(stackTempF),
    excessAir: Number(excessAir.toFixed(2)),
    efficiency: Number((efficiency * 100).toFixed(1)),
    flameTempF: Math.round(flameTempF),
    warnings,
  };
}
