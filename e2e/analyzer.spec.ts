import { test, expect } from '@playwright/test';
import { fastForwardToRunAuto, startAnalyzerSequence, saveAnalyzerReading, capture } from './utils';

test('analyzer: start, zero, insert probe, save reading', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Open technician drawer to access analyzer
  await page.locator("[data-tour='technician']").click();

  const ok = await fastForwardToRunAuto(page);
  expect(ok).toBeTruthy();

  await startAnalyzerSequence(page);
  await capture(page, 'analyzer-sampling');

  // Save a reading from the technician drawer and from readouts panel
  await saveAnalyzerReading(page);
  await capture(page, 'analyzer-after-save');

  // Verify flame signal is present in programmer panel as a proxy of RUN_AUTO state
  const programmerText = await page.locator("[data-tour='programmer']").innerText();
  expect(/RUN_AUTO/.test(programmerText)).toBeTruthy();
});
