# Feature Specification: Content Submodule Auto-Bump

**Feature Branch**: `[003-submodule-auto-bump]`
**Created**: 2026-09-21
**Status**: Draft
**Input**: User description: "small script/Action in Portfolio that watches portfolio-content for new commits and auto-bumps+pushes the pointer"

## Clarifications

### Session 2026-09-21

- Q: What credential should the automation use to open and auto-merge the pointer-bump pull request in the Site repository? → A: Fine-grained PAT (repo-scoped secret), not the default `GITHUB_TOKEN`.
- Q: FR-008 requires the pointer-bump PR to merge with no manual approval — if the Site repository's branch protection requires a human-approved review before merging to main, how should that be handled for this PR type? → A: Exempt the automation's actor from the review requirement specifically for pointer-bump PRs (e.g. a bypass list), while human review stays required for every other kind of change. *(Refined during `/speckit-analyze`: a branch-protection bypass would exempt the actor for any PR it opens, not just pointer-bump ones, and would skip the constitution's "minimum 1 approval" gate outright — see FR-008 and Assumptions below for the corrected mechanism: an automated approving review from a distinct identity, satisfying the gate rather than bypassing it.)*
- Q: When the automation can't reach the Content repository or its credentials fail (FR-007), should it report a visible failure on the very first bad check, or only after failing a few checks in a row? → A: Fail immediately and visibly on the very first failed attempt; no retry/backoff before surfacing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New content automatically reaches the site (Priority: P1)

Today, after pushing a content change to the Content repository, the maintainer must manually run `git submodule update --remote`, `git add content`, commit, and push in the Site repository before the new content can reach production. This story removes that manual step entirely: once new commits land on the Content repository's default branch, the Site repository's pinned content reference is automatically advanced and, once it passes the same checks any other change would, merged — with no git commands and no manual merge click required.

**Why this priority**: This is the entire point of the feature — it's the one piece of remaining manual toil in an otherwise fully-decoupled content workflow. Without this, the feature has no value.

**Independent Test**: Push a new, valid project entry to the Content repository's default branch. Confirm that, without any manual action in the Site repository, a pull request advancing the pinned content reference is opened, passes the Site repository's existing automated checks, and merges on its own — and that the new content is live shortly after.

**Acceptance Scenarios**:

1. **Given** the Content repository has commits newer than the Site repository's currently pinned reference, **When** the system next checks, **Then** a pull request is opened (or an existing one updated) in the Site repository advancing the pinned reference to the latest commit.
2. **Given** the Content repository has no commits newer than the currently pinned reference, **When** the system checks, **Then** no pull request is opened and no existing pull request is modified.
3. **Given** a pointer-bump pull request has been opened, **When** its checks run, **Then** they are the exact same automated checks (tests, lint, type-check, build) that already gate every other change to the Site repository — no separate or duplicated validation logic is introduced.
4. **Given** a pointer-bump pull request's checks all pass, **When** the last check completes, **Then** the pull request merges automatically with no manual approval step.

---

### User Story 2 - Rapid content edits collapse into one proposal (Priority: P2)

The maintainer sometimes pushes several small content fixes in a short span (e.g., three typo corrections within an hour) before getting around to reviewing/merging the resulting update. Rather than accumulating multiple stale or duplicate proposals, the system keeps a single proposal current, always reflecting the latest available content.

**Why this priority**: Prevents pull request clutter and confusion about which proposal is current; meaningfully improves the day-to-day experience of the automation but isn't required for the core value in User Story 1 to work.

**Independent Test**: Push two separate content commits to the Content repository in quick succession, before the pointer-bump pull request from the first has had a chance to pass checks and merge. Confirm exactly one pull request exists throughout, and it ends up pointing at the second (latest) commit before merging.

**Acceptance Scenarios**:

1. **Given** an open pointer-bump pull request already exists, **When** additional new commits are detected on the Content repository, **Then** the existing pull request is updated to reference the newest commit rather than a second pull request being created.
2. **Given** the pointer-bump pull request has merged, **When** the system next checks and finds no newer commits, **Then** no new pull request is opened.

---

### User Story 3 - Failures are visible, not silent (Priority: P3)

If the system can't reach the Content repository, its credentials stop working, or the check itself errors out, the maintainer needs to find out — not have content quietly stop updating with no indication why.

**Why this priority**: Reliability/observability concern. The feature is safe to ship without this, but silent failure would erode trust in the automation and could go unnoticed for a long time on a low-traffic personal site.

**Independent Test**: Simulate the Content repository being unreachable (e.g., revoke access) and confirm the check surfaces a clearly failed/visible run rather than completing as if nothing were wrong.

**Acceptance Scenarios**:

1. **Given** the system cannot access the Content repository when checking for new commits, **When** the check runs, **Then** it ends in a clearly failed, visible state rather than silently succeeding with no changes.

---

### Edge Cases

- What happens when the Content repository has no commits newer than the pinned reference? No pull request is opened or modified (User Story 1, Scenario 2).
- What happens when multiple new content commits land before the existing proposal has merged? The existing proposal is updated in place, not duplicated (User Story 2).
- What happens when the automated checks on a pointer-bump pull request fail (e.g., the new content violates the schema)? The pull request reflects the failing checks like any other pull request in this repository; it is not merged, and no separate failure path is introduced beyond what already exists for any other change.
- What happens when the check itself cannot run (repository unreachable, credential invalid/expired)? The check fails visibly (User Story 3) rather than silently doing nothing.
- What happens if the maintainer has already manually bumped the pointer since the last check? No pull request is opened, since there are no commits newer than the (now manually updated) pinned reference.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST periodically determine whether the Content repository's default branch has commits newer than the Site repository's currently pinned content reference.
- **FR-002**: When newer commits exist, system MUST propose advancing the pinned content reference to the latest commit as a reviewable change in the Site repository (e.g., a pull request), rather than modifying the reference directly on the production branch.
- **FR-003**: The proposed change MUST be subject to the exact same automated checks that already apply to any other change in the Site repository. No new or duplicate content-validation logic may be introduced to support this feature.
- **FR-004**: If a proposed change from this system is already open and unmerged when additional newer commits are detected, system MUST update that same proposal to reference the newest commit rather than creating an additional one.
- **FR-005**: System MUST NOT create or modify a proposal when there are no commits newer than the currently pinned reference.
- **FR-006**: Each proposed change MUST make clear which content commit(s) it advances to, so the maintainer can see what's changing before merging.
- **FR-007**: If the system is unable to check for new commits (e.g., the Content repository is unreachable or credentials are invalid), it MUST fail in a visible, discoverable way rather than completing silently as a no-op. It MUST surface this failure on the very first failed attempt — no retry or backoff period before the failure becomes visible.
- **FR-008**: Once a pointer-bump proposal's automated checks pass, system MUST merge it into the Site repository's production branch automatically — no *human* approval step is required for this specific type of change. The Site repository's standing code-review requirement MUST still be satisfied, not bypassed: a distinct, automated identity (not the identity that authored the proposal) MUST submit an approving review before merge. This mechanism applies only to pointer-bump proposals; it MUST NOT extend to any other kind of change.
- **FR-009**: If a pointer-bump proposal's automated checks fail, system MUST NOT merge it. It remains open (and continues to be keepable up to date per FR-004) until either the underlying content is fixed and the checks pass, or the maintainer intervenes manually.

### Key Entities

- **Pinned Content Reference**: The specific Content-repository commit currently recorded in the Site repository (via the `content` submodule pointer) — represents what content is actually live/building today, as distinct from whatever is newest available in the Content repository.
- **Pointer-Bump Proposal**: An automatically created and maintained proposed change (e.g., pull request) in the Site repository that advances the Pinned Content Reference to a newer commit. At most one should be open at a time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a new, valid content commit is pushed, it is live in production within 1 hour, with zero manual actions (no git commands, no manual merge) taken by the maintainer.
- **SC-002**: 100% of content updates that reach the production branch pass through the same automated checks as any other change — zero instances of a content update bypassing existing validation.
- **SC-003**: When multiple content commits are pushed before the first has finished merging, at most one pointer-bump pull request is ever open at a time, and it always reflects the latest content — never a stale one left behind, never a duplicate.
- **SC-004**: When the system cannot check for new commits, the maintainer can discover this within the same visibility window they already use for other automation failures (i.e., it shows up as a failed run like any other), with no silent multi-day gaps in content freshness going unnoticed.
- **SC-005**: When a content commit fails the existing automated checks (e.g., an invalid entry), it never reaches production — the pointer-bump proposal simply stays open and unmerged instead.

## Assumptions

- The automation watches only the Content repository's default branch; content pushed to other branches there is out of scope.
- A check interval on the order of an hour is an acceptable balance between freshness and simplicity for a low-traffic personal portfolio; this is not a real-time/instant-push requirement.
- The proposal mechanism reuses whatever pull-request tooling already exists for this repository rather than introducing a new review surface.
- The automation authenticates using a fine-grained Personal Access Token (PAT), scoped to this repository and stored as a repository secret — not the default `GITHUB_TOKEN`. This is required because pull requests/pushes made with the default token do not trigger other workflows, which would otherwise prevent the existing automated checks from ever running on the pointer-bump proposal.
- For this specific, narrow class of change (a content-pointer bump that must pass the existing automated checks), the repository's code-review gate is satisfied automatically rather than skipped: a second, distinct automated identity submits an approving review once checks pass, before auto-merge — no branch-protection exemption or bypass list is configured. Human review specifically is not required, justified by the change being fully mechanical (advance a pinned reference) and already fully validated by existing CI; it does not extend to any other kind of change in this repository.
- This feature only automates *proposing and merging the pointer bump itself*. It does not change what gets validated or how — content validation logic remains defined in exactly one place (the Site repository), per the project's earlier decision not to duplicate it in the Content repository.
