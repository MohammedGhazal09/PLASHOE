---
phase: 04
slug: checkout-data-integrity-and-inventory
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-12
---

# Phase 04 - Validation Strategy

## Test Infrastructure

| Property | Value |
| --- | --- |
| Backend framework | Vitest 4, Supertest, Mongoose |
| Backend database | `MongoMemoryReplSet` with `wiredTiger` |
| Frontend framework | Create React App Jest, React Testing Library |
| Backend config | `Backend/vitest.config.js`, `Backend/test/setup.js` |
| Frontend config | `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/src/setupTests.js` |
| Quick backend command | `cd Backend && npm test -- order.test.js cart.test.js` |
| Quick frontend command | `cd Frontend/Ecommerce-main/my-app && npm test -- cartStore.test.js Checkout.test.jsx --watchAll=false` |
| Full suite command | `cd Backend && npm test`; `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`; `cd Frontend/Ecommerce-main/my-app && npm run build`; `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` |
| Estimated runtime | ~2 to 5 minutes locally after MongoDB binary cache is warm |

## Sampling Rate

- After every backend task commit: run the narrow backend test file touched by that task.
- After every frontend task commit: run the narrow frontend test file touched by that task.
- After every plan wave: run the quick backend or frontend command for that wave.
- Before `$gsd-verify-work`: run all full suite commands listed above.
- Max feedback latency target: no more than one task without an automated check.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 04-01-01 | 04-01 | 1 | CHK-01 | T-04-01 | Checkout tests run on transaction-capable MongoDB | integration | `cd Backend && npm test -- order.test.js` | yes | pending |
| 04-01-02 | 04-01 | 1 | CHK-01, CHK-03 | T-04-02 | Retry creates one order and order numbers are collision-safe | integration | `cd Backend && npm test -- order.test.js` | yes | pending |
| 04-01-03 | 04-01 | 1 | CHK-01 | T-04-03 | Forced failures roll back order/cart/coupon state | integration | `cd Backend && npm test -- order.test.js` | yes | pending |
| 04-02-01 | 04-02 | 2 | CHK-02 | T-04-04 | Overstocked cart add/update returns 409 without mutation | integration | `cd Backend && npm test -- cart.test.js` | yes | pending |
| 04-02-02 | 04-02 | 2 | CHK-01, CHK-02 | T-04-05 | Checkout decrements stock exactly once or aborts all writes | integration | `cd Backend && npm test -- order.test.js` | yes | pending |
| 04-02-03 | 04-02 | 2 | CHK-01, CHK-02 | T-04-06 | Coupon max-use and cancellation restore are transaction-safe | integration | `cd Backend && npm test -- order.test.js cart.test.js` | yes | pending |
| 04-03-01 | 04-03 | 3 | CHK-04 | T-04-07 | Cart store exposes one normalized item shape after sync/hydration | unit | `cd Frontend/Ecommerce-main/my-app && npm test -- cartStore.test.js --watchAll=false` | yes | pending |
| 04-03-02 | 04-03 | 3 | CHK-01, CHK-04 | T-04-08 | Checkout sends idempotency header and handles 409 without clearing cart | component | `cd Frontend/Ecommerce-main/my-app && npm test -- Checkout.test.jsx --watchAll=false` | yes | pending |
| 04-03-03 | 04-03 | 3 | CHK-01, CHK-02, CHK-03, CHK-04 | T-04-09 | Documentation and static contract checker align with new behavior | docs/static | `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | yes | pending |

## Wave 0 Requirements

Existing infrastructure covers all Phase 04 requirements after `Backend/test/setup.js` switches from `MongoMemoryServer` to `MongoMemoryReplSet` in task `04-01-01`.

## Manual-Only Verifications

All Phase 04 acceptance criteria have automated verification. Manual inspection is limited to checking that docs mention the checkout idempotency and conflict contract clearly.

## Validation Sign-Off

- [x] All tasks have automated verification or an explicit infrastructure dependency.
- [x] Sampling continuity has no three consecutive tasks without automated verification.
- [x] Wave 0 dependency is identified.
- [x] No watch-mode flags are used in final verification commands.
- [x] Feedback latency target is less than one plan wave.
- [x] `nyquist_compliant: true` is set in frontmatter.

Approval: pending execution

