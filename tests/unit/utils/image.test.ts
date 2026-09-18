/**
 * Unit tests: image utility functions — T067
 *
 * Covers: buildSrcSet, getImageProps, isAboveFold, getPreloadLinkAttrs
 */

import { describe, it, expect } from 'vitest';
import {
  buildSrcSet,
  getImageProps,
  isAboveFold,
  getPreloadLinkAttrs,
} from '../../../src/utils/image.ts';

// ─── buildSrcSet ─────────────────────────────────────────────────────────────

describe('buildSrcSet', () => {
  it('generates a srcset string with three width descriptors for webp', () => {
    const result = buildSrcSet('/images/projects/my-project', 'webp');
    expect(result).toBe(
      '/images/projects/my-project-400w.webp 400w, ' +
        '/images/projects/my-project-800w.webp 800w, ' +
        '/images/projects/my-project-1200w.webp 1200w',
    );
  });

  it('generates a srcset string with three width descriptors for jpg', () => {
    const result = buildSrcSet('/images/hero-bg/hero', 'jpg');
    expect(result).toBe(
      '/images/hero-bg/hero-400w.jpg 400w, ' +
        '/images/hero-bg/hero-800w.jpg 800w, ' +
        '/images/hero-bg/hero-1200w.jpg 1200w',
    );
  });

  it('includes all three breakpoints: 400w, 800w, 1200w', () => {
    const result = buildSrcSet('/img/test', 'webp');
    expect(result).toContain('400w');
    expect(result).toContain('800w');
    expect(result).toContain('1200w');
  });

  it('uses the correct file extension', () => {
    const webp = buildSrcSet('/img/test', 'webp');
    const jpg = buildSrcSet('/img/test', 'jpg');
    expect(webp).not.toContain('.jpg');
    expect(jpg).not.toContain('.webp');
  });
});

// ─── getImageProps ────────────────────────────────────────────────────────────

describe('getImageProps', () => {
  const base = {
    src: '/images/projects/demo',
    alt: 'Demo project screenshot',
    width: 800,
    height: 600,
  };

  it('returns correct alt text', () => {
    const props = getImageProps(base);
    expect(props.alt).toBe('Demo project screenshot');
  });

  it('returns correct intrinsic dimensions', () => {
    const props = getImageProps(base);
    expect(props.width).toBe(800);
    expect(props.height).toBe(600);
  });

  it('defaults to lazy loading', () => {
    const props = getImageProps(base);
    expect(props.loading).toBe('lazy');
  });

  it('sets loading to eager when specified', () => {
    const props = getImageProps({ ...base, loading: 'eager' });
    expect(props.loading).toBe('eager');
  });

  it('sets decoding to async for lazy images', () => {
    const props = getImageProps({ ...base, loading: 'lazy' });
    expect(props.decoding).toBe('async');
  });

  it('sets decoding to sync for eager images', () => {
    const props = getImageProps({ ...base, loading: 'eager' });
    expect(props.decoding).toBe('sync');
  });

  it('includes webp srcset', () => {
    const props = getImageProps(base);
    expect(props.webpSrcSet).toContain('.webp');
    expect(props.webpSrcSet).toContain('400w');
  });

  it('includes jpeg srcset', () => {
    const props = getImageProps(base);
    expect(props.jpegSrcSet).toContain('.jpg');
    expect(props.jpegSrcSet).toContain('800w');
  });

  it('returns correct fallback src at 800w', () => {
    const props = getImageProps(base);
    expect(props.fallbackSrc).toBe('/images/projects/demo-800w.jpg');
  });

  it('uses default sizes string when not provided', () => {
    const props = getImageProps(base);
    expect(props.sizes).toContain('min-width');
  });

  it('uses custom sizes string when provided', () => {
    const customSizes = '(min-width: 768px) 50vw, 100vw';
    const props = getImageProps({ ...base, sizes: customSizes });
    expect(props.sizes).toBe(customSizes);
  });

  it('omits className when not provided', () => {
    const props = getImageProps(base);
    expect(props).not.toHaveProperty('className');
  });

  it('includes className when provided', () => {
    const props = getImageProps({ ...base, className: 'project-image' });
    expect(props.className).toBe('project-image');
  });

  it('accepts empty alt for decorative images', () => {
    const props = getImageProps({ ...base, alt: '' });
    expect(props.alt).toBe('');
  });
});

// ─── isAboveFold ─────────────────────────────────────────────────────────────

describe('isAboveFold', () => {
  it('returns true for index 0 (first image)', () => {
    expect(isAboveFold(0)).toBe(true);
  });

  it('returns true for index 1', () => {
    expect(isAboveFold(1)).toBe(true);
  });

  it('returns true for index 2 (last above-fold image)', () => {
    expect(isAboveFold(2)).toBe(true);
  });

  it('returns false for index 3 (first below-fold image)', () => {
    expect(isAboveFold(3)).toBe(false);
  });

  it('returns false for higher indices', () => {
    expect(isAboveFold(10)).toBe(false);
    expect(isAboveFold(99)).toBe(false);
  });
});

// ─── getPreloadLinkAttrs ──────────────────────────────────────────────────────

describe('getPreloadLinkAttrs', () => {
  it('returns rel="preload" and as="image"', () => {
    const attrs = getPreloadLinkAttrs('/images/hero-bg/hero');
    expect(attrs.rel).toBe('preload');
    expect(attrs.as).toBe('image');
  });

  it('defaults to webp format', () => {
    const attrs = getPreloadLinkAttrs('/images/hero-bg/hero');
    expect(attrs.type).toBe('image/webp');
    expect(attrs.href).toContain('.webp');
  });

  it('uses jpeg type when jpg format specified', () => {
    const attrs = getPreloadLinkAttrs('/images/hero-bg/hero', 'jpg');
    expect(attrs.type).toBe('image/jpeg');
    expect(attrs.href).toContain('.jpg');
  });

  it('points href to the 800w fallback', () => {
    const attrs = getPreloadLinkAttrs('/images/hero-bg/hero');
    expect(attrs.href).toBe('/images/hero-bg/hero-800w.webp');
  });

  it('includes imageSrcset with all three widths', () => {
    const attrs = getPreloadLinkAttrs('/images/hero-bg/hero');
    expect(attrs.imageSrcset).toContain('400w');
    expect(attrs.imageSrcset).toContain('800w');
    expect(attrs.imageSrcset).toContain('1200w');
  });

  it('includes imagesizes string', () => {
    const attrs = getPreloadLinkAttrs('/images/hero-bg/hero');
    expect(typeof attrs.imagesizes).toBe('string');
    expect(attrs.imagesizes.length).toBeGreaterThan(0);
  });

  it('accepts a custom sizes string', () => {
    const customSizes = '100vw';
    const attrs = getPreloadLinkAttrs('/images/hero-bg/hero', 'webp', customSizes);
    expect(attrs.imagesizes).toBe(customSizes);
  });
});
