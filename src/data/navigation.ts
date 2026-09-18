/**
 * Navigation structure for the portfolio site.
 * Each entry maps to a section `<section id="...">` in index.astro.
 */

import type { SectionId } from '../types/index.ts';

export interface NavItem {
  readonly id: SectionId;
  readonly label: string;
  readonly href: string;
}

export const navItems: readonly NavItem[] = [
  { id: 'hero', label: 'Home', href: '#hero' },
  { id: 'projects', label: 'Projects', href: '#projects' },
  { id: 'about', label: 'About', href: '#about' },
  { id: 'contact', label: 'Contact', href: '#contact' },
];

/** Scroll offset to account for the fixed navigation bar height (in pixels). */
export const NAV_SCROLL_OFFSET = 64;
