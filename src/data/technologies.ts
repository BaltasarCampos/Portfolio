/**
 * Derived technology and category lists computed from project data.
 * These are used to populate filter UI without hardcoding.
 */

import { projects } from './projects.ts';
import type { ProjectCategory } from '../types/index.ts';

/** All unique technology tags found across all projects, sorted alphabetically. */
export const allTechnologies: readonly string[] = [
  ...new Set(projects.flatMap((p) => p.technologies)),
].sort((a, b) => a.localeCompare(b));

/** All unique categories found across all projects, sorted alphabetically. */
export const allCategories: readonly ProjectCategory[] = [
  ...new Set(projects.map((p) => p.category)),
].sort((a, b) => a.localeCompare(b));

/** Human-readable labels for each category. */
export const categoryLabels: Record<ProjectCategory, string> = {
  'web-app': 'Web App',
  'mobile': 'Mobile',
  'open-source': 'Open Source',
  'design-system': 'Design System',
  'tool': 'Tool',
  'experiment': 'Experiment',
};
