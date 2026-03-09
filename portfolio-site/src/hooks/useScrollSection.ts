'use client';

/**
 * useScrollSection — T022
 *
 * Tracks which portfolio section is currently active as the user scrolls.
 * Uses IntersectionObserver (rootMargin: -50% 0px -50% 0px) so a section
 * is considered "active" when its midpoint crosses the viewport midpoint.
 *
 * Debounces updates by 100 ms to avoid over-firing on rapid scroll.
 *
 * @returns NavigationState — { activeSection, previousSection, isTransitioning }
 */

import { useState, useEffect, useRef } from 'react';
import type { NavigationState, SectionId } from '../types/index.ts';

const SECTION_IDS: SectionId[] = ['hero', 'projects', 'about', 'contact'];
const DEBOUNCE_MS = 100;

export function useScrollSection(): NavigationState {
  const [state, setState] = useState<NavigationState>({
    activeSection: 'hero',
    previousSection: null,
    isTransitioning: false,
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    function handleIntersection(entries: IntersectionObserverEntry[]): void {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const id = entry.target.id as SectionId;

        if (debounceTimer.current !== null) {
          clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
          setState((prev) => {
            if (prev.activeSection === id) return prev;
            return {
              activeSection: id,
              previousSection: prev.activeSection,
              isTransitioning: false,
            };
          });
        }, DEBOUNCE_MS);
      }
    }

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '-50% 0px -50% 0px',
    });

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return state;
}
