# Phase 05: production-payments - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 05 replaces the current demo checkout outcome with authenticated, Stripe Checkout-backed payment start, independent order payment state, verified webhook reconciliation, frontend payment return states, and deterministic payment tests.

The phase builds on Phase 04's transactional checkout, idempotency, inventory decrement, coupon consistency, and cart normalization. It does not reopen guest checkout, admin fulfillment, admin refund initiation, cart restoration after payment failure, tax/shipping expansion, multi-currency support, broad provider abstraction, browser E2E, CI/CD, or deployment operations.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**10 requirements are locked.** See `05-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `05-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Authenticated-only Stripe Checkout start from the current `POST /api/orders` checkout-start flow.
- Independent order payment-state fields and legacy/default handling for orders without provider data.
- Server-side provider session creation using authenticated cart/order totals.
- Webhook route with raw-body Stripe signature verification and event-id idempotency.
- Payment success, failure, cancellation/expiry, full refund, and partial refund state reconciliation.
- One-time inventory restoration for provider-backed orders that terminally fail or expire before payment.
- Frontend checkout changes that remove demo copy, start provider checkout, and show payment success/cancel/failure states.
- API, configuration, and testing documentation for the payment contract.
- Backend and frontend automated tests using mocks/fixtures, not live Stripe calls.

**Out of scope (from SPEC.md):**
- Guest checkout or guest order creation - current product policy is authenticated checkout only.
- Stripe Payment Element or direct card collection inside PLASHOE - hosted Stripe Checkout keeps card handling out of the app.
- Multiple payment providers or a broad provider abstraction - Phase 05 chooses Stripe for the production path.
- Subscription billing, trials, customer portal, invoices, or usage-based billing - PLASHOE sells one-time ecommerce orders.
- Multi-currency, tax calculation, paid shipping rates, and wallet-specific UX - current totals use simple USD-style pricing and free shipping.
- Admin refund initiation API/UI - Phase 06 owns admin operations; Phase 05 only reflects provider-origin refund events.
- Cart restoration after payment failure/expiry - Phase 05 must restore inventory and mark payment state, but rebuilding the user's cart is deferred.
- Fulfillment/admin views and tracking operations - Phase 06 owns operator fulfillment.
- CI/CD secret provisioning and deployment pipelines - Phase 08 owns deployment readiness, although docs must state required variables.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Execution Boundaries
- **D-01:** Use installed local skills as supporting guidance: `stripe-integration-expert`, `stripe-webhooks`, `api-and-interface-design`, and `javascript-testing-patterns`.
- **D-02:** Do not install new external skills for Phase 05 unless planning discovers a concrete missing capability. The local skills cover Stripe Checkout, webhook verification, API contracts, and deterministic JavaScript tests.
- **D-03:** Do not use subagents while the repository instruction says not to use subagents. Research, planning, and execution should run inline unless the user later changes that instruction.

### Payment Service Boundary
- **D-04:** Add dedicated backend payment files instead of expanding `Backend/services/checkoutService.js` or `Backend/controllers/orderController.js` with all Stripe logic.
- **D-05:** Expected backend seams are `Backend/services/paymentProvider.js`, `Backend/services/paymentService.js`, and `Backend/controllers/webhookController.js`. The planner may adjust filenames if the same boundaries remain clear.
- **D-06:** Use a Stripe-specific service with small provider-shaped functions such as `createCheckoutSession`, `constructWebhookEvent`, and `retrievePaymentIntent`. Do not build a broad multi-provider abstraction in Phase 05.
- **D-07:** Keep `Backend/controllers/orderController.js` as the HTTP mapping layer for checkout-start and delegate payment orchestration to services.

