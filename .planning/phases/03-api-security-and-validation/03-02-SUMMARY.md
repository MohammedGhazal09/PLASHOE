---
phase: 03-api-security-and-validation
plan: 03-02
subsystem: api-validation
tags: [express, zod, validation, dto, mongoose, supertest]
requires:
  - phase: 03-api-security-and-validation
    provides: 03-01 security middleware and stable error envelopes
provides:
  - Generic request validation middleware
  - Strict auth/account DTO allowlists
  - Strict commerce write DTO allowlists
  - Bounded product query and ObjectId param validation
affects: [api, auth, cart, orders, coupons, contact, products]
tech-stack:
  added: []
  patterns: [req.validated, strict-zod-dtos, route-boundary-validation]
key-files:
  created:
    - Backend/middleware/validate.js
    - Backend/validators/shared.js
    - Backend/validators/auth.js
    - Backend/validators/cart.js
    - Backend/validators/contact.js
    - Backend/validators/coupon.js
    - Backend/validators/order.js
    - Backend/validators/product.js
    - Backend/test/validation.test.js
  modified:
    - Backend/routes/authRoutes.js
    - Backend/routes/cartRoutes.js
    - Backend/routes/contactRoutes.js
    - Backend/routes/couponRoutes.js
    - Backend/routes/orderRoutes.js
    - Backend/routes/productRoutes.js
    - Backend/controllers/authController.js
    - Backend/controllers/couponController.js
    - Backend/controllers/orderController.js
    - Backend/controllers/productController.js
    - Backend/test/auth.test.js
    - Backend/test/cart.test.js
    - Backend/test/contact.test.js
    - Backend/test/order.test.js
key-decisions:
  - "Unknown write fields are rejected with 400 instead of silently stripped to make mass-assignment attempts visible."
  - "Validation writes sanitized values to req.validated and back to req.body/query/params so existing controllers can migrate incrementally."
  - "Product limit is capped at 100 and ObjectId route params fail before database access."
patterns-established:
  - "Resource validators live under Backend/validators and are mounted at route boundaries."
  - "Validation failures return { success: false, message: 'Invalid request', errors }."
requirements-completed: [SEC-03]
duration: 31 min
completed: 2026-06-12
---

# Phase 03 Plan 02: Request Validators and DTO Allowlists Summary

**Strict Zod DTO validation across auth, cart, order, coupon, contact, and product APIs with bounded public query parameters**

## Performance

- **Duration:** 31 min
- **Started:** 2026-06-12T13:58:30Z
- **Completed:** 2026-06-12T14:29:35Z
- **Tasks:** 4
- **Files modified:** 24

## Accomplishments

- Added generic Zod request validation middleware for `body`, `query`, and `params`.
- Added strict schemas for auth/profile/address, cart, order, coupon, contact, and product request surfaces.
- Rejected client-controlled unknown fields such as public `isAdmin`, product hidden fields, contact `isRead`, order `status`, and cart `priceAtAdd`.
- Replaced direct product/coupon raw-body persistence with named sanitized DTO variables.
- Added product query validation for `gender`, `category`, `sale`, `sort`, `page`, and capped `limit` at `100`.
- Added ObjectId validation for product, order, contact, cart item, and coupon params covered by this plan.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generic validation middleware and schema utilities** - `316d096` (`feat`)
2. **Task 2: Validate auth, profile, and address writes** - `9342fba` (`feat`)
3. **Task 3: Validate commerce write payloads before persistence** - `a5de7b9` (`feat`)
4. **Task 4: Validate public product query and route params** - `6b95254` (`feat`)

## Files Created/Modified

- `Backend/middleware/validate.js` - Generic request validation middleware and stable validation error envelope.
- `Backend/validators/*.js` - Resource DTO schemas and shared schema utilities.
- `Backend/routes/*.js` - Route-boundary validation wiring.
- `Backend/controllers/authController.js` - Address DTO persistence without raw body mutation.
- `Backend/controllers/productController.js` - Sanitized admin DTO variables and normalized product listing query values.
- `Backend/controllers/orderController.js` - Shipping validation moved to route-boundary DTO.
- `Backend/controllers/couponController.js` - Sanitized admin coupon DTO variable.
- `Backend/test/validation.test.js` - Cross-resource unknown-field, query, limit, and param validation coverage.

## Decisions Made

- Rejected unknown write fields rather than stripping them. Recommendation: keep this strict behavior during future API expansion and intentionally add fields to schemas when new API contracts are approved.
- Kept the controller response envelope compatible with existing frontend expectations while adding an optional `errors` array for validation details.
- Used `req.validated` as the long-term seam, while assigning sanitized values back onto `req.body`, `req.query`, and `req.params` to reduce controller churn.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Verification

- `cd Backend && npm test` - passed, 9 files / 52 tests.
- `rg "Product\\.create\\(req\\.body\\)|findByIdAndUpdate\\([^\\n]*req\\.body|addresses\\.push\\(req\\.body\\)" Backend/controllers` - no matches.
- `rg "validateRequest|z\\.object|strict\\(" Backend/middleware Backend/validators Backend/routes` - found validator middleware, strict schemas, and route wiring.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `03-03`: dependency remediation, frontend token storage, public config hygiene, risk register, docs, and final verification can proceed on top of the hardened backend API contract.

---
*Phase: 03-api-security-and-validation*
*Completed: 2026-06-12*
