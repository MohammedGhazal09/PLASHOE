# Phase 3: API Security and Validation - Specification

**Created:** 2026-06-12
**Ambiguity score:** 0.10 (gate: <= 0.20)
**Requirements:** 13 locked

## Goal

PLASHOE changes from a public ecommerce API with minimal request hardening, permissive body handling, runtime-only config failures, browser-persisted bearer tokens, and known production audit findings into a defensible baseline with rate limits, request-size caps, startup validation, explicit request allowlists, dependency-audit triage, and documented token-storage controls.

## Background

Phase 1 stabilized concrete contact, checkout, coupon, and cart contract defects. Phase 2 added backend route tests, frontend behavior tests, and retained the static contract checker. Those guardrails make Phase 3 safe to focus on API hardening instead of new user-facing features.

The current backend in `Backend` exposes auth, product, cart, order, coupon, contact, and health routes. `Backend/app.js` uses CORS and `express.json()` but has no explicit JSON body limit or rate-limit middleware. `Backend/server.js` starts listening after `connectDB()`, but required runtime configuration is not validated before startup. Auth uses bearer JWTs signed with `JWT_SECRET`; missing or weak secrets currently fail at request time rather than at process startup.

Several controllers still trust request bodies too broadly. Existing examples include `Product.create(req.body)`, product updates with `req.body`, `Coupon.create(req.body)`, `user.addresses.push(req.body)`, profile mutation from raw body fields, contact submissions with minimal validation, and shipping address handling in order creation. Public product queries also accept unbounded or weakly-validated query parameters such as `limit`, `page`, `sort`, `gender`, and `category`.

The frontend stores the bearer token through Zustand persistence in local storage under `auth-storage`; the axios wrapper reads that token and attaches an `Authorization: Bearer <token>` header. This avoids CSRF-prone cookie auth for now, but it exposes the token to any successful XSS on the frontend origin.

Current production audit state is not clean. Backend `npm audit --omit=dev` reports 5 findings, including direct `express` and `mongoose` advisories. Frontend `npm audit --omit=dev` reports 52 findings, including direct `axios`, `react-router-dom`, `styled-components`, and `react-scripts` chains. Outdated checks indicate likely safe direct patch/minor targets for backend `express` and `mongoose`, and frontend `axios`, `react-router-dom`, and `styled-components`; `react-scripts` remains the likely hard boundary because a full Create React App migration is planned separately unless security remediation cannot otherwise be achieved.

## Requirements

1. **High-abuse route rate limits**: Public and auth-sensitive endpoints must have request throttling.
   - Current: No rate-limit middleware or dependency is configured; `docs/API.md` documents that no rate limiting exists.
   - Target: `/api/auth/register`, `/api/auth/login`, `/api/contact`, and `/api/coupons/validate` have explicit route-level limits, and the backend has a lighter global API limiter.
   - Acceptance: Backend tests prove repeated requests beyond each configured route limit return `429` with a stable JSON error envelope, while ordinary requests under the limit still pass.

2. **Explicit request-size protection**: JSON request bodies must have bounded sizes.
   - Current: `Backend/app.js` calls `express.json()` with no explicit `limit`.
   - Target: The backend applies a global JSON body cap of `64kb` and stricter per-route caps for auth, coupon, and contact payloads where practical.
   - Acceptance: A backend test sending an oversized JSON body receives a deterministic 4xx response instead of reaching controller logic.

3. **Startup configuration validation**: Required backend configuration must be validated before the process listens.
   - Current: `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL` are documented but not validated before startup; DB and JWT failures surface later.
   - Target: Startup fails fast before `app.listen` when `MONGO_URI`, a strong `JWT_SECRET`, or a valid `FRONTEND_URL` is missing or malformed; `PORT` and `JWT_EXPIRE` formats are validated when present.
   - Acceptance: Automated tests or a startup-check command prove invalid required config exits non-zero or throws before the listener starts, and valid test config passes.

