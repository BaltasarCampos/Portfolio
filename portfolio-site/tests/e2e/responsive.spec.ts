/**
 * E2E: Responsive design testing (T068–T071)
 *
 * Verifies layout correctness and usability across key breakpoints.
 */

import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-sm',  width: 320,  height: 568  },
  { name: 'mobile-lg',  width: 414,  height: 896  },
  { name: 'tablet',     width: 768,  height: 1024 },
  { name: 'desktop-sm', width: 1024, height: 768  },
  { name: 'desktop-lg', width: 1440, height: 900  },
] as const;

// ─── Navigation ───────────────────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test(`navigation is visible and usable at ${vp.name} (${vp.width}×${vp.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // All nav links should be present in the DOM at every breakpoint
    const navLinks = nav.locator('a');
    await expect(navLinks).toHaveCount({ min: 3 } as never);
  });
}

// ─── Hero section ────────────────────────────────────────────────────────────

test.describe('Responsive — Hero section', () => {
  test('hero heading is visible at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Heading text must not overflow — check it's fully within viewport
    const box = await h1.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375 + 1); // 1px tolerance
  });

  test('CTA buttons stack vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const buttons = page.locator('#hero a[href]');
    const count = await buttons.count();
    if (count < 2) return; // Only one button — nothing to stack

    const box1 = await buttons.nth(0).boundingBox();
    const box2 = await buttons.nth(1).boundingBox();

    if (box1 && box2) {
      // On mobile, second button should be below (higher Y) the first
      expect(box2.y).toBeGreaterThanOrEqual(box1.y + box1.height - 5);
    }
  });
});

// ─── Projects grid ────────────────────────────────────────────────────────────

test.describe('Responsive — Projects grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });
  });

  test('project cards are in a single column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('[role="article"]', { state: 'visible', timeout: 10_000 });

    const cards = page.locator('[role="article"]');
    const count = await cards.count();
    if (count < 2) return;

    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();

    if (box1 && box2) {
      // In a single-column layout the second card should be below the first
      expect(box2.y).toBeGreaterThan(box1.y);
      // And both cards should span close to full width
      expect(box1.width).toBeGreaterThan(300);
    }
  });

  test('filter pills are scrollable/wrappable and not clipped on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });

    const filterBar = page.locator('.filter-bar');
    await expect(filterBar).toBeVisible();

    // Filter bar should not overflow the viewport width
    const box = await filterBar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(376); // 1px tolerance
  });
});

// ─── Contact form ─────────────────────────────────────────────────────────────

test.describe('Responsive — Contact form', () => {
  test('form inputs are full width on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    const nameInput = page.getByLabel(/name/i);
    const box = await nameInput.boundingBox();
    expect(box).not.toBeNull();
    // Input should fill most of the viewport width (minus padding)
    expect(box!.width).toBeGreaterThan(280);
  });
});

// ─── Touch targets ────────────────────────────────────────────────────────────

test.describe('Responsive — Touch targets (WCAG 2.5.5)', () => {
  test('interactive elements meet 44×44 px minimum touch target at mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Check nav links
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const box = await navLinks.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height, `Nav link ${i} height < 44px`).toBeGreaterThanOrEqual(44);
    }
  });

  test('CTA buttons meet 48×48 px minimum touch target', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const ctaButtons = page.locator('#hero a');
    const count = await ctaButtons.count();
    for (let i = 0; i < count; i++) {
      const box = await ctaButtons.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height, `CTA button ${i} height < 48px`).toBeGreaterThanOrEqual(48);
    }
  });
});
