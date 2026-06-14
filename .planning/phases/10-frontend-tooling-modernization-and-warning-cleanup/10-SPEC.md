# Phase 10: Frontend Tooling Modernization and Warning Cleanup - Specification

**Created:** 2026-06-14
**Ambiguity score:** 0.08 (gate: <= 0.20)
**Requirements:** 9 locked

## Goal

The PLASHOE frontend moves from Create React App/react-scripts to a maintained Vite/Vitest tooling stack, removes the accepted CRA audit debt, and runs routine frontend test/build gates without the known recurring warning noise.

## Background

The frontend app lives in `Frontend/Ecommerce-main/my-app` and currently uses `react-scripts@5.0.1` for `start`, `build`, and `test`. Frontend tests rely on CRA's bundled Jest behavior and `jest.*` globals. GitHub Actions runs `npm test -- --watchAll=false` and `npm run build` from the frontend directory. The production audit policy in `scripts/ci/check-audits.mjs` still accepts vulnerabilities reachable from `react-scripts`, and `docs/TESTING.md` explicitly documents that accepted CRA/tooling debt remains deferred to Phase 10.

The current frontend build/test commands pass, but the output is not clean. Known recurring noise includes React `act(...)` warnings from the older CRA/Testing Library stack, React Router future-flag warnings in route tests, the `OrderDetail.jsx` hook dependency warning, stale Browserslist notices, and Node deprecation noise. Phase 10 removes that noise while preserving customer-facing storefront behavior.

## Requirements

1. **CRA removal**: Remove `react-scripts` as the frontend build/test/dev dependency and replace CRA scripts with maintained Vite commands.
   - Current: `Frontend/Ecommerce-main/my-app/package.json` uses `react-scripts start`, `react-scripts build`, `react-scripts test`, and CRA ESLint presets.
   - Target: Frontend `start` and `build` scripts run through Vite, the unused CRA `eject` path is removed, CRA ESLint presets are removed or replaced only as needed, and `react-scripts` is absent from direct dependencies and lockfile resolution.
   - Acceptance: `rg -n "react-scripts|react-app/jest|react-app" Frontend/Ecommerce-main/my-app/package.json Frontend/Ecommerce-main/my-app/package-lock.json` returns no live CRA script/config dependency references.

2. **Vitest test runner**: Migrate the frontend test runner from CRA/Jest to Vitest with React Testing Library.
   - Current: Frontend tests depend on CRA's Jest environment, `jest.*` globals, and `npm test -- --watchAll=false` for one-shot execution.
   - Target: `npm test` runs the full frontend test suite once through Vitest, `npm run test:watch` is available for local watch mode, and mocks/timers/spies use Vitest-compatible APIs or explicit supported configuration.
   - Acceptance: From `Frontend/Ecommerce-main/my-app`, `npm test` exits 0 and reports all frontend suites passing without relying on `react-scripts test` or `--watchAll=false`.

3. **Runtime behavior preservation**: Preserve the existing storefront behavior while changing tooling.
   - Current: Customer-facing routes, payment return flows, cart normalization, API clients, Tailwind/MUI styling, public assets, and `REACT_APP_*` environment names are tied to the existing CRA project shape.
   - Target: The Vite app serves the same routes, reads the same public `REACT_APP_*` configuration names, preserves payment return behavior, preserves cart normalization behavior, and emits equivalent static build output for deployment.
   - Acceptance: Existing frontend tests for app shell, protected routes, checkout, checkout return, cart store, auth store, contact, config, and API wrappers still pass after migration.

4. **CI command update**: Update CI to use the new frontend command contract without CRA-only flags.
   - Current: `.github/workflows/ci.yml` runs `npm test -- --watchAll=false` for frontend tests.
   - Target: CI installs frontend dependencies with npm, runs the Vitest one-shot command through `npm test`, and keeps `npm run build` as the frontend production build gate.
   - Acceptance: `.github/workflows/ci.yml` no longer contains `--watchAll=false`, and its frontend job still installs dependencies, runs tests, and builds the frontend.

5. **Audit policy cleanup**: Remove the accepted CRA/react-scripts production audit exception.
   - Current: `scripts/ci/check-audits.mjs` accepts frontend vulnerabilities reachable from `react-scripts` and reports `Accepted frontend CRA/tooling findings`.
   - Target: The audit policy treats frontend production audit findings as blocking unless separately documented outside Phase 10; no CRA/react-scripts reachability allowlist remains.
   - Acceptance: `node scripts/ci/check-audits.mjs` exits 0 and reports no accepted CRA/react-scripts frontend finding count.

