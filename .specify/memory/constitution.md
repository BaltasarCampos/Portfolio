# BCCB Portfolio Constitution

## Purpose

This project exists to represent a frontend engineer's work and identity on the web. Every decision made during development must serve that purpose — clearly, honestly, and with craft.

## Core Principles

### I. Code Quality Excellence (NON-NEGOTIABLE)

Every line of code MUST adhere to established quality standards and best practices. Code quality is not negotiable—it is the foundation of maintainability and reliability.

**Requirements:**
- All code MUST pass automated linting and static analysis tools (ESLint, TypeScript strict mode, security scanners)
- Code MUST follow project-specific style guides and naming conventions without exception
- Complex functions MUST be documented with JSDoc/equivalent, including parameter types and return values
- Code MUST be DRY (Don't Repeat Yourself)—duplicated logic MUST be refactored into reusable modules
- Maximum cyclomatic complexity: 10 per function; functions exceeding this MUST be redesigned
- Code reviews MUST verify quality before merge; no exceptions for expedited timelines

**Rationale:** Poor code quality compounds technical debt, increases debugging time, and creates security vulnerabilities. Consistent quality standards reduce onboarding friction and enable confident refactoring.

### II. Comprehensive Testing (NON-NEGOTIABLE)

Test-driven development (TDD) is mandatory. No feature is complete without proven test coverage validating all critical paths, edge cases, and error conditions.

**Requirements:**
- Unit test coverage MUST be ≥80% for all new code
- Integration tests MUST cover all public APIs and inter-module communication
- All business logic MUST have explicit test cases demonstrating expected behavior
- Tests MUST execute and pass in CI/CD pipeline before any code merge
- Test names MUST clearly describe the scenario and expected outcome (e.g., `should_return_empty_array_when_no_filters_applied`)
- Breaking changes MUST include updated test suites demonstrating backward compatibility or deprecation path
- Failing tests MUST block PR merges; red-green-refactor cycle is strictly enforced

**Test Categories Required:**
- Unit: Isolated function/method validation
- Integration: Cross-module and API contract validation
- End-to-End (E2E): Critical user workflows validated from UI/CLI to backend
- Performance: Response time and resource usage validated against benchmarks

**Rationale:** Tests are the specification. They document intended behavior and catch regressions immediately. High test coverage enables confident refactoring and prevents silent failures in production.

### III. User Experience Consistency (NON-NEGOTIABLE)

All user-facing interfaces MUST provide consistent, predictable, and intuitive experiences across all surfaces (Web UI, CLI, API).

**Requirements:**
- Design language MUST be consistent across all surfaces (button styles, terminology, error messaging, flow patterns)
- UX patterns MUST be reused; new patterns MUST be approved by design lead before implementation
- Error messages MUST be user-friendly, actionable, and consistent in format across all interfaces
- All interactive elements MUST be keyboard-accessible; WCAG 2.1 AA compliance is mandatory
- Response times for user actions MUST be ≤1s for feedback; >3s operations MUST show progress indicators
- API response formats MUST be standardized (e.g., consistent error response structure, pagination format)
- CLI outputs MUST support both human-readable and machine-parseable (JSON) formats
- Breaking UX changes MUST include migration guide and deprecation period (minimum 2 releases)

**Consistency Rules:**
- Terminology MUST be standardized in glossary; misspellings and variations are prohibited
- Form validation MUST provide immediate, inline feedback
- Navigation patterns MUST be predictable across all contexts
- Loading states MUST be visible and informative

**Rationale:** Consistent UX reduces user frustration, shortens learning curve, and builds trust. Accessibility is a legal and ethical requirement.

### IV. Performance Optimization (NON-NEGOTIABLE)

All components MUST meet defined performance budgets. Performance is not a "nice-to-have"; it directly impacts user experience and operational cost.

**Requirements:**
- Rendering time for UI components MUST be ≤16ms (60 FPS standard)
- API response time MUST be ≤200ms for 95th percentile under normal load
- Bundle size MUST not exceed established budget; additions require review and justification
- Memory usage MUST not increase >10% in any release without documented justification
- Database queries MUST be optimized (indexed, batched where appropriate); N+1 queries are forbidden
- Caching strategy MUST be implemented for frequently accessed data
- Large operations (>5s) MUST be offloaded to background jobs with progress tracking
- Performance regressions detected in CI MUST block merge unless explicitly approved

**Monitoring Requirements:**
- Real User Monitoring (RUM) MUST track response times and error rates
- Synthetic monitoring MUST validate critical paths continuously
- Performance metrics MUST be tracked in dashboard and reviewed in sprint retrospectives

**Rationale:** Poor performance directly increases user churn, operational costs, and support burden. Proactive performance budgeting prevents degradation and ensures scalability.

## Quality Assurance & Standards

All code MUST pass defined quality gates before merging to main branch. Quality gates include:

- **Linting & Formatting:** Code MUST pass ESLint and Prettier
- **Type Safety:** TypeScript strict mode compliance mandatory
- **Security:** SAST (Static Application Security Testing) must pass; no high/critical vulnerabilities
- **Code Review:** Minimum 1 approval from code owner; design/UX review required for user-facing changes
- **Automated Testing:** Unit + Integration tests MUST pass; coverage ≥80%
- **Performance Validation:** Benchmark comparison MUST show no regression (within 5% tolerance)
- **Accessibility Audit:** Automated WCAG checks MUST pass; manual audit for major UX changes

## Performance & Scalability Requirements

The system MUST be architected to scale horizontally and maintain performance under load.

**Requirements:**
- Stateless services MUST enable horizontal scaling
- Database queries MUST be optimized for known growth trajectories
- Caching layers MUST be implemented at application and infrastructure levels
- Rate limiting MUST be implemented for all public endpoints
- Load testing MUST be performed before major releases; results MUST be documented
- Monitoring alerts MUST be configured for performance degradation (response time, error rate, resource usage)
- Capacity planning MUST be reviewed quarterly; auto-scaling thresholds MUST be tuned to load patterns

## Constraints

These constraints are absolute. They may not be bypassed for convenience, deadlines, or aesthetic preference.

1. **The site must be usable without a mouse.** Full keyboard navigation is required everywhere.
2. **The site must be usable without animations.** Every animated state must have a static equivalent.
3. **The site must be usable on a slow connection.** Performance budgets exist for this reason.
5. **The codebase must be maintainable.** Future contributors — including future AI models — must be able to work in it without needing to undo the past.

## Governance

**Constitution Authority:**
- This constitution supersedes all conflicting practices and informal standards
- All PRs and code reviews MUST verify compliance with these principles
- Deviations require documented exception approval with explicit rationale and sunset date

**Amendment Procedure:**
1. Proposed amendment MUST be documented with rationale
2. Technical team MUST review and discuss impact analysis
3. Approval MUST be unanimous from core team; if consensus blocked, decision escalates to project lead
4. Amendment MUST include migration plan for affected code
5. Version MUST be bumped and all dependent documentation updated

**Version Bumping Policy:**
- MAJOR: Principle removal, redefinition, or backward-incompatible governance change
- MINOR: New principle added, existing principle materially expanded, new required quality gate
- PATCH: Wording clarifications, typo fixes, example updates, non-semantic refinements

**Compliance Review:**
- Quarterly reviews of constitution adherence MUST be conducted
- Metrics MUST be gathered on test coverage, code quality, performance, and accessibility
- Persistent non-compliance MUST trigger corrective action plan

**Version**: 1.0.0 | **Ratified**: 2026-03-03 | **Last Amended**: 2026-03-03
