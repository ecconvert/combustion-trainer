import { test, expect } from "@playwright/test";

// TODO: Fix hanging E2E tests - see GitHub issue for details
test.skip("theme persists", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("btn-theme-toggle").click();
  await page.reload();
  const hasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  expect(hasDark).toBe(true);
});
