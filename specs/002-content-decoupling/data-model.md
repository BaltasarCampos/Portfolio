# Phase 1 Data Model: Content Decoupling

Entities correspond to the spec's Key Entities section. Field shapes below are the schema that `src/content/config.ts` validates against (see [contracts/content-repository-contract.md](./contracts/content-repository-contract.md) for the exact file layout and format).

## ProjectEntry

Represents one portfolio project. Maps 1:1 onto the existing `Project` interface (`src/types/index.ts`) — no change to that public shape, only to where its data originates.

| Field | Type | Required | Validation rule | Source today |
|---|---|---|---|---|
| `id` | string (slug) | yes | unique across all project entries; kebab-case | `Project.id` |
| `title` | string | yes | 1–60 characters | `Project.title` |
| `description` | string | yes | 100–300 characters | `Project.description` |
| `technologies` | string[] | yes | at least 1 entry | `Project.technologies` |
| `category` | enum | yes | one of `web-app`, `mobile`, `open-source`, `design-system`, `tool`, `experiment` | `Project.category` |
| `featured` | boolean | yes | — | `Project.featured` |
| `thumbnail.src` | string (path) | yes | must resolve to an existing file under `content/images/projects/`; loader prepends `/images/projects/` when mapping to `Project.thumbnail.src` | `Project.thumbnail.src` |
| `thumbnail.alt` | string | yes | 1–120 characters | `Project.thumbnail.alt` |
| `thumbnail.width` | number | yes | > 0 | `Project.thumbnail.width` |
| `thumbnail.height` | number | yes | > 0 | `Project.thumbnail.height` |
| `demoUrl` | string (URL) | no | valid URL if present | `Project.demoUrl` |
| `repositoryUrl` | string (URL) | no | valid URL if present | `Project.repositoryUrl` |

**Identity/uniqueness**: `id` is the file's basename (`content/projects/<id>.yaml`) and must be unique — enforced structurally (one file = one entry, filesystem prevents duplicate filenames) rather than by a separate uniqueness check.

**Lifecycle**: No state transitions — a project entry exists or doesn't; editing/removing a file is the only lifecycle event, and both are visible at the next build.

## PageCopyBlock

Represents one section's authored text. Modeled as three distinct, independently-schema'd items rather than one generic "copy" shape, because each section's fields differ.

### `hero` copy block (`content/copy/hero.yaml`)

| Field | Type | Required | Validation rule | Source today |
|---|---|---|---|---|
| `eyebrow` | string | yes | 1–40 characters | `Hero.astro` "Hello, I'm" |
| `heading` | string | yes | 1–60 characters | `Hero.astro` name heading |
| `role` | string | yes | 1–60 characters | `Hero.astro` "Frontend Engineer" |
| `statement` | string | yes | 1–300 characters | `Hero.astro` statement paragraph |

### `about` copy block (`content/copy/about.yaml`)

| Field | Type | Required | Validation rule | Source today |
|---|---|---|---|---|
| `bioParagraphs` | string[] | yes | at least 1 entry | `About.astro` bio `<p>` tags |
| `skills` | string[] | yes | at least 1 entry | `About.astro` skills list |

### `contact` copy block (`content/copy/contact.yaml`)

| Field | Type | Required | Validation rule | Source today |
|---|---|---|---|---|
| `heading` | string | yes | 1–60 characters | `Contact.astro` heading |
| `subheading` | string | yes | 1–160 characters | `Contact.astro` subheading paragraph |

**Lifecycle**: Same as ProjectEntry — no state machine, a file's presence and content is the whole model.

## ContentImage

Not a standalone schema entity (images are referenced by path from `ProjectEntry.thumbnail`, not declared separately), but the physical asset convention matters:

- Stored under `content/images/projects/<project-id>-<width>w.<ext>`, mirroring the naming `scripts/optimize-images.ts` already produces.
- Every width/format variant the site currently serves (400w/800w/1200w × jpg/webp, per the existing placeholder set) MUST be present for each project that references it — validated at build time by the pre-build sync step failing loudly if an expected variant file is absent (edge case: "image referenced by a content entry is missing").

## ContentRepository (structural, not a data schema)

The external git repository. Its layout is the contract described in [contracts/content-repository-contract.md](./contracts/content-repository-contract.md):

```text
content-repo/               (repository root; checked out at Portfolio/content/ via submodule)
├── projects/
│   └── <id>.yaml            # one ProjectEntry per file
├── copy/
│   ├── hero.yaml
│   ├── about.yaml
│   └── contact.yaml
└── images/
    └── projects/
        └── <id>-<width>w.<ext>
```

## SiteRepository (structural, not a data schema)

This existing repository. Relationship to the above: declares the schema (`src/content/config.ts`) that ContentRepository's files must satisfy, mounts ContentRepository as a submodule at `content/`, and maps validated content into the existing `Project`/copy-consuming component shapes — no change to how components render, only to where the data they render comes from.
