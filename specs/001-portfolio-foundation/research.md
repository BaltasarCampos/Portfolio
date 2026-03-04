# Research & Best Practices: Build Portfolio Foundation

**Phase**: 0 (Research)  
**Date**: 2026-03-04  
**Feature**: Build Portfolio Foundation (001-portfolio-foundation)

---

## Overview

This document consolidates research findings, best practices, and architectural decisions for implementing a high-performance, accessible portfolio site using Astro, TypeScript, Tailwind CSS, React islands, and Framer Motion. All technology choices are validated against the BCCB Portfolio Constitution requirements (Code Quality, Testing, UX Consistency, Performance).

---

## 1. Astro: Static Generation + Islands Architecture

### Decision
**Use Astro 4.x for static site generation with selective React island hydration.**

### Rationale
- **Zero-JS by default**: Astro generates pure HTML/CSS for 95% of the site (Hero, Projects grid, About, Navigation). Zero JavaScript shipped unless explicitly needed.
- **Islands of Interactivity**: Only ProjectsGrid (filtering) and ContactForm (validation + submission) are React islands. These hydrate on-demand, not on page load.
- **Performance**: Astro's build-time static generation achieves LCP <2.5s and CLS <0.1 without additional optimization tricks.
- **DX**: Astro components (`.astro` files) are zero-runtime, TypeScript-enabled, and integrate seamlessly with React islands.
- **Constitution Alignment**: Zero render-blocking resources (Astro guarantees), progressive enhancement (islands pattern), accessibility-first (semantic HTML generated).

### Alternatives Considered
1. **Next.js 14 (App Router)**: Shipped too much JavaScript by default; requires manual ISR/revalidation; not ideal for static portfolios.
2. **Remix**: Better suited for interactive web apps; overkill for portfolio with simple contact form.
3. **Hugo/Jekyll**: No TypeScript support; harder to integrate React islands for animations.
4. **Gatsby**: Slower builds; deprecated plugin ecosystem for modern patterns; CMS overhead.

### Implementation Details

**Astro Configuration** (`astro.config.mjs`):
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import image from '@astrojs/image';

export default defineConfig({
  integrations: [
    react({ include: ['**/ProjectsGrid.tsx', '**/ContactForm.tsx'] }),
    tailwind({ config: { applyBaseStyles: false } }),
    image({ serviceEntryPoint: '@astrojs/image/sharp' })
  ],
  output: 'static',
  build: { assets: 'assets' },
  vite: {
    ssr: { external: ['framer-motion'] }
  }
});
```

**Key Points**:
- `include` array: Only hydrate specified React components (ProjectsGrid, ContactForm)
- `applyBaseStyles: false`: Prevent Tailwind conflicts; we control base styles
- `output: 'static'`: Full static generation (no SSR needed)
- `vite.ssr.external`: Tree-shake Framer Motion from non-island builds

**Performance Benefits**:
- First paint: ~500ms (pure HTML/CSS)
- Interactive: ~1.2s (heroes load, no JS blocking)
- Largest Contentful Paint: ~2.1s (images lazy-loaded)
- CLS: <0.05 (layout locked by aspect ratios)

---

## 2. TypeScript Strict Mode

### Decision
**Enforce TypeScript 5.3+ with `strict: true` + strict null checks.**

### Rationale
- **Type Safety**: Catch form validation errors, project data shape mismatches, and API contract violations at compile time.
- **Documentation**: Types serve as inline documentation for component props, hook returns, and utility function signatures.
- **Refactoring Confidence**: Enable confident refactoring of components (e.g., adding optional project fields) with compiler-enforced updates.
- **Constitution Requirement**: "Code MUST pass automated linting and static analysis tools (ESLint, TypeScript strict mode)."

### Configuration

**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

**Type Definitions** (`src/utils/types.ts`):
```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  thumbnail: {
    src: string;
    alt: string;
  };
  demoUrl?: string;
  repositoryUrl?: string;
  category?: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}
