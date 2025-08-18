import { test, expect } from '@playwright/test';
import { capture } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.readyState === 'complete');
});

test('new: app has correct title', async ({ page }) => {
  await expect(page).toHaveTitle(/Vite \+ React/);
});

test('new: boiler power on sequence', async ({ page }) => {
  await page.locator('button[data-tour="power-button"]').click();
  await expect(page.locator('[data-tour="programmer"]')).toContainText('PREPURGE');
  await capture(page, 'new-power-on');
});

test('new: change fuel type', async ({ page }) => {
  await page.screenshot({ path: 'e2e/screenshots/before-fuel-change.png' });
  await page.locator('button:has-text("Natural Gas")').click();
  await page.locator('button:has-text("Propane")').click();
  await expect(page.locator('[data-tour="fuel"]')).toContainText('Propane');
  await capture(page, 'new-fuel-change');
});

test('new: change firing rate', async ({ page }) => {
  await page.screenshot({ path: 'e2e/screenshots/before-firing-rate-change.png' });
  await page.locator('input[type="range"]').fill('50');
  await expect(page.locator('[data-tour="firing-rate-display"]')).toHaveText('50%');
  await capture(page, 'new-firing-rate');
});
