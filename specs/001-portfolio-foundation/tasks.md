# Tasks: Build Portfolio Foundation

**Phase**: 2 (Implementation Task Breakdown)  
**Date**: 2026-03-04  
**Feature**: Build Portfolio Foundation (001-portfolio-foundation)  
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/

---

## Overview

This document breaks down the portfolio website implementation into granular tasks organized by user story. Each task is atomic, has clear acceptance criteria, and can be completed in 2-8 hours. Tasks are grouped by priority (P1 = MVP, P2 = Enhanced, P3 = Polish) to enable phased delivery.

---

## Format Guide

- **[ID]**: Task identifier (T001, T002, etc.)
- **[P]**: Can run in parallel (independent files/components)
- **[Story]**: Which user story (US1-US11 from spec.md)
- **[Hours]**: Estimated effort (1-8 hours typical)
- Dependencies noted where required

**Total Estimated Effort**: ~160 hours (4 weeks full-time dev)

---

## Phase 2A: Foundation Setup (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase completes

### Infrastructure & Configuration

- [x] **T001** [P] Setup Astro project structure per plan.md
  - Create directories: `src/`, `src/components/`, `src/pages/`, `src/data/`, `netlify/functions/`
  - Initialize `astro.config.mjs` with React integration
  - File: `astro.config.mjs`, `tsconfig.json`, `package.json`
  - **Hours**: 2

- [x] **T002** [P] Configure TypeScript with strict mode
  - Set `strict: true` in `tsconfig.json`
  - Configure path aliases: `@components`, `@utils`, `@hooks`, `@data`
  - Enable all strict type checking flags
  - File: `tsconfig.json`
  - **Hours**: 1

- [x] **T003** [P] Configure Tailwind CSS with design tokens
  - Define color palette (primary, secondary, background, text, borders)
  - Set typography scale (font sizes, line heights, font weights)
  - Configure spacing and sizing scales
  - Enable dark mode support (if needed)
  - File: `tailwind.config.ts`
  - **Hours**: 2

- [x] **T004** [P] Configure Framer Motion animations
  - Create animation preset file with common variants (fadeIn, slideUp, scaleIn)
  - Setup prefers-reduced-motion detection hook
  - Document animation performance guidelines
  - File: `src/hooks/useAnimation.ts`, `src/utils/animations.ts`
  - **Hours**: 2

- [x] **T005** [P] Create global CSS and CSS variables
  - Create `src/styles/globals.css` with CSS reset
  - Define CSS custom properties for colors, spacing, typography, timing
  - Setup critical CSS inlining strategy (inline in `<head>`, defer rest)
  - File: `src/styles/globals.css`, `src/styles/variables.css`
  - **Hours**: 2

- [x] **T006** [P] Configure build tools and linting
  - Setup ESLint with Astro support (eslint-plugin-astro)
  - Configure Prettier for code formatting
  - Setup TypeScript strict type checking
  - Configure npm scripts: `lint`, `format`, `type-check`
  - File: `.eslintrc.cjs`, `.prettierrc.json`, `package.json`
  - **Hours**: 2

- [x] **T007** [P] Setup testing infrastructure (Vitest + Playwright)
  - Configure Vitest for unit/integration tests
  - Configure Playwright for E2E tests
  - Setup test file patterns and include/exclude
  - Configure coverage thresholds (≥80%)
  - File: `vitest.config.ts`, `playwright.config.ts`
  - **Hours**: 2

- [x] **T008** [P] Configure environment variables and secrets
  - Create `.env.example` with all required variables
  - Setup `.env.local` for local development
  - Configure Netlify environment variables (in dashboard)
  - Document all required variables in README
  - File: `.env.example`, `.env.local`
  - **Hours**: 1

- [x] **T009** [P] Setup GitHub Actions CI/CD workflows
  - Create `test.yml`: Run tests on every PR
  - Create `build.yml`: Verify production build succeeds
  - Create `lighthouse.yml`: Lighthouse audit on production (90+ required)
  - All workflows should block merge if they fail
  - File: `.github/workflows/{test,build,lighthouse}.yml`
  - **Hours**: 3

**Checkpoint**: Foundation ready ✅ - All infrastructure in place, build succeeds, tests run

---

## Phase 2B: Data & Core Models (P1 - MVP Foundation)

### Data Layer

- [x] **T010** [P] Create projects.ts data file
  - Define 15-20 Project entities per data-model.md
  - Include technologies, categories, thumbnails, demo/repo URLs
  - Add featured flag for pin-to-top projects
  - Include validation for all required fields
  - File: `src/data/projects.ts`
  - **Hours**: 3

- [x] **T011** [P] Create technologies.ts helper file
  - Extract unique technologies from projects array
  - Extract unique categories from projects array
  - Sort alphabetically for consistent filtering
  - Export as computed lists (not hardcoded)
  - File: `src/data/technologies.ts`
  - **Hours**: 1

- [x] **T012** [P] Create navigation.ts structure
  - Define navigation menu items: Hero, Projects, About, Contact
  - Setup section IDs and scroll offsets
  - Include accessibility metadata
  - File: `src/data/navigation.ts`
  - **Hours**: 1

