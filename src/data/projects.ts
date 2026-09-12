/**
 * Portfolio project data.
 * Sourced from the `projects` Content Collection (content/projects/*.yaml,
 * populated via the `content/` git submodule) — see src/content/config.ts
 * for the schema and specs/002-content-decoupling/ for the design.
 */

import { getCollection } from 'astro:content';
import type { Project } from '../types/index.ts';

const entries = await getCollection('projects');

export const projects: readonly Project[] = entries.map((entry): Project => {
  const { thumbnail, demoUrl, repositoryUrl, ...rest } = entry.data;
  return {
    id: entry.id,
    ...rest,
    thumbnail: {
      ...thumbnail,
      src: `/images/projects/${thumbnail.src}`,
    },
    ...(demoUrl !== undefined ? { demoUrl } : {}),
    ...(repositoryUrl !== undefined ? { repositoryUrl } : {}),
  };
});

export default projects;
