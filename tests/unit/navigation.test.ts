/**
 * Unit tests for Navigation — T025
 *
 * Tests the useScrollSection hook and navigation data structure.
 * The Navigation.astro component itself is server-rendered and tested via E2E;
 * here we verify the client-side logic independently.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollSection } from '../../src/hooks/useScrollSection';
import { navItems } from '../../src/data/navigation';

// ─── Navigation data ──────────────────────────────────────────────────────────

describe('navigation data — navItems', () => {
  it('has exactly 4 navigation items', () => {
    expect(navItems).toHaveLength(4);
  });

  it('includes Hero, Projects, About and Contact sections', () => {
    const ids = navItems.map((i) => i.id);
    expect(ids).toContain('hero');
    expect(ids).toContain('projects');
    expect(ids).toContain('about');
    expect(ids).toContain('contact');
  });

  it('each item has an href starting with #', () => {
    navItems.forEach((item) => {
      expect(item.href).toMatch(/^#/);
    });
  });

  it('each item has a non-empty label', () => {
    navItems.forEach((item) => {
      expect(item.label.trim().length).toBeGreaterThan(0);
    });
  });
});

// ─── useScrollSection — initial state ─────────────────────────────────────────

describe('useScrollSection — initial state', () => {
  it('returns hero as the default active section', () => {
    const { result } = renderHook(() => useScrollSection());
    expect(result.current.activeSection).toBe('hero');
  });

  it('returns null for previousSection initially', () => {
    const { result } = renderHook(() => useScrollSection());
    expect(result.current.previousSection).toBeNull();
  });

  it('returns isTransitioning false initially', () => {
    const { result } = renderHook(() => useScrollSection());
    expect(result.current.isTransitioning).toBe(false);
  });
});

// ─── useScrollSection — IntersectionObserver integration ──────────────────────

describe('useScrollSection — section detection', () => {
  let observeCalls: string[] = [];
  let intersectionCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    observeCalls = [];
    intersectionCallback = null;

    // Mock IntersectionObserver
    vi.stubGlobal(
      'IntersectionObserver',
      class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallback = callback;
        }
        observe(el: Element) {
          observeCalls.push(el.id);
        }
        disconnect() {}
        unobserve() {}
      },
    );

    // Add section elements to document
    const sections = ['hero', 'projects', 'about', 'contact'];
    sections.forEach((id) => {
      if (!document.getElementById(id)) {
        const el = document.createElement('section');
        el.id = id;
        document.body.appendChild(el);
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Clean up sections
    ['hero', 'projects', 'about', 'contact'].forEach((id) => {
      document.getElementById(id)?.remove();
    });
  });

  it('observes all four section elements on mount', () => {
    renderHook(() => useScrollSection());
    expect(observeCalls).toContain('hero');
    expect(observeCalls).toContain('projects');
    expect(observeCalls).toContain('about');
    expect(observeCalls).toContain('contact');
  });

  it('updates activeSection when a section enters the viewport', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScrollSection());

    const projectsEl = document.getElementById('projects')!;

    act(() => {
      intersectionCallback!([
        {
          isIntersecting: true,
          target: projectsEl,
          intersectionRatio: 1,
          boundingClientRect: projectsEl.getBoundingClientRect(),
          intersectionRect: projectsEl.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
    });

    // Advance debounce timer
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.activeSection).toBe('projects');
    expect(result.current.previousSection).toBe('hero');

    vi.useRealTimers();
  });

  it('does not update state when isIntersecting is false', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScrollSection());

    const aboutEl = document.getElementById('about')!;

    act(() => {
      intersectionCallback!([
        {
          isIntersecting: false,
          target: aboutEl,
          intersectionRatio: 0,
          boundingClientRect: aboutEl.getBoundingClientRect(),
          intersectionRect: aboutEl.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
    });

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    // Should still be hero (unchanged)
    expect(result.current.activeSection).toBe('hero');

    vi.useRealTimers();
  });
});
