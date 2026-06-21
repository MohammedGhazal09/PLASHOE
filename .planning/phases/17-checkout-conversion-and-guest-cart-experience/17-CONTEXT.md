# Phase 17: checkout-conversion-and-guest-cart-experience - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 17 reduces checkout friction by making the current account-required checkout policy explicit and by reconciling guest cart contents into the authenticated backend cart before payment. It does not add unauthenticated order creation.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `17-SPEC.md` for full requirements, boundaries, constraints, and acceptance criteria.

Downstream planning MUST read `17-SPEC.md` before implementing. Requirements are not duplicated here.

</spec_lock>

<decisions>
## Implementation Decisions

### Checkout Policy
- **D-01:** Use account-required checkout for Phase 17. This is the safest policy because `Order.user` is required, order routes are protected, and checkout integrity logic depends on authenticated carts.
- **D-02:** Do not add a guest order endpoint in this phase. A true guest checkout would require order ownership, order lookup, email identity, payment metadata, fraud/abuse policy, and admin/customer service rules outside the current phase.
- **D-03:** Shopper-facing copy should state that signing in saves the cart and starts secure payment, without implying that a guest order is available.
- **D-04:** `ProtectedRoute` remains the route-level guard for `/checkout`, `/checkout/success`, `/checkout/cancel`, and `/order/:id`.

### Cart Reconciliation
- **D-05:** Add `POST /api/cart/merge` as a protected endpoint that accepts `{ items: [{ productId, quantity, size }] }`.
- **D-06:** The backend merge endpoint aggregates duplicate incoming product/size lines, adds them to existing backend cart lines, and validates the final quantity against current product stock.
- **D-07:** Merge must be all-or-nothing for backend state: product missing or stock conflict returns an error and does not mutate the backend cart.
- **D-08:** Incoming guest prices are ignored. Backend merge uses current product prices for newly merged cart lines and preserves existing backend cart line prices.
- **D-09:** Frontend local cart items with backend ObjectId product ids are merge candidates; `local-*` or otherwise non-ObjectId products stay local-only and require shopper review/removal before payment.
- **D-10:** `cartStore.mergeLocalCart` owns the auth transition behavior: merge backend-syncable local items, sync backend cart, preserve failed/local-only items, and return a structured result for Account/Checkout UI.

### Auth and Checkout Intent
- **D-11:** Account login/register checks for a `location.state.from.pathname` checkout intent and returns to that path only after cart reconciliation succeeds.
- **D-12:** If cart merge fails during checkout intent, Account sends the shopper to Cart with an explanatory message instead of starting payment.
- **D-13:** Existing wishlist merge behavior from Phase 14 stays intact and runs independently of cart merge.

### Saved Address
- **D-14:** Auth register/login responses should include safe user profile fields needed by checkout: `_id`, `name`, `email`, `phone`, `addresses`, `isAdmin`, and `token`.
- **D-15:** Checkout prefers `user.addresses.find(isDefault)` and falls back to the first saved address.
- **D-16:** Checkout includes an authenticated "Save this address for next time" option that calls the existing protected address API after form validation.
- **D-17:** Saving an address must not weaken backend order validation. Order creation still sends only `shippingAddress` and optional `notes` to `/api/orders`.

### Testing and Verification
- **D-18:** Backend tests cover cart merge auth rejection, duplicate merge, stock conflict no-op, and deleted product no-op/error behavior.
- **D-19:** Store tests cover successful merge, local-only preservation, conflict preservation, and no order/cart loss.
- **D-20:** Account and Checkout tests cover checkout-intent return, merge failure routing, saved address prefill, blocked unresolved local items, and save-address calls.
- **D-21:** Existing Phase 4/5 order tests and checkout return tests remain the regression floor.

### the agent's Discretion
- Exact copy can follow existing PLASHOE tone, but it must be explicit that checkout requires sign-in.
- Exact placement of the cart review alert can follow existing page layout as long as it is accessible and visible before payment actions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream implementation MUST read these before planning or implementing.**

