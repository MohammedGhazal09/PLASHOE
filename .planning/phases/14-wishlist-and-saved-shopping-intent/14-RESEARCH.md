# Phase 14: Wishlist and Saved Shopping Intent - Research

**Created:** 2026-06-20
**Status:** Complete

## Research Scope

Phase 14 needs wishlist persistence for authenticated users, explicit local wishlist behavior for guests, safe reconciliation after login/register, consistent storefront controls, Account management, tests, docs, and verification. Research focused on current cart/auth patterns, backend route validation, normalized product identity, storefront components, and account/header integration points.

## Findings

### Current Backend State

- `Backend/app.js` has no `/api/wishlist` route.
- `Backend/models/Cart.js` uses one document per authenticated user, which is the closest persistence pattern for wishlist.
- `Backend/routes/cartRoutes.js` applies `router.use(protect)` because all cart endpoints require auth.
- `Backend/controllers/cartController.js` returns `{ success, data }` for resource reads/mutations and uses 404 for missing products.
- `Backend/validators/shared.js` already exposes strict object and ObjectId validation helpers.
- `Backend/test/cart.test.js` provides the route-test pattern for protected ecommerce resources.
- `Backend/test/helpers/factories.js` has user and product factories but no wishlist factory yet.

### Current Frontend State

- `config.features.wishlist` exists but currently defaults to disabled unless `REACT_APP_ENABLE_WISHLIST=true`.
- No `wishlistApi.js` or `wishlistStore.js` exists.
- `cartStore.js` is the closest frontend model for authenticated backend sync plus guest local persistence.
- `authStore.js` owns login/register success state. Account login/register handlers are a low-risk reconciliation hook without coupling authStore to wishlistStore.
- `normalizeProduct.js` produces `id` values that may be backend Mongo ObjectIds or local fallback ids such as `local-male-0`.
- `ProductCard.jsx` and `QuickViewModal.jsx` already know product name, image, price, and size defaults.
- `Header.jsx` already displays cart count with MUI Badge and can add a wishlist count using the same dependency.
- `Account.jsx` has a Wishlist tab placeholder and existing login/register flow.

### Implementation Direction

- Add a backend `Wishlist` model with unique `user` and item array of `{ product, addedAt }`.
- Add strict Zod schemas in `Backend/validators/wishlist.js`.
- Add protected wishlist routes at `/api/wishlist`.
- Add `wishlistApi.js` with thin wrappers over the shared Axios instance.
- Add `wishlistStore.js` with persisted local state, backend-safe ObjectId detection, normalization helpers, and merge/sync actions.
- Trigger authenticated merge from Account after successful login/register; keep local-only fallback items local.
- Add reusable `WishlistButton` and wire it into ProductCard, QuickView, Header, and Account.
- Keep move-to-cart as frontend orchestration through existing `cartStore.addItem` and remove only after cart add succeeds.

### Verification Direction

- Backend tests should prove auth rejection, add/list/remove, duplicate add, invalid validation, missing product, and safe missing remove.
- Frontend tests should cover API wrapper paths/payloads, store guest/auth/merge/local-only behavior, WishlistButton or ProductCard toggling, QuickView state, Header count/link, Account render/remove/move-to-cart.
- Browser smoke should verify desktop and mobile wishlist surfaces have no overlap or horizontal overflow.
- Build should run after route/component/store changes.

## Recommendation

Plan Phase 14 as four execution waves:

1. Backend wishlist model, controller, validator, route, and tests.
2. Frontend wishlist API/store, feature flag default, and store tests.
3. Storefront, Header, Account, and move-to-cart UI integration.
4. Focused tests, docs, browser smoke, final verification, and closeout.

This keeps persistence, state reconciliation, UI integration, and verification independently reviewable while preserving the cart and checkout semantics already validated in prior phases.

