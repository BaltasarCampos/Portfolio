/**
 * Foundational smoke test (T005): verifies the `projects` and `copy` collections
 * load without error via Astro's Content Layer API, against the real content
 * populated in the `content/` submodule.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { getCollection } from 'astro:content';

describe('content collections', () => {
  it('loads the projects collection without error', async () => {
    const entries = await getCollection('projects');
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.data.title).toBeTruthy();
      expect(entry.data.thumbnail.src).toBeTruthy();
    }
  });

  it('loads the copy collection without error', async () => {
    const entries = await getCollection('copy');
    expect(entries.length).toBeGreaterThan(0);
    const ids = entries.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['hero', 'about', 'contact']));
  });
});