4. **JWT signing and verification baseline**: JWT handling must use explicit, testable security defaults.
   - Current: Tokens are signed with `{ id }`, `JWT_SECRET`, and `JWT_EXPIRE || "7d"`; verification does not explicitly constrain accepted algorithms.
   - Target: Tokens use a shorter default lifetime such as `1h` or `2h`, require a strong secret, and verify with an explicit allowed algorithm list appropriate for the existing HMAC setup.
   - Acceptance: Backend tests prove tokens can be issued and verified with valid config, invalid tokens are rejected, missing or weak secrets fail config validation, and the default expiry is no longer `7d`.

5. **Stable security error envelopes**: Validation and security failures must avoid leaking raw internal errors.
   - Current: Multiple controllers return `error.message` directly for 400 or 500 responses.
   - Target: Known validation failures return stable 4xx messages; unexpected 5xx failures return generic JSON messages while preserving server-side logging.
   - Acceptance: Tests for representative validation failures assert stable response messages, and at least one forced unexpected error path does not expose a raw stack or database error string to the client.

6. **Auth request allowlists**: Auth and account-mutating request bodies must be mapped through explicit accepted fields.
   - Current: Register/login destructure basic fields, but profile and address flows still rely on loosely accepted request data, including `user.addresses.push(req.body)`.
   - Target: Register, login, profile update, and add-address requests accept only documented fields, trim/normalize appropriate strings, reject unknown or malformed values, and never allow client-set `isAdmin`.
   - Acceptance: Backend tests prove extra fields such as `isAdmin` or unexpected address keys are ignored or rejected, and valid documented payloads still pass.

7. **Commerce request allowlists**: Cart, coupon, order, product, and contact writes must use explicit DTOs or validators before persistence.
   - Current: Product and coupon admin writes pass `req.body` directly to Mongoose; contact, cart, and order writes have partial ad hoc validation.
   - Target: Existing write endpoints validate and map only accepted fields for cart item mutations, coupon validation/admin creation, order shipping/notes, contact submission, and admin product create/update.
   - Acceptance: Backend tests prove unknown fields are rejected or stripped before persistence for representative product, coupon, contact, order, and address payloads.

8. **Public query and parameter validation**: Public query params and route params must be bounded and validated.
   - Current: Product list query parameters are cast directly; `limit` is unbounded and route params rely on controller/database errors.
   - Target: `limit`, `page`, `sort`, `gender`, `category`, and ObjectId-like route params are validated; `limit` is capped to a small maximum such as `100`; invalid values return stable 4xx responses.
   - Acceptance: Tests prove invalid pagination/sort/category values are rejected, valid values pass, and `limit` cannot exceed the configured maximum.

9. **Dependency audit remediation and risk register**: Production audit findings must be fixed or explicitly documented.
   - Current: Backend production audit reports 5 findings; frontend production audit reports 52 findings.
   - Target: Safe direct patch/minor security upgrades are applied for backend `express`/`mongoose` and frontend `axios`/`react-router-dom`/`styled-components`; any remaining audit findings, especially `react-scripts` chains, are documented with severity, source package, exploitability notes, and a follow-up owner/phase.
   - Acceptance: `npm audit --omit=dev` from `Backend` and `Frontend/Ecommerce-main/my-app` is clean, or every remaining finding appears in a Phase 3 risk register with an accepted-risk rationale and planned follow-up.

10. **No broad tooling migration unless required**: Dependency remediation must not become a hidden framework migration.
    - Current: The frontend still uses Create React App through `react-scripts`, and the roadmap defers tooling migration unless security remediation forces it.
    - Target: Phase 3 allows patch/minor security upgrades but avoids Express 5, Mongoose 9, React Router 7, or CRA-to-Vite migration unless direct remediation cannot otherwise satisfy the audit target.
    - Acceptance: The final summary lists all major upgrades avoided or deferred, and any major upgrade included in Phase 3 is justified by a direct security requirement.

