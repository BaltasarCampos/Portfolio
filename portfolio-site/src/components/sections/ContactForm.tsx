/**
 * ContactForm.tsx — React island for the contact form.
 * Hydrated client:visible (only when scrolled into view).
 * Features: inline validation, sessionStorage recovery, honeypot, rate limit handling.
 */

import { useState, useEffect, useId } from 'react';
import { validateName, validateEmail, validateMessage, isFormValid } from '../../utils/validation.ts';
import type { FormValidationState, FieldState } from '../../types/index.ts';

const SESSION_KEY = 'contact-form-draft';

type FieldName = 'name' | 'email' | 'message';

function makeField(value = ''): FieldState {
  return { value, error: undefined, touched: false };
}

function loadDraft(): Partial<Record<FieldName, string>> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<FieldName, string>>) : {};
  } catch {
    return {};
  }
}

function saveDraft(values: Record<FieldName, string>): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(values));
  } catch {
    // sessionStorage quota exceeded — fail silently
  }
}

function clearDraft(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export default function ContactForm(): React.JSX.Element {
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  const [state, setState] = useState<FormValidationState>(() => {
    const draft = loadDraft();
    return {
      name: makeField(draft.name ?? ''),
      email: makeField(draft.email ?? ''),
      message: makeField(draft.message ?? ''),
      honeypot: makeField(''),
      isSubmitting: false,
      submitStatus: null,
      submitError: null,
    };
  });

  // Persist draft to sessionStorage on every change
  useEffect(() => {
    if (state.submitStatus === 'success') return;
    saveDraft({
      name: state.name.value,
      email: state.email.value,
      message: state.message.value,
    });
  }, [state.name.value, state.email.value, state.message.value, state.submitStatus]);

  function setField(field: FieldName, value: string): void {
    setState((prev) => ({
      ...prev,
      [field]: { ...prev[field], value, error: undefined },
    }));
  }

  function handleBlur(field: FieldName): void {
    const value = state[field].value;
    let error: string | undefined;
    if (field === 'name') error = validateName(value);
    else if (field === 'email') error = validateEmail(value);
    else if (field === 'message') error = validateMessage(value);

    setState((prev) => ({
      ...prev,
      [field]: { ...prev[field], touched: true, error },
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validate all fields
    const nameError = validateName(state.name.value);
    const emailError = validateEmail(state.email.value);
    const messageError = validateMessage(state.message.value);

    // Mark all as touched + set errors
    setState((prev) => ({
      ...prev,
      name: { ...prev.name, touched: true, error: nameError },
      email: { ...prev.email, touched: true, error: emailError },
      message: { ...prev.message, touched: true, error: messageError },
    }));

    if (!isFormValid({ name: nameError, email: emailError, message: messageError })) return;

    setState((prev) => ({ ...prev, isSubmitting: true, submitError: null }));

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name.value.trim(),
          email: state.email.value.trim(),
          message: state.message.value.trim(),
          honeypot: state.honeypot.value,
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (res.ok && data.success) {
        clearDraft();
        setState({
          name: makeField(''),
          email: makeField(''),
          message: makeField(''),
          honeypot: makeField(''),
          isSubmitting: false,
          submitStatus: 'success',
          submitError: null,
        });
      } else if (res.status === 429) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitStatus: 'rate-limited',
          submitError:
            'You have sent too many messages recently. Please wait an hour and try again.',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitStatus: 'error',
          submitError: data.error ?? 'Something went wrong. Please try again.',
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        submitStatus: 'error',
        submitError: 'Unable to send your message. Please check your connection and try again.',
      }));
    }
  }

  if (state.submitStatus === 'success') {
    return (
      <div className="form-success" role="status" aria-live="polite">
        <svg
          aria-hidden="true"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7.5 12l3 3 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="form-success-heading">Message sent!</h3>
        <p className="form-success-message">
          Thank you for reaching out. I'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      className="contact-form"
      onSubmit={(e) => { void handleSubmit(e); }}
      noValidate
      aria-label="Contact form"
    >
      {/* Error banner */}
      {state.submitError && (
        <div className="form-error-banner" role="alert" aria-live="assertive">
          {state.submitError}
        </div>
      )}

      {/* Name */}
      <div className="form-field">
        <label className="form-label" htmlFor={nameId}>
          Name <span className="form-required" aria-label="required">*</span>
        </label>
        <input
          id={nameId}
          type="text"
          className={`form-input${state.name.touched && state.name.error ? ' form-input--error' : ''}`}
          value={state.name.value}
          onChange={(e) => setField('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          autoComplete="name"
          aria-required="true"
          aria-describedby={state.name.touched && state.name.error ? `${nameId}-error` : undefined}
          aria-invalid={state.name.touched && state.name.error ? 'true' : undefined}
          maxLength={100}
          disabled={state.isSubmitting}
        />
        {state.name.touched && state.name.error && (
          <p id={`${nameId}-error`} className="form-field-error" role="alert">
            {state.name.error}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="form-field">
        <label className="form-label" htmlFor={emailId}>
          Email <span className="form-required" aria-label="required">*</span>
        </label>
        <input
          id={emailId}
          type="email"
          className={`form-input${state.email.touched && state.email.error ? ' form-input--error' : ''}`}
          value={state.email.value}
          onChange={(e) => setField('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          autoComplete="email"
          inputMode="email"
          aria-required="true"
          aria-describedby={state.email.touched && state.email.error ? `${emailId}-error` : undefined}
          aria-invalid={state.email.touched && state.email.error ? 'true' : undefined}
          disabled={state.isSubmitting}
        />
        {state.email.touched && state.email.error && (
          <p id={`${emailId}-error`} className="form-field-error" role="alert">
            {state.email.error}
          </p>
        )}
      </div>

      {/* Message */}
      <div className="form-field">
        <label className="form-label" htmlFor={messageId}>
          Message <span className="form-required" aria-label="required">*</span>
        </label>
        <textarea
          id={messageId}
          className={`form-input form-textarea${state.message.touched && state.message.error ? ' form-input--error' : ''}`}
          value={state.message.value}
          onChange={(e) => setField('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          rows={6}
          aria-required="true"
          aria-describedby={state.message.touched && state.message.error ? `${messageId}-error` : undefined}
          aria-invalid={state.message.touched && state.message.error ? 'true' : undefined}
          maxLength={5000}
          disabled={state.isSubmitting}
        />
        <p className="form-char-count" aria-live="polite">
          {state.message.value.length} / 5000
        </p>
        {state.message.touched && state.message.error && (
          <p id={`${messageId}-error`} className="form-field-error" role="alert">
            {state.message.error}
          </p>
        )}
      </div>

      {/* Honeypot — hidden from users, filled only by bots */}
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="website">Website (leave blank)</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={state.honeypot.value}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              honeypot: { ...prev.honeypot, value: e.target.value },
            }))
          }
        />
      </div>

      <button
        type="submit"
        className="form-submit"
        disabled={state.isSubmitting}
        aria-busy={state.isSubmitting}
      >
        {state.isSubmitting ? (
          <>
            <span className="form-spinner" aria-hidden="true" />
            Sending…
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
