# Phase 04: checkout-data-integrity-and-inventory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 04-checkout-data-integrity-and-inventory
**Areas discussed:** skill selection, checkout atomicity, retry safety, transaction topology, cart stock, checkout stock, coupon consistency, cancellation restore, order numbers, conflict contracts, frontend cart normalization, verification

---

## Skill Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Use installed local skills | Use local `mongodb`, `express-rest-api`, and `zustand-state-management` guidance, plus GSD workflow rules. | yes |
| Install external duplicate skills | Install external skills found through `npx skills find`. | |
| Use subagents | Fan out research/planning to helper agents. | |

**User's choice:** Approved recommendation.
**Notes:** External search found MongoDB-related candidates, but local installed skills were sufficient. Repo instruction says not to use subagents.

---

## Checkout Atomicity and Retry Safety

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should order/cart/coupon/stock writes become atomic? | Transaction only; idempotency only; transaction plus idempotency | Transaction plus idempotency |
| Where should checkout orchestration live? | Controller only; checkout service/helper; models | Checkout service/helper |
| How should the client identify the same checkout attempt? | Request body field; `Idempotency-Key` header; server-generated only | `Idempotency-Key` header |
| Where should duplicate-checkout state live? | New collection; fields on `Order`; cart-only fingerprint | Fields on `Order` |
| What should repeated checkout return? | Always reject; return existing order; create another order | `201` first success, `200` exact retry, `409` stale key |

**User's choice:** Approved recommendation.
**Notes:** The selected approach satisfies both the no-partial-write and no-duplicate-order requirements from `04-SPEC.md`.

---

## MongoDB Topology and Transaction Testing

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should tests run transaction behavior? | Keep `MongoMemoryServer`; switch to `MongoMemoryReplSet`; mock transactions | Switch to `MongoMemoryReplSet` |
| What if deployed MongoDB does not support transactions? | Manual compensation; fail safely; ignore topology | Fail safely before mutating |
| How should failure paths be forced in tests? | Public failpoint API; internal service seams/spies; happy-path only | Internal service seams/spies |

**User's choice:** Approved recommendation.
**Notes:** Current `Backend/test/setup.js` uses `MongoMemoryServer`; transaction tests need replica-set behavior.

---

## Inventory and Cart Stock Behavior

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| Should cart mutations reserve inventory? | Reserve/decrement on cart add; validate only; ignore until checkout | Validate only |
| Should stock be product-level or per-size? | Product-level; per-size schema; hybrid | Product-level |
| What happens when requested cart quantity exceeds stock? | Auto-reduce; reject with conflict; allow and fail later | Reject with `409` and do not mutate |
| How should checkout update stock? | Pre-read then save; conditional atomic `$inc`; skip decrement | Conditional atomic decrement inside transaction |
| What if a cart product is missing or stale at checkout? | Auto-remove; ignore; reject checkout | Reject with `409`, keep cart intact |

**User's choice:** Approved recommendation.
**Notes:** `Product.stock` is aggregate today, so per-size stock is deferred.

---

## Coupon, Pricing, and Cancellation Consistency

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| Should checkout reprice items from current product price? | Use current product price; preserve `priceAtAdd`; introduce pricing engine | Preserve `priceAtAdd` |
| How should coupon `maxUses` be enforced? | `isValid()` then `$inc`; conditional update in transaction; coupon ledger | Conditional update in transaction |
| How should cancellation restore inventory? | Restore on every cancel; restore once on valid status transition; never restore | Restore once on valid status transition |

**User's choice:** Approved recommendation.
**Notes:** Pricing-engine changes, payment state, and reservation expiry stay outside this phase.

---

## Order Numbers and Conflict Contracts

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should `PLS-` numbers become collision-safe? | Counter collection; crypto random/time suffix; keep count/time and retry | Crypto random/time suffix with unique index |
| What should `409` bodies look like? | Generic message; validator-style field errors; domain error array | Domain error array |
| How should frontend handle stock/coupon/retry conflicts? | Clear cart; auto-adjust quantities; preserve cart and show conflict | Preserve cart, show conflict, sync cart |

**User's choice:** Approved recommendation.
**Notes:** Strict sequence is not required; uniqueness and `PLS-` prefix are required.

---

## Frontend Cart Normalization

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| Where should mixed backend/local cart shapes be normalized? | Each component; store boundary mapper/selectors; backend response change | Store boundary mapper/selectors |
| What about old `cart-storage` data? | Wipe old carts; tolerate and normalize old shapes; ignore migration | Tolerate and normalize old shapes |
| Which frontend files should Phase 04 touch? | Checkout only; all cart consumers; broad product/catalog normalization | All cart consumers only |

**User's choice:** Approved recommendation.
**Notes:** The expected consumer set is `cartStore`, `Checkout.jsx`, `Cart.jsx`, `CartSidebar.jsx`, and focused tests.

---

## Verification and Documentation

| Option | Description | Selected |
|--------|-------------|----------|
| Full Phase 04 gate | Backend tests, frontend tests, frontend build, static checker, API/testing docs. | yes |
| Backend only | Prove the backend data-integrity behavior and skip frontend/docs. | |
| Tests without docs | Add tests but leave API/testing documentation unchanged. | |

**User's choice:** Approved recommendation.
**Notes:** The phase changes API contracts, frontend state assumptions, and verification commands, so docs must move with code.

---

## Agent Discretion

- Exact service/helper filenames may vary if the controller remains thin and checkout failure tests stay deterministic.
- Exact cart fingerprint algorithm may vary if it is stable for equivalent cart state and changes when relevant cart state changes.
- Exact `PLS-` suffix format may vary if it is concurrency-safe, dependency-free, and unique-index-backed.
- Exact normalized item metadata may vary if display and mutation fields are stable for every cart consumer.

## Deferred Ideas

- Per-size inventory schema.
- Inventory reservation windows and abandoned-cart cleanup.
- Full pricing or promotion engine.
- Real payment provider integration.
- Admin fulfillment operations.
- Broad catalog/product normalization.
- CI/CD, observability, and deployment readiness.
