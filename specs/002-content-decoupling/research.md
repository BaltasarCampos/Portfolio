# Phase 0 Research: Content Decoupling

All unknowns from the Technical Context are resolved below; no NEEDS CLARIFICATION markers remain.

## 1. How should the Site repository consume content from a separate git repository?

**Decision**: Attach the Content repository to the Site repository as a **git submodule** at `content/`, and read it at build/dev time via **Astro's Content Layer API** (Content Collections) with a schema defined in `src/content/config.ts`.

**Rationale**:
- Matches the clarified access model directly: a submodule *is* a plain local git checkout at a fixed path — `git submodule update --remote` / `git pull` inside it is exactly the "local git checkout, synced via normal git commands" behavior FR-007a requires, with no build-time secret needed for local dev.
- For CI/production, submodule checkout is a well-understood, standard step (`git submodule update --init` with a deploy key or scoped token) — satisfies FR-007/FR-006 (private repo, authenticated build access) without inventing a bespoke fetch mechanism.
- Astro's Content Collections provide zod-based schema validation natively: a missing required field or wrong type fails `astro build`/`astro check` with a specific, actionable error pointing at the offending file — this satisfies FR-008/FR-009 and the "missing required field" edge case with framework-native behavior rather than custom validation code.
- Content stays fully human-editable as plain files in the Content repository (FR-005), independent of any site code, satisfying User Story 3 directly.

**Alternatives considered**:
- **Fetch content over an API/tarball download at build time** (e.g., GitHub API, `degit`): rejected — always requires network + auth, even for local dev, conflicting with the clarified local-dev-without-credentials requirement; adds a custom fetch/caching layer with no framework support for validation.
- **Publish content as a versioned npm package**: rejected — forces a publish step between every content edit and every build (extra tooling, extra latency), and is a much heavier mechanism than this scale of content (a handful of files) warrants.
- **Git subtree instead of submodule**: rejected — subtree merges content history into the Site repository's history, which works against the goal of the Content repository being an independent, separately-owned source of truth.

## 2. What file format should content take inside the Content repository?

**Decision**: One YAML file per item — `content/projects/<slug>.yaml` per project entry, `content/copy/hero.yaml`, `content/copy/about.yaml`, `content/copy/contact.yaml` per page-copy block — validated against a zod schema in `src/content/config.ts` using Astro's `glob()` loader.

**Rationale**: YAML is plain, diff-friendly, and requires no site-specific tooling to hand-edit (satisfies FR-005's "editable without reading the site's presentation code"). One file per item keeps each edit's diff small and makes "add a new project" (User Story 3) a matter of adding one new file, not editing a shared array.

**Alternatives considered**: Markdown+frontmatter (rejected — most fields here are structured data, not prose bodies, so plain YAML is a better fit than forcing a markdown body); a single JSON file per collection (rejected — bigger diffs, worse merge behavior, less human-friendly for hand editing than one-file-per-item YAML).

## 3. How are content images (including existing responsive variants) relocated without breaking existing URLs?

**Decision**: The Content repository stores the already-optimized image variants under `content/images/projects/` (the same set `scripts/optimize-images.ts` produces today — multiple widths × `.jpg`/`.webp`). A pre-build step syncs `content/images/projects/` into `public/images/projects/` so the site's existing absolute URL scheme (`/images/projects/...`) and the `Project.thumbnail` field shape are completely unchanged.

**Rationale**: SC-005 requires existing image links to keep resolving; the current codebase references images by hand-authored `/images/projects/...` paths (not Astro's `astro:assets` pipeline), so preserving that exact scheme is the lowest-risk path and avoids an unrelated migration to a different image pipeline (which the spec's Out of Scope explicitly disallows — no presentation changes). `scripts/optimize-images.ts` keeps working exactly as it does today; it's simply pointed at source images that live in the Content repository, and its output is committed there instead of to `public/`.

**Alternatives considered**: Import images through `astro:assets`/Content Collections' `image()` helper for on-the-fly optimization — rejected for this feature because it would change the served URL scheme (fingerprinted asset paths) and the `ProjectImage` contract, which is a bigger change than "decoupling" calls for; can be revisited as a separate future feature.

## 4. How does the constitution's testing mandate apply given SC-002 is explicitly a manual, one-time check?

**Decision**: Treat these as two separate concerns. (a) The **code** that loads, maps, and validates content (the `src/content/config.ts` schema, and the replacement for `src/data/projects.ts`) is ordinary application code and gets unit/integration tests same as anything else in this codebase — e.g. "given a project entry missing `title`, the build/validation step fails with an identifiable error." (b) **SC-002's parity check** — confirming the rebuilt site looks/reads the same as the pre-decoupling site — is a one-time migration verification activity, not a piece of software; there is nothing to unit-test there, and the spec's clarification already scopes it as manual and explicitly excludes building lasting comparison tooling.

**Rationale**: This distinction lets the feature satisfy Constitution Principle II (mandatory testing of code) without contradicting the clarification session's explicit decision to keep migration-parity verification manual and out of scope for automated tooling.

## 5. CI/production authentication mechanism for the private submodule

**Decision**: Use a deploy key (read-only, scoped to the Content repository) or a fine-grained personal access token stored as a Netlify/CI build secret, injected into the submodule's remote URL (or via `git config --global url.insteadOf` rewriting) during the CI checkout step, before `git submodule update --init`.

**Rationale**: This is the standard, well-documented pattern for private git submodules in hosted CI (GitHub Actions, Netlify), requires no custom code, and cleanly separates "local dev identity" (the maintainer's own SSH key, already trusted for a repo they own) from "CI identity" (a narrowly-scoped deploy credential) — matching FR-006/FR-007's access-control intent.

**Alternatives considered**: None materially different — this is a solved problem with one conventional approach; deeper tool selection (e.g. exact secret name, GitHub Action vs. Netlify build plugin) is an implementation detail for the tasks phase, not a design fork worth tracking here.
