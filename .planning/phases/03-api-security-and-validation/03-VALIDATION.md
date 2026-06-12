---
phase: 03
slug: api-security-and-validation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-12
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Backend Vitest/Supertest/MongoMemoryServer; frontend CRA/Jest/React Testing Library |
| **Config file** | Backend `package.json`; frontend `Frontend/Ecommerce-main/my-app/package.json` |
| **Quick run command** | `cd Backend && npm test` |
| **Full suite command** | `cd Backend && npm test`; `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`; `cd Frontend/Ecommerce-main/my-app && npm run build`; audit commands; contract checker |
| **Estimated runtime** | ~120-300 seconds depending on frontend build and audit network/cache state |

## Sampling Rate

- **After every task commit:** Run the relevant targeted backend or frontend test command for the touched behavior.
- **After every plan wave:** Run all tests for the touched app and the relevant audit command when dependencies changed.
- **Before `$gsd-verify-work`:** Full suite, audits or risk register, frontend build, and contract checker must be green or documented.
- **Max feedback latency:** 300 seconds for full plan-wave feedback.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 03-01 | 1 | SEC-01 | T-03-01 | Global and route-specific abuse limits return stable `429`. | integration | `cd Backend && npm test` | yes | pending |
| 03-01-02 | 03-01 | 1 | SEC-01 | T-03-02 | Oversized JSON returns stable `413` before controller persistence. | integration | `cd Backend && npm test` | yes | pending |
| 03-01-03 | 03-01 | 1 | SEC-02 | T-03-03 | Missing or weak config fails before listener startup. | unit | `cd Backend && npm test` | yes | pending |
| 03-01-04 | 03-01 | 1 | SEC-02 | T-03-04 | JWT defaults use strong secret, `1h`, and HS256 allowlist. | unit/integration | `cd Backend && npm test` | yes | pending |
| 03-01-05 | 03-01 | 1 | SEC-01/SEC-02 | T-03-05 | Security errors do not leak raw internal messages. | integration | `cd Backend && npm test` | yes | pending |
| 03-02-01 | 03-02 | 2 | SEC-03 | T-03-06 | Auth/profile/address writes reject unknown fields and client `isAdmin`. | integration | `cd Backend && npm test` | yes | pending |
| 03-02-02 | 03-02 | 2 | SEC-03 | T-03-07 | Commerce writes map only accepted DTO fields before persistence. | integration | `cd Backend && npm test` | yes | pending |
| 03-02-03 | 03-02 | 2 | SEC-03 | T-03-08 | Product query and route params are bounded and stable on bad input. | integration | `cd Backend && npm test` | yes | pending |
| 03-03-01 | 03-03 | 3 | SEC-04 | T-03-09 | Direct patch/minor security upgrades do not break tests/build. | audit/build | backend/frontend tests and build | yes | pending |
| 03-03-02 | 03-03 | 3 | SEC-04 | T-03-10 | Remaining audit findings are clean or explicitly risk-registered. | audit/manual review | `npm audit --omit=dev --json` in both apps | yes | pending |
| 03-03-03 | 03-03 | 3 | SEC-05 | T-03-11 | Auth persistence uses session storage and docs state residual bearer-token risk. | unit/docs | frontend tests | yes | pending |
| 03-03-04 | 03-03 | 3 | SEC-05 | T-03-12 | MapTiler public config has no production-secret fallback and degrades safely. | unit/build/docs | frontend tests and build | yes | pending |

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:

- Backend test runner exists: `cd Backend && npm test`.
- Frontend test runner exists: `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`.
- Frontend build command exists: `cd Frontend/Ecommerce-main/my-app && npm run build`.
- Static contract checker exists: `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.

Recommendation: do not add a new test framework in Phase 3.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audit accepted-risk rationale | SEC-04 | npm can report findings, but exploitability and follow-up ownership require human judgment. | Review `03-SECURITY-RISK-REGISTER.md` against final backend/frontend audit output and confirm every remaining finding is listed. |
| Documentation accuracy | SEC-05 | Docs must match final implementation choices. | Compare `docs/API.md`, `docs/CONFIGURATION.md`, and `docs/TESTING.md` to changed source behavior before phase completion. |

## Validation Sign-Off

- [x] All planned tasks have an automated verify command or an explicit manual evidence path.
- [x] Sampling continuity: no 3 consecutive tasks without automated verification.
- [x] Wave 0 covers all missing infrastructure references.
- [x] No watch-mode-only verification command is required.
- [x] Feedback latency target is below 300 seconds for plan-wave checks.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending execution
