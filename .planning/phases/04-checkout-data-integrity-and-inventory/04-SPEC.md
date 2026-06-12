# Phase 04: Checkout Data Integrity and Inventory - Specification

**Created:** 2026-06-12
**Ambiguity score:** 0.09 (gate: <= 0.20)
**Requirements:** 9 locked

## Goal

Authenticated checkout changes from separate best-effort writes into a retry-safe, stock-aware order flow where order, cart, coupon, inventory, and display order-number state remain consistent under failures and concurrent use.

## Background

Phase 04 starts after the API security and validation baseline. The backend already has authenticated cart and order routes, route-boundary validators, cart/order tests, and a `Product.stock` field. Today, `Backend/controllers/orderController.js` creates an order, increments coupon usage, and clears the cart as separate writes. If a later write fails, the customer can be left with a created order, stale cart, stale coupon usage, or unchanged inventory. `Backend/controllers/cartController.js` validates product existence and size, but it does not enforce available stock when adding or updating cart quantities. `Backend/models/Order.js` generates `orderNumber` from `Date.now()` plus `countDocuments()`, which can collide under concurrent order creation. The frontend cart store and checkout/cart UI also tolerate mixed backend and local cart item shapes through defensive fallbacks rather than one stable view model.

The Phase 04 trigger is the remaining purchase-flow integrity risk documented in `.planning/codebase/CONCERNS.md`, `.planning/spikes/001-core-flow-contract-check/results.json`, `.planning/REQUIREMENTS.md`, and the Phase 03 verification notes. Payment provider work is still deferred to Phase 05; this phase makes the current authenticated checkout data model safe enough for payments to build on later.

## Requirements

1. **Consistent checkout write set**: A checkout attempt must not leave partially updated order, cart, coupon, or inventory state visible after success or failure.
   - Current: `createOrder` creates an order, increments coupon usage, and clears the cart through separate writes; stock is not updated.
   - Target: Successful checkout leaves exactly one order, an empty cart, correctly incremented coupon usage when applicable, and decremented product stock. Failed checkout leaves no new order and preserves cart, coupon, and stock state.
   - Acceptance: Backend tests force failures after each checkout write point and verify order count, cart contents, coupon `usedCount`, and product `stock` remain consistent.

2. **Retry-safe order creation**: Repeating the same authenticated checkout attempt must not create duplicate orders.
   - Current: Reposting `POST /api/orders` can create another order when the cart/order state permits it; no retry discriminator or duplicate guard exists.
   - Target: The same user's repeated submission of the same checkout attempt returns the existing successful order or rejects the duplicate without creating a second order.
   - Acceptance: A backend route test sends the same checkout attempt twice and verifies only one `Order` document exists, the response contract is documented, and cart/coupon/stock state is not applied twice.

3. **Cart stock validation**: Cart add and quantity update operations must reject quantities above current product stock.
   - Current: `addToCart` and `updateCartItem` validate product existence, size, and positive quantity, but not stock availability.
   - Target: Adding or updating a cart item above available stock returns a state-conflict error and does not mutate the cart.
   - Acceptance: Backend cart tests cover add and update requests where requested quantity exceeds stock and assert a `409` response with item-level error details and unchanged cart contents.

4. **Checkout stock enforcement**: Order creation must atomically decrement product stock and fail the whole order when any line item is unavailable.
   - Current: `Product.stock` exists but checkout neither validates nor decrements it.
   - Target: Checkout verifies every cart item against current stock, decrements stock exactly once for a successful order, and rejects the whole order when any item is unavailable.
   - Acceptance: Backend order tests prove successful checkout decrements stock by ordered quantities, insufficient stock returns `409`, no order is created on insufficient stock, and the customer's cart remains intact.

5. **Cancellation stock restoration**: User cancellation must restore stock exactly once for orders that can still be cancelled.
   - Current: `cancelOrder` changes order status to `cancelled` but does not restore stock.
   - Target: Cancelling an owned order before it is shipped or delivered restores ordered quantities to product stock exactly once; repeated cancel attempts do not double-restore stock.
   - Acceptance: Backend order tests cancel a processing order, assert stock is restored, assert a second cancel does not increment stock again, and preserve existing rejection behavior for shipped or delivered orders.

6. **Coupon usage consistency**: Coupon usage limits and usage increments must be concurrency-safe with checkout.
   - Current: `Coupon.isValid()` checks `maxUses`, but checkout increments `usedCount` after order creation as a separate write.
   - Target: Coupon `maxUses` is enforced at checkout time, `usedCount` increments exactly once for a successful order, and failed or duplicate checkout attempts do not consume coupon usage.
   - Acceptance: Backend tests cover a coupon at its usage limit, concurrent checkout attempts against a one-use coupon, and a forced checkout failure after coupon validation.

