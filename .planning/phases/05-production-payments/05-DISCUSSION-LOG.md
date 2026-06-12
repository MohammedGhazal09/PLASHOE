# Phase 05: production-payments - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 05-production-payments
**Areas discussed:** Payment Service Boundary, Checkout-Start Sequencing, Order State Model, Stripe Checkout Request Shape, Webhook Handling, Frontend Payment Flow, Config and Docs, Testing

---

## Payment Service Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Keep inside `checkoutService.js` | Add Stripe logic into the existing checkout orchestration service. | |
| Add dedicated payment services | Add focused payment provider/service/controller seams. | yes |
| Add broad provider abstraction | Design for multiple providers immediately. | |

**User's choice:** Approved recommendation.
**Notes:** Stripe is locked by SPEC.md, but dedicated service seams keep controllers thin and tests clean.

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe-specific service | Small provider-shaped Stripe functions only. | yes |
| Provider-neutral interface | Build a generic multi-provider interface now. | |
| Inline Stripe calls | Call Stripe directly from controllers/services without a seam. | |

**User's choice:** Approved recommendation.
**Notes:** Broad provider abstraction is deferred because Phase 05 has one provider.

---

## Checkout-Start Sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Call Stripe before local order | Start external session before local writes exist. | |
| Call Stripe inside Mongo transaction | Include external call inside local transaction window. | |
| Local transaction first, Stripe second, update or compensate | Create local order context, create Stripe session, update order or compensate on failure. | yes |

**User's choice:** Approved recommendation.
**Notes:** The order needs a local id for metadata, but Stripe should not run inside the MongoDB transaction.

| Option | Description | Selected |
|--------|-------------|----------|
| Create a new session | Every retry creates a fresh Stripe Checkout Session. | |
| Return stored pending session URL | Exact retry reuses the stored pending checkout URL. | yes |
| Return only the order | Let frontend decide what to do without payment URL. | |

**User's choice:** Approved recommendation.
**Notes:** Preserves Phase 04 idempotency and avoids duplicate provider sessions.

| Option | Description | Selected |
|--------|-------------|----------|
| No Stripe idempotency key | Rely only on local idempotency. | |
| Use local checkout key directly | Send the browser-generated key as the Stripe key. | |
| Derive Stripe key | Derive from user id, local idempotency key, and local order id. | yes |

**User's choice:** Approved recommendation.
**Notes:** Stripe supports idempotency keys for POST requests; derived keys avoid sensitive data exposure.

---

## Order State Model

| Option | Description | Selected |
|--------|-------------|----------|
| `status: pending`, `paymentStatus: payment_pending` | Unpaid provider order is not fulfillment-ready. | yes |
| `status: processing`, `paymentStatus: requires_payment` | Preserve current fulfillment status before payment. | |
| Add a new fulfillment status | Expand the fulfillment enum. | |

**User's choice:** Approved recommendation.
**Notes:** Uses existing fulfillment enum and keeps unpaid orders out of processing.

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate all existing orders | Add a data migration for legacy/demo orders. | |
| Schema default only | Default legacy records to `not_required`. | yes |
| Runtime projection only | Only map payment status at API response time. | |

**User's choice:** Approved recommendation.
**Notes:** No production migration script enters Phase 05.

| Option | Description | Selected |
|--------|-------------|----------|
| Allow current cancel endpoint for paid orders | Let customer cancellation operate unchanged after payment. | |
| Block paid-order cancellation | Prevent cancellation when payment is paid/refunded. | yes |
| Add refund initiation | Add admin/user refund flow. | |

**User's choice:** Approved recommendation.
**Notes:** Paid cancellation without refund is financially wrong; refund initiation is out of scope.

---

## Stripe Checkout Request Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Itemized cart lines | Send each cart item to Stripe. | |
| One aggregate order-total line | Send final server-calculated total as one line item. | yes |
| Stripe coupons/discounts | Synchronize PLASHOE coupons into Stripe. | |

**User's choice:** Approved recommendation.
**Notes:** PLASHOE totals and coupons are already server-calculated.

| Option | Description | Selected |
|--------|-------------|----------|
| Create/reuse Stripe Customers | Manage customer lifecycle now. | |
| Pass `customer_email` only | Use customer email for the one-time payment session. | yes |
| Store customer id when returned | Persist Stripe customer id only if naturally returned. | yes |

**User's choice:** Approved recommendation.
**Notes:** One-time checkout does not require full customer portal or billing lifecycle.

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal order id only | Send only local order id. | |
| Order id plus user id | Send order and user metadata. | |
| Order id, order number, user id, idempotency key, cart fingerprint | Send full reconciliation/debug metadata. | yes, except cart fingerprint is optional |

**User's choice:** Approved recommendation.
**Notes:** Cart fingerprint should be avoided unless needed for debugging.

---

## Webhook Handling

| Option | Description | Selected |
|--------|-------------|----------|
| `/api/orders/webhook` | Put webhook under order routes. | |
| `/api/payments/webhook` | Generic payment webhook path. | |
| `/api/webhooks/stripe` | Provider-specific raw-body webhook path. | yes |

**User's choice:** Approved recommendation.
**Notes:** Signature verification secures the route; it should not use JWT auth.

| Option | Description | Selected |
|--------|-------------|----------|
| Embed event ids on orders | Store processed ids on order documents. | |
| Add `PaymentEvent` model | Durable idempotency record by provider/event id. | yes |
| In-memory cache | Track event ids only during process lifetime. | |

