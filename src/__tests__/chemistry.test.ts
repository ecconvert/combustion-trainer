import { describe, expect, test } from 'vitest';
import { computeCombustion } from '../lib/chemistry';
import { FUELS } from '../lib/fuels';

describe('computeCombustion with draft', () => {
    const baseParams = {
        fuel: FUELS['Natural Gas'],
        fuelFlow: 10,
        airFlow: 120,
        stackTempF: 350,
        ambientF: 70,
    };

    test('should decrease efficiency with higher (more negative) draft', () => {
        const result_normal_draft = computeCombustion({ ...baseParams, draft: -0.05 });
        const result_high_draft = computeCombustion({ ...baseParams, draft: -0.15 });

        // This will fail until draft is implemented, as efficiencies will be equal.
        expect(result_high_draft.efficiency).toBeLessThan(result_normal_draft.efficiency);
    });
});
