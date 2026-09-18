/**
 * E2E: Automated accessibility audit using axe-core (T058–T062)
 *
 * Runs axe against each major section at desktop and mobile viewports.
 * WCAG 2.1 AA is the target standard.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ─── Helper ──────────────────────────────────────────────────────────────────

async function runAxe(page: import('@playwright/test').Page, context?: string) {
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Known acceptable: colour-contrast in decorative gradients (design decision)
    .exclude('.hero-gradient');

  if (context) {
    builder.include(context);
  }

  const results = await builder.analyze();
  return results.violations;
}

// ─── Full page ────────────────────────────────────────────────────────────────

test.describe('Accessibility — full page (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('homepage has no critical or serious axe violations', async ({ page }) => {
    await page.goto('/');
    // Wait for page to be fully rendered
    await page.waitForLoadState('networkidle');

    const violations = await runAxe(page);
    const criticalOrSerious = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (criticalOrSerious.length > 0) {
      const summary = criticalOrSerious
        .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
        .join('\n');
      expect.soft(criticalOrSerious, `Accessibility violations:\n${summary}`).toHaveLength(0);
    }

    expect(criticalOrSerious).toHaveLength(0);
  });
});

test.describe('Accessibility — full page (mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('homepage has no critical or serious axe violations on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await runAxe(page);
    const criticalOrSerious = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});

// ─── Section-by-section ───────────────────────────────────────────────────────

test.describe('Accessibility — sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('navigation has no axe violations', async ({ page }) => {
    const violations = await runAxe(page, 'nav');
    expect(violations).toHaveLength(0);
  });

  test('hero section has no axe violations', async ({ page }) => {
    const violations = await runAxe(page, '#hero');
    expect(violations).toHaveLength(0);
  });

  test('projects section has no axe violations after island hydration', async ({ page }) => {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });

    const violations = await runAxe(page, '#projects');
    expect(violations).toHaveLength(0);
  });

  test('about section has no axe violations', async ({ page }) => {
    await page.locator('#about').scrollIntoViewIfNeeded();
    const violations = await runAxe(page, '#about');
    expect(violations).toHaveLength(0);
  });

  test('contact section has no axe violations after island hydration', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    const violations = await runAxe(page, '#contact');
    expect(violations).toHaveLength(0);
  });
});

// ─── Specific WCAG checks ─────────────────────────────────────────────────────

test.describe('Accessibility — specific WCAG criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page has a single h1 (WCAG 1.3.1)', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('all images have non-empty alt text (WCAG 1.1.1)', async ({ page }) => {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      // Decorative images must have role="presentation" or role="none" AND empty alt
      if (role === 'presentation' || role === 'none') {
        expect(alt).toBe('');
      } else {
        expect(alt, `Image ${i} is missing alt text`).not.toBeNull();
        expect(alt?.trim(), `Image ${i} has empty alt text`).not.toBe('');
      }
    }
  });

  test('page has correct landmark structure (WCAG 1.3.6)', async ({ page }) => {
    // Must have: banner (header/nav), main, contentinfo (footer)
    await expect(page.locator('[role="banner"], header, nav')).toHaveCount({ min: 1 } as never);
    await expect(page.locator('main, [role="main"]')).toHaveCount(1);
    await expect(page.locator('footer, [role="contentinfo"]')).toHaveCount(1);
  });

  test('form inputs have associated labels (WCAG 1.3.1, 3.3.2)', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    const inputs = page.locator('form input:not([type="hidden"]):not([tabindex="-1"]), form textarea');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (!id) continue;
      const label = page.locator(`label[for="${id}"]`);
      await expect(label, `No label for input #${id}`).toHaveCount(1);
    }
  });
});
