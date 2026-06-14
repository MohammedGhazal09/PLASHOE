# Phase 12: Release Gate Production Cutover and Post Launch Review - Specification

**Created:** 2026-06-14
**Ambiguity score:** 0.08 (gate: <= 0.20)
**Requirements:** 8 locked

## Goal

PLASHOE moves from release-ready staging and operational readiness into an explicit production cutover, then records a post-launch review with evidence, rollback readiness, and any accepted risks.

## Background

Phase 08 established CI, health/readiness, structured logging, and deployment docs. Phase 09 remains blocked on external staging/provider evidence. Phase 10 removed frontend tooling debt. Phase 11 documented monitoring, alerting, backup/restore, and incident response, but still depends on Phase 09 inputs for live-provider proof. Phase 12 is the only phase that may perform production cutover, but only after the local and remote release gates pass and the user explicitly approves release actions.

The repository does not maintain a dedicated changelog. In Phase 12, the release-note requirement is satisfied by a phase-local post-launch review artifact rather than a new repo-wide changelog file.

## Definitions

- **Release gate**: The full set of local and remote checks that must pass on the exact release commit before production cutover.
- **Cutover**: The point where the selected production release is deployed and becomes the active version.
- **Launch window**: The first 5, 15, and 60 minutes after cutover.
- **Rollback**: Reverting to the last proven release and re-running the same smoke checks.
- **Post-launch review**: The written record of launch outcome, issues, metrics, follow-ups, and accepted risks.
- **Same commit**: The exact release commit SHA used for local checks, remote CI, deployment, and post-launch evidence.

## Requirements

1. **Release gate record**: Phase 12 records the exact release commit and the results of the final local and remote gates.
   - Current: Phase 11 local readiness is complete, but Phase 12 has no release gate evidence.
   - Target: A single release-gate record captures backend tests, frontend tests, frontend build, audit policy, static contract checker, and remote GitHub Actions CI for the exact commit intended for production.
   - Acceptance: The release-gate record exists and each listed check is either passed or explicitly blocked with a reason; no check result is inferred from a different commit.

2. **Repository reconciliation**: Git history, planning state, docs, release note equivalent, and deployment checklist are aligned before cutover.
   - Current: `ROADMAP.md`, `STATE.md`, `docs/DEPLOYMENT.md`, and `docs/TESTING.md` exist, but no Phase 12 release-note artifact exists yet.
   - Target: `ROADMAP.md`, `STATE.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`, and the phase-local post-launch review all agree on the chosen release commit, version label, and remaining blockers.
   - Acceptance: The reconciliation record names the release commit SHA, the release label if one is used, and confirms that Phase 9/11 blockers are either resolved or explicitly carried forward; no new top-level changelog is introduced in Phase 12.

3. **Explicit approval gate**: Production tag, push, deploy, and production traffic switch cannot happen without explicit user approval.
   - Current: The roadmap already requires explicit approval, but no phase-local release gate enforces it.
   - Target: The cutover workflow records user approval before any tag, push, deploy, or production traffic switch.
   - Acceptance: The release record includes the approval decision and blocks all release actions when approval is absent.

4. **Production cutover evidence**: The production deploy is executed through environment secret stores and recorded.
   - Current: Deployment docs are platform-neutral and no production cutover record exists.
   - Target: The chosen host(s) are deployed using environment secret stores, not committed config, and the cutover record captures the deployed commit, host labels, and production status.
   - Acceptance: Production health/readiness, frontend smoke, request-id propagation, and Stripe webhook/payment checks are recorded against the deployed release.

5. **Rollback readiness**: Rollback plan and verification are ready before cutover.
   - Current: Phase 11 has required-before-Phase-12 rollback command slots and scenario runbooks, but they are not yet filled with release-specific evidence.
   - Target: The release plan names the exact rollback path for backend, frontend, config, and database restore, and defines when rollback should be triggered.
   - Acceptance: Rollback criteria and verification checks are recorded before production deploy; if rollback is executed, the restored version passes the same smoke checks.

6. **Launch-window monitoring**: First 5/15/60 minute monitoring is captured for the production window.
   - Current: Monitoring windows exist in docs, but there is no launch-window evidence record.
   - Target: Phase 12 records the observed health, readiness, error, payment, and support state during the first 5, 15, and 60 minutes after cutover.
   - Acceptance: Each window has a timestamped result and any deviation is assigned severity and owner in the post-launch record.

7. **Post-launch review**: One post-launch review artifact records issues, metrics, follow-ups, and accepted risks.
   - Current: No post-launch review artifact exists.
   - Target: A phase-local post-launch review summarizes what changed, what happened during launch, what was learned, and what remains accepted risk.
   - Acceptance: The artifact lists issues or confirms none, records the release commit, notes monitoring outcomes, and states whether any accepted risks remain.

8. **Evidence hygiene and blocker handling**: All phase-local release artifacts remain secret-safe and never fake missing upstream evidence.
   - Current: Phase 11 codified no-secret rules, but Phase 12 has no release evidence yet.
   - Target: Release notes, cutover evidence, and review files contain no secrets, dashboard ids, private URLs, raw payloads, or fabricated links.
   - Acceptance: Secret-pattern scanning over Phase 12 artifacts returns no matches, and any unresolved Phase 9 or Phase 11 evidence remains explicitly blocked until real safe evidence exists.

## Boundaries

