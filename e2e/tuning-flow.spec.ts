import { test, expect } from '@playwright/test';
import { fastForwardToRunAuto, enableTuning, clickCam, saveCamPoint, capture } from './utils';

test('tuning: save 30% and 70% cam points', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const ok = await fastForwardToRunAuto(page);
  expect(ok).toBeTruthy();

  await enableTuning(page);

  // Navigate to 30%
  await clickCam(page, 30);
  await saveCamPoint(page);
  await capture(page, 'tuning-after-30');

  // Navigate to 70%
  await clickCam(page, 70);
  await saveCamPoint(page);
  await capture(page, 'tuning-after-70');

  // Confirm pills show saved points (cam-saved-pill appears for current positions)
  // Jump back to 30 and verify pill
  await clickCam(page, 30);
  await expect(page.locator('[data-testid="cam-saved-pill"]')).toBeVisible();
  await clickCam(page, 70);
  await expect(page.locator('[data-testid="cam-saved-pill"]')).toBeVisible();
});