- [x] **T013** [P] Create validation utility functions
  - `validateName(string): string | undefined` (1-100 chars)
  - `validateEmail(string): string | undefined` (valid email format)
  - `validateMessage(string): string | undefined` (1-5000 chars)
  - All return error message or undefined if valid
  - File: `src/utils/validation.ts`
  - **Hours**: 2

- [x] **T014** [P] Create type definitions for all entities
  - `Project` interface with all fields
  - `ContactSubmission` interface
  - `NavigationState` interface
  - `ProjectsFilterState` interface
  - `FormValidationState` interface
  - File: `src/types/index.ts` or `src/env.d.ts`
  - **Hours**: 2

**Checkpoint**: Data models defined ✅ - Ready for component implementation

---

## Phase 2C: User Story 1 - Hero Section (P1 - MVP) 🎯

**Goal**: Landing hero section with smooth entrance animation and CTA

### Implementation

- [x] **T015** [P] [US1] Create Hero.astro component
  - Display large heading with tagline
  - Show brief subtitle/description
  - Include CTA button (link to Projects section)
  - Setup responsive typography (mobile-first)
  - File: `src/components/sections/Hero.astro`
  - **Hours**: 3

- [x] **T016** [P] [US1] Create Button.astro UI component
  - Reusable button with variants (primary, secondary, text)
  - Support both `<a>` and `<button>` elements
  - Handle disabled state and loading state
  - Accessible keyboard navigation
  - File: `src/components/ui/Button.astro`
  - **Hours**: 2

- [x] **T017** [P] [US1] Setup hero animations with Framer Motion
  - Hero heading fades in on page load
  - Subtitle slides up with staggered delay
  - CTA button scales in
  - All animations respect prefers-reduced-motion
  - Duration: 600ms total, easing: easeOut
  - File: `src/utils/animations.ts` (heroEntrance variant)
  - **Hours**: 2

- [x] **T018** [US1] Create BaseLayout.astro wrapper
  - Include HTML structure (`<html>`, `<head>`, `<body>`)
  - Setup critical CSS inlining in `<head>`
  - Import global styles and fonts
  - Include meta tags (viewport, charset, description)
  - Include navigation component (slot)
  - File: `src/components/layouts/BaseLayout.astro`
  - **Hours**: 3

- [x] **T019** [US1] Create index.astro homepage
  - Use BaseLayout
  - Import and render Hero section
  - Placeholder slots for Projects, About, Contact sections
  - File: `src/pages/index.astro`
  - **Hours**: 2

- [x] **T020** [P] [US1] Create hero.test.ts unit tests
  - Test hero component renders without errors
  - Test hero text content is present
  - Test CTA button links to projects section
  - Test animation configuration respects prefers-reduced-motion
  - File: `tests/unit/hero.test.ts`
  - **Hours**: 2

### Acceptance Criteria

- [ ] Hero section displays on homepage
- [ ] Heading, subtitle, and CTA visible
- [ ] Animations play on first load (600ms)
- [ ] Animations respect prefers-reduced-motion setting
- [ ] Mobile: text is responsive (no horizontal overflow)
- [ ] Lighthouse: Performance ≥95, Accessibility ≥95
- [ ] Unit tests pass (T020)

**Checkpoint**: Hero section complete ✅

---

## Phase 2D: User Story 2 - Navigation (P1 - MVP)

**Goal**: Smooth navigation between sections with active indicator

### Implementation

- [x] **T021** [P] [US2] Create Navigation.astro component
  - Display nav bar with 4 menu items (Hero, Projects, About, Contact)
  - Add active indicator (underline/highlight) for current section
  - Use section IDs from navigation.ts
  - File: `src/components/ui/Navigation.astro`
  - **Hours**: 2

- [x] **T022** [P] [US2] Create useScrollSection hook
  - Track active section as user scrolls
  - Debounce scroll events (100ms)
  - Update NavigationState on section change
  - Return { activeSection, isTransitioning, previousSection }
  - File: `src/hooks/useScrollSection.ts`
  - **Hours**: 3

- [x] **T023** [US2] Integrate navigation state with Layout
  - Wrap homepage content with scroll detection
  - Pass activeSection to Navigation component
  - Update active indicator as user scrolls
  - File: `src/components/layouts/BaseLayout.astro`
  - **Hours**: 2

- [x] **T024** [P] [US2] Setup smooth scroll behavior
  - Add CSS: `scroll-behavior: smooth;`
  - Implement anchor links with scroll offset (account for nav height)
  - Test smooth scroll works on all browsers
  - File: `src/styles/globals.css`
  - **Hours**: 1

- [x] **T025** [P] [US2] Create navigation.test.ts tests
  - Test Navigation component renders all 4 items
  - Test active indicator shows correct section
  - Test useScrollSection hook detects section change
  - Test smooth scroll works
  - File: `tests/unit/navigation.test.ts`
  - **Hours**: 2

### Acceptance Criteria

- [ ] Navigation bar visible at top of page
- [ ] All 4 sections have navigation links
- [ ] Active indicator shows current section
- [ ] Clicking nav links scrolls smoothly to section
- [ ] Active indicator updates as user scrolls
- [ ] Keyboard navigation: Tab/Enter work
- [ ] Tests pass with ≥90% coverage

**Checkpoint**: Navigation complete ✅

---

## Phase 2E: User Story 3 - Projects Grid (P1 - MVP) 🎯

**Goal**: Display all projects in responsive grid with filtering

### Implementation

