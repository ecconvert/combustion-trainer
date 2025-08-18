import { test, expect } from '@playwright/test';
import { startTour, waitForJoyrideStep, advanceJoyride, capture } from './utils';

test('tour fast-forward activates on programmer step and shows badge', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await startTour(page);
  await advanceJoyride(page);
  await advanceJoyride(page);
  await advanceJoyride(page);

  const hit = await waitForJoyrideStep(page, (text) => /Programmer \(EP160\)|Monitor the Programmer|Programmer/.test(text));
  expect(hit, 'Programmer step appeared').toBeTruthy();
  await capture(page, 'programmer-step');

  // Badge visible
  await expect(page.locator('[data-test="fast-forward-badge"]')).toBeVisible();
  const simSpeed = await page.evaluate(() => (window as any).getSimSpeed ? (window as any).getSimSpeed() : null);
  expect(simSpeed).toBe(8);
  await capture(page, 'fast-forward-full', true);

  // Advance one more step just to ensure tour continues
  await advanceJoyride(page);
});
