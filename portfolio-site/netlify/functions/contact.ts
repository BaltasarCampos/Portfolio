/**
 * Netlify serverless function: POST /api/contact
 *
 * Responsibilities (T047–T051):
 *  T047 — Request parsing + routing
 *  T048 — SendGrid email delivery
 *  T049 — In-memory rate limiting (3 req / IP / hour)
 *  T050 — Honeypot spam detection
 *  T051 — CORS headers
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import sgMail from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';
import { validateContactForm, isFormValid } from '../../src/utils/validation';
import type { ContactFormRequest, ContactFormResponse } from '../../src/types/index';

// ─── Rate-limit store ────────────────────────────────────────────────────────
// Simple in-memory Map.  Suitable for single-instance Netlify functions.
// For multi-instance deployments, replace with Netlify KV / Redis.
interface RateRecord {
  count: number;
  resetAt: number; // epoch ms
}

const rateStore = new Map<string, RateRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = Number(process.env['RATE_LIMIT_MAX_PER_HOUR'] ?? 3);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateStore.get(ip);

  if (!record || now > record.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) return true;

  record.count += 1;
  return false;
}

// ─── CORS helpers ────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env['PUBLIC_SITE_URL'] ?? 'http://localhost:4321';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

function jsonResponse(statusCode: number, body: ContactFormResponse) {
  return {
    statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export const handler: Handler = async (event: HandlerEvent, _ctx: HandlerContext) => {
  // Handle pre-flight (T051)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method not allowed' });
  }

  // ── Parse body (T047) ────────────────────────────────────────────────────
  let payload: ContactFormRequest;
  try {
    payload = JSON.parse(event.body ?? '{}') as ContactFormRequest;
  } catch {
    return jsonResponse(400, { success: false, error: 'Invalid request body' });
  }

  const { name, email, message, honeypot } = payload;

  // ── Honeypot check (T050) ─────────────────────────────────────────────────
  // If the hidden field is filled, silently accept (mislead bots).
  if (honeypot) {
    console.info('[contact] Honeypot triggered — dropping silently');
    return jsonResponse(200, {
      success: true,
      message: "Thanks! We'll be in touch.",
      submissionId: uuidv4(),
    });
  }

  // ── Rate limiting (T049) ──────────────────────────────────────────────────
  const clientIp =
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
    event.headers['client-ip'] ??
    'unknown';

  if (isRateLimited(clientIp)) {
    return jsonResponse(429, {
      success: false,
      error: 'Too many requests. Please wait an hour before submitting again.',
    });
  }

  // ── Server-side validation (T047) ─────────────────────────────────────────
  const validationErrors = validateContactForm({ name, email, message });
  if (!isFormValid(validationErrors)) {
    const firstError =
      validationErrors.name ?? validationErrors.email ?? validationErrors.message;
    return jsonResponse(400, {
      success: false,
      error: firstError ?? 'Invalid form data',
    });
  }

  // ── SendGrid email (T048) ─────────────────────────────────────────────────
  const apiKey = process.env['SENDGRID_API_KEY'];
  const toEmail = process.env['ENGINEER_EMAIL'];
  const fromEmail = process.env['FROM_EMAIL'];

  if (!apiKey || !toEmail || !fromEmail) {
    console.error('[contact] Missing required environment variables');
    return jsonResponse(500, {
      success: false,
      error: 'Server configuration error. Please try again later.',
    });
  }

  sgMail.setApiKey(apiKey);

  const submissionId = uuidv4();
  const timestamp = new Date().toISOString();

  const emailBody = `
New portfolio contact form submission
=====================================
Submission ID : ${submissionId}
Timestamp     : ${timestamp}
From          : ${name} <${email}>

Message
-------
${message}
`.trim();

  const htmlBody = `
<h2>New portfolio contact form submission</h2>
<table>
  <tr><th>ID</th><td>${submissionId}</td></tr>
  <tr><th>Time</th><td>${timestamp}</td></tr>
  <tr><th>Name</th><td>${escapeHtml(name)}</td></tr>
  <tr><th>Email</th><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
</table>
<h3>Message</h3>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
`.trim();

  try {
    await sgMail.send({
      to: toEmail,
      from: fromEmail,
      replyTo: email,
      subject: `[Portfolio] New message from ${name}`,
      text: emailBody,
      html: htmlBody,
    });
  } catch (err) {
    console.error('[contact] SendGrid error:', err);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to send message. Please try again later.',
    });
  }

  console.info(`[contact] Email sent — id=${submissionId} ip=${clientIp}`);

  return jsonResponse(200, {
    success: true,
    message: "Thanks for reaching out! I'll be in touch within 2 business days.",
    submissionId,
  });
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