- [x] **T026** [P] [US3] Create Card.astro component
  - Display project title, description, technologies (badges)
  - Show thumbnail image with lazy loading
  - Include demo/repo links if present
  - Responsive layout (1 col mobile, 2 col tablet, 3 col desktop)
  - File: `src/components/ui/Card.astro`
  - **Hours**: 3

- [x] **T027** [P] [US3] Create Badge.astro component
  - Display technology tags
  - Use Tailwind classes for styling
  - Support multiple color variants
  - Accessible: semantic HTML
  - File: `src/components/ui/Badge.astro`
  - **Hours**: 1

- [x] **T028** [US3] Create Projects.astro static section
  - Setup section structure and heading
  - Placeholder for ProjectsGrid React island
  - File: `src/components/sections/Projects.astro`
  - **Hours**: 1

- [x] **T029** [US3] Create ProjectsGrid.tsx React island
  - Import projects from src/data/projects.ts
  - Render grid of Card components
  - Include featured projects at top (sorted by featured flag)
  - Responsive grid layout (CSS Grid)
  - Hydration: `client:idle` (render after page load)
  - File: `src/components/sections/ProjectsGrid.tsx`
  - **Hours**: 3

- [x] **T030** [P] [US3] Setup image optimization pipeline
  - Create build script to optimize images (Sharp library)
  - Generate WebP + JPEG variants
  - Generate 1x and 2x variants for retina displays
  - Add content hashes to filenames
  - File: `scripts/optimize-images.ts`
  - **Hours**: 3

- [x] **T031** [P] [US3] Setup image delivery with picture elements
  - Create image utility to generate `<picture>` HTML
  - Support WebP + JPEG with media queries
  - Implement lazy loading with `loading="lazy"`
  - Add alt text requirement enforcement
  - File: `src/utils/image.ts`
  - **Hours**: 2

- [x] **T032** [P] [US3] Create projects-grid.test.tsx tests
  - Test ProjectsGrid renders all projects
  - Test cards display correct content
  - Test responsive grid layout
  - Test image optimization applied correctly
  - File: `tests/integration/projects-grid.test.tsx`
  - **Hours**: 3

### Acceptance Criteria

- [ ] All projects display in responsive grid
- [ ] Cards show title, description, technologies, thumbnail
- [ ] Demo/repo links are clickable
- [ ] Featured projects appear at top
- [ ] Images are optimized (WebP + JPEG, lazy loaded)
- [ ] Responsive: 1 col mobile, 2 col tablet, 3 col desktop
- [ ] Lighthouse: Performance ≥90 (images optimized)
- [ ] Tests pass

**Checkpoint**: Projects grid complete ✅

---

## Phase 2F: User Story 4 - Project Filtering (P3 - Polish)

**Goal**: Filter projects by technology and category

### Implementation

- [x] **T033** [P] [US4] Create FilterBar.tsx component
  - Display technology and category filter buttons
  - Track selected filters in state
  - Show count of matching projects
  - Animate filter changes
  - File: `src/components/sections/FilterBar.tsx`
  - **Hours**: 3

- [x] **T034** [US4] Integrate FilterBar with ProjectsGrid
  - Pass filtered projects to ProjectsGrid
  - Update grid when filters change
  - Show "no results" message if no matches
  - Animation on results update
  - File: `src/components/sections/ProjectsGrid.tsx` (update)
  - **Hours**: 2

- [x] **T035** [P] [US4] Create filter.test.tsx tests
  - Test FilterBar renders all technologies/categories
  - Test selecting filter updates results
  - Test multiple filters use AND logic (all required)
  - Test "no results" displays correctly
  - File: `tests/integration/filter.test.tsx`
  - **Hours**: 2

### Acceptance Criteria

- [ ] Filter buttons for all technologies
- [ ] Filter buttons for all categories
- [ ] Selected filters are visually highlighted
- [ ] Projects update when filters change
- [ ] Filter response time <500ms (SC-008)
- [ ] Keyboard accessible: Tab/Space to select
- [ ] Screen reader announces: "Showing X projects for Y"
- [ ] Tests pass

**Checkpoint**: Filtering complete ✅

---

## Phase 2G: User Story 5 - About Section (P2 - Enhanced)

**Goal**: Display engineer bio and skills

### Implementation

- [x] **T036** [US5] Create About.astro section
  - Display portrait image on left, bio on right (desktop)
  - Responsive: stack on mobile
  - Include tech stack/skills section
  - Add download resume link (optional)
  - File: `src/components/sections/About.astro`
  - **Hours**: 3

- [x] **T037** [P] [US5] Setup about section animations
  - Portrait image fades in from left
  - Bio text fades in from right
  - Staggered delays (300ms between)
  - Animations respect prefers-reduced-motion
  - File: `src/utils/animations.ts` (aboutSection variant)
  - **Hours**: 2

- [x] **T038** [P] [US5] Add about section to homepage
  - Add About.astro to index.astro
  - Include in navigation menu
  - File: `src/pages/index.astro` (update)
  - **Hours**: 1

### Acceptance Criteria

- [ ] About section displays on homepage
- [ ] Portrait image and bio visible
- [ ] Tech stack/skills displayed
- [ ] Responsive layout (side-by-side desktop, stacked mobile)
- [ ] Animations play (600ms total)
- [ ] Image is optimized and lazy-loaded
- [ ] Accessible: semantic HTML, good contrast

