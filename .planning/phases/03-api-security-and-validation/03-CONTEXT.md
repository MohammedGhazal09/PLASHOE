# Phase 03: api-security-and-validation - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the implementation baseline for public ecommerce API hardening: Express security middleware, request-size controls, rate limits, startup configuration validation, JWT defaults, stable security errors, explicit request/query validators, dependency-audit remediation, frontend token-storage risk reduction, and public browser config hygiene.

New capabilities remain out of scope. This phase hardens the current bearer-token ecommerce API and frontend config behavior without adding payments, inventory transactions, admin fulfillment, CI, observability, password reset, or a frontend build-tool migration.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**13 requirements are locked.** See `03-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `03-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
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

**Out of scope (from SPEC.md):**
- Real payment provider work.
- Inventory reservation/decrement and checkout transactions.
- New admin fulfillment features or admin UI.
- CI workflow creation.
- Structured production logging and observability beyond error-response hygiene.
- Full Create React App to Vite migration unless Phase 3 cannot satisfy direct security remediation without it.
- Refresh-token rotation or HttpOnly cookie session architecture.
- Password reset and email verification.
- New storefront marketing or catalog architecture cleanup.
- Editing `Backend/.env.example` unless explicitly included later.

</spec_lock>

<decisions>
## Implementation Decisions

### Security Middleware and Runtime Configuration
- **D-01:** Add small local modules for Phase 3 security plumbing: `Backend/config/env.js`, `Backend/config/security.js`, `Backend/middleware/security.js`, `Backend/middleware/validate.js`, and `Backend/validators/*.js`, or equivalent tightly scoped names if the planner finds a better local fit.
- **D-02:** Keep `Backend/app.js` importable for Vitest/Supertest. Put fail-fast runtime checks in startup helpers used by `Backend/server.js` before `connectDB()` and `app.listen(...)`.
- **D-03:** Allow exactly these new backend security dependencies unless research proves a safer equivalent is needed: `express-rate-limit`, `zod`, and `helmet`.
- **D-04:** Avoid large auth/session/security frameworks. Phase 3 stays inside the existing Express, Mongoose, and bearer JWT model.
- **D-05:** Validate backend runtime configuration before listening. Required production startup values are `MONGO_URI`, valid `FRONTEND_URL`, and a `JWT_SECRET` of at least 32 characters. Validate optional `PORT` and `JWT_EXPIRE` when present.

### Rate Limits and Request Size Controls
- **D-06:** Add a light global `/api` limiter at `300` requests per `15` minutes per IP.
- **D-07:** Add route-specific limiters: `/api/auth/register` and `/api/auth/login` at `5` requests per `15` minutes per IP, `/api/contact` at `5` requests per hour per IP, and `/api/coupons/validate` at `30` requests per `15` minutes per IP.
- **D-08:** Use IP-keyed limits for Phase 3. Per-user, per-email, Redis-backed, or distributed rate limits are deferred until the app has a production topology that needs them.
- **D-09:** Replace the current single unbounded `express.json()` with route-aware JSON parsing. Use `8kb` for auth, coupon validation, and contact; use `64kb` for the rest of the API.
- **D-10:** Oversized request bodies must return a deterministic JSON `413` envelope before controller persistence.

### JWT and Security Error Contracts
- **D-11:** Keep JWT payload shape compatible by continuing to sign `{ id }`.
- **D-12:** Shorten default JWT expiry from `7d` to `1h`.
- **D-13:** Sign with `HS256` and verify with `algorithms: ['HS256']`.
- **D-14:** Keep backend error envelopes shaped around `{ success: false, message }`. Validation may add an optional `errors` field, but existing frontend clients must still be able to read `message`.
- **D-15:** Known security failures must use stable response messages for `400`, `401`, `403`, `413`, and `429`. Unexpected `500` responses must be generic to clients while preserving server-side logging.

### Request Validators and DTO Allowlists
- **D-16:** Use strict Zod schemas and explicit DTO mapping for write payloads. Unknown write fields should be rejected with `400`, not silently persisted.
- **D-17:** Allow only current auth fields: register/login `name`, `email`, `password`; profile `name`, `email`, `phone`; addresses matching `User.addresses`; never accept client-set `isAdmin`.
- **D-18:** Allow only current commerce fields: cart `productId`, `quantity`, `size`; coupon validation `code`; admin coupon schema fields; order `shippingAddress` and `notes`; contact `name`, `email`, `subject`, `message`; admin product fields matching `Product`.
- **D-19:** Normalize safe string fields where appropriate: trim user-facing strings, lowercase emails, uppercase coupon codes, and coerce numeric query/body values only after validation.
- **D-20:** Validate ObjectId route params and public product query params. Allow known `gender`, `category`, `sale`, and `sort` values only; force `page >= 1`; cap `limit` at `100`.

