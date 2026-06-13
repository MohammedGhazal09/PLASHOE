# Phase 09: production-launch-setup-and-staging-verification - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 09 turns the Phase 08 deployment-ready repository into real staging proof: canonical hosted staging backend and frontend origins, redacted external configuration evidence, staging MongoDB isolation proof, local pre-deploy gate results, hosted backend/frontend smoke evidence, and Stripe test-mode checkout/webhook proof.

This phase does not perform production cutover, run live customer payments, migrate frontend tooling, add monitoring/alerts/backups, or add new product/admin features.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `09-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `09-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Staging backend and frontend hosting setup evidence.
- Redacted external configuration checklist for staging and production-prep variables.
- Staging MongoDB isolation proof.
- Frontend public config verification for API URL, contact/social/company values, and MapTiler behavior.
- Local pre-deploy command evidence before staging smoke checks.
- Hosted smoke checks for `/api/health`, `/api/ready`, `X-Request-Id`, frontend load, product browsing, auth/API reachability, and checkout return routes.
- Stripe test-mode webhook endpoint and delivery evidence.
- `09-USER-SETUP.md` and `09-VERIFICATION.md` artifacts.

**Out of scope (from SPEC.md):**
- Production cutover, production tag/push, and live customer payment execution - Phase 12 owns release cutover.
- Frontend tooling migration away from CRA/react-scripts - Phase 10 owns tooling debt and warning cleanup.
- External monitoring, alert rules, backup/restore drills, and incident-response ownership - Phase 11 owns operational readiness.
- New storefront features, wishlist, reviews, or admin UI expansion - current scope is launch setup proof, not product expansion.
- Committing real `.env` files, API keys, Stripe secrets, MongoDB URIs, JWT secrets, dashboard screenshots containing secrets, or raw webhook payloads - source control must stay secret-free.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Workflow Boundaries
- **D-01:** Use installed local skills as supporting guidance: `deployment-procedures`, `ci-cd`, `stripe-webhooks`, `secret-scanning`, and `observability`.
- **D-02:** Do all work inline and do not use subagents. This carries forward the repository instruction and prior GSD phase decisions.
- **D-03:** Treat Phase 09 as staging proof only. Production cutover, production tag/push, live customer payments, and post-launch review remain Phase 12.
- **D-04:** Preserve unrelated dirty planning files and avoid broad resets, broad staging, or unrelated roadmap/state edits.

### Evidence Artifacts
- **D-05:** Produce exactly two Phase 09 evidence artifacts during execution: `09-USER-SETUP.md` for staging setup/configuration evidence and `09-VERIFICATION.md` for command and hosted smoke evidence.
- **D-06:** Do not add screenshots, raw dashboard exports, raw webhook payloads, real `.env` files, or secret values to source-controlled planning artifacts.
- **D-07:** If dashboard access, hosting access, or credentials are unavailable, record explicit blocked rows in `09-USER-SETUP.md` and do not mark Phase 09 complete.

### External Setup Responsibility
- **D-08:** The user is responsible for external dashboard-only actions: host app creation, host secret/config settings, MongoDB dashboard setup, Stripe dashboard endpoint/event configuration, MapTiler dashboard restrictions, and any production account activation.
- **D-09:** The agent is responsible for writing exact checklists, commands, expected evidence shapes, and redacted verification instructions that the user can fill or verify without exposing secrets.

### Staging Topology and URLs
- **D-10:** Keep deployment guidance platform-neutral while requiring concrete provider labels, app roots, and canonical staging origins in `09-USER-SETUP.md`.
- **D-11:** Use one managed Node backend host rooted at `Backend` and one static frontend host serving `Frontend/Ecommerce-main/my-app/build`.
- **D-12:** Record exact public staging frontend and backend origins when they are not secret. Redact dashboard IDs, internal host identifiers, account IDs, or private host details if they appear in provider URLs.
- **D-13:** The backend canonical smoke origin should be the backend origin, with API checks under `/api/*`. The frontend canonical smoke origin should be the static storefront origin.

### Secret and Configuration Evidence
- **D-14:** Verify secret presence through redacted checklist rows plus runtime proof such as startup success, `/api/ready`, Stripe webhook delivery, and smoke behavior. Never record actual values.
- **D-15:** Backend staging config must include hosted values for `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `PAYMENTS_ENABLED`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_SUCCESS_URL`, and `PAYMENT_CANCEL_URL`, plus optional `JWT_EXPIRE` and `PORT` where the platform uses them.
- **D-16:** Frontend staging build config must include `REACT_APP_API_URL` pointing to the staging backend `/api` base URL, plus public display/map/social/company values as appropriate.
- **D-17:** Public frontend contact/social/company values may remain explicit staging placeholders in Phase 09, but they must be marked clearly for Phase 12 production replacement. They must not silently pass as final production values.
- **D-18:** If MapTiler is enabled, use a browser-visible public key restricted to staging/frontend domains. If no key is provided, record the OpenStreetMap/fallback behavior as the accepted staging state.
- **D-19:** Run a secret-looking value check over docs/templates/planning artifacts before accepting Phase 09 evidence. The check must look for MongoDB URIs, Stripe secret keys, Stripe webhook secrets, JWT-like secrets, and similar leaked values.

