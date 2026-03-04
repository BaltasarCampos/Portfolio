# Implementation Plan: Build Portfolio Foundation

**Branch**: `001-portfolio-foundation` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-portfolio-foundation/spec.md`

## Summary

Build a fast, accessible personal portfolio website for a frontend engineer with four main sections (Hero, Projects, About, Contact). The site must be fully keyboard navigable, mobile-first responsive, performant (LCP <2.5s, CLS <0.1), and meet WCAG 2.1 AA accessibility standards. Contact form submissions send emails directly to engineer with rate limiting + honeypot spam protection. Project filtering updates grid in real-time with 500ms response. Built with Astro (zero-JS by default) for static generation, TypeScript for type safety, Tailwind for styling, and React islands with Framer Motion for high-fidelity animations that respect prefers-reduced-motion.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode required)  
**Framework**: Astro 4.x (static site generation with selective React island hydration)  
**Component Runtime**: React 18+ (islands-based hydration via Astro directives for Framer Motion components only)  
**Styling**: Tailwind CSS 3.x (utility-first, mobile-first, critical CSS inlined, deferred non-critical CSS)  
**Animations**: Framer Motion 10.x (high-fidelity React animations with built-in prefers-reduced-motion support)  
**Backend/API**: Node.js edge functions (Netlify Edge Functions for contact form email submission)  
**Email Service**: Third-party email service (SendGrid, Mailgun, or equivalent for SMTP relay)  
**Deployment Platform**: Netlify Edge (global CDN distribution, edge function support, immutable cache headers)  
**Static Hosting**: CDN with stale-while-revalidate cache strategy  
**Testing**: Vitest (unit/integration), Playwright (E2E/accessibility), axe-core (automated accessibility audits)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) last 2 major versions; mobile-first (320px+)
**Project Type**: Static site (Astro) with dynamic contact form and client-side project filtering via React islands  
**Performance Goals**: LCP <2.5s (4G mobile), CLS <0.1, First Input Delay <100ms, Lighthouse 100 all categories, 500ms filter response  
**Constraints**: Zero render-blocking resources, critical CSS inlined, all assets immutable + content-hash filenames, no horizontal scroll any viewport, 48px touch targets, 16px text size minimum, full keyboard nav, prefers-reduced-motion support  
**Scale/Scope**: Single-page portfolio, ~10-20 projects, 4 main sections, 100% keyboard accessible, all screen sizes to 1920px+

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Code Quality Excellence ✅

- **TypeScript strict mode**: Enforced in `tsconfig.json` with `strict: true`
- **Linting**: ESLint + Prettier with airbnb-typescript config
- **Cyclomatic complexity**: Max 10 per function via eslint-plugin-complexity
- **JSDoc requirements**: All exported functions must have JSDoc type annotations
- **DRY principle**: Component library pattern via Astro components; reusable utilities
- **Code review requirement**: Enforced via branch protection rules

### Comprehensive Testing ✅

- **Unit test coverage**: ≥80% via Vitest for utilities, components, API handlers
- **Integration tests**: Vitest for component interactions, Framer Motion state changes
- **E2E tests**: Playwright for critical user flows (Hero → Projects → Contact form submission)
- **Performance tests**: Lighthouse CI integration; blocks merge on regressions
- **Accessibility tests**: axe-core automated checks in E2E tests; manual WCAG 2.1 AA validation
- **Test naming**: BDD-style names (e.g., `should_filter_projects_by_technology_within_500ms`)

### User Experience Consistency ✅

- **Design language**: Tailwind design tokens; semantic color system, spacing scale, typography
- **UX patterns**: Component library enforces consistent buttons, forms, navigation, error states
- **Error messages**: Inline validation feedback; user-friendly, actionable messages
- **Keyboard accessibility**: Every interactive element tab-reachable; focus indicators clear
- **Response time**: Contact form <3s; filter response <500ms; hero load <1s
- **WCAG 2.1 AA**: Mandatory; Lighthouse Accessibility 100; axe audits in CI
- **prefers-reduced-motion**: Enforced at component level; no animations without permission

### Performance Optimization ✅

- **Rendering**: Framer Motion optimized; 60 FPS animations via browser primitives
- **LCP target**: <2.5s via Astro static generation + critical CSS inlining + image optimization
- **CLS target**: <0.1 via aspect ratio reservations, skeleton screens, no late-injected content
- **API response time**: Contact form <3s via edge functions; stale-while-revalidate strategy
- **Bundle size**: Tree-shake Framer Motion; Astro zero-JS baseline; lazy-load React islands
- **Caching**: Immutable asset filenames + content hash; edge function SWR; global CDN distribution
- **Memory**: No memory leaks; proper cleanup of event listeners and timers in React islands

---

### Gate Verdict: ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-portfolio-foundation/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (dependency & pattern research)
├── data-model.md        # Phase 1 output (entities, validation rules, state)
├── contracts/           # Phase 1 output (form API contract, edge function specs)
├── quickstart.md        # Phase 1 output (local dev setup, build & deploy)
├── spec.md              # Original specification
├── checklists/
│   └── requirements.md  # Quality validation checklist
└── tasks.md             # Phase 2 output (task breakdown - created by /speckit.tasks)
```

