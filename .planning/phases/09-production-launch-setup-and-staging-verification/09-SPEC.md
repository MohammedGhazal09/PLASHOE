# Phase 9: Production Launch Setup and Staging Verification - Specification

**Created:** 2026-06-13
**Ambiguity score:** 0.09 (gate: <= 0.20)
**Requirements:** 8 locked

## Goal

PLASHOE has a real staging deployment with configured external services, redacted launch evidence, and passing smoke checks for backend readiness, frontend API wiring, and Stripe test-mode payment/webhook flow before any production cutover.

## Background

Phase 8 made the repository deployment-ready: CI exists, backend `/api/health` and `/api/ready` exist, request correlation uses `X-Request-Id`, structured logs redact sensitive metadata, runtime config rejects template placeholders outside tests, and deployment/configuration/testing docs describe required checks. What does not exist yet is live staging proof. `08-USER-SETUP.md` still lists external account, hosting, secret manager, Stripe dashboard, frontend build environment, and MapTiler/domain restriction tasks as incomplete. Phase 9 converts those external setup gaps into concrete staging URLs, redacted configuration evidence, smoke-check evidence, and Stripe test-mode webhook proof. Production cutover remains Phase 12.

## Requirements

1. **Staging topology**: Phase 9 must lock a staging topology with one managed Node backend host and one static frontend host.
   - Current: `docs/DEPLOYMENT.md` recommends a managed Node backend and static frontend, but no real staging URLs are recorded.
   - Target: `09-USER-SETUP.md` records canonical staging backend and frontend origins, with backend rooted at `Backend` and frontend serving `Frontend/Ecommerce-main/my-app/build`.
   - Acceptance: A verifier can read `09-USER-SETUP.md` and find redacted staging backend and frontend URLs plus the configured backend/frontend app roots.

2. **External configuration**: Required staging environment variables must be configured in host or dashboard secret/config managers, not committed to source.
   - Current: Templates and docs list `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_SUCCESS_URL`, `PAYMENT_CANCEL_URL`, `REACT_APP_API_URL`, and optional `REACT_APP_MAPTILER_API_KEY`, but the real hosted values are not proven configured.
   - Target: Staging has all required backend and frontend build-time values configured outside git, with real secrets redacted from all planning artifacts.
   - Acceptance: `09-USER-SETUP.md` contains a redacted checklist showing each required variable as configured, and a secret scan over docs/templates/planning artifacts finds no MongoDB URI, JWT secret, Stripe key, or Stripe webhook secret.

3. **Database isolation**: Staging checkout/payment verification must use a staging MongoDB database separate from production.
   - Current: `MONGO_URI` is required by runtime validation, but no staging database identity or isolation evidence is recorded.
   - Target: Staging uses a non-production MongoDB database or cluster/user that can be safely mutated by checkout and webhook tests.
   - Acceptance: `09-USER-SETUP.md` records redacted database isolation evidence, such as provider name plus database/environment label, without exposing the connection string.

4. **Public frontend configuration**: Public frontend values must be production-safe or explicitly accepted as staging placeholders.
   - Current: `docs/CONFIGURATION.md` still marks production `REACT_APP_API_URL`, MapTiler key, social URLs, email, phone, and address values with verification notes.
   - Target: Staging frontend build config points at the staging backend `/api`; public contact/social/company values are either real approved values or explicitly marked as staging placeholders; MapTiler is either disabled/fallback-only or uses a domain-restricted public browser key.
   - Acceptance: `09-VERIFICATION.md` records the resolved public config decisions and proves the built storefront does not call `localhost` for API traffic.

5. **Pre-deploy gates**: Local pre-deploy gates must pass before staging smoke checks are accepted.
   - Current: Phase 8 verified backend tests, frontend tests/build, static contract checker, and audit policy locally, but Phase 9 has no launch-specific gate record.
   - Target: Phase 9 records current command outcomes for backend tests, frontend tests, frontend build, static contract checker, and `node scripts/ci/check-audits.mjs` before staging verification.
   - Acceptance: `09-VERIFICATION.md` includes pass/fail rows for each command and blocks completion if any command fails.

