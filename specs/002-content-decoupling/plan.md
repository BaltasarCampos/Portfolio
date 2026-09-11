# Implementation Plan: Content Decoupling

**Branch**: `refactor/content-decoupling` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-content-decoupling/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extract all authored content — project entries, page copy (hero/about/contact text), and content images — out of this Astro site's presentation code and into a new private Content repository, consumed at build time via a git submodule. Content is modeled as Astro Content Collections (project entries and page-copy blocks) with schema validation, so a missing/malformed field or missing image fails the build loudly (FR-008/FR-009) instead of shipping a broken site. Local development reads the submodule as a plain local git checkout (no build-time credentials needed); CI/production builds authenticate to fetch it. Existing public image URLs, visual design, and layout are preserved unchanged — this is a data/content relocation, not a redesign.

## Technical Context

**Language/Version**: TypeScript 5.x (Astro 5.17 project, Node 22 runtime)
**Primary Dependencies**: Astro 5 (Content Layer API for collections + schema validation), existing `sharp`-based `scripts/optimize-images.ts` pipeline, React 18 islands (unaffected), git (submodule mechanics)
**Storage**: No database — content is git-tracked structured files (YAML entries + optimized image assets) in a separate git repository, consumed via git submodule; no runtime storage changes
**Testing**: Vitest (unit/integration — content schema validation, build-failure behavior, loader mapping to existing `Project`/copy shapes), Playwright + axe-core (e2e/accessibility — confirms rendered output is unchanged), manual one-time visual/textual parity comparison for SC-002 (explicitly not automated, per clarification)
**Target Platform**: Static site (Astro `output: 'static'`), deployed via Netlify; local dev via `astro dev`
**Project Type**: Web — single static frontend project (no separate backend beyond the existing Netlify contact-form function, which is unaffected by this feature)
**Performance Goals**: No regression vs. current build — local dev requires zero network calls for content (submodule already checked out locally); CI build adds one additional git fetch (submodule checkout), negligible at this content volume
**Constraints**: Existing public image URL paths (`/images/projects/...`) MUST keep resolving unchanged (SC-005); no visual/layout/design changes (Out of Scope); local dev MUST NOT require configuring build-time credentials (FR-007a); build MUST fail loudly, not silently, on missing/invalid content (FR-009)
**Scale/Scope**: Small — a handful of project entries, three page-copy blocks (hero/about/contact), and their associated image variants; single maintainer, no concurrent-editor concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies how | Gate status |
|---|---|---|
| I. Code Quality Excellence | New content-loader/mapping code (replacing `src/data/projects.ts`'s static array, and the hardcoded copy in `Hero.astro`/`About.astro`/`Contact.astro`) must pass ESLint + strict TypeScript, stay DRY, and keep cyclomatic complexity low. No new abstraction beyond a thin content-collection accessor layer. | PASS |
| II. Comprehensive Testing (NON-NEGOTIABLE) | Content schema validation, build-failure paths (missing field, missing image, unreachable/invalid content), and the loader's mapping to the existing `Project`/copy shapes are code and MUST have unit/integration tests at ≥80% coverage, per the existing `tests/unit` and `tests/integration` structure. This is distinct from the one-time manual SC-002 parity check (which the spec's clarification explicitly scopes as manual, not an automated regression suite) — that clarification governs *migration verification*, not the *code* that loads and validates content, which still needs tests like any other code in this repo. | PASS (with the scope distinction above tracked in research.md) |
| III. User Experience Consistency | Spec's Out of Scope explicitly forbids visual/layout/presentation changes; this feature only relocates the source of existing content. | PASS (trivially, by scope) |
| IV. Performance Optimization | No new runtime code ships to the browser; build-time impact is one additional local/CI git operation. Image variants continue to be pre-generated the same way, just sourced from the submodule. | PASS |

No violations requiring justification — Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-content-decoupling/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md         # Phase 1 output (/speckit.plan command)
├── quickstart.md         # Phase 1 output (/speckit.plan command)
├── contracts/            # Phase 1 output (/speckit.plan command)
└── tasks.md              # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a single Astro static site (existing "Option 1: single project" layout already in place — no new top-level project is introduced). The Content repository is external; it is attached to this repo as a git submodule.

```text
Portfolio/ (this repository — "Site Repository")
├── content/                        # NEW — git submodule pointing at the Content repository
│   ├── projects/                   # one YAML file per project entry
│   ├── copy/                       # one YAML file per page-copy block (hero, about, contact)
│   └── images/projects/            # pre-optimized image variants (moved from public/images/projects)
├── src/
│   ├── content/
│   │   └── config.ts               # NEW — Astro Content Collections schema (projects, copy)
│   ├── data/
│   │   ├── projects.ts             # CHANGED — reads from the `projects` collection instead of a static array
│   │   ├── navigation.ts           # unchanged (structural, not content)
│   │   └── technologies.ts         # unchanged (derived from projects.ts output, same as today)
│   ├── components/sections/
│   │   ├── Hero.astro              # CHANGED — reads hero copy from the `copy` collection
│   │   ├── About.astro             # CHANGED — reads about copy + skills from the `copy` collection
│   │   └── Contact.astro           # CHANGED — reads contact copy from the `copy` collection
│   └── types/index.ts              # unchanged — existing `Project`/`ProjectImage` shapes remain the public contract
├── public/images/projects/         # unchanged path scheme — synced from content/images/projects/ pre-build
├── scripts/
│   └── optimize-images.ts          # unchanged tool — now run against source images before committing to the Content repository
├── tests/
│   ├── unit/                       # NEW cases — content schema validation, missing-field/missing-image failure paths
│   └── integration/                # NEW/CHANGED cases — projects.ts loader mapping to Project shape
└── .gitmodules                     # NEW — registers content/ as a submodule
```

**Structure Decision**: Keep the existing single-project Astro layout as-is; add content as a git submodule at `content/` rather than introducing a second deployable project or a monorepo split. This is the minimal structural change that satisfies FR-001–FR-011: it gives the Content repository true independence (its own git history, its own access control) while requiring no changes to the site's build tooling beyond pointing Astro's Content Collections at the submodule path and syncing `content/images/` into `public/images/` pre-build to preserve existing URLs.

## Complexity Tracking

> No constitution violations — this section is not applicable.

## Post-Design Constitution Re-Check

*Performed after Phase 1 (research.md, data-model.md, contracts/, quickstart.md).*

Design artifacts introduced no new dependencies, services, or abstractions beyond what the initial Constitution Check anticipated: one submodule, one schema file, and edits to existing files. The testing-scope distinction (Principle II vs. the clarified manual SC-002 check) from research.md §4 is now reflected in quickstart.md §2 (manual) and §5 (automated suite). All four gates remain **PASS**; no Complexity Tracking entries are needed.
