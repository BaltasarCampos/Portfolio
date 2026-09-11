# Contract: Content Repository ↔ Site Repository

This is the interface between the two systems this feature creates: the **Content repository** (external, private, produces content) and the **Site repository** (this repo, consumes content to build the site). Anything on either side that honors this contract can change independently — that independence is the point of the feature (User Story 3).

## 1. Attachment point

The Site repository mounts the Content repository as a git submodule at `content/` (repository root). The Site repository's `src/content/config.ts` declares collections that read from that path. Any tool that produces a valid `content/` tree in this shape satisfies the contract — the Site repository does not care how the Content repository produces it.

## 2. Directory layout the Content repository MUST provide

```text
content/
├── projects/
│   └── <id>.yaml
├── copy/
│   ├── hero.yaml
│   ├── about.yaml
│   └── contact.yaml
└── images/
    └── projects/
        └── <id>-<width>w.<ext>
```

## 3. `projects/<id>.yaml` schema

```yaml
title: string            # required, 1-60 chars
description: string      # required, 100-300 chars
technologies:             # required, >= 1 entry
  - string
category: string          # required, one of: web-app | mobile | open-source | design-system | tool | experiment
featured: boolean          # required
thumbnail:
  src: string              # required, filename relative to content/images/projects/ (e.g. "astro-portfolio-1200w.jpg");
                            # the Site repository's loader prepends `/images/projects/` to produce the final rendered path
  alt: string               # required, 1-120 chars
  width: number              # required, > 0
  height: number              # required, > 0
demoUrl: string             # optional, valid URL
repositoryUrl: string        # optional, valid URL
```

`<id>` (the filename, minus `.yaml`) is the project's stable identifier — must be unique, kebab-case.

## 4. `copy/hero.yaml` schema

```yaml
eyebrow: string     # required, 1-40 chars
heading: string     # required, 1-60 chars
role: string        # required, 1-60 chars
statement: string   # required, 1-300 chars
```

## 5. `copy/about.yaml` schema

```yaml
bioParagraphs:   # required, >= 1 entry
  - string
skills:          # required, >= 1 entry
  - string
```

## 6. `copy/contact.yaml` schema

```yaml
heading: string      # required, 1-60 chars
subheading: string   # required, 1-160 chars
```

## 7. `images/projects/` convention

For every `<id>` referenced by a `thumbnail.src` in any `projects/*.yaml` file, the referenced file and its sibling responsive variants MUST exist under `content/images/projects/`. The Site repository's build fails if a referenced image file is absent (see §9).

## 8. Access & authentication

- The Content repository is **private**.
- **Local development**: consumed as a plain local git checkout (the submodule working tree). No build-time credential is read by the Site repository's tooling — access is whatever the maintainer's own git/SSH setup already allows for a private repo they own.
- **CI/production builds**: the build environment MUST have a scoped, read-only credential (deploy key or fine-grained token) configured to fetch the submodule non-interactively. See [research.md §5](../research.md) for the mechanism.

## 9. Failure contract

The Site repository's build MUST fail (non-zero exit, human-readable error identifying the offending file/field) — never produce partial output — when any of the following hold:

- The submodule cannot be checked out (repository unreachable, auth failure).
- Any `projects/*.yaml` or `copy/*.yaml` file fails schema validation (missing required field, wrong type, out-of-range value).
- Any `thumbnail.src` (or its expected responsive variants) referenced by a project entry does not exist under `content/images/projects/`.

## 10. Stability guarantees

- Field names and types in §3–§6 are the stable contract; the Site repository's schema (`src/content/config.ts`) is the enforcement point and the source of truth if this document and the code ever disagree.
- Adding new optional fields to any schema is backward compatible. Removing or renaming a required field, or changing the directory layout in §2, is a breaking change to this contract and requires updating both repositories together.
