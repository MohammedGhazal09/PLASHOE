---
phase: 09-production-launch-setup-and-staging-verification
status: blocked
updated: 2026-06-13
evidence_policy: redacted
---

# Phase 09 User Setup

Status: Blocked until all required hosted evidence rows are complete.

This file records staging setup evidence without secrets. Public origins may be written when they are safe to share. Dashboard IDs, account IDs, connection strings, API keys, webhook signing secrets, JWT secrets, bearer tokens, raw webhook payloads, and real `.env` files must not be pasted here.

## Execution Notes

- 2026-06-13: Plan 09-02 local pre-deploy gates passed: backend tests, frontend tests, frontend build, static contract checker, and audit policy.
- 2026-06-13: Hosted backend smoke is blocked because `<staging-backend-origin>` and staging MongoDB isolation proof are not recorded.
- 2026-06-13: Hosted frontend smoke is blocked because `<staging-frontend-origin>`, staging API URL wiring proof, staging account setup, and MapTiler decision are not recorded.
- 2026-06-13: Plan 09-03 Stripe proof is blocked because Stripe test-mode endpoint, event selection, host secret storage, and delivery evidence are not recorded.

Recommendation: fill only safe public origins and redacted provider labels here, keep all secret values in host/dashboard secret managers, then rerun Phase 09 verification.

## Staging Topology

| Area | Required value | Current evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Backend provider | Managed Node host | `<backend-provider-label>` | blocked | User must create or identify the staging backend host. |
| Backend app root | `Backend` | `Backend` | configured-redacted | Source-controlled app root, not a secret. |
| Backend install command | `npm ci` | `npm ci` | configured-redacted | Matches `docs/DEPLOYMENT.md`. |
| Backend start command | `npm start` | `npm start` | configured-redacted | Runs `Backend/server.js`. |
| Backend origin | Public staging backend origin | `<staging-backend-origin>` | blocked | Required before hosted `/api/health`, `/api/ready`, request-id, and Stripe webhook checks. |
| Backend health path | `/api/health` | `<staging-backend-origin>/api/health` | blocked | Fill after backend origin exists. |
| Backend readiness path | `/api/ready` | `<staging-backend-origin>/api/ready` | blocked | Must prove MongoDB connected readiness. |
| Frontend provider | Static frontend host | `<frontend-provider-label>` | blocked | User must create or identify the staging frontend host. |
| Frontend app root | `Frontend/Ecommerce-main/my-app` | `Frontend/Ecommerce-main/my-app` | configured-redacted | Source-controlled app root, not a secret. |
| Frontend build command | `npm run build` | `npm run build` | configured-redacted | Create React App static build. |
| Frontend publish directory | `Frontend/Ecommerce-main/my-app/build` | `Frontend/Ecommerce-main/my-app/build` | configured-redacted | Static host publish directory. |
| Frontend origin | Public staging storefront origin | `<staging-frontend-origin>` | blocked | Required before hosted storefront, route, and API wiring checks. |

## Backend Environment Checklist

Store these values in the backend host secret/config manager. Record only status and redacted evidence.

| Variable | Required for staging | Expected source | Evidence to record | Status | Blocker or notes |
| --- | --- | --- | --- | --- | --- |
| `MONGO_URI` | Yes | Staging MongoDB provider | Staging DB label and `/api/ready` connected proof, never URI | blocked | User must configure staging database connection outside git. |
| `JWT_SECRET` | Yes | Backend host secret manager | Present in host secret manager; startup succeeds | blocked | User must generate 32+ character secret. |
| `JWT_EXPIRE` | Optional | Backend host config | Value or inherited default `1h` | pending | Default acceptable if host does not override. |
| `FRONTEND_URL` | Yes | Staging frontend origin | Matches `<staging-frontend-origin>` | blocked | Requires frontend origin first. |
| `PORT` | Platform-dependent | Backend host config | Platform-provided or configured port | pending | Host may inject this automatically. |
| `PAYMENTS_ENABLED` | Yes | Backend host config | `true` for Stripe staging smoke; `false` only blocks payment proof | blocked | Must be true before Stripe staging proof. |
| `STRIPE_SECRET_KEY` | Yes when payments enabled | Stripe test-mode dashboard | Secret present in backend host secret manager, no value recorded | blocked | User must configure test-mode key. |
| `STRIPE_WEBHOOK_SECRET` | Yes when payments enabled | Stripe test-mode endpoint signing secret | Secret present in backend host secret manager, no value recorded | blocked | User must create endpoint first. |
| `PAYMENT_SUCCESS_URL` | Yes when payments enabled | Staging frontend return URL | `<staging-frontend-origin>/checkout/success` | blocked | Requires frontend origin first. |
| `PAYMENT_CANCEL_URL` | Yes when payments enabled | Staging frontend return URL | `<staging-frontend-origin>/checkout/cancel` | blocked | Requires frontend origin first. |

