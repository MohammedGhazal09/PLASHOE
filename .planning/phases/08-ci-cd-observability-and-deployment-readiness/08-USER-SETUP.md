# Phase 08: User Setup Required

**Generated:** 2026-06-13
**Phase:** 08-ci-cd-observability-and-deployment-readiness
**Status:** Incomplete

Complete these items before a production release. The code, templates, CI policy, and runbook are in source control; these remaining items require access to external dashboards, hosting accounts, or secret managers.

## Environment Variables

| Status | Variable | Source | Add to |
| --- | --- | --- | --- |
| [ ] | `MONGO_URI` | MongoDB provider connection string or hosting secret manager | Backend host secret manager |
| [ ] | `JWT_SECRET` | Backend host secret manager, generated as a 32+ character random secret | Backend host secret manager |
| [ ] | `FRONTEND_URL` | Production storefront URL from static frontend host | Backend host environment |
| [ ] | `STRIPE_SECRET_KEY` | Stripe Dashboard -> Developers -> API keys -> Secret key | Backend host secret manager |
| [ ] | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard -> Developers -> Webhooks -> production endpoint -> Signing secret | Backend host secret manager |
| [ ] | `PAYMENT_SUCCESS_URL` | Production storefront checkout success URL | Backend host environment |
| [ ] | `PAYMENT_CANCEL_URL` | Production storefront checkout cancel URL | Backend host environment |
| [ ] | `REACT_APP_API_URL` | Production backend `/api` base URL | Frontend build environment |
| [ ] | `REACT_APP_MAPTILER_API_KEY` | MapTiler dashboard public browser key, domain-restricted | Frontend build environment, if map tiles are enabled |

## Account Setup

- [ ] **Confirm production hosting targets**
  - Backend: managed Node service running `Backend/server.js`.
  - Frontend: static host serving `Frontend/Ecommerce-main/my-app/build`.
  - Skip if: production hosts are already selected and accessible.

- [ ] **Confirm MongoDB production database**
  - Source: MongoDB provider dashboard or equivalent managed database.
  - Skip if: `MONGO_URI` already points to a production database with the required credentials.

- [ ] **Confirm Stripe account**
  - URL: `https://dashboard.stripe.com/register`
  - Skip if: a production Stripe account is already active for PLASHOE.

## Dashboard Configuration

- [ ] **Create the production Stripe webhook endpoint**
  - Location: Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
  - Endpoint URL: `https://[backend-domain]/api/webhooks/stripe`
  - Events to send:
    - `checkout.session.completed`
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `checkout.session.expired`
    - `charge.refunded`
    - `refund.updated`
  - After creation: copy the endpoint signing secret into `STRIPE_WEBHOOK_SECRET`.

- [ ] **Set frontend build-time variables before building**
  - Location: static frontend host environment/build settings.
  - Minimum required value: `REACT_APP_API_URL=https://[backend-domain]/api`.
  - Rebuild the frontend after changing any `REACT_APP_*` value.

- [ ] **Restrict browser-visible public keys**
  - Location: MapTiler dashboard or equivalent provider dashboard.
  - Set to: allowed production frontend domains.
  - Skip if: the production UI does not use the map feature.

## Verification

After completing setup, verify with:

```bash
# Run before deploy from repository root
node scripts/ci/check-audits.mjs

# Backend smoke checks after deploy
curl https://[backend-domain]/api/health
curl https://[backend-domain]/api/ready

# Frontend smoke check after deploy
curl https://[frontend-domain]
```

Expected results:

- Backend audit policy passes.
- `/api/health` returns `200`.
- `/api/ready` returns `200` with `ready: true` and MongoDB status `connected`.
- API responses include `X-Request-Id`.
- The storefront loads and calls the production backend URL.
- Stripe webhook delivery attempts are visible in the Stripe dashboard and do not produce sustained backend 5xx errors.

---

**Once all items complete:** Mark status as "Complete" at the top of this file.
