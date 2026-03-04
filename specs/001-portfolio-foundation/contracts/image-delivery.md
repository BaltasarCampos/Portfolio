# API Contract: Image Delivery

**Phase**: 1 (Design)  
**Date**: 2026-03-04  
**Feature**: Build Portfolio Foundation (001-portfolio-foundation)  
**Endpoint**: `/images/*`

---

## Overview

This document specifies the HTTP contract for serving optimized images on the portfolio site. Images are delivered with modern format negotiation (WebP preferred, JPEG fallback) and responsive sizing via the `<picture>` element.

---

## Image Formats & Strategy

### Format Selection

**Strategy**: Serve WebP to modern browsers, JPEG fallback for older browsers

**Browser Support**:
- **WebP**: Chrome 23+, Edge 18+, Firefox 65+, Safari 16+, Opera 11.1+ (~95% global)
- **JPEG**: All browsers (100% fallback)

**Implementation Method**: HTML `<picture>` element with format-specific `<source>` tags

### File Organization

```
src/assets/images/
├── projects/
│   ├── dashboard.webp          (primary WebP)
│   ├── dashboard.jpg           (fallback JPEG)
│   ├── dashboard-thumb.webp    (thumbnail WebP)
│   └── dashboard-thumb.jpg     (thumbnail JPEG)
├── about/
│   ├── portrait.webp
│   ├── portrait.jpg
│   └── ...
└── hero/
    ├── background.webp
    ├── background.jpg
    └── ...
```

### Image Optimization Standards

#### WebP Format

**Compression**: Lossy quality 80 (balances file size and visual quality)

```bash
# Convert command
cwebp -q 80 input.jpg -o output.webp
```

**File Size Targets**:
- Project thumbnail: 15-25 KB (300x169px)
- Full project image: 40-80 KB (1200x675px)
- Hero background: 60-120 KB (1920x1080px)
- Portrait image: 30-60 KB (400x500px)

#### JPEG Format

**Compression**: Quality 85 (slightly higher than WebP to match visual fidelity)

```bash
# Convert command (ImageMagick)
convert input.png -quality 85 -strip output.jpg
```

**File Size Targets**: 10-15% larger than WebP equivalent

#### Dimensions & Aspect Ratios

| Image Type | Aspect Ratio | Sizes (width) |
|------------|-------------|--------------|
| Project thumbnail | 16:9 | 300, 600 (2x) |
| Project full | 16:9 | 800, 1200, 1600 |
| Portrait | 3:4 | 300, 600 (2x) |
| Hero background | 16:9 or full-width | 1920, 1280, 768 |

---

## HTML Implementation

### Picture Element Structure

**Project Thumbnail** (responsive, art direction):
```html
<picture>
  <!-- WebP: Modern browsers -->
  <source
    srcSet="
      /images/projects/dashboard-thumb.webp 1x,
      /images/projects/dashboard-thumb@2x.webp 2x
    "
    type="image/webp"
  />
  
  <!-- JPEG: Fallback -->
  <source
    srcSet="
      /images/projects/dashboard-thumb.jpg 1x,
      /images/projects/dashboard-thumb@2x.jpg 2x
    "
    type="image/jpeg"
  />
  
  <!-- Fallback img tag (required) -->
  <img
    src="/images/projects/dashboard-thumb.jpg"
    alt="Analytics dashboard showing sales trends and customer metrics"
    width="300"
    height="169"
    loading="lazy"
  />
</picture>
```

**Full Project Image** (responsive, 3 breakpoints):
```html
<picture>
  <!-- WebP versions -->
  <source
    media="(min-width: 1024px)"
    srcSet="
      /images/projects/dashboard.webp 800w,
      /images/projects/dashboard@1.5x.webp 1200w,
      /images/projects/dashboard@2x.webp 1600w
    "
    type="image/webp"
  />
  <source
    media="(min-width: 640px)"
    srcSet="
      /images/projects/dashboard-sm.webp 600w,
      /images/projects/dashboard-sm@2x.webp 1200w
    "
    type="image/webp"
  />
  <source
    media="(max-width: 639px)"
    srcSet="
      /images/projects/dashboard-xs.webp 300w,
      /images/projects/dashboard-xs@2x.webp 600w
    "
    type="image/webp"
  />
  
  <!-- JPEG fallback versions -->
  <source
    media="(min-width: 1024px)"
    srcSet="
      /images/projects/dashboard.jpg 800w,
      /images/projects/dashboard@1.5x.jpg 1200w,
      /images/projects/dashboard@2x.jpg 1600w
    "
    type="image/jpeg"
  />
  <source
    media="(min-width: 640px)"
    srcSet="
      /images/projects/dashboard-sm.jpg 600w,
      /images/projects/dashboard-sm@2x.jpg 1200w
    "
    type="image/jpeg"
  />
  <source
    media="(max-width: 639px)"
    srcSet="
      /images/projects/dashboard-xs.jpg 300w,
      /images/projects/dashboard-xs@2x.jpg 600w
    "
    type="image/jpeg"
  />
  
  <!-- Fallback img tag -->
  <img
    src="/images/projects/dashboard.jpg"
    alt="Analytics dashboard showing sales trends and customer metrics"
    width="1200"
    height="675"
    loading="lazy"
  />
</picture>
```

