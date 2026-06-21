# Phase 14: Wishlist and Saved Shopping Intent - Specification

**Created:** 2026-06-20
**Ambiguity score:** 0.13 (gate: <= 0.20)
**Requirements:** 6 locked

## Goal

Authenticated shoppers can persist a wishlist through backend APIs, guest shoppers can save products locally with explicit persistence messaging, and saved products can be revisited or moved into the cart from consistent storefront/account surfaces.

## Background

The frontend already has a dormant `config.features.wishlist` flag and an Account sidebar item for Wishlist, but the tab only renders "Your wishlist is empty." Product cards and Quick View can add products to cart, but they do not expose wishlist state. Header navigation has account/cart affordances but no saved-item count or wishlist link. The backend has users, products, carts, orders, coupons, and contact messages, but no wishlist model, route, controller, validator, API docs, or tests. Cart behavior already splits authenticated backend persistence from guest local persistence through `cartStore`, which is the closest existing pattern for Phase 14.

## Requirements

1. **Authenticated wishlist persistence**: Authenticated users must be able to list, add, and remove wishlist products through protected backend APIs.
   - Current: No backend wishlist model, route, controller, validator, or API wrapper exists.
   - Target: `GET /api/wishlist`, `POST /api/wishlist/items`, and `DELETE /api/wishlist/items/:productId` exist behind `protect`; product ids are validated; duplicate adds are idempotent; list responses populate product display fields needed by the frontend.
   - Acceptance: Backend tests prove unauthenticated access is rejected, add/list/remove work for an authenticated user, duplicate add does not create duplicate wishlist entries, and invalid/deleted product ids return safe errors.

2. **Guest local wishlist**: Guest shoppers must be able to save and unsave products locally without backend calls.
   - Current: Guest cart items persist locally, but no guest wishlist state exists.
   - Target: A frontend wishlist store persists guest wishlist product snapshots locally, marks guest saves as device-local, and does not call protected wishlist APIs while unauthenticated.
   - Acceptance: Store tests prove guest add/remove/list behavior persists locally and does not call `wishlistApi`; UI tests show guest copy that saved items are device-local and sign-in is needed for cross-device persistence.

3. **Login reconciliation**: Local guest wishlist items must be safely reconciled after login.
   - Current: Login/register only updates auth state; there is no wishlist reconciliation point.
   - Target: After successful login or register, local guest wishlist items are merged into the authenticated backend wishlist without removing existing backend items; local items are cleared only after all merge calls succeed; duplicate product ids are ignored by the backend.
   - Acceptance: Store or account-flow tests prove backend items remain, local guest ids are merged once, duplicate local/backend ids do not duplicate, and failed merge keeps local items available for retry.

4. **Consistent storefront surfaces**: Product card, Quick View, account, and header surfaces must expose wishlist state consistently.
   - Current: Product cards and Quick View only support cart actions; Account has a placeholder Wishlist tab; Header has no saved-item count or wishlist link.
   - Target: Product cards and Quick View render an accessible save/unsave control; Account Wishlist lists saved products with remove and move-to-cart actions; Header exposes a wishlist link/count when the feature is enabled; a reusable wishlist control can be used by the future Phase 15 product detail route.
   - Acceptance: Frontend tests prove a saved product displays selected state in product cards/Quick View, header count updates, Account renders saved products, and all visible wishlist buttons have accessible names.

5. **Move saved intent into cart**: Saved products can be moved to cart without losing the wishlist item when cart add fails.
   - Current: Cart add requires product id, quantity, and size; wishlist has no move behavior.
   - Target: Account Wishlist provides a move-to-cart flow that requires a valid size selection when needed, calls existing cart add behavior, and removes the wishlist item only after cart add succeeds.
   - Acceptance: Frontend tests prove move-to-cart calls cart add with a valid size and removes the wishlist item only on success; failed stock/validation responses leave the wishlist item saved and show an error.

6. **Feature activation, tests, and documentation**: Wishlist behavior must be enabled intentionally, tested, and documented.
   - Current: `REACT_APP_ENABLE_WISHLIST` exists and defaults to disabled; docs describe the dormant flag but no wishlist APIs.
   - Target: Phase 14 enables wishlist by default while preserving `REACT_APP_ENABLE_WISHLIST=false` as a frontend kill switch; backend APIs remain available for authenticated callers; API/development/testing/config docs describe routes, store behavior, guest reconciliation, and test commands.
   - Acceptance: Focused backend and frontend tests pass; docs mention the wishlist API wrapper, backend route contract, guest/auth behavior, feature flag default, and verification evidence.

## Boundaries

**In scope:**
- Backend wishlist persistence model and protected API routes for list/add/remove.
- Frontend `wishlistApi` wrapper and wishlist store with authenticated backend sync plus guest local persistence.
- Safe local-to-authenticated reconciliation after login/register.
- Product card and Quick View save/unsave controls.
- Header wishlist count/link and Account Wishlist list/remove/move-to-cart view.
- Focused backend API tests, frontend API/store/component tests, docs, and verification.