### Checkout-Start Sequencing and Retry Behavior
- **D-08:** Sequence checkout-start as: local checkout/order transaction first, Stripe Checkout session creation second, then order update with provider session data.
- **D-09:** Do not call Stripe inside a MongoDB transaction. Stripe is external and cannot participate in the local transaction.
- **D-10:** If Stripe session creation fails after local checkout writes, compensate before returning by restoring inventory/coupon/cart/order state or otherwise leaving no usable unpaid order, cleared cart, consumed coupon, or decremented stock.
- **D-11:** Exact retry of the same checkout attempt should return the existing order plus stored pending `payment.checkoutUrl` while the Stripe session is still pending.
- **D-12:** Do not create a new Stripe session on exact retry while the stored pending session is still reusable.
- **D-13:** Use a derived Stripe idempotency key based on user id, local checkout idempotency key, and local order id. Do not send sensitive data or raw personal identifiers as the Stripe idempotency key.

### Order State Model and Cancellation Rules
- **D-14:** Provider-backed orders should use existing fulfillment `status: "pending"` and `paymentStatus: "payment_pending"` after Stripe session creation.
- **D-15:** Use `paymentStatus: "requires_payment"` only before a provider session exists or after recoverable provider setup failure.
- **D-16:** Only verified successful payment handling may move fulfillment `status` to `processing` and payment status to `paid`.
- **D-17:** Legacy/demo orders without provider fields should read as `paymentStatus: "not_required"` through schema defaults or getter-safe behavior. Do not add a production migration script in Phase 05.
- **D-18:** Block customer cancellation for orders with `paymentStatus` of `paid`, `refunded`, or `partially_refunded`.
- **D-19:** Allow customer cancellation only before payment succeeds. Refund initiation is not part of Phase 05.

### Stripe Checkout Request Shape
- **D-20:** Create Stripe Checkout Sessions using one aggregate line item for the server-calculated final order total.
- **D-21:** Do not synchronize PLASHOE coupons into Stripe coupons or encode per-item discount allocation in Phase 05.
- **D-22:** Pass `customer_email` for v1 one-time payments and store `paymentProviderCustomerId` only if Stripe naturally returns one.
- **D-23:** Include Stripe metadata sufficient for reconciliation: local order id, order number, user id, and local idempotency key.
- **D-24:** Avoid sending cart fingerprint to Stripe metadata unless implementation needs it for debugging; avoid unnecessary internal data exposure.

