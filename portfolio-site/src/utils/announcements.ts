/**
 * announcements.ts — T061
 *
 * Utilities for announcing dynamic content changes to screen readers.
 *
 * Uses a live region approach:
 * - A single `aria-live="polite"` region is injected into the document once.
 * - Text is set on the region to trigger announcement.
 * - After 500 ms the text is cleared to allow the same message to re-announce.
 *
 * Usage:
 *   announce(`Showing ${count} projects for React`);
 *   announce('Message sent successfully.');
 */

const REGION_ID = 'sr-announcer';

function getOrCreateRegion(): HTMLElement {
  let region = document.getElementById(REGION_ID);
  if (!region) {
    region = document.createElement('div');
    region.id = REGION_ID;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    // Visually hidden but accessible to screen readers
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(region);
  }
  return region;
}

let clearTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Announces a message to screen reader users via a polite ARIA live region.
 *
 * @param message - The text to announce. Pass an empty string to clear.
 */
export function announce(message: string): void {
  if (typeof document === 'undefined') return;

  const region = getOrCreateRegion();

  // Clear existing text first (re-triggers announcement for same message)
  region.textContent = '';

  if (clearTimer !== null) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }

  if (!message) return;

  // Use rAF to ensure DOM has updated before setting new content
  requestAnimationFrame(() => {
    region.textContent = message;
    // Auto-clear after 5 s to avoid stale announcements
    clearTimer = setTimeout(() => {
      region.textContent = '';
      clearTimer = null;
    }, 5_000);
  });
}

/**
 * Announces a filter result count to screen readers.
 *
 * @param shown - Number of projects currently shown
 * @param total - Total number of projects before filtering
 * @param filter - Name of the active filter (technology or category), or null if none
 */
export function announceFilterResult(
  shown: number,
  total: number,
  filter: string | null,
): void {
  if (filter) {
    announce(`Showing ${shown} of ${total} projects for ${filter}`);
  } else {
    announce(`Showing all ${total} projects`);
  }
}

/**
 * Announces a section change to screen readers (navigation feedback).
 *
 * @param sectionName - Human-readable section name (e.g. "Projects")
 */
export function announceSectionChange(sectionName: string): void {
  announce(`Navigated to ${sectionName} section`);
}