**In scope:**
- Final local and remote release gate records for the exact release commit.
- Repo reconciliation across `ROADMAP.md`, `STATE.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`, and the phase-local post-launch review.
- Production cutover evidence, rollback readiness, launch-window monitoring, and post-launch review.
- Secret-safe evidence tables and release notes.
- Explicit approval before any release action.

**Out of scope:**
- New features, bug fixes, or product changes unrelated to release readiness.
- New observability platforms, APM migrations, or monitoring stack redesigns.
- Making Phase 9 or Phase 11 external blockers disappear without real evidence.
- Tagging, pushing, or deploying a production release before user approval.
- Committing secrets, dashboard ids, account ids, private URLs, raw payloads, or raw PII.
- Adding a new repo-wide changelog system if the release note requirement is satisfied by the phase-local post-launch review.

## Constraints

- Do all work inline and do not use subagents.
- Production deploy must use environment secret stores rather than committed configuration.
- Release evidence must reference the exact release commit SHA and must not infer success from another commit.
- Any unresolved Phase 9 or Phase 11 blocker stays blocked unless real safe evidence is supplied.
- Release artifacts must remain secret-safe, provider-accurate, and free of fabricated links.
- Preserve unrelated dirty work; phase 12 should only change explicit release artifacts.

## Evidence / Data Contracts

| Artifact | Purpose | Required fields |
| --- | --- | --- |
| Release gate record | Proves the release commit passed all required checks | Commit SHA, local gate results, remote CI run reference, overall status |
| Cutover record | Proves production deployment and smoke validation happened | Deploy target, host labels, commit SHA, smoke results, rollback reference |
| Post-launch review | Records launch outcome and follow-up work | Launch window notes, issues, metrics, follow-ups, accepted risks |

## Acceptance Criteria

- [ ] The release-gate record exists and records backend tests, frontend tests, frontend build, audit policy, static contract checker, and remote GitHub Actions CI for the same release commit.
- [ ] `ROADMAP.md`, `STATE.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`, and the phase-local post-launch review all agree on the release commit and remaining blockers.
- [ ] No tag, push, deploy, or production traffic switch occurs before explicit user approval is recorded.
- [ ] The production cutover record shows environment secret store usage, deployed commit, host labels, health/readiness, frontend smoke, request-id propagation, and Stripe webhook/payment checks.
- [ ] A rollback path is defined and verified using the same smoke checks as the forward deploy.
- [ ] The launch-window record captures first 5, 15, and 60 minute observations with severity and owner assignment for any deviation.
- [ ] The post-launch review records issues or explicitly states none, plus metrics, follow-ups, and accepted risks.
- [ ] Secret scanning over all Phase 12 artifacts returns no matches and no fabricated provider links appear.
- [ ] Any unresolved Phase 9 or Phase 11 evidence remains explicitly blocked until real safe evidence exists.

## Validation Criteria

- `cd Backend && npm test`
- `cd Frontend/Ecommerce-main/my-app && npm test`
- `cd Frontend/Ecommerce-main/my-app && npm run build`
- `node scripts/ci/check-audits.mjs`
- `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`
- Remote GitHub Actions CI must pass on the same release commit.
- Production smoke checks must pass on the deployed release before the launch window is closed.
- Rollback smoke checks must pass if rollback is executed.
- Phase 12 secret-pattern scans must return no matches.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
| --- | ---: | ---: | --- | --- |
| Goal Clarity | 0.94 | 0.75 | met | The phase is explicitly a release gate plus cutover plus post-launch review. |
| Boundary Clarity | 0.93 | 0.70 | met | Production release is in scope; new features and unresolved upstream blockers are not. |
| Constraint Clarity | 0.88 | 0.65 | met | Approval, secret-store, same-commit, and blocked-evidence rules are locked. |
| Acceptance Criteria | 0.90 | 0.70 | met | The release gates, cutover proof, rollback proof, and review deliverables are testable. |
| **Ambiguity** | 0.09 | <= 0.20 | met | Gate passed after the user approved the recommendations. |

Status: met = dimension meets minimum.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
| --- | --- | --- | --- |
| 1 | Researcher | What counts as the release gate? | Backend tests, frontend tests, frontend build, audit policy, static contract checker, and remote GitHub Actions CI on the same commit. |
| 1 | Researcher | What counts as release notes? | Use a phase-local post-launch review artifact; do not create a new repo-wide changelog. |
| 2 | Simplifier | What is the irreducible cutover scope? | Explicit approval, production deploy, rollback readiness, smoke checks, and launch-window monitoring. |
| 3 | Boundary Keeper | What is out of scope? | New features, new observability platforms, and unresolved Phase 9/11 evidence fabrication. |
| 3 | Boundary Keeper | What blocks release actions? | Missing explicit approval or unresolved upstream blockers. |
| 4 | Failure Analyst | What makes the gate fail? | Any missing local/remote gate result, secret leakage, fabricated provider evidence, or smoke failure. |
| 5 | Seed Closer | What evidence must exist after cutover? | Commit SHA, host labels, smoke results, rollback path, launch-window record, and post-launch review. |
| 5 | Seed Closer | How is rollback verified? | Re-run the same health, readiness, frontend smoke, and Stripe/payment checks after rollback. |
| 6 | Seed Closer | What happens to Phase 9/11 blockers? | They stay blocked until real safe evidence exists. |

## Related References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `docs/DEPLOYMENT.md`
- `docs/TESTING.md`

*Phase: 12-release-gate-production-cutover-and-post-launch-review*
*Spec created: 2026-06-14*
*Next step: $gsd-discuss-phase 12 - implementation decisions*
