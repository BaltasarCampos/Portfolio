/**
 * E2E: Keyboard navigation (T057)
 *
 * Verifies that all interactive elements are reachable and operable
 * using keyboard-only navigation (Tab, Shift+Tab, Enter, Space).
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('skip link is the first focusable element and jumps to main content', async ({ page }) => {
    // Tab once — skip link should receive focus
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveText(/skip to main content/i);

    // Activating it should move focus to #main-content
    await page.keyboard.press('Enter');
    const main = page.locator('#main-content');
    await expect(main).toBeFocused();
  });

  test('all navigation links are reachable by Tab', async ({ page }) => {
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Tab through the page until we reach the nav links
    for (let i = 0; i < count + 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused === 'A' || focused === 'BUTTON') break;
    }

    // Verify each nav link is tabbable (has non-negative tabIndex)
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const tabIndex = await link.getAttribute('tabindex');
      // tabindex should be null (natural order) or ≥ 0
      expect(Number(tabIndex ?? 0)).toBeGreaterThanOrEqual(0);
    }
  });

  test('filter buttons are operable with keyboard', async ({ page }) => {
    // Scroll to projects section first so client:idle island is hydrated
    await page.locator('#projects').scrollIntoViewIfNeeded();
    // Wait for React island to hydrate
    await page.waitForSelector('.filter-pill', { state: 'visible', timeout: 10_000 });

    const firstPill = page.locator('.filter-pill').first();
    await firstPill.focus();
    await expect(firstPill).toBeFocused();

    // Space or Enter should toggle the filter
    await page.keyboard.press('Space');
    await expect(firstPill).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Space');
    await expect(firstPill).toHaveAttribute('aria-pressed', 'false');
  });

  test('contact form fields are reachable by Tab', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    // Wait for client:visible island to hydrate
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const messageInput = page.getByLabel(/message/i);
    const submitButton = page.getByRole('button', { name: /send message/i });

    await nameInput.focus();
    await expect(nameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(messageInput).toBeFocused();

    // Tab past message → submit button (honeypot is tabIndex -1, so it's skipped)
    await page.keyboard.press('Tab');
    await expect(submitButton).toBeFocused();
  });

  test('contact form can be submitted with Enter on the submit button', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    // Fill the form
    await page.getByLabel(/name/i).fill('Keyboard User');
    await page.getByLabel(/email/i).fill('kb@example.com');
    await page.getByLabel(/message/i).fill('Testing keyboard submission');

    // Mock the API so the test is self-contained
    await page.route('/api/contact', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: "Thanks!",
          submissionId: 'e2e-test-id',
        }),
      }),
    );

    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.focus();
    await page.keyboard.press('Enter');

    // Success message should appear
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5_000 });
  });

  test('focus is visible on all interactive elements (focus indicators)', async ({ page }) => {
    // Tab through the first 20 focusable elements and verify outline is set
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const outlineWidth = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        if (!el || el === document.body) return '0px';
        return window.getComputedStyle(el).outlineWidth;
      });
      // Each focusable element must have a visible outline (not 0px)
      expect(outlineWidth).not.toBe('0px');
    }
  });
});
