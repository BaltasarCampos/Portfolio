/**
 * ProjectsGrid.tsx — React island for the projects grid with filtering.
 * Hydrated client:idle to avoid blocking initial page paint.
 * T054: Arrow-key roving-tabindex keyboard navigation within filter pill groups.
 */

import { useState, useMemo, useId, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion.ts';
import { cardVariants, staggerContainerVariants, instantVariants } from '../../animations/variants.ts';
import type { Project, ProjectCategory } from '../../types/index.ts';
import type { categoryLabels as CategoryLabels } from '../../data/technologies.ts';

interface ProjectsGridProps {
  projects: readonly Project[];
  allTechnologies: readonly string[];
  allCategories: readonly ProjectCategory[];
  categoryLabels: typeof CategoryLabels;
}

export default function ProjectsGrid({
  projects,
  allTechnologies,
  allCategories,
  categoryLabels,
}: ProjectsGridProps): React.JSX.Element {
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<ProjectCategory[]>([]);
  const shouldReduce = useReducedMotion();
  const statusId = useId();

  // Derived filtered list
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const techMatch =
        selectedTechs.length === 0 || selectedTechs.some((t) => p.technologies.includes(t));
      const catMatch = selectedCats.length === 0 || selectedCats.includes(p.category);
      return techMatch && catMatch;
    });
  }, [projects, selectedTechs, selectedCats]);

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);
  const ordered = [...featured, ...rest];

  function toggleTech(tech: string): void {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );
  }

  function toggleCategory(cat: ProjectCategory): void {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function clearFilters(): void {
    setSelectedTechs([]);
    setSelectedCats([]);
  }

  const hasFilters = selectedTechs.length > 0 || selectedCats.length > 0;
  const containerVariant = shouldReduce ? instantVariants : staggerContainerVariants;
  const itemVariant = shouldReduce ? instantVariants : cardVariants;

  /**
   * T054 — Arrow-key handler for filter pill groups.
   * Implements roving tabindex: ArrowLeft/Right moves focus between pills,
   * Home/End jump to first/last pill.
   */
  const handlePillKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const group = e.currentTarget;
      const pills = Array.from(group.querySelectorAll<HTMLButtonElement>('.filter-pill'));
      const focused = document.activeElement as HTMLButtonElement | null;
      const idx = focused ? pills.indexOf(focused) : -1;

      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next = idx < pills.length - 1 ? idx + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        next = idx > 0 ? idx - 1 : pills.length - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = pills.length - 1;
      }

      if (next !== -1) {
        pills[next]?.focus();
      }
    },
    [],
  );

  return (
    <div className="projects-grid-root">
      {/* Filter Bar */}
      <div className="filter-bar" role="group" aria-label="Filter projects">
        {/* Technology filters */}
        <div className="filter-group">
          <span className="filter-label" id="tech-filter-label">
            Technology
          </span>
          <div className="filter-pills" role="group" aria-labelledby="tech-filter-label" onKeyDown={handlePillKeyDown}>
            {allTechnologies.map((tech) => {
              const active = selectedTechs.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  className={`filter-pill${active ? ' filter-pill--active' : ''}`}
                  onClick={() => toggleTech(tech)}
                  aria-pressed={active}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category filters */}
        <div className="filter-group">
          <span className="filter-label" id="cat-filter-label">
            Category
          </span>
          <div className="filter-pills" role="group" aria-labelledby="cat-filter-label" onKeyDown={handlePillKeyDown}>
            {allCategories.map((cat) => {
              const active = selectedCats.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  className={`filter-pill${active ? ' filter-pill--active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={active}
                >
                  {categoryLabels[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {hasFilters && (
          <button type="button" className="filter-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {/* Live region — announces filter results to screen readers */}
      <p
        id={statusId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {hasFilters
          ? `Showing ${ordered.length} of ${projects.length} projects`
          : `Showing all ${projects.length} projects`}
      </p>

      {/* Grid */}
      {ordered.length === 0 ? (
        <div className="no-results" role="status">
          <p>No projects found for the selected filters.</p>
          <button type="button" className="filter-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <motion.ul
          className="grid"
          variants={containerVariant}
          initial="hidden"
          animate="visible"
          aria-label="Projects list"
          role="list"
          layout
        >
          <AnimatePresence mode="popLayout">
            {ordered.map((project) => (
              <motion.li
                key={project.id}
                variants={itemVariant}
                layout
                exit={shouldReduce ? {} : { opacity: 0, scale: 0.95 }}
              >
                <ProjectCard project={project} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProjectCard (inlined — keeps the React island self-contained)
// ---------------------------------------------------------------------------

function ProjectCard({ project }: { project: Project }): React.JSX.Element {
  return (
    <article className="card" aria-label={project.title}>
      {/* Thumbnail */}
      <div className="card-image-wrapper">
        <img
          src={project.thumbnail.src}
          alt={project.thumbnail.alt}
          width={project.thumbnail.width}
          height={project.thumbnail.height}
          loading="lazy"
          decoding="async"
          className="card-image"
        />
      </div>

      <div className="card-body">
        {/* Title */}
        <h3 className="card-title">{project.title}</h3>

        {/* Description */}
        <p className="card-description">{project.description}</p>

        {/* Technologies */}
        {project.technologies.length > 0 && (
          <ul className="card-tags" role="list" aria-label="Technologies used">
            {project.technologies.map((tech) => (
              <li key={tech} className="card-tag">
                {tech}
              </li>
            ))}
          </ul>
        )}

        {/* Links */}
        {(project.demoUrl ?? project.repositoryUrl) && (
          <div className="card-links">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                className="card-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View live demo of ${project.title} (opens in new tab)`}
              >
                Live Demo ↗
              </a>
            )}
            {project.repositoryUrl && (
              <a
                href={project.repositoryUrl}
                className="card-link card-link--secondary"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View source code for ${project.title} (opens in new tab)`}
              >
                Source ↗
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
