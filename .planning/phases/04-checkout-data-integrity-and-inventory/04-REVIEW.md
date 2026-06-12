---
status: issues_found
phase: 04
phase_name: checkout-data-integrity-and-inventory
depth: standard
files_reviewed: 17
finding_counts:
  critical: 0
  warning: 2
  info: 1
  total: 3
reviewed_at: 2026-06-12
reviewer: codex-inline
subagents_used: false
skills_used:
  - gsd-code-review
  - find-skills
  - code-review-analysis
  - mongodb
  - express-rest-api
  - zustand-state-management
  - testing-quality-standards
---

# Phase 04 Code Review

Reviewed Phase 04 checkout data-integrity and inventory implementation inline because this repository's `AGENTS.md` forbids subagents. Scope was the 17 source/test files changed by Phase 04 summaries, excluding planning artifacts and unrelated dirty working-tree files.

## Skill Discovery

`find-skills` was used with `npx --yes skills find "code review javascript express mongoose react zustand testing"`.

External candidates found included MongoDB, scan/code-review, and React code-review skills. Recommendation: do not install additional external skills for this pass because the local installed skills already cover the needed stack and the external candidates either duplicate local coverage or did not provide enough extra quality signal for this repository. Used local skills: `code-review-analysis`, `mongodb`, `express-rest-api`, `zustand-state-management`, and `testing-quality-standards`.

## Findings

### WR-04-001 - Cart sidebar still depends on raw cart item shape after normalization

Severity: Warning

Files:
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js:17`
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js:46`
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js:54`
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js:298`
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js:303`
- `Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx:40`
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.test.js:179`

The store normalizes items and keeps `raw`, but persistence explicitly strips `raw` with `serializeCartItem`, and `migrate` only normalizes older persisted versions. Current version-1 persisted cart entries rehydrate without `raw`. `CartSidebar` still reads `item.raw?.product?.price?.original || item.raw?.price?.original || item.unitPrice`, so a reload drops sale/original-price display and leaves one cart consumer dependent on mixed backend/local source shape.

Impact: Phase 04's normalized frontend cart item boundary is incomplete. The main totals remain correct, but sale-price UI and the "UI reads normalized items instead of mixed raw shapes" acceptance are not fully satisfied.

Recommendation: add an explicit normalized `originalPrice` field, persist it, and update `CartSidebar` to read that field instead of `raw`. Also normalize version-1 persisted state during rehydrate with a `merge` hook or a version bump, and add a test for a persisted sale item rehydrating with original-price display data intact.

### WR-04-002 - Deleted-product checkout conflicts lose the affected product id

Severity: Warning

Files:
- `Backend/services/checkoutService.js:135`
- `Backend/services/checkoutService.js:147`
- `Backend/test/order.test.js:238`

`productConflict` derives `productId` from `item.product`. After `getCart()` populates `items.product`, a deleted referenced product becomes `null`; the unavailable-product path therefore emits an empty `productId` while the persisted cart item still originally had a product ObjectId. The test for deleted products asserts `PRODUCT_UNAVAILABLE` but does not assert the product id.

Impact: The structured conflict contract is weaker for a real stale-cart case. Clients can still identify the cart line via `cartItemId`, but the response no longer fully identifies the affected product when product-level detail is applicable.

Recommendation: preserve the unpopulated product ObjectId for conflict reporting, either by loading cart item ids before population, using Mongoose populated metadata where reliable, or carrying `productId` into the conflict builder before null checks. Extend the deleted-product test to assert `productId` is the deleted product id.

### INFO-04-001 - Cancellation stock restore assumes every cancellable order decremented stock

Severity: Info

Files:
- `Backend/services/checkoutService.js:425`
- `Backend/services/checkoutService.js:440`
- `Backend/test/order.test.js:365`
- `Backend/test/helpers/factories.js:87`

Cancellation restores stock for every `pending` or `processing` order by incrementing product quantities and uses status to avoid a second restoration. That is correct for new orders created through the Phase 04 checkout path, but it assumes no cancellable order exists that was created before stock-decrement semantics or through a manual/import path. The current test creates an order directly with the factory and asserts stock increases from 5 to 7, which proves "increment once" but does not prove "restore to pre-checkout level" for a real checkout-created order.

Impact: This is mainly a deployment/data risk because Phase 04 explicitly kept production migration/backfill out of scope. If legacy pending/processing orders exist, cancelling them after this change can inflate stock.

Recommendation: before production rollout, either migrate/mark existing cancellable orders, add an order-level `stockAdjusted`/`inventoryDecremented` flag, or document that only checkout-created orders are eligible for automatic stock restoration. Add one test that creates an order through checkout, cancels it, and asserts stock returns to the original value.

## Test Coverage Notes

Reviewed existing Phase 04 coverage:
- Backend order/cart tests cover sequential retry, transactional rollback hooks, stock conflict, coupon max-use concurrency, cancellation idempotence, and concurrent order-number uniqueness.
- Frontend tests cover order idempotency header propagation, checkout 409 behavior, cart normalization, and legacy persisted cart migration.

Recommended additions:
- Persisted version-1 cart rehydrate test for sale/original-price normalized fields.
- Deleted-product checkout conflict test asserting `productId`.
- Checkout-created cancellation restore test asserting stock returns to its pre-checkout value.
- Optional concurrent same-idempotency-key checkout test to harden the retry guarantee beyond sequential retry.

## Verdict

Phase 04 is not clean yet. The transactional checkout core is substantially covered, but the normalized frontend item contract and deleted-product conflict contract need follow-up fixes. The cancellation note is an info-level rollout risk tied to legacy/manual orders.
