# Baltasar Campos — Portfolio Site

A personal portfolio built with **Astro 5**, **React 18**, **TypeScript**, **Tailwind CSS 3**, and **Framer Motion**. Deployed to **Netlify** as a static site with a serverless contact-form endpoint.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Environment Variables](#environment-variables)
4. [Available Scripts](#available-scripts)
5. [Project Structure](#project-structure)
6. [Customising Content](#customising-content)
7. [Image Optimisation](#image-optimisation)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Accessibility & Performance](#accessibility--performance)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 5 (static output) |
| UI islands | React 18 (`client:idle` / `client:visible`) |
| Styling | Tailwind CSS 3 + CSS custom properties |
| Animation | Framer Motion 12 |
| TypeScript | Strict mode, path aliases |
| Testing | Vitest (unit/integration) + Playwright (E2E) |
| Email | SendGrid via `@sendgrid/mail` |
| Hosting | Netlify (static + serverless functions) |

---

## Getting Started

**Prerequisites:** Node.js ≥ 22, npm ≥ 10

```bash
# 1. Clone the repository
git clone https://github.com/BaltasarCampos/Portfolio.git
cd Portfolio/portfolio-site

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# → Fill in your values (see Environment Variables section)

# 4. Start the dev server
npm run dev
# → http://localhost:4321
```

> **Note:** The contact form POSTs to `/api/contact`, which is redirected to the Netlify function via `netlify.toml`. In local development, use the [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`netlify dev`) to run the function locally.

---

## Environment Variables

Copy `.env.example` to `.env.local` and set each value:

| Variable | Required | Description |
|----------|----------|-------------|
| `SENDGRID_API_KEY` | ✅ | SendGrid API key for sending email |
| `ENGINEER_EMAIL` | ✅ | Your email address — where submissions are delivered |
| `FROM_EMAIL` | ✅ | Verified SendGrid sender address |
| `RATE_LIMIT_MAX_PER_HOUR` | optional | Max contact form submissions per IP per hour (default: `3`) |
| `PUBLIC_SITE_URL` | optional | Canonical site URL for CORS (default: `http://localhost:4321`) |

### Setting variables on Netlify

1. Go to **Site configuration → Environment variables**
2. Add each variable from the table above
3. Redeploy — variables are injected at function runtime

---

## Available Scripts

```bash
npm run dev              # Start Astro dev server on :4321
npm run build            # Production build → dist/
npm run preview          # Preview production build locally
npm run type-check       # TypeScript strict type check (no emit)
npm run lint             # ESLint (0 warnings allowed)
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier write
npm run format:check     # Prettier check (CI)
npm run test             # Vitest unit + integration tests
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Vitest with coverage report (≥80% threshold)
npm run test:e2e         # Playwright E2E tests (requires running server)
npm run test:e2e:ui      # Playwright interactive UI mode
npm run optimize-images  # Sharp image optimisation pipeline
```

---

## Project Structure

```
portfolio-site/
├── public/
│   └── images/
│       └── projects/
│           └── src/          ← Place original project images here
├── src/
│   ├── animations/
│   │   └── variants.ts       ← All Framer Motion variant objects
│   ├── components/
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro
│   │   ├── sections/
│   │   │   ├── Hero.astro
│   │   │   ├── Projects.astro
│   │   │   ├── ProjectsGrid.tsx  ← React island (client:idle)
│   │   │   ├── About.astro
│   │   │   ├── Contact.astro
│   │   │   └── ContactForm.tsx   ← React island (client:visible)
│   │   └── ui/
│   │       ├── Navigation.astro
│   │       ├── Button.astro
│   │       └── Badge.astro
│   ├── data/
│   │   ├── projects.ts       ← ⭐ Edit this with your real projects
│   │   ├── technologies.ts   ← Derived from projects.ts (auto)
│   │   └── navigation.ts
│   ├── hooks/
│   │   └── useReducedMotion.ts
│   ├── pages/
│   │   └── index.astro
│   ├── styles/
│   │   ├── globals.css       ← Tailwind + CSS custom properties
│   │   └── components.css    ← Component-level styles
│   ├── types/
│   │   └── index.ts          ← All TypeScript interfaces
│   └── utils/
│       └── validation.ts     ← Shared form validation (client + server)
├── netlify/
│   └── functions/
│       └── contact.ts        ← Serverless contact form handler
├── scripts/
│   └── optimize-images.ts    ← Sharp image pipeline
├── tests/
│   ├── unit/
│   │   ├── utils/validation.test.ts
│   │   └── hooks/useReducedMotion.test.ts
│   ├── integration/
│   │   └── api/
│   │       ├── contact-form.test.tsx
│   │       └── projects-grid.test.tsx
│   └── e2e/
│       ├── keyboard.spec.ts
│       ├── accessibility.spec.ts
│       └── responsive.spec.ts
├── .env.example
├── astro.config.mjs
├── netlify.toml
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## Customising Content

### Projects (`src/data/projects.ts`)

Replace the sample projects with your own. Each project follows the `Project` interface defined in `src/types/index.ts`:

```ts
{
  id: 'my-project',           // URL-safe slug
  title: 'My Project',
  description: 'Short description — 100–300 characters.',
  technologies: ['React', 'TypeScript', 'Astro'],
  category: 'web-app',        // see ProjectCategory type
  thumbnail: {
    src: '/images/projects/my-project@800w.webp',
    alt: 'Screenshot of My Project showing the dashboard',
    width: 800,
    height: 600,
  },
  demoUrl: 'https://myproject.example.com',
  repositoryUrl: 'https://github.com/yourname/my-project',
  featured: true,             // pins to top of grid
}
```

### Hero & About copy (`src/components/sections/`)

Edit `Hero.astro` and `About.astro` directly — they contain plain HTML/Astro markup with the copy inline.

### Navigation links (`src/data/navigation.ts`)

Add or reorder sections by editing the `navItems` array.

---

## Image Optimisation

Place original high-resolution images (JPEG/PNG/WebP) in:

```
public/images/projects/src/
```

Then run:

```bash
npm run optimize-images
```

This uses **Sharp** to generate responsive variants at 400 w, 800 w, and 1200 w in both WebP and JPEG formats. Output lands in `public/images/projects/`.

---

## Testing

### Unit & Integration (Vitest)

```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report → coverage/
```

Coverage thresholds are set at **80%** for lines, functions, branches, and statements.

### E2E (Playwright)

```bash
npm run test:e2e         # Runs dev server automatically + all specs
npm run test:e2e:ui      # Interactive Playwright UI
```

Tests cover:
- **`keyboard.spec.ts`** — Tab navigation, focus indicators, form keyboard submission
- **`accessibility.spec.ts`** — axe-core WCAG 2.1 AA audit per section
- **`responsive.spec.ts`** — Layout correctness at 5 breakpoints, touch targets

---

## Deployment

### Continuous deployment (recommended)

1. Push this repository to GitHub
2. In Netlify: **Add new site → Import from Git**
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables (see [Environment Variables](#environment-variables))
6. Deploy ✅

The included **GitHub Actions** workflows run type-check, lint, and tests on every push.

### Contact form

The form POSTs to `/api/contact`, redirected by `netlify.toml` to `/.netlify/functions/contact`. The function validates input, checks the honeypot, enforces rate limiting (3 req/IP/hr), and sends email via **SendGrid**.

For local development, run with [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npx netlify dev
```

---

## Accessibility & Performance

| Standard | Target |
|----------|--------|
| WCAG | 2.1 AA |
| Colour contrast | ≥ 4.5 : 1 |
| Touch targets | ≥ 44 × 44 px |
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| LCP | ≤ 2 500 ms |
| CLS | ≤ 0.1 |

Zero-JS by default — React islands hydrate lazily so the main thread is free during initial paint.

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
