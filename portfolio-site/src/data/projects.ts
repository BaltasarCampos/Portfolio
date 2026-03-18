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
    repositoryUrl: 'https://github.com/BaltasarCampos/Portfolio',
  },
  {
    id: 'colla-board',
    title: 'Colla-Board',
    description:
      'A collaborative whiteboard app with real-time drawing, undo/redo, and multi-user support built with React and Socket.IO. Features a custom canvas component, user presence indicators, and responsive design.',
    technologies: ['React', 'Node.js', 'Socket.IO', 'Express', 'Canvas API'],
    category: 'web-app',
    featured: true,
    thumbnail: {
      src: '/images/projects/colla-board-placeholder.jpg',
      alt: 'Screenshot of the Colla-Board app showing the whiteboard interface with drawing tools and user presence indicators',
      width: 1200,
      height: 630,
    },
    repositoryUrl: 'https://github.com/BaltasarCampos/colla-board',
  }
];

export default projects;