6. **Frontend test warning cleanup**: Remove recurring frontend test warning noise.
   - Current: The frontend test command emits recurring React `act(...)` warning noise, React Router future-flag warnings, and some expected error-path console output.
   - Target: Tests pass without recurring React `act(...)` warnings, without React Router future-flag warnings, and without expected error-path logs leaking into routine output.
   - Acceptance: `npm test` from `Frontend/Ecommerce-main/my-app` exits 0 and does not print recurring `act(...)`, React Router future-flag, or intentionally expected `console.error`/`console.warn` noise.

7. **Frontend build warning cleanup**: Remove the known recurring frontend build warnings.
   - Current: `npm run build` passes with the known `OrderDetail.jsx` hook dependency warning, stale Browserslist warning, and Node deprecation noise.
   - Target: The production build passes without those known warnings.
   - Acceptance: `npm run build` from `Frontend/Ecommerce-main/my-app` exits 0 and does not print the `OrderDetail.jsx` hook dependency warning, stale Browserslist warning, or Node deprecation warning that Phase 10 targets.

8. **Documentation update**: Update project docs to describe the maintained frontend tooling accurately.
   - Current: `docs/TESTING.md`, `docs/DEVELOPMENT.md`, `docs/DEPLOYMENT.md`, `docs/CONFIGURATION.md`, `docs/GETTING-STARTED.md`, and related docs still describe CRA commands, CRA env behavior, and accepted CRA audit debt.
   - Target: Docs describe Vite/Vitest commands, preserved `REACT_APP_*` config support, the frontend dev server behavior, CI commands, deployment build behavior, and the removal of CRA audit acceptance.
   - Acceptance: `rg -n "Create React App|CRA|react-scripts|watchAll=false|react-app/jest|accepted frontend CRA|accepted CRA" docs .github/workflows scripts Frontend/Ecommerce-main/my-app/package.json` returns only intentional historical references inside prior phase artifacts, not active instructions.

9. **Verification gate parity**: Preserve the release gate shape while replacing only the frontend tooling internals.
   - Current: Phase 8 CI gates include backend tests, frontend tests/build, static contract checker, and audit policy.
   - Target: Phase 10 verification proves the same gate shape still passes after frontend tooling migration, with backend tests included when shared CI or audit scripts are changed.
   - Acceptance: Final verification records passing results for frontend `npm test`, frontend `npm run build`, `node scripts/ci/check-audits.mjs`, and `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`; backend `npm test` is included if `.github/workflows/ci.yml` or shared audit/static scripts changed.

## Boundaries

**In scope:**
- In-place migration of `Frontend/Ecommerce-main/my-app` from CRA/react-scripts to Vite.
- Migration of frontend tests from CRA/Jest execution to Vitest with React Testing Library.
- Conversion of frontend test mocks/spies/timers from `jest.*` to Vitest-compatible APIs where required.
- Vite configuration needed to preserve existing `REACT_APP_*` environment variable names.
- Static asset and HTML entry changes required by Vite.
- GitHub Actions frontend command update from CRA one-shot test flags to the new Vitest one-shot command.
- Removal of CRA/react-scripts accepted-risk logic from `scripts/ci/check-audits.mjs` and its tests.
- Cleanup of known frontend test/build warnings listed in Phase 10.
- Documentation updates that remove active CRA instructions and record the new commands.

**Out of scope:**
- React 19 or other React major upgrade - Phase 10 is tooling migration, not a runtime framework migration.
- React Router 7 upgrade - existing React Router 6 behavior should be preserved while warnings are cleaned.
- Tailwind 4 or broad visual/styling migration - visual output should remain stable.
- TypeScript migration - the project is currently JavaScript and this phase should not expand language scope.
- New E2E, browser, Lighthouse, or visual regression framework - Phase 10 is local build/test tooling cleanup.
- Hard coverage thresholds - coverage policy remains deferred until broader stable coverage exists.
- New storefront features, route redesigns, checkout behavior changes, payment-provider changes, or cart model changes - these are product changes, not tooling cleanup.
- Production cutover, external staging setup, monitoring, alerting, or backup verification - those remain in Phases 9, 11, and 12.

## Constraints