## Frontend Build-Time Checklist

Create React App embeds `REACT_APP_*` values into the static bundle at build time. Rebuild after changing these values.

| Variable | Required for staging | Expected value or decision | Status | Blocker or notes |
| --- | --- | --- | --- | --- |
| `REACT_APP_API_URL` | Yes | `<staging-backend-origin>/api` | blocked | Required before frontend build and runtime API wiring proof. |
| `REACT_APP_NAME` | Public | `PLASHOE` or approved staging label | pending | Verify final public display value before Phase 12. |
| `REACT_APP_DESCRIPTION` | Public | Approved public or staging placeholder description | pending | Mark placeholder if not final. |
| `PUBLIC_URL` | Optional | `/` unless host requires subpath | pending | Must match static host routing. |
| `REACT_APP_UNSPLASH_BASE_URL` | Public | `https://images.unsplash.com` or approved CDN base | pending | Public URL, not a secret. |
| `REACT_APP_MAPTILER_API_KEY` | Optional | Domain-restricted public browser key or fallback-only | blocked | User must either restrict key to staging/frontend domains or accept fallback-only behavior. |
| `REACT_APP_MAP_CENTER_LAT` | Public | Approved staging map latitude | pending | Public display value. |
| `REACT_APP_MAP_CENTER_LNG` | Public | Approved staging map longitude | pending | Public display value. |
| `REACT_APP_MAP_ZOOM` | Public | Approved staging map zoom | pending | Public display value. |
| `REACT_APP_FACEBOOK_URL` | Public | Real approved URL or staging placeholder | pending | Placeholder allowed only if marked for Phase 12 replacement. |
| `REACT_APP_INSTAGRAM_URL` | Public | Real approved URL or staging placeholder | pending | Placeholder allowed only if marked for Phase 12 replacement. |
| `REACT_APP_TWITTER_URL` | Public | Real approved URL or staging placeholder | pending | Placeholder allowed only if marked for Phase 12 replacement. |
| `REACT_APP_PINTEREST_URL` | Public | Real approved URL or staging placeholder | pending | Placeholder allowed only if marked for Phase 12 replacement. |
| `REACT_APP_COMPANY_EMAIL` | Public | Real approved email or staging placeholder | pending | Placeholder allowed only if marked for Phase 12 replacement. |
| `REACT_APP_COMPANY_PHONE` | Public | Real approved phone or staging placeholder | pending | Placeholder allowed only if marked for Phase 12 replacement. |
| `REACT_APP_COMPANY_ADDRESS` | Public | Real approved address or staging placeholder | pending | Placeholder allowed only if marked for Phase 12 replacement. |
| `REACT_APP_ENABLE_GUEST_CHECKOUT` | Public flag | `true` or `false` | pending | Match staging checkout plan. |
| `REACT_APP_ENABLE_WISHLIST` | Public flag | `false` unless explicitly enabled later | pending | Wishlist is out of Phase 09 scope. |
| `REACT_APP_ENABLE_REVIEWS` | Public flag | `false` unless explicitly enabled later | pending | Reviews are out of Phase 09 scope. |

## MongoDB Isolation

