/**
 * Unit tests for src/hooks/useReducedMotion.ts
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '../../../src/hooks/useReducedMotion';

describe('useReducedMotion', () => {
  it('returns a boolean value', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(typeof result.current).toBe('boolean');
  });

  it('returns false in the jsdom test environment (no reduced-motion preference set)', () => {
    // The setup.ts mock returns matches: false for all queries
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