7. **Collision-safe order numbers**: Order display numbers must remain unique under concurrent order creation while preserving the `PLS-` display convention.
   - Current: `Order` uses `PLS-${Date.now()}-${count + 1}`, which can collide or fail under same-millisecond concurrent creates.
   - Target: Every created order receives a unique `orderNumber` beginning with `PLS-`; uniqueness does not depend on collection count being current.
   - Acceptance: A backend test creates multiple orders concurrently and verifies all persisted `orderNumber` values are unique, non-empty, and begin with `PLS-`.

8. **Normalized frontend cart item view model**: Frontend cart consumers must read one normalized cart item shape from the store boundary.
   - Current: `cartStore`, `Checkout.jsx`, `Cart.jsx`, and `CartSidebar.jsx` compensate for mixed local and backend item shapes using fallbacks such as `priceAtAdd`, `product.price.current`, local IDs, and populated product fields.
   - Target: `useCartStore` exposes cart items through one normalized view model containing stable item id, product id, name, image, size, quantity, unit price, and line total for both backend and local cart sources.
   - Acceptance: Frontend store and checkout/cart tests assert normalized items for backend sync and local guest mutations, and checkout/cart UI tests no longer depend on page-level mixed-shape fallback helpers.

9. **Checkout conflict response contract**: Checkout, cart stock, and coupon conflicts must use a documented structured conflict response.
   - Current: Conflict-like cases mostly return generic `400` or `404` responses without a consistent machine-readable item detail shape.
   - Target: Stock conflicts, coupon usage conflicts, and duplicate/retry conflicts return `409` with `{ success: false, message, errors: [...] }`, where `errors` identifies the affected product, cart item, coupon, or checkout attempt when applicable.
   - Acceptance: Backend tests assert `409` response bodies for insufficient stock, exhausted coupon usage, and duplicate checkout attempts; `docs/API.md` documents the contract.

## Boundaries

**In scope:**
- Authenticated checkout data consistency across order, cart, coupon, and stock state.
- Retry-safe behavior for one authenticated checkout attempt.
- Stock validation for cart add/update and order creation.
- Stock decrement on successful checkout and stock restoration on cancellable user cancellation.
- Coupon usage-limit consistency during checkout.
- Collision-safe `PLS-` order numbers.
- Frontend cart item view-model normalization at the store/API boundary.
- Backend route tests for failure, conflict, retry, stock, coupon, cancellation, and concurrent order-number scenarios.
- Frontend store and checkout/cart tests for normalized cart item behavior.
- API/testing documentation updates for checkout conflicts, stock behavior, idempotency/retry behavior, and normalized cart item expectations.

**Out of scope:**
- Real payment provider integration, payment intents, payment status, webhooks, refunds, and cancellations - Phase 05 owns production payments.
- Admin fulfillment APIs or admin order-management screens - Phase 06 owns fulfillment operations.
- Product catalog/static fallback normalization outside cart item normalization - Phase 07 owns catalog/frontend architecture cleanup.
- Guest checkout or guest order creation - checkout is authenticated in the current product policy.
- Inventory reservation with expiry or abandoned-cart cleanup - this phase validates cart stock and decrements on checkout, but does not introduce hold windows.
- Full product price/promotion engine changes - this phase preserves server-stamped cart `priceAtAdd` and current coupon model.
- CI/CD pipeline creation, observability, or deployment readiness - Phase 08 owns operations.
- Create React App migration or frontend dependency-audit cleanup - tracked separately in the risk register and v2 requirements.
- Production data backfill/migration work beyond test fixtures and seed-data adjustments needed for verification.

## Constraints

- Preserve the current authenticated checkout policy: `/checkout` and `/api/orders` remain authenticated-only.
- Preserve the `POST /api/orders` principle that clients send shipping data only; the backend computes order line items, subtotal, discount, total, coupon usage, and inventory changes from the server-side cart.
- Preserve the `PLS-` order-number display convention because frontend account/order screens already display `orderNumber`.
- Preserve existing explicit client-safe responses for validation, authentication, authorization, and not-found cases; new state-race/conflict cases use `409`.
- Keep Phase 04 independent of real payment state. Orders may still be created as the existing non-payment checkout outcome; payment semantics are not introduced here.
- Use existing project conventions and test tools: Express, Mongoose, Zod validators, Vitest/Supertest/MongoMemoryServer for backend tests, and CRA/Jest tests for frontend behavior.
- Do not require major framework migrations unless the chosen implementation cannot satisfy the accepted observable guarantees with the current stack.
- Server-side totals remain authoritative. Client subtotal, discount, or line-item totals must not be trusted for order persistence.
- Concurrency and retry tests must be deterministic enough for local one-shot test runs.