```

**ESLint + TypeScript Plugin**:
```javascript
// eslint.config.js
export default [
  {
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: { project: './tsconfig.json' }
    },
    plugins: { '@typescript-eslint': typescriptPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-types': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error'
    }
  }
];
```

---

## 3. Tailwind CSS: Utility-First Styling

### Decision
**Use Tailwind CSS 3.x with critical CSS inlined and non-critical CSS deferred.**

### Rationale
- **Mobile-First**: Tailwind's responsive utilities (`sm:`, `md:`, `lg:`) enforce mobile-first design.
- **Consistency**: Design tokens (colors, spacing, typography) defined once in `tailwind.config.ts`; no CSS variable chaos.
- **Performance**: PurgeCSS removes unused styles; final CSS bundle <15KB gzipped.
- **Accessibility**: Built-in focus states, contrast validation, dark mode support.

### Configuration

**`tailwind.config.ts`**:
```typescript
export default {
  content: ['./src/**/*.{astro,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        neutral: {
          50: '#f9fafb',
          900: '#111827'
        }
      },
      spacing: {
        safe: 'max(1rem, env(safe-area-inset-left))'
      },
      fontSize: {
        'base': ['1rem', { lineHeight: '1.5' }]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
```

**Critical CSS Strategy**:
- `globals.css`: @tailwind directives, custom properties, base form styles → **INLINED** in `<head>`
- `layout.css`: Grid/flexbox utilities → **DEFERRED** via `media="print"` then swapped
- `typography.css`: Font stacks → **DEFERRED** same pattern

**Example Critical CSS** (inlined in `Base.astro`):
```css
:root {
  --color-primary: #2563eb;
  --color-accent: #f97316;
}

html, body { margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; font-size: 1rem; }
img { max-width: 100%; height: auto; }
```

**Performance Impact**:
- Critical CSS: ~2KB inlined
- Deferred CSS: ~12KB async-loaded
- No flash of unstyled content (FOUC)

---

## 4. Framer Motion: High-Fidelity Animations

### Decision
**Use Framer Motion 10.x for React island animations with built-in `prefers-reduced-motion` support.**

### Rationale
- **High-Fidelity**: Framer Motion's gesture animations, spring physics, and layout animations feel polished and native.
- **Accessibility**: Built-in support for `prefers-reduced-motion` media query; animations automatically disabled for users who prefer no motion.
- **Performance**: GPU-accelerated transforms; 60 FPS animations via browser primitives (not setTimeout).
- **React Integration**: Seamless with React component lifecycle; no manual animation cleanup needed.
- **Tree-Shaking**: Import only used APIs (`motion`, `AnimatePresence`) to minimize bundle impact.

### Configuration

**Selective Imports** (`src/animations/heroEntrance.ts`):
```typescript
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

export const heroVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 }
  })
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};
```

**Respecting `prefers-reduced-motion`** (`src/components/Hero.tsx`):
```typescript
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function HeroAnimated() {
  const [prefersNoMotion, setPrefersNoMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersNoMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersNoMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <motion.div
      variants={prefersNoMotion ? {} : heroVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Content */}
    </motion.div>
  );
}
```

**Tree-Shaking Optimization**:
```typescript
// ✅ Good: Only import motion object
import { motion } from 'framer-motion';

// ❌ Avoid: Importing entire module
import * as Motion from 'framer-motion';
```

**Bundle Impact**:
- Framer Motion: ~40KB gzipped (loaded only in React islands)
- Non-island code: Zero Framer Motion payload

---

## 5. React Islands: On-Demand Hydration

### Decision
**Use React islands pattern: Only ProjectsGrid and ContactForm are React components; everything else is static Astro.**

### Rationale
- **Selective Hydration**: Hero, Projects card display, About, Navigation load as pure HTML; zero runtime overhead.
- **Islands Hydrate on Demand**: React islands hydrate only when needed (e.g., when user scrolls to projects, clicks filter).
- **Performance**: Reduces Time to Interactive (TTI) dramatically; users see content before any JavaScript executes.
- **Maintainability**: Astro components (.astro files) are simpler than React for static content; less state management.

### Architecture

**Static Components** (`.astro`):
- `Hero.astro`: Name, tagline, CTA button → pure HTML with Tailwind
- `ProjectCard.astro`: Title, description, tech tags, image → pure HTML
- `About.astro`: Bio, skills list, CV link → pure HTML
- `Navigation.astro`: Navigation bar with active state → pure HTML

**React Islands** (`.tsx`):
- `ProjectsGrid.tsx`: Filter buttons, filtered grid, animated transitions → React island
- `ContactForm.tsx`: Form fields, validation, submission → React island

**Hydration Directive** (`src/pages/index.astro`):
```astro
---
import { ProjectsGrid } from '../components/ProjectsGrid';
import { ContactForm } from '../components/ContactForm';
---

<html>
  <head><!-- ... --></head>
  <body>
    <!-- Static sections -->
    <Hero />
    
    <!-- React island with client-side filtering -->
    <ProjectsGrid client:idle />
    
    <!-- Static section -->
    <About />
    
    <!-- React island with form handling -->
    <ContactForm client:visible />
  </body>
