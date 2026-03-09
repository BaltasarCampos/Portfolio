/**
 * Portfolio project data.
 * Add your projects here. Each entry must satisfy the Project interface.
 * Thumbnails should be placed in public/images/projects/
 * and optimized via `npm run optimize-images`.
 */

import type { Project } from '../types/index.ts';

export const projects: readonly Project[] = [
  {
    id: 'astro-portfolio',
    title: 'Personal Portfolio',
    description:
      'A fast, accessible personal portfolio site built with Astro and React islands. Features project filtering, contact form with spam protection, and WCAG 2.1 AA compliance.',
    technologies: ['Astro', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    category: 'web-app',
    featured: true,
    thumbnail: {
      src: '/images/projects/portfolio-placeholder.jpg',
      alt: 'Screenshot of the personal portfolio homepage showing hero section and project grid',
      width: 1200,
      height: 630,
    },
    repositoryUrl: 'https://github.com/BaltasarCampos/portfolio',
  },
  {
    id: 'react-design-system',
    title: 'React Design System',
    description:
      'A component library with 40+ accessible React components, Storybook documentation, and automated visual regression testing. Built with TypeScript and Radix UI primitives.',
    technologies: ['React', 'TypeScript', 'Storybook', 'Radix UI', 'CSS Modules'],
    category: 'design-system',
    featured: true,
    thumbnail: {
      src: '/images/projects/design-system-placeholder.jpg',
      alt: 'Screenshot of the design system Storybook showing component variations and documentation',
      width: 1200,
      height: 630,
    },
  },
  {
    id: 'nextjs-dashboard',
    title: 'Analytics Dashboard',
    description:
      'A real-time analytics dashboard built with Next.js 14 and server components. Visualises user engagement data with recharts and includes dark mode support.',
    technologies: ['Next.js', 'TypeScript', 'Recharts', 'Tailwind CSS', 'Prisma'],
    category: 'web-app',
    featured: false,
    thumbnail: {
      src: '/images/projects/dashboard-placeholder.jpg',
      alt: 'Screenshot of analytics dashboard showing line charts and engagement metrics',
      width: 1200,
      height: 630,
    },
    demoUrl: 'https://dashboard-demo.example.com',
  },
  {
    id: 'cli-tool',
    title: 'Dev Workflow CLI',
    description:
      'A Node.js CLI tool that automates repetitive development tasks: project scaffolding, Git branch management, and dependency auditing. 500+ weekly npm downloads.',
    technologies: ['Node.js', 'TypeScript', 'Commander.js', 'Inquirer'],
    category: 'tool',
    featured: false,
    thumbnail: {
      src: '/images/projects/cli-placeholder.jpg',
      alt: 'Terminal window showing the CLI tool running a project scaffolding command',
      width: 1200,
      height: 630,
    },
    repositoryUrl: 'https://github.com/BaltasarCampos/dev-cli',
  },
  {
    id: 'open-source-contrib',
    title: 'Open Source Contributions',
    description:
      'A curated collection of pull requests merged into popular open-source projects, including bug fixes and documentation improvements for React Query, Vite, and MDX.',
    technologies: ['React', 'TypeScript', 'Vite', 'MDX'],
    category: 'open-source',
    featured: false,
    thumbnail: {
      src: '/images/projects/oss-placeholder.jpg',
      alt: 'GitHub profile page showing open source contribution graph and merged pull requests',
      width: 1200,
      height: 630,
    },
    demoUrl: 'https://github.com/BaltasarCampos',
  },
  {
    id: 'animation-experiments',
    title: 'Animation Playground',
    description:
      'A collection of creative web animations exploring Framer Motion, CSS custom properties, and the Web Animations API. Each experiment is self-contained and documented.',
    technologies: ['React', 'Framer Motion', 'TypeScript', 'CSS'],
    category: 'experiment',
    featured: false,
    thumbnail: {
      src: '/images/projects/animations-placeholder.jpg',
      alt: 'Preview of animated UI components including fluid transitions and micro-interactions',
      width: 1200,
      height: 630,
    },
    demoUrl: 'https://animations.example.com',
    repositoryUrl: 'https://github.com/BaltasarCampos/animation-experiments',
  },
];

export default projects;
