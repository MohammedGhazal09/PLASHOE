# Phase 14: wishlist-and-saved-shopping-intent - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 14-wishlist-and-saved-shopping-intent
**Areas discussed:** backend wishlist contract, guest/auth policy, frontend store, storefront surfaces, move-to-cart, feature flag, tests/docs

---

## Backend Wishlist Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Single wishlist document per user | `Wishlist` has unique `user` and an array of product items. | yes |
| One document per wishlist item | Each saved product is its own row/document. | |
| Store wishlist on User | Add wishlist array directly to `User`. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** Single document mirrors `Cart.js` and keeps authenticated list operations simple.

---

## API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Protected REST resource | `/api/wishlist` with list/add/remove. | yes |
| Cart subresource | Put wishlist under `/api/cart/saved`. | |
| Product subresource | Save/unsave through `/api/products/:id/wishlist`. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** Dedicated wishlist resource avoids mixing cart line-item semantics with saved intent.

---

## Guest and Auth Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Guest local saves plus automatic additive merge after login | Keep guest saves local, merge backend-safe product ids after login/register, clear only after success. | yes |
| Require sign-in before saving | Hide/disable save for guests. | |
| Prompt before every save | Ask guest to sign in each time. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** The chosen path satisfies explicit guest behavior and safe reconciliation without blocking saved intent.

---

## Local-Only Product IDs

| Option | Description | Selected |
|--------|-------------|----------|
| Local-only fallback handling | Save `local-*` or invalid backend ids locally and do not call protected wishlist APIs. | yes |
| Reject local ids everywhere | Disable wishlist when backend catalog is unavailable. | |
| Send local ids to backend | Let backend reject invalid ids. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** Catalog normalization can produce `local-*` ids during fallback; protected backend APIs require Mongo ObjectIds.

---

## Storefront Surfaces

| Option | Description | Selected |
|--------|-------------|----------|
| Reusable WishlistButton | ProductCard and QuickView use a shared accessible save control; Phase 15 can reuse it. | yes |
| Inline duplicate buttons | Add separate local button code in each surface. | |
| Account-only wishlist | Only expose saved list in Account. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** Reusable control keeps product-card, quick-view, and future product-detail behavior consistent.

---

## Move to Cart

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend orchestrated with existing cart add | Add to cart through `cartStore.addItem`, then remove wishlist item only after success. | yes |
| New backend move endpoint | Create atomic wishlist-to-cart endpoint. | |
| Copy to cart and keep saved | Add to cart without removing wishlist item. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** Existing cart behavior owns stock/size validation; removal after success prevents losing saved intent on failed cart add.

---

## Feature Flag

| Option | Description | Selected |
|--------|-------------|----------|
| Enable by default with false kill switch | Wishlist is visible unless `REACT_APP_ENABLE_WISHLIST=false`. | yes |
| Keep disabled by default | Ship code but require env flag to show it. | |
| Remove the flag | Always show wishlist with no kill switch. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** Phase 14 exists to launch wishlist surfaces, while retaining a kill switch preserves operational flexibility.

---

## Tests and Docs

| Option | Description | Selected |
|--------|-------------|----------|
| Focused backend/frontend tests plus docs | Cover backend routes, API wrapper, store, key components, docs, and build. | yes |
| Browser E2E only | Validate with one browser flow. | |
| Backend only | Add API persistence without UI tests. | |

**User's choice:** Approved recommendation by standing workflow instruction.
**Notes:** The requirement explicitly asks for frontend and backend tests; focused tests match the current repo style.

---

## the agent's Discretion

- Exact component boundaries beyond `WishlistButton`, `wishlistApi`, and `wishlistStore`.
- Exact toast/copy wording, as long as guest-local and merge-failure behavior is explicit.

## Deferred Ideas

- Full product detail route integration belongs to Phase 15.
- Wishlist notifications and lifecycle campaigns belong to Phase 20.
- Wishlist sharing/public lists are outside the current Phase 14 scope.
