# Phase 17: Checkout Conversion and Guest Cart Experience - Specification

**Created:** 2026-06-21
**Ambiguity score:** 0.10 (gate: <= 0.20)
**Requirements:** 5 locked

## Goal

Checkout remains account-required, but guest cart items are reconciled into the authenticated backend cart before payment so shoppers do not lose cart contents when signing in to check out.

## Background

Current checkout is already protected in `App.js`, the order routes call `router.use(protect)`, and `Order.user` is required. The backend checkout service depends on authenticated carts for idempotency, stock decrement, coupon usage, payment hold release, and cart clearing. Guest cart items can be stored locally, but a shopper who signs in before checkout can have local cart state overwritten by backend sync, which risks lost items and conversion friction.

## Requirements

1. **Checkout policy**: Account-required checkout is documented and enforced consistently across cart, protected route, account, checkout, API docs, and tests.
   - Current: The app redirects unauthenticated checkout to Account, but the policy is not documented or explained to shoppers.
   - Target: Checkout copy and docs state that signing in is required before payment, and protected route/account flows preserve checkout intent.
   - Acceptance: An unauthenticated checkout attempt lands on Account with checkout-specific copy and returns to `/checkout` after successful sign-in/register when cart reconciliation succeeds.

2. **Guest cart merge**: Backend-syncable guest cart items merge into the authenticated cart without duplicates or silent loss.
   - Current: `syncCart()` overwrites local guest cart state with the backend cart after authentication.
   - Target: A protected cart merge API combines same product/size quantities, validates products/stock, and leaves the backend cart unchanged on conflict.
   - Acceptance: Tests prove duplicate product/size items merge once, stock conflicts return `409`, and failed merges keep local items available for review.

3. **Checkout conflict guard**: Checkout must not start payment while unresolved local-only or conflicted guest items remain in the authenticated cart view.
   - Current: Checkout submits the backend cart only, so unresolved local items could be ignored if they remain in UI state.
   - Target: Checkout blocks payment start until unresolved local cart items are removed or successfully merged.
   - Acceptance: Frontend tests prove unresolved local cart items show an alert, disable payment start, and never call `ordersApi.create`.

4. **Saved address reuse**: Authenticated users can reuse saved address data and optionally save a new checkout address for future checkout.
   - Current: Checkout tries to prefill from `user.addresses[0]`, but login/register responses omit addresses and checkout does not save a new address.
   - Target: Auth responses expose address data safely, checkout prefers the default saved address, and the checkout form can save the submitted address.
   - Acceptance: Tests prove saved default address fields prefill checkout and saving a checkout address calls the protected address API without weakening backend order validation.

5. **Payment flow preservation**: Existing checkout retry, payment return, idempotency, stock, coupon, and cart-conflict guarantees remain intact.
   - Current: Phase 4 and Phase 5 tests cover these guarantees for authenticated checkout.
   - Target: Phase 17 extends cart/auth UI around checkout without changing order creation semantics.
   - Acceptance: Existing order/checkout retry, payment return, and conflict tests still pass, with new tests covering the conversion path.

## Boundaries

**In scope:**
- Account-required checkout policy documentation and shopper-facing copy.
- Protected backend cart merge endpoint for authenticated users.
- Frontend `cartStore` reconciliation action and account login/register integration.
- Checkout guard for unresolved local cart items.
- Saved-address prefill and optional save-address action in checkout.
- Focused backend, frontend store, route, account, checkout, payment-return, and docs verification.

**Out of scope:**
- True guest order creation without a user account - current `Order.user`, payment metadata, order history, and Phase 4 checkout guarantees are user-bound.
- New payment provider behavior - Stripe Checkout start/return/webhook behavior remains from Phase 5.
- Coupon validation for unauthenticated guest carts - guests are still prompted to sign in before coupon application.
- Full address book management UI - Account settings can stay minimal; checkout only saves/reuses addresses.
- Analytics instrumentation for checkout drop-off - useful later, but not required for the phase requirements.

## Constraints

- Preserve Phase 4 idempotency, stock, coupon, and cart clearing behavior by keeping order creation authenticated and backend-cart based.
- Keep cart merge protected by `protect`; no unauthenticated cart mutation endpoint.
- Merge must be all-or-nothing for backend state when product or stock conflicts occur.
- Local fallback products that do not have backend ObjectIds cannot be merged and must remain visible for removal/review.
- No subagents. All work is inline.

## Acceptance Criteria

- [x] Account-required checkout policy is documented in Phase 17 artifacts and user-facing copy.
- [x] `POST /api/cart/merge` validates and merges guest cart payloads for authenticated users.
- [x] Backend merge tests cover duplicate merge, stock conflict, missing product, and auth rejection.
- [x] `cartStore.mergeLocalCart` preserves failed/local-only items and never silently overwrites them.
- [x] Account login/register merges local cart items before returning to checkout.
- [x] Checkout blocks payment while unresolved local cart items remain.
- [x] Checkout pre-fills the default saved address and can save the submitted address.
- [x] Existing order checkout retry/conflict and checkout return tests still pass.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes |
|--------------------|-------|------|--------|-------|
| Goal Clarity       | 0.95  | 0.75 | met    | Account-required policy chosen based on current code contracts. |
| Boundary Clarity   | 0.95  | 0.70 | met    | True guest orders and provider changes are explicit out of scope. |
| Constraint Clarity | 0.85  | 0.65 | met    | Phase 4 checkout integrity is the primary constraint. |
| Acceptance Criteria| 0.85  | 0.70 | met    | API, store, UI, docs, and regression checks are enumerated. |
| **Ambiguity**      | 0.10  | <=0.20 | met  | Ready for context and planning. |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What does checkout require today? | Orders, carts, payment, and order history are authenticated user-bound. |
| 2 | Simplifier | What is the smallest conversion fix that preserves checkout integrity? | Keep account-required checkout and merge guest cart into backend cart on auth. |
| 3 | Boundary Keeper | What is excluded? | True guest orders and payment/provider rewrites are out of scope. |
| 4 | Failure Analyst | What broken outcome must be prevented? | Local guest items must not disappear or be ignored when payment starts. |
| 5 | Seed Closer | How should saved address friction be reduced? | Reuse default saved address and optionally save checkout address. |

---

*Phase: 17-checkout-conversion-and-guest-cart-experience*
*Spec created: 2026-06-21*
*Next step: $gsd-discuss-phase 17 - implementation decisions*
