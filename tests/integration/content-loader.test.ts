/**
 * Integration test (T015): the updated src/data/projects.ts maps a valid
 * `projects` collection entry into the existing `Project` interface shape,
 * with no field loss or type mismatch.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { projects } from '../../src/data/projects';

describe('src/data/projects.ts loader mapping', () => {
  it('maps every collection entry into the Project shape with no field loss', () => {
    expect(projects.length).toBeGreaterThan(0);

    for (const project of projects) {
      expect(typeof project.id).toBe('string');
      expect(typeof project.title).toBe('string');
      expect(typeof project.description).toBe('string');
      expect(Array.isArray(project.technologies)).toBe(true);
      expect(project.technologies.length).toBeGreaterThan(0);
      expect(typeof project.category).toBe('string');
      expect(typeof project.featured).toBe('boolean');

      expect(typeof project.thumbnail.src).toBe('string');
      expect(typeof project.thumbnail.alt).toBe('string');
      expect(typeof project.thumbnail.width).toBe('number');
      expect(typeof project.thumbnail.height).toBe('number');

      if (project.demoUrl !== undefined) {
        expect(typeof project.demoUrl).toBe('string');
      }
      if (project.repositoryUrl !== undefined) {
        expect(typeof project.repositoryUrl).toBe('string');
      }
    }
  });

  it('prepends /images/projects/ to thumbnail.src, matching the existing absolute-path convention', () => {
    const astroPortfolio = projects.find((p) => p.id === 'astro-portfolio');
    expect(astroPortfolio).toBeDefined();
    expect(astroPortfolio?.thumbnail.src).toBe('/images/projects/portfolio-placeholder.jpg');
  });
});
