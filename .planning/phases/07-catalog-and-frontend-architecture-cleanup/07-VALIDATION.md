---
phase: 07
slug: catalog-and-frontend-architecture-cleanup
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-13
---

# Phase 07 - Validation Strategy

Per-phase validation contract for catalog/frontend cleanup execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Backend Vitest/Supertest, frontend CRA Jest/React Testing Library |
| **Config file** | `Backend/vitest.config.js`; CRA-managed frontend Jest config |
| **Quick run command** | `cd Backend; npm test -- product.test.js validation.test.js` and `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false` |
| **Full suite command** | `cd Backend; npm test`; `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false`; `cd Frontend/Ecommerce-main/my-app; npm run build` |
| **Estimated runtime** | ~180 seconds |

## Sampling Rate

- **After every task commit:** Run the plan-specific backend or frontend test command.
- **After every plan wave:** Run the full suite commands that match the touched app.
- **Before `$gsd-verify-work`:** Backend tests, frontend tests, frontend build, and static `rg` checks must be green.
- **Max feedback latency:** 180 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | CAT-02 | T-07-01 | Product list endpoints stay bounded and reject invalid params. | backend route | `cd Backend; npm test -- product.test.js validation.test.js` | no | pending |
| 07-01-02 | 01 | 1 | CAT-02 | T-07-02 | Product indexes support approved catalog filters and sorts. | backend model | `cd Backend; npm test -- product.test.js` | no | pending |
| 07-02-01 | 02 | 2 | CAT-01 | T-07-03 | Backend and static products normalize to one view model. | frontend unit | `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false` | no | pending |
| 07-02-02 | 02 | 2 | CAT-01/CAT-02 | T-07-04 | Catalog pages load backend-first and fallback only on request failure. | frontend unit/component | `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false` | no | pending |
| 07-02-03 | 02 | 2 | CAT-04 | T-07-05 | Product display components stop reading legacy product fields. | frontend component/static | `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false`; `rg -n "product\\.img|price\\.new|price\\.old" Frontend/Ecommerce-main/my-app/src` | no | pending |
| 07-03-01 | 03 | 3 | CAT-03 | T-07-06 | Contact and coupon wrappers are resource-owned, not order-owned. | frontend unit/static | `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false`; `rg -n "contactApi|couponApi" Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` | no | pending |
| 07-03-02 | 03 | 3 | CAT-04 | T-07-07 | Touched catalog/API logic is smaller, documented, and regression-tested. | frontend/backend/docs | `cd Backend; npm test`; `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false`; `cd Frontend/Ecommerce-main/my-app; npm run build` | no | pending |

## Wave 0 Requirements

Existing infrastructure covers all Phase 07 requirements:

- Backend Vitest/Supertest route tests already run through `Backend/app.js`.
- Frontend CRA/Jest/React Testing Library already runs component/store/API wrapper tests.
- No new test framework or runtime dependency is required.

## Manual-Only Verifications

All phase behaviors have automated verification or static checks.

## Static Checks

Run before handoff:

```powershell
rg -n "product\\.img|price\\.new|price\\.old" Frontend/Ecommerce-main/my-app/src
rg -n "database/database\\.json" Frontend/Ecommerce-main/my-app/src
rg -n "contactApi|couponApi" Frontend/Ecommerce-main/my-app/src/api/ordersApi.js
```

Expected result: no matches.

## Validation Sign-Off

- [x] All tasks have automated verification or static checks.
- [x] Sampling continuity has no 3 consecutive tasks without automated verification.
- [x] Wave 0 covers all missing infrastructure references.
- [x] No watch-mode flags are required for final verification.
- [x] Feedback latency target is under 180 seconds.
- [x] `nyquist_compliant: true` is set in frontmatter.

**Approval:** approved 2026-06-13
