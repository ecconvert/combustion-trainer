import { test, expect } from "@playwright/test";

test("theme persists", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("btn-theme-toggle").click();
  await page.reload();
  const hasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  expect(hasDark).toBe(true);
});
