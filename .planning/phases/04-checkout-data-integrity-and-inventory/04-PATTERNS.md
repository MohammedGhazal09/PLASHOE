---
phase: 04-checkout-data-integrity-and-inventory
status: complete
created: 2026-06-12
---

# Phase 04 Pattern Map

## Backend Patterns To Preserve

- Routes stay thin. `Backend/routes/cartRoutes.js` and `Backend/routes/orderRoutes.js` should keep path and middleware wiring only.
- Controllers return HTTP status and JSON envelopes, but cross-model checkout orchestration should move out of `Backend/controllers/orderController.js`.
- Request validation remains at route boundaries through `Backend/middleware/validate.js` and `Backend/validators/*.js`.
- Error envelopes remain `{ success: false, message }` with optional `errors` arrays for structured validation or conflict detail.
- Tests use Vitest and Supertest against the importable Express app from `Backend/app.js`.
- Test data belongs in `Backend/test/helpers/factories.js`.

## Backend Patterns To Add

- Add a focused service module such as `Backend/services/checkoutService.js` for order, cart, product, and coupon writes.
- Add small pure helpers inside the service module or a sibling module for:
  - conflict payload creation,
  - cart/request fingerprint generation,
  - order-number generation,
  - idempotency-key validation.
- Pass `session` explicitly into every Mongoose read/write inside checkout and cancellation transaction flows.
- Keep transaction operations sequential. Do not use parallel promise helpers inside a transaction.
- Prefer conditional database writes over read-then-write checks for stock and coupon max-use enforcement.

## Frontend Patterns To Preserve

- API calls stay behind `Frontend/Ecommerce-main/my-app/src/api/*.js`.
- Shared cart state stays in `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
- Checkout and cart page tests use existing CRA/Jest and React Testing Library patterns with API module mocks.
- UI behavior remains in the existing checkout/cart/sidebar screens. No visual redesign is needed for this phase.

## Frontend Patterns To Add

- Normalize cart items at the store boundary before storing them in `items`.
- Expose one view model with stable fields: `id`, `cartItemId`, `productId`, `name`, `image`, `size`, `quantity`, `unitPrice`, `lineTotal`, `source`, and optional `raw`.
- Keep mutation IDs explicit. Components should use `cartItemId` for backend cart item updates/removals and `id` for stable React keys.
- Version persisted `cart-storage` and migrate older backend/local shapes instead of wiping existing guest carts.
- Generate and pass an `Idempotency-Key` through `ordersApi.create` for checkout attempts.

## Anti-Patterns For Phase 04

- Do not grow `orderController.js` into a long cross-model transaction script.
- Do not add public failpoint routes, headers, or query parameters for tests.
- Do not trust client totals or client line items for order persistence.
- Do not reserve inventory in cart add/update; cart validation is advisory, checkout is authoritative.
- Do not add per-size inventory, payment state, refunds, webhooks, admin fulfillment, or catalog normalization.
- Do not solve cart shape drift separately in `Checkout.jsx`, `Cart.jsx`, and `CartSidebar.jsx`; normalize once in the store.
- Do not install new frameworks or state libraries for this phase.

## Recommended File Ownership

| Concern | Preferred file(s) |
| --- | --- |
| Transactional checkout orchestration | `Backend/services/checkoutService.js` |
| Checkout controller HTTP mapping | `Backend/controllers/orderController.js` |
| Order idempotency and order-number fields/indexes | `Backend/models/Order.js` |
| Cart stock validation | `Backend/controllers/cartController.js` or a small shared cart helper |
| Product stock conditional updates | `Backend/services/checkoutService.js` |
| Coupon conditional updates | `Backend/services/checkoutService.js` |
| Cancellation stock restore | `Backend/controllers/orderController.js` plus service helper |
| Backend transaction test harness | `Backend/test/setup.js` |
| Backend test data | `Backend/test/helpers/factories.js` |
| Cart item normalization | `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` |
| Idempotency header API wrapper | `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` |
| Checkout conflict UX | `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` |
| API/testing documentation | `docs/API.md`, `docs/TESTING.md` |

