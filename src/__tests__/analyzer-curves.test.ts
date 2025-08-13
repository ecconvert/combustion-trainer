import { describe, expect, test } from 'vitest';
import { computeCombustion, OXYGEN_IN_AIR_FRACTION } from '../lib/chemistry.js';
import { FUELS } from '../lib/fuels.js';

function sample(fuelKey: keyof typeof FUELS, airFactor: number) {
  const fuel = FUELS[fuelKey];
  // Choose nominal flows; computeCombustion derives stoich via formula internally.
  const fuelFlow = 1; // arbitrary
  // Approximate stoich air using the same formula used in computeCombustion
  const { C, H, O } = fuel.formula;
  const O2_needed = fuelFlow * (C + H / 4 - O / 2);
  const airStoich = O2_needed / OXYGEN_IN_AIR_FRACTION;
  const airFlow = airStoich * airFactor;

  return computeCombustion({
    fuel,
    fuelFlow,
    airFlow,
    stackTempF: 350,
    ambientF: 70,
  });
}

describe.each(Object.keys(FUELS))('Analyzer curves vs excess air (%s)', (fuelKey) => {
  test('CO rises rich of stoich, O2 rises lean, CO2 peaks near stoich', () => {
    const rich = sample(fuelKey as keyof typeof FUELS, 0.8); // rich (less air)
    const stoich = sample(fuelKey as keyof typeof FUELS, 1.0);
    const lean = sample(fuelKey as keyof typeof FUELS, 1.2);

    // CO higher rich than lean
    expect(rich.CO_ppm).toBeGreaterThan(lean.CO_ppm);

    // O2 higher lean than rich
    expect(lean.O2_pct).toBeGreaterThan(rich.O2_pct);

    // CO2 near stoich is greater than either rich or lean neighbors
    expect(stoich.CO2_pct).toBeGreaterThan(rich.CO2_pct);
    expect(stoich.CO2_pct).toBeGreaterThan(lean.CO2_pct);
  });
});
