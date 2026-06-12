# Phase 05: Production Payments - Specification

**Created:** 2026-06-12
**Ambiguity score:** 0.08 (gate: <= 0.20)
**Requirements:** 10 locked

## Goal

Authenticated checkout changes from demo order placement into a Stripe Checkout-backed payment flow where orders persist payment state separately from fulfillment state and payment success, failure, cancellation, and refund updates are reconciled through verified webhooks.

## Background

Phase 05 starts after Phase 04 completed transactional, idempotent, stock-aware authenticated checkout. The backend currently creates an order from the authenticated user's cart through `POST /api/orders`, calculates server-side totals, decrements stock, consumes coupon usage, clears the cart, and sets fulfillment `status` to `processing`. The frontend `Checkout.jsx` still renders demo-payment copy and places an order directly with no payment provider. `Backend/models/Order.js` has fulfillment and tracking fields but no independent payment status, provider session id, provider payment-intent id, payment failure reason, paid timestamp, or refund fields.

The backend Express app mounts JSON parsers for `/api/orders`; no raw-body webhook endpoint exists today. Stripe webhook signature verification requires the raw request body, and provider webhooks are the authoritative source for asynchronous payment success, failure, expiry, and refund updates. Phase 05 therefore replaces the demo checkout outcome with a provider-backed payment session and webhook-backed order payment state while preserving the authenticated checkout policy, server-side totals, and Phase 04 idempotency/inventory guarantees.

## Requirements

1. **Stripe Checkout session start**: Authenticated checkout must start a real Stripe Checkout payment session instead of completing a demo order immediately.
   - Current: `Checkout.jsx` states that no real payment is processed, and `POST /api/orders` creates a `processing` order without a provider payment.
   - Target: `POST /api/orders` remains the customer checkout-start endpoint, creates or reuses one pending-payment order for the authenticated cart attempt, creates a Stripe Checkout session for the server-calculated total, and returns the order plus payment data containing provider name and redirect URL.
   - Acceptance: Backend tests mock the payment provider and prove a successful checkout-start response includes an order, `payment.provider = "stripe"`, and a checkout URL; frontend tests prove the checkout screen no longer contains demo-payment copy and redirects or presents the provider payment URL.

2. **Independent payment state model**: Orders must persist payment state independently from fulfillment status.
   - Current: `Order.status` mixes order fulfillment state with the demo checkout outcome and defaults to `processing`.
   - Target: Orders store payment fields at minimum: `paymentStatus`, `paymentProvider`, `paymentProviderSessionId`, `paymentProviderIntentId`, `paidAt`, `paymentFailureReason`, `refundedAt`, and `refundAmount`. Supported payment statuses are `requires_payment`, `payment_pending`, `paid`, `payment_failed`, `payment_canceled`, `refunded`, `partially_refunded`, and `not_required`.
   - Acceptance: Model tests or backend route tests prove new payment fields persist, old/legacy orders without provider fields read as `paymentStatus: "not_required"` or an equivalent documented default, and fulfillment `status` can be asserted independently from `paymentStatus`.

3. **No fulfillment processing before payment success**: Unpaid provider-backed orders must not be treated as fulfillment-ready.
   - Current: Order creation sets fulfillment `status` to `processing` before any payment exists.
   - Target: Provider-backed orders start as not fulfillment-ready, with payment status `payment_pending` or `requires_payment`; only a verified successful payment event can transition payment status to `paid` and fulfillment status to `processing`.
   - Acceptance: Backend tests prove checkout-start does not create a `processing` paid order, and a verified payment-success webhook changes the same order to `paymentStatus: "paid"` with fulfillment status `processing`.

