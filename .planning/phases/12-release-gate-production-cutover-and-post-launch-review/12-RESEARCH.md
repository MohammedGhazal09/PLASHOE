# Phase 12: Release Gate Production Cutover and Post Launch Review - Research

**Researched:** 2026-06-14
**Phase:** 12-release-gate-production-cutover-and-post-launch-review
**Requirements:** REL-01, REL-02, REL-03, REL-04
**Mode:** Inline research; no subagents

## Research Question

What do we need to know to plan Phase 12 well?

## Sources Read

- `.planning/phases/12-release-gate-production-cutover-and-post-launch-review/12-SPEC.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `docs/DEPLOYMENT.md`
- `docs/TESTING.md`
- `docs/OPERATIONS.md`
- `docs/INCIDENT-RESPONSE.md`
- `docs/CONFIGURATION.md`
- `.github/workflows/ci.yml`
- `scripts/ci/check-audits.mjs`
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-VERIFICATION.md`

## Skills Used

- `find-skills`
- `gsd-plan-phase`
- `deliver-acceptance-criteria`
- `create-release-checklist`

## Current State Findings

1. Phase 12 is already fully specified as a release-only milestone. The locked scope is final release gate, production cutover, rollback readiness, launch-window monitoring, and post-launch review.
2. `ROADMAP.md`, `REQUIREMENTS.md`, and `STATE.md` all still show Phase 12 as not started. No plan or verification artifacts exist yet for this phase.
3. The repository already defines the local and remote gate shape. `ci.yml` runs backend tests, frontend tests, frontend build, the static contract checker, and the dependency audit policy on push and pull request.
4. `scripts/ci/check-audits.mjs` is strict. It blocks both backend and frontend production audit findings, so Phase 12 should treat audit cleanliness as a release gate, not a soft warning.
5. `docs/DEPLOYMENT.md`, `docs/TESTING.md`, `docs/OPERATIONS.md`, and `docs/INCIDENT-RESPONSE.md` already define smoke checks, rollback criteria, monitoring windows, alert ownership, and incident flow. Phase 12 should reconcile these docs, not invent a new operations model.
6. `docs/CONFIGURATION.md` still contains verify markers and example values for `FRONTEND_URL`, `REACT_APP_API_URL`, MapTiler, and public contact/social fields. Those must be treated as examples or staging values unless the business owner explicitly approves final production values.
7. Phase 11 live-provider evidence is still blocked on external staging and provider setup. Phase 12 cannot treat those missing inputs as resolved.
8. There is unrelated dirty work in `README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `Backend/.env.example`, `Backend/config/db.js`, and `Frontend/Ecommerce-main/my-app/.env.example`. Phase 12 should preserve that work and avoid broad doc churn.

## Planning Recommendations

1. Make Phase 12 a three-plan release sequence:
   - `12-01`: final gate and repository reconciliation
   - `12-02`: production cutover, rollback readiness, and smoke checks
   - `12-03`: launch-window monitoring and post-launch review
2. Record the exact release commit SHA as the source of truth. If a release tag is used, treat it as secondary metadata only.
3. Require explicit user approval before any tag, push, deploy, or traffic switch.
4. Keep Phase 9 and Phase 11 gaps explicit. Do not replace missing external evidence with placeholders or inferred success.
5. Use environment secret stores for production values. Do not commit real runtime config or copy secrets into release artifacts.
6. Keep the release note requirement satisfied by a phase-local post-launch review artifact. Do not introduce a new repo-wide changelog for Phase 12.
7. Rebuild the frontend after any `REACT_APP_*` change because the bundle is build-time configured.
8. Preserve unrelated dirty files. Phase 12 should only touch release-specific artifacts.

## Potential Pitfalls

- Treating example environment values as real production values.
- Assuming local tests imply remote GitHub Actions success.
- Assuming Phase 11 operational readiness is complete without external staging/provider evidence.
- Writing release actions before the user explicitly approves them.
- Faking hosted smoke, Stripe, or deploy evidence.
- Forgetting that frontend public config is embedded at build time.

## Validation Architecture

Use the existing repo gates and add only evidence-safe checks:

```powershell
cd Backend
npm test

cd ..\Frontend\Ecommerce-main\my-app
npm test
npm run build

cd ..\..\..
node scripts/ci/check-audits.mjs
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
```

Release reconciliation should also confirm that the same release commit is named consistently across:

- `ROADMAP.md`
- `STATE.md`
- `docs/DEPLOYMENT.md`
- `docs/TESTING.md`
- the phase-local post-launch review

Post-cutover evidence should include:

- backend health and readiness
- frontend smoke
- request id propagation
- Stripe webhook and payment checks
- rollback path and rollback verification if rollback is used
- 5, 15, and 60 minute launch-window notes

## Open Questions

None blocking. The SPEC already locked the key decisions. Phase 12 is now an execution and evidence-capture problem, not a scope-definition problem.

---
_Phase 12 Research_
