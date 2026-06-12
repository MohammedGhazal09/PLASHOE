---
status: issues_found
phase: 05
phase_name: production-payments
depth: standard
files_reviewed: 31
finding_counts:
  critical: 2
  warning: 1
  info: 0
  total: 3
reviewed_at: 2026-06-12
reviewer: codex-inline
subagents_used: false
skills_used:
  - gsd-code-review
  - find-skills
  - code-review-analysis
  - stripe-webhooks
  - javascript-testing-patterns
---

# Phase 05 Code Review

Reviewed Phase 05 production payment changes inline because this repository's instructions forbid subagents. Scope was the 31 source, test, and documentation files changed by the Phase 05 implementation commit, excluding planning artifacts, lockfiles, and unrelated dirty working-tree files.

## Skill Discovery

`find-skills` was used with `npx --yes skills find "code review stripe webhooks payment express vitest"`.

External candidates found included `claude-office-skills/skills@stripe payments`, `jezweb/claude-skills@stripe-payments`, and `hookdeck/webhook-skills@stripe-webhooks`. Recommendation: do not install additional external skills for this pass because the local installed skills already cover the relevant review surface: code review discipline, Stripe webhook verification/idempotency, and JavaScript/Vitest test coverage.

## Findings

### CR-05-001 - Webhook idempotency is claimed after side effects

Severity: Critical

Files:
- `Backend/controllers/webhookController.js:219`
- `Backend/controllers/webhookController.js:236`
- `Backend/controllers/webhookController.js:238`
- `Backend/services/paymentState.js:13`
- `Backend/services/paymentState.js:55`
- `Backend/test/payment-webhook.test.js:117`

`handleStripeWebhook` checks for an existing `PaymentEvent`, dispatches the event side effects, and only then creates the unique idempotency record. Two duplicate webhook deliveries can both pass the `findOne` check before either creates `PaymentEvent`; both can then enter `transitionOrderPaymentState`. One insert will eventually win, while the other can return 500 after already touching order, refund, or inventory state.

The stock restore path is especially sensitive because `restoreOrderInventoryOnce` relies on a loaded `order.inventoryDecremented` value rather than an atomic conditional update. Two concurrent failure or expiry handlers can both observe `true` and both increment product stock before either saved order clears the flag. Current tests post the duplicate failed event sequentially after the first handler has already written the event row, so they do not cover this race.

Recommendation: claim the provider event before mutating order/product state, using a unique insert or upsert into `PaymentEvent` with `status: processing`. Treat duplicate-key claims as already accepted or inspect the existing status. On processing failure, mark the event failed with error details so retries/reconciliation remain possible. Also make inventory restore atomic, for example by conditionally flipping `inventoryDecremented` from `true` to `false` before stock increments inside the same transaction. Add a concurrent duplicate webhook test with `Promise.all` that proves stock and refund amounts change once.

### CR-05-002 - `refund.updated` can double-count the same refund object

Severity: Critical

Files:
- `Backend/controllers/webhookController.js:167`
- `Backend/controllers/webhookController.js:171`
- `Backend/controllers/webhookController.js:173`
- `Backend/models/PaymentEvent.js:45`
- `Backend/test/payment-webhook.test.js:207`

For `refund.updated`, `handleRefund` computes the new total as the current local `order.refundAmount` plus `stripeObject.amount`. The only dedupe key stored by `PaymentEvent` is the provider event id. That means a second distinct event id for the same refund object id is accepted as a new refund and adds the same refund amount again.

This can overstate `refundAmount` and prematurely mark an order `refunded` when the provider merely emits another update for an existing partial refund. The current test repeats the exact same event id, so it only proves event-id dedupe and does not prove refund-object idempotency.

Recommendation: track refund object ids separately from event ids, either in a dedicated refund ledger or on the order as provider refund records. For `refund.updated`, update by refund id instead of incrementing by event id; alternatively reconcile against a provider cumulative field when available. Add a test where two `refund.updated` events use different `event.id` values but the same `data.object.id`, and assert the local refund amount stays at the provider amount.

### WR-05-001 - `PAYMENTS_ENABLED=false` allows startup but checkout still runs the payment path

Severity: Warning

Files:
- `Backend/config/env.js:44`
- `Backend/config/env.js:93`
- `Backend/controllers/orderController.js:14`
- `Backend/services/paymentService.js:90`
- `Backend/test/security-config.test.js:13`

Runtime validation explicitly permits `PAYMENTS_ENABLED=false` without Stripe keys or payment return URLs. The order route does not use that flag; it always calls `startCheckoutPayment`, which always builds Stripe return URLs and attempts hosted checkout. In a disabled-payments runtime, the server can start successfully but every checkout still falls into the payment-start path and fails with the generic 424 compensation behavior instead of a deliberate disabled-payments response or non-payment order flow.

Recommendation: make the flag a real runtime control. Either return a clear 503/feature-disabled response before creating an order, or implement an explicit non-payment path with `paymentStatus: not_required` if that is the intended operational mode. Add a route-level test with `PAYMENTS_ENABLED=false` and no Stripe return URLs so the startup config behavior and checkout behavior cannot drift.

## Test Coverage Notes

Reviewed existing Phase 05 coverage:
- Backend route tests cover payment start, provider failure compensation, exact idempotency retry, stock/coupon conflicts, and cancellation after payment capture.
- Backend webhook tests cover signature rejection, success, failure, expiry, unresolved retry failure, related intent lookup, full refunds, partial refunds, and sequential duplicate event ids.
- Frontend tests cover hosted checkout redirect, no local cart clear on redirect, conflict resync, and checkout return payment states.

Recommended additions:
- Concurrent duplicate webhook delivery for the same provider event id.
- Repeated `refund.updated` events with different event ids but the same refund object id.
- Checkout behavior when `PAYMENTS_ENABLED=false`.

## Checks Run

| Command | Result |
| --- | --- |
| `node "$HOME\.codex\get-shit-done\bin\gsd-tools.cjs" query init.phase-op 5` | Passed; Phase 05 located with 5 plans, summaries, context, research, and verification. |
| `git show --name-only --format= b688c19 -- . ':!.planning/' ':!**/package-lock.json' ':!**/yarn.lock' ':!**/Gemfile.lock' ':!**/poetry.lock'` | Passed; resolved 31 review-scope files. |
| `npx --yes skills find "code review stripe webhooks payment express vitest"` | Passed; returned Stripe payment/webhook candidates. |
| `Select-String` / line-numbered reads over Phase 05 payment, webhook, env, and test files | Passed; review evidence collected from changed files. |
| `cd Backend && npm test -- order.test.js payment-state.test.js payment-webhook.test.js security-config.test.js` | Passed: 4 files, 45 tests. |

## Verdict

Phase 05 is not clean yet. The implementation covers the main hosted checkout flow and has useful sequential webhook coverage, but payment webhook side effects are not robust against concurrent duplicate delivery or repeated refund-object updates. The disabled-payments flag also needs a route-level behavior contract before it can be trusted operationally.