**Checkpoint**: About section complete ✅

---

## Phase 2H: User Story 6 - Contact Form (P1 - MVP) 🎯

**Goal**: Contact form with validation, submission, and email delivery

### Client-Side Implementation

- [x] **T039** [US6] Create ContactForm.tsx React component
  - Form with 3 fields: name, email, message
  - Include honeypot field (hidden from users)
  - Inline validation on blur
  - Show error messages only for touched fields
  - File: `src/components/sections/ContactForm.tsx`
  - **Hours**: 4

- [x] **T040** [P] [US6] Implement form state with sessionStorage
  - On every field change, save to sessionStorage
  - On page load, restore from sessionStorage
  - On successful submit, clear sessionStorage
  - Handle sessionStorage quota exceeded gracefully
  - File: `src/components/sections/ContactForm.tsx`
  - **Hours**: 2

- [x] **T041** [P] [US6] Implement form validation logic
  - Import validation functions from src/utils/validation.ts
  - Validate name: 1-100 chars (no HTML)
  - Validate email: RFC 5322 compliant format
  - Validate message: 1-5000 chars (no HTML)
  - Show inline errors (only if touched)
  - File: `src/components/sections/ContactForm.tsx`
  - **Hours**: 2

- [x] **T042** [P] [US6] Setup form submission to /api/contact
  - POST request with form data (name, email, message, honeypot)
  - Show loading state during submission
  - Show success message on 200 OK
  - Show error message on 400/429/500
  - Preserve form data in sessionStorage if submission fails
  - File: `src/components/sections/ContactForm.tsx`
  - **Hours**: 3

- [x] **T043** [P] [US6] Create useFormValidation hook
  - Manage form state (values, errors, touched)
  - Handle field changes and blurs
  - Validate all fields
  - Return { fields, errors, touched, setField, handleBlur, isValid }
  - File: `src/hooks/useFormValidation.ts`
  - **Hours**: 3

- [x] **T044** [US6] Create Contact.astro section
  - Setup section structure and heading
  - Render ContactForm.tsx as React island
  - Hydration: `client:visible` (render when visible in viewport)
  - File: `src/components/sections/Contact.astro`
  - **Hours**: 1

- [x] **T045** [P] [US6] Add contact form animations
  - Form fades in on scroll
  - Input fields slide up with staggered delays
  - Submit button scales in
  - Success message animates in (bounce)
  - File: `src/utils/animations.ts` (contactFormVariants)
  - **Hours**: 2

- [x] **T046** [P] [US6] Create form-validation.test.tsx tests
  - Test form renders with 3 fields
  - Test validation on blur
  - Test error messages show only when touched
  - Test sessionStorage save/restore
  - Test form submission
  - File: `tests/integration/contact-form.test.tsx`
  - **Hours**: 3

### Server-Side Implementation

- [x] **T047** [US6] Create Netlify Edge Function for contact form
  - Extract client IP from `x-forwarded-for` header
  - Validate all fields (name, email, message)
  - Check honeypot field (silent rejection if filled)
  - Implement rate limiting (3 submissions/hour per IP)
  - Generate ContactSubmission with UUID and timestamp
  - Return 200/400/429 responses per contract
  - File: `netlify/functions/contact.ts`
  - **Hours**: 4

- [x] **T048** [P] [US6] Implement email sending via SendGrid
  - Initialize SendGrid client with API key
  - Create email template with submission details
  - Send email to ENGINEER_EMAIL with replyTo header
  - Implement retry logic (3 retries, exponential backoff)
  - Fallback to database/S3 log if SendGrid fails
  - File: `netlify/functions/contact.ts` (or separate utils/email.ts)
  - **Hours**: 3

- [x] **T049** [P] [US6] Implement rate limiting logic
  - Check KV store for submission count per IP
  - Max 3 submissions per IP per hour
  - Return 429 Too Many Requests if limit exceeded
  - TTL: 1 hour for rate limit counter
  - File: `netlify/functions/contact.ts`
  - **Hours**: 2