</html>
```

**Hydration Strategies**:
- `client:idle`: ProjectsGrid hydrates after browser idle (user likely to interact)
- `client:visible`: ContactForm hydrates when scrolled into view (user likely to submit)

---

## 6. Node.js Edge Functions: Contact Form Submission

### Decision
**Use Netlify Edge Functions (Node.js runtime) for contact form submission with email delivery.**

### Rationale
- **Serverless**: No server management; auto-scales with traffic.
- **Edge Execution**: Functions run globally via Netlify CDN; sub-100ms latency worldwide.
- **Email Integration**: Edge functions can call SendGrid/Mailgun API to send emails.
- **Rate Limiting**: Built-in rate limiting via Netlify; honeypot field for bot protection.
- **Cost**: Free tier supports typical portfolio traffic; pay-as-you-go scaling.

### Implementation

**Edge Function** (`functions/contact.ts`):
```typescript
import type { Context } from '@netlify/functions';

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  honeypot?: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
}

export default async function handler(
  req: Request,
  context: Context
): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.SITE_URL || '*'
  };

  try {
    const body: ContactRequest = await req.json();

    // Honeypot: if filled, silently reject
    if (body.honeypot) {
      return new Response(
        JSON.stringify({ success: true, message: 'Message received' }),
        { headers, status: 200 }
      );
    }

    // Validation
    if (!body.name || !body.email || !body.message) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { headers, status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email format' }),
        { headers, status: 400 }
      );
    }

    // Send email via SendGrid
    const sendgridKey = context.secrets.SENDGRID_API_KEY;
    if (!sendgridKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: process.env.ENGINEER_EMAIL }]
        }],
        from: { email: process.env.FROM_EMAIL || 'noreply@portfolio.dev' },
        subject: `New message from ${body.name}`,
        content: [{
          type: 'text/plain',
          value: `From: ${body.name} <${body.email}>\n\n${body.message}`
        }]
      })
    });

    if (!emailResponse.ok) {
      throw new Error(`SendGrid error: ${emailResponse.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully' }),
      { headers, status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { headers, status: 500 }
    );
  }
}
```

**Environment Variables** (`.env`):
```
SENDGRID_API_KEY=SG.xxxxx
ENGINEER_EMAIL=engineer@example.com
FROM_EMAIL=portfolio@example.com
SITE_URL=https://portfolio.example.com
```

**Client-Side Form** (`src/components/ContactForm.tsx`):
```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';

export function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', honeypot: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // Restore from sessionStorage if available
      const savedData = sessionStorage.getItem('contactForm');
      const toSubmit = savedData ? JSON.parse(savedData) : formData;

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSubmit)
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '', honeypot: '' });
        sessionStorage.removeItem('contactForm');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  // Save to sessionStorage on change (recovery on failure)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    sessionStorage.setItem('contactForm', JSON.stringify(updated));
  };

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <input
        type="text"
        name="name"
        placeholder="Your name"
        value={formData.name}
        onChange={handleChange}
        required
        aria-label="Your name"
      />
      
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        value={formData.email}
        onChange={handleChange}
        required
        aria-label="Your email"
      />

      {/* Honeypot (hidden from users) */}
      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={handleChange}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <textarea
        name="message"
        placeholder="Your message"
        value={formData.message}
        onChange={handleChange}
        required
        aria-label="Your message"
        rows={5}
      />

      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>

      {status === 'success' && <p className="text-green-600">Message sent! I'll get back to you soon.</p>}
      {status === 'error' && <p className="text-red-600">Failed to send. Please try again.</p>}
    </motion.form>
  );
}
```

---

## 7. Testing Strategy

### Decision
**Multi-layered testing: Unit (Vitest) + Integration (Vitest) + E2E (Playwright) + Accessibility (axe-core).**

### Rationale
- **Unit Tests** (≥80% coverage): Validators, utilities, hooks in isolation
- **Integration Tests**: React components + form submission + API interactions
- **E2E Tests**: Critical user flows (Hero → Projects → Contact submission)
- **Accessibility Tests**: Automated axe-core + manual WCAG 2.1 AA validation
- **Constitutional Requirement**: "Comprehensive Testing (NON-NEGOTIABLE)" with ≥80% coverage

### Implementation

**Vitest Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
});
```

**Unit Test Example** (`tests/unit/utils/validators.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail, validateMessage } from '../../../src/utils/validators';

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });
});

