# Phase 03 Patterns: API Security and Validation

**Created:** 2026-06-12
**Status:** Ready for execution planning

## Existing Local Patterns To Preserve

| Pattern | Source | Use in Phase 3 |
|---------|--------|----------------|
| Importable Express app | `Backend/app.js` exports `app` for Supertest. | Keep app import side-effect light; do not run config validation that requires production env at import time. |
| Thin route modules | `Backend/routes/*.js` delegates behavior to controllers and middleware. | Add route-specific parsers/limiters/validators in route modules or a small middleware module, not inside unrelated models. |
| JSON envelope | Controllers commonly return `{ success, data, message }`. | Keep security failures as `{ success: false, message }`, with optional `errors` for validation details. |
| Vitest and Supertest | `Backend/test/*.test.js` uses MongoMemoryServer and direct route requests. | Add backend security tests under `Backend/test/security*.test.js` and reuse existing helpers/setup. |
| CRA/Jest tests | `Frontend/Ecommerce-main/my-app/src/**/*.test.*` uses React Testing Library/Jest. | Add focused tests for auth persistence and public config without changing test tooling. |
| Central auth store | `src/store/authStore.js` owns token persistence. | Use Zustand `createJSONStorage(() => sessionStorage)` at that seam. |
| Central Axios wrapper | `src/api/axios.js` attaches bearer auth and handles `401`. | Preserve existing header/logout behavior after token-storage changes. |

## Recommended Backend Module Shape

| Module | Responsibility | Notes |
|--------|----------------|-------|
| `Backend/config/env.js` | Read, validate, and expose runtime config. | Required by `server.js` before `connectDB()` and `app.listen(...)`. Keep test helper pure and directly testable. |
| `Backend/config/security.js` | Constants for rate limits, body limits, JWT defaults, and allowed algorithms. | Avoid scattering magic numbers across route files. |
| `Backend/middleware/security.js` | Helmet, global limiter, route limiters, JSON parsers, and security error handling helpers. | Use deterministic `429` and `413` envelopes. |
| `Backend/middleware/validate.js` | Generic Zod request validation wrapper. | Validate `body`, `query`, and `params`, then expose sanitized DTOs on `req.validated` or replace safe request fields consistently. |
| `Backend/validators/*.js` | Strict schemas and DTO mappers per resource. | Group by auth, product, cart, coupon, order, and contact for discoverability. |

Recommendation: keep each module small and boring. The goal is a security baseline, not a new framework inside the app.

## Recommended Test Pattern

| Test Area | Suggested File | What To Prove |
|-----------|----------------|---------------|
| Runtime config | `Backend/test/security-config.test.js` | Missing/malformed env throws before listener startup; valid test config passes. |
| Rate limits and body caps | `Backend/test/security-middleware.test.js` | `429` and `413` stable envelopes; ordinary requests still work. |
| JWT defaults | `Backend/test/auth-security.test.js` or existing `auth.test.js` | Default expiry is `1h`, HS256 verification works, invalid tokens fail. |
| Validators | `Backend/test/validation.test.js` or resource-specific tests | Unknown fields are rejected or stripped before persistence; bad query params return stable `400`. |
| Frontend token/config | `Frontend/Ecommerce-main/my-app/src/store/authStore.test.js` and `src/config/config.test.js` | Auth persistence uses session storage; missing MapTiler key is safe. |

Recommendation: prefer targeted tests next to the behavior being hardened. Do not rely on audit commands alone as proof of security behavior.

## Dependency Upgrade Pattern

1. Update backend patch/minor security dependencies first.
2. Run backend tests and backend production audit.
3. Update frontend patch/minor security dependencies.
4. Run frontend tests, frontend build, and frontend production audit.
5. Document unresolved audit findings in `03-SECURITY-RISK-REGISTER.md` with package, severity, advisory, exploitability, rationale, and follow-up.

Recommendation: avoid major upgrades in Phase 3 unless the audit evidence shows no defensible patch/minor or risk-register route.

## Documentation Pattern

Update only the docs whose behavior actually changes:

- `docs/API.md`: rate limits, request-size behavior, validation envelopes, and notable 4xx responses.
- `docs/CONFIGURATION.md`: backend required env validation, JWT defaults, frontend MapTiler key requirements, and token-storage note.
- `docs/TESTING.md`: Phase 3 security test commands, audit commands, build command, and contract checker.
- `.planning/phases/03-api-security-and-validation/03-SECURITY-RISK-REGISTER.md`: remaining audit risk only.

Recommendation: keep detailed audit exception rationale in the phase directory so public-facing docs stay operational, not noisy.
