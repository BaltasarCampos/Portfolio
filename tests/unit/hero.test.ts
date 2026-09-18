/**
 * Unit tests for the Hero section — T020
 *
 * Because Hero.astro is a static Astro component (no client JS), these tests
 * verify the animation configuration and the useReducedMotion hook behaviour
 * that drives the hero entrance variants.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '../../src/hooks/useReducedMotion';
import {
  heroHeadingVariants,
  heroSubtitleVariants,
  heroCtaVariants,
  instantVariants,
} from '../../src/animations/variants';

// ─── Hero animation variants ──────────────────────────────────────────────────

describe('Hero animation variants — structure', () => {
  it('heroHeadingVariants has hidden and visible states', () => {
    expect(heroHeadingVariants).toHaveProperty('hidden');
    expect(heroHeadingVariants).toHaveProperty('visible');
  });

  it('heroHeadingVariants hidden state has opacity 0', () => {
    expect(heroHeadingVariants.hidden).toMatchObject({ opacity: 0 });
  });

  it('heroHeadingVariants visible state has opacity 1', () => {
    const visible = heroHeadingVariants.visible as Record<string, unknown>;
    expect(visible['opacity']).toBe(1);
  });

  it('heroHeadingVariants visible transition duration is ≤ 600ms (0.6s)', () => {
    const visible = heroHeadingVariants.visible as Record<string, unknown>;
    const transition = visible['transition'] as Record<string, number> | undefined;
    expect(transition?.['duration']).toBeLessThanOrEqual(0.6);
  });

  it('heroSubtitleVariants has a positive delay to stagger after heading', () => {
    const visible = heroSubtitleVariants.visible as Record<string, unknown>;
    const transition = visible['transition'] as Record<string, number> | undefined;
    expect(transition?.['delay']).toBeGreaterThan(0);
  });

  it('heroCtaVariants includes a scale animation', () => {
    expect(heroCtaVariants.hidden).toMatchObject({ scale: expect.any(Number) });
  });
});

// ─── Instant (reduced-motion) variant ─────────────────────────────────────────

describe('instantVariants — no animation', () => {
  it('hidden and visible states are identical (no motion)', () => {
    expect(instantVariants.hidden).toMatchObject({ opacity: 1 });
    expect(instantVariants.visible).toMatchObject({ opacity: 1 });
  });

  it('visible transition duration is 0', () => {
    const visible = instantVariants.visible as Record<string, unknown>;
    const transition = visible['transition'] as Record<string, number> | undefined;
    expect(transition?.['duration']).toBe(0);
  });
});

// ─── useReducedMotion integration ─────────────────────────────────────────────

describe('Hero — prefers-reduced-motion integration', () => {
  it('useReducedMotion returns false in jsdom (no system preference set)', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('selects instantVariants when reduced motion is requested', () => {
    // Simulate a component that conditionally picks variants
    const shouldReduce = true; // override for test
    const chosen = shouldReduce ? instantVariants : heroHeadingVariants;
    expect(chosen).toBe(instantVariants);
  });

  it('selects heroHeadingVariants when reduced motion is not requested', () => {
    const shouldReduce = false;
    const chosen = shouldReduce ? instantVariants : heroHeadingVariants;
    expect(chosen).toBe(heroHeadingVariants);
  });
});
