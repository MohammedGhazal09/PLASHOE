# Phase 31 Context

**Gathered:** 2026-06-30
**Status:** Ready for planning
**Source:** Auto-approved recommendations from Phase 31 mission file

<domain>
## Phase Boundary

Implement PayPal sandbox as the visible hosted payment provider for PLASHOE checkout. Keep existing Stripe support and mock fallback intact.
</domain>

<spec_lock>
## Locked Requirements

- `SPEC.md` is the locked source for what Phase 31 must deliver.
- Discussion only decides how to implement the PayPal provider path.
</spec_lock>

<decisions>
## Implementation Decisions

### Provider Mode
- Add `PAYMENT_PROVIDER=paypal` as an explicit selector.
- Recommended and approved: PayPal wins only when `PAYMENTS_ENABLED=true`, `PAYMENT_PROVIDER=paypal`, and all PayPal vars are complete.
- Preserve existing Stripe path when `PAYMENT_PROVIDER` is unset or `stripe` and Stripe vars are complete.
- Fall back to `mock` when payments are disabled or the selected provider config is incomplete.

### PayPal Checkout Flow
- Use PayPal Orders v2 with `intent: "CAPTURE"`.
- Use backend-only native `fetch`; do not add an SDK dependency for this small integration.
- Create one aggregate purchase unit for the server-owned order total, matching the existing Stripe aggregate item behavior.
- Store PayPal order id in `paymentProviderSessionId`.
- Store PayPal capture id in `paymentProviderIntentId` after capture/webhook.

### Return Capture
- Add a protected endpoint for the authenticated order owner to capture PayPal payment after `/checkout/success`.
- Frontend return page should call capture only when query params identify a PayPal return and the order is still pending.
- Capture should be idempotent for already-paid owned orders.

### Webhooks
- Add `POST /api/webhooks/paypal`.
- Verify webhook deliveries using PayPal's `verify-webhook-signature` API and `PAYPAL_WEBHOOK_ID`.
- Use provider `paypal` in `PaymentEvent` duplicate tracking.
- Handle the minimal event set: `CHECKOUT.ORDER.APPROVED`, `CHECKOUT.PAYMENT-APPROVAL.REVERSED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DECLINED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`.

### UI
- Checkout copy should say secure hosted PayPal sandbox when the returned provider is PayPal.
- Return page should show "Confirming PayPal sandbox payment..." while capture is in progress.
- Do not add a PayPal button in this phase.

### Secrets
- Do not commit PayPal secret values.
- Docs list env var names only.
- Keep local `.env` ignored.
</decisions>

<canonical_refs>
## Canonical References

Downstream work must read these before implementation:

- `.planning/phases/31-implement-paypal-sandbox-checkout-provider-support/SPEC.md` - locked Phase 31 requirements.
- `Backend/services/paymentService.js` - checkout orchestration and provider selection.
- `Backend/services/paymentProvider.js` - provider API boundary.
- `Backend/controllers/webhookController.js` - Stripe webhook reconciliation pattern to reuse carefully.
- `Backend/config/env.js` - runtime payment mode validation.
- `Backend/routes/orderRoutes.js` - authenticated order payment endpoints.
- `Backend/routes/webhookRoutes.js` - raw webhook route mount.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` - checkout payment copy and redirect.
- `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.jsx` - success/cancel return handling.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` - frontend order API wrapper.
- `docs/CONFIGURATION.md`, `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md` - payment setup and verification docs.
</canonical_refs>

<code_context>
## Current Code Context

- Existing checkout already reserves inventory, validates shipping, applies coupons, and creates provider-backed pending orders.
- `paymentService.startCheckoutPayment` is the single best place to choose `stripe`, `paypal`, or `mock`.
- `paymentProvider.js` already has override seams used by tests; PayPal helpers should preserve that test seam.
- `PaymentEvent` already supports arbitrary provider strings through its `provider` field.
- Frontend currently redirects to whatever `payment.checkoutUrl` the backend returns.
- Existing return page refetches the order, so PayPal capture can be layered into that page without a new route.
</code_context>

<deferred>
## Deferred Ideas

- PayPal JS SDK buttons.
- Live PayPal production mode.
- PayPal saved payment methods.
- Admin refund initiation.
- Stripe removal or full multi-provider abstraction.
</deferred>

---

*Phase: 31-implement-paypal-sandbox-checkout-provider-support*
*Context gathered: 2026-06-30*