4. **Server-side amount and metadata authority**: The payment provider request must be built from server-side cart/order data, not client-supplied line items or totals.
   - Current: The backend already calculates order totals from the authenticated cart, but there is no provider request.
   - Target: Stripe Checkout session creation uses server-calculated order total, stable local order id/order number metadata, user id metadata, and configured success/cancel URLs. The client cannot choose amount, currency, order id, payment status, or provider metadata.
   - Acceptance: Backend tests prove client-supplied totals or line items are ignored or rejected, the mocked Stripe session receives server-calculated amount data, and provider metadata includes enough local identifiers to reconcile a webhook to exactly one order.

5. **Checkout-start atomicity and compensation**: Payment session creation must not leave partially visible checkout side effects when provider session creation fails.
   - Current: Phase 04 checkout writes are transactional across order, cart, coupon, and stock, but there is no external payment session call in that write set.
   - Target: If Stripe session creation fails, checkout-start returns an error without leaving a usable unpaid order, cleared cart, consumed coupon, or decremented inventory unless all such effects are explicitly compensated before the response.
   - Acceptance: Backend tests mock provider-session failure and verify order count, cart contents, coupon usage, and product stock remain unchanged or are fully restored before the API response.

6. **Webhook verification and idempotency**: Payment webhook handling must verify Stripe signatures and process each provider event id at most once.
   - Current: No payment webhook route or processed-event record exists; mounted JSON parsers would break Stripe raw-body signature verification if reused for webhooks.
   - Target: A webhook endpoint accepts raw request bodies before JSON parsing, verifies the Stripe signature with `STRIPE_WEBHOOK_SECRET`, stores processed provider event ids, treats duplicate events as successful no-ops, and returns retryable failures when reconciliation cannot complete.
   - Acceptance: Backend webhook tests prove valid signed fixtures are accepted, invalid signatures return `400`, duplicate event ids do not double-transition orders or double-restore inventory, and processing failures are not marked processed.

7. **Payment success, failure, and cancellation paths**: Successful, failed, and canceled/expired provider payment events must be represented on the order.
   - Current: Orders do not track provider payment success, failure, cancellation, or expiry.
   - Target: Verified Stripe events for successful payment mark the order paid; failed payment events mark it `payment_failed` and record a failure reason when available; expired/canceled Checkout sessions mark it `payment_canceled`.
   - Acceptance: Backend tests cover `checkout.session.completed` or `payment_intent.succeeded`, `payment_intent.payment_failed`, and `checkout.session.expired` and verify the exact order payment fields after each event.

8. **Inventory restoration for unpaid terminal payment states**: Inventory decremented during checkout-start must be restored exactly once when payment reaches a terminal unpaid state.
   - Current: Phase 04 restores stock on user order cancellation for checkout-created orders marked `inventoryDecremented`, but no provider payment terminal states exist.
   - Target: When a provider-backed order with decremented inventory reaches `payment_failed` or `payment_canceled`, stock is restored once and the order is no longer fulfillment-ready. Replayed or duplicate terminal events must not restore stock a second time. Cart restoration is not required in this phase.
   - Acceptance: Backend tests prove failed and expired payment events restore stock to the pre-checkout level once, clear or update the inventory marker consistently, and duplicate webhook delivery leaves stock unchanged after the first restoration.

9. **Refund state representation**: Refund events from the provider must be reflected on orders without adding admin refund initiation.
   - Current: Orders have no refund fields and no payment provider event handling.
   - Target: Provider-origin refund events update the order to `refunded` or `partially_refunded`, persist refund amount and refund timestamp, and do not introduce a PLASHOE admin refund API or UI in Phase 05.
   - Acceptance: Backend tests mock full and partial refund webhook payloads and verify `paymentStatus`, `refundAmount`, and `refundedAt`; no new admin refund endpoint is documented as part of Phase 05.

