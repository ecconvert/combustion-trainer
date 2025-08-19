import { test, expect } from '@playwright/test';
import { startTour, waitForJoyrideStep, advanceJoyride, capture, fastForwardToRunAuto } from './utils';

test.setTimeout(120000);

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
  await fastForwardToRunAuto(page);

  // Ensure programmer is actually in RUN_AUTO and then wait for the badge to hide
  // and sim speed restore (allow generous time for UI to react).
  const isRunAuto = await page.evaluate(() => (window as any).getProgrammerState && (window as any).getProgrammerState() === 'RUN_AUTO');
  expect(isRunAuto, 'programmer reached RUN_AUTO').toBeTruthy();

  // Wait until badge hides and sim speed restored
  await expect(badge).toBeHidden();
  const restoredSpeed = await page.evaluate(() => (window as any).getSimSpeed && (window as any).getSimSpeed());
  expect(restoredSpeed).toBe(1);

  await capture(page, 'tour-ff-restored');
});
