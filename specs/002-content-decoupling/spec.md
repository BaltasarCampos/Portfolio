# Feature Specification: Content Decoupling

**Feature Branch**: `refactor/content-decoupling`
**Created**: 2026-09-11
**Status**: Draft
**Input**: User description: "decouple the content of this static web site in order to move it to a different git repository (Content repository). Later on we will connect them using CI/CD pipelines that trigger a new build whenever content changes."

## Clarifications

### Session 2026-09-11

- Q: When a maintainer runs the site locally for development, must that local build also authenticate and pull fresh content from the private Content repository every time, or can local development use a plain local git checkout of the Content repository instead? → A: Local development reads content from a plain local git checkout of the Content repository that the maintainer keeps in sync with normal git commands (e.g. `git pull`); no authentication token is required for day-to-day local development. Only CI/production builds need programmatic credentials to access the private repository.
- Q: Should proving the rebuilt site renders identically to the pre-decoupling site be a one-time manual comparison, or should this feature also deliver an automated, repeatable parity check? → A: One-time manual comparison performed by the maintainer during rollout; no lasting comparison tooling is built as part of this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Content lives in its own repository (Priority: P1)

As the site maintainer, all authored content — project entries, page copy (hero, about, contact text), and content images — is extracted from the presentation codebase and moved into a separate Content repository, structured in a clear, documented format.

**Why this priority**: This is the core of the feature. Without content actually living in a separate, private repository in a well-defined structure, nothing else (future CI/CD triggering, independent content editing) is possible.

**Independent Test**: Can be fully tested by opening the Content repository and confirming every project entry, page copy block, and content image that previously lived in the site codebase is now present there in a documented structure, with none of it left behind in the site's source code.

**Acceptance Scenarios**:

1. **Given** the site's current codebase with project data, page copy, and images embedded in it, **When** the decoupling is complete, **Then** none of that authored content remains hardcoded in the site's presentation code — it exists only in the Content repository.
2. **Given** the Content repository, **When** the maintainer inspects it, **Then** each content type (project entry, page copy block, image) is organized in a predictable, documented structure with clear field names, without requiring knowledge of the site's code to understand.
3. **Given** the Content repository is a private repository, **When** the maintainer accesses it directly, **Then** they can view and edit its contents; unauthenticated access is not possible.

---

### User Story 2 - Site renders identically after the move (Priority: P1)

As a site visitor, the public site looks and reads exactly as it did before the content was decoupled — same project cards, same text, same images — even though that content now comes from a separate repository at build time.

**Why this priority**: Decoupling content is only safe to ship if it produces zero visible regression. This is what proves the extraction preserved everything correctly, and it's a prerequisite for trusting the new structure enough to build CI/CD automation on top of it later.

**Independent Test**: Can be fully tested by building the site from the decoupled content and comparing every page against the pre-decoupling version — same project listings, same hero/about/contact text, same images at the same quality/sizes, same links.

**Acceptance Scenarios**:

1. **Given** the site has been rebuilt to source content from the Content repository, **When** a visitor loads the site, **Then** every project entry, all page copy, and all images render identically (same content, same visual result) to the version before decoupling.
2. **Given** the build process needs to read from the private Content repository, **When** a build runs with proper access configured, **Then** it successfully retrieves all content and completes without manual intervention.
3. **Given** the Content repository is unreachable or access fails at build time, **When** a build is attempted, **Then** the build fails immediately with a clear, actionable error identifying the content access failure — it does not silently produce a broken or incomplete site.

---

### User Story 3 - Content is editable independently of the site's code (Priority: P2)

As the site maintainer, I can add or edit a project entry, update page copy, or swap an image by working only within the Content repository, without needing to open or modify the site's presentation codebase.

**Why this priority**: This is the practical payoff of decoupling — it's what makes the future CI/CD trigger (content change → new build) meaningful. It's ranked below P1 stories because it's only demonstrable once content actually lives separately and the site can still build from it.

**Independent Test**: Can be fully tested by adding a new project entry (or editing existing page copy) entirely within the Content repository, then rebuilding the site, and confirming the change appears correctly with no edits made to the site's codebase.

**Acceptance Scenarios**:

1. **Given** the Content repository's documented structure, **When** the maintainer adds a new project entry following that structure, **Then** the next site build includes the new project correctly rendered, without any code change in the site repository.
2. **Given** an existing piece of page copy (e.g. the about section bio), **When** the maintainer edits it in the Content repository, **Then** the next site build reflects the updated text with no site code changes required.

---

### Edge Cases