---

## HTTP Response Headers

### Image Asset Requests

**Cache Headers** (immutable assets with content hash):

```
Cache-Control: public, max-age=31536000, immutable
Content-Type: image/webp (or image/jpeg)
ETag: "abc123..."
```

**Explanation**:
- `public`: Cacheable by all caches (CDN + browser)
- `max-age=31536000`: Cache for 1 year (31536000 seconds)
- `immutable`: Content never changes, no revalidation needed
- `ETag`: Fingerprint for change detection

### Build Process (Astro Integration)

**Astro automatically**:
1. Optimizes images at build time
2. Generates content hashes
3. Creates immutable filenames: `dashboard-abc123.webp`
4. Inlines `<picture>` HTML with correct `srcSet` values
5. Preloads critical images in `<head>`

**Example (build output)**:
```html
<!-- Before (in .astro source) -->
<img src={projectImage} alt="..." />

<!-- After (generated HTML) -->
<picture>
  <source srcSet="/images/projects/dashboard-abc123.webp 800w, ..." type="image/webp" />
  <source srcSet="/images/projects/dashboard-abc123.jpg 800w, ..." type="image/jpeg" />
  <img src="/images/projects/dashboard-abc123.jpg" alt="..." loading="lazy" />
</picture>
```

---

## Performance Optimization

### Lazy Loading Strategy

**Default Behavior**:
```html
<img ... loading="lazy" />
```

**Critical Images** (above the fold):
```html
<!-- Hero background: eager loading -->
<img ... loading="eager" fetchpriority="high" />

<!-- First 3 project thumbnails: eager (visible on page load) -->
<img ... loading="eager" />

<!-- Remaining thumbnails: lazy (below fold) -->
<img ... loading="lazy" />
```

### Image Preloading

**Critical Images** (in `<head>`):
```html
<link rel="preload" as="image" href="/images/hero-bg-abc123.webp" />
<link rel="preload" as="image" href="/images/hero-bg-abc123.jpg" />
```

### Responsive Image Testing

**Lighthouse Audit**:
- ✅ All images use modern formats (WebP)
- ✅ Images sized correctly for viewport
- ✅ Properly sized for responsive design
- ✅ No oversized images (max 1920px width)

**Expected Lighthouse Score**: 100 (Images category)

---

## Accessibility Compliance

### Alt Text Requirements

**All images must have descriptive alt text**:

```html
<!-- ✅ GOOD: Specific, descriptive -->
<img alt="Analytics dashboard showing sales trends by product category" />

<!-- ❌ BAD: Generic -->
<img alt="dashboard" />

<!-- ❌ BAD: Missing alt -->
<img src="..." />

<!-- ✅ GOOD: Decorative images marked -->
<img alt="" role="presentation" aria-hidden="true" />
```

**Alt Text Length**: 1-120 characters (readable by screen readers)

**Alt Text Checklist**:
- [ ] All images have alt attribute
- [ ] Alt text describes image purpose/content
- [ ] Alt text is 1-120 characters
- [ ] Decorative images have `alt=""` and `role="presentation"`

---

## Build-Time Processing

### Image Optimization Pipeline

**Tool**: Sharp (image processing library for Node.js)

```typescript
// build-time script: optimize-images.ts
import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';

const sourceDir = 'src/assets/images';
const outputDir = 'dist/images';

// Find all source images
const images = await glob(`${sourceDir}/**/*.{png,jpg,jpeg}`);

for (const imagePath of images) {
  const { name } = path.parse(imagePath);
  const outputPrefix = path.join(outputDir, name);
  
  // Generate WebP (lossy, quality 80)
  await sharp(imagePath)
    .webp({ quality: 80 })
    .toFile(`${outputPrefix}.webp`);
  
  // Generate WebP 2x (for retina displays)
  await sharp(imagePath)
    .resize(null, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${outputPrefix}@2x.webp`);
  
  // Generate JPEG (quality 85 for fallback)
  await sharp(imagePath)
    .jpeg({ quality: 85, progressive: true })
    .toFile(`${outputPrefix}.jpg`);
  
  // Generate JPEG 2x
  await sharp(imagePath)
    .jpeg({ quality: 85, progressive: true })
    .toFile(`${outputPrefix}@2x.jpg`);
  
  console.log(`✅ Optimized: ${name}`);
}
```

### Content Hashing

**Filename Format**: `{basename}-{contenthash}.{ext}`

```
Original:    dashboard.webp
Optimized:   dashboard-a1b2c3d4.webp
```

**Benefits**:
- Immutable cache headers (1-year TTL)
- No cache busting needed
- CDN can aggressively cache
- Users get latest version on code deploy

---

## Testing & Validation

### Build-Time Tests

```typescript
import { expect, test } from 'vitest';
import fs from 'fs';
import sharp from 'sharp';

