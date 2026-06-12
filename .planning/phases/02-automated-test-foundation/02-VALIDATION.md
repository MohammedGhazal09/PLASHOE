---
phase: 02
slug: automated-test-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-12
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Backend Vitest + Supertest + mongodb-memory-server; frontend CRA/Jest + React Testing Library |
| **Config file** | `Backend/vitest.config.js`; CRA-managed Jest config |
| **Quick run command** | `cd Backend && npm test` after backend setup exists |
| **Full suite command** | `cd Backend && npm test`; `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`; `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` |
| **Estimated runtime** | ~120 seconds after dependencies are installed |

## Sampling Rate

- **After every task commit:** Run the narrow command for the area touched.
- **After every plan wave:** Run every command introduced by completed plans.
- **Before `$gsd-verify-work`:** Backend tests, frontend tests, and static checker must be green.
- **Max feedback latency:** 120 seconds for test-only checks after install.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 02-01 | 1 | TEST-01 | T-02-01 | App imports without connecting to production DB or binding `PORT` | integration | `cd Backend && npm test` | no | pending |
| 02-01-02 | 02-01 | 1 | TEST-01 | T-02-02 | Disposable MongoDB setup isolates test state | integration | `cd Backend && npm test` | no | pending |
| 02-02-01 | 02-02 | 2 | TEST-02 | T-02-03 | Protected routes reject missing/invalid credentials | API | `cd Backend && npm test` | no | pending |
| 02-02-02 | 02-02 | 2 | TEST-02 | T-02-04 | Cart/coupon/order state changes are verified without production MongoDB | API | `cd Backend && npm test` | no | pending |
| 02-02-03 | 02-02 | 2 | TEST-02 | T-02-05 | Public contact validation and success paths are covered | API | `cd Backend && npm test` | no | pending |
| 02-03-01 | 02-03 | 1 | TEST-03 | T-02-06 | Frontend tests assert PLASHOE behavior, not CRA starter text | component | `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | partial | pending |
| 02-03-02 | 02-03 | 1 | TEST-03 | T-02-07 | Persisted Zustand state is reset between tests | unit | `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | no | pending |
| 02-03-03 | 02-03 | 1 | TEST-03 | T-02-08 | Checkout/contact regressions are covered with mocked external surfaces | component | `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | no | pending |
| 02-04-01 | 02-04 | 3 | TEST-04 | T-02-09 | Static checker remains a cheap no-FAIL gate | static | `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | yes | pending |
| 02-04-02 | 02-04 | 3 | TEST-01, TEST-02, TEST-03, TEST-04 | T-02-10 | Testing docs list commands that actually exist and pass | docs | all full suite commands | yes | pending |

## Wave 0 Requirements

- [ ] `Backend/app.js` exists and exports the Express app.
- [ ] `Backend/vitest.config.js` exists.
- [ ] `Backend/test/setup.js` exists.
- [ ] Backend dev dependencies are installed and locked.
- [ ] Frontend starter test no longer asserts `learn react`.

## Manual-Only Verifications

All Phase 2 behaviors have automated verification. Manual review is limited to inspecting docs and confirming no out-of-scope files were changed.

## Validation Sign-Off

- [ ] All tasks have automated verify commands or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers missing test infrastructure references.
- [ ] No watch-mode flags in final verification commands.
- [ ] Feedback latency target is under 120 seconds after install.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