### Dependency Remediation and Risk Register
- **D-21:** Remediate direct production audit findings with targeted patch/minor upgrades first: backend `express@^4.22.2`, `mongoose@^8.24.0`, `cors@^2.8.6`; frontend `axios@^1.17.0`, `react-router-dom@^6.30.4`, and `styled-components@^6.4.2`.
- **D-22:** Avoid Express 5, Mongoose 9, React Router 7, React 19, and CRA-to-Vite migration unless production audits cannot be brought to an acceptable state without a major migration.
- **D-23:** Capture remaining production audit findings in `.planning/phases/03-api-security-and-validation/03-SECURITY-RISK-REGISTER.md` with severity, source package, exploitability notes, accepted-risk rationale, and follow-up phase.
- **D-24:** Treat `react-scripts` audit chains as likely accepted/deferred risk unless targeted remediation proves they are exploitable in the deployed production app or impossible to document safely.

### Frontend Token Storage and Public Config
- **D-25:** Move frontend auth persistence from `localStorage` to `sessionStorage` via Zustand `createJSONStorage`, while preserving login, logout, auth header attachment, `auth-storage` naming if practical, and logout-on-401 behavior.
- **D-26:** Document remaining bearer-token/XSS risk and compensating controls. Do not introduce refresh-token rotation or HttpOnly cookie sessions in Phase 3.
- **D-27:** Remove the hard-coded MapTiler key fallback from frontend source. Use an empty or missing-key fallback and make the contact map degrade gracefully when no key is configured.
- **D-28:** Document that production must provide a domain-restricted public MapTiler key through `REACT_APP_MAPTILER_API_KEY`. Do not treat browser-exposed map keys as secrets.

### Verification and Documentation
- **D-29:** Add or update backend tests for rate limits, body caps, startup config validation, JWT signing/verification defaults, validation allowlists, query/param validation, and stable error envelopes.
- **D-30:** Add or update frontend tests for session-only auth persistence and public config behavior where practical.
- **D-31:** Phase 3 verification must include `cd Backend && npm test`, `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`, `cd Frontend/Ecommerce-main/my-app && npm run build`, backend `npm audit --omit=dev`, frontend `npm audit --omit=dev`, and `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.
- **D-32:** Update `docs/API.md`, `docs/CONFIGURATION.md`, and `docs/TESTING.md` only where Phase 3 behavior, config, or commands change. Keep risk-register detail in the Phase 3 directory.
- **D-33:** Leave the existing untracked `Backend/.env.example` untouched.

### Agent Discretion
- The planner may choose exact file names and validator grouping if the same decisions remain enforceable and downstream code stays easy to test.
- The executor may use equivalent rate-limit reset/test seams if they keep tests deterministic and avoid flaky wall-clock behavior.
- The executor may add small shared error helpers if they reduce duplicated security envelopes without changing route contracts.
- If a targeted dependency upgrade fails tests, prefer the smallest compatible pinned version that resolves the advisory before considering a major migration.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/03-api-security-and-validation/03-SPEC.md` - Locked Phase 3 requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase ordering, Phase 3 goal, canonical refs, and planned work slices.
- `.planning/REQUIREMENTS.md` - `SEC-01` through `SEC-05` traceability.
- `.planning/STATE.md` - Current project status and known local work risk.

### Prior Phase Carry-Forward
- `.planning/phases/02-automated-test-foundation/02-CONTEXT.md` - Test seams, Vitest/Supertest/MongoMemoryServer decisions, and `Backend/.env.example` handling.
- `.planning/phases/02-automated-test-foundation/02-REVIEW-FIX.md` - CORS dotenv import-order fix and real router test behavior to preserve.
- `docs/TESTING.md` - Current backend/frontend/checker commands to extend with Phase 3 tests.

### Codebase Maps and Project Docs
- `.planning/codebase/STACK.md` - Current Express, Mongoose, CRA, Zustand, dependency, and environment landscape.
- `.planning/codebase/ARCHITECTURE.md` - Backend/frontend layers, API/store integration points, and local patterns.
- `.planning/codebase/INTEGRATIONS.md` - MongoDB, bearer auth, MapTiler, and browser API integration context.
- `.planning/codebase/CONCERNS.md` - Security and audit concerns Phase 3 is explicitly addressing.
- `docs/API.md` - Existing API behavior and rate-limit documentation target.
- `docs/CONFIGURATION.md` - Environment variable and public config documentation target.

### Backend Source Files
- `Backend/app.js` - Express app import seam, CORS, JSON parsing, route mounting, and error middleware.
- `Backend/server.js` - Runtime startup seam for config validation before DB connection/listen.
- `Backend/package.json` - Backend dependency and test script changes.
- `Backend/package-lock.json` - Backend dependency lockfile changes.
- `Backend/middleware/auth.js` - JWT verification and admin authorization behavior.
- `Backend/routes/authRoutes.js` - Auth/profile/address route wiring.
- `Backend/routes/productRoutes.js` - Public product query and admin product write route wiring.
- `Backend/routes/cartRoutes.js` - Protected cart and cart coupon write route wiring.
- `Backend/routes/orderRoutes.js` - Protected order write/read route wiring.
- `Backend/routes/couponRoutes.js` - Coupon validation and admin coupon route wiring.
- `Backend/routes/contactRoutes.js` - Public contact and admin contact route wiring.
- `Backend/controllers/authController.js` - JWT signing, register/login, profile, and address mutation behavior.
- `Backend/controllers/productController.js` - Product query validation and admin product DTO target.
- `Backend/controllers/cartController.js` - Cart item and coupon DTO target.
- `Backend/controllers/orderController.js` - Shipping address and notes DTO target.
- `Backend/controllers/couponController.js` - Coupon validation/admin DTO target.
- `Backend/controllers/contactController.js` - Contact DTO and stable validation target.
- `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Cart.js`, `Backend/models/Order.js`, `Backend/models/Coupon.js`, `Backend/models/ContactMessage.js` - Existing persistence fields that validators must map to.
- `Backend/test/setup.js` - Existing test env and MongoMemoryServer setup to adjust carefully for shorter JWT defaults and config validation.