**Out of scope:**
- Full product detail route creation - Phase 15 owns product detail pages; Phase 14 only prepares reusable wishlist controls.
- Wishlist sharing, public saved lists, collaborative lists, and email reminders - these are retention/social features beyond saved shopping intent.
- Price-drop, back-in-stock, or personalized recommendation notifications - Phase 20 owns lifecycle commerce and personalization.
- Wishlist analytics dashboards - outside the Phase 14 shopper-facing goal.
- Native mobile or cross-browser E2E test matrix - focused unit/integration/browser smoke is enough for this phase.
- Changing checkout/cart stock rules - move-to-cart must use existing cart behavior rather than weakening prior checkout guarantees.

## Constraints

- Do all work inline and do not use subagents.
- Do not weaken existing cart, checkout, stock, auth, or admin authorization behavior.
- Backend wishlist routes must use existing auth middleware and Zod request validation patterns.
- Guest wishlist storage must not store tokens or sensitive user data.
- Wishlist product identity must use a normalizer-safe product id contract compatible with `normalizeProduct` (`id` for frontend display, backend `_id` for protected API calls).
- Feature visibility must respect `config.features.wishlist`; after this phase the default is enabled unless explicitly disabled with `REACT_APP_ENABLE_WISHLIST=false`.
- Move-to-cart must not remove a wishlist item until cart add succeeds.

## Acceptance Criteria

- [ ] Unauthenticated `GET /api/wishlist`, `POST /api/wishlist/items`, and `DELETE /api/wishlist/items/:productId` requests return `401`.
- [ ] Authenticated wishlist add/list/remove backend tests pass, including duplicate add and invalid/deleted product cases.
- [ ] `wishlistApi` tests assert endpoint paths and payloads for list/add/remove.
- [ ] Wishlist store tests prove guest local persistence, authenticated backend sync, and local-to-auth merge behavior.
- [ ] ProductCard and QuickView wishlist controls render accessible save/unsave buttons and reflect saved state.
- [ ] Header exposes wishlist count/link when enabled and omits it when the feature flag is disabled.
- [ ] Account Wishlist renders saved products with remove and move-to-cart actions.
- [ ] Move-to-cart removes a wishlist item only after existing cart add succeeds.
- [ ] Docs update API, development, testing, and configuration guidance for wishlist behavior.
- [ ] Focused backend and frontend test commands plus production frontend build are recorded in `14-VERIFICATION.md`.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.90 | 0.75 | PASS | Roadmap success criteria map directly to backend persistence, guest behavior, surfaces, and tests. |
| Boundary Clarity | 0.90 | 0.70 | PASS | Product detail route, notifications, sharing, analytics, and cart-rule changes are excluded. |
| Constraint Clarity | 0.80 | 0.65 | PASS | Existing auth, validation, cart, feature-flag, and product-id constraints are explicit. |
| Acceptance Criteria | 0.86 | 0.70 | PASS | Backend, store, UI, move-to-cart, docs, and verification checks are pass/fail. |
| **Ambiguity** | 0.13 | <=0.20 | PASS | Gate passed. |

## Interview Log

Auto-selected recommended answers per the project workflow instruction to auto-approve defensible recommendations after grey-area questions.

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today for wishlist? | Only config flag and Account placeholder exist; no backend or store implementation exists. |
| 1 | Researcher | Which current pattern should wishlist follow? | Mirror cart's authenticated/backend plus guest/local split, but keep wishlist product-id-only rather than cart line-item shape. |
| 2 | Simplifier | What is the minimum viable wishlist? | List/add/remove persistence, guest local saves, reconciliation, header count, product card/Quick View toggles, Account list, and move-to-cart. |
| 3 | Boundary Keeper | Does Phase 14 create product detail pages? | No; Phase 15 owns product detail routes. Phase 14 creates reusable controls for future product detail use. |
| 3 | Boundary Keeper | Is move-to-cart backend-atomic? | No new cart semantics; frontend adds to cart through existing cart behavior and removes wishlist only after success. |
| 4 | Failure Analyst | What would make guest reconciliation unsafe? | Clearing local saves before successful merge, duplicating backend saves, or deleting existing backend items. These are explicitly prohibited. |
| 5 | Seed Closer | How should the dormant feature flag behave? | Wishlist becomes enabled by default after Phase 14, with `REACT_APP_ENABLE_WISHLIST=false` retained as a frontend kill switch. |

---

*Phase: 14-wishlist-and-saved-shopping-intent*
*Spec created: 2026-06-20*
*Next step: $gsd-discuss-phase 14 - implementation decisions (how to build what is specified above)*
