---
phase: 04-checkout-data-integrity-and-inventory
status: complete
researched: 2026-06-12
sources: official-docs
skills_used: [mongodb, express-rest-api, zustand-state-management, testing-quality-standards]
---

# Phase 04 Research: Checkout Data Integrity and Inventory

## Research Scope

Phase 04 needs a checkout path that is atomic, retry-safe, stock-aware, and testable in the existing Express, Mongoose, Vitest/Supertest, React, CRA/Jest, and Zustand stack. The research focused on transaction support, idempotency headers, replica-set test setup, conflict contracts, order-number generation, and persisted cart-store migration.

## Sources

- Mongoose transactions: https://mongoosejs.com/docs/transactions.html
- MongoDB transaction production considerations: https://www.mongodb.com/docs/manual/core/transactions-production-consideration/
- mongodb-memory-server replica set quick start: https://typegoose.github.io/mongodb-memory-server/docs/guides/quick-start-guide/
- IETF Idempotency-Key draft: https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-02
- MDN Idempotency-Key reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Idempotency-Key
- Node.js crypto randomUUID: https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
- Zustand persist middleware: https://zustand.docs.pmnd.rs/reference/middlewares/persist
- Zustand persisting store data: https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data

## Findings

### R-01: Checkout needs a real MongoDB transaction boundary

Mongoose supports `session.withTransaction()` and `mongoose.connection.transaction(...)`. The Mongoose wrapper is useful because it integrates with Mongoose change tracking after an abort. Every model operation inside the checkout transaction still needs the same session unless the project explicitly enables transaction AsyncLocalStorage.

Recommendation: use an explicit session parameter in a focused checkout service and keep transaction work sequential. Do not use `Promise.all`, `Promise.allSettled`, `Promise.race`, or nested transactions inside the transaction callback because Mongoose documents that parallel operations in one transaction are unsupported.

### R-02: Transactions require a replica set or sharded cluster

MongoDB standalone deployments do not support transactions. Production checkout must run against Atlas or another replica-set-compatible MongoDB deployment. Local tests also need a replica set if they are going to prove rollback behavior.

Recommendation: treat missing transaction support as a checkout integrity failure. Start the checkout transaction before any order, stock, cart, or coupon mutation; if starting the session/transaction fails, return through normal error handling without mutating state.

### R-03: Backend tests should switch from MongoMemoryServer to MongoMemoryReplSet

`mongodb-memory-server` supports `MongoMemoryReplSet`. Its docs call out `storageEngine: 'wiredTiger'` for transaction support. The local runtime is Node v24.8.0, which satisfies the package's current Node 20.19+ requirement.

Recommendation: replace the backend test harness with one global `MongoMemoryReplSet` instance in `Backend/test/setup.js`, connect Mongoose to `replSet.getUri()`, clear collections after each test, and stop the replica set in `afterAll`. Keep the existing route-test style.

### R-04: Idempotency-Key is the right retry discriminator

The Idempotency-Key draft and MDN reference both frame the header as a way to make non-idempotent `POST` requests safe to retry. They recommend a unique key per new request, reuse of the same key for retries, server-side fingerprinting to detect key reuse with changed payloads, documentation of the endpoint policy, and `409 Conflict` for outstanding or conflicting retry situations.

Recommendation: require `Idempotency-Key` on `POST /api/orders`, validate it as a bounded client string, scope uniqueness to `{ user, idempotencyKey }`, store the checkout fingerprint on the order, and document the behavior. Return `201` for the first success, `200` for an exact replay that returns the already-created order, and `409` when a key is reused for changed cart/request state. Missing header can remain a `400` request contract failure.

### R-05: Fingerprinting must account for the cleared-cart replay case

The cart is cleared after a successful checkout, so exact retries cannot be compared to the current cart if the cart is empty. At the same time, stale key reuse after the user adds new items must not return the old order.

Recommendation: check for an existing order by `{ user, idempotencyKey }` before rejecting empty carts. If the cart is empty, return the existing order as an exact replay. If the user has a non-empty cart with the same key, recompute the fingerprint and return `409` when it differs from the stored fingerprint. The first-attempt fingerprint should include sorted cart lines, coupon code, discount, normalized shipping address, and notes.