### Frontend Source Files
- `Frontend/Ecommerce-main/my-app/package.json` - Frontend dependency and script baseline.
- `Frontend/Ecommerce-main/my-app/package-lock.json` - Frontend dependency lockfile changes.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` - Auth persistence and token storage behavior.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` - Bearer header attachment and logout-on-401 behavior.
- `Frontend/Ecommerce-main/my-app/src/config/config.js` - Public config and MapTiler fallback behavior.
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` - Map rendering behavior and public contact flow.
- `Frontend/Ecommerce-main/my-app/src/**/*.test.*` - Existing CRA/Jest tests to preserve and extend.

### Verification Assets
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Static contract checker retained as a Phase 3 gate.
- `.planning/spikes/001-core-flow-contract-check/results.json` - Current checker evidence and expected no-FAIL behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/app.js`: already exports the Express app for route tests; security middleware should mount here before route registration.
- `Backend/server.js`: small startup entrypoint where config validation can run before `connectDB()` and `app.listen(...)`.
- `Backend/test/setup.js`: shared Vitest/MongoMemoryServer setup for backend security tests; may need stronger test `JWT_SECRET` and `JWT_EXPIRE` defaults.
- `Backend/middleware/auth.js`: existing JWT verification seam for algorithm and secret validation tests.
- `Backend/controllers/*.js`: current route envelopes and direct body writes show exactly where DTO mapping should be inserted.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js`: single source of auth persistence state and the token-storage change.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js`: central bearer header and logout-on-401 integration point.
- `Frontend/Ecommerce-main/my-app/src/config/config.js`: single source for public frontend config and MapTiler fallback behavior.

### Established Patterns
- Backend uses ES modules and explicit `.js` import extensions.
- Backend routing stays thin; controllers own request behavior and models own persistence.
- JSON responses usually use `{ success, data, message }`; Phase 3 should extend this pattern rather than inventing a parallel error contract.
- Cart and order routers use `router.use(protect)`; mixed public/admin resources apply `protect` and `admin` per route.
- Frontend code should use resource API modules and the shared Axios instance instead of direct network calls from pages.
- Frontend tests stay on CRA/Jest/React Testing Library for now.
- Broad dependency/tooling migration is deferred unless security remediation forces it.
- Local `.env` files and the untracked `Backend/.env.example` must not be included in Phase 3 edits.

### Integration Points
- Security middleware connects to `Backend/app.js` before `/api/*` routes.
- Startup config validation connects to `Backend/server.js` and should not break Supertest imports of `Backend/app.js`.
- Validation middleware or controller-entry parsing connects to auth, product, cart, order, coupon, and contact controllers.
- Dependency remediation connects to nested `Backend` and `Frontend/Ecommerce-main/my-app` package manifests and lockfiles.
- Token-storage changes connect `authStore.js` to `axios.js` through the existing Zustand store API.
- MapTiler fallback changes connect `config.js` to `Contact.jsx` and `docs/CONFIGURATION.md`.
- Verification connects backend tests, frontend tests, frontend build, npm audit, and the retained static checker.

</code_context>

<specifics>
## Specific Ideas

- User approved all recommendations from the one-shot Phase 3 discussion on 2026-06-12.
- External skill search was performed during discussion. No external skills were installed because available matches were off-stack, duplicate local skills, or lower signal than local `api-sec`, `jwt-security`, `dependency-upgrade`, and `api-testing`.
- Current backend production audit still reports 5 findings before Phase 3 remediation.
- Current frontend production audit still reports 52 findings before Phase 3 remediation, with `react-scripts` remaining the likely hard boundary.
- Dependency remediation should be verified from actual `npm audit --omit=dev` output after changes, not inferred from version numbers.
- Do not include the existing hard-coded MapTiler fallback value in planning artifacts or commits.

</specifics>

<deferred>
## Deferred Ideas

- Per-user, per-email, Redis-backed, or horizontally shared rate limiting belongs in a later deployment/operations phase if production topology requires it.
- Refresh-token rotation and HttpOnly cookie session architecture belong in a dedicated future auth-hardening phase.
- Full CRA-to-Vite/frontend tooling migration belongs in v2 or a later dependency/tooling phase unless Phase 3 audit remediation cannot proceed without it.
- Payment provider work, checkout inventory transactions, admin fulfillment, CI workflow creation, and structured observability remain in later roadmap phases.

</deferred>

---

*Phase: 03-api-security-and-validation*
*Context gathered: 2026-06-12*