6. **Backend staging smoke checks**: The deployed staging backend must prove liveness, readiness, and request correlation.
   - Current: `/api/health`, `/api/ready`, and `X-Request-Id` behavior exist in code, but there is no hosted evidence.
   - Target: Staging `GET /api/health` returns `200`, staging `GET /api/ready` returns `200` with `ready: true` and MongoDB `connected`, and at least one staging API response includes `X-Request-Id`.
   - Acceptance: `09-VERIFICATION.md` records the exact hosted endpoints checked, status codes, sanitized response summaries, and `X-Request-Id` evidence.

7. **Frontend staging smoke checks**: The deployed staging frontend must load and use the staging backend URL for customer-critical paths.
   - Current: The frontend build reads `REACT_APP_API_URL`, and checkout return pages exist, but no hosted frontend smoke evidence exists.
   - Target: The staging storefront loads, public product browsing works, authentication can reach the staging API, checkout return routes render, and network/API evidence shows calls go to the staging backend base URL.
   - Acceptance: `09-VERIFICATION.md` records smoke evidence for frontend load, product browsing, auth/API reachability, `/checkout/success`, `/checkout/cancel`, and staging backend URL usage.

8. **Stripe test-mode payment proof**: Staging must prove Stripe test-mode checkout/webhook behavior without live customer charges.
   - Current: Webhook code handles `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.expired`, `charge.refunded`, and `refund.updated`, and automated tests sign local payloads; no dashboard delivery evidence exists.
   - Target: Stripe test mode is configured for staging with endpoint `<staging-backend-origin>/api/webhooks/stripe`; dashboard subscription includes the documented payment events; at least checkout success, payment success, payment failure, and checkout expiry are smoke-tested or sent as test events.
   - Acceptance: `09-VERIFICATION.md` records redacted Stripe dashboard evidence for endpoint URL, selected events, delivery statuses, and the absence of sustained backend 5xx errors during webhook tests.

## Boundaries

**In scope:**
- Staging backend and frontend hosting setup evidence.
- Redacted external configuration checklist for staging and production-prep variables.
- Staging MongoDB isolation proof.
- Frontend public config verification for API URL, contact/social/company values, and MapTiler behavior.
- Local pre-deploy command evidence before staging smoke checks.
- Hosted smoke checks for `/api/health`, `/api/ready`, `X-Request-Id`, frontend load, product browsing, auth/API reachability, and checkout return routes.
- Stripe test-mode webhook endpoint and delivery evidence.
- `09-USER-SETUP.md` and `09-VERIFICATION.md` artifacts.

**Out of scope:**
- Production cutover, production tag/push, and live customer payment execution - Phase 12 owns release cutover.
- Frontend tooling migration away from CRA/react-scripts - Phase 10 owns tooling debt and warning cleanup.
- External monitoring, alert rules, backup/restore drills, and incident-response ownership - Phase 11 owns operational readiness.
- New storefront features, wishlist, reviews, or admin UI expansion - current scope is launch setup proof, not product expansion.
- Committing real `.env` files, API keys, Stripe secrets, MongoDB URIs, JWT secrets, dashboard screenshots containing secrets, or raw webhook payloads - source control must stay secret-free.

## Constraints

- Do all work inline; do not use subagents.
- Treat Phase 9 as staging proof only; production cutover waits for Phase 12.
- Use a managed Node backend host and static frontend host unless a later approved spec update changes the topology.
- Store secrets only in host/dashboard secret managers. Planning artifacts may contain redacted status and sanitized summaries only.
- Use Stripe test mode for staging proof. Live Stripe setup may be tracked as checklist evidence but must not execute live customer charges in Phase 9.
- Use a staging MongoDB database separate from production.
- Keep `REACT_APP_MAPTILER_API_KEY` as a public, domain-restricted browser key when enabled; do not treat it as a backend secret.
- Fail Phase 9 verification if hosted frontend traffic still targets `localhost`, `/api/ready` is not ready, Stripe webhook delivery produces sustained backend 5xx responses, required placeholders remain unresolved, or secret-looking values appear in source-controlled artifacts.

## Acceptance Criteria