### Source Code (repository root) - Astro + React Islands Architecture

```text
portfolio-site/
├── src/
│   ├── layouts/
│   │   └── Base.astro          # Root layout with critical CSS, preload links, meta tags
│   │
│   ├── pages/
│   │   ├── index.astro          # Home page with Hero, Projects, About, Contact sections
│   │   └── api/
│   │       └── contact.ts       # Edge function: Contact form submission handler
│   │
│   ├── components/
│   │   ├── Hero.astro           # Hero section (static, zero-JS)
│   │   ├── ProjectsGrid.tsx      # Projects grid with filtering (React island)
│   │   ├── ProjectCard.astro     # Individual project card (static)
│   │   ├── About.astro          # About section (static)
│   │   ├── ContactForm.tsx       # Contact form with validation (React island)
│   │   ├── Navigation.astro      # Navigation bar with active state (static)
│   │   │
│   │   └── shared/
│   │       ├── Button.tsx       # Reusable button component (with Framer Motion)
│   │       ├── Input.tsx        # Form input with validation feedback
│   │       ├── ErrorMessage.tsx # Form error display
│   │       ├── SkeletonLoader.tsx # Loading state during transitions
│   │       └── FocusManager.tsx  # Keyboard focus management utility
│   │
│   ├── hooks/
│   │   ├── useProjectFilter.ts   # Stateful filtering logic (server-side state)
│   │   ├── useFormValidation.ts  # Form validation with error tracking
│   │   └── useSessionStorage.ts  # sessionStorage persistence for form data
│   │
│   ├── animations/
│   │   ├── heroEntrance.ts       # Framer Motion variants for hero animations
│   │   ├── sectionTransition.ts  # Page section fade/slide animations
│   │   ├── filterTransition.ts   # Grid update animation
│   │   └── formFeedback.ts       # Success/error message animations
│   │
│   ├── styles/
│   │   ├── globals.css          # Tailwind directives, custom properties, critical styles
│   │   ├── layout.css           # Grid/flexbox utilities (deferred)
│   │   └── typography.css       # Font stack, text scales (deferred)
│   │
│   ├── utils/
│   │   ├── types.ts             # Shared TypeScript types (Project, ContactSubmission, etc.)
│   │   ├── constants.ts         # Config, endpoints, validation rules
│   │   ├── validators.ts        # Email validation, message length checks
│   │   ├── image-loader.ts      # Image optimization, WebP/JPEG fallback logic
│   │   ├── accessibility.ts     # Screen reader announcements, ARIA utilities
│   │   └── performance.ts       # Intersection observer setup, image lazy loading
│   │
│   └── data/
│       └── projects.ts          # Project data (to be populated by engineer)
│
├── functions/
│   └── contact.ts               # Netlify Edge Function wrapper (production deployment)
│
├── public/
│   ├── images/
│   │   ├── hero-bg/             # Hero background images (WebP + JPEG)
│   │   └── projects/            # Project thumbnails (WebP + JPEG)
│   └── fonts/
│       └── system-fonts         # Preload critical system fonts
│
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── validators.test.ts
│   │   │   └── image-loader.test.ts
│   │   └── hooks/
│   │       ├── useProjectFilter.test.ts
│   │       └── useFormValidation.test.ts
│   │
│   ├── integration/
│   │   ├── ProjectsGrid.test.tsx     # React component rendering + filtering
│   │   ├── ContactForm.test.tsx      # Form validation, submission flow
│   │   └── api/
│   │       └── contact.test.ts       # Edge function response handling
│   │
│   └── e2e/
│       ├── hero.spec.ts        # Hero section entrance, CTA navigation
│       ├── projects.spec.ts    # Project grid display, filtering, keyboard nav
│       ├── about.spec.ts       # About section content, CV link
│       ├── contact.spec.ts     # Form submission, validation, success/error states
│       ├── keyboard-nav.spec.ts # Full keyboard navigation through all sections
│       └── accessibility.spec.ts # axe-core automated + WCAG 2.1 AA manual checks
│
├── .github/
│   └── workflows/
│       ├── test.yml            # Run unit + integration tests on PR
│       ├── e2e.yml             # Run Playwright tests on PR
│       ├── lighthouse.yml       # Run Lighthouse audit on preview deploy
│       └── accessibility.yml    # Run axe-core accessibility audit on PR
│
├── astro.config.mjs            # Astro configuration (image optimization, MDX, integrations)
├── tsconfig.json               # TypeScript strict mode enabled
├── tailwind.config.ts          # Tailwind design tokens, custom utilities
├── vitest.config.ts            # Vitest unit test configuration
├── playwright.config.ts        # Playwright E2E configuration
├── eslint.config.js            # ESLint + Prettier + airbnb-typescript
├── package.json                # Dependencies: astro, react, framer-motion, tailwindcss, etc.
├── pnpm-lock.yaml              # Dependency lock file (pnpm for performance)
└── README.md                   # Developer setup, local dev, CI/CD, deployment
```