- [x] **T050** [P] [US6] Implement honeypot detection
  - Check honeypot field value (should be empty)
  - If filled: return 200 OK (silent rejection - don't reveal detection)
  - Don't send email to honeypot submissions
  - Log honeypot attempts (optional, for monitoring)
  - File: `netlify/functions/contact.ts`
  - **Hours**: 1

- [x] **T051** [P] [US6] Setup CORS headers for contact endpoint
  - Allow POST requests from configured domain
  - Allow Content-Type: application/json
  - Set secure headers (X-Content-Type-Options, etc.)
  - File: `netlify.toml` or `netlify/functions/contact.ts`
  - **Hours**: 1

- [x] **T052** [P] [US6] Create contact form E2E tests
  - Test valid submission succeeds
  - Test missing email shows error
  - Test invalid email shows error
  - Test honeypot filled = silent success (no email)
  - Test rate limit: 4th submission within 1 hour returns 429
  - Test form data recovers from sessionStorage on failure
  - File: `tests/e2e/contact-form.spec.ts`
  - **Hours**: 4

### Acceptance Criteria

- [ ] Contact form visible on homepage
- [ ] 3 fields (name, email, message) with labels
- [ ] Inline validation on blur
- [ ] Error messages show only for touched fields
- [ ] Honeypot field hidden from users
- [ ] Form data persists in sessionStorage
- [ ] Submit button disabled during submission
- [ ] Success message: "Thank you! I'll get back to you soon."
- [ ] Error message if submission fails, with retry option
- [ ] Email arrives within 5 minutes
- [ ] Rate limiting: max 3/hour per IP
- [ ] Tests pass (form + E2E)

**Checkpoint**: Contact form complete ✅

---

## Phase 2I: User Story 7 - Keyboard Navigation (P1 - MVP)

**Goal**: Full keyboard support for all interactions

### Implementation

- [x] **T053** [P] [US7] Add keyboard support to Navigation
  - Tab key navigates through nav items
  - Enter/Space activates nav link
  - Arrow keys move focus between items
  - Home/End jump to first/last item
  - File: `src/components/ui/Navigation.astro`
  - **Hours**: 2

- [x] **T054** [P] [US7] Add keyboard support to Filter buttons
  - Tab key navigates through filter buttons
  - Space/Enter toggles filter selection
  - Visual focus indicator visible
  - File: `src/components/sections/FilterBar.tsx`
  - **Hours**: 2

- [x] **T055** [P] [US7] Add keyboard support to Contact form
  - Tab key navigates through form fields
  - Enter submits form (when all fields valid)
  - Shift+Tab goes to previous field
  - Label clicks focus corresponding input
  - File: `src/components/sections/ContactForm.tsx`
  - **Hours**: 2

- [x] **T056** [P] [US7] Add focus indicators to all interactive elements
  - Add CSS `:focus` and `:focus-visible` styles
  - Use contrasting color (≥3:1 ratio)
  - Test with keyboard only (no mouse)
  - File: `src/styles/globals.css`
  - **Hours**: 1

- [x] **T057** [P] [US7] Create keyboard navigation tests
  - Test Tab/Shift+Tab navigate all elements
  - Test Enter/Space activate buttons/links
  - Test focus indicators visible
  - Test arrow keys work in menus
  - File: `tests/e2e/keyboard-navigation.spec.ts`
  - **Hours**: 3

### Acceptance Criteria

- [ ] All interactive elements reachable by Tab
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Focus indicators visible and contrasting
- [ ] All functionality accessible via keyboard
- [ ] No keyboard traps (Tab can always move forward)
- [ ] Tests pass

**Checkpoint**: Keyboard navigation complete ✅

---

## Phase 2J: User Story 8 - Screen Reader Support (P1 - MVP)

**Goal**: Full accessibility for screen reader users

### Implementation

- [x] **T058** [P] [US8] Add semantic HTML structure
  - Use proper heading hierarchy (h1, h2, h3)
  - Use section elements with aria-label if needed
  - Use nav element for navigation
  - Use main element for main content
  - Use form element for contact form
  - File: All .astro and .tsx files
  - **Hours**: 2

- [x] **T059** [P] [US8] Add alt text to all images
  - All images have descriptive alt text (1-120 chars)
  - Decorative images have `alt=""` + `role="presentation"`
  - Alt text describes content/purpose, not "image"
  - File: All components with `<img>` or `<picture>`
  - **Hours**: 1

- [x] **T060** [P] [US8] Add ARIA labels and descriptions
  - Add aria-label to icon buttons
  - Add aria-describedby to form fields with errors
  - Add aria-live="polite" to success/error messages
  - Add aria-current="page" to active nav link
  - File: UI components and interactive elements
  - **Hours**: 2

- [x] **T061** [P] [US8] Add screen reader announcements
  - Announce when new projects load after filtering
  - Announce form validation errors
  - Announce successful form submission
  - Announce section navigation changes
  - File: `src/utils/announcements.ts`, components
  - **Hours**: 2

- [x] **T062** [P] [US8] Create accessibility audit tests with axe-core
  - Use axe-core to scan for violations
  - Check color contrast (≥4.5:1 normal, ≥3:1 large)
  - Check form labels associated with inputs
  - Check heading hierarchy
  - File: `tests/e2e/accessibility.spec.ts`
  - **Hours**: 3

### Acceptance Criteria

- [ ] All elements have semantic HTML
- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] All form errors have aria-describedby
- [ ] Screen reader announces dynamic content changes
- [ ] axe-core audit: 0 violations, 0 warnings
- [ ] WCAG 2.1 AA compliant
- [ ] Tests pass

**Checkpoint**: Screen reader support complete ✅

---

## Phase 2K: User Story 9 - Image Optimization (P2 - Enhanced)

**Goal**: Optimized images for performance

### Implementation

- [x] **T063** [P] [US9] Optimize images with WebP + JPEG
  - Convert all PNG/JPG to WebP (quality 80)
  - Create JPEG fallback (quality 85)
  - Create 1x and 2x variants for retina displays
  - Add content hashes to filenames
  - File: `scripts/optimize-images.ts`
  - **Hours**: 2

- [x] **T064** [P] [US9] Implement responsive image sizing
  - Use `<picture>` element with media queries
  - Mobile: 300-600px width
  - Tablet: 600-1200px width
  - Desktop: 1200-1920px width
  - File: `src/utils/image.ts`
  - **Hours**: 2

- [x] **T065** [P] [US9] Implement lazy loading
  - Add `loading="lazy"` to below-fold images
  - Use `loading="eager"` for above-fold images
  - Implement loading placeholders (blur-up or skeleton)
  - File: Components with images
  - **Hours**: 2

