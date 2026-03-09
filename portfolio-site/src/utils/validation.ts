/**
 * Client-side and shared validation utilities.
 * All validators return an error message string, or undefined if valid.
 * Used by ContactForm.tsx and the edge function (shared contract).
 */

/**
 * Validates a contact form name field.
 * @param value - The name string to validate
 * @returns Error message string, or undefined if valid
 */
export function validateName(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Name is required.';
  if (trimmed.length > 100) return 'Name must be 100 characters or fewer.';
  // Prevent HTML injection
  if (/<[^>]*>/u.test(trimmed)) return 'Name must not contain HTML tags.';
  return undefined;
}

/**
 * Validates a contact form email field.
 * Uses a practical RFC 5322-compatible pattern.
 * @param value - The email string to validate
 * @returns Error message string, or undefined if valid
 */
export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Email is required.';
  // Practical email pattern — local@domain.tld
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  if (!emailPattern.test(trimmed)) return 'Please enter a valid email address.';
  return undefined;
}

/**
 * Validates a contact form message field.
 * @param value - The message string to validate
 * @returns Error message string, or undefined if valid
 */
export function validateMessage(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Message is required.';
  if (trimmed.length > 5000) return 'Message must be 5000 characters or fewer.';
  // Prevent HTML injection
  if (/<[^>]*>/u.test(trimmed)) return 'Message must not contain HTML tags.';
  return undefined;
}

/**
 * Validates all contact form fields at once.
 * @param fields - The form field values to validate
 * @returns Object with field-level error messages (undefined = valid)
 */
export function validateContactForm(fields: {
  name: string;
  email: string;
  message: string;
}): { name: string | undefined; email: string | undefined; message: string | undefined } {
  return {
    name: validateName(fields.name),
    email: validateEmail(fields.email),
    message: validateMessage(fields.message),
  };
}

/**
 * Returns true if there are no validation errors.
 */
export function isFormValid(errors: {
  name: string | undefined;
  email: string | undefined;
  message: string | undefined;
}): boolean {
  return errors.name === undefined && errors.email === undefined && errors.message === undefined;
}
