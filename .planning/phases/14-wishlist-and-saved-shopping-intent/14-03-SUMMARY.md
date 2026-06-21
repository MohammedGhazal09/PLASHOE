---
phase: 14
plan: 03
subsystem: wishlist-ui-surfaces
status: complete
completed: 2026-06-20
tags:
  - frontend
  - wishlist
  - ui
key-files:
  created:
    - Frontend/Ecommerce-main/my-app/src/components/WishlistButton.jsx
    - Frontend/Ecommerce-main/my-app/src/components/WishlistButton.test.jsx
    - Frontend/Ecommerce-main/my-app/src/components/Header.test.jsx
    - Frontend/Ecommerce-main/my-app/src/pages/Account.test.jsx
  modified:
    - Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx
    - Frontend/Ecommerce-main/my-app/src/components/ProductCard.test.jsx
    - Frontend/Ecommerce-main/my-app/src/components/QuickViewModal.jsx
    - Frontend/Ecommerce-main/my-app/src/components/QuickViewModal.test.jsx
    - Frontend/Ecommerce-main/my-app/src/components/Header.jsx
    - Frontend/Ecommerce-main/my-app/src/pages/Account.jsx
metrics:
  tests: 20
---

# Plan 14-03 Summary - Storefront Wishlist Controls, Header Count, and Account Management

## What Changed

- Added reusable `WishlistButton` with accessible save/remove labels, `aria-pressed`, heart icon states, loading state, and feature-flag gating.
- Added wishlist controls to ProductCard and Quick View while preserving existing add-to-cart behavior.
- Added Header wishlist icon/link/count and mobile drawer link when wishlist is enabled.
- Replaced the Account Wishlist placeholder with saved item rendering, size selector, remove, local-device copy, empty state, and move-to-cart behavior.
- Triggered wishlist merge after successful login/register when local saved items exist.
- Added focused tests for WishlistButton, Header, Account Wishlist, and affected ProductCard/QuickView behavior.

## Verification

```powershell
cd Frontend/Ecommerce-main/my-app
npm test -- --run src/components/WishlistButton.test.jsx src/components/ProductCard.test.jsx src/components/QuickViewModal.test.jsx src/components/Header.test.jsx src/pages/Account.test.jsx src/store/wishlistStore.test.js
```

Result: passed, 6 test files, 20 tests.

## Deviations

- None.

## Self-Check

PASSED. Product browsing, Quick View, Header, and Account surfaces expose wishlist state consistently and preserve saved intent when move-to-cart fails.