- [x] **T066** [P] [US9] Preload critical images
  - Preload hero background image
  - Preload first 3 project thumbnails
  - Add `<link rel="preload">` in `<head>`
  - File: `src/components/layouts/BaseLayout.astro`
  - **Hours**: 1

- [x] **T067** [P] [US9] Create image optimization tests
  - Test all images are WebP or JPEG format
  - Test file sizes are within limits (<100KB WebP, <120KB JPEG)
  - Test srcSet attributes are correct
  - Test lazy loading attribute applied
  - File: `tests/integration/image-optimization.test.ts`
  - **Hours**: 2

### Acceptance Criteria

- [ ] All images served as WebP (modern browsers)
- [ ] JPEG fallback for older browsers
- [ ] Images sized responsively (3 breakpoints)
- [ ] Below-fold images lazy-loaded
- [ ] File sizes optimized (<100KB WebP, <120KB JPEG)
- [ ] Lighthouse Performance ≥95

**Checkpoint**: Image optimization complete ✅

---

## Phase 2L: User Story 10 - Responsive Design (P1 - MVP)

**Goal**: Perfect layout on all device sizes (mobile, tablet, desktop)

### Implementation

- [x] **T068** [P] [US10] Design mobile layout (<640px)
  - Single column layout
  - Stacked sections
  - Large touch targets (≥48x48px)
  - Readable font sizes (≥16px on inputs)
  - File: `tailwind.config.ts`, component styles
  - **Hours**: 3

- [x] **T069** [P] [US10] Design tablet layout (640px-1024px)
  - 2-column grid for projects
  - Optimized spacing
  - Adjusted typography
  - File: `tailwind.config.ts`, component styles
  - **Hours**: 2

- [x] **T070** [P] [US10] Design desktop layout (>1024px)
  - 3-column grid for projects
  - Sidebar navigation (optional)
  - Optimal line lengths (50-75 chars)
  - Optimized whitespace
  - File: `tailwind.config.ts`, component styles
  - **Hours**: 2

- [x] **T071** [P] [US10] Test responsive layout across devices
  - Test on iPhone 12/14/15 (375px, 390px, 430px)
  - Test on iPad (768px, 834px, 1024px)
  - Test on desktop (1440px, 1920px)
  - No horizontal scrolling (viewport width)
  - No layout shifts (CLS <0.1)
  - File: `tests/e2e/responsive.spec.ts`
  - **Hours**: 3

### Acceptance Criteria

- [ ] Mobile: 1 column, readable text, large touch targets
- [ ] Tablet: 2 column grid, optimized spacing
- [ ] Desktop: 3 column grid, optimal line lengths
- [ ] No horizontal overflow on any device
- [ ] Lighthouse: Mobile ≥90 Performance
- [ ] CLS <0.1 (no layout jank)
- [ ] All tests pass

**Checkpoint**: Responsive design complete ✅

---

## Phase 2M: User Story 11 - Motion Preferences (P3 - Polish)

**Goal**: Respect prefers-reduced-motion setting

### Implementation

- [x] **T072** [P] [US11] Create prefers-reduced-motion hook
  - Detect user's motion preference
  - Return boolean: shouldReduceMotion
  - Update on setting change (listener for media query)
  - File: `src/hooks/useReducedMotion.ts`
  - **Hours**: 2

- [x] **T073** [P] [US11] Update all animations to respect preference
  - Hero entrance: duration 0ms if reduced-motion
  - Filter updates: no animation if reduced-motion
  - Form submission: no bounce animation if reduced-motion
  - Scroll animations: disabled if reduced-motion
  - File: All animation utilities and components
  - **Hours**: 3

- [x] **T074** [P] [US11] Add CSS media query for reduced motion
  - Add `@media (prefers-reduced-motion: reduce)` rules
  - Disable all CSS animations
  - Disable CSS transitions
  - Keep layout/functionality intact
  - File: `src/styles/globals.css`
  - **Hours**: 1

- [x] **T075** [P] [US11] Create prefers-reduced-motion tests
  - Test animations disabled when preference set
  - Test layout/functionality works without animations
  - Test CSS transitions disabled
  - File: `tests/integration/motion-preference.test.ts`
  - **Hours**: 2

### Acceptance Criteria

- [ ] Animations disabled when prefers-reduced-motion set
- [ ] Layout and functionality work without animations
- [ ] CSS transitions disabled for reduced motion
- [ ] All animations use hook to check preference
- [ ] Tests pass

**Checkpoint**: Motion preferences complete ✅

---

## Phase 2N: Performance & Optimization (P1 - MVP)

**Goal**: Meet all performance targets (LCP <2.5s, CLS <0.1, Lighthouse 100)

### Implementation

- [x] **T076** [P] Create critical CSS inlining strategy
  - Identify critical styles (above-fold)
  - Inline ~2KB of critical CSS in `<head>`
  - Defer non-critical CSS via `media="print"` technique
  - File: Build script, `src/components/layouts/BaseLayout.astro`
  - **Hours**: 2

- [x] **T077** [P] Implement font loading strategy
  - Use `font-display: swap` for web fonts
  - Preload critical fonts (Heading, Body)
  - Avoid font file downloads where possible
  - File: `src/components/layouts/BaseLayout.astro`
  - **Hours**: 1

