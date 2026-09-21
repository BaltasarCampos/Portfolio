# Phase 1 Data Model: Content Submodule Auto-Bump

This feature introduces no database, schema, or persisted application state. The two entities from the spec's Key Entities section map directly onto existing git/GitHub primitives — there is nothing to model beyond documenting that mapping.

## Pinned Content Reference

The Content-repository commit SHA currently recorded in the Site repository.

| Attribute | Representation |
|---|---|
| Identity | The `content` submodule's gitlink entry in the Site repository's git index (i.e., what `git submodule status` reports for path `content`) |
| Value | A 40-character git commit SHA, resolved within the Content repository |
| Where it lives | Committed directly in the Site repository's tree (no separate file/table) — changing it means committing a new gitlink for `content` |
| Read by | `git submodule status` (current value) and `git submodule update --remote` (latest available value on the Content repository's default branch) |
| Written by | A normal git commit to the `content` path, made by the `bump-content.yml` workflow via `peter-evans/create-pull-request`, and ultimately landed on `main` only through the normal PR-merge path (never a direct push to `main`) |

**Validation rule**: None beyond what already exists — the value must be a commit that exists on the Content repository's default branch. The build itself (via `build.yml`/`test.yml`, per FR-003) is what validates that content at that commit is well-formed; this feature does not add a separate validation step.

## Pointer-Bump Proposal

The automatically created/maintained pull request advancing the Pinned Content Reference.

| Attribute | Representation |
|---|---|
| Identity | A fixed, well-known branch name (e.g., `chore/bump-content`) — see [contracts/workflow-contract.md](./contracts/workflow-contract.md) for the exact convention |
| State | Whatever GitHub's native PR states already provide: `open`, `merged`, `closed` — no separate state tracking is introduced |
| Uniqueness ("at most one open at a time", FR-004/FR-005) | Enforced structurally by reusing the same fixed branch name on every run — `peter-evans/create-pull-request` updates the existing PR on that branch if one is open, rather than creating a second branch/PR |
| Content | Title and body naming the source commit(s) being advanced to (FR-006); see contract for exact template |
| Lifecycle | Created or updated by `bump-content.yml` on each scheduled run where a newer commit is found → checks run via the Site repository's existing required-status-check configuration, and a distinct automated identity (the default `GITHUB_TOKEN`) submits an approving review → auto-merges via GitHub's native auto-merge once checks and that approval are both satisfied (FR-008) → branch is deleted post-merge (standard `create-pull-request` cleanup option) → next run with no newer commits creates nothing (FR-005), so the cycle can begin again from a clean slate |

**Validation rule**: A Pointer-Bump Proposal must never merge while any required check is failing (FR-009) — enforced entirely by GitHub's native auto-merge respecting existing branch protection required-status-checks; no custom merge-gating logic is introduced.

## Relationships

```
Content Repository (default branch, HEAD)
        │
        │  read via `git submodule update --remote`
        ▼
Pinned Content Reference (gitlink in Site repo's git index, path `content`)
        │
        │  when HEAD ≠ Pinned Content Reference:
        │  committed onto a fixed branch, proposed as a PR
        ▼
Pointer-Bump Proposal (GitHub Pull Request, branch `chore/bump-content`)
        │
        │  gated by existing build.yml / test.yml checks (unchanged, FR-003)
        ▼
merge → Pinned Content Reference becomes the new HEAD value → cycle repeats
```

No other entities, fields, or relationships are introduced by this feature.
