import { test, expect } from '@playwright/test';
import { startTour, waitForJoyrideStep, advanceJoyride, capture, fastForwardToRunAuto } from './utils';

test('tour fast-forward auto-restores when programmer reaches RUN_AUTO', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Ensure first-visit behavior so the tour splash appears deterministically
  await page.evaluate(() => localStorage.removeItem('app_config_v1'));
  await page.reload();
  // Start the guided tour (via splash or global helper)
  await startTour(page);

  // Wait for initial Welcome tooltip to confirm the tour started
  await waitForJoyrideStep(page, (t) => /Welcome to Combustion Trainer|Welcome/.test(t), 20, 200);

  // Wait for the programmer step tooltip which triggers fast-forward.
  // If Joyride doesn't automatically reach it, advance step-by-step until it does.
  let step = null;
  for (let i = 0; i < 20; i++) {
    step = await waitForJoyrideStep(page, (t) => /Programmer|EP160|Monitor the Programmer/.test(t), 1, 200);
    if (step) break;
    await advanceJoyride(page);
    await page.waitForTimeout(150);
  }
  expect(step).toBeTruthy();

  // Badge should be visible and sim speed set to multiplier
  const badge = page.locator('[data-test="fast-forward-badge"]');
  await expect(badge).toBeVisible();
  const speed = await page.evaluate(() => (window as any).getSimSpeed && (window as any).getSimSpeed());
  expect(speed).toBeGreaterThan(1);
  await capture(page, 'tour-ff-badge');

  // Drive the programmer to RUN_AUTO using UI advance button
  const reached = await fastForwardToRunAuto(page);
  expect(reached, 'reached RUN_AUTO').toBeTruthy();

  // Wait until badge hides and sim speed restored (polling to avoid flakiness)
  let hidden = false;
  for (let i = 0; i < 40; i++) {
    const count = await badge.count();
    const restored = await page.evaluate(() => (window as any).getSimSpeed && (window as any).getSimSpeed());
    if (count === 0 && restored === 1) { hidden = true; break; }
    await page.waitForTimeout(150);
  }
  expect(hidden, 'badge hidden and speed restored').toBeTruthy();
  await capture(page, 'tour-ff-restored');
});
