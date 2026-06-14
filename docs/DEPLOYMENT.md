# Deployment Readiness

PLASHOE is deployment-ready when the backend, frontend, CI checks, runtime configuration, payment setup, and smoke checks are all verified. This guide is platform-neutral: use a managed Node backend host for `Backend` and a static frontend host for `Frontend/Ecommerce-main/my-app/build`.

This document does not prove a live deployment happened, choose a mandatory host, add Docker, or define host-specific rollback commands.

## Pre-Deploy Checklist

Run these checks before cutting a release:

| Check | Command or Evidence | Expected Result |
| --- | --- | --- |
| Working tree for release | `git status --short` | Only intentional release changes are present. |
| Backend install | `cd Backend && npm ci` | Dependencies install from `package-lock.json`. |
| Backend tests | `cd Backend && npm test` | Full Vitest suite passes. |
| Frontend install | `cd Frontend/Ecommerce-main/my-app && npm ci` | Dependencies install from `package-lock.json`. |
| Frontend tests | `cd Frontend/Ecommerce-main/my-app && npm test` | Frontend Vitest suite passes. |
| Frontend build | `cd Frontend/Ecommerce-main/my-app && npm run build` | Static build is created. |
| Static contract checker | `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | No `FAIL` findings. |
| Audit policy | `node scripts/ci/check-audits.mjs` | Backend and frontend production dependency audits are clean. |
| GitHub Actions CI | `.github/workflows/ci.yml` run on PR/push | Backend, frontend, static contract, and audit-policy jobs pass after push. |

If any check fails, stop the deployment and fix the failing gate before proceeding.

## Backend Host

Configure the backend host as a Node app rooted at `Backend`.

| Setting | Value |
| --- | --- |
| Install command | `npm ci` |
| Start command | `npm start` |
| Runtime | Current Node.js LTS |
| Health check | `GET /api/health` |
| Readiness check | `GET /api/ready` |

Required backend environment variables are documented in [CONFIGURATION.md](CONFIGURATION.md) and templated in `Backend/.env.example`:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `FRONTEND_URL`
- `PORT`
- `PAYMENTS_ENABLED`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENT_SUCCESS_URL`
- `PAYMENT_CANCEL_URL`

Store backend secrets in the host secret manager. Do not put backend secrets in frontend environment variables, repository docs, CI logs, or build artifacts.

## Frontend Host

Build the frontend as a static Vite bundle.

| Setting | Value |
| --- | --- |
| App root | `Frontend/Ecommerce-main/my-app` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Publish directory | `Frontend/Ecommerce-main/my-app/build` |

Set public `REACT_APP_*` build-time values before running `npm run build`. Vite embeds those values into the static bundle, so staging and production must be rebuilt after changing `REACT_APP_API_URL` or any other `REACT_APP_*` value. At minimum, staging and production need `REACT_APP_API_URL` pointing to the matching deployed backend `/api` base URL. MapTiler keys are browser-visible public keys and should be domain-restricted.

## Stripe Setup

Staging and production payments require dashboard-managed Stripe setup before release. Use Stripe test mode for staging proof and live mode only during the Phase 12 production cutover:

1. Add `STRIPE_SECRET_KEY` to the backend host secret manager.
2. Create a Stripe webhook endpoint that posts to `<backend-origin>/api/webhooks/stripe`.
3. Subscribe the endpoint to the payment events documented in [API.md](API.md).
4. Add the endpoint's `STRIPE_WEBHOOK_SECRET` to the backend host secret manager.
5. Set `PAYMENT_SUCCESS_URL` and `PAYMENT_CANCEL_URL` to frontend-hosted `/checkout/success` and `/checkout/cancel` URLs.
6. Confirm `PAYMENTS_ENABLED=true` for production.

No Stripe secret belongs in the frontend environment template.

## Smoke Checks

After deployment, run these checks against the hosted URLs:

| Area | Check | Pass Criteria |
| --- | --- | --- |
| Backend liveness | `GET /api/health` | `200` with `{ "status": "ok" }`. |
| Backend readiness | `GET /api/ready` | `200` with `ready: true` and MongoDB `connected`. |
| Request correlation | Any API response headers | `X-Request-Id` is present. |
| Auth | Register/login flow | Token issued; `/api/auth/me` succeeds. |
| Product browsing | Public product list/detail | Products load without 5xx errors. |
| Cart/checkout | Authenticated add-to-cart and checkout start | Cart persists; checkout returns hosted payment data or documented payment-state response. |
| Payment return | `/checkout/success` and `/checkout/cancel` | Pages render and refetch authoritative order state. |
| Admin-critical path | Admin order list/detail/fulfillment | Admin APIs respond for an admin user. |

## Rollback Criteria

Start rollback when any of these happen after deploy:

- Backend service is down or repeatedly restarting.
- `/api/ready` returns `503` for a sustained period after the expected startup window.
- 5xx responses spike on auth, product, cart, checkout, webhook, or admin order paths.
- Stripe checkout or webhook reconciliation fails for real orders.
- Checkout cannot create orders or redirects users to broken payment-return pages.
- Severe performance degradation makes core flows unusable.

Rollback verification must re-run the same health, readiness, auth, product, cart/checkout, payment-return, and admin-critical smoke checks against the restored version.

Incident command, communication cadence, scenario triage, and host-specific rollback command slots are documented in [INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md).

## Monitoring Windows

Use three post-deploy windows:

Operational signal routing, alert ownership, the minimal dashboard checklist, and access responsibilities are documented in [OPERATIONS.md](OPERATIONS.md).

| Window | What to Watch | Expected Result |
| --- | --- | --- |
| First 5 minutes | Process startup, `/api/health`, `/api/ready`, startup logs, MongoDB connection logs | Service is live and ready. |
| First 15 minutes | API 4xx/5xx rate, request completion logs, checkout-start errors, Stripe webhook errors | No new sustained error pattern. |
| First 60 minutes | Payment completion, admin fulfillment, product/cart/order flows, support reports | Core flows remain stable. |

Structured backend logs are JSON records with `timestamp`, `level`, `event`, and safe metadata. Use `requestId` from client-facing error envelopes or response headers to locate related backend logs.
