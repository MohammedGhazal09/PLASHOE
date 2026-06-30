# Phase 31 Summary

## Status

Complete locally on 2026-06-30.

## Implemented

- Added backend payment provider mode selection for `stripe`, `paypal`, and `mock`.
- Added PayPal sandbox config support for `PAYMENT_PROVIDER`, `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYMENT_SUCCESS_URL`, and `PAYMENT_CANCEL_URL`.
- Added native `fetch` PayPal REST helpers for OAuth token, Orders v2 create, Orders v2 capture, and webhook signature verification.
- Added PayPal checkout creation through the existing checkout/payment service boundary.
- Added protected `POST /api/orders/:id/payment/paypal/capture`.
- Added public raw-body `POST /api/webhooks/paypal` with provider-scoped `PaymentEvent` idempotency.
- Updated checkout copy and return page behavior for PayPal sandbox capture success/failure states.
- Updated docs and env templates for backend-only PayPal variables.
- Added focused backend/frontend tests and visual QA artifacts.

## Notes

- No PayPal credentials were committed.
- PayPal is selected only when `PAYMENT_PROVIDER=paypal`, payments are enabled, and all required PayPal vars are present.
- Mock mode remains the fallback when payments are disabled or selected-provider config is incomplete.
- Stripe behavior is preserved.

## Remaining Hosted Work

PayPal will not appear in production until the backend is redeployed with the PayPal sandbox env vars and the PayPal dashboard webhook points to `/api/webhooks/paypal`.
