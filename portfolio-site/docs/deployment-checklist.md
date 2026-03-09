# Deployment Checklist

**Feature**: 001-portfolio-foundation  
**Last updated**: 2026-03-08

Use this checklist before every production deployment and after deployment to verify the release is healthy.

---

## Pre-Deployment

### Build verification

- [ ] `npm run build` completes with 0 errors and 0 warnings
- [ ] `npm run type-check` passes (TypeScript strict mode)
- [ ] `npm run lint` passes (0 ESLint violations)
- [ ] `npm run test` passes (all 106+ unit/integration tests)
- [ ] Build output in `dist/` is present and non-empty

### Functionality checklist

- [ ] **Hero section** — heading, role, statement and CTA buttons are visible on load
- [ ] **Navigation** — all 4 links (Home, Projects, About, Contact) scroll to correct sections
- [ ] **Active indicator** — nav link highlights as user scrolls between sections
- [ ] **Projects grid** — all project cards render with title, description, tags, and thumbnail
- [ ] **Filter bar** — technology and category filters narrow the grid correctly
- [ ] **"No results" state** — displayed when filters match nothing; "Clear filters" restores grid
- [ ] **About section** — bio, skills list, and CV download link are present
- [ ] **Contact form** — name, email, message fields render; honeypot field is hidden
- [ ] **Form validation** — inline errors appear on blur; form won't submit until valid
- [ ] **Form submission** — send a test message; success state appears; email arrives within 5 min
- [ ] **SessionStorage** — partially filled form persists on page reload
- [ ] **Skip link** — Tab once on load shows the "Skip to main content" link

### Accessibility checklist

- [ ] **Keyboard only** — Tab through entire page; every interactive element is reachable
- [ ] **Arrow keys** — navigate between nav links; Space/Enter activate filter pills
- [ ] **Focus indicators** — visible on all focusable elements (2px primary-colour outline)
- [ ] **Screen reader** — run with NVDA/VoiceOver; headings, sections, and live regions announced
- [ ] **axe-core** — run `npm run test:e2e` with accessibility spec; 0 critical/serious violations
- [ ] **Color contrast** — all body text ≥ 4.5:1 ratio (check with browser DevTools)
- [ ] **Heading hierarchy** — one `<h1>` per page; h2 → h3 sequence is correct

### Performance checklist

- [ ] **Lighthouse (desktop)** — Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90
- [ ] **LCP** — Largest Contentful Paint < 2.5 s (check in Lighthouse report)
- [ ] **CLS** — Cumulative Layout Shift < 0.1 (no jank)
- [ ] **TBT** — Total Blocking Time < 150 ms
- [ ] **Images** — project thumbnails served as WebP in modern browsers; JPEG fallback present
- [ ] **Fonts** — `font-display: swap` active; no invisible text flash (FOIT)

### Responsive checklist

- [ ] **Mobile (375 px)** — single-column layout, no horizontal overflow, text readable
- [ ] **Tablet (768 px)** — 2-column project grid, nav links visible
- [ ] **Desktop (1440 px)** — 3-column project grid, comfortable whitespace

### Environment variables

Verify the following are set in the Netlify dashboard for the production environment:

- [ ] `SENDGRID_API_KEY` — valid and active
- [ ] `ENGINEER_EMAIL` — correct delivery address
- [ ] `RATE_LIMIT_KV` (Netlify KV binding) — connected
- [ ] `ALLOWED_ORIGIN` — set to production domain (e.g. `https://baltasarcampos.dev`)

---

## Post-Deployment

### Smoke tests (run against live URL)

- [ ] Homepage loads at production URL within 3 s on a typical connection
- [ ] All four sections visible when scrolling
- [ ] Navigation scroll works; active indicator updates
- [ ] Send a real contact form submission; confirm email delivered within 5 min
- [ ] Project demo/repo links open in new tab correctly
- [ ] CV download link works (correct file downloads)

### Monitoring

- [ ] Netlify deployment log shows "Deploy live" (no build errors)
- [ ] Netlify Functions log for `contact` shows no cold-start errors
- [ ] Run Lighthouse CI against production URL; all scores ≥ 90
- [ ] Check DNS — custom domain resolves correctly
- [ ] SSL certificate valid (no browser security warnings)

### Rollback procedure

If a critical regression is found post-deployment:

1. Go to **Netlify** → **Deploys** → select the previous stable deploy
2. Click **Publish deploy** to instantly roll back
3. Verify the previous deploy is live within 30 s
4. Open a hotfix branch to investigate and fix the regression before re-deploying
