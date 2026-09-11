/**
 * Integration tests for ProjectsGrid.tsx (T032, T035)
 *
 * Tests: rendering, technology filters, category filters, "no results" state, aria-live region.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectsGrid from '../../../src/components/sections/ProjectsGrid';
import type { Project, ProjectCategory } from '../../../src/types/index';
import { categoryLabels } from '../../../src/data/technologies';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeProject(
  id: string,
  title: string,
  opts: {
    technologies?: string[];
    category?: ProjectCategory;
    featured?: boolean;
    demoUrl?: string;
    repositoryUrl?: string;
  } = {},
): Project {
  // Build without optional fields, then conditionally spread them in
  // so exactOptionalPropertyTypes is satisfied (no explicit `undefined` values).
  const base = {
    id,
    title,
    description: 'A test project',
    technologies: opts.technologies ?? ['React', 'TypeScript'],
    category: opts.category ?? ('web-app' as ProjectCategory),
    thumbnail: { src: '/img/test.jpg', alt: 'Test image', width: 800, height: 600 },
    featured: opts.featured ?? false,
    ...(opts.demoUrl !== undefined ? { demoUrl: opts.demoUrl } : {}),
    ...(opts.repositoryUrl !== undefined ? { repositoryUrl: opts.repositoryUrl } : {}),
  };
  return base as Project;
}

const projects: Project[] = [
  makeProject('proj-a', 'Alpha', { technologies: ['React', 'TypeScript'], category: 'web-app', featured: true }),
  makeProject('proj-b', 'Beta',  { technologies: ['Vue', 'TypeScript'], category: 'tool' }),
  makeProject('proj-c', 'Gamma', { technologies: ['Astro'], category: 'experiment' }),
];

const allTechnologies = ['Astro', 'React', 'TypeScript', 'Vue'];
const allCategories: ProjectCategory[] = ['experiment', 'tool', 'web-app'];

function renderGrid() {
  return render(
    <ProjectsGrid
      projects={projects}
      allTechnologies={allTechnologies}
      allCategories={allCategories}
      categoryLabels={categoryLabels}
    />,
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ProjectsGrid — rendering', () => {
  it('renders all projects by default', () => {
    renderGrid();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders featured projects before non-featured ones', () => {
    renderGrid();
    const cards = screen.getAllByRole('article');
    // Featured project "Alpha" should appear first
    expect(cards[0]).toHaveTextContent('Alpha');
  });

  it('renders technology filter pills for each technology', () => {
    renderGrid();
    expect(screen.getByRole('button', { name: /react/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /typescript/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /astro/i })).toBeInTheDocument();
  });

  it('renders the aria-live status region', () => {
    renderGrid();
    // The status region is a <p aria-live="polite"> (not role="status")
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});

// ─── Technology filtering ────────────────────────────────────────────────────

describe('ProjectsGrid — technology filtering', () => {
  it('reduces the rendered card count when a technology filter is selected', () => {
    renderGrid();
    // Before filtering: 3 cards
    expect(screen.getAllByRole('article')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: /^vue$/i }));

    // After filtering by Vue: only Beta matches
    // AnimatePresence may keep exiting items briefly — check the live region count instead
    const liveRegion = document.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(liveRegion.textContent).toMatch(/1/);
  });

  it('toggles filter off when clicked again (showing all projects)', () => {
    renderGrid();
    const vueButton = screen.getByRole('button', { name: /^vue$/i });
    fireEvent.click(vueButton);
    fireEvent.click(vueButton);

    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('shows projects matching ANY selected technology (OR logic)', () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: /^react$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^astro$/i }));

    // Alpha has React, Gamma has Astro → 2 results; Beta has neither
    const liveRegion = document.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(liveRegion.textContent).toMatch(/2/);
  });

  it('updates the live region to reflect filtered count', () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: /^vue$/i }));

    const liveRegion = document.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(liveRegion.textContent).toMatch(/1/);
  });
});

// ─── Category filtering ───────────────────────────────────────────────────────

describe('ProjectsGrid — category filtering', () => {
  it('filters by category using the human-readable label', () => {
    renderGrid();
    // categoryLabels['tool'] === 'Tool'
    const toolButton = screen.getByRole('button', { name: /^tool$/i });
    fireEvent.click(toolButton);

    // Only Beta is in the 'tool' category → live region shows 1
    const liveRegion = document.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(liveRegion.textContent).toMatch(/1/);
  });
});

// ─── Empty state ─────────────────────────────────────────────────────────────

describe('ProjectsGrid — empty state', () => {
  it('shows "no projects" message when filters match nothing', () => {
    renderGrid();
    // Vue filter → only Beta (tool). Experiment category → only Gamma. No overlap → 0 results.
    fireEvent.click(screen.getByRole('button', { name: /^vue$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^experiment$/i }));

    expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
  });

  it('renders a clear-filters button in the empty state and restores all projects', () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: /^vue$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^experiment$/i }));

    // Two "Clear filters" buttons exist: one in filter bar, one in no-results pane.
    const clearButtons = screen.getAllByRole('button', { name: /clear filters/i });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(clearButtons[0]!);

    // All 3 cards back
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});
