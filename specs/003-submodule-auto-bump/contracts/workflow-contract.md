# Contract: `bump-content.yml` Workflow

This feature has no HTTP/library API. Its "contract" is the interface the new GitHub Actions workflow presents to the rest of the repository (and its operator): what triggers it, what secrets/permissions it requires, and the exact shape of the pull request it produces. Downstream tooling (branch protection rules, the maintainer reading a PR) can rely on this contract.

## Trigger

| Trigger | Purpose |
|---|---|
| `schedule: cron: '0 * * * *'` | Hourly check, satisfying SC-001 ("live within 1 hour") and the spec's Assumption of an hourly cadence |
| `workflow_dispatch:` | Manual on-demand run, used for the quickstart.md validation dry run and for the maintainer to force an immediate check |

No `push`/`pull_request` trigger — this workflow only reacts to the Content repository's state, never to Site-repository changes.

## Required secrets

| Secret | Purpose | Scope |
|---|---|---|
| `CONTENT_REPO_DEPLOY_KEY` | SSH deploy key, already exists (used by `build.yml`/`test.yml`) — grants read-only checkout of the `content` submodule | Read-only, Content repository only |
| `CONTENT_BUMP_PAT` | **New.** Fine-grained PAT used to commit the pointer bump, open/update the PR, and enable auto-merge | Write, Site repository only — `contents: write`, `pull-requests: write` |

No new secret is needed for the approval step — it uses the default `GITHUB_TOKEN`, which GitHub provides to every workflow run. The job must declare `permissions: pull-requests: write` for that token to be able to submit a review.

## Required repository configuration (one-time, non-workflow)

- The repository's "Allow auto-merge" setting must be enabled (Settings → General → Pull Requests) for `gh pr merge --auto` to have any effect.
- No branch-protection bypass or review exemption is required. The existing "minimum 1 approval" rule is satisfied directly: the default `GITHUB_TOKEN` identity (`github-actions[bot]`, distinct from the `CONTENT_BUMP_PAT` actor that authors the PR — GitHub disallows an actor approving its own PR) submits an approving review before auto-merge is enabled. Branch protection stays unchanged for every other PR.

## Job steps (contract, not implementation)

1. Checkout the Site repository with submodules (`actions/checkout@v7`, `submodules: true`, `ssh-key: CONTENT_REPO_DEPLOY_KEY`).
2. `git submodule update --remote content` — advances the local submodule checkout to the Content repository's default-branch HEAD.
3. If `content`'s pointer is unchanged (`git diff --quiet -- content`): stop here, no further steps run (FR-005). This is the "no PR opened/modified" path.
4. If changed: run `peter-evans/create-pull-request@v7` with:
   - `token: secrets.CONTENT_BUMP_PAT`
   - `branch: chore/bump-content` (fixed — enforces FR-004's single-open-proposal behavior)
   - `commit-message`, `title`, `body` per the PR content contract below
   - `delete-branch: true` (post-merge cleanup)
5. `gh pr review --approve <pr-number-or-url>`, authenticated with the default `GITHUB_TOKEN` (the job needs `permissions: pull-requests: write`) — submits the approving review that satisfies the repository's standing code-review gate mechanically, using an identity distinct from the PAT that authored the PR (FR-008).
6. `gh pr merge --auto --squash <pr-number-or-url>`, authenticated with `CONTENT_BUMP_PAT` — enables native auto-merge; GitHub merges the PR itself once required checks pass and the approval from step 5 is recorded (FR-008/FR-009).
7. Any failure in steps 1–6 (checkout failure, `submodule update` failure, PAT/token auth failure) exits the job non-zero — no retry, no catch step (FR-007, per the "fail immediately" clarification).

## Pull request content contract

| Field | Value |
|---|---|
| Branch | `chore/bump-content` (fixed name, always reused) |
| Title | `chore: bump content submodule to <short-sha>` where `<short-sha>` is the new Content-repository commit's short SHA |
| Body | Must include: the full new commit SHA, a link to the Content repository comparing old → new SHA (e.g. `https://github.com/<content-repo>/compare/<old-sha>...<new-sha>`), and a note that this PR was opened automatically (satisfies FR-006 — "make clear which content commit(s) it advances to") |
| Labels | None required by this feature; optional for maintainer convenience |

## Failure contract

| Condition | Observable result |
|---|---|
| Content repository unreachable / deploy key invalid | Workflow run shows **failed** in the Actions tab, on the run where it occurred — no silent success (FR-007, User Story 3) |
| `CONTENT_BUMP_PAT` invalid/expired | Same as above — the PR-creation or auto-merge-enable step fails the run |
| No newer commits found | Workflow run shows **success**, with a no-op outcome (no PR created/modified) — this is not a failure (FR-005) |
| Newer commits found, checks on the resulting PR fail | Workflow run itself still shows **success** (the check step correctly found and proposed the update); the PR remains open, unmerged, reflecting its own failing checks like any other PR (FR-009) — this is a separate, already-existing signal (the PR's own check status), not a `bump-content.yml` run failure |
