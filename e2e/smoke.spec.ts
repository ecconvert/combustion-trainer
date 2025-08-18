import { test, expect } from '@playwright/test';
import { capture } from './utils';

test('smoke: app loads and core panels visible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-tour="fuel"]')).toBeVisible();
  await expect(page.locator('[data-tour="power"]')).toBeVisible();
  await expect(page.locator('[data-tour="programmer"]')).toBeVisible();
  await capture(page, 'smoke-core');
});