- [x] **T078** [P] Minimize JavaScript bundle
  - Remove unused dependencies
  - Tree-shake React (only use in islands)
  - Code-split by route
  - File: `astro.config.mjs`, `tsconfig.json`
  - **Hours**: 2

- [x] **T079** [P] Add preload/prefetch directives
  - Preload critical images (hero, first project thumbnails)
  - Prefetch next page (if using multi-page)
  - Preconnect to third-party domains (SendGrid)
  - File: `src/components/layouts/BaseLayout.astro`
  - **Hours**: 1

- [x] **T080** [P] Setup Lighthouse CI
  - Configure Lighthouse CI in GitHub Actions
  - Set pass/fail thresholds: 90+ on all categories
  - Block merge if Lighthouse fails
  - File: `.github/workflows/lighthouse.yml`, `lighthouserc.json`
  - **Hours**: 2

- [x] **T081** [P] Create performance audit tests
  - Test LCP <2.5s on 4G mobile (Lighthouse)
  - Test CLS <0.1 (no layout shifts)
  - Test FID <100ms
  - Test Total Blocking Time <150ms
  - File: `tests/e2e/performance.spec.ts` (with Lighthouse)
  - **Hours**: 2

### Acceptance Criteria

- [ ] LCP <2.5s (4G mobile)
- [ ] CLS <0.1 (no jank)
- [ ] FID <100ms
- [ ] Lighthouse 100 across all categories (Performance, Accessibility, Best Practices, SEO)
- [ ] Bundle size <100KB (gzipped)
- [ ] Tests pass

**Checkpoint**: Performance targets met ✅

---

## Phase 2O: Accessibility & WCAG Compliance (P1 - MVP)

**Goal**: WCAG 2.1 AA compliance

### Implementation

- [x] **T082** [P] Ensure color contrast meets WCAG AA
  - Test all text/background combinations
  - Min 4.5:1 for normal text
  - Min 3:1 for large text (18pt+ or 14pt+ bold)
  - Run axe-core audit
  - File: All components, tailwind.config.ts
  - **Hours**: 2

- [x] **T083** [P] Ensure all form fields labeled
  - Every input has associated label
  - Label text meaningful (not "Field")
  - Error messages linked via aria-describedby
  - File: `src/components/sections/ContactForm.tsx`
  - **Hours**: 1

- [x] **T084** [P] Ensure heading hierarchy
  - Page has only one h1
  - Headings are sequential (h1 → h2 → h3)
  - Headings describe content
  - File: All .astro components
  - **Hours**: 1

- [x] **T085** [P] Ensure page title and lang attribute
  - Page title is descriptive (Portfolio - Jane Developer)
  - lang attribute set to "en" on `<html>`
  - File: `src/components/layouts/BaseLayout.astro`
  - **Hours**: 1

- [x] **T086** [P] Run full axe-core accessibility audit
  - 0 violations (errors)
  - 0 warnings
  - All best practices followed
  - Generate accessibility report
  - File: `tests/e2e/full-accessibility.spec.ts`
  - **Hours**: 2

### Acceptance Criteria

- [ ] Color contrast ≥4.5:1 for all text
- [ ] All form fields have labels
- [ ] Heading hierarchy is correct
- [ ] Page has h1 and lang attribute
- [ ] axe-core: 0 violations, 0 warnings
- [ ] WCAG 2.1 AA compliant
- [ ] Tests pass

**Checkpoint**: WCAG compliance achieved ✅

---

## Phase 2P: Deployment & Monitoring (P2 - Enhanced)

**Goal**: Deploy to production and monitor health

### Implementation

- [x] **T087** Create production build script
  - Run `npm run build`
  - Verify output in dist/
  - Run Lighthouse audit
  - File: `.github/workflows/build.yml`
  - **Hours**: 1

- [x] **T088** Configure Netlify deployment
  - Connect GitHub repository
  - Set build command: `npm run build`
  - Set publish directory: `dist/`
  - Set environment variables (SENDGRID_API_KEY, etc.)
  - File: `netlify.toml`
  - **Hours**: 2

- [ ] **T089** Setup error monitoring (optional)
  - Configure Sentry integration
  - Capture JavaScript errors
  - Monitor API errors from contact form
  - File: `src/utils/sentry.ts`, netlify.toml
  - **Hours**: 2

- [ ] **T090** Setup analytics (optional)
  - Add Google Analytics or Plausible
  - Track page views, form submissions
  - Monitor user engagement
  - File: `src/components/layouts/BaseLayout.astro`
  - **Hours**: 1

- [x] **T091** Create deployment verification checklist
  - Verify homepage loads
  - Verify all sections scroll correctly
  - Verify contact form works (send test email)
  - Verify Lighthouse score ≥90
  - Verify mobile layout works
  - Verify keyboard navigation works
  - File: `docs/deployment-checklist.md`
  - **Hours**: 1

### Acceptance Criteria

- [ ] Build succeeds with 0 errors
- [ ] Production deployment live at custom domain
- [ ] All user stories functional in production
- [ ] Lighthouse ≥90 on production build
- [ ] Contact form emails arrive
- [ ] Error monitoring configured (optional)
- [ ] Analytics configured (optional)

**Checkpoint**: Deployment complete ✅

---

