/**
 * Unit tests (T006): the `projects` schema rejects fixtures violating each
 * constraint individually.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { projectSchema } from '../../../src/content/config';

function validProject(): Record<string, unknown> {
  return {
    title: 'Test Project',
    description: 'A'.repeat(150),
    technologies: ['TypeScript'],
    category: 'web-app',
    featured: false,
    thumbnail: {
      src: 'test-project.jpg',
      alt: 'A screenshot of the test project',
      width: 1200,
      height: 630,
    },
  };
}

describe('projectSchema', () => {
  it('accepts a valid project entry', () => {
    expect(projectSchema.safeParse(validProject()).success).toBe(true);
  });

  it('rejects a missing title', () => {
    const fixture = validProject();
    delete fixture.title;
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });

  it('rejects a description under 100 characters', () => {
    const fixture = { ...validProject(), description: 'Too short.' };
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });

  it('rejects a description over 300 characters', () => {
    const fixture = { ...validProject(), description: 'A'.repeat(301) };
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });

  it('rejects an empty technologies array', () => {
    const fixture = { ...validProject(), technologies: [] };
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });

  it('rejects an invalid category value', () => {
    const fixture = { ...validProject(), category: 'not-a-real-category' };
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });

  it('rejects a missing thumbnail.alt', () => {
    const fixture = validProject();
    const thumbnail = { ...(fixture.thumbnail as Record<string, unknown>) };
    delete thumbnail.alt;
    fixture.thumbnail = thumbnail;
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });

  it('rejects a non-positive thumbnail.width', () => {
    const fixture = validProject();
    fixture.thumbnail = { ...(fixture.thumbnail as object), width: 0 };
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });

  it('rejects a non-positive thumbnail.height', () => {
    const fixture = validProject();
    fixture.thumbnail = { ...(fixture.thumbnail as object), height: -10 };
    expect(projectSchema.safeParse(fixture).success).toBe(false);
  });
});