- [ ] `09-USER-SETUP.md` records canonical staging backend and frontend URLs with app roots.
- [ ] `09-USER-SETUP.md` marks required backend/frontend/Stripe/MapTiler variables configured without exposing real secret values.
- [ ] Staging MongoDB isolation from production is documented without exposing the connection string.
- [ ] Public frontend config decisions are recorded, including API URL, contact/social/company values, and MapTiler enabled/fallback status.
- [ ] Local pre-deploy gates pass: backend tests, frontend tests, frontend build, static contract checker, and audit policy.
- [ ] Staging `GET /api/health` returns `200`.
- [ ] Staging `GET /api/ready` returns `200` with `ready: true` and MongoDB `connected`.
- [ ] At least one staging API response includes `X-Request-Id`.
- [ ] Staging frontend loads and customer-critical routes use the staging backend API URL, not `localhost`.
- [ ] Staging checkout return routes `/checkout/success` and `/checkout/cancel` render.
- [ ] Stripe test-mode endpoint points to `<staging-backend-origin>/api/webhooks/stripe` and subscribes to the documented payment events.
- [ ] Stripe test-mode delivery evidence covers checkout success, payment success, payment failure, and checkout expiry without sustained backend 5xx errors.
- [ ] Secret scans over source-controlled docs/templates/planning artifacts find no real MongoDB URI, JWT secret, Stripe secret key, or Stripe webhook secret.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
| --- | --- | --- | --- | --- |
| Goal Clarity | 0.92 | 0.75 | PASS | Staging proof, not production cutover, is now explicit. |
| Boundary Clarity | 0.94 | 0.70 | PASS | Phase 10, Phase 11, and Phase 12 work is excluded. |
| Constraint Clarity | 0.88 | 0.65 | PASS | Secret handling, Stripe mode, DB isolation, and topology constraints are locked. |
| Acceptance Criteria | 0.90 | 0.70 | PASS | Hosted checks and evidence artifacts are pass/fail. |
| **Ambiguity** | 0.09 | <=0.20 | PASS | Requirements are clear enough for discuss-phase. |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
| --- | --- | --- | --- |
| 1 | Researcher | Which deployment topology should Phase 9 assume? | Managed Node backend plus static frontend, platform-neutral. |
| 1 | Researcher | Should Phase 9 deploy staging only, or staging plus production? | Staging only; production cutover remains Phase 12. |
| 1 | Researcher | Are real staging URLs required? | Yes, canonical backend and frontend staging origins are required. |
| 1 | Researcher | Which env vars must be proven configured? | All variables listed in `08-USER-SETUP.md`, with MapTiler required only if enabled. |
| 2 | Simplifier | What is the minimum viable evidence set? | Redacted setup checklist plus hosted backend, frontend, and Stripe test-mode smoke evidence. |
| 2 | Simplifier | How should secrets be handled in evidence? | Redacted status only; never commit real secret values. |
| 2 | Simplifier | Should staging use a separate database? | Yes, staging MongoDB must be isolated from production. |
| 3 | Boundary Keeper | What Stripe mode is in scope? | Stripe test mode for staging proof; live execution waits for production cutover. |
| 3 | Boundary Keeper | What Stripe events must be verified? | Subscribe to documented events; smoke-test success, failure, and expiry paths. |
| 3 | Boundary Keeper | What public config must be decided? | API URL, company/contact/social values, and MapTiler enabled/fallback behavior. |
| 4 | Failure Analyst | What should fail Phase 9? | Secrets in source, localhost API calls, failed readiness, webhook delivery failures, or sustained 5xx. |
| 4 | Failure Analyst | What is explicitly out of scope? | Frontend tooling migration, alerting setup, production cutover, and new product features. |
| 5 | Seed Closer | Who performs dashboard setup? | User performs dashboard-only tasks; agent documents fields and verifies redacted evidence. |
| 5 | Seed Closer | Where should evidence be written? | `09-USER-SETUP.md` and `09-VERIFICATION.md`. |

---

*Phase: 09-production-launch-setup-and-staging-verification*
*Spec created: 2026-06-13*
*Next step: $gsd-discuss-phase 9 - implementation decisions (how to produce the setup and verification artifacts)*
