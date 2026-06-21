# Phase 17 Research - Checkout Conversion and Guest Cart Experience

**Date:** 2026-06-21
**Mode:** Inline codebase research, no subagents

## Findings

1. `Order.user` is required and order routes use `router.use(protect)`. True guest checkout would require model and ownership changes beyond this phase.
2. `createCheckoutFromCart` uses the authenticated backend cart as the source of truth for stock, coupon, idempotency, payment hold, and cart clearing.
3. `cartStore.syncCart()` currently overwrites local state with backend cart data for authenticated users, so it can erase guest cart items after login.
4. Phase 14 already established a safe pattern for local guest wishlist reconciliation: merge backend-syncable items after auth, preserve local-only items, and do not clear before successful merge.
5. `ProtectedRoute` already passes `location` to Account through `state.from`, so preserving checkout intent needs Account behavior rather than route restructuring.
6. The user model already supports `addresses`; auth responses need to expose addresses and checkout needs to prefer the default address.

## Recommended Approach

- Keep checkout account-required.
- Add a protected backend cart merge endpoint.
- Implement frontend cart merge as an explicit store action.
- Trigger cart merge in Account after login/register when returning to checkout.
- Guard Checkout against unresolved local items.
- Add saved-address prefill/save behavior using existing auth address APIs.

## Risks

- Local fallback catalog products may not be backend-syncable. They should remain local and block checkout until removed.
- Merge endpoint must validate final quantities against current stock to avoid creating carts that later fail checkout.
- Auth tests may need careful mocking because Account coordinates wishlist and cart reconciliation.

## Verification Focus

- Backend cart merge behavior and no-op-on-conflict.
- Store merge success/failure/local-only behavior.
- Account checkout return after auth.
- Checkout blocked state for unresolved local items.
- Existing order and checkout return regression tests.

---

*Research completed inline: 2026-06-21*
