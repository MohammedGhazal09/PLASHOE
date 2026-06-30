# Phase 30: Hybrid Sandbox Payment Demo Mode

## Outcome
Checkout demonstrates payment-system handling without requiring real payment credentials. Stripe test mode remains the production-like path when enabled; a mock gateway is used when payments are explicitly disabled.

## Requirements
- Keep existing Stripe hosted checkout behavior when `PAYMENTS_ENABLED` is not `false`.
- When `PAYMENTS_ENABLED=false`, create a provider-backed mock payment hold instead of failing checkout.
- Mock gateway supports approve, decline, and cancel outcomes.
- Mock outcomes reuse existing order payment statuses: `paid`, `payment_failed`, and `payment_canceled`.
- Mock gateway clearly states that no real money is processed and no card data is collected.
- No fake card collection or credential handling.

## Non-goals
- No real payment capture.
- No custom card form.
- No bypass of inventory, coupon, shipping, idempotency, or hold rules.

## Acceptance
- Checkout with Stripe config returns a Stripe checkout URL as before.
- Checkout with `PAYMENTS_ENABLED=false` returns `/checkout/mock?orderId=...`.
- Approve marks the order paid.
- Decline marks the order payment failed and releases held inventory.
- Cancel marks the order payment canceled and releases held inventory.
- Frontend exposes a protected mock payment page and routes back to the existing payment status page.
