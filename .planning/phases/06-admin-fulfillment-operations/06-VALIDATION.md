---
phase: 06
slug: admin-fulfillment-operations
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-13
---

# Phase 06 - Validation Strategy

## Test Infrastructure

| Property | Value |
| --- | --- |
| Backend framework | Vitest 4, Supertest, Mongoose |
| Backend database | `MongoMemoryReplSet` with `wiredTiger` |
| Frontend framework | Create React App Jest |
| Backend config | `Backend/vitest.config.js`, `Backend/test/setup.js` |
| Frontend config | `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/src/setupTests.js` |
| Quick backend command | `cd Backend && npm test -- admin-order.test.js admin-list.test.js` |
| Quick frontend command | `cd Frontend/Ecommerce-main/my-app && npm test -- adminApi.test.js --watchAll=false` |
| Full suite command | `cd Backend && npm test`; `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`; `cd Frontend/Ecommerce-main/my-app && npm run build` |
| Estimated runtime | ~3 to 6 minutes locally after MongoDB binary cache is warm |

## Sampling Rate

- After every backend task commit: run the narrow backend test file touched by that task.
- After every frontend wrapper task commit: run `adminApi.test.js` without watch mode.
- After every plan wave: run the quick command for that wave.
- Before `$gsd-verify-work`: run the full suite commands plus API documentation string checks.
- Max feedback latency target: no more than one task without an automated check.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 06-01-01 | 06-01 | 1 | ADM-01, ADM-03, ADM-04 | T-06-01 | Admin order routes require token/admin role and preserve customer ownership boundary | integration | `cd Backend && npm test -- admin-order.test.js order.test.js` | no | pending |
| 06-01-02 | 06-01 | 1 | ADM-01, ADM-03 | T-06-02 | Admin order list is bounded, filterable, compact, and metadata-bearing | integration | `cd Backend && npm test -- admin-order.test.js` | no | pending |
| 06-01-03 | 06-01 | 1 | ADM-01 | T-06-03 | Admin detail exposes full order plus limited user identity only | integration | `cd Backend && npm test -- admin-order.test.js` | no | pending |
| 06-02-01 | 06-02 | 2 | ADM-02, ADM-04 | T-06-04 | Fulfillment service blocks invalid payment/status transitions with machine-readable conflicts | unit/integration | `cd Backend && npm test -- admin-order.test.js` | no | pending |
| 06-02-02 | 06-02 | 2 | ADM-02 | T-06-05 | Shipped/delivered transitions set server timestamps and append tracking history safely | integration | `cd Backend && npm test -- admin-order.test.js` | no | pending |
| 06-02-03 | 06-02 | 2 | ADM-02 | T-06-06 | No-op retries do not duplicate tracking events and same-status shipped corrections append exactly one event | integration | `cd Backend && npm test -- admin-order.test.js` | no | pending |
| 06-03-01 | 06-03 | 3 | ADM-03, ADM-04 | T-06-07 | Coupon and contact admin lists are protected, paginated, bounded, and safely filterable | integration | `cd Backend && npm test -- admin-list.test.js contact.test.js` | no | pending |
| 06-03-02 | 06-03 | 3 | ADM-01, ADM-02, ADM-03 | T-06-08 | Frontend admin wrappers call documented endpoints with params/payloads | unit | `cd Frontend/Ecommerce-main/my-app && npm test -- adminApi.test.js --watchAll=false` | no | pending |
| 06-03-03 | 06-03 | 3 | ADM-01, ADM-02, ADM-03, ADM-04 | T-06-09 | API docs describe routes, auth, envelopes, filters, transition rules, and errors | docs/static | `rg "/api/admin/orders|PATCH /api/admin/orders/:id/fulfillment|adminApi" docs/API.md` | yes | pending |

## Wave 0 Requirements

Existing infrastructure covers Phase 06:

- Backend already has Vitest, Supertest, `MongoMemoryReplSet`, auth helpers, and factories.
- Frontend already has CRA/Jest and mocked Axios wrapper tests.
- No testing package installation is required for Phase 06 planning.

## Manual-Only Verifications

All locked Phase 06 behavior has automated verification. Manual review is limited to confirming that `docs/API.md` wording clearly communicates fulfillment constraints.

## Validation Sign-Off

- [x] All tasks have automated verification or an explicit infrastructure dependency.
- [x] Sampling continuity has no three consecutive tasks without automated verification.
- [x] Wave 0 dependency is identified.
- [x] No watch-mode flags are used in final frontend verification commands.
- [x] Feedback latency target is less than one plan wave.
- [x] `nyquist_compliant: true` is set in frontmatter.

Approval: pending execution
