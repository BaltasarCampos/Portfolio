'use client';

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Returns true when the user has requested reduced motion via their OS settings.
 * Wraps Framer Motion's built-in hook for consistent usage across the codebase.
 *
 * @example
 * const shouldReduce = useReducedMotion();
 * const variants = shouldReduce ? instantVariants : heroHeadingVariants;
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
