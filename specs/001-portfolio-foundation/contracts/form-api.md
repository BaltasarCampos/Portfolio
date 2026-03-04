# API Contract: Contact Form

**Phase**: 1 (Design)  
**Date**: 2026-03-04  
**Feature**: Build Portfolio Foundation (001-portfolio-foundation)  
**Endpoint**: `POST /api/contact`

---

## Overview

This document specifies the HTTP contract for the contact form submission endpoint. The endpoint is deployed as a Netlify Edge Function and handles:
- **Request Validation**: Name, email, message fields + honeypot detection + rate limiting
- **Response**: JSON with success/error status and message
- **Email Delivery**: Asynchronous delivery to engineer via SendGrid/Mailgun
- **Spam Protection**: Rate limiting by IP + honeypot field

---

## Request Specification

### HTTP Method & URL

```
POST /api/contact
```

### Request Headers

**Required**:
- `Content-Type: application/json`

**Recommended**:
- `User-Agent: <browser user agent>` (captured automatically)

**CORS**:
- `Origin: https://portfoliosite.com` (or configured domain)
- Preflight requests: Method `OPTIONS` returns `200 OK` with allowed origins

### Request Body

**Content-Type**: `application/json`

**Schema**:
```typescript
interface ContactFormRequest {
  name: string;         // 1-100 characters, required
  email: string;        // Valid email format, required
  message: string;      // 1-5000 characters, required
  honeypot?: string;    // Hidden field (should be empty)
}
```

**JSON Example**:
```json
{
  "name": "Jane Developer",
  "email": "jane@example.com",
  "message": "Hi! I'm interested in collaborating on a React library project. Your portfolio looks great!",
  "honeypot": ""
}
```

### Validation Rules

**Client-Side (Before Submission)**:
Implemented in `src/components/ContactForm.tsx`:
```typescript
const errors: Record<string, string> = {};

// Name validation
if (!name.trim()) {
  errors.name = 'Name is required';
} else if (name.trim().length > 100) {
  errors.name = 'Name must be 100 characters or less';
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!email.trim()) {
  errors.email = 'Email is required';
} else if (!emailRegex.test(email.trim().toLowerCase())) {
  errors.email = 'Please enter a valid email address';
}

// Message validation
if (!message.trim()) {
  errors.message = 'Message is required';
} else if (message.trim().length > 5000) {
  errors.message = 'Message must be 5000 characters or less';
}

if (Object.keys(errors).length > 0) {
  // Show errors inline, don't submit
  return;
}
```

**Server-Side (Security, Always Applied)**:
Implemented in `netlify/functions/contact.ts`:

| Field | Rule | Severity |
|-------|------|----------|
| `name` | Not empty after trim; ≤100 chars | Return 400 |
| `email` | Valid email regex; lowercase for storage | Return 400 |
| `message` | Not empty after trim; ≤5000 chars | Return 400 |
| `honeypot` | Must be empty (if filled = bot attempt) | Return 200 (silent) |
| `clientIp` | Extract from `x-forwarded-for` header; rate limit 3/hour | Return 429 |

### Rate Limiting

**Implementation**:
- Track client IP address via `x-forwarded-for` header (Netlify Edge)
- Store submission count per IP in KV store (Redis-like) with 1-hour TTL
- Max 3 submissions per IP per hour
- On limit exceeded: Return 429 status

**Code Example**:
```typescript
const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
const rateLimitKey = `contact-${clientIp}`;
const count = await KV_STORE.get(rateLimitKey);

if (count && parseInt(count) >= 3) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many submissions. Please try again in 1 hour.',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Honeypot Field

**Purpose**: Detect bot submissions without user friction (no CAPTCHA)

**Implementation**:
1. Form includes hidden field `<input name="honeypot" type="text" style="display:none;" />`
2. Legitimate users never see or fill this field
3. Bots auto-fill all fields including honeypot
4. Server detects honeypot filled = silent rejection (return 200 success, but don't send email)

**Code Example**:
```typescript
// Client-side: Hidden field (never visible to users)
<input
  name="honeypot"
  type="text"
  aria-hidden="true"
  tabIndex={-1}
  style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
/>