### Staging Database Isolation
- **D-20:** Staging MongoDB must be separate from production by database, cluster, project, or user/credential boundary.
- **D-21:** Prove isolation with redacted provider/environment/database labels and hosted readiness results. Do not include `MONGO_URI` or credential material.
- **D-22:** Use disposable staging test data for checkout/payment verification. Avoid production customer/order data.

### Pre-Deploy Gates
- **D-23:** Local pre-deploy gates are required before hosted smoke evidence is accepted: backend tests, frontend tests, frontend build, static contract checker, and `node scripts/ci/check-audits.mjs`.
- **D-24:** GitHub Actions status should be recorded if available, but remote CI is not a hard Phase 09 blocker because final remote release gating belongs to Phase 12.
- **D-25:** Do not add Playwright, Cypress, Lighthouse, ZAP, or a new E2E framework in Phase 09. Use documented command, browser, network, curl, and dashboard evidence.
- **D-26:** Existing known CRA/test/build warnings remain Phase 10 work unless they become new failures or obscure Phase 09 evidence.

### Backend Staging Smoke Checks
- **D-27:** `09-VERIFICATION.md` must record hosted `GET /api/health` with status code and sanitized response summary.
- **D-28:** `09-VERIFICATION.md` must record hosted `GET /api/ready` with status code, `ready: true`, and MongoDB state `connected`.
- **D-29:** `09-VERIFICATION.md` must record at least one hosted API response with `X-Request-Id` evidence.
- **D-30:** Backend smoke evidence may include sanitized structured log summaries, but logs must not include bearer tokens, Stripe secrets, webhook payloads, raw request bodies, passwords, JWT secrets, or MongoDB connection strings.

### Frontend Staging Smoke Checks
- **D-31:** The staging storefront must load from the static frontend origin.
- **D-32:** Public product browsing must work against the staged app without backend 5xx responses.
- **D-33:** Auth/API reachability must be smoke-checked with a disposable staging user or an explicitly documented staging account.
- **D-34:** Checkout return routes `/checkout/success` and `/checkout/cancel` must render on the staged frontend.
- **D-35:** Frontend API wiring proof must show calls go to the staging backend base URL, not `localhost`. Preferred evidence is browser network inspection summarized in `09-VERIFICATION.md`; a build/static grep may support but should not replace runtime evidence.
- **D-36:** Admin-critical smoke checks are optional in Phase 09 unless a staging admin account already exists. If included, they must use disposable staging data and avoid production orders.

### Stripe Test-Mode Proof
- **D-37:** Stripe proof must use Stripe test mode only. Do not execute live customer charges in Phase 09.
- **D-38:** The staging Stripe webhook endpoint must be `<staging-backend-origin>/api/webhooks/stripe`.
- **D-39:** Subscribe the staging Stripe endpoint to the documented events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.expired`, `charge.refunded`, and `refund.updated`.
- **D-40:** Smoke evidence must cover checkout success, payment success, payment failure, and checkout expiry through hosted checkout/test events or dashboard test sends.
- **D-41:** Refund event subscription is required, but refund smoke is optional unless a safe test refund path exists.
- **D-42:** `09-VERIFICATION.md` must record redacted Stripe dashboard evidence for endpoint URL, selected events, delivery statuses, and absence of sustained backend 5xx responses during webhook tests.
- **D-43:** Invalid signature handling is already covered by automated tests; Phase 09 focuses on dashboard delivery to the hosted staging endpoint, not duplicating local unit tests.

### Agent Discretion
- The planner may choose exact table structures for `09-USER-SETUP.md` and `09-VERIFICATION.md` if they make pass/fail/blocker status easy to audit.
- The planner may choose exact smoke command syntax (`curl`, `Invoke-WebRequest`, browser network notes) as long as evidence is redacted and reproducible.
- The planner may decide whether to include optional admin-critical smoke evidence based on whether a staging admin account exists.
- The planner may tune the exact secret-scan regexes, but must cover the Phase 09 forbidden secret classes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-SPEC.md` - Locked Phase 09 requirements, boundaries, constraints, and acceptance criteria. MUST read before planning.
- `.planning/ROADMAP.md` - Phase 09 goal, dependency on Phase 08, canonical refs, success criteria, plan candidates, and cross-cutting constraints.
- `.planning/REQUIREMENTS.md` - `LAUNCH-01` through `LAUNCH-04` traceability plus Phase 10/11/12 boundaries.
- `.planning/STATE.md` - Current project state, completed Phase 08, and known open launch risks.