- What happens when a project entry in the Content repository is missing a required field (e.g. no title, no image)? The build MUST fail with an error identifying which entry and which field is invalid, rather than rendering a broken or incomplete card.
- What happens when an image referenced by a content entry is missing from the Content repository? The build MUST fail with a clear error naming the missing asset, rather than shipping a broken image.
- What happens if the Content repository and the site repository fall out of sync (e.g. content references a field or structure the site's build no longer expects)? The build MUST fail with a clear error rather than silently dropping or misrendering the affected content.
- How are the multiple image sizes/formats (e.g. responsive `.jpg`/`.webp` variants) that content images currently have handled once images live in a separate repository? The Content repository MUST preserve all size/format variants currently required by the site, organized so the build can locate them unambiguously.
- What happens to existing public image URLs/paths after the move? They MUST continue to resolve correctly on the built site (no broken image links), even though the source now lives elsewhere.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All project entry data (title, description, technologies, category, featured flag, thumbnail reference, repository URL, and equivalent fields) MUST be moved out of the site's presentation codebase and into the Content repository.
- **FR-002**: All authored page copy currently embedded in the site's presentation components (hero section text, about section bio, contact section text, and equivalent copy) MUST be moved out of the site's presentation codebase and into the Content repository.
- **FR-003**: All content-related images (project thumbnails and any other images tied to authored content, including their existing size/format variants) MUST be moved out of the site's codebase and into the Content repository.
- **FR-004**: Structural, non-authored elements of the site — page/component structure, navigation link structure, derived/computed lists (e.g. technology and category labels derived from project data) — MUST remain in the site's presentation codebase and are explicitly out of scope for this move.
- **FR-005**: The Content repository MUST organize content in a documented, predictable structure such that a maintainer can locate and edit any content type (project entry, copy block, image) without reading the site's presentation code.
- **FR-006**: The Content repository MUST be created as a private repository, accessible only to authorized maintainers.
- **FR-007**: The site's build process MUST be able to authenticate to the private Content repository and retrieve all current content as part of producing a build, for CI/production builds specifically.
- **FR-007a**: Local development builds MUST be able to read content from a plain local git checkout of the Content repository (kept in sync by the maintainer via normal git commands), without requiring authentication credentials to be configured for everyday local development.
- **FR-008**: The site's build process MUST validate that all content required to render the site is present and well-formed (required fields present, referenced images present) before producing output.
- **FR-009**: If required content is missing, malformed, or the Content repository cannot be accessed, the build MUST fail with a clear, actionable error rather than producing a partial or broken site.
- **FR-010**: After the move, the built site MUST render all project entries, page copy, and images identically (same content and visual result) to how they rendered before the content was decoupled.
- **FR-011**: The Content repository's structure and access setup MUST be documented well enough that a future automated pipeline can be configured to trigger a new site build whenever content changes (the automated trigger itself is out of scope for this feature — see Out of Scope).

### Key Entities

- **Project Entry**: A single portfolio project's authored data — title, description, technologies used, category, featured status, a thumbnail image reference, and links (e.g. repository URL). Currently one of several structured records; after this feature, lives in the Content repository.
- **Page Copy Block**: A unit of authored text tied to a specific area of the site (e.g. hero tagline, about bio, contact section message). Currently embedded directly in presentation components; after this feature, lives in the Content repository.
- **Content Image**: An image asset tied to authored content (e.g. a project thumbnail), including any size/format variants the site needs to render it responsively. After this feature, lives in the Content repository.
- **Content Repository**: The new, private git repository that becomes the single source of truth for all Project Entries, Page Copy Blocks, and Content Images.
- **Site Repository**: This existing repository, retained for presentation code, structure, and build logic; consumes content from the Content Repository at build time rather than storing it directly.

## Out of Scope

- Configuring the automated CI/CD trigger that starts a new site build whenever the Content repository changes. This feature only needs to leave the Content repository and site build in a state where that automation can be added later.
- Building any content-editing tooling or interface beyond directly editing files in the Content repository (e.g. no CMS UI).
- Building automated, repeatable content/visual parity-checking tooling. Parity with the pre-decoupling site (SC-002) is verified once, manually, during rollout.
- Changing the visual design, layout, or presentation of any content.

## Assumptions

- The site maintainer has the ability to create and manage a new private git repository and to configure the site's build environment with credentials to access it.
- "Content" is limited to authored, editorial material (project entries, page copy, and their images). Site structure, navigation definitions, and values computed/derived from content (such as the list of technology tags) are considered code, not content, and stay in the Site Repository.
- The existing image size/format variants generated for content images continue to be produced and stored the same way, just from within the Content repository instead of the Site Repository.
- No content history/versioning requirements beyond standard git history in the new Content repository.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of previously hardcoded project entries, page copy, and content images are relocated to the Content repository, with zero authored content remaining in the Site Repository's presentation code.
- **SC-002**: The rebuilt site is visually and textually indistinguishable from the pre-decoupling site across every page and section, verified by a one-time manual side-by-side comparison performed by the maintainer during rollout, with zero content discrepancies found. This is a one-time migration check, not a lasting automated regression tool.
- **SC-003**: A maintainer can add a new project entry or edit existing page copy entirely within the Content repository and see it correctly reflected in the next site build, without touching the Site Repository.
- **SC-004**: When the Content repository is unreachable or contains invalid content, 100% of affected builds fail with a clear, actionable error (identifying the missing/invalid content) rather than producing a broken or incomplete deployed site.
- **SC-005**: Every image previously served by the site continues to resolve correctly on the rebuilt site, with zero broken image links.
