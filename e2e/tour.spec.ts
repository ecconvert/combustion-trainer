import { test, expect } from '@playwright/test';

// TODO: Fix hanging E2E tests - see GitHub issue for details
test.describe.skip('Onboarding Tour', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show tour on first visit', async ({ page }) => {
    // Wait for the tour to start
    await expect(page.locator('[data-testid="joyride-step"]').or(page.locator('.react-joyride__tooltip'))).toBeVisible({ timeout: 5000 });
  });

  test('should progress through tour steps', async ({ page }) => {
    // Wait for first step
    const tooltip = page.locator('.react-joyride__tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    // Check first step content
    await expect(tooltip.locator('text=Welcome')).toBeVisible();
    
    // Click Next and verify we move to next step
    await page.locator('button:has-text("Next")').click();
    
    // Should highlight fuel selector
    await expect(page.locator('[data-tour="fuel"]')).toBeVisible();
    
    // Continue a few more steps
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('[data-tour="power"]')).toBeVisible();
    
    await page.locator('button:has-text("Next")').click();  
    await expect(page.locator('[data-tour="firing-rate"]')).toBeVisible();
  });

  test('should complete tour and mark as done', async ({ page }) => {
    // Wait for tour to start
    await expect(page.locator('.react-joyride__tooltip')).toBeVisible({ timeout: 5000 });
    
    // Skip the tour
    await page.locator('button:has-text("Skip")').click();
    
    // Check that tutorial is marked as done in localStorage
    const tutorialState = await page.evaluate(() => {
      const config = JSON.parse(localStorage.getItem('app_config_v1') || '{}');
      return config.tutorial;
    });
    
    expect(tutorialState).toEqual({ done: true, version: 1 });
  });

  test('should not show tour on subsequent visits', async ({ page }) => {
    // First visit - complete tour
    await expect(page.locator('.react-joyride__tooltip')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Skip")').click();
    
    // Reload page
    await page.reload();
    
    // Tour should not appear
    await expect(page.locator('.react-joyride__tooltip')).not.toBeVisible({ timeout: 3000 });
  });

  test('should restart tour via Settings', async ({ page }) => {
    // Complete initial tour
    await expect(page.locator('.react-joyride__tooltip')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Skip")').click();
    
    // Open technician drawer
    await page.locator('button:has-text("Technician")').click();
    
    // Open settings
    await page.locator('[data-tour="settings"]').click();
    
    // Click Start Tour
    await page.locator('button:has-text("Start Tour")').click();
    
    // Tour should restart
    await expect(page.locator('.react-joyride__tooltip')).toBeVisible({ timeout: 3000 });
  });
});
