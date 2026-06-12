# Phase 03 Plan 03 Summary: Dependency Remediation, Frontend Token Storage, Public Config, and Final Gate

**Status:** Complete  
**Completed:** 2026-06-12  
**Requirements:** SEC-04, SEC-05

## What Changed

- Remediated backend production dependency advisories with patch/minor updates: `express@^4.22.2`, `mongoose@^8.24.0`, `cors@^2.8.6`, and a narrow `path-to-regexp@0.1.13` override.
- Remediated frontend direct runtime advisories with patch/minor updates: `axios@^1.17.0`, `react-router-dom@^6.30.4`, and `styled-components@^6.4.2`.
- Added explicit `@testing-library/dom@^8.20.1` so the existing `@testing-library/user-event` peer resolves deterministically after dependency remediation.
- Moved frontend auth persistence from Zustand's default localStorage behavior to `sessionStorage` via `createJSONStorage(() => sessionStorage)`.
- Added auth-store tests for session-only persistence, bearer header attachment, and logout-on-401 behavior.
- Removed the hard-coded MapTiler fallback from frontend config and made the contact map use OpenStreetMap tiles when no public MapTiler key is configured.
- Added config/contact tests for missing-key behavior and updated API, configuration, and testing docs.
- Created `03-SECURITY-RISK-REGISTER.md` for the remaining frontend CRA/build-tooling audit findings.
- Updated the static contract checker to accept secured contact-route middleware before the public contact handler.

## Verification

| Command | Result |
| --- | --- |
| `cd Backend && npm test` | Passed: 9 test files, 52 tests |
| `cd Backend && npm audit --omit=dev` | Passed: 0 vulnerabilities |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | Passed: 7 test suites, 22 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed with the existing `OrderDetail.jsx` hook dependency warning |
| `cd Frontend/Ecommerce-main/my-app && npm audit --omit=dev` | Non-clean: 46 findings, accepted and documented in `03-SECURITY-RISK-REGISTER.md` |
| `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Passed with 7 `PASS`, 2 `WARN`, and no `FAIL` findings |

## Audit Decision

Backend audit is clean. Frontend direct runtime targets were upgraded successfully, but the Create React App tooling graph still reports 46 findings, including one critical `shell-quote` finding. These are accepted for Phase 03 because they are build/test/dev-server tooling findings, not deployed static browser runtime request paths. The follow-up recommendation is a dedicated frontend tooling migration phase, not a hidden CRA-to-Vite migration inside Phase 03.

## Major Upgrades Avoided

- Avoided Express 5.
- Avoided Mongoose 9.
- Avoided React Router 7.
- Avoided React 19.
- Avoided CRA-to-Vite migration.
- Avoided refresh-token rotation or HttpOnly-cookie session architecture.

## Residual Risk

- Browser bearer tokens remain XSS-sensitive while the session is alive; Phase 03 reduces persistence by using `sessionStorage`, short JWT defaults, and logout-on-401 behavior.
- Frontend audit remains non-clean until CRA/build tooling is migrated or replaced.
- Contract checker warnings remain for production payment readiness and inventory enforcement, both planned for later phases.

## Recommendation

Proceed to Phase 04 for checkout data integrity and inventory. Keep frontend tooling migration as a dedicated follow-up before public release if a clean frontend `npm audit --omit=dev` gate is required.
