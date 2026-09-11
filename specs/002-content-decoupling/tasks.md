# Tasks: Content Decoupling

**Input**: Design documents from `/specs/002-content-decoupling/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-repository-contract.md, quickstart.md

**Tests**: Included — the project constitution (Principle II, NON-NEGOTIABLE) mandates unit/integration test coverage for all code. Per the plan's Constitution Check (research.md §4), this applies to the content-loading/validation *code*; SC-002's rendering-parity check remains an explicit one-time manual step (quickstart.md §2), not an automated test.

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing.

## Path Conventions

Single Astro project at the repository root (per plan.md's Project Structure — no monorepo split). The Content repository is external and attached as a git submodule at `content/`.

---

## Phase 1: Setup

**Purpose**: Stand up the Content repository and its attachment/access to this repository.

- [ ] T001 Create the private Content repository, seeded with the `projects/`, `copy/`, and `images/projects/` directory layout defined in [contracts/content-repository-contract.md](./contracts/content-repository-contract.md) §2, then register it as a git submodule at `content/` in this repository (`git submodule add <repo-url> content`), committing the resulting `.gitmodules`
- [ ] T002 [P] Configure a scoped, read-only deploy credential (deploy key or fine-grained token) for the Content repository and wire it into the CI/production build so the `content/` submodule can be checked out non-interactively, updating `.github/workflows/build.yml` and `netlify.toml` (per [research.md](./research.md) §5)

**Checkpoint**: The Content repository exists, is attached as a submodule, and CI/production builds can authenticate to it. Local development already works via the maintainer's own git access (no extra setup — FR-007a).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The schema, test-runner compatibility, and image-sync plumbing every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Define Astro Content Collections in `src/content/config.ts`: a `projects` collection (glob loader over `content/projects/`) and a `copy` collection (glob loader over `content/copy/`), with zod schemas enforcing exactly these constraints from [data-model.md](./data-model.md):
  - `projects`: `title` required, 1–60 characters; `description` required, 100–300 characters; `technologies` required, at least 1 entry; `category` required, one of `web-app`, `mobile`, `open-source`, `design-system`, `tool`, `experiment`; `featured` required boolean; `thumbnail.src` required; `thumbnail.alt` required, 1–120 characters; `thumbnail.width` required, > 0; `thumbnail.height` required, > 0; `demoUrl` optional valid URL; `repositoryUrl` optional valid URL
  - `copy` (hero): `eyebrow` required, 1–40 characters; `heading` required, 1–60 characters; `role` required, 1–60 characters; `statement` required, 1–300 characters
  - `copy` (about): `bioParagraphs` required, at least 1 entry; `skills` required, at least 1 entry
  - `copy` (contact): `heading` required, 1–60 characters; `subheading` required, 1–160 characters
- [ ] T003a Migrate `vitest.config.ts` from `vitest/config`'s `defineConfig` to Astro's `getViteConfig()` (imported from `astro/config`), preserving all existing `test`/`coverage`/`resolve` options, so the `astro:content` virtual module resolves inside Vitest; run `npm run test` and confirm the existing suite (including `tests/integration/api/projects-grid.test.tsx`) still passes unchanged before any content-collection code lands
- [ ] T004 [P] Add a pre-build image sync script at `scripts/sync-content-images.ts` that mirrors `content/images/projects/` into `public/images/projects/` (copies new/changed files and deletes any destination file no longer present in the source), failing loudly (non-zero exit, naming the missing file) if a project's referenced `thumbnail.src` variant is absent; wire it as `"prebuild": "tsx scripts/sync-content-images.ts"` in `package.json`
- [ ] T005 [P] Add a foundational smoke test in `tests/unit/content/collections-load.test.ts` verifying the `projects` and `copy` collections load without error against minimal valid fixture data matching the schemas in T003 (depends on T003a)

**Checkpoint**: The schema exists and is tested against fixtures (T005); Vitest can now resolve `astro:content` (T003a). The image-sync script (T004) exists but is only exercised by its dedicated test in Phase 4 (T014). User story implementation can now begin.

---

## Phase 3: User Story 1 - Content lives in its own repository (Priority: P1)

**Goal**: All authored content — project entries, page copy, and content images — is populated into the Content repository in the documented structure from `contracts/content-repository-contract.md`.

**Independent Test**: Inspect the `content/` submodule directly and confirm every project entry, page-copy block, and content image that previously lived in the Site repository is present there, correctly structured.

**Note**: Removing the now-redundant hardcoded copies from the Site repository's source code (`src/data/projects.ts`, `Hero.astro`, `About.astro`, `Contact.astro`, `public/images/projects/`) happens in Phase 4 (User Story 2), once the site is wired to read from this newly populated content — deleting them here first would break the current site with no replacement read-path yet in place.

### Tests for User Story 1

- [ ] T006 [P] [US1] Unit test in `tests/unit/content/projects-schema.test.ts` asserting the `projects` schema (T003) rejects fixtures violating each constraint individually: missing `title`, `description` under 100 or over 300 characters, empty `technologies` array, invalid `category` value, missing `thumbnail.alt`, non-positive `thumbnail.width`/`height`
- [ ] T007 [P] [US1] Unit test in `tests/unit/content/copy-schema.test.ts` asserting the `copy` schema (T003) rejects fixtures missing any required field per block: hero (`eyebrow`, `heading`, `role`, `statement`), about (`bioParagraphs`, `skills`), contact (`heading`, `subheading`)

### Implementation for User Story 1

- [ ] T008 [US1] In the Content repository, create `content/projects/astro-portfolio.yaml` and `content/projects/colla-board.yaml`, transcribing the two existing entries from `src/data/projects.ts` (title, description, technologies, category, featured, thumbnail, repositoryUrl) into the schema from `contracts/content-repository-contract.md` §3
- [ ] T009 [US1] In the Content repository, create `content/copy/hero.yaml` transcribing the eyebrow ("Hello, I'm"), heading, role ("Frontend Engineer"), and statement text currently hardcoded in `src/components/sections/Hero.astro`
- [ ] T010 [US1] In the Content repository, create `content/copy/about.yaml` transcribing the three bio paragraphs and the Core Skills list currently hardcoded in `src/components/sections/About.astro`
- [ ] T011 [US1] In the Content repository, create `content/copy/contact.yaml` transcribing the heading and subheading text currently hardcoded in `src/components/sections/Contact.astro`
- [ ] T012 [US1] In the Content repository, copy the existing optimized image variants (`portfolio-placeholder-{400w,800w,1200w}.{jpg,webp}` and any other project thumbnails) from `public/images/projects/` into `content/images/projects/`, preserving filenames per `contracts/content-repository-contract.md` §7
- [ ] T013 [US1] Commit and push T008–T012 to the Content repository; update the submodule pointer in this repository (`git -C content log -1`, then `git add content && git commit`) so `content/` reflects the newly populated data

**Checkpoint**: The Content repository contains 100% of previously hardcoded project entries, page copy, and images (SC-001's content-migration half). The Site repository still builds and renders unchanged — old hardcoded values remain in place until Phase 4.

---

## Phase 4: User Story 2 - Site renders identically after the move (Priority: P1)

**Goal**: The site's build reads content from the Content repository (via the collections from T003), renders every project entry, page copy, and image identically to before, and fails loudly rather than silently on missing/invalid/unreachable content.

**Independent Test**: Build the site (`npm run build && npm run preview`) and compare it page-by-page against the pre-decoupling version; separately, trigger each of the three failure modes in `quickstart.md` §3 and confirm the build fails with a clear, specific error each time.

### Tests for User Story 2

- [ ] T014 [P] [US2] Unit test in `tests/unit/content/missing-image.test.ts` asserting the sync script (T004) exits non-zero and names the file when a project entry's `thumbnail.src` has no corresponding file under `content/images/projects/`
- [ ] T015 [P] [US2] Integration test in `tests/integration/content-loader.test.ts` asserting the updated `src/data/projects.ts` (T017) maps a valid `projects` collection entry into the existing `Project` interface shape (`src/types/index.ts`) with no field loss or type mismatch
- [ ] T016 [P] [US2] Integration test in `tests/integration/content-availability.test.ts` asserting the build fails with a clear, identifiable error when the `content/` submodule is absent or uninitialized (simulating an unreachable Content repository, per `quickstart.md` §3c)

### Implementation for User Story 2

- [ ] T017 [US2] Update `src/data/projects.ts` to read all entries via `getCollection('projects')` from the collection defined in T003 and map each into the existing `Project` interface shape — including prepending `/images/projects/` to each entry's `thumbnail.src` filename so the final value matches today's absolute-path convention — removing the static hardcoded array (depends on T003, T008)
- [ ] T018 [US2] Update `src/components/sections/Hero.astro` to read `eyebrow`, `heading`, `role`, and `statement` from the `copy` collection's `hero` entry (`getEntry('copy', 'hero')`) instead of hardcoded strings (depends on T003, T009)
- [ ] T019 [US2] Update `src/components/sections/About.astro` to read `bioParagraphs` and `skills` from the `copy` collection's `about` entry instead of hardcoded strings (depends on T003, T010)
- [ ] T020 [US2] Update `src/components/sections/Contact.astro` to read `heading` and `subheading` from the `copy` collection's `contact` entry instead of hardcoded strings (depends on T003, T011)
- [ ] T021 [US2] Delete the now-redundant image files from `public/images/projects/` (they are regenerated by the T004 pre-build sync from `content/images/projects/` on every build)
- [ ] T021a [US2] Add `public/images/projects/` to `.gitignore`, since it is now a build-generated sync target populated by the T004 prebuild step rather than a source-of-truth directory
- [ ] T022 [US2] Confirm `src/data/technologies.ts` still derives `allTechnologies`/`allCategories` correctly from the new `projects.ts` output with no changes needed, and confirm `src/data/navigation.ts` remains byte-for-byte unchanged (`git diff --exit-code src/data/navigation.ts`), per FR-004
- [ ] T023 [US2] Run `npm run build && npm run preview` and perform the one-time manual parity comparison against the pre-decoupling site per `quickstart.md` §2, confirming project entries, copy text, and image URLs all match (SC-002, SC-005)

**Checkpoint**: The site builds and renders identically to before, sourced entirely from the Content repository. Zero authored content remains hardcoded in the Site repository (SC-001 complete). Build fails loudly on missing/invalid/unreachable content (SC-004).

---

## Phase 5: User Story 3 - Content is editable independently of the site's code (Priority: P2)

**Goal**: Demonstrate and document that a maintainer can add or edit content entirely within the Content repository and see it reflected on the next build, without touching the Site repository's code.

**Independent Test**: Add a new project entry file (and separately, edit an existing copy block) entirely within `content/`, rebuild, and confirm both changes render correctly with zero Site repository code changes.

### Implementation for User Story 3

- [ ] T024 [US3] Perform the `quickstart.md` §4 validation: add a new project entry file under `content/projects/`, run `npm run build`, and confirm the new project renders correctly with `git status` showing no changes outside `content/`
- [ ] T025 [US3] Perform a copy-edit validation: edit the bio text in `content/copy/about.yaml`, run `npm run build`, and confirm the updated text renders with no Site repository changes required
- [ ] T026 [P] [US3] Document the content-editing workflow (adding a project entry, editing a copy block, adding an image and its variants) in the Content repository's own README, referencing the schema in `contracts/content-repository-contract.md`

**Checkpoint**: SC-003 verified — a maintainer can extend or edit content using only the Content repository.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gates spanning all user stories.

- [ ] T027 [P] Run `npm run lint` and `npm run type-check` across all files touched in T003–T022 (including T003a, T021a), fixing any violations (Constitution Principle I)
- [ ] T028 [P] Run `npm run test:coverage` and confirm the new/changed content-loading code (T003, T004, T017) is covered at ≥80% (Constitution Principle II)
- [ ] T029 Run `npm run test:e2e` (Playwright + axe-core) to confirm no rendering or accessibility regressions versus the pre-decoupling site
- [ ] T030 Run the full `quickstart.md` validation guide end-to-end (all five sections) as final sign-off before considering the feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (the submodule must exist for the schema's glob loaders to have something to point at, even if empty). T003a (Vitest/`astro:content` compatibility) blocks T005 and every subsequent test task. Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. No dependency on US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational **and** on User Story 1's content files existing (T017–T020 read real entries created in T008–T011) — sequential by necessity, not just priority, since both are P1 and together form the MVP.
- **User Story 3 (Phase 5)**: Depends on Foundational and User Story 2 (there must be a working read-path before editability can be demonstrated).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T002 (Phase 1) can run in parallel with the rest of Phase 1 once T001 completes.
- T004 (Phase 2) can run in parallel with T003/T003a/T005, since the sync script itself doesn't depend on the schema. T005 depends on both T003 and T003a.
- T006 and T007 (US1 tests) can run in parallel.
- T014, T015, T016 (US2 tests) can run in parallel with each other; they can be written as soon as Phase 2 + T008–T012 land, before T017–T022 implementation.
- T026 (US3 documentation) can run in parallel with T024/T025.
- T027 and T028 (Polish) can run in parallel.

---

## Parallel Example: User Story 2 tests

```bash
# Launch all US2 test tasks together, before implementation (T017-T020):
Task: "Unit test for missing image in tests/unit/content/missing-image.test.ts"
Task: "Integration test for loader mapping in tests/integration/content-loader.test.ts"
Task: "Integration test for unreachable content in tests/integration/content-availability.test.ts"
```

---

## Implementation Strategy

### MVP Scope

User Story 1 and User Story 2 are both P1 and, per the Dependencies section above, are sequential rather than parallel (US2 reads the content US1 populates) — together they constitute the MVP: a working site that sources 100% of its content from the private Content repository and fails loudly on bad content. User Story 3 (P2) is a verification/documentation pass confirming the mechanism US1+US2 built actually delivers independent editability; it adds no new production code.

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL** — blocks all stories)
3. Complete Phase 3: User Story 1 (populate Content repository)
4. Complete Phase 4: User Story 2 (wire consumption, remove legacy hardcoded content, verify parity)
5. **STOP and VALIDATE**: Run `quickstart.md` §1–3; this is the deployable MVP
6. Complete Phase 5: User Story 3 (editability validation + documentation)
7. Complete Phase 6: Polish

### Incremental Delivery

1. Setup + Foundational → submodule attached, schema and sync script in place, fixture-based tests passing.
2. User Story 1 → Content repository fully populated; Site repository unchanged and still working (nothing deployed yet, but reviewable).
3. User Story 2 → Site now reads from the Content repository; **this is the deployable increment** (old and new behavior verified equivalent).
4. User Story 3 → No code change; confirms and documents the editing workflow.
5. Polish → Coverage, lint, e2e, and full quickstart sign-off.

---

## Notes

- [P] tasks touch different files and have no incomplete dependency between them.
- [Story] labels map each task to its user story for traceability back to spec.md.
- Per the spec's clarification, no automated content/visual parity-checking tool is built (T023 and T024/T025 are manual validation steps, not new test suites) — this is intentional, not an omission.
- Commit after each task or logical group; the Content repository and Site repository are committed/pushed separately (T013 vs. the rest).