## Acceptance Criteria

- [ ] Backend checkout tests prove success creates exactly one order, clears the cart, increments coupon usage when applicable, and decrements stock by ordered quantities.
- [ ] Backend failure-path tests prove failures during checkout do not leave partial order, cart, coupon, or stock mutations.
- [ ] Backend retry tests prove repeated submission of the same checkout attempt cannot create duplicate orders or double-apply coupon/stock changes.
- [ ] Backend cart tests prove add/update requests above stock return `409` with item-level details and leave the cart unchanged.
- [ ] Backend order tests prove insufficient checkout stock returns `409`, creates no order, and preserves the cart.
- [ ] Backend cancellation tests prove cancellable orders restore stock exactly once and shipped/delivered cancellation remains rejected.
- [ ] Backend coupon tests prove `maxUses` is enforced under checkout and concurrent attempts cannot exceed the limit.
- [ ] Backend concurrent order-number tests prove all generated order numbers are unique and begin with `PLS-`.
- [ ] Frontend cart store tests prove backend and local cart items are exposed as one normalized view model.
- [ ] Frontend checkout/cart UI tests prove UI behavior reads normalized cart items instead of mixed raw backend/local shapes.
- [ ] `docs/API.md` documents stock conflict, coupon conflict, duplicate checkout/retry, and order-number behavior.
- [ ] `docs/TESTING.md` documents the new Phase 04 backend/frontend tests and any retained contract-check expectations.
- [ ] `cd Backend && npm test` passes.
- [ ] `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` passes.
- [ ] `cd Frontend/Ecommerce-main/my-app && npm run build` passes with no new warnings beyond already documented warnings.
- [ ] `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` has no new `FAIL` findings.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
| --- | --- | --- | --- | --- |
| Goal Clarity | 0.94 | 0.75 | met | Primary guarantee is retry-safe, stock-aware, consistent authenticated checkout. |
| Boundary Clarity | 0.92 | 0.70 | met | Payments, admin fulfillment, catalog cleanup, CI/CD, guest checkout, and inventory reservations are excluded. |
| Constraint Clarity | 0.86 | 0.65 | met | Auth-only checkout, server-side totals, `PLS-` display numbers, `409` conflicts, and existing toolchain are locked. |
| Acceptance Criteria | 0.90 | 0.70 | met | Backend, frontend, docs, build, and contract-check gates are pass/fail. |
| **Ambiguity** | 0.09 | <=0.20 | met | Gate passed after user approved all recommendations. |

Status: met = dimension meets minimum, below = planner treats as assumption.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
| --- | --- | --- | --- |
| 1 | Researcher | What current checkout risk triggers Phase 04? | Separate order/cart/coupon writes, unenforced stock, collision-prone order numbers, and mixed cart item shapes are the core risks. |
| 1 | Researcher | What primary guarantee should Phase 04 deliver? | Checkout must be both consistent and retry-safe under real usage. |
| 2 | Simplifier | What is the minimum viable inventory scope? | Validate stock in cart, atomically decrement on checkout, and restore on cancellable user cancellation; no reservation windows. |
| 2 | Simplifier | What is the minimum frontend scope? | Normalize cart item view models at the store/API boundary without broader catalog architecture work. |
| 3 | Boundary Keeper | What stays out of Phase 04? | Real payments, payment webhooks/refunds, admin fulfillment, product catalog normalization, guest checkout, CRA migration, and CI/CD stay out. |
| 3 | Boundary Keeper | What order-number behavior is required? | Keep `PLS-` display numbers, require collision-safe uniqueness, do not require strict sequencing. |
| 4 | Failure Analyst | What does a broken checkout look like? | Duplicate orders, double coupon use, partial cart clearing, unchanged or overdrawn stock, or leaked mixed cart shapes cause rejection. |
| 4 | Failure Analyst | How should insufficient stock behave? | Fail the whole order with item-level `409` conflict details; do not auto-reduce quantity or split items. |
| 4 | Failure Analyst | How should duplicate/retry checkout behave? | Return the existing order or reject the duplicate without creating a second order or double-applying side effects. |
| 5 | Seed Closer | What should acceptance prove? | Backend tests cover consistency, retry, conflicts, stock, coupon, cancellation, and concurrent order numbers; frontend tests cover normalized cart items. |
| 5 | Seed Closer | What documentation must change? | API/testing docs must describe stock conflicts, retry/idempotency behavior, order-number behavior, and Phase 04 tests. |

---

*Phase: 04-checkout-data-integrity-and-inventory*
*Spec created: 2026-06-12*
*Next step: $gsd-discuss-phase 4 - implementation decisions (how to build what's specified above)*