11. **Browser token-storage risk control**: Frontend auth persistence risk must be reduced or explicitly accepted.
    - Current: `authStore` persists token, user, and `isAuthenticated` to local storage via Zustand `persist`; axios reads the token from the store.
    - Target: Phase 3 either moves token persistence to session-only storage or documents accepted localStorage risk with compensating controls: shorter JWT lifetime, XSS-conscious rendering assumptions, logout-on-401 behavior, and a future HttpOnly-cookie/refresh-token option.
    - Acceptance: Frontend tests or source checks prove the chosen persistence behavior, and `docs/CONFIGURATION.md` or a Phase 3 security note documents the remaining risk and compensating controls.

12. **Public frontend config hygiene**: Public API keys and browser config defaults must be production-safe.
    - Current: `config.map.apiKey` has a hard-coded MapTiler fallback value in source; docs say it should be replaced before production.
    - Target: Production builds require `REACT_APP_MAPTILER_API_KEY` or the fallback is explicitly documented as public/demo-only with domain restrictions and rotation guidance.
    - Acceptance: Source or docs prove deployed builds no longer silently depend on the hard-coded fallback as a production secret, and tests/build still pass.

13. **Security verification gate**: Phase 3 completion must be proven by commands and targeted tests.
    - Current: Phase 2 provides backend tests, frontend tests, and the static checker, but no Phase 3-specific security gate exists.
    - Target: Phase 3 verification includes backend tests, frontend tests, frontend build after dependency changes, backend/frontend production audit commands, targeted validator/rate-limit/config/token-storage tests, and the retained static checker.
    - Acceptance: The Phase 3 summary records exact commands and outcomes for all required gates, including any accepted audit-risk register path.

## Boundaries

**In scope:**
- Backend rate limiting for high-abuse routes and a light global API limiter.
- Explicit JSON request-size limits.
- Startup validation for backend configuration and required secrets.
- JWT lifetime/secret/algorithm hardening within the current bearer-token model.
- Explicit request allowlists or validators for existing write endpoints.
- Product query, pagination, and route-parameter validation where it is input hardening.
- Safe dependency security upgrades and audit-risk documentation.
- Frontend auth token-storage risk reduction or documented acceptance with compensating controls.
- Frontend MapTiler/public-config hygiene.
- Tests and documentation needed to prove the Phase 3 security baseline.

**Out of scope:**
- Real payment provider work — Phase 5 owns payment creation, confirmation, webhooks, and refunds.
- Inventory reservation/decrement and checkout transactions — Phase 4 owns checkout data integrity.
- New admin fulfillment features or admin UI — Phase 6 owns admin order operations and fulfillment workflows.
- CI workflow creation — Phase 8 owns CI/CD.
- Structured production logging and observability beyond error-response hygiene — Phase 8 owns observability.
- Full Create React App to Vite migration — v2/tooling work owns this unless Phase 3 cannot satisfy direct security remediation without it.
- Refresh-token rotation or HttpOnly cookie session architecture — future auth hardening unless chosen later as a dedicated auth phase.
- Password reset and email verification — account lifecycle features are outside Phase 3.
- New storefront marketing or catalog architecture cleanup — Phase 7 owns catalog/frontend architecture cleanup.
- Editing `Backend/.env.example` — existing local untracked file must remain untouched unless explicitly included later.

## Constraints

- Existing backend behavior must remain route-compatible for Phase 2 tests unless a security requirement explicitly changes the response for invalid input.
- New validators must keep request/response envelopes stable enough for frontend wrappers and existing tests.
- Rate limits must be testable without making the test suite flaky; use resettable or environment-aware limiter behavior for tests.
- Dependency upgrades must be batched by risk and verified after changes; avoid big-bang major upgrades.
- Backend and frontend production audit results must be captured after remediation, not inferred from package versions.
- Token-storage changes must preserve login, logout, auth header attachment, and logout-on-401 behavior.
- Public frontend config values are browser-visible by design; the spec requires production-safe handling, not secrecy for public browser keys.

## Acceptance Criteria