10. **Payment documentation and deterministic tests**: Payment behavior, configuration, and verification must be documented and covered without depending on live Stripe network calls.
    - Current: `docs/API.md`, `docs/CONFIGURATION.md`, and `docs/TESTING.md` describe current checkout but not Stripe payment setup, webhook secrets, return URLs, or payment test fixtures.
    - Target: Documentation describes checkout-start response shape, payment statuses, webhook endpoint behavior, required Stripe environment variables, local webhook testing notes, and deterministic mocked test commands. Automated tests mock the Stripe SDK and use signed webhook fixtures or helper-generated signatures; Stripe CLI is optional manual documentation only.
    - Acceptance: Docs list required payment config and test commands, backend tests run without Stripe network access or real credentials, and frontend tests cover checkout payment-start success plus failure/cancel customer states.

## Boundaries

**In scope:**
- Authenticated-only Stripe Checkout start from the current `POST /api/orders` checkout-start flow.
- Independent order payment-state fields and legacy/default handling for orders without provider data.
- Server-side provider session creation using authenticated cart/order totals.
- Webhook route with raw-body Stripe signature verification and event-id idempotency.
- Payment success, failure, cancellation/expiry, full refund, and partial refund state reconciliation.
- One-time inventory restoration for provider-backed orders that terminally fail or expire before payment.
- Frontend checkout changes that remove demo copy, start provider checkout, and show payment success/cancel/failure states.
- API, configuration, and testing documentation for the payment contract.
- Backend and frontend automated tests using mocks/fixtures, not live Stripe calls.

**Out of scope:**
- Guest checkout or guest order creation - current product policy is authenticated checkout only.
- Stripe Payment Element or direct card collection inside PLASHOE - hosted Stripe Checkout keeps card handling out of the app.
- Multiple payment providers or a broad provider abstraction - Phase 05 chooses Stripe for the production path.
- Subscription billing, trials, customer portal, invoices, or usage-based billing - PLASHOE sells one-time ecommerce orders.
- Multi-currency, tax calculation, paid shipping rates, and wallet-specific UX - current totals use simple USD-style pricing and free shipping.
- Admin refund initiation API/UI - Phase 06 owns admin operations; Phase 05 only reflects provider-origin refund events.
- Cart restoration after payment failure/expiry - Phase 05 must restore inventory and mark payment state, but rebuilding the user's cart is deferred.
- Fulfillment/admin views and tracking operations - Phase 06 owns operator fulfillment.
- CI/CD secret provisioning and deployment pipelines - Phase 08 owns deployment readiness, although docs must state required variables.

## Constraints

