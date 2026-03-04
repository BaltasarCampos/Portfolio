# Quickstart: Local Development & Deployment

**Phase**: 1 (Design)  
**Date**: 2026-03-04  
**Feature**: Build Portfolio Foundation (001-portfolio-foundation)

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Building & Testing](#building--testing)
6. [Deployment to Netlify](#deployment-to-netlify)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.x or 20.x LTS | JavaScript runtime |
| npm | 9.x+ | Package manager |
| Git | 2.40+ | Version control |
| VS Code | Latest | Code editor (recommended) |

### Optional Tools

| Tool | Purpose |
|------|---------|
| Netlify CLI | Local deployment testing |
| ImageMagick | Image optimization (cwebp for WebP) |
| Playwright | E2E testing browser automation |

### System Specifications

- **Disk Space**: 2-3 GB (node_modules + build artifacts)
- **RAM**: 4 GB minimum (8 GB recommended)
- **Internet**: Required for npm dependencies

---

## Local Development Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/portfolio.git
cd BCCB-Portfolio

# Check out the feature branch
git checkout 001-portfolio-foundation
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm --version  # Should be 9.x+
node --version # Should be 18.x or 20.x
```

**Expected Output**:
```
added 500+ packages in 45s
```

### Step 3: Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your settings
nano .env.local
```

**Required Environment Variables**:

```bash
# Email Service (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
ENGINEER_EMAIL=your-email@example.com
FROM_EMAIL=noreply@yourdomain.com

# Optional: Mailgun (alternative to SendGrid)
# MAILGUN_API_KEY=key-xxxxxxxxxxxxx
# MAILGUN_DOMAIN=mg.yourdomain.com

# Optional: Analytics
# GOOGLE_ANALYTICS_ID=G-xxxxxxxxxxxxx

# Optional: Custom Domain
# SITE_URL=https://yourdomain.com
```

**How to Get API Keys**:

1. **SendGrid API Key**:
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Copy the key to `.env.local`

2. **Engineer Email**:
   - Use your personal email (where contact form messages arrive)
   - Example: `yourname@gmail.com`

3. **From Email** (for sending contact notifications):
   - Can be same as engineer email or a noreply address
   - If using SendGrid, this must be a verified sender

### Step 4: Verify Setup

```bash
# Start development server
npm run dev

# You should see:
# > astro dev
# ➜ Local:     http://localhost:3000/
# ➜ press h for help
```

Visit http://localhost:3000 in your browser. You should see the portfolio site with:
- ✅ Hero section
- ✅ Projects grid
- ✅ About section
- ✅ Contact form

**If not loading**:
1. Check terminal for errors
2. Verify Node.js version: `node --version`
3. Clear cache: `rm -rf node_modules/.astro && npm run dev`

---

## Project Structure

### File Organization

```
BCCB-Portfolio/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── hero/
│   │   │   ├── projects/
│   │   │   ├── about/
│   │   │   └── social/
│   │   └── fonts/
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── BaseLayout.astro
│   │   │   └── BlogLayout.astro
│   │   ├── sections/
│   │   │   ├── Hero.astro
│   │   │   ├── Projects.astro (static)
│   │   │   ├── ProjectsGrid.tsx (React island)
│   │   │   ├── About.astro
│   │   │   └── Contact.astro
│   │   ├── ui/
│   │   │   ├── Navigation.astro
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   └── Badge.astro
│   │   └── ContactForm.tsx (React island)
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── animations.css
│   ├── data/
│   │   ├── projects.ts
│   │   ├── technologies.ts
│   │   └── navigation.ts
│   ├── hooks/
│   │   ├── useScrollSection.ts
│   │   ├── useFormValidation.ts
│   │   └── useAnimation.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── email.ts
│   │   └── animations.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   └── api/
│   │       └── contact.ts (API route)
│   └── env.d.ts
├── netlify/
│   ├── functions/
│   │   └── contact.ts (Edge function)
│   └── edge-middleware.ts
├── tests/
│   ├── unit/
│   │   ├── validation.test.ts
│   │   ├── email.test.ts
│   │   └── animations.test.ts
│   ├── integration/
│   │   ├── ContactForm.test.tsx
│   │   └── ProjectsGrid.test.tsx
│   └── e2e/
│       ├── navigation.spec.ts
│       ├── contact-form.spec.ts
│       └── accessibility.spec.ts
├── config/
│   ├── astro.config.mjs
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vitest.config.ts
│   └── playwright.config.ts
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── build.yml
│       └── lighthouse.yml
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── favicon.ico
├── .env.example
├── .env.local (not committed)
├── package.json
├── package-lock.json
└── README.md
```

### Key Directories Explained

**`src/components/`**: All UI components (static Astro + interactive React islands)
- **layouts/**: Page layout wrappers
- **sections/**: Large sections (Hero, Projects, About, Contact)
- **ui/**: Reusable UI components
- **ContactForm.tsx**: React island for contact form (hydrated on `client:visible`)
- **ProjectsGrid.tsx**: React island for filtering and grid display (hydrated on `client:idle`)

**`src/data/`**: Static data files (loaded at build time)
- **projects.ts**: Array of 15-20 Project entities
- **technologies.ts**: Unique technologies across all projects
- **navigation.ts**: Navigation menu structure

**`netlify/functions/`**: Serverless edge functions
- **contact.ts**: Handles POST /api/contact requests, validates, sends email

**`tests/`**: Test files (match src/ structure)
- **unit/**: Utility function tests (validation, email, animations)
- **integration/**: Component tests (React components with mocked APIs)
- **e2e/**: Full user flow tests (Playwright browser automation)

---

## Development Workflow

### Common Development Tasks

#### Start Development Server

```bash
npm run dev
# Server runs on http://localhost:3000
# Hot reload on file save
# Press 'h' for help
```

#### Add a New Project

1. Edit `src/data/projects.ts`:

```typescript
// Add to the projects array
{
  id: "project-022",
  title: "Real-Time Chat Application",
  description: "WebSocket-based chat app with user authentication and message history.",
  technologies: ["React", "Node.js", "WebSocket", "MongoDB"],
  category: "web-app",
  thumbnail: {
    src: "/images/projects/chat-app.webp",
    alt: "Real-time chat application with user list and message threads",
    width: 16,
    height: 9
  },
  demoUrl: "https://chat-demo.example.com",
  repositoryUrl: "https://github.com/yourname/chat-app",
  createdAt: "2025-12-01",
  featured: false
}
```

2. Add thumbnail images:
   - `src/assets/images/projects/chat-app.webp`
   - `src/assets/images/projects/chat-app.jpg`

3. Save and the site automatically reloads.

#### Update Contact Form

Edit `src/components/ContactForm.tsx`:

```typescript
// Modify form fields, validation, or styling
// Changes appear instantly in development mode
```

#### Modify Styles

1. Update Tailwind tokens in `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    colors: {
      primary: '#0066ff',
      // ...
    }
  }
}
```

2. Or add custom CSS in `src/styles/globals.css`:

```css
:root {
  --color-primary: #0066ff;
  --spacing-unit: 0.25rem;
}
```

3. Changes apply immediately to the site.

#### Test Changes Locally

```bash
# Unit tests (watch mode)
npm run test:unit -- --watch

# Integration tests
npm run test:integration

# E2E tests (opens browser)
npm run test:e2e

# All tests
npm run test

# Specific test file
npm run test -- validation.test.ts
```

---

## Building & Testing

### Build for Production

```bash
# Build the site
npm run build

# Output:
# ✓ Completed in 12s.
# ✓ 15 pages built in 450ms.
# ✓ Total output: 1.2 MB

# View generated files
ls -la dist/
```

**Build Output**:
- `dist/index.html`: Optimized homepage
- `dist/projects/index.html`: Projects page
- `dist/*/...`: All other pages
- `dist/images/`: Optimized images (WebP + JPEG)
- `dist/_astro/`: CSS and JavaScript bundles

### Preview Production Build Locally

```bash
# Build and start preview server
npm run preview

# Server runs on http://localhost:3000
# Shows exactly what will deploy to Netlify
```

### Run All Tests

```bash
# Unit + Integration + E2E
npm run test

# Output:
# ✓ src/utils/validation.test.ts (5)
# ✓ src/components/ContactForm.test.tsx (12)
# ✓ tests/e2e/contact-form.spec.ts (8)
#
# Test Files: 25 passed
# Tests: 127 passed
# Coverage: 89%
```

### Generate Coverage Report

```bash
npm run test:coverage

# Output:
# File      | % Stmts | % Branch | % Funcs | % Lines |
# --------- | ------- | -------- | ------- | ------- |
# utils/    | 95.2    | 92.1     | 98.0    | 95.5    |
# components/ | 87.3  | 85.2     | 89.0    | 87.8    |
```

### Lighthouse Audit

```bash
# Generate Lighthouse report for production build
npm run lighthouse

# Results:
# ✓ Performance: 98
# ✓ Accessibility: 100
# ✓ Best Practices: 100
# ✓ SEO: 100
# ✓ PWA: 85
```

---

## Deployment to Netlify

### Prerequisites

1. Netlify account (free at https://netlify.com)
2. GitHub repository pushed to main branch
3. Environment variables configured

### Method 1: GitHub Connected Deployment (Recommended)

```bash
# 1. Push code to GitHub
git add .
git commit -m "feat: portfolio foundation"
git push origin 001-portfolio-foundation

# 2. Create pull request on GitHub
#    (Netlify preview deployment automatically created)

# 3. Merge to main branch when ready
#    (Netlify production deployment automatically triggered)
```

**Steps in Netlify Dashboard**:

1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Set environment variables:
   - `SENDGRID_API_KEY`
   - `ENGINEER_EMAIL`
   - `FROM_EMAIL`
6. Click "Deploy"

### Method 2: Netlify CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Authenticate with Netlify
netlify login

# Deploy to Netlify
netlify deploy --prod

# Output:
# ✓ Netlify Build complete
# ✓ Deploy is live at https://yourdomain.netlify.app
```

### Method 3: Manual Upload

```bash
# Build the site
npm run build

# Upload dist/ folder to Netlify via web dashboard
# Site is live immediately
```

### Post-Deployment Verification

```bash
# Test deployment
curl -I https://yourdomain.netlify.app

# Check specific pages
curl -I https://yourdomain.netlify.app/projects
curl -I https://yourdomain.netlify.app/about

# Verify contact form works
# Send test message through https://yourdomain.netlify.app/contact
# Check email inbox for confirmation
```

### Enable Custom Domain

1. Go to Netlify Dashboard → Site Settings
2. Click "Domain Settings"
3. Add your custom domain (e.g., `yourname.dev`)
4. Update DNS records with your registrar
5. SSL certificate auto-provisioned by Netlify

### Monitoring Deployment

```bash
# View deployment history
netlify deployments list

# Check build logs
netlify deploy --prod --build-logs

# Monitor errors in real-time
# (via Netlify Dashboard or Sentry integration)
```

---

## Environment Configuration

### Environment Variables

**Development** (`.env.local`):
```bash
# Email Service
SENDGRID_API_KEY=SG.test_key_for_development
ENGINEER_EMAIL=yourname+test@gmail.com
FROM_EMAIL=noreply@localhost

# Optional: Debugging
DEBUG=true
LOG_LEVEL=debug
```

**Production** (Set in Netlify Dashboard):
```bash
# Production Email Service
SENDGRID_API_KEY=SG.real_production_key
ENGINEER_EMAIL=yourname@yourcompany.com
FROM_EMAIL=noreply@yourdomain.com

# Production URL
SITE_URL=https://yourdomain.com

# Optional: Analytics
GOOGLE_ANALYTICS_ID=G-xxxxxxxxxxxxx

# Optional: Monitoring
SENTRY_DSN=https://xxxxxxxxxxxxx@o0.ingest.sentry.io/0
```

### How to Set Environment Variables in Netlify

1. **Via Dashboard**:
   - Go to Site Settings → Environment Variables
   - Click "Add a variable"
   - Enter key and value
   - Trigger rebuild

2. **Via Netlify CLI**:
   ```bash
   netlify env:set SENDGRID_API_KEY "SG.xxxxxxxxxxxxx"
   netlify env:set ENGINEER_EMAIL "your@email.com"
   ```

3. **Via netlify.toml**:
   ```toml
   [build.environment]
   SENDGRID_API_KEY = "SG.xxxxxxxxxxxxx"
   ENGINEER_EMAIL = "your@email.com"
   ```

### Accessing Environment Variables in Code

**In Astro Components**:
```typescript
import.meta.env.SENDGRID_API_KEY  // ✅ Works in edge functions
import.meta.env.ENGINEER_EMAIL    // ✅ Works in edge functions
```

**In React Components**:
```typescript
// Only public variables (PUBLIC_ prefix) accessible in browser
import.meta.env.PUBLIC_SITE_URL  // ✅ Works in browser
// import.meta.env.SENDGRID_API_KEY  // ❌ Not accessible (security)
```

**Netlify Edge Functions**:
```typescript
export default async (request: Request) => {
  const apiKey = Netlify.env.get('SENDGRID_API_KEY');  // ✅ Secure
}
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Port 3000 is already in use"

```bash
# Solution 1: Use different port
npm run dev -- --port 3001

# Solution 2: Kill process using port 3000
lsof -ti :3000 | xargs kill -9
npm run dev
```

#### Issue: "Cannot find module 'react'"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

#### Issue: "Build fails with TypeScript errors"

```bash
# Check for type errors
npm run type-check

# Fix automatically
npx tsc --noEmit

# View error details
npm run build -- --verbose
```

#### Issue: "Contact form not sending emails"

```bash
# 1. Verify environment variables are set
echo $SENDGRID_API_KEY  # Should print your API key
echo $ENGINEER_EMAIL    # Should print email address

# 2. Test SendGrid connection
npm run test:integration -- contact

# 3. Check Netlify function logs
netlify functions:invoke contact --payload '{"name":"Test"}'

# 4. Review Netlify deployment logs
netlify deploy:log
```

#### Issue: "Images not showing on production"

```bash
# 1. Verify image files exist
ls -la dist/images/

# 2. Check built HTML for correct srcSet
grep -r "srcSet" dist/

# 3. Verify Netlify headers are set
curl -I https://yourdomain.netlify.app/images/logo.webp
# Should see: Cache-Control: public, max-age=31536000, immutable

# 4. Clear Netlify cache and redeploy
netlify cache:clear
netlify deploy --prod
```

#### Issue: "Lighthouse score is low (< 90)"

```bash
# 1. Run local audit
npm run lighthouse

# 2. Check what's causing low scores
npm run lighthouse -- --verbose

# 3. Common fixes:
# - Optimize images: npm run optimize:images
# - Defer non-critical CSS: edit tailwind.config.ts
# - Enable compression: check netlify.toml headers
# - Preload critical fonts: edit src/layouts/BaseLayout.astro
```

### Getting Help

**Resources**:
1. Check error messages carefully (often describe exact fix)
2. Run `npm run test` to validate setup
3. Review `.env.example` for required variables
4. Check Netlify deployment logs for server errors
5. Use VS Code debugger: `npm run dev` then F5

**Debug Mode**:
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Run with inspector
node --inspect ./node_modules/.bin/astro dev
```

---

## Next Steps

After completing local setup:

1. **Customize Content**:
   - Add your projects to `src/data/projects.ts`
   - Update about section in `src/components/sections/About.astro`
   - Add your portrait image

2. **Verify Tests Pass**:
   - Run `npm run test` (expect 127+ tests passing)
   - Check coverage: `npm run test:coverage` (expect >80%)

3. **Build & Preview**:
   - Run `npm run build` (should complete in <30s)
   - Run `npm run preview` and visit http://localhost:3000

4. **Deploy**:
   - Push to GitHub: `git push origin 001-portfolio-foundation`
   - Merge to main branch
   - Netlify automatically deploys production build
   - Verify at https://yourdomain.netlify.app

5. **Monitor Production**:
   - Run Lighthouse audit weekly
   - Monitor email delivery in SendGrid dashboard
   - Check Netlify analytics and error logs

---

## Summary

**You now have**:
- ✅ Local development environment running
- ✅ Project structure organized and documented
- ✅ All dependencies installed and tested
- ✅ Environment variables configured
- ✅ Build & test systems working
- ✅ Deployment pipeline to Netlify ready

**Phase 1 (Design) completed**:
1. ✅ `data-model.md` (5 entities defined)
2. ✅ `contracts/form-api.md` (contact endpoint specified)
3. ✅ `contracts/image-delivery.md` (image optimization contract)
4. ✅ `quickstart.md` (this file)

**Ready for Phase 2: Task Breakdown**
Next: Use `/speckit.tasks` to generate implementation task list with effort estimates.