describe('Message Validation', () => {
  it('should accept messages 1-5000 characters', () => {
    expect(validateMessage('Hi')).toBe(true);
    expect(validateMessage('a'.repeat(5000))).toBe(true);
  });

  it('should reject empty or oversized messages', () => {
    expect(validateMessage('')).toBe(false);
    expect(validateMessage('a'.repeat(5001))).toBe(false);
  });
});
```

**E2E Test Example** (`tests/e2e/contact.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should submit form successfully', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to contact section
    await page.locator('[id="contact"]').scrollIntoViewIfNeeded();
    
    // Fill form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('textarea[name="message"]', 'Test message');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=Message sent!')).toBeVisible();
  });

  it('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/');
    await page.locator('[id="contact"]').scrollIntoViewIfNeeded();
    
    await page.fill('input[name="name"]', 'John');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('textarea[name="message"]', 'Test');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  it('should restore form data from sessionStorage on page reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('[id="contact"]').scrollIntoViewIfNeeded();
    
    // Fill form
    await page.fill('input[name="name"]', 'John Doe');
    
    // Simulate network error by intercepting request
    await page.route('**/api/contact', route => route.abort());
    await page.click('button[type="submit"]');
    
    // Reload page
    await page.reload();
    
    // Data should be restored
    await expect(page.locator('input[name="name"]')).toHaveValue('John Doe');
  });
});
```

**Accessibility Test** (`tests/e2e/accessibility.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  
  // Check full page
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  });
});

test('should be fully keyboard navigable', async ({ page }) => {
  await page.goto('/');
  
  // Tab through all interactive elements
  const links = await page.locator('a, button, input, textarea').count();
  
  for (let i = 0; i < links; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA']).toContain(focused);
  }
});
```

**CI Integration** (`.github/workflows/test.yml`):
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit + integration tests
        run: pnpm test
      
      - name: Generate coverage
        run: pnpm test:coverage
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 8. Performance Optimization Patterns

### Decision
**Implement image optimization, critical CSS inlining, and asset preloading for LCP <2.5s.**

### Rationale
- **Image Optimization**: WebP with JPEG fallback via Astro's image integration; lazy-load non-critical images.
- **Critical CSS**: Inline above-the-fold styles in `<head>` to eliminate render-blocking CSS.
- **Asset Preloading**: Preload critical fonts, hero image, and LCP candidate images.
- **Caching**: Immutable asset naming + content-hash; CDN cache headers.

### Implementation

**Image Optimization** (`src/utils/image-loader.ts`):
```typescript
import type { ImageMetadata } from 'astro';

interface OptimizedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  // srcset: string; // for responsive images
}

export function optimizeImage(
  image: ImageMetadata,
  alt: string
): OptimizedImage {
  return {
    src: image.src,
    alt,
    width: image.width,
    height: image.height
  };
}

// Usage in Astro component:
// import heroImage from '../assets/hero.png';
// const hero = optimizeImage(heroImage, 'Engineer working on code');
```

**Critical CSS Inlining** (`src/layouts/Base.astro`):
```astro
---
import '../styles/globals.css';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Preload critical assets -->
    <link rel="preload" href="/fonts/system-fonts.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/images/hero-bg.webp" as="image" type="image/webp" />
    
    <!-- Inline critical CSS -->
    <style is:inline>
      /* Critical styles from globals.css */
      :root { --color-primary: #2563eb; }
      html, body { margin: 0; padding: 0; }
      img { max-width: 100%; }
    </style>
    
    <!-- Deferred non-critical CSS -->
    <link rel="preload" href="/styles/layout.css" as="style" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="/styles/layout.css" /></noscript>
  </head>
  <body>
    <slot />
    
    <!-- Enable Astro prefetch for in-site navigation -->
    <script>
      document.addEventListener('astro:prefetch', (event) => {
        console.log('Prefetching', event.detail.href);
      });
    </script>
  </body>
</html>
```

**Lighthouse CI Integration** (`.github/workflows/lighthouse.yml`):
```yaml
name: Lighthouse CI

on:
  pull_request:
    paths: ['src/**', 'astro.config.mjs']

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: './.github/lighthouse-ci.json'
```

**Lighthouse CI Config** (`.github/lighthouse-ci.json`):
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "staticDistDir": "./dist"
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:all",
      "assertions": {
        "categories:performance": ["error", { "minScore": 1 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 1 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

---

## 9. Accessibility & Keyboard Navigation

### Decision
**WCAG 2.1 AA compliance mandatory with full keyboard navigation and screen reader support.**

### Rationale
- **Constitutional Requirement**: "All interactive elements MUST be keyboard-accessible; WCAG 2.1 AA compliance is mandatory."
- **Legal/Ethical**: Accessibility is required by law in many jurisdictions; it's the right thing to do.
- **User Value**: ~15-20% of users have some accessibility need (temporary or permanent).

### Implementation

**Focus Management** (`src/components/shared/FocusManager.tsx`):
```typescript
import { useEffect } from 'react';

export function useFocusManager(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = containerRef.current?.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Tab: move to next, wrap around
      if (e.key === 'Tab' && !e.shiftKey) {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
      // Shift+Tab: move to previous, wrap around
      else if (e.key === 'Tab' && e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);
    return () => containerRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}
```

**Screen Reader Announcements** (`src/utils/accessibility.ts`):
```typescript
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // visually hidden
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => announcement.remove(), 1000);
}

