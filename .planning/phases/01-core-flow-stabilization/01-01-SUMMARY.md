---
phase: 01-core-flow-stabilization
plan: 01-01
subsystem: core-flow
tags: [react, zustand, express, checkout, contact, cart]
requires: []
provides:
  - Contact form calls the implemented contact API wrapper.
  - Checkout submission is authenticated-only with no mock guest order path.
  - Coupon application returns discount metadata and displays a computed discount amount.
  - Coupon removal is idempotent for authenticated users with no cart.
affects: [phase-01-core-flow-stabilization, phase-02-automated-test-foundation]
tech-stack:
  added: []
  patterns:
    - Existing response envelope style with success, message, and data.
    - Zustand async actions return meaningful success or failure payloads.
key-files:
  created:
    - .planning/phases/01-core-flow-stabilization/01-01-SUMMARY.md
  modified:
    - Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx
    - Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx
    - Frontend/Ecommerce-main/my-app/src/store/cartStore.js
    - Backend/controllers/cartController.js
key-decisions:
  - "Used contactApi.submit directly instead of adding a compatibility alias."
  - "Kept checkout authenticated-only and removed the active mock guest submission branch."
  - "Kept removeCoupon idempotent by returning data null when no cart exists."
patterns-established:
  - "Coupon discount is a percentage in state and is converted to a dollar amount only for display."
  - "Contact form data is cleared only after backend success."
requirements-completed: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05]
duration: 10 min
completed: 2026-06-12
---

# Phase 01 Plan 01: Core Source Contract Fixes Summary

**Contact, checkout, coupon, and remove-coupon source contracts now match the locked Phase 1 decisions.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-06-12T11:16:00Z
- **Completed:** 2026-06-12T11:26:00Z
- **Tasks:** 5
- **Files modified:** 4 source files

## Accomplishments

- Contact submission now calls `contactApi.submit(name, email, subject, message)` and reports failures honestly.
- Checkout no longer contains the active mock guest order submission branch and includes a defensive unauthenticated guard.
- Coupon application now returns `discount` and `couponCode`, clears the coupon input only on success, and displays a computed discount amount.
- `DELETE /api/cart/coupon` now returns a successful `data: null` response when no cart exists.

## Task Commits

1. **Fix contact API call and failure handling** - `3ee68ca` (`fix`)
2. **Make checkout submission authenticated-only and align coupon display/store contract** - `44fa19b` (`fix`)
3. **Make remove coupon idempotent with no cart** - `2ca905a` (`fix`)

## Files Created/Modified

- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` - Calls the existing contact API wrapper and preserves form data on failure.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` - Removes mock guest submit behavior, adds an auth guard, clears coupon input on success, and displays computed discount value.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` - Returns coupon result metadata and rejects malformed successful coupon responses.
- `Backend/controllers/cartController.js` - Returns success with `data: null` before populate when no cart exists.

## Decisions Made

- Used `contactApi.submit` directly because the existing wrapper already matches the backend contact endpoint.
- Kept `/checkout` authenticated-only because the route is already protected and public guest checkout is deferred.
- Treated a successful coupon response without numeric `discount` as failure to avoid misleading UI feedback.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The immediate checker run reported `PASS: 5`, `FAIL: 1`, `WARN: 2`. The remaining `remove-coupon-null-cart` failure is a stale/broad checker regex: the source now returns when `cart` is missing before reaching `cart.populate`. Plan `01-02` owns checker alignment and regenerated evidence.

## Verification

- `rg "contactApi\.send|Still show success for demo" Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` -> no banned contact patterns.
- `rg "Mock order for guests|Create an account to track your orders" Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` -> no mock guest checkout branch.
- Focused source search confirmed `contactApi.submit`, `toast.error(message)`, `setCouponInput('')`, `result.discount`, `discountAmount`, and `data: null`.
- `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` -> `{"PASS":5,"FAIL":1,"WARN":2}` with stale checker failure routed to Plan `01-02`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan `01-02` to update the checker pattern and regenerate semantic evidence. No payment, inventory, dependency, schema, or UI redesign work was introduced.

## Self-Check: PASSED

- Source-level acceptance criteria for CORE-01 through CORE-05 are satisfied.
- The one remaining checker failure is classified and handed to the next planned wave.
- Summary created before plan metadata commit.

---
*Phase: 01-core-flow-stabilization*
*Completed: 2026-06-12*