test('All WebP images are < 100KB', async () => {
  const files = glob.sync('dist/images/**/*.webp');
  for (const file of files) {
    const stats = fs.statSync(file);
    expect(stats.size).toBeLessThan(100 * 1024); // 100KB limit
  }
});

test('All JPEG images are < 120KB', async () => {
  const files = glob.sync('dist/images/**/*.jpg');
  for (const file of files) {
    const stats = fs.statSync(file);
    expect(stats.size).toBeLessThan(120 * 1024); // 120KB limit
  }
});

test('All images have alt text', async () => {
  const htmlContent = fs.readFileSync('dist/index.html', 'utf-8');
  const imgRegex = /<img[^>]*>/g;
  const matches = htmlContent.match(imgRegex) || [];
  
  for (const match of matches) {
    if (!match.includes('alt=')) {
      throw new Error(`Missing alt text: ${match}`);
    }
  }
});

test('Picture elements have format fallbacks', async () => {
  const htmlContent = fs.readFileSync('dist/index.html', 'utf-8');
  const pictureRegex = /<picture>.*?<\/picture>/gs;
  const matches = htmlContent.match(pictureRegex) || [];
  
  for (const match of matches) {
    expect(match).toContain('type="image/webp"');
    expect(match).toContain('type="image/jpeg"');
  }
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('Project thumbnail loads as WebP on modern browsers', async ({ page }) => {
  await page.goto('/projects');
  
  const img = page.locator('[alt*="dashboard"]').first();
  const src = await img.getAttribute('src');
  
  // Check that the actual loaded image is WebP
  const response = await page.request.get(src || '');
  expect(response.headers()['content-type']).toContain('image/webp');
});

test('Images are responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/projects');
  
  const images = page.locator('img');
  for (let i = 0; i < await images.count(); i++) {
    const img = images.nth(i);
    const box = await img.boundingBox();
    
    // Image should not overflow viewport
    expect(box?.width).toBeLessThanOrEqual(375);
  }
});

test('Critical images load eagerly', async ({ page }) => {
  await page.goto('/');
  
  const heroBg = page.locator('[alt*="hero"]');
  await expect(heroBg).toBeVisible();
  
  // Check loading attribute
  const loading = await heroBg.getAttribute('loading');
  expect(loading).toBe('eager');
});
```

---

## Lighthouse Audit

### Performance Metrics

**Target Scores**:
- **Performance**: 90+ (images optimized, lazy loading)
- **Accessibility**: 100 (all images have alt text)
- **Best Practices**: 100 (modern image formats)

### Lighthouse CI Configuration

```json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "image-aspect-ratio": "off",
        "image-size-responsive": "warn",
        "unused-css-rules": "warn"
      }
    }
  }
}
```

---

## Deployment

### Static Asset Delivery

**CDN**: Netlify's global CDN (included)

**Headers** (netlify.toml):
```toml
[[headers]]
for = "/images/*"
[headers.values]
  Cache-Control = "public, max-age=31536000, immutable"
  X-Content-Type-Options = "nosniff"
```

### Build Artifact Checklist

- [ ] All source images (PNG/JPG) in `src/assets/images`
- [ ] Build script generates WebP + JPEG variants
- [ ] Content hashes applied to filenames
- [ ] Picture elements with proper srcSet values
- [ ] Critical images preloaded in `<head>`
- [ ] All images lazy-loaded (except above-fold)
- [ ] Alt text on all images
- [ ] File sizes within targets (<100KB WebP, <120KB JPEG)
- [ ] Lighthouse audit passes (90+ Performance)

---

## Image Inventory

### Required Images

| Image | Dimensions | File Size (WebP) | Location |
|-------|-----------|-----------------|----------|
| Hero background | 1920x1080 | ~80 KB | `/images/hero/` |
| Project thumbnails (15 projects) | 300x169 | ~20 KB each | `/images/projects/` |
| Project full images | 1200x675 | ~60 KB each | `/images/projects/` |
| Portrait/About | 400x500 | ~40 KB | `/images/about/` |
| Social icons (if needed) | 64x64 | <5 KB each | `/images/social/` |

**Total Expected Size**: ~2.5 MB (uncompressed), ~1.2 MB (on-disk with compression)

---

## Migration from Current Setup

**If replacing existing image setup**:

1. Collect all source images (PNG/JPG)
2. Run optimization pipeline
3. Update HTML to use `<picture>` elements
4. Test in different browsers (Chrome, Safari, Firefox, Edge)
5. Verify Lighthouse scores
6. Deploy to production
7. Monitor image loading performance in analytics

---

## Next Steps

**Phase 1 (Design)** continues with:
1. ✅ `data-model.md` (completed)
2. ✅ `contracts/form-api.md` (completed)
3. ✅ `contracts/image-delivery.md` (this file)
4. `quickstart.md`: Local dev setup and deployment
5. Agent context update

Image delivery contract complete and ready for implementation.
