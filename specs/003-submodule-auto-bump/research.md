# Phase 0 Research: Content Submodule Auto-Bump

All items below were either resolved during `/speckit.clarify` (recorded in [spec.md](./spec.md)'s Clarifications section) or are standard technical decisions with a clear, low-risk default for this project's scale. No open NEEDS CLARIFICATION markers remain.

## 1. Detecting newer Content-repository commits

**Decision**: Use `git submodule update --remote` inside a workflow step that has already checked out the Site repository with `submodules: true`, then check `git status --porcelain` (or `git diff --quiet`) on the `content` path to see if the pointer moved.

**Rationale**: This is the same mechanism the maintainer already runs manually today (per spec's User Story 1 description), so it requires no new tooling or API surface — just automating an existing, understood command sequence. `--remote` resolves against the Content repository's configured branch (its default branch, per `.gitmodules`), matching FR-001's scope.

**Alternatives considered**:
- Querying the Content repository's default branch HEAD via the GitHub API (`GET /repos/{owner}/{repo}/commits/{branch}`) and comparing to the submodule's recorded SHA (`git submodule status`). Rejected as unnecessary — it duplicates what `git submodule update --remote` already does natively, and would require parsing API responses instead of using git directly.

## 2. Opening/updating the pointer-bump pull request

**Decision**: Use `peter-evans/create-pull-request@v8`, a widely-used, actively maintained GitHub Action purpose-built for "commit changes, open or update a PR" workflows (this is the same category of action commonly used for Dependabot-style version-bump automation).

**Rationale**: Its default behavior already satisfies FR-004/FR-005 out of the box — when pointed at a fixed `branch:` name, it updates the existing PR if one is open and unmerged, and does nothing if there's no diff to commit. This avoids hand-rolling PR create-vs-update branching logic (which would be exactly the kind of custom business logic Constitution Principle II would require tests for).

**Alternatives considered**:
- Hand-written steps using `gh pr create` / `gh pr edit` with manual "does an open PR already exist for this branch" checks. Rejected — reimplements what the action already provides, adds custom logic that would need its own test coverage for no functional benefit.

## 3. Authentication for cross-repo read + PR write/auto-merge

**Decision**: Two separate credentials, matching their distinct purposes:
- **Reading the Content repository** (submodule checkout): reuse the existing `secrets.CONTENT_REPO_DEPLOY_KEY` SSH deploy key already used by `build.yml`/`test.yml` — read-only, already scoped correctly, no change needed.
- **Opening/updating/auto-merging the PR in the Site repository**: a new fine-grained Personal Access Token (`secrets.CONTENT_BUMP_PAT`), per the 2026-09-21 clarification. Passed as the `token:` input to `peter-evans/create-pull-request` and used by `gh pr merge --auto`.

**Rationale**: The default `GITHUB_TOKEN` cannot be used for the PR-opening step because GitHub suppresses downstream `pull_request`-triggered workflow runs (`build.yml`, `test.yml`) for content created by the default token — this would silently break FR-003/FR-008 (the PR would open but never pass checks or merge, since the checks would never run). This was the primary reason for the clarification. A fine-grained PAT scoped to only this repository, with only `contents: write` + `pull-requests: write`, keeps blast radius minimal while sidestepping that limitation.

**Alternatives considered**:
- Default `GITHUB_TOKEN` — rejected, breaks check-triggering as above.
- GitHub App installation token — more setup (register + install an app) for a single-maintainer personal-site project; rejected as disproportionate, though noted as the lower-privilege option if this repo ever needs multi-repo automation beyond this one feature.

## 4. Merging without manual approval

**Decision**: Before enabling merge, have the default `GITHUB_TOKEN` (a distinct identity from the `CONTENT_BUMP_PAT` actor that authored the PR) submit an approving review via `gh pr review --approve`. Then enable GitHub's native auto-merge on the PR (`gh pr merge --auto --squash <PR_URL>`, authenticated with `CONTENT_BUMP_PAT`). No branch-protection changes are made — the repository's existing "minimum 1 approval" rule is satisfied directly rather than bypassed.

**Rationale**: This was revised during `/speckit-analyze`. The original approach (exempt the PAT's actor from required review via a branch-protection bypass) conflicted with the constitution's Quality Assurance & Standards gate ("Code Review: Minimum 1 approval from code owner," no stated exception) and, separately, was more permissive than intended — a bypass exempts an *actor* from review on any PR it opens, not just PRs from a specific branch, so it couldn't actually be scoped "specifically for pointer-bump PRs" as FR-008 requires. Having a second, distinct identity submit a real approving review satisfies the letter of the constitution's gate with zero human action, and needs no branch-protection changes at all — this is the same pattern commonly used to auto-approve Dependabot-style PRs. Native auto-merge still respects required status checks (so FR-009 — don't merge on failing checks — holds automatically) and now also depends on that approval being present.

**Alternatives considered**:
- A second workflow that polls check-run status and calls `gh pr merge` once green. Rejected — native auto-merge already does this server-side; polling would be redundant custom logic with its own failure modes (e.g., workflow timeout) to test and maintain.
- A branch-protection bypass/exemption for the PAT's actor (the original decision). Rejected per the rationale above — it doesn't scope cleanly to only pointer-bump PRs, and it skips the code-review gate rather than satisfying it.

## 5. Failure visibility (FR-007)

**Decision**: No explicit retry logic. If the checkout of the Content repository fails (bad/expired deploy key, repository unreachable) or the `CONTENT_BUMP_PAT`-authenticated steps fail, the step exits non-zero and the workflow run shows as failed in the Actions tab on that same run — the standard, existing failure-visibility mechanism already used by `build.yml`/`test.yml`/`lighthouse.yml`.

**Rationale**: Matches the 2026-09-21 clarification (fail immediately, every time, no retry/backoff) and requires zero new observability tooling — it's the same "red X in the Actions tab" signal the maintainer already watches for other automation (SC-004).

**Alternatives considered**:
- Retry-with-backoff before marking failed. Explicitly rejected by the clarification — an hourly schedule already provides natural retry-like behavior on the next run, and immediate visibility was preferred over suppressing transient-looking failures.

## 6. Trigger cadence

**Decision**: `schedule: cron: '0 * * * *'` (hourly), with `workflow_dispatch:` also enabled for manual on-demand runs (used by quickstart.md's validation steps).

**Rationale**: Directly satisfies the spec's Assumption ("check interval on the order of an hour") and SC-001's "live within 1 hour" outcome. `workflow_dispatch` costs nothing to add and is the standard way to manually validate a scheduled workflow without waiting for the next scheduled tick.

**Alternatives considered**:
- Content-repository-initiated trigger (e.g., a `repository_dispatch` sent from a workflow in the Content repository on push). Rejected for this iteration — it would require provisioning and storing a cross-repo-triggering credential *in the Content repository* as well, doubling the credential surface for a freshness improvement (near-instant vs. up-to-an-hour) the spec's own Assumptions section says isn't required.
