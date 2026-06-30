# Implementation Plan

## Plan 31-01: Provider Config And Checkout Creation

1. Extend runtime config with `PAYMENT_PROVIDER`, `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_WEBHOOK_ID`.
2. Add provider-mode helpers in `paymentService` so `paypal`, `stripe`, and `mock` are selected predictably.
3. Add PayPal REST helpers in `paymentProvider.js` using native `fetch`:
   - `createPayPalOrder`
   - `capturePayPalOrder`
   - `verifyPayPalWebhookSignature`
4. Update checkout session persistence to store PayPal order id and approval URL.
5. Add backend tests for PayPal mode selection and checkout start.

## Plan 31-02: Capture And Webhook Reconciliation

1. Add protected `POST /api/orders/:id/payment/paypal/capture`.
2. Implement owner-only PayPal capture that marks paid through `transitionOrderPaymentState`.
3. Add public `POST /api/webhooks/paypal`.
4. Verify PayPal webhook headers before claiming events.
5. Process PayPal completed, failed/reversed, and refunded events idempotently.
6. Add backend tests for capture and webhook paths.

## Plan 31-03: Frontend, Docs, Verification, Reviews

1. Add `ordersApi.capturePayPalPayment`.
2. Update `CheckoutReturn` to capture pending PayPal returns using `token` and `orderId`.
3. Update checkout/return copy to name PayPal sandbox and hosted payment behavior.
4. Update API/config/deployment/testing docs with PayPal env vars and flow.
5. Run focused backend/frontend tests and production build.
6. Run browser visual QA with screenshots and a coverage ledger.
7. Write `SUMMARY.md`, `VERIFICATION.md`, `UI-REVIEW.md`, and `REVIEW.md`.

## Cross-Cutting Constraints

- Do not expose PayPal secrets to frontend code or logs.
- Preserve Stripe behavior and mock fallback.
- Do not trust frontend totals.
- Do not use subagents.
- Do not add dependencies unless native `fetch` is insufficient.