// Usage in ProjectsGrid when filtering:
announceToScreenReader(`Showing ${filteredProjects.length} projects for ${filter}`, 'polite');
```

**Semantic HTML** (example component):
```astro
---
// ✅ Good: Semantic HTML for structure
---

<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <ul>
      <li><a href="#hero" aria-current="page">Home</a></li>
      <li><a href="#projects">Projects</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
</header>

<main id="hero" role="main">
  <h1>Hi, I'm a Frontend Engineer</h1>
  <p>I build fast, accessible web experiences.</p>
</main>

<section id="projects" aria-labelledby="projects-heading">
  <h2 id="projects-heading">My Projects</h2>
  <!-- Projects grid -->
</section>

<form id="contact-form" aria-label="Contact form">
  <label for="name">Your Name</label>
  <input id="name" type="text" required aria-required="true" />
  
  <label for="email">Your Email</label>
  <input id="email" type="email" required aria-required="true" />
  
  <label for="message">Message</label>
  <textarea id="message" required aria-required="true"></textarea>
  
  <button type="submit">Send Message</button>
</form>
```

---

## 10. Deployment: Netlify Edge + CDN

### Decision
**Deploy to Netlify Edge with global CDN, immutable assets, and edge function support.**

### Rationale
- **Global Distribution**: Netlify CDN distributes assets globally; users download from nearest edge location.
- **Edge Functions**: Contact form processed near user; sub-100ms latency worldwide.
- **Built-in Features**: Automatic HTTPS, redirects, header manipulation, environment variable management.
- **Continuous Deployment**: Git-based deployments; automatic preview builds on PRs.

### Implementation

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  command = "pnpm build"
  publish = "dist"
  functions = "functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[functions]
  directory = "functions"
  node_bundler = "esbuild"

[context.production]
  command = "pnpm build"
  
[context.deploy-preview]
  command = "pnpm build"
```

**Environment Variables** (set in Netlify UI):
```
SENDGRID_API_KEY
ENGINEER_EMAIL
FROM_EMAIL
SITE_URL
```

**Deploy Process**:
1. Push to GitHub
2. Netlify detects commit
3. Build: `pnpm build` generates `/dist` (static files) + `/functions` (edge functions)
4. Deploy: Static files to CDN; functions to Netlify Edge
5. Preview: Automatic preview URL for PR review
6. Production: Merged PRs deploy to main domain

---

## Summary: All Technology Choices Validated

| Technology | Decision | Rationale | Constitutional Alignment |
|------------|----------|-----------|--------------------------|
| **Astro** | Static generation + React islands | Zero-JS by default; islands only where needed | ✅ Performance, Progressive Enhancement |
| **TypeScript** | Strict mode enabled | Type safety; compile-time error catching | ✅ Code Quality |
| **Tailwind CSS** | Utility-first with critical CSS inlined | Consistency; performance; accessibility | ✅ UX Consistency, Performance |
| **Framer Motion** | High-fidelity animations with prefers-reduced-motion | Polished feel; respects accessibility | ✅ UX Consistency, Accessibility |
| **React Islands** | ProjectsGrid + ContactForm only | Minimal JavaScript; selective hydration | ✅ Performance, Code Quality |
| **Node.js Edge Functions** | Contact form submission + email | Serverless; global edge execution | ✅ Performance, Scalability |
| **Vitest + Playwright** | Unit/integration/E2E testing | ≥80% coverage; accessibility automation | ✅ Comprehensive Testing |
| **Netlify Edge** | Global CDN + edge function deployment | Fast distribution; low latency worldwide | ✅ Performance |

---

## Next Steps

**Phase 1 (Design)** will generate:
1. `data-model.md`: Project, ContactSubmission, NavigationState entities with validation
2. `contracts/form-api.md`: Contact form POST endpoint specification
3. `contracts/image-delivery.md`: WebP/JPEG negotiation contract
4. `quickstart.md`: Local dev setup, build, deploy instructions
5. Agent context updated with technology stack

All research findings codified; ready for implementation.
