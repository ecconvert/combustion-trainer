import { Page, expect } from '@playwright/test';

// Start the guided tour via splash button or global helper
export async function startTour(page: Page) {
  const startBtn = page.locator('button:has-text("Start Guided Tour")');
  if (await startBtn.count()) {
    await startBtn.click();
  } else {
    await page.evaluate(() => (window as any).startCombustionTour && (window as any).startCombustionTour());
  }
}

// Known Joyride tooltip selectors
const tooltipSelectors = [
  '.react-joyride__tooltip',
  '.react-joyride .joyride-tooltip',
  '.joyride-tooltip',
];

// Get first existing tooltip locator
export async function getTooltip(page: Page) {
  for (const sel of tooltipSelectors) {
    const loc = page.locator(sel).first();
    if (await loc.count()) return loc;
  }
  return null;
}

// Wait for a Joyride step whose text matches predicate
export async function waitForJoyrideStep(page: Page, predicate: (text: string) => boolean, attempts = 30, delayMs = 400) {
  for (let i = 0; i < attempts; i++) {
    const tip = await getTooltip(page);
    if (tip) {
      const raw = await tip.innerText();
      const text = raw.replace(/\n/g, ' ');
      if (predicate(text)) {
        return { locator: tip, text };
      }
    }
    await page.waitForTimeout(delayMs);
  }
  return null;
}

// Advance Joyride to next step
export async function advanceJoyride(page: Page) {
  const tip = await getTooltip(page);
  if (tip) {
    const next = tip.locator('button:has-text("Next")');
    if (await next.count()) { await next.click(); return; }
    const buttons = tip.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const txt = (await btn.innerText()).trim();
      if (!/skip|back|close/i.test(txt) && txt.length > 0) { await btn.click(); return; }
    }
  }
  await page.keyboard.press('Space');
}

// Generic stable wait for a selector with retries
export async function waitForVisible(page: Page, selector: string, timeout = 5000) {
  const loc = page.locator(selector);
  await loc.waitFor({ state: 'visible', timeout });
  return loc;
}

// Diagnostic artifact collector
export async function capture(page: Page, name: string, fullPage = false) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage });
}

// Drive boiler to RUN_AUTO faster (uses exposed advanceStep button or simulation speed)
export async function fastForwardToRunAuto(page: Page) {
  // Ensure power on
  const powerOn = page.locator("[data-tour='power'] button:has-text('On')");
  if (await powerOn.count()) {
    try {
      await powerOn.click({ timeout: 1000 });
    } catch (err) {
      // Overlay may intercept pointer events during Joyride; fallback to global setter
      await page.evaluate(() => (window as any).setBoilerOn && (window as any).setBoilerOn(true));
    }
  } else {
    await page.evaluate(() => (window as any).setBoilerOn && (window as any).setBoilerOn(true));
  }
  // Repeatedly click Advance until RUN_AUTO is visible in programmer state readout
  for (let i = 0; i < 40; i++) {
    // Prefer global getter when available
    const state = await page.evaluate(() => (window as any).getProgrammerState ? (window as any).getProgrammerState() : null);
    if (state === 'RUN_AUTO') return true;

    // Try clicking Advance if possible (may be blocked by overlay)
    const advanceBtn = page.locator("[data-tour='programmer'] button:has-text('Advance')");
    if (await advanceBtn.count()) {
      try {
        await advanceBtn.click({ timeout: 200 });
      } catch (e) {
        // ignore click failures
  // Try global helper to advance programmer
  await page.evaluate(() => (window as any).advanceProgrammer && (window as any).advanceProgrammer());
      }
    }

    // As a fallback, speed up the sim to force progression if API exists
    await page.evaluate(() => {
      try {
        if ((window as any).setSimSpeed) (window as any).setSimSpeed(50);
        if ((window as any).setBoilerOn) (window as any).setBoilerOn(true);
      } catch (e) { /* noop */ }
    });

    await page.waitForTimeout(150);
  }
  return false;
}

// Enable tuning mode
export async function enableTuning(page: Page) {
  const tuningToggle = page.locator("[data-tour='tuning-toggle'] button:has-text('On')");
  await tuningToggle.click();
}

// Set firing rate slider (requires RUN_AUTO or test env override)
export async function setFiringRate(page: Page, value: number) {
  const slider = page.locator("[data-tour='firing-rate']");
  await slider.fill(String(value)); // For range inputs, fill sets value
  await page.dispatchEvent("[data-tour='firing-rate']", 'input');
  await page.dispatchEvent("[data-tour='firing-rate']", 'change');
}

// Click a CAM interval button
export async function clickCam(page: Page, pct: number) {
  await page.locator(`[data-tour='cam-${pct}']`).click();
}

// Save current CAM point
export async function saveCamPoint(page: Page) {
  const btn = page.locator('button:has-text("Set")');
  await btn.click();
}

// Start and prepare analyzer
export async function startAnalyzerSequence(page: Page) {
  const analyzer = page.locator("[data-tour='analyzer']");
  await analyzer.locator('button:has-text("Start")').click();
  await analyzer.locator('button:has-text("Finish Zero")').click();
  await analyzer.locator('button:has-text("Insert Probe")').click();
}

// Save analyzer reading
export async function saveAnalyzerReading(page: Page) {
  const btn = page.locator('[data-testid="btn-save-reading"]');
  await btn.click();
}

// Get count of saved readings (by locating repeated rows/pills)
export async function getSavedReadingsCount(page: Page) {
  // Rely on CSV export or saved pill text in UI; fallback placeholder
  const pills = page.locator('[data-testid="cam-saved-pill"]');
  return pills.count();
}
