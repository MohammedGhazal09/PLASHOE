# Phase 30 Context

## Existing System

- Checkout already creates provider-backed orders, reserves inventory, handles idempotency, and updates payment states through Stripe webhooks.
- Payment state transitions are centralized in `paymentState`.
- Frontend checkout already redirects to a provider checkout URL and refetches order status on return.

## Decision

Keep Stripe as the configured provider path. Use a mock sandbox gateway only when `PAYMENTS_ENABLED=false` or full Stripe config is missing. Mock approve, decline, and cancel outcomes use the same order payment-state transition service as Stripe-origin outcomes.

## Boundary

The mock gateway never collects card data, stores fake card numbers, or implies production payment readiness.
