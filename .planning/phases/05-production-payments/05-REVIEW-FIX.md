---
status: complete
phase: 05
phase_name: production-payments
source_review: 05-REVIEW.md
fixed_findings:
  - CR-05-001
  - CR-05-002
  - WR-05-001
created_at: 2026-06-12
---

# Phase 05 Review Fix

## Fixed

- `CR-05-001`: Webhook processing now claims `PaymentEvent` with `status: processing` before dispatching side effects, marks events processed only after successful mutation, records retryable failures, and treats concurrent duplicate claims as accepted duplicates. Inventory restore now atomically flips `inventoryDecremented` before stock increments so duplicate unpaid-terminal transitions cannot restore stock twice.
- `CR-05-002`: Orders now store provider refund records. `refund.updated` merges by provider refund id before recalculating local refund totals, so different event ids for the same refund object do not double-count.
- `WR-05-001`: Checkout now rejects explicitly disabled payments before idempotency checkout side effects. The response is a client-safe 503 with `PAYMENTS_DISABLED`, and the shared error middleware only exposes 5xx messages when an error is explicitly marked safe to expose.

## Regression Coverage

- Added concurrent duplicate failed-webhook coverage proving stock restores once and only one provider event record is created.
- Added repeated `refund.updated` coverage for two event ids with the same refund object id.
- Added checkout coverage for `PAYMENTS_ENABLED=false` with missing payment return URLs.

## Verification

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- order.test.js payment-state.test.js payment-webhook.test.js security-config.test.js` | Passed: 4 files, 48 tests. |
| `cd Backend && npm test` | Passed: 11 files, 95 tests. |

## Recommendation

Keep webhook idempotency and provider-object idempotency separate in future payment work. Event ids answer "did we process this delivery"; provider object ids answer "did this payment/refund mutation already affect local order state."
