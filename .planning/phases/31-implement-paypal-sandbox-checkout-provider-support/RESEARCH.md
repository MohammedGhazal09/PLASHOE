# Phase 31 Research

## PayPal REST Basics

- PayPal REST APIs use OAuth 2.0 access tokens. A backend exchanges `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` for an access token at `/v1/oauth2/token`.
- PayPal documents the sandbox base as `https://api-m.sandbox.paypal.com`; live is `https://api-m.paypal.com`.
- Client secret is backend-only.

Source: https://developer.paypal.com/api/rest/

## Orders Flow

- The standard order flow is: create order, redirect buyer to approval URL, buyer approves, buyer returns to merchant return URL, merchant captures the order.
- PayPal returns HATEOAS links; the `rel=approve` URL is the redirect target for buyer approval.
- For this phase, use `intent: "CAPTURE"` and call the Orders capture endpoint after return.

Sources:
- https://developer.paypal.com/api/rest/integration/orders-api/
- https://developer.paypal.com/docs/api/orders/v2/

## Webhooks

- PayPal webhook listener URLs must be public HTTPS endpoints.
- A webhook endpoint has a Webhook ID; that ID is required for verification.
- PayPal supports posting event/header data back to the verify-signature API.
- Event names relevant to this phase include `CHECKOUT.ORDER.APPROVED`, `CHECKOUT.PAYMENT-APPROVAL.REVERSED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DECLINED`, `PAYMENT.CAPTURE.DENIED`, and `PAYMENT.CAPTURE.REFUNDED`.

Sources:
- https://developer.paypal.com/api/rest/webhooks/rest/
- https://developer.paypal.com/docs/api/webhooks/v1/
- https://developer.paypal.com/api/rest/webhooks/event-names/

## Codebase Fit

- No new dependency is necessary. Node 18+ has global `fetch`, and this backend already runs modern ESM.
- `paymentProvider.js` is the right API boundary because it already isolates Stripe and has test overrides.
- `paymentService.js` should stay the provider selector/orchestrator.
- Existing webhook controller is Stripe-shaped; adding PayPal-specific functions in the same file is acceptable for smallest diff, but provider constants and log names must stay separate.

## Risks

- PayPal webhook simulator events may not verify through the postback API. Tests should mock the provider verification seam.
- Return capture requires an authenticated user session on `/checkout/success`. That matches the current checkout guard; if the browser loses auth state, order status page should show the existing unavailable/error state.
- PayPal capture and webhook completion can race. Payment state transitions must be idempotent for already-paid orders.