### Webhook Routing, Verification, and Event Processing
- **D-25:** Add unauthenticated `POST /api/webhooks/stripe` for Stripe callbacks.
- **D-26:** Mount the Stripe webhook route with `express.raw({ type: "application/json" })` before JSON parsers in `Backend/app.js`.
- **D-27:** Secure the webhook route through Stripe signature verification, not JWT auth.
- **D-28:** Add durable processed-event persistence through `Backend/models/PaymentEvent.js` with a unique provider/event id, event type, local order id when known, processed status, and timestamps.
- **D-29:** Treat duplicate webhook event ids as successful no-ops. Duplicate events must not double-transition payment state or double-restore stock.
- **D-30:** First-class handlers should cover `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, and `refund.updated`.
- **D-31:** If a webhook event lacks enough metadata to resolve a local order, retrieve the related Stripe Checkout Session or PaymentIntent through the Stripe SDK.
- **D-32:** Return a retryable server error when a webhook cannot be safely reconciled to a local order. Do not silently accept unresolved payment events as processed.
- **D-33:** Add a central payment-state transition helper for payment success, failure, cancellation, and refunds. Do not scatter transition logic across every event handler.
- **D-34:** The transition helper should restore inventory exactly once when moving a provider-backed order to `payment_failed` or `payment_canceled`.

### Frontend Payment Flow
- **D-35:** Add protected lightweight return pages for `/checkout/success` and `/checkout/cancel`.
- **D-36:** Return pages should refetch order/payment state instead of trusting redirect query parameters as authoritative.
- **D-37:** Checkout submit should call checkout-start, then redirect the browser to `payment.checkoutUrl`.
- **D-38:** Preserve current toast/error behavior for checkout-start failures, including Phase 04 `409` cart/stock/coupon conflict handling.
- **D-39:** Display payment status in both `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` order cards and `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx`.
- **D-40:** Use plain customer-facing labels such as `Payment pending`, `Paid`, `Payment failed`, `Payment canceled`, `Refunded`, and `Partially refunded`.

### Configuration and Documentation
- **D-41:** Add `PAYMENTS_ENABLED`, defaulting to enabled outside tests.
- **D-42:** When payments are enabled, backend runtime validation should require `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_SUCCESS_URL`, and `PAYMENT_CANCEL_URL`.
- **D-43:** Do not expose Stripe secret or publishable key in the CRA frontend for hosted Checkout. Add frontend route constants only if implementation needs them.
- **D-44:** Update `docs/API.md`, `docs/CONFIGURATION.md`, and `docs/TESTING.md` for checkout-start response shape, payment statuses, webhook behavior, environment variables, local webhook notes, and test commands.
- **D-45:** Update the static contract checker payment warning if Phase 05 changes its semantics from "payment missing" to a passing production payment signal.
- **D-46:** Never commit Stripe secrets, local `.env` contents, or secret-looking test values beyond safe fake placeholders.

### Testing Strategy
- **D-47:** Backend tests should keep the existing Vitest/Supertest/MongoMemoryReplSet style and mock/fake Stripe through the payment provider seam.
- **D-48:** Prefer dependency injection around the Stripe provider module for tests rather than live Stripe test mode or brittle global module mocks.
- **D-49:** Webhook signature tests should generate signed payloads locally with a test webhook secret and exercise the real Express webhook route.
- **D-50:** Backend payment tests should cover checkout-start success, exact retry with existing pending session URL, provider-session failure compensation, status transitions, duplicate webhook events, invalid signatures, unresolved webhook failures, payment failure/expiry inventory restoration, and full/partial refunds.
- **D-51:** Frontend tests should update the existing checkout submit test for Stripe redirect behavior and add tests for success, cancel, and failure return states.
- **D-52:** Do not add broad browser E2E or live Stripe CLI requirements in Phase 05 automated verification.

### the agent's Discretion
- The planner may choose exact service/helper filenames if `orderController.js` stays thin and Stripe calls are testable through a provider seam.
- The planner may choose exact payment response field nesting if it remains documented and preserves `success`, `message`, `data`, and optional `errors` conventions.
- The planner may choose exact Stripe metadata key names if they include local order id, order number, user id, and local idempotency key.
- The planner may decide whether to keep payment event tests in `Backend/test/order.test.js` or split them into focused payment/webhook test files, as long as test commands stay deterministic.
- The planner may choose return-page component filenames and route wiring if `/checkout/success` and `/checkout/cancel` are protected and refetch authoritative order state.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/05-production-payments/05-SPEC.md` - Locked Phase 05 requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase ordering, Phase 05 goal, canonical refs, and plan slices.
- `.planning/REQUIREMENTS.md` - `PAY-01` through `PAY-04` traceability.
- `.planning/STATE.md` - Current project status, prior phase completion, and known local work risks.

### Prior Phase Carry-Forward
- `.planning/phases/04-checkout-data-integrity-and-inventory/04-CONTEXT.md` - Transactional checkout, idempotency, inventory decrement/restore marker, conflict contracts, and cart normalization decisions.
- `.planning/phases/04-checkout-data-integrity-and-inventory/04-SPEC.md` - Checkout integrity requirements that Phase 05 must preserve.
- `.planning/phases/03-api-security-and-validation/03-CONTEXT.md` - Runtime config validation, error envelopes, request validation, and secret-handling decisions.
- `.planning/phases/02-automated-test-foundation/02-CONTEXT.md` - Backend Vitest/Supertest/MongoMemoryReplSet test harness and frontend CRA/Jest testing strategy.
- `.planning/phases/01-core-flow-stabilization/01-CONTEXT.md` - Authenticated checkout policy and earlier payment deferral.