- [ ] Auth, contact, coupon-validation, and global API rate limits are implemented and tested.
- [ ] JSON body size limits are explicit and oversized requests are rejected before controller persistence.
- [ ] Backend startup/config validation fails before listening when `MONGO_URI`, strong `JWT_SECRET`, or valid `FRONTEND_URL` is missing or invalid.
- [ ] JWT default lifetime is shortened from `7d`, weak/missing secrets are rejected, and JWT verification constrains accepted algorithms.
- [ ] Known validation failures return stable 4xx JSON envelopes and unexpected 5xx responses do not expose raw internal errors.
- [ ] Auth/profile/address, cart, order, contact, product, and coupon write payloads are allowlisted or validated before persistence.
- [ ] Product query and route params reject invalid values and cap `limit` to the configured maximum.
- [ ] Backend `npm audit --omit=dev` is clean or remaining findings are documented with accepted risk and follow-up.
- [ ] Frontend `npm audit --omit=dev` is clean or remaining findings are documented with accepted risk and follow-up.
- [ ] No broad major framework/tool migration is introduced unless the Phase 3 audit target requires it and the reason is documented.
- [ ] Frontend token-storage risk is reduced or explicitly accepted with compensating controls and documentation.
- [ ] MapTiler/public browser config behavior is production-safe or documented as public/demo-only with deployment requirements.
- [ ] `cd Backend && npm test` passes.
- [ ] `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` passes.
- [ ] `cd Frontend/Ecommerce-main/my-app && npm run build` passes after frontend dependency/security changes.
- [ ] `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` reports no `FAIL` findings.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.92 | 0.75 | met | Goal ties directly to SEC-01 through SEC-05 and known code/audit state. |
| Boundary Clarity | 0.91 | 0.70 | met | Phase excludes payments, inventory, admin fulfillment, CI, observability, and broad tooling migration. |
| Constraint Clarity | 0.86 | 0.65 | met | Current bearer JWT model, CRA boundary, audit-risk path, testability, and env-file constraint are explicit. |
| Acceptance Criteria | 0.88 | 0.70 | met | Security behaviors, audit outcomes, and command gates are pass/fail. |
| **Ambiguity** | 0.10 | <=0.20 | met | Gate passed after user approved all recommendations. |

Status: `met` = dimension satisfies the minimum.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today for Phase 3 security? | No rate limits, no explicit JSON cap, no startup config validation, broad body persistence, localStorage token persistence, and non-clean audits. |
| 1 | Researcher | Which endpoints are high-abuse? | Auth register/login, contact submit, coupon validate, plus a light global API limiter. |
| 2 | Simplifier | What is the smallest useful hardening baseline? | Rate limits, request-size caps, config validation, validators/allowlists, direct dependency fixes, and token-risk documentation/reduction. |
| 2 | Simplifier | How far should token work go? | Keep bearer JWT for now, shorten lifetime, validate secret/algorithm, and reduce or document localStorage risk. |
| 3 | Boundary Keeper | Which adjacent work is excluded? | Payments, inventory transactions, admin fulfillment features, CI, observability, full CRA migration, refresh-token architecture, and account lifecycle features. |
| 3 | Boundary Keeper | How should dependency remediation be bounded? | Patch/minor security upgrades first; major framework/tool migrations only if required to satisfy the security target. |
| 4 | Failure Analyst | What would cause rejection? | Missing rate-limit/config/validator tests, raw internal error leaks, broad `req.body` persistence, unbounded product queries, undocumented audit findings, or broken Phase 2 gates. |
| 4 | Failure Analyst | How are audit exceptions handled? | Remaining audit findings must be documented with severity, package source, exploitability notes, accepted-risk rationale, and follow-up phase. |
| 5 | Seed Closer | How is done proven? | Backend tests, frontend tests, frontend build, backend/frontend production audits, targeted security tests, and retained static checker must be recorded. |
| 5 | Seed Closer | What user-approved defaults are locked? | All one-shot recommendations approved by user; no further unresolved grey areas remain for the spec. |

---

*Phase: 03-api-security-and-validation*
*Spec created: 2026-06-12*
*Next step: $gsd-discuss-phase 3 - implementation decisions (how to build what's specified above)*
