---
phase: 18
plan: 01
subsystem: backend-rma
status: complete
completed: 2026-06-21
tags:
  - returns
  - exchanges
  - refunds
requirements-completed:
  - V2-RMA-01
  - V2-RMA-02
  - V2-RMA-03
  - V2-RMA-04
key-files:
  modified:
    - Backend/app.js
  added:
    - Backend/models/ReturnRequest.js
    - Backend/services/returnRequestService.js
    - Backend/validators/returnRequest.js
    - Backend/controllers/returnRequestController.js
    - Backend/routes/returnRequestRoutes.js
    - Backend/routes/adminReturnRequestRoutes.js
    - Backend/test/return-request.test.js
metrics:
  tasks: 6
  backend_tests: 8
---

# Plan 18-01 Summary - RMA Model, Eligibility, and APIs

## What Changed

- Added `ReturnRequest` persistence with request numbers, type, items, eligibility snapshots, refund intent, and status history.
- Added customer `/api/returns` create/list/detail routes with bearer auth and ownership checks.
- Added admin `/api/admin/returns` list/detail/status routes with admin-only access.
- Added eligibility rules for delivered status, `deliveredAt`, payment state, return window, item ownership, and remaining eligible quantity.
- Added admin transitions for requested, approved, received, rejected, and resolved states.
- Kept refund intent on the RMA only; Stripe webhook fields on `Order` remain untouched.

## Verification

```powershell
cd Backend
npm test -- return-request.test.js
```

Result: passed, 1 test file, 8 tests.

```powershell
cd Backend
npm test -- return-request.test.js payment-webhook.test.js
```

Result: passed, 2 test files, 19 tests.

## Deviations

- Real provider refunds, labels, warehouse integrations, and replacement-order creation are intentionally out of scope.

## Self-Check

PASSED. Backend RMA behavior is persisted, protected, eligibility-gated, admin-resolvable, and isolated from provider refund state.