### Codebase Maps and Docs
- `.planning/codebase/STACK.md` - Express, Mongoose, Vitest, Supertest, CRA/Jest, React Router, Axios, and Zustand stack context.
- `.planning/codebase/INTEGRATIONS.md` - Current absence of incoming webhooks, MongoDB transaction topology, frontend API client, and environment variables.
- `.planning/codebase/ARCHITECTURE.md` - Backend route/controller/service/model layering and frontend route/API/store/page layering.
- `.planning/codebase/CONCERNS.md` - Payment integration concern and current demo-payment blocker.
- `docs/API.md` - API contract target for checkout-start, payment states, webhook behavior, and errors.
- `docs/CONFIGURATION.md` - Runtime/env documentation target for Stripe and payment return URLs.
- `docs/TESTING.md` - Verification command and mocked Stripe/webhook test documentation target.

### Backend Source Files
- `Backend/app.js` - Middleware ordering and raw-body webhook mount target.
- `Backend/config/env.js` - Runtime payment configuration validation target.
- `Backend/middleware/security.js` - Existing JSON parser/error envelope behavior to preserve.
- `Backend/routes/orderRoutes.js` - Authenticated order route wiring to preserve.
- `Backend/controllers/orderController.js` - Checkout-start controller seam.
- `Backend/services/checkoutService.js` - Phase 04 transactional checkout foundation and compensation integration point.
- `Backend/models/Order.js` - Payment-state fields, provider ids, fulfillment status, and cancellation rule target.
- `Backend/models/Cart.js` - Cart state involved in checkout-start and compensation.
- `Backend/models/Product.js` - Inventory decrement/restore target.
- `Backend/models/Coupon.js` - Coupon usage compensation target.
- `Backend/test/setup.js` - Existing MongoMemoryReplSet test harness.
- `Backend/test/order.test.js` - Existing checkout route/service test patterns to extend or split.
- `Backend/test/helpers/factories.js` - Existing model factories to extend for payment fields/events.

### Frontend Source Files
- `Frontend/Ecommerce-main/my-app/src/App.js` - Protected checkout and new return route wiring target.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` - Demo payment removal and hosted Checkout redirect target.
- `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` - Order-card payment status display target.
- `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx` - Payment status and cancellation guard display target.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` - Checkout-start response and idempotency header API wrapper target.
- `Frontend/Ecommerce-main/my-app/src/config/config.js` - Public route/config constants if needed.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.test.jsx` - Existing checkout UI test file to update for payment redirect behavior.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.test.js` - Existing order API wrapper test target.

### Verification and Spike Assets
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Static payment warning checker to update if Phase 05 changes its expected signal.
- `.planning/spikes/001-core-flow-contract-check/results.json` - Generated checker evidence; commit only if semantic results change.
- `.planning/spikes/001-core-flow-contract-check/contract-report.md` - Generated checker report; commit only if semantic results change.

