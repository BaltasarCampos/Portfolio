# Quickstart: Validating Content Decoupling

Prerequisites: the Content repository exists (private, empty or seeded), and this repository has it registered as a submodule at `content/` (see [contracts/content-repository-contract.md](./contracts/content-repository-contract.md) for the required layout).

## 1. Verify local development needs no build-time credentials (FR-007a)

```bash
git submodule update --init          # one-time, uses the maintainer's own git/SSH access
npm run dev
```

**Expected**: the dev server starts and renders the site using content read from `content/`, without any `.env` credential for content access being required. Only the maintainer's normal git auth (already set up for a private repo they own) was used, and only once, outside the app's build tooling.

## 2. Verify the site renders identically to before decoupling (User Story 2, SC-002)

```bash
npm run build
npm run preview
```

**Expected**: open the previewed site and manually compare it, page by page and section by section, against the pre-decoupling version (e.g. the last deploy before this feature, or a local checkout of the previous commit). Confirm:
- Every project entry (title, description, technologies, category, image, links) matches.
- Hero, About, and Contact copy text matches exactly.
- Every image loads at the same `/images/projects/...` paths as before (SC-005) — check the browser network tab or view-source for broken image icons.

This is a **one-time manual check**, per the spec's clarification — no automated comparison tooling is expected to exist as a result of this feature.

## 3. Verify the build fails loudly on invalid content (FR-008/FR-009)

Pick one failure mode at a time inside a local checkout of the Content repository (do not commit these):

```bash
# a) Remove a required field
# edit content/projects/<some-id>.yaml and delete the `title:` line
npm run build   # expect: non-zero exit, error names the file and missing field

# b) Reference a missing image
# edit a project entry's thumbnail.src to a filename that doesn't exist under content/images/projects/
npm run build   # expect: non-zero exit, error names the missing image file

# c) Simulate the Content repository being unreachable
# (e.g., temporarily point the submodule remote at an invalid URL, or run in an environment without the checkout)
git submodule deinit -f content && npm run build   # expect: non-zero exit, clear content-access error
git submodule update --init content                # restore afterward
```

**Expected** for all three: the build stops with a specific, human-readable error — never a partial `dist/` output that silently drops or misrenders the affected content.

## 4. Verify content is editable without touching the Site repository (User Story 3, SC-003)

```bash
cd content
# add a new file: projects/<new-id>.yaml following the schema in contracts/content-repository-contract.md
cd ..
npm run build
```

**Expected**: the new project appears correctly rendered in the build output, and `git status` in the Site repository (outside `content/`) shows no changes — only the submodule pointer may show as updated once the new commit is made inside the Content repository.

## 5. Run the automated test suite (Constitution Principle II)

```bash
npm run lint
npm run type-check
npm run test:coverage    # unit/integration — content schema validation, loader mapping, failure-path tests
npm run test:e2e          # confirms rendered output/accessibility is unaffected
```

**Expected**: all pass, with the new content-loading/validation code covered per the existing ≥80% coverage bar.
