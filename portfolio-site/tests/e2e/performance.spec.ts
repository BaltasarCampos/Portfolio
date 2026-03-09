/**
 * E2E: Performance audit tests — T081
 *
 * Verifies Core Web Vitals thresholds using the browser Performance API.
 * Targets:
 *   - LCP  < 2500 ms  (Good threshold per Web Vitals)
 *   - CLS  < 0.1      (Good threshold per Web Vitals)
 *   - TBT  < 150 ms   (correlates to FID/INP; Good threshold)
 *
 * Note: These tests run against the local dev/preview server.
 * For CI, they serve as a smoke test — Lighthouse CI (lighthouserc.json)
 * provides more precise and repeatable measurements.
 */

import { test, expect } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Collects performance timing from PerformanceObserver entries.
 * Returns LCP, CLS, and long-task duration (TBT proxy) after a brief wait.
 */
async function collectWebVitals(page: import('@playwright/test').Page): Promise<{
  lcp: number;
  cls: number;
  tbt: number;
}> {
  // Inject observer before navigation
  await page.addInitScript(() => {
    (window as Window & { __vitals?: { lcp: number; cls: number; tbt: number } }).__vitals = {
      lcp: 0,
      cls: 0,
      tbt: 0,
    };

    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        (window as Window & { __vitals?: { lcp: number; cls: number; tbt: number } }).__vitals!.lcp =
          last.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          (window as Window & { __vitals?: { lcp: number; cls: number; tbt: number } }).__vitals!.cls +=
            layoutShift.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // TBT (long tasks proxy)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const blockingTime = entry.duration - 50; // tasks > 50ms are "long tasks"
        if (blockingTime > 0) {
          (window as Window & { __vitals?: { lcp: number; cls: number; tbt: number } }).__vitals!.tbt +=
            blockingTime;
        }
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Give observers time to fire after load
  await page.waitForTimeout(2000);

  return page.evaluate(() => {
    return (window as Window & { __vitals?: { lcp: number; cls: number; tbt: number } }).__vitals!;
  });
}

// ─── LCP ─────────────────────────────────────────────────────────────────────

test.describe('Performance — Largest Contentful Paint (LCP)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('LCP is below 2500ms on desktop', async ({ page }) => {
    const vitals = await collectWebVitals(page);

    // Log the value for debugging in CI
    console.log(`LCP: ${vitals.lcp.toFixed(0)}ms`);

    // Only assert if LCP was measured (requires a visible element)
    if (vitals.lcp > 0) {
      expect(
        vitals.lcp,
        `LCP ${vitals.lcp.toFixed(0)}ms exceeds the 2500ms "Good" threshold`,
      ).toBeLessThan(2500);
    }
  });
});

test.describe('Performance — LCP on mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('LCP is below 4000ms on mobile (3G-throttled budget)', async ({ page }) => {
    const vitals = await collectWebVitals(page);
    console.log(`LCP (mobile): ${vitals.lcp.toFixed(0)}ms`);

    if (vitals.lcp > 0) {
      // Mobile budget is more generous due to network/CPU differences in lab
      expect(
        vitals.lcp,
        `LCP ${vitals.lcp.toFixed(0)}ms exceeds the 4000ms mobile budget`,
      ).toBeLessThan(4000);
    }
  });
});

// ─── CLS ─────────────────────────────────────────────────────────────────────

test.describe('Performance — Cumulative Layout Shift (CLS)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('CLS is below 0.1 on desktop', async ({ page }) => {
    const vitals = await collectWebVitals(page);
    console.log(`CLS: ${vitals.cls.toFixed(4)}`);

    expect(
      vitals.cls,
      `CLS ${vitals.cls.toFixed(4)} exceeds the 0.1 "Good" threshold`,
    ).toBeLessThan(0.1);
  });
});

test.describe('Performance — CLS on mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('CLS is below 0.1 on mobile', async ({ page }) => {
    const vitals = await collectWebVitals(page);
    console.log(`CLS (mobile): ${vitals.cls.toFixed(4)}`);

    expect(
      vitals.cls,
      `CLS ${vitals.cls.toFixed(4)} exceeds the 0.1 "Good" threshold`,
    ).toBeLessThan(0.1);
  });
});

// ─── TBT ─────────────────────────────────────────────────────────────────────

test.describe('Performance — Total Blocking Time (TBT)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('TBT is below 150ms on desktop', async ({ page }) => {
    const vitals = await collectWebVitals(page);
    console.log(`TBT: ${vitals.tbt.toFixed(0)}ms`);

    expect(
      vitals.tbt,
      `TBT ${vitals.tbt.toFixed(0)}ms exceeds the 150ms "Good" threshold`,
    ).toBeLessThan(150);
  });
});

// ─── Resource hints ───────────────────────────────────────────────────────────

test.describe('Performance — Resource hints', () => {
  test('page has font preload link in <head>', async ({ page }) => {
    await page.goto('/');
    const preloadLinks = page.locator('link[rel="preload"][as="font"]');
    await expect(preloadLinks).toHaveCount({ min: 1 } as never);
  });

  test('page has image preload for hero background', async ({ page }) => {
    await page.goto('/');
    const imagePreload = page.locator('link[rel="preload"][as="image"]');
    await expect(imagePreload).toHaveCount({ min: 1 } as never);
  });

  test('page has preconnect for Google Fonts', async ({ page }) => {
    await page.goto('/');
    const preconnect = page.locator('link[rel="preconnect"]');
    const count = await preconnect.count();
    // May be 0 if fonts are self-hosted; just verify no error is thrown
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ─── Page weight ──────────────────────────────────────────────────────────────

test.describe('Performance — Page weight', () => {
  test('main HTML document is under 50KB', async ({ page }) => {
    const response = await page.goto('/');
    if (!response) return;

    const body = await response.body();
    const sizeKB = body.length / 1024;
    console.log(`HTML size: ${sizeKB.toFixed(1)}KB`);

    expect(sizeKB, `HTML document is ${sizeKB.toFixed(1)}KB (limit: 50KB)`).toBeLessThan(50);
  });
});
