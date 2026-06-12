# Phase 03 Research: API Security and Validation

**Created:** 2026-06-12
**Status:** Ready for planning
**Phase:** 03-api-security-and-validation

## Research Scope

Phase 3 needs a production-minded security baseline without turning into a hidden platform migration. The research covered:

- Express security middleware, rate limiting, and body-size limits.
- Runtime configuration and JWT defaults.
- Request validation and DTO allowlists.
- Backend and frontend dependency-audit remediation.
- Browser token persistence and public browser configuration.
- Existing PLASHOE code seams and tests that can carry the work safely.

## Skill Research

The user requested at least 3 helpful skills. I used these local skills because they are stack-relevant and avoid subagent token overhead:

| Skill | How it informed the plan | Recommendation |
|-------|--------------------------|----------------|
| `api-sec` | API abuse controls, stable error responses, and request validation boundaries. | Use route-level limiters plus a global API limiter, and keep security failures in stable JSON envelopes. |
| `jwt-security` | Secret strength, token expiry, and algorithm constraints. | Keep HS256 bearer JWTs for this phase, shorten default expiry to `1h`, and verify only `HS256`. |
| `dependency-upgrade` | Safe patch/minor upgrade planning and audit-risk documentation. | Apply targeted patch/minor upgrades first; document remaining CRA/react-scripts chains rather than forcing a migration. |
| `api-testing` | Supertest-driven verification for API security behavior. | Add focused backend tests for rate limits, body caps, config validation, validators, and error envelopes. |
| `express-rest-api` | Express structure and middleware placement. | Keep `app.js` importable for tests and put fail-fast startup validation in `server.js` helpers. |

External skill search was run with `npx skills find "express api security jwt validation dependency testing"`. Results were either off-stack, duplicates of local skills, or lower signal than the local skills above. Recommendation: do not install external skills for Phase 3.

## Official Source Findings