## Phase 2Q: Documentation & Handoff (P2 - Enhanced)

**Goal**: Complete documentation for team/future maintenance

### Implementation

- [x] **T092** Create comprehensive README
  - Project overview
  - Tech stack and versions
  - Development setup instructions
  - Build and deployment commands
  - File: `README.md`
  - **Hours**: 2

- [x] **T093** Create architecture documentation
  - Astro + React islands architecture
  - Data model diagram
  - API contract summary
  - Image optimization strategy
  - File: `docs/ARCHITECTURE.md`
  - **Hours**: 2

- [x] **T094** Create component documentation
  - List all components (Astro + React)
  - Document props/interfaces
  - Show usage examples
  - Document patterns (islands, styling)
  - File: `docs/COMPONENTS.md`
  - **Hours**: 2

- [x] **T095** Create deployment documentation
  - Environment variables reference
  - Netlify configuration explained
  - GitHub Actions CI/CD explained
  - Monitoring and rollback procedures
  - File: `docs/DEPLOYMENT.md`
  - **Hours**: 2

- [x] **T096** Create contributing guidelines
  - How to add new projects
  - How to modify styles
  - Testing requirements
  - Code style guidelines
  - File: `CONTRIBUTING.md`
  - **Hours**: 2

### Acceptance Criteria

- [ ] README complete with setup instructions
- [ ] Architecture documented
- [ ] All components documented
- [ ] Deployment procedures documented
- [ ] Contributing guidelines clear
- [ ] Code is clean and well-commented

**Checkpoint**: Documentation complete ✅

---

## Implementation Order (Recommended)

### Week 1: Foundation + Hero + Navigation
1. Phase 2A: Foundation (T001-T009) - 2 days
2. Phase 2B: Data models (T010-T014) - 1 day
3. Phase 2C: Hero section (T015-T020) - 2 days
4. Phase 2D: Navigation (T021-T025) - 1 day

### Week 2: Projects Grid + Contact Form (Part 1)
5. Phase 2E: Projects grid (T026-T032) - 3 days
6. Phase 2H: Contact form client (T039-T046) - 2 days

### Week 3: Contact Form (Part 2) + About + Filtering
7. Phase 2H: Contact form server (T047-T052) - 2 days
8. Phase 2G: About section (T036-T038) - 1 day
9. Phase 2F: Filtering (T033-T035) - 1 day
10. Phase 2I: Keyboard navigation (T053-T057) - 2 days

### Week 4: Accessibility + Optimization + Deployment
11. Phase 2J: Screen reader support (T058-T062) - 2 days
12. Phase 2K: Image optimization (T063-T067) - 1 day
13. Phase 2L: Responsive design (T068-T071) - 2 days
14. Phase 2M: Motion preferences (T072-T075) - 1 day
15. Phase 2N: Performance (T076-T081) - 1 day
16. Phase 2O: Accessibility audit (T082-T086) - 1 day
17. Phase 2P: Deployment (T087-T091) - 1 day
18. Phase 2Q: Documentation (T092-T096) - 1 day

---

## Task Summary

**Total Tasks**: 96 implementation tasks  
**Estimated Effort**: ~160 hours (4 weeks full-time development)  
**Parallel Tasks**: ~40% of tasks can run in parallel  
**Critical Path**: Foundation → Data Models → Hero → Projects → Contact Form → Testing/Optimization  

**By Priority**:
- **P1 (MVP - 20 days)**: Hero, Navigation, Projects, Contact Form, Keyboard Nav, Screen Reader, Responsive, Performance
- **P2 (Enhanced - 8 days)**: About, Image Optimization, Deployment, Documentation
- **P3 (Polish - 4 days)**: Filtering, Motion Preferences

---

## Acceptance & Deployment Criteria

### Pre-Deployment Checklist

- [ ] All 96 tasks complete
- [ ] All tests passing (127+ tests, ≥80% coverage)
- [ ] Lighthouse 100 (Performance, Accessibility, Best Practices, SEO)
- [ ] WCAG 2.1 AA compliant (axe-core: 0 violations)
- [ ] Manual testing: all user stories functional
- [ ] Mobile: tested on 375px, 390px, 430px viewports
- [ ] Keyboard: all interactive elements keyboard accessible
- [ ] Screen reader: tested with NVDA/JAWS/VoiceOver
- [ ] Contact form: test email received
- [ ] Image optimization: all images WebP + JPEG, <100KB/120KB
- [ ] Performance: LCP <2.5s, CLS <0.1, FID <100ms

### Post-Deployment Checklist

- [ ] Production site loads correctly
- [ ] All sections visible and functional
- [ ] Contact form works (send test email)
- [ ] Lighthouse score ≥90 on production
- [ ] Mobile layout correct (tested on real device)
- [ ] Error monitoring alerts configured
- [ ] Analytics tracking enabled
- [ ] DNS propagated (if custom domain)
- [ ] SSL certificate valid
- [ ] Monitoring dashboard set up

---

## Phase 2 Complete ✅

All 96 tasks defined with:
- Clear acceptance criteria
- Estimated effort (1-4 hours typical)
- Task dependencies documented
- Test coverage included
- Phased delivery plan (P1/P2/P3)

**Ready for Phase 3: Implementation** 

Start with Week 1 tasks (Foundation + Hero + Navigation = ~6 days).
