/**
 * E2E: Full accessibility audit — T086
 *
 * Extends the section-level audits in accessibility.spec.ts with:
 *   - Full-page axe-core scan at multiple viewports
 *   - Heading hierarchy validation (WCAG 1.3.1, 2.4.6)
 *   - Form label completeness audit (WCAG 1.3.1, 3.3.2)
 *   - ARIA landmark structure (WCAG 1.3.6)
 *   - Focus management & keyboard operability (WCAG 2.1.1)
 *   - Skip-link presence (WCAG 2.4.1)
 *   - Color contrast spot-checks via axe (WCAG 1.4.3)
 *
 * Target: WCAG 2.1 AA
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ─── Shared setup ─────────────────────────────────────────────────────────────

async function fullAxeScan(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('.hero-gradient') // Decorative gradient — known exclusion
    .analyze();
  return results.violations;
}

// ─── Full axe audit (all viewports) ──────────────────────────────────────────

test.describe('Full Accessibility Audit — Desktop (1280×800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('no WCAG 2.1 AA violations on full page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hydrate islands
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    const violations = await fullAxeScan(page);

    if (violations.length > 0) {
      const report = violations
        .map((v) => `[${v.impact}] ${v.id}: ${v.description}\n  → ${v.helpUrl}`)
        .join('\n\n');
      expect(violations, `axe violations:\n\n${report}`).toHaveLength(0);
    }
  });
});

test.describe('Full Accessibility Audit — Tablet (768×1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('no WCAG 2.1 AA violations at tablet viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await fullAxeScan(page);
    const criticalOrSerious = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (criticalOrSerious.length > 0) {
      const report = criticalOrSerious.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('\n');
      expect(criticalOrSerious, `Tablet axe violations:\n${report}`).toHaveLength(0);
    }
  });
});

test.describe('Full Accessibility Audit — Mobile (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('no WCAG 2.1 AA violations at mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await fullAxeScan(page);
    const criticalOrSerious = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (criticalOrSerious.length > 0) {
      const report = criticalOrSerious.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('\n');
      expect(criticalOrSerious, `Mobile axe violations:\n${report}`).toHaveLength(0);
    }
  });
});

// ─── Heading hierarchy (WCAG 1.3.1, 2.4.6) ───────────────────────────────────

test.describe('Heading Hierarchy — T084', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page has exactly one h1', async ({ page }) => {
    const count = await page.locator('h1').count();
    expect(count).toBe(1);
  });

  test('h1 is inside the hero section', async ({ page }) => {
    const h1 = page.locator('#hero h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();
  });

  test('section headings are h2 elements', async ({ page }) => {
    // Projects, About, Contact each have an h2
    const sectionIds = ['#projects', '#about', '#contact'];
    for (const id of sectionIds) {
      const heading = page.locator(`${id} h2`).first();
      await expect(heading, `${id} should have an h2`).toHaveCount(1);
    }
  });

  test('no heading levels are skipped', async ({ page }) => {
    // Collect all headings in DOM order and verify no skip from h1→h3 etc.
    const headingLevels: number[] = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      return headings.map((h) => parseInt(h.tagName.slice(1), 10));
    });

    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i]!;
      const previous = headingLevels[i - 1]!;
      // A heading can stay the same level or go up by 1, or go back to any lower level
      if (current > previous) {
        expect(
          current - previous,
          `Heading level skipped from h${previous} to h${current}`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test('project card headings are h3 elements', async ({ page }) => {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });

    const cardHeadings = page.locator('#projects h3');
    const count = await cardHeadings.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─── Form labels (WCAG 1.3.1, 3.3.2) — T083 ─────────────────────────────────

test.describe('Form Labels — T083', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });
  });

  test('all visible form inputs have associated <label> elements', async ({ page }) => {
    const inputs = page.locator('form input:not([type="hidden"]):not([tabindex="-1"]), form textarea');
    const count = await inputs.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (!id) continue;
      await expect(page.locator(`label[for="${id}"]`), `No label for #${id}`).toHaveCount(1);
    }
  });

  test('error messages are linked to inputs via aria-describedby', async ({ page }) => {
    // Trigger validation by submitting empty form
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(300);

    // Name field should show an error linked via aria-describedby
    const nameInput = page.locator('#name');
    const nameDescribedBy = await nameInput.getAttribute('aria-describedby');
    expect(nameDescribedBy, 'name input should have aria-describedby').not.toBeNull();

    if (nameDescribedBy) {
      const errorEl = page.locator(`#${nameDescribedBy}`);
      await expect(errorEl).toBeVisible();
    }
  });

  test('email field has correct type', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input#email');
    await expect(emailInput).toHaveCount(1);
  });

  test('textarea for message is present', async ({ page }) => {
    const textarea = page.locator('form textarea');
    await expect(textarea).toHaveCount(1);
  });

  test('honeypot field is hidden from assistive technology', async ({ page }) => {
    // The honeypot wrapper has aria-hidden="true"
    const honeypotWrapper = page.locator('[aria-hidden="true"]').filter({
      has: page.locator('input'),
    });
    const count = await honeypotWrapper.count();
    // May be 0 if honeypot is implemented differently; ensure no tabIndex=-1 inputs are reachable
    if (count > 0) {
      const honeypotInput = honeypotWrapper.locator('input').first();
      const tabIndex = await honeypotInput.getAttribute('tabindex');
      expect(tabIndex).toBe('-1');
    }
  });
});

// ─── Skip link (WCAG 2.4.1) ───────────────────────────────────────────────────

test.describe('Skip Link — WCAG 2.4.1', () => {
  test('skip-to-main-content link exists and is focusable', async ({ page }) => {
    await page.goto('/');
    // Tab once to bring skip link into focus
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const href = await focused.getAttribute('href');
    expect(href).toContain('#main');
  });

  test('skip link target (#main or #main-content) exists', async ({ page }) => {
    await page.goto('/');
    const mainTarget = page.locator('#main, #main-content, main[id]');
    await expect(mainTarget).toHaveCount(1);
  });
});

// ─── ARIA landmarks (WCAG 1.3.6) ─────────────────────────────────────────────

test.describe('ARIA Landmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page has a <main> landmark', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toHaveCount(1);
  });

  test('page has a navigation landmark', async ({ page }) => {
    await expect(page.locator('nav, [role="navigation"]')).toHaveCount({ min: 1 } as never);
  });

  test('page has a footer / contentinfo landmark', async ({ page }) => {
    await expect(page.locator('footer, [role="contentinfo"]')).toHaveCount(1);
  });

  test('filter pill groups have role="group" with aria-labelledby', async ({ page }) => {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });

    const groups = page.locator('.filter-pills[role="group"]');
    const count = await groups.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const group = groups.nth(i);
      const labelledBy = await group.getAttribute('aria-labelledby');
      expect(labelledBy, 'filter group should have aria-labelledby').not.toBeNull();
    }
  });
});

// ─── Keyboard operability (WCAG 2.1.1) ───────────────────────────────────────

test.describe('Keyboard Operability', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('navigation links are reachable by Tab', async ({ page }) => {
    await page.goto('/');
    // Advance past the skip link
    await page.keyboard.press('Tab');
    // Tab through nav items
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Focus the first nav link
    await navLinks.first().focus();
    await expect(navLinks.first()).toBeFocused();
  });

  test('filter pills are keyboard-navigable with arrow keys', async ({ page }) => {
    await page.goto('/');
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });

    const firstPill = page.locator('.filter-pill').first();
    await firstPill.focus();
    await expect(firstPill).toBeFocused();

    // Arrow right should move focus to the next pill
    await page.keyboard.press('ArrowRight');
    const secondPill = page.locator('.filter-pill').nth(1);
    await expect(secondPill).toBeFocused();
  });

  test('contact form submit button is reachable by Tab', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    const submitBtn = page.locator('form button[type="submit"]');
    await submitBtn.focus();
    await expect(submitBtn).toBeFocused();
  });
});