### R-06: Conditional stock and coupon updates belong inside the same transaction

Cart validation can reject obviously overstocked quantities before checkout, but it does not reserve inventory. Checkout must re-read and conditionally update current stock because other users can buy the same product between cart add and checkout.

Recommendation: aggregate checkout quantity by product, then run sequential conditional updates inside the checkout transaction, for example `{ _id: productId, stock: { $gte: requested } }` with `$inc: { stock: -requested }`. If any update does not match, abort the transaction and return a structured `409`. Recheck coupon active/date/max-use rules inside the transaction and increment `usedCount` with a max-use-aware condition.

### R-07: Cancellation stock restore must be idempotent

Current cancellation only changes order status. Phase 04 must restore stock exactly once for owned `pending` or `processing` orders and keep shipped/delivered rejection behavior.

Recommendation: update cancellation through an atomic status transition filter such as `{ _id, user, status: { $in: ['pending', 'processing'] } }` and restore stock in the same transaction only when that transition succeeds. Already-cancelled repeat requests should not increment stock again.

### R-08: Order numbers should be random/time based and unique-index backed

Node's `crypto.randomUUID()` generates RFC 4122 version 4 UUIDs using a cryptographic pseudorandom number generator. The project does not require strict sequential numbers, only `PLS-` prefix preservation and collision-safe uniqueness.

Recommendation: replace the `Date.now() + countDocuments()` hook with a dependency-free crypto suffix such as `PLS-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`. Keep the existing unique index on `orderNumber`, and in the unlikely duplicate-key case regenerate once inside order creation.

### R-09: Zustand persisted cart migration can preserve old guest carts

Zustand persist supports `version`, `migrate`, `partialize`, and custom merge behavior. Hydration can be synchronous for `localStorage`, but persisted shape changes still need migration if existing users have old `cart-storage` data.

Recommendation: add a pure cart-item normalizer in `cartStore.js`, version the persisted store, migrate older `cart-storage` shapes through the normalizer, and write normalized items going forward. Selectors and UI should compute totals from `unitPrice` and `lineTotal`, not from repeated component-level fallbacks.

### R-10: Test design needs failure injection seams, not public failpoints

The phase needs proof that checkout failures after each write point roll back order, cart, coupon, and stock state. Public query-string failpoints would leak test-only behavior into the API.

Recommendation: keep failure injection in service-level optional hooks or spies that tests can pass/import. Do not expose failpoint routes, headers, or query parameters. Each forced failure test should assert the full state set: order count, cart contents, coupon `usedCount`, product `stock`, and response envelope.

## Validation Architecture

The validation strategy uses three layers:

1. Backend route and service tests in Vitest/Supertest against `MongoMemoryReplSet` to prove transaction rollback, idempotency replay/stale-key conflict, stock decrement/conflict, coupon max-use concurrency, cancellation stock restore, and order-number uniqueness.
2. Frontend CRA/Jest and React Testing Library tests to prove normalized cart items for backend sync and guest carts, idempotency header propagation, and conflict handling that preserves cart state and syncs after failure.
3. Documentation and static contract checks to keep `docs/API.md`, `docs/TESTING.md`, and `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` aligned with the new checkout contract.

Recommended command progression:

```bash
cd Backend && npm test -- order.test.js cart.test.js
cd Backend && npm test
cd Frontend/Ecommerce-main/my-app && npm test -- cartStore.test.js Checkout.test.jsx --watchAll=false
cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false
cd Frontend/Ecommerce-main/my-app && npm run build
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
```

## Open Research Risks

- MongoDB transaction retry behavior can surface transient write conflicts in concurrent tests. Recommendation: keep tests deterministic by using clear setup data, awaiting requests, and asserting final persisted state rather than depending on exact interleaving.
- Requiring `Idempotency-Key` on checkout is a contract change. Recommendation: land backend and frontend changes in the same phase and document the missing-header `400`.
- `MongoMemoryReplSet` can be slower than single-node memory MongoDB. Recommendation: start one shared replica set in the global backend test setup rather than per test file.

