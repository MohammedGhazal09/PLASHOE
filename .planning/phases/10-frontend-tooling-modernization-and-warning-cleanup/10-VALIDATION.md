---
phase: 10
slug: frontend-tooling-modernization-and-warning-cleanup
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-14
verified: 2026-06-14T04:23:06+03:00
---

# Phase 10 - Validation Strategy

Per-phase validation contract for frontend tooling modernization and warning cleanup.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Frontend Vitest/jsdom/React Testing Library; backend Vitest/Supertest for parity |
| **Config file** | `Frontend/Ecommerce-main/my-app/vite.config.js`; `Backend/vitest.config.js` |
| **Quick run command** | `cd Frontend/Ecommerce-main/my-app; npm test` |
| **Full suite command** | `cd Frontend/Ecommerce-main/my-app; npm test`; `cd Frontend/Ecommerce-main/my-app; npm run build`; `node scripts/ci/check-audits.mjs`; `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`; `cd Backend; npm test` |
| **Estimated runtime** | ~240 seconds |

## Sampling Rate

- **After every task commit:** Run the plan-specific frontend test/build/static check listed in the task.
- **After every plan wave:** Run the full frontend command pair: `npm test` and `npm run build`.
- **Before `$gsd-verify-work`:** Frontend tests/build, audit policy, static checker, and backend tests must be green.
- **Max feedback latency:** 240 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | TOOL-01 | T-10-01 | CRA tooling is removed from active scripts and lockfile. | package/static | `cd Frontend/Ecommerce-main/my-app; npm test` | no | passed |
| 10-01-02 | 01 | 1 | TOOL-01/TOOL-04 | T-10-02 | Vite build preserves static output and public config without exposing unprefixed env vars. | frontend build | `cd Frontend/Ecommerce-main/my-app; npm run build` | no | passed |
| 10-01-03 | 01 | 1 | TOOL-01 | T-10-03 | Public asset paths preserve fallback catalog/cart image behavior. | frontend unit/build | `cd Frontend/Ecommerce-main/my-app; npm test; npm run build` | no | passed |
| 10-02-01 | 02 | 2 | TOOL-03 | T-10-04 | Tests use Vitest APIs honestly and do not rely on a Jest shim. | frontend test | `cd Frontend/Ecommerce-main/my-app; npm test` | no | passed |
| 10-02-02 | 02 | 2 | TOOL-03 | T-10-05 | Route tests include React Router future flags and expected console output is scoped. | frontend test/static | `cd Frontend/Ecommerce-main/my-app; npm test`; `rg -n "jest\\." Frontend/Ecommerce-main/my-app/src` | no | passed |
| 10-02-03 | 02 | 2 | TOOL-04 | T-10-06 | `OrderDetail.jsx` hook dependency warning is fixed through source refactor. | frontend build | `cd Frontend/Ecommerce-main/my-app; npm run build` | no | passed |
| 10-03-01 | 03 | 3 | TOOL-02 | T-10-07 | Frontend production audit findings block instead of being accepted as CRA debt. | audit test | `node --test scripts/ci/check-audits.test.mjs`; `node scripts/ci/check-audits.mjs` | yes | passed |
| 10-03-02 | 03 | 3 | TOOL-01/TOOL-02/TOOL-03/TOOL-04 | T-10-08 | CI and active docs describe the new command contract only. | static/docs | `rg -n "watchAll=false|react-scripts|react-app/jest|accepted frontend CRA" .github/workflows docs scripts Frontend/Ecommerce-main/my-app/package.json` | yes | passed |
| 10-03-03 | 03 | 3 | TOOL-01/TOOL-02/TOOL-03/TOOL-04 | T-10-09 | Release gate shape still passes after migration. | full parity | `cd Frontend/Ecommerce-main/my-app; npm test; npm run build`; root audit/static/backend commands | yes | passed |

## Wave 0 Requirements

Existing infrastructure covers all Phase 10 requirements:

- Frontend has 18 behavior-oriented RTL test files and a setup file.
- Backend test infrastructure already exists for the parity check.
- Static contract checker exists and remains retained.
- Audit policy tests already use Node's built-in test runner.

## Manual-Only Verifications

All Phase 10 acceptance criteria have automated command or static-check coverage.

## Static Checks

Run before handoff:

```powershell
rg -n "react-scripts|react-app/jest|react-app" Frontend/Ecommerce-main/my-app/package.json Frontend/Ecommerce-main/my-app/package-lock.json
rg -n "watchAll=false" .github/workflows docs
rg -n "process\\.env\\.PUBLIC_URL|%PUBLIC_URL%|reportWebVitals" Frontend/Ecommerce-main/my-app
rg -n "jest\\." Frontend/Ecommerce-main/my-app/src
rg -n "Accepted frontend CRA|accepted CRA|react-scripts" docs scripts .github/workflows Frontend/Ecommerce-main/my-app/package.json
```

Expected result: no live active references. Historical prior-phase artifacts may still contain old terms.

## Final Phase 10 Verification

Recorded: 2026-06-14T04:23:06+03:00.

| Check | Command | Result |
| --- | --- | --- |
| Frontend tests | `npm test` from `Frontend/Ecommerce-main/my-app` | Passed: 19 test files, 71 tests |
| Frontend production build | `npm run build` from `Frontend/Ecommerce-main/my-app` | Passed through Vite without known Phase 10 warnings |
| Audit policy tests | `node --test scripts/ci/check-audits.test.mjs` | Passed: 4 tests |
| Production audit policy | `node scripts/ci/check-audits.mjs` | Passed: backend total 0; frontend total 0 |
| Static contract checker | `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Passed: `{"PASS":8,"WARN":1}` |
| Backend tests | `npm test` from `Backend` | Passed: 14 test files, 129 tests |
| CRA package scan | `rg -n "react-scripts|react-app/jest|react-app" Frontend/Ecommerce-main/my-app/package.json Frontend/Ecommerce-main/my-app/package-lock.json` | Passed: no matches |
| Watch flag scan | `rg -n "watchAll=false" .github/workflows docs` | Passed: no matches |
| Public URL/report scan | `rg -n "process\\.env\\.PUBLIC_URL|%PUBLIC_URL%|reportWebVitals" Frontend/Ecommerce-main/my-app` | Passed: no matches |
| Jest API scan | `rg -n "jest\\." Frontend/Ecommerce-main/my-app/src` | Passed: no matches |
| Active audit-debt scan | `rg -n "Accepted frontend CRA|accepted CRA|react-scripts" docs scripts .github/workflows Frontend/Ecommerce-main/my-app/package.json` | Passed: no matches |

## Validation Sign-Off

- [x] All tasks have automated verification or static checks.
- [x] Sampling continuity has no 3 consecutive tasks without automated verification.
- [x] Wave 0 covers all missing infrastructure references.
- [x] No watch-mode flags are required for final verification.
- [x] Feedback latency target is under 240 seconds.
- [x] `nyquist_compliant: true` is set in frontmatter.

**Approval:** approved 2026-06-14