### Prior Phase Carry-Forward
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-CONTEXT.md` - CI, readiness, request-id, logging, env-template, docs, audit-policy, and no-subagent decisions that Phase 09 uses.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-SPEC.md` - Locked Phase 08 deployment-readiness scope that Phase 09 builds on.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-USER-SETUP.md` - External dashboard and secret-manager items that Phase 09 converts into staging setup evidence.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-VERIFICATION.md` - Local command and implementation evidence baseline from Phase 08.
- `.planning/phases/07-catalog-and-frontend-architecture-cleanup/07-CONTEXT.md` - Product browsing/API wiring behavior that staging frontend smoke must preserve.
- `.planning/phases/06-admin-fulfillment-operations/06-CONTEXT.md` - Admin-critical path context if optional admin smoke evidence is available.
- `.planning/phases/05-production-payments/05-CONTEXT.md` - Stripe Checkout, webhook, payment-state, return-route, and test-mode behavior that Phase 09 must verify in staging.

### Deployment and Configuration Docs
- `docs/DEPLOYMENT.md` - Platform-neutral managed backend/static frontend deployment runbook, smoke checks, Stripe setup, rollback criteria, and monitoring windows.
- `docs/CONFIGURATION.md` - Backend/frontend environment variables, placeholder rules, MapTiler public key behavior, and production/staging configuration notes.
- `docs/TESTING.md` - Local command gates, known warnings, CI integration, audit policy, and payment testing notes.
- `docs/API.md` - `/api/health`, `/api/ready`, `X-Request-Id`, Stripe webhook events, payment state behavior, and error/request-id contracts.
- `docs/GETTING-STARTED.md` - Local health/readiness and frontend API URL reference for command syntax and troubleshooting.

### Backend Source Files
- `Backend/app.js` - Express app composition, `/api/health`, `/api/ready`, request context, raw Stripe webhook mount, and API route mounts.
- `Backend/server.js` - Runtime env validation, database connection, startup logging, and hosted listener behavior.
- `Backend/config/env.js` - Runtime environment validation and placeholder rejection source.
- `Backend/config/db.js` - MongoDB connection behavior and startup readiness/logging source.
- `Backend/middleware/requestContext.js` - `X-Request-Id` generation, echoing, and request completion logging.
- `Backend/middleware/security.js` - Error envelope and request-id behavior; sensitive data must remain redacted.
- `Backend/utils/readiness.js` - Mongoose connection readiness mapping used by `/api/ready`.
- `Backend/utils/logger.js` - Structured log redaction behavior and forbidden secret classes.
- `Backend/routes/webhookRoutes.js` - `POST /api/webhooks/stripe` route target.
- `Backend/controllers/webhookController.js` - Stripe event dispatch, duplicate event handling, invalid signature behavior, and current hosted 5xx failure surface.
- `Backend/services/paymentProvider.js` - Stripe API client, checkout session creation, webhook signature construction, and API version.
- `Backend/services/paymentService.js` - Payment return URL usage for hosted checkout.
- `Backend/test/payment-webhook.test.js` - Existing local signed webhook coverage, useful as a reference but not a substitute for hosted Stripe dashboard proof.
- `Backend/test/app.test.js` - Existing health/readiness/request-id route tests.