### Locked Requirements
- `.planning/phases/17-checkout-conversion-and-guest-cart-experience/17-SPEC.md` - Locked Phase 17 requirements and acceptance criteria.

### Roadmap and Requirements
- `.planning/ROADMAP.md` - Phase 17 goal, requirements, success criteria, and D-61 constraint.
- `.planning/REQUIREMENTS.md` - V2-CHKX-01, V2-CHKX-02, V2-CHKX-03.
- `.planning/STATE.md` - Product decision note for guest checkout versus account-required merge.

### Backend Contracts
- `Backend/routes/cartRoutes.js` - Protected cart route pattern.
- `Backend/controllers/cartController.js` - Cart add/update/remove/coupon behavior and response shape.
- `Backend/validators/cart.js` - Strict Zod cart payload schemas.
- `Backend/models/Cart.js` - One backend cart per authenticated user.
- `Backend/controllers/orderController.js` - Authenticated order creation entrypoint.
- `Backend/services/checkoutService.js` - Phase 4 checkout integrity logic that must not change.
- `Backend/models/Order.js` - Required user-bound order model.
- `Backend/test/cart.test.js` - Cart API integration test style.
- `Backend/test/order.test.js` - Checkout idempotency, stock, coupon, payment, and conflict regression floor.

### Frontend Contracts
- `Frontend/Ecommerce-main/my-app/src/App.js` - Route protection for checkout/payment return/order detail.
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` - Checkout auth redirect behavior.
- `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` - Login/register hook point and checkout intent UI.
- `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx` - Shopper review surface for unresolved local items.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` - Shipping, payment handoff, retry, and conflict UI.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` - Local/backend cart state and reconciliation behavior.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` - Login/register/fetch profile/address save behavior.
- `Frontend/Ecommerce-main/my-app/src/api/cartApi.js` - Cart API wrapper.
- `Frontend/Ecommerce-main/my-app/src/api/authApi.js` - Address API wrapper.
- `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.jsx` - Payment return regression surface.

### Documentation
- `docs/API.md` - Cart merge and checkout policy API documentation.
- `docs/DEVELOPMENT.md` - Auth-to-checkout/cart merge development notes.
- `docs/TESTING.md` - Phase 17 verification commands.
- `README.md` - High-level checkout policy note if needed.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cartController.addToCart` already contains product existence, size, stock, and same product/size merge behavior that can inform the merge endpoint.
- `wishlistStore.mergeLocalWishlist` provides a proven local-to-authenticated reconciliation pattern from Phase 14.
- `ProtectedRoute` already preserves the original location in `state.from`.
- `Checkout` already handles idempotency keys, 409 sync, hosted payment redirect, and saved-address-ish prefill.

### Established Patterns
- Backend ecommerce resources use protected routers, strict Zod validation, controller logic, and supertest integration coverage.
- Frontend API wrappers return unwrapped response data from shared Axios.
- Zustand stores own local persistence and cross-route side effects.
- Frontend tests prefer Testing Library semantic queries and mocked API modules.

### Integration Points
- Add `mergeCartItems` next to cart add/update/remove controller actions.
- Add `mergeCartItemsSchema` next to cart item validation.
- Add `cartApi.mergeItems`.
- Add `mergeLocalCart` and local-item selectors to `cartStore`.
- Use Account login/register as the auth transition hook.
- Use Checkout mount and submit guards as the last defense before payment start.

</code_context>

<specifics>
## Specific Ideas

- Account unauthenticated checkout intent copy: "Sign in to save your cart and continue to secure checkout."
- Cart review alert: "Some items were saved on this device and need review before checkout."
- Checkout submit button should be disabled while unresolved local items remain.

</specifics>

<deferred>
## Deferred Ideas

- True guest checkout can be a future phase after guest order ownership, email lookup, and support flows are specified.
- Checkout analytics and funnel instrumentation can be added later.
- Full address book management in Account settings remains outside this phase.

</deferred>

---

*Phase: 17-checkout-conversion-and-guest-cart-experience*
*Context gathered: 2026-06-21*
