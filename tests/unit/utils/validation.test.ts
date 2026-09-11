/**
 * Unit tests for src/utils/validation.ts
 *
 * Covers: validateName, validateEmail, validateMessage, validateContactForm, isFormValid
 */

import { describe, it, expect } from 'vitest';
import {
  validateName,
  validateEmail,
  validateMessage,
  validateContactForm,
  isFormValid,
} from '../../../src/utils/validation';

// ─── validateName ─────────────────────────────────────────────────────────────

describe('validateName', () => {
  it('returns undefined for a valid name', () => {
    expect(validateName('Baltasar')).toBeUndefined();
    expect(validateName('  Jane Doe  ')).toBeUndefined();
  });

  it('returns an error for an empty string', () => {
    expect(validateName('')).toBe('Name is required.');
  });

  it('returns an error for a whitespace-only string', () => {
    expect(validateName('   ')).toBe('Name is required.');
  });

  it('returns an error when name exceeds 100 characters', () => {
    expect(validateName('A'.repeat(101))).toBe('Name must be 100 characters or fewer.');
  });

  it('accepts a name that is exactly 100 characters', () => {
    expect(validateName('A'.repeat(100))).toBeUndefined();
  });

  it('returns an error when name contains HTML tags', () => {
    expect(validateName('<script>alert(1)</script>')).toBe('Name must not contain HTML tags.');
    expect(validateName('Alice <b>Bold</b>')).toBe('Name must not contain HTML tags.');
  });
});

// ─── validateEmail ────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns undefined for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
    expect(validateEmail('first.last+tag@sub.domain.io')).toBeUndefined();
  });

  it('returns an error for an empty string', () => {
    expect(validateEmail('')).toBe('Email is required.');
  });

  it('returns an error for a whitespace-only string', () => {
    expect(validateEmail('   ')).toBe('Email is required.');
  });

  it('returns an error when email format is invalid', () => {
    expect(validateEmail('notanemail')).toBe('Please enter a valid email address.');
    expect(validateEmail('@nodomain.com')).toBe('Please enter a valid email address.');
    expect(validateEmail('user@')).toBe('Please enter a valid email address.');
    expect(validateEmail('user @example.com')).toBe('Please enter a valid email address.');
  });
});

// ─── validateMessage ──────────────────────────────────────────────────────────

describe('validateMessage', () => {
  it('returns undefined for a valid message', () => {
    expect(validateMessage('Hello, I would like to collaborate.')).toBeUndefined();
  });

  it('returns an error for an empty string', () => {
    expect(validateMessage('')).toBe('Message is required.');
  });

  it('returns an error for a whitespace-only string', () => {
    expect(validateMessage('   ')).toBe('Message is required.');
  });

  it('returns an error when message exceeds 5000 characters', () => {
    expect(validateMessage('A'.repeat(5001))).toBe('Message must be 5000 characters or fewer.');
  });

  it('accepts a message that is exactly 5000 characters', () => {
    expect(validateMessage('A'.repeat(5000))).toBeUndefined();
  });

  it('returns an error when message contains HTML tags', () => {
    expect(validateMessage('<img src=x onerror=alert(1)>')).toBe(
      'Message must not contain HTML tags.',
    );
  });
});

// ─── validateContactForm ─────────────────────────────────────────────────────

describe('validateContactForm', () => {
  it('returns all undefined when all fields are valid', () => {
    const result = validateContactForm({
      name: 'Baltasar',
      email: 'b@example.com',
      message: 'Hello!',
    });
    expect(result.name).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(result.message).toBeUndefined();
  });

  it('returns errors for all invalid fields', () => {
    const result = validateContactForm({ name: '', email: 'bad', message: '' });
    expect(result.name).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.message).toBeDefined();
  });

  it('returns only the relevant field error when one field fails', () => {
    const result = validateContactForm({
      name: 'Baltasar',
      email: 'not-an-email',
      message: 'Hello!',
    });
    expect(result.name).toBeUndefined();
    expect(result.email).toBeDefined();
    expect(result.message).toBeUndefined();
  });
});

// ─── isFormValid ──────────────────────────────────────────────────────────────

describe('isFormValid', () => {
  it('returns true when all errors are undefined', () => {
    expect(
      isFormValid({ name: undefined, email: undefined, message: undefined }),
    ).toBe(true);
  });

  it('returns false when any error is defined', () => {
    expect(
      isFormValid({ name: 'Name is required.', email: undefined, message: undefined }),
    ).toBe(false);
    expect(
      isFormValid({ name: undefined, email: 'Please enter a valid email address.', message: undefined }),
    ).toBe(false);
    expect(
      isFormValid({ name: undefined, email: undefined, message: 'Message is required.' }),
    ).toBe(false);
  });
});
