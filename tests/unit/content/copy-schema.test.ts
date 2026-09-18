/**
 * Unit tests (T007): the `copy` schema rejects fixtures missing any required
 * field per block (hero, about, contact).
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { copySchema } from '../../../src/content/config';

describe('copySchema', () => {
  describe('hero block', () => {
    const validHero = {
      eyebrow: "Hello, I'm",
      heading: 'Test Name',
      role: 'Frontend Engineer',
      statement: 'A statement.',
    };

    it('accepts a valid hero entry', () => {
      expect(copySchema.safeParse(validHero).success).toBe(true);
    });

    for (const field of ['eyebrow', 'heading', 'role', 'statement'] as const) {
      it(`rejects a hero entry missing ${field}`, () => {
        const fixture: Record<string, unknown> = { ...validHero };
        delete fixture[field];
        expect(copySchema.safeParse(fixture).success).toBe(false);
      });
    }
  });

  describe('about block', () => {
    const validAbout = {
      bioParagraphs: ['Paragraph one.'],
      skills: ['TypeScript'],
    };

    it('accepts a valid about entry', () => {
      expect(copySchema.safeParse(validAbout).success).toBe(true);
    });

    for (const field of ['bioParagraphs', 'skills'] as const) {
      it(`rejects an about entry missing ${field}`, () => {
        const fixture: Record<string, unknown> = { ...validAbout };
        delete fixture[field];
        expect(copySchema.safeParse(fixture).success).toBe(false);
      });
    }
  });

  describe('contact block', () => {
    const validContact = {
      heading: 'Get in Touch',
      subheading: "Let's talk.",
    };

    it('accepts a valid contact entry', () => {
      expect(copySchema.safeParse(validContact).success).toBe(true);
    });

    for (const field of ['heading', 'subheading'] as const) {
      it(`rejects a contact entry missing ${field}`, () => {
        const fixture: Record<string, unknown> = { ...validContact };
        delete fixture[field];
        expect(copySchema.safeParse(fixture).success).toBe(false);
      });
    }
  });
});
