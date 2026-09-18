/**
 * src/content/config.ts
 * Astro Content Collections schema for content sourced from the `content/`
 * git submodule (see specs/002-content-decoupling/contracts/content-repository-contract.md).
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const projectSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(100).max(300),
  technologies: z.array(z.string()).min(1),
  category: z.enum(['web-app', 'mobile', 'open-source', 'design-system', 'tool', 'experiment']),
  featured: z.boolean(),
  thumbnail: z.object({
    src: z.string().min(1),
    alt: z.string().min(1).max(120),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  demoUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
});

export const heroSchema = z.object({
  eyebrow: z.string().min(1).max(40),
  heading: z.string().min(1).max(60),
  role: z.string().min(1).max(60),
  statement: z.string().min(1).max(300),
});

export const aboutSchema = z.object({
  bioParagraphs: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
});

export const contactSchema = z.object({
  heading: z.string().min(1).max(60),
  subheading: z.string().min(1).max(160),
});

export const copySchema = z.union([heroSchema, aboutSchema, contactSchema]);

export type HeroCopy = z.infer<typeof heroSchema>;
export type AboutCopy = z.infer<typeof aboutSchema>;
export type ContactCopy = z.infer<typeof contactSchema>;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './content/projects' }),
  schema: projectSchema,
});

const copy = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './content/copy' }),
  schema: copySchema,
});

export const collections = { projects, copy };
