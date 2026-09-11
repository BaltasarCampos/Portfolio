/**
 * E2E tests for the Contact Form — T052
 *
 * Tests: valid submission, field validation errors, honeypot (silent success),
 * rate-limit 429 response, sessionStorage recovery on failure.
 *
 * Note: API calls are intercepted with Playwright route mocking so these tests
 * run without a live Netlify Functions server.
 */

import { test, expect } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function scrollToContact(page: import('@playwright/test').Page) {
  await page.locator('#contact').scrollIntoViewIfNeeded();
  // Wait for the client:visible island to hydrate
  await page.waitForSelector('form[aria-label="Contact form"]', {
    state: 'visible',
    timeout: 15_000,
  });
}

function fillField(
  page: import('@playwright/test').Page,
  label: RegExp | string,
  value: string,
) {
  return page.getByLabel(label).fill(value);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

test.describe('Contact form — rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await scrollToContact(page);
  });

  test('displays name, email and message fields', async ({ page }) => {
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
  });

  test('displays a submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });

  test('honeypot field is not visible to sighted users', async ({ page }) => {
    const honeypot = page.locator('#website');
    // It must exist in the DOM for bots to fill it, but be aria-hidden
    await expect(honeypot).toHaveCount(1);
    const wrapper = honeypot.locator('..');
    await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });
});

// ─── Field validation ─────────────────────────────────────────────────────────

test.describe('Contact form — field validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await scrollToContact(page);
  });

  test('shows name error when field is blurred empty', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i);
    await nameInput.focus();
    await nameInput.blur();
    await expect(page.getByText('Name is required.')).toBeVisible();
  });

  test('shows email error for invalid email format', async ({ page }) => {
    await fillField(page, /email/i, 'notvalid');
    await page.getByLabel(/email/i).blur();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  });

  test('does not show errors before fields are touched', async ({ page }) => {
    // Just render — don't touch anything
    await expect(page.getByText('Name is required.')).not.toBeVisible();
    await expect(page.getByText('Please enter a valid email address.')).not.toBeVisible();
  });

  test('clears error when valid value is entered', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i);
    await nameInput.focus();
    await nameInput.blur();
    await expect(page.getByText('Name is required.')).toBeVisible();

    await nameInput.fill('Alice');
    await nameInput.blur();
    await expect(page.getByText('Name is required.')).not.toBeVisible();
  });
});

// ─── Successful submission ────────────────────────────────────────────────────

test.describe('Contact form — successful submission', () => {
  test('shows success message after valid submission', async ({ page }) => {
    // Mock /api/contact to return 200
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Thanks!',
          submissionId: 'test-id-123',
        }),
      });
    });

    await page.goto('/');
    await scrollToContact(page);

    await fillField(page, /name/i, 'Alice Developer');
    await fillField(page, /email/i, 'alice@example.com');
    await fillField(page, /message/i, 'Hello, I would like to get in touch.');

    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/get back to you soon/i)).toBeVisible();
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

test.describe('Contact form — server error handling', () => {
  test('shows error banner on 500 response', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      });
    });

    await page.goto('/');
    await scrollToContact(page);

    await fillField(page, /name/i, 'Bob');
    await fillField(page, /email/i, 'bob@example.com');
    await fillField(page, /message/i, 'Test message here.');
    await page.getByRole('button', { name: /send message/i }).click();

    // Error banner should appear
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10_000 });
  });

  test('shows rate-limit message on 429 response', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
      });
    });

    await page.goto('/');
    await scrollToContact(page);

    await fillField(page, /name/i, 'Charlie');
    await fillField(page, /email/i, 'charlie@example.com');
    await fillField(page, /message/i, 'Too many messages.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText(/too many messages/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Honeypot ─────────────────────────────────────────────────────────────────

test.describe('Contact form — honeypot', () => {
  test('silently succeeds when honeypot is filled (bot simulation)', async ({ page }) => {
    // When the honeypot is filled, the server returns 200 without sending email.
    // From the client's perspective the submission "succeeds".
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Thanks!',
          submissionId: 'honeypot-id',
        }),
      });
    });

    await page.goto('/');
    await scrollToContact(page);

    await fillField(page, /name/i, 'Bot');
    await fillField(page, /email/i, 'bot@spam.com');
    await fillField(page, /message/i, 'Buy cheap meds!');

    // Fill the hidden honeypot via JavaScript (bots would do this)
    await page.evaluate(() => {
      const hp = document.getElementById('website') as HTMLInputElement | null;
      if (hp) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        nativeInputValueSetter?.call(hp, 'http://spam.com');
        hp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.getByRole('button', { name: /send message/i }).click();

    // Should show success (silent rejection — no error revealed to bot)
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ─── SessionStorage recovery ──────────────────────────────────────────────────

test.describe('Contact form — sessionStorage draft recovery', () => {
  test('restores form fields from sessionStorage on page load', async ({ page }) => {
    // Pre-populate sessionStorage before navigation
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem(
        'contact-form-draft',
        JSON.stringify({ name: 'Saved Name', email: 'saved@example.com', message: 'Saved msg' }),
      );
    });

    // Reload the page — draft should be restored
    await page.reload();
    await scrollToContact(page);

    await expect(page.getByLabel(/name/i)).toHaveValue('Saved Name');
    await expect(page.getByLabel(/email/i)).toHaveValue('saved@example.com');
    await expect(page.getByLabel(/message/i)).toHaveValue('Saved msg');
  });

  test('clears draft from sessionStorage after successful submission', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Thanks!', submissionId: 'ok-id' }),
      });
    });

    await page.goto('/');
    await scrollToContact(page);

    await fillField(page, /name/i, 'Dave');
    await fillField(page, /email/i, 'dave@example.com');
    await fillField(page, /message/i, 'Hello from Dave.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10_000 });

    const draft = await page.evaluate(() => sessionStorage.getItem('contact-form-draft'));
    expect(draft).toBeNull();
  });
});
