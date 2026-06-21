---
phase: 17
plan: 01
subsystem: backend-cart-merge
status: complete
completed: 2026-06-21
tags:
  - cart
  - auth
  - checkout
requirements-completed:
  - P17-R2
  - P17-R3
  - P17-R5
key-files:
  modified:
    - Backend/controllers/cartController.js
    - Backend/routes/cartRoutes.js
    - Backend/validators/cart.js
    - Backend/test/cart.test.js
metrics:
  tasks: 5
  backend_tests: 18
---

# Plan 17-01 Summary - Backend Cart Merge Contract

## What Changed

- Added protected `POST /api/cart/merge` behind the existing auth middleware.
- Added strict merge payload validation that reuses cart item rules and caps merge batches.
- Implemented duplicate product/size aggregation before cart mutation.
- Added all-or-nothing product and stock conflict handling so failed merges do not mutate the backend cart.
- Preserved existing cart line price/coupon state while adding newly merged items at current product price.
- Covered unauthenticated access, duplicate merge, stock conflict, and missing product conflict behavior.

## Verification

```powershell
cd Backend
npm test -- cart.test.js
```

Result: passed, 1 test file, 18 tests.

```powershell
cd Backend
npm test -- cart.test.js order.test.js
```

Result: passed, 3 test files, 60 tests.

## Deviations

- The phase keeps checkout account-required. True guest order creation stays out of scope because `Order.user`, payment metadata, order history, and cart clearing are authenticated-user contracts.

## Self-Check

PASSED. Backend cart merge behavior is protected, validated, conflict-safe, and covered by focused route tests.
