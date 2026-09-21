# Quickstart: Validating Content Submodule Auto-Bump

This is a manual validation guide (see plan.md's Constitution Check, Principle II note — no automated test suite applies to a declarative CI workflow with no custom application logic). Run through this after implementing `.github/workflows/bump-content.yml` and before considering the feature done.

## Prerequisites

- `CONTENT_REPO_DEPLOY_KEY` secret already exists in the Site repository (from 002-content-decoupling).
- New `CONTENT_BUMP_PAT` secret created (fine-grained PAT, `contents: write` + `pull-requests: write`, scoped to this repository only) and added to the Site repository's secrets.
- The workflow declares `permissions: pull-requests: write` so the default `GITHUB_TOKEN` can submit an approving review (no branch-protection changes needed — see contracts/workflow-contract.md's "Required repository configuration").
- "Allow auto-merge" enabled in repository settings.
- Push access to the Content repository (`portfolio-content`) for the dry-run steps below.

## Scenario 1 — Happy path: newer content triggers a PR that auto-merges

1. Push a small, valid change to the Content repository's default branch (e.g., a whitespace/comment fix on an existing project entry — must still pass Content-side schema validation once built by the Site repo).
2. In the Site repository, trigger the workflow manually: **Actions → bump-content → Run workflow** (`workflow_dispatch`).
3. **Expected**: A new PR appears on branch `chore/bump-content`, titled `chore: bump content submodule to <short-sha>`, referencing the pushed commit.
4. Watch the PR's checks (`build.yml`, `test.yml`) run — confirm they actually trigger (this is the specific failure mode the `CONTENT_BUMP_PAT` decision exists to avoid; if checks never start, the PAT/permissions setup is wrong).
5. **Expected**: An approving review from `github-actions[bot]` (the default `GITHUB_TOKEN`) appears on the PR once checks pass, before it merges — confirm this is a distinct identity from whichever account owns `CONTENT_BUMP_PAT`.
6. **Expected**: Once checks pass and the approval is recorded, the PR merges automatically with no manual click. Confirm `main`'s `content` submodule pointer now matches the pushed commit.

## Scenario 2 — Rapid edits collapse into one proposal

1. With Scenario 1's PR still open (before checks finish — pause/hold if needed by pushing a second content commit quickly), push a second small valid change to the Content repository.
2. Re-run the workflow manually.
3. **Expected**: No second PR is created. The existing `chore/bump-content` PR is updated to reference the newer commit (its title/body SHA changes; check its commit history shows the new tip).
4. Let checks pass — confirm exactly one PR existed throughout, and it merges pointing at the second (latest) commit.

## Scenario 3 — No newer commits → no-op

1. With nothing new pushed to the Content repository since the last successful merge, re-run the workflow manually.
2. **Expected**: The workflow run succeeds, but no PR is created or modified (verify via the Pull Requests tab — no `chore/bump-content` PR exists).

## Scenario 4 — Failing content still gates merge normally

1. Push an intentionally invalid entry to the Content repository (one that fails the Site repository's existing content schema validation).
2. Re-run the workflow manually.
3. **Expected**: A PR is opened/updated as usual (the bump-content workflow itself doesn't validate content). Its `build.yml`/`test.yml` checks fail, same as they would for any other change. The PR does **not** merge and remains open.
4. Push a follow-up fix to the Content repository correcting the invalid entry, re-run the workflow.
5. **Expected**: The same PR updates to the corrected commit, checks now pass, PR merges.

## Scenario 5 — Failure visibility

1. Temporarily invalidate `CONTENT_REPO_DEPLOY_KEY` (e.g., revoke the deploy key on the Content repository side, or edit the secret to garbage — revert afterward) or `CONTENT_BUMP_PAT`.
2. Re-run the workflow manually.
3. **Expected**: The `bump-content` workflow run itself shows **failed** in the Actions tab, immediately, on this run — not a silent success, not a delayed retry.
4. Restore the credential, confirm the next run succeeds normally.

## Cleanup

- Close/delete any test PRs and revert any deliberately-invalid content pushed to the Content repository during Scenarios 4–5.
- Confirm branch protection and secrets are left in their intended final state (not the deliberately-broken state from Scenario 5).
