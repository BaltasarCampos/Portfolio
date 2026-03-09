/**
 * Integration tests for ContactForm.tsx (T046)
 *
 * Tests: field validation on blur, sessionStorage draft, form submission flow,
 * honeypot field, rate-limit message.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from '../../../src/components/sections/ContactForm';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fillForm(name: string, email: string, message: string) {
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/message/i), { target: { value: message } });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  // Reset fetch mock
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Thanks!", submissionId: 'test-id' }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ContactForm — rendering', () => {
  it('renders all form fields', () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('honeypot field is not visible to sighted users', () => {
    render(<ContactForm />);
    // The honeypot wrapper has aria-hidden="true"; find the input by id
    const honeypot = document.getElementById('website') as HTMLInputElement;
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    // The parent wrapper should be aria-hidden
    expect(honeypot.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });
});

// ─── Field validation ─────────────────────────────────────────────────────────

describe('ContactForm — field validation', () => {
  it('shows name error after blurring with empty value', async () => {
    render(<ContactForm />);
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.blur(nameInput);
    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
    });
  });

  it('shows email error after blurring with invalid value', async () => {
    render(<ContactForm />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'notanemail' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
  });

  it('shows message error after blurring with empty value', async () => {
    render(<ContactForm />);
    const messageInput = screen.getByLabelText(/message/i);
    fireEvent.blur(messageInput);
    await waitFor(() => {
      expect(screen.getByText('Message is required.')).toBeInTheDocument();
    });
  });

  it('clears field error once a valid value is entered', async () => {
    render(<ContactForm />);
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.blur(nameInput);
    await waitFor(() => expect(screen.getByText('Name is required.')).toBeInTheDocument());

    fireEvent.change(nameInput, { target: { value: 'Baltasar' } });
    fireEvent.blur(nameInput);
    await waitFor(() => {
      expect(screen.queryByText('Name is required.')).not.toBeInTheDocument();
    });
  });
});

// ─── sessionStorage draft ────────────────────────────────────────────────────

describe('ContactForm — sessionStorage draft', () => {
  it('pre-populates fields from an existing draft', () => {
    sessionStorage.setItem(
      'contact-form-draft',
      JSON.stringify({ name: 'Alice', email: 'alice@example.com', message: 'Hi!' }),
    );
    render(<ContactForm />);
    expect(screen.getByLabelText(/name/i)).toHaveValue('Alice');
    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com');
    expect(screen.getByLabelText(/message/i)).toHaveValue('Hi!');
  });

  it('saves draft on every keystroke', async () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Bob' } });
    await waitFor(() => {
      const draft = JSON.parse(sessionStorage.getItem('contact-form-draft') ?? '{}');
      expect(draft.name).toBe('Bob');
    });
  });
});

// ─── Submission ───────────────────────────────────────────────────────────────

describe('ContactForm — submission', () => {
  it('shows success message after a successful submission', async () => {
    render(<ContactForm />);
    fillForm('Baltasar', 'b@example.com', 'Hello!');
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    // Draft is cleared on success
    expect(sessionStorage.getItem('contact-form-draft')).toBeNull();
  });

  it('shows error message when the server returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Server error' }),
      }),
    );
    render(<ContactForm />);
    fillForm('Baltasar', 'b@example.com', 'Hello!');
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  it('shows rate-limit message when server returns 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ success: false, error: 'Too many requests' }),
      }),
    );
    render(<ContactForm />);
    fillForm('Baltasar', 'b@example.com', 'Hello!');
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      // Rate-limit message mentions waiting
      expect(screen.getByText(/wait.*hour|hour.*wait/i)).toBeInTheDocument();
    });
  });

  it('does not submit when validation errors exist', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<ContactForm />);
    // Leave all fields empty — submit
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