- Do all work inline and do not use subagents.
- Keep npm and `package-lock.json`; do not switch package managers.
- Keep the migration in `Frontend/Ecommerce-main/my-app`; do not create a parallel frontend app folder.
- Preserve customer-facing routes, env var names, payment return behavior, cart normalization, public API wrapper behavior, and existing test intent.
- Keep React at `18.3.1`, React Router at the current 6.x line, and Tailwind at the current 3.x line unless a patch/minor update is directly required by the tooling migration.
- Document a Vite-compatible frontend Node requirement while keeping GitHub Actions on `node-version: lts/*`.
- Build/test output must be clean enough that a new warning is visible to reviewers.
- Do not commit real `.env` files, API keys, Stripe secrets, MongoDB credentials, MapTiler keys, or dashboard-only values.

## Acceptance Criteria

- [ ] `react-scripts` and CRA ESLint/test presets are removed from active frontend package scripts, dependencies, and lockfile resolution.
- [ ] `npm test` in `Frontend/Ecommerce-main/my-app` runs the full frontend suite once through Vitest and exits 0.
- [ ] `npm run test:watch` exists for local frontend watch mode.
- [ ] Frontend tests do not emit recurring React `act(...)`, React Router future-flag, or expected error-path console warning noise.
- [ ] `npm run build` in `Frontend/Ecommerce-main/my-app` exits 0 without the known `OrderDetail.jsx` hook dependency, stale Browserslist, or Node deprecation warnings.
- [ ] `.github/workflows/ci.yml` uses the new frontend one-shot test command and no longer passes `--watchAll=false`.
- [ ] `node scripts/ci/check-audits.mjs` exits 0 without accepting CRA/react-scripts tooling findings.
- [ ] `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` exits 0 after the migration.
- [ ] Active docs describe Vite/Vitest frontend commands, preserved `REACT_APP_*` behavior, CI commands, and audit policy without active CRA guidance.
- [ ] Existing frontend tests covering app shell, protected routes, checkout, checkout return, cart store, auth store, contact, config, and API wrappers continue passing.
- [ ] No React major, React Router major, Tailwind major, TypeScript migration, coverage threshold, E2E framework, or product behavior change is introduced.

## Ambiguity Report

| Dimension           | Score | Min   | Status | Notes |
|---------------------|-------|-------|--------|-------|
| Goal Clarity        | 0.94  | 0.75  | Met    | Target stack, audit cleanup, and warning cleanup are locked. |
| Boundary Clarity    | 0.93  | 0.70  | Met    | In-scope migration work and out-of-scope adjacent upgrades are explicit. |
| Constraint Clarity  | 0.88  | 0.65  | Met    | Runtime preservation, package manager, Node, and dependency constraints are locked. |
| Acceptance Criteria | 0.91  | 0.70  | Met    | Verification commands and warning/audit gates are pass/fail. |
| **Ambiguity**       | 0.08  | <=0.20| Met    | Gate passed after user approved all recommendations. |

Status: Met = dimension meets or exceeds the minimum.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | Full CRA removal or patch existing stack? | Fully migrate CRA/react-scripts to Vite and remove CRA debt. |
| 1 | Researcher | Which test runner should replace CRA Jest? | Use Vitest with React Testing Library. |
| 1 | Researcher | Should Phase 10 upgrade React? | Keep React 18.3.1 unless a safe patch is required. |
| 2 | Simplifier | What is the minimum viable scope? | Tooling migration, audit cleanup, warning cleanup, CI/docs updates. |
| 2 | Simplifier | Should TypeScript, E2E, coverage thresholds, or visual changes enter scope? | Exclude them from Phase 10. |
| 3 | Boundary Keeper | Should env vars be renamed to `VITE_*`? | Preserve existing `REACT_APP_*` names through Vite configuration. |
| 3 | Boundary Keeper | Should package manager or app folder change? | Keep npm, `package-lock.json`, and the existing app directory. |
| 3 | Boundary Keeper | Should React Router 7 or Tailwind 4 be adopted? | No major Router or Tailwind upgrade in this phase. |
| 4 | Failure Analyst | What would make the migration unacceptable? | Broken routes, changed checkout/payment/cart behavior, accepted CRA audit debt remaining, or noisy routine gates. |
| 4 | Failure Analyst | How should expected test error output be handled? | Silence expected error-path logs in tests so real warnings remain visible. |
| 5 | Seed Closer | What commands prove the phase is done? | Frontend test/build, audit policy, static checker, docs update, plus backend tests if shared CI/scripts changed. |

---

*Phase: 10-frontend-tooling-modernization-and-warning-cleanup*
*Spec created: 2026-06-14*
*Next step: $gsd-discuss-phase 10 - implementation decisions (how to build what is specified above)*
