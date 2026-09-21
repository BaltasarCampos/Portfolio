# Implementation Plan: Content Submodule Auto-Bump

**Branch**: `003-submodule-auto-bump` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-submodule-auto-bump/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a scheduled GitHub Actions workflow in the Site repository that checks the Content repository's default branch for commits newer than the currently pinned `content` submodule reference. When newer commits exist, it advances the submodule pointer and opens (or updates) a single pull request via `peter-evans/create-pull-request`, authenticated with a fine-grained PAT so the existing `build`/`test` workflows actually trigger on it. Once those checks pass, the workflow has a second, distinct automated identity (the default `GITHUB_TOKEN`) submit an approving review — satisfying the repository's standing code-review gate mechanically rather than bypassing it — before enabling GitHub's native auto-merge on the PR. Any failure to reach the Content repository or authenticate ends the run in a failed, visible state on the very first bad attempt — no retry/backoff. No new content-validation logic is introduced; the pointer-bump PR rides the exact same `build.yml`/`test.yml` checks as any other change.

## Technical Context

**Language/Version**: YAML (GitHub Actions workflow syntax) + POSIX shell steps; Node 22 (already the repo's runtime) available to any inline scripting needed
**Primary Dependencies**: `actions/checkout@v7` (submodule checkout, already in use), `peter-evans/create-pull-request@v7` (create-or-update PR semantics — satisfies FR-004's "update existing proposal" behavior out of the box), GitHub CLI `gh` (pre-installed on `ubuntu-latest` runners, used to enable native auto-merge), git itself (`git submodule update --remote`, SHA comparison)
**Storage**: N/A — no new persisted state; the Content repository's latest commit and the Site repository's existing open PR (if any) are the only state consulted, both read live via git/GitHub API on each run
**Testing**: No new application code is introduced (see Constitution Check, Principle II) — validation is a documented manual dry run via `workflow_dispatch` (quickstart.md) plus the workflow's own run history in the Actions tab, which is the existing observability mechanism for every other scheduled/CI workflow in this repo
**Target Platform**: GitHub Actions (`ubuntu-latest` runner), operating against two GitHub repositories (Site + Content)
**Project Type**: CI/CD automation (single new workflow file) — no application, frontend, or backend code changes
**Performance Goals**: N/A — not a user-facing or request-serving component; SC-001's "live within 1 hour" is satisfied by an hourly `schedule` trigger, not a throughput target
**Constraints**: Must not introduce or duplicate content-validation logic (FR-003); must authenticate with a fine-grained PAT, not the default `GITHUB_TOKEN` (Clarifications, 2026-09-21); must fail visibly on the first bad check, no retry/backoff (FR-007); at most one open pointer-bump PR at a time (FR-004/FR-005)
**Scale/Scope**: Single scheduled workflow, single PR lifecycle at a time, single maintainer — no concurrency beyond what `peter-evans/create-pull-request`'s create-or-update behavior already handles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies how | Gate status |
|---|---|---|
| I. Code Quality Excellence | The only new artifact is a declarative GitHub Actions workflow YAML file composed from existing, already-vetted building blocks (`actions/checkout`, `peter-evans/create-pull-request`, `gh`) — no custom application logic, no new abstraction layer. Kept DRY by reusing `build.yml`/`test.yml` as-is rather than re-implementing checks (FR-003). | PASS |
| II. Comprehensive Testing (NON-NEGOTIABLE) | No business logic (functions, modules, services) is introduced — the workflow orchestrates existing, independently-tested tools. Traditional unit/integration coverage doesn't apply to a declarative CI config the way it applies to application code. Validation instead takes the form of a documented manual `workflow_dispatch` dry run (quickstart.md) exercising the real create/update/approve/merge/failure paths, plus the workflow's own run history as the ongoing regression signal. | DEVIATION (documented below in Complexity Tracking, not a silent exception) |
| III. User Experience Consistency | No user-facing surface — this is a maintainer-only backend automation. Trivially satisfied by scope. | PASS |
| IV. Performance Optimization | No browser-shipped code, no bundle-size impact, no runtime performance surface. An hourly scheduled workflow run is negligible against any budget. | PASS |

One violation requiring justification — see Complexity Tracking below.

## Project Structure

### Documentation (this feature)

```text
specs/003-submodule-auto-bump/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md         # Phase 1 output (/speckit.plan command)
├── quickstart.md         # Phase 1 output (/speckit.plan command)
├── contracts/            # Phase 1 output (/speckit.plan command)
└── tasks.md              # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is the existing single Astro static site (no new project, no frontend/backend split). The only addition is one new GitHub Actions workflow file; nothing under `src/` changes.

```text
Portfolio/ (this repository — "Site Repository")
├── .github/
│   └── workflows/
│       └── bump-content.yml        # NEW — scheduled check + PR create/update + auto-merge
├── content/                        # unchanged — existing git submodule (from 002-content-decoupling)
├── .gitmodules                      # unchanged — already registers content/ as a submodule
└── (no other paths touched by this feature)
```

**Structure Decision**: Single new workflow file (`.github/workflows/bump-content.yml`) alongside the existing `build.yml`/`test.yml`/`lighthouse.yml`. No new top-level project, no application code changes — this keeps the feature's entire footprint in CI/CD configuration, consistent with it being pure automation around the `content` submodule that 002-content-decoupling already introduced.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| No automated unit/integration tests for `bump-content.yml` (Principle II, NON-NEGOTIABLE, normally requires ≥80% coverage for all new code) | The feature's only artifact is a declarative workflow composed of existing, independently-tested actions (`actions/checkout`, `peter-evans/create-pull-request`) and CLI calls; the one custom decision point (`git diff --quiet -- content`) is a single delegated git command, not custom logic to unit-test in isolation. | A hand-rolled test harness or `act`-based local CI simulation was considered and rejected as disproportionate new, untested infrastructure for a single-maintainer personal site. Manual `workflow_dispatch` dry runs (quickstart.md, exercised in T007/T009/T011) cover create/update/approve/merge/failure paths instead. **Sunset/review: reassess if this workflow gains custom scripting beyond git/gh CLI calls, or by 2026-12-31.** |

## Post-Design Constitution Re-Check

*Performed after Phase 1 (research.md, data-model.md, contracts/, quickstart.md).*

Design artifacts introduced nothing beyond what the initial Constitution Check anticipated: one workflow file composed of existing marketplace actions and `gh` CLI calls, no new services, no new abstractions, no application code. The testing-scope deviation under Principle II is now documented above (Complexity Tracking) rather than silently passed, and is reflected in quickstart.md's manual `workflow_dispatch` dry-run steps, covering the create, update, approve, auto-merge, and failure-visibility paths from data-model.md and contracts/workflow-contract.md. The review-bypass approach originally sketched for FR-008 was replaced with an automated-approval step (a distinct identity submits an approving review before merge), which satisfies the constitution's Quality Assurance & Standards "minimum 1 approval" gate directly instead of exempting the PR from it — this is reflected in contracts/workflow-contract.md's Job steps and Required repository configuration, and in tasks.md's T005a. Three gates remain **PASS**; Principle II is a documented, approved deviation (Complexity Tracking, sunset 2026-12-31).