// Server-side: Silent rejection
if (body.honeypot && body.honeypot.trim() !== '') {
  // Bot attempt - return 200 success (don't reveal detection)
  return new Response(
    JSON.stringify({ success: true, message: 'Message received' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Payload Size Limits

- **Max request size**: 10 KB (includes JSON + headers)
- **Max field sizes**:
  - `name`: 100 bytes
  - `email`: 254 bytes (RFC 5321)
  - `message`: 5000 bytes
- **Total payload**: ~5.4 KB typical

---

## Response Specification

### Success Response

**HTTP Status**: `200 OK`

**Response Headers**:
```
Content-Type: application/json
Cache-Control: no-cache, no-store, must-revalidate
X-Content-Type-Options: nosniff
```

**Response Body**:
```typescript
interface ContactFormSuccessResponse {
  success: true;
  message: string;           // User-friendly confirmation message
  submissionId?: string;     // Optional: UUID for reference
  nextAction?: string;       // Optional: "check-email" or similar
}
```

**JSON Example**:
```json
{
  "success": true,
  "message": "Thank you! Your message has been sent. I'll get back to you soon.",
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",
  "nextAction": "check-email"
}
```

### Error Response

**HTTP Status**: `400 Bad Request` (validation error), `429 Too Many Requests` (rate limit), `500 Internal Server Error` (server error)

**Response Body**:
```typescript
interface ContactFormErrorResponse {
  success: false;
  error: string;             // User-friendly error message
  errorCode?: string;        // Machine-readable error code
  details?: Record<string, string>; // Field-specific errors (optional)
}
```

**JSON Examples**:

**Validation Error** (400):
```json
{
  "success": false,
  "error": "Please fix the following errors:",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "message": "Message is required"
  }
}
```

**Rate Limit** (429):
```json
{
  "success": false,
  "error": "Too many submissions. Please try again in 1 hour.",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

**Server Error** (500):
```json
{
  "success": false,
  "error": "Something went wrong. Please try again later.",
  "errorCode": "INTERNAL_SERVER_ERROR"
}
```

### Response Content Length

- **Success**: ~200 bytes
- **Error**: ~300 bytes max
- **Performance**: Response generated in <50ms (excluding email send)

---

## Email Delivery

### Email Content

**Recipient**: `process.env.ENGINEER_EMAIL` (e.g., `engineer@example.com`)

**Subject Line**:
```
New Portfolio Contact: {name}
```

**Email Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
    .field { margin-bottom: 16px; }
    .label { font-weight: 600; color: #374151; margin-bottom: 4px; }
    .value { color: #6b7280; word-break: break-word; }
    .metadata { font-size: 12px; color: #9ca3af; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; color: #111827;">New Contact Form Submission</h2>
    </div>
    
    <div class="field">
      <div class="label">Name</div>
      <div class="value">{name}</div>
    </div>
    
    <div class="field">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:{email}">{email}</a></div>
    </div>
    
    <div class="field">
      <div class="label">Message</div>
      <div class="value">{message}</div>
    </div>
    
    <div class="metadata">
      <p>Submitted on: {submittedAt} (UTC)</p>
      <p>Submission ID: {submissionId}</p>
    </div>
  </div>
</body>
</html>
```

### Email Service Integration

**Provider**: SendGrid or Mailgun

**Implementation** (SendGrid example):
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: process.env.ENGINEER_EMAIL,
  from: process.env.FROM_EMAIL || 'noreply@portfoliosite.com',
  subject: `New Portfolio Contact: ${name}`,
  html: emailTemplate,
  replyTo: email,
};

try {
  await sgMail.send(msg);
  return { success: true, message: 'Email sent successfully' };
} catch (error) {
  console.error('SendGrid error:', error);
  return { success: false, error: 'Failed to send email' };
}
```

### Email Delivery Guarantees

- **Async Processing**: Email sent asynchronously (doesn't block response)
- **Retry Logic**: 3 retries with exponential backoff (3s, 9s, 27s) if send fails
- **Fallback**: If SendGrid fails after retries, log to database/S3 for manual follow-up
- **Expected SLA**: 99% delivery within 5 minutes

---

## Request/Response Flow Diagram

```
Client                          Edge Function                  Email Service
  │                                    │                              │
  ├─ POST /api/contact              │                              │
  │  with name, email, message        │                              │
  │                                    │                              │
  │                                    ├─ Extract client IP          │
  │                                    ├─ Check rate limit           │
  │                                    │  (3 submissions/hour)       │
  │                                    │                              │
  │                                    ├─ If rate limited:          │
  │                                    │  return 429                │
  │                                    │                              │
  │                                    ├─ Check honeypot            │
  │                                    │  If filled: silent 200 ✅   │
  │                                    │                              │
  │                                    ├─ Validate all fields       │
  │                                    │  (name, email, message)    │
  │                                    │                              │
  │                                    ├─ If invalid:               │
  │                                    │  return 400 with errors    │
  │                                    │                              │
  │                                    ├─ If valid:                 │
  │                                    │  send email (async)        │
  │                                    ├────────────────────────→  │
  │                                    │                         send
  │                                    │                      (retry
  │                                    │                       3x)
  │                                    │
  │  ← 200 OK {"success": true}        │
  │  (email sending in background)     │
  │                                    │
  │                                    ├─ If email fails            │
  │                                    │  log to fallback store     │
```

---

## Testing Contract

### Test Cases

#### TC-001: Valid Submission
**Input**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'm interested in collaborating."
}
```
**Expected**: 200 OK, `success: true`, email sent to engineer

#### TC-002: Missing Email
**Input**:
```json
{
  "name": "John Doe",
  "email": "",
  "message": "Hello"
}
```
**Expected**: 400 Bad Request, error message about email

#### TC-003: Invalid Email Format
**Input**:
```json
{
  "name": "John Doe",
  "email": "not-an-email",
  "message": "Hello"
}
```
**Expected**: 400 Bad Request, error about email format

#### TC-004: Message Too Long
**Input**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "[5001 characters]"
}
```
**Expected**: 400 Bad Request, error about message length

#### TC-005: Honeypot Filled (Bot Attempt)
**Input**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello",
  "honeypot": "filled"
}
```
**Expected**: 200 OK (silent), no email sent

#### TC-006: Rate Limit Exceeded
**Setup**: Submit 3 times from same IP within 1 hour
**Input**: Valid 4th submission
**Expected**: 429 Too Many Requests, rate limit error

#### TC-007: Name with HTML
**Input**:
```json
{
  "name": "<script>alert('xss')</script>",
  "email": "john@example.com",
  "message": "Hello"
}
```
**Expected**: 400 Bad Request or sanitized in email (safe handling)

---

## Implementation Checklist

### Server-Side (Netlify Edge Function)

- [ ] Create `netlify/functions/contact.ts`
- [ ] Validate all request fields (name, email, message)
- [ ] Extract client IP from `x-forwarded-for` header
- [ ] Implement rate limiting logic (3/hour per IP)
- [ ] Implement honeypot detection (silent rejection)
- [ ] Initialize SendGrid/Mailgun client
- [ ] Generate email from template
- [ ] Send email asynchronously with retry logic
- [ ] Return appropriate response (200/400/429/500)
- [ ] Add error logging (Sentry or similar)
- [ ] Add request logging (CloudWatch or similar)

### Client-Side (React Component)

- [ ] Create `src/components/ContactForm.tsx`
- [ ] Implement form state management (useState + sessionStorage)
- [ ] Add inline validation (on blur)
- [ ] Add honeypot field (hidden)
- [ ] POST request to `/api/contact`
- [ ] Show loading state during submission
- [ ] Show success message on 200 OK
- [ ] Show error message on 400/429/500
- [ ] Preserve form data in sessionStorage on changes
- [ ] Clear sessionStorage on successful submission
- [ ] Recover form data from sessionStorage on mount

### Testing

- [ ] Unit test: Validation functions
- [ ] Integration test: ContactForm component with mocked API
- [ ] E2E test: Full submission flow (Playwright)
- [ ] E2E test: Honeypot detection
- [ ] E2E test: Rate limiting scenario
- [ ] Security test: HTML injection attempts
- [ ] Accessibility test: Form keyboard navigation
- [ ] Performance test: Response time <50ms

---

## Environment Variables

**Required** (set in Netlify dashboard):

```bash
# Email service
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
ENGINEER_EMAIL=engineer@example.com
FROM_EMAIL=noreply@portfoliosite.com

# Rate limiting store (if using external KV)
KV_STORE_URL=https://kv-store.example.com
KV_STORE_TOKEN=token-xxxxxxxxxxxxx
```

---

## Security Considerations

1. **CORS**: Restrict to configured domain only
2. **Rate Limiting**: 3 submissions per IP per hour
3. **Honeypot**: Silent rejection of bot attempts
4. **Validation**: Server-side validation of all fields
5. **Email Headers**: Set `replyTo: email` to enable direct replies
6. **Logging**: No sensitive data (passwords, tokens) in logs
7. **HTTPS Only**: Reject HTTP requests

---

## Next Steps

**Phase 1 (Design)** continues with:
1. ✅ `data-model.md` (completed)
2. ✅ `contracts/form-api.md` (this file)
3. `contracts/image-delivery.md`: WebP/JPEG format negotiation
4. `quickstart.md`: Local dev setup and deployment
5. Agent context update

Contact form API contract complete and ready for implementation.
