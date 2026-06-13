---
phase: 09-production-launch-setup-and-staging-verification
status: pending
verified: pending
updated: 2026-06-13
requirements:
  - LAUNCH-01
  - LAUNCH-02
  - LAUNCH-03
  - LAUNCH-04
---

# Phase 09 Verification

## Verdict

Status: pending.

Phase 09 is not passed until every required local gate and hosted staging check passes. Required missing external proof must be recorded as `blocked`, not inferred from local checks.

## Local Pre-Deploy Gates

| Gate | Command | Status | Timestamp | Sanitized result summary | Known warnings |
| --- | --- | --- | --- | --- | --- |
| Backend test suite | `cd Backend; npm test` | pending |  |  |  |
| Frontend test suite | `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false` | pending |  |  |  |
| Frontend production build | `cd Frontend/Ecommerce-main/my-app; npm run build` | pending |  |  |  |
| Static contract checker | `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | pending |  |  |  |
| Production dependency audit policy | `node scripts/ci/check-audits.mjs` | pending |  |  |  |
| GitHub Actions status | `.github/workflows/ci.yml` run on PR/push | pending |  | Optional Phase 09 evidence; final remote release gate is Phase 12. |  |

## Backend Hosted Smoke

| Check | Endpoint or evidence source | Status | Timestamp | Sanitized evidence | Blocker notes |
| --- | --- | --- | --- | --- | --- |
| Backend liveness | `<staging-backend-origin>/api/health` | blocked |  |  | Staging backend origin is not recorded. |
| Backend readiness | `<staging-backend-origin>/api/ready` | blocked |  |  | Staging backend origin and MongoDB isolation proof are not recorded. |
| Request correlation | Any hosted API response header | blocked |  |  | Requires deployed backend origin. |
| Backend 5xx smoke window | Sanitized host log summary | blocked |  |  | Requires host log access or provider status evidence. |

## Frontend Hosted Smoke

| Check | Route or evidence source | Status | Timestamp | Sanitized evidence | Blocker notes |
| --- | --- | --- | --- | --- | --- |
| Staging storefront load | `<staging-frontend-origin>` | blocked |  |  | Staging frontend origin is not recorded. |
| Public product browsing | Staging product list/detail route | blocked |  |  | Requires frontend and backend staging origins. |
| Auth/API reachability | Disposable staging user flow | blocked |  |  | Requires staging account setup and backend origin. |
| Checkout success route | `<staging-frontend-origin>/checkout/success` | blocked |  |  | Requires frontend origin. |
| Checkout cancel route | `<staging-frontend-origin>/checkout/cancel` | blocked |  |  | Requires frontend origin. |
| API URL proof | Browser network summary or equivalent runtime evidence | blocked |  |  | Must prove calls use staging backend `/api`, not localhost. |
| MapTiler behavior | Domain-restricted key or fallback-only summary | blocked |  |  | MapTiler decision is not recorded. |

## Stripe Test-Mode Proof

| Check | Required evidence | Status | Timestamp | Sanitized evidence | Blocker notes |
| --- | --- | --- | --- | --- | --- |
| Endpoint URL | `<staging-backend-origin>/api/webhooks/stripe` | blocked |  |  | Backend origin and Stripe dashboard setup are not recorded. |
| Endpoint mode | Stripe test mode, not live mode | blocked |  |  | Requires dashboard verification. |
| Event selection | `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.expired`, `charge.refunded`, `refund.updated` | blocked |  |  | Requires dashboard verification. |
| Checkout success delivery | Event delivery status and HTTP status code | blocked |  |  | Requires hosted checkout or dashboard test send. |
| Payment success delivery | Event delivery status and HTTP status code | blocked |  |  | Requires hosted checkout or dashboard test send. |
| Payment failure delivery | Event delivery status and HTTP status code | blocked |  |  | Requires hosted checkout or dashboard test send. |
| Checkout expiry delivery | Event delivery status and HTTP status code | blocked |  |  | Requires hosted checkout or dashboard test send. |
| Refund subscription | `charge.refunded` and `refund.updated` selected | blocked |  |  | Subscription required; refund smoke optional unless safe test refund path exists. |
| Webhook 5xx window | No sustained backend 5xx during webhook tests | blocked |  |  | Requires hosted backend/log evidence. |
| Invalid signature behavior | Covered by `Backend/test/payment-webhook.test.js` | pending |  | Local automated coverage reference, not hosted proof. |  |

## Public Config Proof

| Decision | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Frontend build uses `REACT_APP_API_URL=<staging-backend-origin>/api` | blocked |  | Requires staging backend origin and rebuilt frontend. |
| Public social/contact/company values are final or marked staging placeholders | pending |  | Phase 12 replaces any staging placeholders. |
| MapTiler is domain-restricted or fallback-only | blocked |  | Requires dashboard restriction evidence or fallback decision. |
| No frontend backend secrets | pending |  | Verify with template scan and frontend env review. |

## Secret Scan Proof

| Scope | Command | Status | Timestamp | Result |
| --- | --- | --- | --- | --- |
| Phase 09 artifacts, docs, env templates | `rg -n "sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+|mongodb(\\+srv)?://[^<\\s]+|eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+|Bearer\\s+[A-Za-z0-9._~+/-]{20,}" .planning/phases/09-production-launch-setup-and-staging-verification/09-USER-SETUP.md .planning/phases/09-production-launch-setup-and-staging-verification/09-VERIFICATION.md docs Backend/.env.example Frontend/Ecommerce-main/my-app/.env.example` | pending |  |  |

## Acceptance Coverage

| Requirement | Acceptance criterion | Status | Evidence location | Notes |
| --- | --- | --- | --- | --- |
| LAUNCH-01 | `09-USER-SETUP.md` records canonical staging backend and frontend URLs with app roots. | blocked | `09-USER-SETUP.md` | App roots recorded; origins blocked. |
| LAUNCH-02 | Required backend/frontend/Stripe/MapTiler variables are configured without exposing real secret values. | blocked | `09-USER-SETUP.md` | Secret/config manager setup not yet proven. |
| LAUNCH-02 | Secret scans over source-controlled docs/templates/planning artifacts find no real MongoDB URI, JWT secret, Stripe secret key, or Stripe webhook secret. | pending | Secret scan proof | Final scan not yet recorded. |
| LAUNCH-01 | Staging MongoDB isolation from production is documented without exposing the connection string. | blocked | `09-USER-SETUP.md` | Isolation evidence not yet recorded. |
| LAUNCH-02 | Public frontend config decisions are recorded, including API URL, contact/social/company values, and MapTiler enabled/fallback status. | blocked | Public config proof | Public values and MapTiler decision not complete. |
| LAUNCH-03 | Local pre-deploy gates pass: backend tests, frontend tests, frontend build, static contract checker, and audit policy. | pending | Local pre-deploy gates | Commands not yet run in this phase. |
| LAUNCH-03 | Staging `GET /api/health` returns `200`. | blocked | Backend hosted smoke | Requires staging backend origin. |
| LAUNCH-03 | Staging `GET /api/ready` returns `200` with `ready: true` and MongoDB `connected`. | blocked | Backend hosted smoke | Requires staging backend origin and MongoDB setup. |
| LAUNCH-03 | At least one staging API response includes `X-Request-Id`. | blocked | Backend hosted smoke | Requires staging backend origin. |
| LAUNCH-03 | Staging frontend loads and customer-critical routes use the staging backend API URL, not localhost. | blocked | Frontend hosted smoke | Requires staging frontend origin and runtime network evidence. |
| LAUNCH-03 | Staging checkout return routes `/checkout/success` and `/checkout/cancel` render. | blocked | Frontend hosted smoke | Requires staging frontend origin. |
| LAUNCH-04 | Stripe test-mode endpoint points to `<staging-backend-origin>/api/webhooks/stripe` and subscribes to documented payment events. | blocked | Stripe test-mode proof | Requires Stripe dashboard setup. |
| LAUNCH-04 | Stripe test-mode delivery evidence covers checkout success, payment success, payment failure, and checkout expiry without sustained backend 5xx errors. | blocked | Stripe test-mode proof | Requires hosted Stripe delivery and backend evidence. |

## Blockers

| Owner | Blocker | Required action | Blocks |
| --- | --- | --- | --- |
| User | Staging backend host/origin is unavailable. | Provide safe public staging backend origin after managed Node host setup. | Backend hosted smoke, Stripe endpoint, frontend API URL proof. |
| User | Staging frontend host/origin is unavailable. | Provide safe public staging frontend origin after static frontend deployment. | Frontend hosted smoke and payment return URL proof. |
| User | Staging MongoDB isolation evidence is unavailable. | Configure staging database boundary and provide redacted labels. | `/api/ready`, checkout, and webhook proof. |
| User | Stripe test-mode dashboard setup is unavailable. | Configure endpoint, events, and backend host secrets in test mode. | LAUNCH-04. |
| User | MapTiler decision is unavailable. | Restrict public key by origin or approve fallback-only staging behavior. | Public config proof. |

## Status Rule

Set the frontmatter status to passed only when no required row is `failed`, `blocked`, or `pending`. Until then, keep the frontmatter status pending or blocked and list exact blockers.