| Evidence item | Required evidence shape | Status | Notes |
| --- | --- | --- | --- |
| Provider label | Redacted provider name, such as `MongoDB Atlas` or equivalent | blocked | User must provide safe non-secret label. |
| Environment label | Staging project/environment label | blocked | Do not include account IDs or connection strings. |
| Database or cluster label | Redacted staging database/cluster label | blocked | Must prove this is not production data. |
| Credential boundary | Separate staging user, credential, project, cluster, or database boundary | blocked | Record boundary type only. |
| Production data exclusion | Confirmation that checkout/payment smoke uses disposable staging data | blocked | Required before hosted payment proof. |
| Runtime proof | Hosted `/api/ready` returns `ready: true` and MongoDB `connected` | blocked | Filled by Plan 09-02 after backend origin exists. |

## Stripe Test-Mode Setup

| Evidence item | Required value or evidence shape | Status | Notes |
| --- | --- | --- | --- |
| Mode | Test mode, not live mode | blocked | User must verify in Stripe dashboard. |
| Endpoint URL | `<staging-backend-origin>/api/webhooks/stripe` | blocked | Requires backend origin first. |
| Signing secret storage | `STRIPE_WEBHOOK_SECRET` stored in backend host secret manager | blocked | Record presence only, never value. |
| API secret storage | `STRIPE_SECRET_KEY` test-mode key stored in backend host secret manager | blocked | Record presence only, never value. |
| `checkout.session.completed` | Selected on staging endpoint | blocked | Required event. |
| `payment_intent.succeeded` | Selected on staging endpoint | blocked | Required event. |
| `payment_intent.payment_failed` | Selected on staging endpoint | blocked | Required event. |
| `checkout.session.expired` | Selected on staging endpoint | blocked | Required event. |
| `charge.refunded` | Selected on staging endpoint | blocked | Subscription required; refund smoke optional unless safe test refund path exists. |
| `refund.updated` | Selected on staging endpoint | blocked | Subscription required; refund smoke optional unless safe test refund path exists. |
| Success return URL | `<staging-frontend-origin>/checkout/success` | blocked | Requires frontend origin first. |
| Cancel return URL | `<staging-frontend-origin>/checkout/cancel` | blocked | Requires frontend origin first. |

## MapTiler

| Decision | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Domain-restricted public key enabled | Key restricted to staging/frontend origins in MapTiler dashboard | blocked | Record dashboard status without key value. |
| Fallback-only accepted | Contact map uses OpenStreetMap fallback because no key is configured | blocked | Acceptable for staging only if explicitly approved. |

## Public Content Placeholders

| Public value | Current decision | Status | Phase 12 action |
| --- | --- | --- | --- |
| App name | `PLASHOE` | pending | Confirm final public name. |
| App description | Staging placeholder or final marketing copy | pending | Replace if placeholder. |
| Social URLs | Staging placeholders may be used if clearly marked | pending | Replace with owned official URLs. |
| Company email | Staging placeholder may be used if clearly marked | pending | Replace with monitored production inbox. |
| Company phone | Staging placeholder may be used if clearly marked | pending | Replace with approved production phone. |
| Company address | Staging placeholder may be used if clearly marked | pending | Replace with approved public address. |

## Blockers

| Owner | Blocker | Required action | Phase 09 can proceed? |
| --- | --- | --- | --- |
| User | Staging backend host is not recorded | Create/identify managed Node backend host and provide safe public origin. | No hosted backend smoke; local gates can run. |
| User | Staging frontend host is not recorded | Create/identify static frontend host and provide safe public origin. | No hosted frontend smoke; local gates can run. |
| User | Staging MongoDB isolation evidence is not recorded | Configure staging MongoDB boundary and provide redacted labels. | No readiness/payment proof. |
| User | Stripe test-mode endpoint and host secrets are not recorded | Configure Stripe test-mode endpoint/events and backend host secrets. | No Stripe proof. |
| User | MapTiler decision is not recorded | Restrict public key to staging/frontend domains or approve fallback-only. | Frontend map evidence remains pending. |
