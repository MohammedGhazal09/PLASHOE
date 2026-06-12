---
status: incomplete
phase: 05-production-payments
source: [05-01-PLAN.md]
created: 2026-06-12T19:22:00Z
updated: 2026-06-12T19:22:00Z
---

# Phase 05 User Setup: Stripe Payments

## Required Backend Environment

| Variable | Value Source |
| --- | --- |
| `PAYMENTS_ENABLED` | Set to `true` for production payment processing. |
| `STRIPE_SECRET_KEY` | Stripe Dashboard -> Developers -> API keys. |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard -> Developers -> Webhooks -> endpoint signing secret. |
| `PAYMENT_SUCCESS_URL` | Frontend `/checkout/success` URL. |
| `PAYMENT_CANCEL_URL` | Frontend `/checkout/cancel` URL. |

Use safe placeholders in docs and examples only. Do not commit real values.

## Stripe Dashboard

1. Create a webhook endpoint pointing to the deployed backend path `/api/webhooks/stripe`.
2. Subscribe to checkout/payment/refund events used by Phase 05:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `refund.updated`
3. Store the endpoint signing secret in backend environment configuration.

## Local Verification

Automated tests use mocked provider seams and locally signed webhook payloads. Stripe CLI forwarding is optional manual exploration, not an automated release gate.
