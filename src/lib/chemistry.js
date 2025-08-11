import { clamp } from "./math";

export const OXYGEN_IN_AIR_PERCENT = 20.9;
export const OXYGEN_IN_AIR_FRACTION = OXYGEN_IN_AIR_PERCENT / 100;
export const NITROGEN_IN_AIR_FRACTION = 1 - OXYGEN_IN_AIR_FRACTION;

function coAirFree(co, o2) {
  return Math.round(co * (OXYGEN_IN_AIR_PERCENT / Math.max(0.1, OXYGEN_IN_AIR_PERCENT - o2)));
}

export function computeCombustion({ fuel, fuelFlow, airFlow, stackTempF, ambientF }) {
  const { C, H, O } = fuel.formula;
  const fuelMol = Math.max(0, fuelFlow);
  const airActual = Math.max(0.0001, airFlow);

  const O2_needed = fuelMol * (C + H / 4 - O / 2);
  const airStoich = O2_needed / OXYGEN_IN_AIR_FRACTION;
  const excessAir = airStoich > 0 ? airActual / airStoich : 0;

  const O2_in = OXYGEN_IN_AIR_FRACTION * airActual;
  const N2_in = NITROGEN_IN_AIR_FRACTION * airActual;

  const O2_for_H2O = fuelMol * (H / 4);
  const O2_after_H = Math.max(0, O2_in - O2_for_H2O);

  const carbon = fuelMol * C;
  let CO2 = 0;
  let CO = 0;
  let O2_left = 0;

  if (O2_after_H >= carbon) {
    CO2 = carbon;
    O2_left = O2_after_H - carbon;
  } else {
    CO2 = O2_after_H;
    CO = carbon - CO2;
    O2_left = 0;
  }

  const totalDry = CO2 + CO + O2_left + N2_in;
  const tiny = 1e-9;
  const O2_pct = clamp((O2_left / (totalDry + tiny)) * 100, 0, 20.9);
  const CO2_pct = clamp((CO2 / (totalDry + tiny)) * 100, 0, 20);
  const CO_ppm = clamp((CO / (totalDry + tiny)) * 1e6, 0, 40000);

  const ea = clamp(excessAir, 0.2, 3);
  const flameTempF =
    ambientF + 1800 * Math.exp(-Math.pow((ea - 1.1) / 0.35, 2)) + 400 * Math.tanh(fuelMol / 10);

  const burning = fuelMol > 0.05;

  const cp = 1.0;
  const flueFlow = airActual + fuelMol;
  const dT = stackTempF - ambientF;
  const fuelEnergyRate = fuelMol * 100;
  const stackLoss = clamp((flueFlow * cp * dT) / Math.max(1, fuelEnergyRate) / 1000, 0, 0.45);
  const unburnedLoss = clamp(CO_ppm / 40000, 0, 0.12);

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

  const efficiency = burning ? clamp(1 - stackLoss - unburnedLoss, 0.45, 0.995) : 0;

  const warnings = {
    soot: CO_ppm > 400,
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
