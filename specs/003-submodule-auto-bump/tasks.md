# Tasks: Content Submodule Auto-Bump

**Input**: Design documents from `/specs/003-submodule-auto-bump/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workflow-contract.md, quickstart.md

**Tests**: Not included — this is a documented, approved deviation from Principle II (see plan.md's Complexity Tracking), not a silent exemption: the feature introduces no custom application code (it composes existing, independently-tested GitHub Actions), so unit/integration coverage doesn't meaningfully apply. Validation is manual, via quickstart.md's five scenarios, run as part of the relevant story tasks below.

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing.

## Path Conventions

Single Astro project at the repository root (unchanged). This feature's only code artifact is one new file, `.github/workflows/bump-content.yml`, alongside the existing `build.yml`/`test.yml`/`lighthouse.yml`. Some Setup tasks are repository *configuration* (secrets, branch protection, repo settings) rather than file edits — these are called out explicitly since they have no file path.

---

## Phase 1: Setup

**Purpose**: Stand up the credentials and repository settings the workflow depends on.

- [X] T001 [P] Create `.github/workflows/bump-content.yml` with `name: Bump Content`, triggers `on: schedule: - cron: '0 * * * *'` and `on: workflow_dispatch:`, and a single job (e.g. `bump-content`) on `runs-on: ubuntu-latest` with no steps yet — per [contracts/workflow-contract.md](./contracts/workflow-contract.md) "Trigger"
- [ ] T002 [P] Create a fine-grained Personal Access Token scoped to this repository only, with `contents: write` and `pull-requests: write` permissions, and add it as the repository secret `CONTENT_BUMP_PAT` (Settings → Secrets and variables → Actions) — no file changes; per [contracts/workflow-contract.md](./contracts/workflow-contract.md) "Required secrets" and [research.md](./research.md) §3
- [ ] T003 [P] In repository settings, enable "Allow auto-merge" (Settings → General → Pull Requests) — no branch-protection changes are needed, since the code-review gate is satisfied automatically rather than bypassed (see T005a) — no file changes; per [contracts/workflow-contract.md](./contracts/workflow-contract.md) "Required repository configuration"

**Checkpoint**: The workflow file exists (empty job), the write credential exists, and auto-merge is enabled at the repository level.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared "is there newer content?" detection logic every user story's behavior depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 In `.github/workflows/bump-content.yml`, add the detection steps to the job from T001: (1) `actions/checkout@v7` with `submodules: true` and `ssh-key: ${{ secrets.CONTENT_REPO_DEPLOY_KEY }}`; (2) run `git submodule update --remote content`; (3) a step that runs `git diff --quiet -- content`, capturing whether the `content` pointer changed into a step output (e.g. `changed`) for later steps to gate on — per [contracts/workflow-contract.md](./contracts/workflow-contract.md) job steps 1–3 and [research.md](./research.md) §1 (Pinned Content Reference identity, per [data-model.md](./data-model.md))

**Checkpoint**: On each run, the workflow can now determine whether the Content repository has commits newer than the pinned reference — it does not yet act on that information.

---

## Phase 3: User Story 1 - New content automatically reaches the site (Priority: P1) 🎯 MVP

**Goal**: When newer content exists, a pull request advancing the pinned reference is opened, passes the Site repository's existing checks, and merges automatically with no manual action.

**Independent Test**: Push a new, valid project entry to the Content repository's default branch; confirm a PR advancing the pinned reference opens without any manual action in the Site repository, passes the existing automated checks, and merges on its own.

### Implementation for User Story 1

- [X] T005 [US1] In `.github/workflows/bump-content.yml`, add a step (conditioned on T004's `changed` output) using `peter-evans/create-pull-request@v7` with `token: ${{ secrets.CONTENT_BUMP_PAT }}`, a fixed `branch: chore/bump-content` (so the Pointer-Bump Proposal's identity stays stable across runs, per [data-model.md](./data-model.md)'s uniqueness rule), `delete-branch: true`, and `commit-message`/`title`/`body` populated per the PR content contract in [contracts/workflow-contract.md](./contracts/workflow-contract.md) (title `chore: bump content submodule to <short-sha>`; body includes the full new commit SHA, a compare link to the Content repository, and a note that the PR was opened automatically) — depends on T004
- [X] T005a [US1] Add `permissions: pull-requests: write` to the job in `.github/workflows/bump-content.yml`, then add a step after T005 (conditioned on a PR having been created/updated) that runs `gh pr review --approve <pr-number-or-url>` authenticated with the default `GITHUB_TOKEN` — this identity is distinct from the `CONTENT_BUMP_PAT` actor that authored the PR (GitHub disallows an actor approving its own PR), so this submits a real, separate approving review that satisfies the constitution's "minimum 1 approval" code-review gate mechanically rather than bypassing it (FR-008) — depends on T005
- [X] T006 [US1] In `.github/workflows/bump-content.yml`, add a step after T005a (conditioned on a PR having been created/updated) that runs `gh pr merge --auto --squash <pr-number-or-url>` authenticated with `${{ secrets.CONTENT_BUMP_PAT }}`, enabling GitHub's native auto-merge so the PR merges itself once the existing `build.yml`/`test.yml` checks pass and T005a's approval is recorded, with no new/duplicate validation logic (FR-003) — depends on T005a
- [ ] T007 [US1] Run quickstart.md Scenario 1 (happy path) end-to-end: push a small valid change to the Content repository, trigger the workflow via `workflow_dispatch`, confirm the PR opens on `chore/bump-content`, confirm `build.yml`/`test.yml` actually trigger and pass, confirm an approving review from `github-actions[bot]` appears on the PR, and confirm the PR merges automatically with `main`'s `content` pointer updated to match. Also run Scenario 4 (failing content still gates merge normally): push an intentionally invalid Content entry, confirm the resulting PR's checks fail and it does **not** merge (FR-009), then push a fix and confirm it then merges — depends on T005, T005a, T006

**Checkpoint**: User Story 1 is fully functional and independently verified — this is the deployable MVP.

---

## Phase 4: User Story 2 - Rapid content edits collapse into one proposal (Priority: P2)

**Goal**: Multiple content commits pushed before the existing proposal merges update that same proposal rather than creating a second one, and once merged, a subsequent check with nothing new opens nothing.

**Independent Test**: Push two separate content commits to the Content repository in quick succession, before the first pointer-bump PR has merged; confirm exactly one PR exists throughout and it ends up pointing at the second (latest) commit before merging.

### Implementation for User Story 2

- [X] T008 [US2] Review `.github/workflows/bump-content.yml`'s T005 step and confirm `branch:` is the fixed literal `chore/bump-content` (not derived from a timestamp or SHA) — `peter-evans/create-pull-request`'s default behavior against a fixed branch name already updates an existing open PR in place rather than opening a second one, which is what satisfies FR-004; adjust the step only if it is not already a fixed literal — depends on T005
- [ ] T009 [US2] Run quickstart.md Scenario 2 (rapid edits collapse into one proposal) end-to-end: with a pointer-bump PR open and unmerged, push a second valid content commit and re-run the workflow; confirm no second PR is created and the existing PR now points at the newer commit. Also run Scenario 3 (no-op when no newer commits): after that PR merges, re-run the workflow with nothing new pushed and confirm no PR is created or modified (FR-005) — depends on T008

**Checkpoint**: User Stories 1 and 2 both work independently — proposals never duplicate or go stale.

---

## Phase 5: User Story 3 - Failures are visible, not silent (Priority: P3)

**Goal**: If the Content repository is unreachable or credentials fail, the check ends in a clearly failed, visible run rather than a silent no-op.

**Independent Test**: Simulate the Content repository being unreachable (e.g., revoke access) and confirm the check surfaces a clearly failed/visible run rather than completing as if nothing were wrong.

### Implementation for User Story 3

- [X] T010 [US3] Review every step added in T004–T006 (including T005a) in `.github/workflows/bump-content.yml` and confirm none sets `continue-on-error: true` or otherwise suppresses a non-zero exit (checkout failure, `git submodule update --remote` failure, invalid/expired `CONTENT_BUMP_PAT`, or a failed `gh pr review --approve` call), so any such failure fails the overall job on that same run with no retry or backoff, per FR-007 and the 2026-09-21 spec Clarifications — depends on T004, T005, T005a, T006
- [ ] T011 [US3] Run quickstart.md Scenario 5 (failure visibility) end-to-end: temporarily invalidate `CONTENT_REPO_DEPLOY_KEY` (or `CONTENT_BUMP_PAT`), re-run the workflow via `workflow_dispatch`, confirm the run shows **failed** in the Actions tab immediately on that run, then restore the credential and confirm the next run succeeds normally — depends on T010

**Checkpoint**: All three user stories are independently functional and verified — the feature is complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final housekeeping across all stories.

- [X] T012 [P] Update `README.md`'s deployment/CI section to document the new `bump-content.yml` workflow, its hourly schedule, and the `CONTENT_BUMP_PAT` secret requirement, matching the existing style of the "Grant Netlify read access" deploy-key note
- [X] T014 [P] Add an `actionlint` check (e.g. via `reviewdog/action-actionlint`) validating `.github/workflows/*.yml`, satisfying constitution Principle I's linting requirement for the new `bump-content.yml` file
- [ ] T013 Perform quickstart.md's Cleanup step: close/delete any test PRs and revert any deliberately-invalid content pushed to the Content repository during T007/T011, and confirm branch protection and secrets are left in their intended final state (not the deliberately-broken state from T011) — depends on T007, T009, T011

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001, T002, T003 can all start immediately and run in parallel (different resources: a new file, a secret, repository settings)
- **Foundational (Phase 2)**: T004 depends on T001 (edits the file it creates) — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational (T004) completion
  - User Story 1 (P1) can start immediately after T004
  - User Story 2 (P2) depends on User Story 1's T005 (it reviews/builds on that same step)
  - User Story 3 (P3) depends on User Story 1's T004–T006, including T005a (it reviews those same steps) — can run in parallel with User Story 2 once US1 is done, since they touch different concerns
- **Polish (Phase 6)**: T012 and T014 can run any time after T001; T013 depends on all three stories' validation tasks (T007, T009, T011)

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational (T004) — no dependency on other stories
- **User Story 2 (P2)**: Builds on User Story 1's T005 (same workflow step) but is independently testable via its own quickstart scenarios
- **User Story 3 (P3)**: Reviews User Story 1's T004–T006 (same workflow steps) but is independently testable via its own quickstart scenario; does not depend on User Story 2

### Parallel Opportunities

- T001, T002, T003 (Setup) can all run in parallel — different resources
- T012 (README update) and T014 (actionlint) can run in parallel with any story phase once T001 exists
- User Story 2 and User Story 3 can be worked on in parallel once User Story 1 (T005/T005a/T006) is complete, since one reviews the PR-creation step and the other reviews failure handling

---

## Parallel Example: Setup

```bash
# Launch all Setup tasks together:
Task: "Create .github/workflows/bump-content.yml with triggers and empty job"
Task: "Create fine-grained PAT and add as CONTENT_BUMP_PAT secret"
Task: "Enable auto-merge in repository settings"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004) — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T005, T005a, T006, T007)
4. **STOP and VALIDATE**: Quickstart Scenarios 1 and 4 both pass
5. This is a deployable MVP — content already flows end-to-end with no manual steps

### Incremental Delivery

1. Setup + Foundational → detection logic ready
2. Add User Story 1 → validate (Scenarios 1, 4) → MVP live
3. Add User Story 2 → validate (Scenarios 2, 3) → proposal collapsing confirmed
4. Add User Story 3 → validate (Scenario 5) → failure visibility confirmed
5. Polish: document in README, clean up test artifacts

---

## Notes

- [P] tasks = different files/resources, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature has no application code, so "tests" are the quickstart.md manual scenarios referenced directly in T007, T009, and T011
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
