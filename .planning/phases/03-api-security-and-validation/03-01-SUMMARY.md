---
phase: 03-api-security-and-validation
plan: 03-01
subsystem: api-security
tags: [express, helmet, rate-limit, jwt, vitest, supertest]
requires:
  - phase: 02-automated-test-foundation
    provides: Backend Vitest/Supertest/MongoMemoryServer test harness
provides:
  - Backend security middleware baseline
  - Runtime configuration validation before listener startup
  - Explicit JWT signing and verification defaults
  - Stable 413, 429, 401, 403, and generic 500 security envelopes
affects: [api, auth, testing, dependency-remediation]
tech-stack:
  added: [express-rate-limit, helmet, zod]
  patterns: [route-aware-json-parsers, test-opt-in-rate-limit-keys, pure-runtime-env-validation]
key-files:
  created:
    - Backend/config/env.js
    - Backend/config/security.js
    - Backend/middleware/security.js
    - Backend/test/security-config.test.js
    - Backend/test/security-middleware.test.js
  modified:
    - Backend/app.js
    - Backend/server.js
    - Backend/middleware/auth.js
    - Backend/controllers/authController.js
    - Backend/test/setup.js
    - Backend/test/auth.test.js
    - Backend/test/helpers/auth.js
    - Backend/package.json
    - Backend/package-lock.json
key-decisions:
  - "Rate limiting is IP-keyed in production and opt-in by test header in NODE_ENV=test to avoid flaky suite-wide limiter state."
  - "JWT remains HS256 bearer-token based, but signing and verification now use explicit algorithm settings and a one-hour default expiry."
  - "Unexpected 500 responses return a generic client message while server-side logging preserves details."
patterns-established:
  - "Security middleware is centralized in Backend/middleware/security.js and mounted before API routes."
  - "Startup env validation is pure and testable in Backend/config/env.js, while Backend/app.js remains importable."
requirements-completed: [SEC-01, SEC-02]
duration: 42 min
completed: 2026-06-12
---

# Phase 03 Plan 01: Security Middleware and Startup Configuration Baseline Summary

**Express API hardening with Helmet, route-aware JSON caps, IP-keyed rate limits, fail-fast startup validation, and explicit HS256 JWT defaults**

## Performance

- **Duration:** 42 min
- **Started:** 2026-06-12T13:40:00Z
- **Completed:** 2026-06-12T14:22:22Z
- **Tasks:** 4
- **Files modified:** 14

## Accomplishments

- Added `express-rate-limit`, `helmet`, and `zod`, plus shared security constants for limits and JWT settings.
- Added runtime config validation for `MONGO_URI`, strong `JWT_SECRET`, valid `FRONTEND_URL`, optional `PORT`, and optional `JWT_EXPIRE`.
- Replaced unbounded JSON parsing with `8kb` strict parsers for auth/contact/coupon validation and `64kb` default parsing for the rest of the API.
- Added global `/api`, auth, contact, and coupon-validation rate limiters with stable JSON `429` envelopes.
- Changed JWT signing/verification to explicit `HS256` with a `1h` default expiry and tests for disallowed algorithms.
- Added generic unexpected error handling so raw server/database messages are not exposed to clients.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add backend security dependencies and constants** - `03d56e7` (`chore`)
2. **Task 2: Add fail-fast runtime config validation** - `732ec7b` (`feat`)
3. **Task 3: Add security middleware, rate limits, and JSON body caps** - `d4b9bb8` (`feat`)
4. **Task 4: Harden JWT signing, verification, and security error envelopes** - `cff9c4f` (`feat`)

## Files Created/Modified

- `Backend/config/security.js` - Shared JSON limit, rate-limit, and JWT security constants.
- `Backend/config/env.js` - Pure runtime configuration validation used by startup and tests.
- `Backend/middleware/security.js` - Helmet, limiters, JSON parsers, 413 handling, and generic app error handling.
- `Backend/app.js` - Security middleware and route-aware parser wiring.
- `Backend/server.js` - Startup config validation before DB connection and listener startup.
- `Backend/middleware/auth.js` - JWT verification constrained to `HS256`.
- `Backend/controllers/authController.js` - JWT signing constrained to `HS256` with `1h` default expiry.
- `Backend/test/security-config.test.js` - Runtime config validation coverage.
- `Backend/test/security-middleware.test.js` - Rate-limit, body-cap, and generic 500 envelope coverage.
- `Backend/test/auth.test.js` - JWT algorithm and expiry coverage.

## Decisions Made

- Kept the current bearer JWT model per plan boundary, but narrowed token defaults instead of introducing refresh tokens or cookies.
- Used a `X-Rate-Limit-Test` opt-in header only in `NODE_ENV=test`; recommendation is to preserve this pattern so broad backend suites do not share limiter state.
- Kept backend audit remediation out of this plan; the current 5 backend production audit findings remain for plan `03-03`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated backend auth test helper JWT defaults**
- **Found during:** Task 4 (Harden JWT signing, verification, and security error envelopes)
- **Issue:** `Backend/test/helpers/auth.js` still produced helper tokens with the old default expiry.
- **Fix:** Updated the helper to use shared JWT security constants.
- **Files modified:** `Backend/test/helpers/auth.js`
- **Verification:** `npm test -- security-config.test.js auth.test.js security-middleware.test.js`
- **Committed in:** `cff9c4f`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary to keep test-auth helpers aligned with the new JWT contract. No scope creep.

## Issues Encountered

- `npm audit --omit=dev --json` still reports 5 backend production findings: `express`, `mongoose`, `body-parser`, `path-to-regexp`, and `qs`. This is expected and deferred to plan `03-03`.
- A GSD helper created a transient `.planning/config.json` for `_auto_chain_active=false`; it was removed because this repo did not previously have a config file and the flag is not a phase deliverable.

## Verification

- `cd Backend && npm test` - passed, 8 files / 37 tests.
- `cd Backend && npm audit --omit=dev --json` - non-clean snapshot, 5 findings, deferred to `03-03`.
- `rg "express\\.json\\(\\)" Backend/app.js Backend/routes Backend/middleware` - no matches.
- `rg "7d|algorithms" Backend/controllers Backend/middleware Backend/config` - only algorithm allowlist evidence remains; no `7d` default remains.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `03-02`: request validators and DTO allowlists can now reuse the stable security envelopes, test harness, and JSON parsing boundaries.

---
*Phase: 03-api-security-and-validation*
*Completed: 2026-06-12*