| Topic | Source | Finding | Recommendation |
|-------|--------|---------|----------------|
| Express rate limiting | [express-rate-limit overview](https://express-rate-limit.mintlify.app/overview) | `express-rate-limit` is the standard small Express middleware for repeated-request throttling; its default memory store is not suitable for consistent multi-process or multi-server limits. | Use it for Phase 3 IP-keyed local limits, and document Redis/distributed limits as deferred production-topology work. |
| Security headers | [Helmet docs](https://helmetjs.github.io/) | Helmet hardens Express by setting common HTTP security headers, but CSP may need app-specific tuning. | Add `helmet()` with conservative defaults and keep any CSP customization narrow. |
| Request validation | [Zod docs](https://zod.dev/) | Zod validates unknown data in Node and plain JavaScript with explicit schemas and no runtime dependencies. | Use strict Zod schemas plus DTO mapping for write payloads and query params. |
| Request-size limits | [Express body-parser docs](https://expressjs.com/en/resources/middleware/body-parser/) | JSON body parsing supports a `limit`; the default is `100kb`, and very high limits increase memory and response-time risk. | Set a global `64kb` JSON cap and stricter `8kb` caps for auth, coupon validation, and contact payloads. |
| npm audit handling | [npm audit docs](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/) | `npm audit` requires package and lock files, reports severity/paths/remediation, and fixes can require semver-sensitive changes. | Treat audit output as evidence after upgrades, and record any remaining findings in the Phase 3 risk register. |
| Mongoose advisory | [GHSA-wpg9-53fq-2r8h](https://github.com/advisories/GHSA-wpg9-53fq-2r8h) | Mongoose `8.0.0` through `8.22.0` is affected; patched versions start at `8.22.1`. | Upgrade Mongoose within v8 and avoid passing raw request bodies into query/filter surfaces. |
| Zustand persistence | [Zustand persist docs](https://github.com/pmndrs/zustand/blob/main/docs/reference/integrations/persisting-store-data.md) | `persist` defaults to `localStorage`, and `createJSONStorage(() => sessionStorage)` supports session-only storage. | Move auth persistence to `sessionStorage` while preserving the store name and auth-header behavior. |
| jsonwebtoken | [jsonwebtoken README](https://github.com/auth0/node-jsonwebtoken#readme) | Default signing uses HS256; `expiresIn` is supported; verification accepts an `algorithms` allowlist; decoded payloads are untrusted input. | Keep payload `{ id }`, require a strong secret, default to `1h`, and verify with `algorithms: ['HS256']`. |

## Repo Evidence

| Area | Evidence | Risk | Recommendation |
|------|----------|------|----------------|
| App middleware | `Backend/app.js` uses `cors()` and an unbounded `express.json()` before route mounting. | Large JSON bodies can hit controller logic and error behavior is not deterministic. | Replace with route-aware JSON parsing and a `413` JSON error path. |
| Startup | `Backend/server.js` calls `connectDB()` then `app.listen(...)` without validating config first. | Missing `MONGO_URI`, weak `JWT_SECRET`, or malformed `FRONTEND_URL` fails late. | Add a config module and validate before DB connection/listen. |
| JWT | `Backend/controllers/authController.js` defaults expiry to `7d`; `Backend/middleware/auth.js` verifies without an explicit algorithm allowlist. | Long-lived browser bearer tokens and algorithm confusion risk. | Centralize JWT options, default to `1h`, enforce strong secret and HS256. |
| Raw bodies | `Product.create(req.body)`, product updates with `req.body`, `user.addresses.push(req.body)`, and several partial validators exist. | Unknown fields can be persisted or influence model behavior. | Add strict validators and DTO mappers for auth, product, cart, coupon, order, and contact writes. |
| Query params | Product list query accepts `limit`, `page`, `sort`, `gender`, and `category` with weak bounds. | Unbounded reads and unstable DB/controller errors. | Validate params and cap `limit` at `100`. |
| Frontend token store | `authStore.js` persists auth state through Zustand's default storage. | Token remains in `localStorage` after browser close and is exposed to XSS. | Use `createJSONStorage(() => sessionStorage)` and document remaining bearer-token risk. |
| Public config | `config.js` has a MapTiler fallback in source. | Production may silently depend on a browser-visible default. | Remove the fallback from source and make map rendering degrade gracefully when no key is configured. |
| Tests | Backend Vitest/Supertest/MongoMemoryServer and frontend CRA/Jest tests already exist. | Phase 3 has no security-specific gate yet. | Extend existing test suites instead of changing test frameworks. |

## Dependency Research

### Backend Audit Snapshot

`cd Backend && npm audit --omit=dev --json` currently reports 5 production findings:

| Package | Severity | Type | Recommendation |
|---------|----------|------|----------------|
| `express` | moderate | Direct dependency chain through `qs` / `body-parser` / `path-to-regexp` | Upgrade within Express 4 first, targeting `^4.22.2`; avoid Express 5 unless audit cannot be accepted otherwise. |
| `mongoose` | high | Direct advisory range includes current v8 | Upgrade within Mongoose 8, targeting `^8.24.0` or the smallest patched v8 that clears the advisory. |
| `body-parser` | moderate | Transitive from Express | Resolve through Express patch update where possible. |
| `path-to-regexp` | high | Transitive from Express | Resolve through Express patch update where possible, otherwise risk-register if Express 5 is the only full fix. |
| `qs` | moderate | Transitive from Express/body-parser | Resolve through Express patch update where possible. |

Current backend outdated targets also include `cors@2.8.6`, which is a small patch update. Recommendation: update `express`, `mongoose`, and `cors` in one backend dependency plan, then re-run audit and tests.

### Frontend Audit Snapshot

`cd Frontend/Ecommerce-main/my-app && npm audit --omit=dev --json` currently reports 52 production findings:

| Package | Severity | Type | Recommendation |
|---------|----------|------|----------------|
| `axios` | high | Direct dependency | Upgrade to `^1.17.0` and run frontend tests/build. |
| `react-router-dom` | high | Direct dependency via v6 range | Upgrade within v6 to `^6.30.4`; avoid React Router 7 in Phase 3 unless needed. |
| `styled-components` | moderate | Direct dependency | Upgrade to `^6.4.2`; verify MUI/styled-components integration still builds. |
| `react-scripts` chains | mixed, including high/critical transitive chains | CRA tooling dependency tree | Treat as likely accepted/deferred risk if production runtime is unaffected and the only fix is a tooling migration. |

Recommendation: patch/minor direct frontend dependencies first, run audit/tests/build, then create `03-SECURITY-RISK-REGISTER.md` for remaining CRA-related findings with exploitability notes and a follow-up to the later tooling/v2 phase.

## Validation Architecture

Phase 3 validation should sample security behavior at the same rate as implementation:

- Every backend middleware/config/validator task must add or update a backend test in the same plan.
- Every frontend token/config task must add or update a frontend test where practical.
- Dependency work must be verified by actual `npm audit --omit=dev` output after package updates.
- No phase completion should be accepted without backend tests, frontend tests, frontend build, backend audit, frontend audit or risk-register evidence, and the retained contract checker.

Recommendation: split execution into three plans:

1. `03-01`: Backend security middleware, startup config validation, JWT defaults, and stable security errors.
2. `03-02`: Request validators/DTO allowlists for auth, commerce writes, public queries, and params.
3. `03-03`: Dependency remediation, frontend token storage, public MapTiler config hygiene, risk register, docs, and final verification.

## Research Conclusions

- Phase 3 can be completed without changing the core auth architecture, frontend build tool, Express major version, or Mongoose major version unless audit evidence later proves otherwise.
- `express-rate-limit`, `helmet`, and `zod` are appropriate small dependencies for this phase.
- The strongest implementation seam is to keep `Backend/app.js` importable for tests and move startup validation into a config module invoked by `Backend/server.js`.
- Strict validation and DTO mapping should be preferred over controller-level ad hoc checks.
- The dependency plan must include an accepted-risk path because the CRA chain may remain noisy after safe direct upgrades.
- The frontend should move token persistence to session storage, but docs must still state that bearer tokens are XSS-sensitive.
