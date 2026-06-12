---
phase: 05-production-payments
status: complete
researched: 2026-06-12
sources: official-stripe-docs-and-codebase
skills_used: [stripe-integration-expert, stripe-webhooks, api-and-interface-design, javascript-testing-patterns]
external_skill_installs: none
---

# Phase 05 Research: Production Payments

## Research Scope

Phase 05 replaces the current demo checkout completion with hosted Stripe Checkout, independent order payment state, verified webhook reconciliation, frontend return-state pages, and deterministic tests. The research focused on official Stripe Checkout and webhook behavior, idempotency-key usage, metadata limits, event coverage, and how those constraints fit the current Express, Mongoose, Vitest/Supertest, CRA/Jest, and React Router codebase.

No external skills were installed. The approved Phase 05 context says local skills already cover Stripe Checkout, webhook verification, API contracts, and deterministic JavaScript tests unless a concrete missing capability appears.

## Sources

- Stripe Checkout Sessions API: https://docs.stripe.com/api/checkout/sessions
- Create Checkout Session API: https://docs.stripe.com/api/checkout/sessions/create
- Checkout Session object: https://docs.stripe.com/api/checkout/sessions/object
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe webhook signature troubleshooting: https://docs.stripe.com/webhooks/signature
- Stripe event types: https://docs.stripe.com/api/events/types
- Stripe idempotent requests: https://docs.stripe.com/api/idempotent_requests
- Stripe metadata: https://docs.stripe.com/api/metadata
- Stripe payment status updates: https://docs.stripe.com/payments/payment-intents/verifying-status

## Key Findings

### R-01: Hosted Checkout keeps card data out of PLASHOE

Stripe Checkout Sessions are the right fit for the locked Phase 05 path because they represent a hosted customer payment session for one-time purchases. The backend creates the session and returns the redirect URL; the frontend should not collect card details or receive Stripe secret keys.

Recommendation: add the official `stripe` Node SDK only to the backend, create one aggregate `line_item` from the server-calculated order total, and return a `payment.checkoutUrl` from `POST /api/orders`.

### R-02: Checkout finalization must be webhook-backed

Stripe documents that fulfillment should not rely on the customer returning to the browser after payment, because the customer can leave before client-side code runs. The reliable path is to process payment events asynchronously through webhooks.

Recommendation: checkout-start creates or reuses a provider-backed pending order and redirects the browser, but only verified webhook processing may mark an order `paid` and fulfillment `processing`.

### R-03: Stripe webhook signature verification requires the raw body

Stripe's official Node guidance verifies the event with `stripe.webhooks.constructEvent(requestBody, signature, endpointSecret)`. Express middleware ordering matters: if JSON parsing runs before the webhook route, signature verification can fail because the payload has been mutated.

Recommendation: mount `POST /api/webhooks/stripe` with `express.raw({ type: "application/json" })` before JSON parsers for other API routes. Do not protect this route with JWT auth; verify `Stripe-Signature` instead.

### R-04: Webhook processing must be durable and idempotent

Stripe retries failed webhook deliveries. Duplicate event delivery is expected and must not double-transition order state or restore stock twice.

Recommendation: add `Backend/models/PaymentEvent.js` with a unique provider/event id and only mark events processed after local reconciliation succeeds. Duplicate event ids should return success as no-ops.

### R-05: Required event coverage is narrow and explicit

The approved context selected `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, and `refund.updated`. Stripe's event reference confirms those event names and refund/payment-intent event surfaces.

Recommendation: implement first-class handlers for the selected events only. Add an event resolver that can retrieve related Checkout Session or PaymentIntent objects when metadata is insufficient, but do not broaden Phase 05 into disputes, subscriptions, invoices, or wallet-specific events.

### R-06: Stripe idempotency keys apply to provider creation, not local retries alone

Stripe idempotent requests are intended for safe retry of POST operations and should use unique keys without sensitive data. The API stores results for an idempotency key and rejects parameter drift.

Recommendation: derive the Stripe idempotency key from local non-sensitive identifiers such as user id, local idempotency key, and local order id. Keep the existing local `Idempotency-Key` header contract from Phase 04 and use it to find or return the same pending payment session.

### R-07: Metadata is useful but bounded

Stripe metadata supports structured key-value strings with key and value length limits. It is not visible to customers by default but still should avoid unnecessary internal data exposure.

Recommendation: include only local order id, order number, user id, and local idempotency key in Checkout Session and PaymentIntent metadata. Avoid cart fingerprints and personal data unless debugging proves they are needed.

### R-08: Current backend shape needs a payment orchestration layer

`Backend/services/checkoutService.js` currently completes all checkout effects in one transaction and creates orders with fulfillment `status: "processing"`. Phase 05 needs a local checkout transaction first, provider session creation second, then an order update or compensation path if provider creation fails.

Recommendation: keep `orderController.js` thin. Add `paymentProvider.js` for Stripe SDK calls, `paymentService.js` for checkout-start orchestration, and `paymentState.js` for payment transitions and inventory restoration. Modify the existing checkout service to support provider-backed pending order creation and compensation without calling Stripe inside a MongoDB transaction.

### R-09: Frontend should redirect, then refetch authoritative order state

`Checkout.jsx` currently clears cart locally, shows demo success, and navigates to account. Phase 05 needs redirect to hosted Checkout and lightweight protected return pages for `/checkout/success` and `/checkout/cancel`.

Recommendation: after a successful checkout-start response, set `window.location` to `payment.checkoutUrl`. Return pages should read query params only to locate the order/session and then refetch `ordersApi.getById`; they must not trust redirect query params as proof of payment.

### R-10: Tests can stay deterministic without live Stripe

Backend tests already run with Vitest, Supertest, and MongoMemoryReplSet. Frontend tests use CRA/Jest and Testing Library. Stripe's signature helpers can generate/verify locally signed payloads with fake test secrets without live network access.

Recommendation: add a fake provider seam for checkout session creation and Stripe object retrieval, generate signed webhook payloads locally, exercise the real Express webhook route, and update frontend tests with API wrapper/window-location mocks. Keep Stripe CLI instructions optional docs only.

## Recommended Plan Shape

1. Payment state, runtime config, Stripe SDK provider seam, and model tests.
2. Checkout-start orchestration with pending order state, Stripe session creation, retry behavior, and provider-failure compensation.
3. Raw-body webhook route, event idempotency, payment transitions, failure/expiry inventory restoration, and refund handling.
4. Frontend Checkout redirect, protected return pages, account/detail payment labels, and frontend tests.
5. API/config/testing docs, static contract checker update, and final verification gates.

## Open Risks

- Provider session creation after the local checkout transaction can still fail. The execution plan must include a compensation transaction that restores inventory, coupon usage, and cart contents or marks/removes the local order so no usable unpaid order remains.
- Stripe's npm package is not currently installed in `Backend/package.json`. Adding it affects `Backend/package-lock.json` and must be done in the backend payment foundation plan.
- The current `Backend/.env.example` is untracked local work. Execution should avoid touching it unless the user explicitly wants env-template cleanup included.
- Return pages need a reliable order locator. The backend should build success/cancel URLs with local `orderId` plus Stripe's `{CHECKOUT_SESSION_ID}` placeholder, then return pages must refetch the order before showing final state.

---

_Phase 05 research complete: 2026-06-12_