- Preserve the authenticated checkout policy: `/checkout` and customer checkout-start remain authenticated-only.
- Preserve server-side totals: clients do not send order line items, totals, currency, payment status, provider ids, or fulfillment status.
- Use Stripe Checkout hosted sessions for the Phase 05 production payment path.
- Use USD-style one-time card payments unless later phases explicitly expand currency, tax, shipping, or wallet behavior.
- Use webhooks as the authoritative source for payment success, failure, expiry, and refund reconciliation.
- Mount the Stripe webhook route with raw-body parsing before any JSON parser that would mutate the request body.
- Verify Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET`; never trust unsigned webhook JSON.
- Treat webhook event processing as idempotent using provider event ids.
- Keep automated tests deterministic by mocking the Stripe SDK and generating/verifying local webhook signatures without live network calls.
- Do not commit Stripe secrets. Runtime configuration must validate required payment variables when payments are enabled.
- Preserve the existing API error envelope style: `{ success: false, message, errors? }`.
- Preserve Phase 04 conflict semantics where checkout stock, coupon, and idempotency conflicts use machine-readable `409` responses.

## Acceptance Criteria

- [ ] Checkout no longer displays demo-payment copy or auto-confirms an order without a provider-backed payment session.
- [ ] `POST /api/orders` returns a provider-backed payment-start response with order data and a Stripe Checkout redirect URL.
- [ ] Provider-backed unpaid orders are not fulfillment `processing` until a verified successful payment event is processed.
- [ ] Orders persist independent payment fields and the documented payment status enum.
- [ ] Checkout-start uses server-side cart/order totals and ignores or rejects client-supplied totals, line items, provider ids, and payment status.
- [ ] Provider session creation failure leaves order, cart, coupon usage, and stock unchanged or fully compensated.
- [ ] Stripe webhook route verifies raw-body signatures and rejects invalid signatures with `400`.
- [ ] Duplicate webhook event ids are accepted as no-ops without double state transitions or double stock restoration.
- [ ] Successful payment events mark the matching order `paid`, set `paidAt`, persist provider ids, and move fulfillment to `processing`.
- [ ] Payment failed and Checkout expired/canceled events mark the matching order terminally unpaid and restore inventory exactly once.
- [ ] Full and partial refund events update order refund fields and `paymentStatus` without adding admin refund initiation.
- [ ] Backend payment tests run without live Stripe credentials or network access.
- [ ] Frontend tests cover payment-start success, payment-start failure, and post-return success/cancel/failure UI behavior.
- [ ] `docs/API.md`, `docs/CONFIGURATION.md`, and `docs/TESTING.md` document the payment API contract, config, webhook behavior, and test commands.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
| --- | ---: | ---: | --- | --- |
| Goal Clarity | 0.96 | 0.75 | met | Stripe Checkout-backed authenticated payments with webhook-backed state are locked. |
| Boundary Clarity | 0.93 | 0.70 | met | Guest checkout, Payment Element, admin refunds, cart restoration, multi-currency, taxes, shipping, and CI/CD are excluded. |
| Constraint Clarity | 0.86 | 0.65 | met | Auth-only checkout, server totals, Stripe Checkout, raw-body verified webhooks, idempotent events, and mocked tests are locked. |
| Acceptance Criteria | 0.90 | 0.70 | met | Payment-start, state model, webhook, refund, inventory, frontend, and docs checks are pass/fail. |
| **Ambiguity** | 0.08 | <=0.20 | met | Requirements are clear enough for discuss-phase to focus on implementation decisions. |

Status: met = dimension meets minimum; below minimum = planner treats as assumption.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
| --- | --- | --- | --- |
| 1 | Researcher | What exists today related to payments? | Checkout creates orders directly with demo copy, no payment fields, no provider dependency, and no webhook route. |
| 1 | Researcher | Which provider and payment surface should Phase 05 use? | Use Stripe Checkout hosted sessions for one-time authenticated ecommerce payments. |
| 2 | Simplifier | What is the minimum viable production payment scope? | Start payment sessions, persist payment state, reconcile webhooks, cover success/failure/cancel/refund, and update checkout UI/docs/tests. |
| 2 | Simplifier | Should tests call Stripe or use mocks? | Use mocked Stripe SDK calls and signed webhook fixtures; Stripe CLI remains optional manual documentation. |
| 3 | Boundary Keeper | What stays out of this phase? | Guest checkout, Payment Element, admin refund initiation, subscriptions, multi-currency, taxes, shipping-rate work, cart restoration, admin fulfillment, and CI/CD. |
| 3 | Boundary Keeper | Should `POST /api/orders` remain checkout-start? | Keep it as checkout-start and return order plus payment redirect data; add a separate raw-body webhook endpoint. |
| 4 | Failure Analyst | What breaks the payment requirements? | Demo auto-confirmation, unpaid orders marked processing, unsigned webhooks, duplicate webhook side effects, provider-session failure leaving partial checkout state, and failed payments not restoring inventory. |
| 4 | Failure Analyst | What is authoritative for payment success? | Verified provider webhooks are authoritative; redirects only drive customer UI/refetch behavior. |
| 5 | Seed Closer | How should legacy orders and refunds be handled? | Legacy/demo orders default to `not_required`; provider-origin full/partial refunds update order state, with no PLASHOE admin refund initiation. |
| 5 | Seed Closer | Which customer experience is required? | Remove demo copy, start hosted payment, and show success/cancel/failure states plus payment status in account/order views. |

---

*Phase: 05-production-payments*
*Spec created: 2026-06-12*
*Next step: $gsd-discuss-phase 5 - implementation decisions (how to build the locked payment contract above)*