**Structure Decision**: Astro + React Islands pattern selected because:
- **Astro handles static generation**: Hero, Projects, About, Navigation rendered at build time with zero JavaScript shipped by default
- **React islands for interactivity**: Only ProjectsGrid (filtering logic) and ContactForm (validation, async submission) are React components, hydrated on demand
- **Framer Motion as React dependency**: Imported only in React island components that need high-fidelity animations; tree-shaken in non-animated sections
- **Performance-first default**: No JavaScript overhead; progressive enhancement via islands
- **Scalability**: Easy to add more React islands later (e.g., testimonials, dark mode toggle) without restructuring

---

## Complexity Tracking

No constitutional violations detected. Design maintains code quality, performance budgets, and accessibility standards as required.

## Next Steps

**Phase 0 (Research)**: Research.md will document:
- Astro best practices for portfolio sites + image optimization
- Framer Motion patterns for prefers-reduced-motion support
- TypeScript strict mode setup + eslint-plugin-complexity configuration
- Netlify Edge Functions + Node.js contact form implementation
- Vitest + Playwright setup for comprehensive testing

**Phase 1 (Design)**: Will generate:
- `data-model.md`: Project entity, ContactSubmission shape, NavigationState
- `contracts/form-api.md`: Contact form POST endpoint specification
- `contracts/image-delivery.md`: WebP/JPEG image format negotiation
- `quickstart.md`: Local dev environment setup, build & deploy

**Phase 2 (Tasks)**: `/speckit.tasks` will break into development tasks:
- Component development (Hero, Projects, About, Contact)
- Contact form email service integration
- Testing suite setup and test implementation
- Accessibility audit and fixes
- Performance optimization and Lighthouse validation