### Frontend and CI Source Files
- `Frontend/Ecommerce-main/my-app/src/config/config.js` - Central `REACT_APP_*` public config reader and defaults.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` - Frontend API base URL usage and bearer-token behavior.
- `Frontend/Ecommerce-main/my-app/src/App.js` - Checkout return route definitions.
- `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.jsx` - Payment return UI smoke target.
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` - MapTiler/OpenStreetMap behavior smoke target.
- `Frontend/Ecommerce-main/my-app/src/config/config.test.js` - MapTiler fallback/config behavior reference.
- `Backend/.env.example` - Backend safe placeholder template; do not write real values.
- `Frontend/Ecommerce-main/my-app/.env.example` - Frontend public config template; do not write secrets.
- `.github/workflows/ci.yml` - Remote CI evidence target if available.
- `scripts/ci/check-audits.mjs` - Production audit policy gate required before staging smoke.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Retained static contract checker required before staging smoke.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/app.js`: already exposes `/api/health` and `/api/ready`, mounts `/api/webhooks` with `express.raw(...)` before JSON parsers, and installs request context before route handling.
- `Backend/utils/readiness.js`: already returns sanitized MongoDB readiness state, including `ready: true` and `state: connected` when Mongoose is connected.
- `Backend/middleware/requestContext.js`: already sets `X-Request-Id` on responses and logs request completion for API paths other than `/api/health`.
- `Backend/utils/logger.js`: already redacts bearer tokens, MongoDB URIs, Stripe keys, webhook secrets, JWT-like values, payload/body fields, and sensitive key names.
- `Backend/config/env.js`: already rejects required missing values and placeholder-looking values outside tests.
- `Backend/controllers/webhookController.js`: already handles Stripe success, failure, expiry, refund, duplicate event, invalid signature, and unresolved reconciliation retry behavior.
- `Frontend/Ecommerce-main/my-app/src/config/config.js`: centralizes frontend API, map, social, company, and feature flag values from `REACT_APP_*`.
- `.github/workflows/ci.yml`: already runs backend tests, frontend tests/build, static contract checker, and audit policy on PR/push to `main`.
- `scripts/ci/check-audits.mjs`: already enforces backend clean audit and documented frontend CRA/tooling risk boundary.

### Established Patterns
- Backend uses an app/server split: `Backend/app.js` is importable/testable and `Backend/server.js` owns runtime env, DB connection, and listening.
- Backend secrets are backend-only env vars; frontend config is limited to browser-visible `REACT_APP_*` values.
- Backend readiness is intentionally separate from liveness: `/api/health` proves process liveness, `/api/ready` proves MongoDB readiness.
- Stripe webhooks require raw body signature verification and are mounted before JSON parsers.
- Frontend API calls should go through the shared Axios instance and `config.api.baseUrl`, not hardcoded URLs in pages/components.
- Documentation uses redacted evidence and explicit accepted-risk notes rather than hiding known warnings.

### Integration Points
- Staging setup evidence connects host dashboard settings, MongoDB provider labels, Stripe dashboard endpoint/events, MapTiler restrictions, `Backend/.env.example`, `Frontend/Ecommerce-main/my-app/.env.example`, `docs/CONFIGURATION.md`, and `docs/DEPLOYMENT.md`.
- Pre-deploy gates connect `Backend/package.json`, `Frontend/Ecommerce-main/my-app/package.json`, `.github/workflows/ci.yml`, `scripts/ci/check-audits.mjs`, and `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.
- Backend smoke connects hosted `Backend/app.js` endpoints, `Backend/utils/readiness.js`, `Backend/middleware/requestContext.js`, and host log summaries.
- Frontend smoke connects the static frontend origin, `Frontend/Ecommerce-main/my-app/src/config/config.js`, `Frontend/Ecommerce-main/my-app/src/api/axios.js`, product browsing pages, auth/API routes, and checkout return routes.
- Stripe staging proof connects Stripe Dashboard test-mode endpoint settings, `Backend/routes/webhookRoutes.js`, `Backend/controllers/webhookController.js`, `Backend/services/paymentProvider.js`, `Backend/services/paymentService.js`, and sanitized backend logs.

</code_context>

<specifics>
## Specific Ideas

- User approved all Phase 09 discussion recommendations on 2026-06-13.
- No phase-matched todos were found during discussion.
- No existing Phase 09 `CONTEXT.md`, plans, or discussion checkpoint were present when context capture started.
- Exact staging origins are acceptable in source-controlled setup/verification docs when they are public and non-secret; secret-looking values remain forbidden.
- Browser network evidence is preferred for proving the staging frontend is not calling `localhost`.
- Stripe dashboard delivery evidence should be summarized in text with endpoint/event/status details, not pasted as raw payloads or secret-bearing screenshots.
- Current worktree already contains unrelated/previous planning changes in `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, and untracked follow-up phase directories. Phase 09 planning should avoid broad staging and preserve that work.

</specifics>

<deferred>
## Deferred Ideas

- Production cutover, production tag/push, live payment execution, and post-launch review remain Phase 12.
- Final remote release gate and production GitHub Actions proof remain Phase 12 unless already available as optional evidence.
- Frontend tooling migration, CRA/react-scripts audit-debt removal, and warning cleanup remain Phase 10.
- External monitoring, alert rules, backup/restore drills, incident ownership, and production monitoring operations remain Phase 11.
- Browser E2E, Lighthouse, ZAP, and broad DevSecOps scanning gates remain out of Phase 09 unless a later phase explicitly adds them.
- Wishlist, reviews, full admin product/coupon UI, and other new product features remain outside v1 Phase 09.

</deferred>

---

*Phase: 09-production-launch-setup-and-staging-verification*
*Context gathered: 2026-06-13*