### External Official References
- `https://docs.stripe.com/api/checkout/sessions` - Stripe Checkout Session object and redirect URL behavior.
- `https://docs.stripe.com/api/checkout/sessions/create` - Checkout Session creation parameters, line items, metadata, and payment mode.
- `https://docs.stripe.com/webhooks` - Stripe webhook endpoint behavior and raw body requirement.
- `https://docs.stripe.com/webhooks/signature` - Stripe signature verification requirements.
- `https://docs.stripe.com/api/events/types` - Stripe event names used for payment success, failure, expiry, and refunds.
- `https://docs.stripe.com/api/idempotent_requests` - Stripe POST idempotency-key behavior and constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/services/checkoutService.js`: already owns transactional order/cart/coupon/stock checkout orchestration and exposes hooks used in rollback tests.
- `Backend/models/Order.js`: already has `idempotencyKey`, `cartFingerprint`, `inventoryDecremented`, fulfillment `status`, order items, totals, and order numbers.
- `Backend/app.js`: central route/middleware mount point where a raw-body webhook route must be mounted before JSON parsers.
- `Backend/config/env.js`: existing runtime fail-fast validation pattern for required backend environment variables.
- `Backend/middleware/security.js`: existing JSON body parsers, rate limits, and global error envelope behavior.
- `Backend/test/setup.js`: already uses `MongoMemoryReplSet`, which supports transaction/webhook state tests.
- `Backend/test/order.test.js`: already covers checkout success, rollback, exact retry, stale idempotency, conflict contracts, stock restoration, and cancellation.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`: current checkout submit seam, idempotency key creation, cart sync, coupon application, and demo-payment copy removal target.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`: existing order API wrapper and idempotency header propagation target.
- `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` and `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx`: existing order list/detail surfaces for payment status visibility.

### Established Patterns
- Backend code uses ES modules with explicit `.js` relative imports.
- Backend route files stay thin; controllers map requests; services own cross-model domain workflows.
- Backend error responses use `{ success: false, message, errors? }`; new payment conflicts/errors should keep that pattern.
- Cart and order routes are authenticated; the Stripe webhook route must be unauthenticated but signature-verified.
- Frontend API calls should go through resource wrappers in `Frontend/Ecommerce-main/my-app/src/api`.
- Frontend route protection is done with `ProtectedRoute` in `App.js`.
- Frontend tests stay on CRA/Jest/React Testing Library for Phase 05.
- Backend tests stay on Vitest/Supertest with mocked external services and real in-memory MongoDB.

### Integration Points
- Checkout-start connects `Checkout.jsx`, `ordersApi.create`, `orderController.createOrder`, `checkoutService`, new payment services, `Order`, `Cart`, `Coupon`, and `Product`.
- Stripe session creation connects server-calculated order totals to Stripe Checkout Session parameters and provider metadata.
- Stripe webhooks connect `Backend/app.js` raw-body route mounting, `webhookController`, payment provider signature verification, `PaymentEvent`, `Order`, and inventory restoration.
- Payment status display connects backend order JSON to account order cards and order detail pages.
- Config validation connects `Backend/config/env.js`, docs, and deterministic test setup values.
- Static contract checker updates connect Phase 05 implementation to `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.

</code_context>

<specifics>
## Specific Ideas

- User approved all Phase 05 discussion recommendations on 2026-06-12.
- Phase 05 should keep the first implementation Stripe-specific while using small provider-shaped functions to make testing clean.
- Use one aggregate Stripe Checkout line item for the final server-calculated total instead of itemized Stripe cart lines.
- Use `customer_email` for one-time payments in v1; store customer id only if returned naturally.
- Use `/api/webhooks/stripe` for Stripe callbacks and mount it with raw-body parsing before JSON parsers.
- Add `PaymentEvent` as the durable webhook idempotency model.
- Add `/checkout/success` and `/checkout/cancel` as protected lightweight frontend return pages that refetch authoritative order state.
- External official docs checked during discussion: Stripe Checkout Sessions, Checkout Session creation, webhooks, webhook signature verification, event types, and idempotent requests.

</specifics>

<deferred>
## Deferred Ideas

- Guest checkout remains out of scope because checkout is authenticated-only.
- Broad payment-provider abstraction remains out of scope because Phase 05 chooses Stripe.
- Direct card collection through Stripe Payment Element remains out of scope because hosted Checkout is the locked path.
- Admin refund initiation remains out of scope; Phase 05 only reflects provider-origin refunds.
- Cart restoration after failed or expired payment remains out of scope; Phase 05 restores inventory and marks payment state.
- Tax calculation, paid shipping rates, multi-currency, wallet-specific UX, subscriptions, customer portal, invoices, and usage-based billing remain out of scope.
- Browser E2E, live Stripe CLI verification as a required gate, CI/CD, deployment secret provisioning, and observability remain later-phase work.

</deferred>

---

*Phase: 05-production-payments*
*Context gathered: 2026-06-12*