**User's choice:** Approved recommendation.
**Notes:** Stripe retries require durable idempotency across restarts.

| Option | Description | Selected |
|--------|-------------|----------|
| Only `checkout.session.completed` | Minimal success event only. | |
| Session plus payment intent events | Success/failure without refunds. | |
| Session, payment intent, and refund events | Handle success, failure, expiry, full refund, and partial refund. | yes |

**User's choice:** Approved recommendation.
**Notes:** Matches the SPEC payment paths.

| Option | Description | Selected |
|--------|-------------|----------|
| Ignore unresolved webhook | Drop event without state change. | |
| Return 200 and log | Accept event even if local order cannot be found. | |
| Retrieve related object and fail retryably if unresolved | Use Stripe SDK fallback lookup and return server error if still unresolved. | yes |

**User's choice:** Approved recommendation.
**Notes:** Prevents silent payment drift.

| Option | Description | Selected |
|--------|-------------|----------|
| Restore in each handler manually | Duplicate restore logic per event type. | |
| Central helper | One transition helper handles payment state and inventory restoration. | yes |
| Reuse cancel endpoint | Treat provider failure as user cancellation. | |

**User's choice:** Approved recommendation.
**Notes:** Central transition logic protects against duplicate stock restoration.

---

## Frontend Payment Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse `/account` | Redirect to existing account page after payment. | |
| Add `/checkout/success` and `/checkout/cancel` | Lightweight protected return pages that refetch order state. | yes |
| Go straight to `/order/:id` | Send customer directly to order detail. | |

**User's choice:** Approved recommendation.
**Notes:** Redirects are not authoritative, so return pages must refetch.

| Option | Description | Selected |
|--------|-------------|----------|
| Submit order and navigate account | Current demo behavior. | |
| Submit and assign `window.location` to Stripe URL | Hosted Checkout redirect flow. | yes |
| Show intermediate payment screen | Add extra in-app screen before redirect. | |

**User's choice:** Approved recommendation.
**Notes:** Hosted Checkout starts by redirecting to Stripe's URL.

| Option | Description | Selected |
|--------|-------------|----------|
| Order detail only | Show payment status only on individual order page. | |
| Account order list only | Show payment status only on account cards. | |
| Both | Show status in order list and detail. | yes |

**User's choice:** Approved recommendation.
**Notes:** Customers need quick visibility and full detail.

---

## Config and Docs

| Option | Description | Selected |
|--------|-------------|----------|
| Always require Stripe env vars | Fail startup even in non-payment/test contexts. | |
| Require only when `PAYMENTS_ENABLED=true` | Gate required payment vars behind a payment flag. | yes |
| Skip runtime validation | Document env vars but do not fail fast. | |

**User's choice:** Approved recommendation.
**Notes:** Preserves deterministic tests while enforcing production configuration.

| Option | Description | Selected |
|--------|-------------|----------|
| No frontend config | Keep frontend unaware of payment settings. | yes |
| Add public checkout return URLs | Add route constants if needed. | yes if needed |
| Expose Stripe key | Put a publishable key into frontend config. | |

**User's choice:** Approved recommendation.
**Notes:** Hosted Checkout starts on the backend; frontend does not need Stripe secrets or publishable key.

| Option | Description | Selected |
|--------|-------------|----------|
| Only API docs | Update `docs/API.md` only. | |
| API plus config | Update API and environment docs. | |
| API, config, testing, and static checker notes | Document contracts, env, tests, and checker semantics. | yes |

**User's choice:** Approved recommendation.
**Notes:** Payment changes affect checkout API, runtime config, verification, and the existing static payment warning.

---

## Testing

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest module mock | Mock Stripe imports directly. | |
| Dependency injection | Inject/fake provider functions through a service seam. | yes |
| Live Stripe test mode | Use real Stripe test API. | |

**User's choice:** Approved recommendation.
**Notes:** Avoids network and credentials in automated tests.

| Option | Description | Selected |
|--------|-------------|----------|
| Skip real signature verification | Treat webhook signatures as trusted in tests. | |
| Hand-build signed payloads | Generate local signatures using test secret. | yes |
| Call Stripe CLI | Depend on local Stripe CLI for tests. | |

**User's choice:** Approved recommendation.
**Notes:** Proves raw-body route and signature behavior without external services.

| Option | Description | Selected |
|--------|-------------|----------|
| Only update existing checkout submit test | Minimal frontend test adjustment. | |
| Add return-page tests | Cover redirect and return states with component tests. | yes |
| Broad browser E2E | Add browser automation for checkout. | |

**User's choice:** Approved recommendation.
**Notes:** Keeps frontend verification aligned with current CRA/Jest approach.

---

## the agent's Discretion

- Exact payment service filenames may vary if boundaries remain clear.
- Exact response nesting may vary if documented and consistent with existing envelopes.
- Exact metadata key names may vary if reconciliation fields remain present.
- Exact test file split may vary if deterministic coverage remains complete.
- Exact return-page component filenames may vary if route behavior matches decisions.

## Deferred Ideas

- Guest checkout.
- Broad provider abstraction.
- Direct card collection through Stripe Payment Element.
- Admin refund initiation.
- Cart restoration after payment failure/expiry.
- Tax, paid shipping, multi-currency, wallet-specific UX, subscriptions, customer portal, invoices, and usage-based billing.
- Browser E2E, live Stripe CLI as a required gate, CI/CD, deployment secret provisioning, and observability.
