---
phase: 06-admin-fulfillment-operations
status: complete
researched: 2026-06-13
sources: codebase-and-local-docs
skills_used: [express-rest-api, mongodb, api-testing]
external_skill_installs: none
---

# Phase 06 Research: Admin Fulfillment Operations

## Research Scope

Phase 06 adds protected admin order operations, fulfillment transitions, bounded admin list pagination/filtering, frontend admin API wrappers, and API documentation. Research focused on what is already present in the PLASHOE backend/frontend and how to plan this without changing the customer order contract, payment provider flow, or frontend admin UI scope.

No external skills were installed. The useful local skills are `express-rest-api` for route/controller/error-contract planning, `mongodb` for Mongoose query/index behavior, and `api-testing` for Vitest/Supertest and frontend wrapper test coverage.

## Sources

- `.planning/phases/06-admin-fulfillment-operations/06-SPEC.md`
- `.planning/phases/06-admin-fulfillment-operations/06-CONTEXT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/TESTING.md`
- `docs/API.md`
- `Backend/app.js`
- `Backend/routes/orderRoutes.js`
- `Backend/routes/couponRoutes.js`
- `Backend/routes/contactRoutes.js`
- `Backend/controllers/orderController.js`
- `Backend/controllers/couponController.js`
- `Backend/controllers/contactController.js`
- `Backend/middleware/auth.js`
- `Backend/middleware/validate.js`
- `Backend/validators/shared.js`
- `Backend/validators/order.js`
- `Backend/validators/coupon.js`
- `Backend/validators/contact.js`
- `Backend/models/Order.js`
- `Backend/models/Coupon.js`
- `Backend/models/ContactMessage.js`
- `Backend/test/order.test.js`
- `Backend/test/contact.test.js`
- `Backend/test/helpers/auth.js`
- `Backend/test/helpers/factories.js`
- `Frontend/Ecommerce-main/my-app/src/api/axios.js`
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.test.js`

## Key Findings

### R-01: Phase 06 should use a dedicated admin order route group

`Backend/app.js` currently mounts customer order routes at `/api/orders`. Those routes are authenticated and customer-oriented: create checkout, list the current user's orders, fetch an owned/admin-accessible order, and cancel an owned order.

Recommendation: add `Backend/routes/adminOrderRoutes.js` and mount it at `/api/admin/orders` in `Backend/app.js`. Keep `/api/orders` behavior stable and do not overload it with admin list/update behavior.

### R-02: Auth and admin authorization primitives already exist

`Backend/middleware/auth.js` exports `protect` for bearer JWT authentication and `admin` for `req.user.isAdmin` authorization. Product, coupon, and contact admin routes already use this pattern.

Recommendation: every new admin order route and every changed admin list route should use `protect` plus `admin`, with route tests proving `401`, `403`, and admin success.

### R-03: Existing validation middleware is the right request boundary

`Backend/middleware/validate.js` parses Zod `params`, `query`, and `body`, updates `req.validated`, and returns `400` envelopes for malformed requests. Existing validators use `strictObject`, `objectIdSchema`, `trimmedString`, and coercion helpers.

Recommendation: add `Backend/validators/adminOrder.js` for admin order params, list query, and fulfillment body; extend `Backend/validators/coupon.js` and `Backend/validators/contact.js` with admin list query schemas. Invalid query/body shape should fail before controller logic.

### R-04: Order already has most fulfillment persistence fields

`Backend/models/Order.js` already includes `status`, `paymentStatus`, `trackingNumber`, `carrier`, `estimatedDeliveryDate`, `shippedAt`, `deliveredAt`, and `trackingHistory`. It also includes provider-backed payment states from Phase 05.

Recommendation: implement fulfillment behavior as a service over existing fields before adding any new schema fields. Add only supporting indexes for admin filtering/sorting.

### R-05: Payment shippability must preserve Phase 05 authority

Phase 05 made payment state authoritative. Provider-backed orders begin as `payment_pending` and only verified webhook success moves them to `paid` and fulfillment `processing`. Legacy/non-provider orders default to `not_required`.

Recommendation: `Backend/services/fulfillmentService.js` should allow shipment only when `paymentStatus` is `paid` or `not_required`, reject refunded/canceled/failed/pending payment states with `409`, and never initiate refunds.

### R-06: Fulfillment transition rules need a single domain seam

Controllers should remain HTTP mapping layers. Transition details are multi-field domain rules: status sequence, payment shippability, required carrier/tracking fields, timestamp assignment, tracking-history append behavior, no-op retries, and correction events.

Recommendation: create `advanceOrderFulfillment` in `Backend/services/fulfillmentService.js`. Return the updated order and a flag/message for no-op retries. Throw errors with `statusCode`, `message`, and `errors` for machine-readable conflicts.

### R-07: Admin order list requires careful user search

The approved `q` search covers `orderNumber` plus limited user `email` and `name`. Order documents reference `user`, so user search requires either a prior bounded `User.find` for matching ids or an aggregation.

Recommendation: use a simple two-step query: build an escaped order-number regex, find limited matching user ids by name/email, then query orders with `$or` over `orderNumber` and `user`. Keep list rows compact and populate only `name email`.

### R-08: Shared admin pagination can stay small

Coupon and contact admin list controllers currently use unbounded `find().sort({ createdAt: -1 })`. The required envelope is the same across admin order, coupon, and contact lists: `success`, `count`, `total`, `page`, `limit`, `pages`, and `data`.

Recommendation: add a small helper such as `Backend/utils/adminListQuery.js` with `escapeRegex`, pagination metadata, and date-range helpers. Avoid introducing a query framework.

### R-09: Frontend admin wrappers can be pure API wrappers

The frontend `ordersApi.js` module currently mixes customer order, public contact, and public coupon wrappers. The shared Axios instance already attaches bearer tokens and handles `401`.

Recommendation: add `Frontend/Ecommerce-main/my-app/src/api/adminApi.js` with wrapper methods for admin order list/detail/fulfillment update, admin coupon list, and admin contact list. Test wrappers by mocking `./axios`, following `ordersApi.test.js`.

### R-10: Existing tests support route-level proof

Backend tests import `app` and use Supertest with MongoMemoryReplSet. Helpers already create users, orders, coupons, contact messages, and bearer headers. Frontend wrapper tests are co-located Jest tests.

Recommendation: add `Backend/test/admin-order.test.js` for admin order and fulfillment behavior, then either extend resource tests or add `Backend/test/admin-list.test.js` for coupon/contact admin list filters. Add `adminApi.test.js` for wrapper paths, query params, and payloads.

## Recommended Plan Shape

1. Admin order read API foundation: shared admin pagination/query helpers, admin order validator/controller/router, `/api/admin/orders` mount, compact list/detail responses, order indexes, and admin authorization/list/detail tests.
2. Fulfillment transition workflow: focused fulfillment service, `PATCH /api/admin/orders/:id/fulfillment`, payment/status/tracking rules, no-op/correction behavior, and backend tests.
3. Admin list pagination plus wrappers/docs: coupon/contact validators/controllers/indexes/tests, frontend `adminApi` wrappers/tests, and `docs/API.md` updates for all Phase 06 contracts.

## Validation Architecture

### Backend

- Use Vitest/Supertest against `Backend/app.js`.
- Use existing `Backend/test/helpers/auth.js` for bearer tokens.
- Use existing factories, extending them only if admin list or fulfillment setup needs narrower helpers.
- Run narrow checks after each wave:
  - `cd Backend && npm test -- admin-order.test.js`
  - `cd Backend && npm test -- admin-list.test.js contact.test.js`
  - `cd Backend && npm test -- order.test.js admin-order.test.js admin-list.test.js`

### Frontend

- Use CRA/Jest wrapper tests without watch mode.
- Mock `Frontend/Ecommerce-main/my-app/src/api/axios.js`.
- Run:
  - `cd Frontend/Ecommerce-main/my-app && npm test -- adminApi.test.js --watchAll=false`
  - `cd Frontend/Ecommerce-main/my-app && npm test -- ordersApi.test.js adminApi.test.js --watchAll=false`

### Static and Documentation Checks

- Use `rg` checks for route mounts, wrapper mappings, and docs strings.
- Full phase verification should include backend tests, frontend wrapper tests, frontend build, and API docs string checks.

## Open Risks

- User search for admin order `q` must stay bounded. Recommendation: use escaped regex and limit user id lookup before querying orders.
- Mongoose schema indexes are declared in code but production index build timing depends on deployment configuration. Recommendation: do not add a production index migration in Phase 06; leave index rollout operations to Phase 08.
- Admin list response envelope changes for existing `/api/coupons` and `/api/contact` admin routes may affect any undocumented consumers. Recommendation: document the new envelope in `docs/API.md` and test only the locked v1 contract.
- Full admin pages remain out of scope. Recommendation: do not add page/component tests or dashboard navigation in this phase.

## RESEARCH COMPLETE

Phase 06 can be planned as three dependent implementation waves using existing Express, Mongoose, Zod, Vitest/Supertest, CRA/Jest, and Axios wrapper patterns.

---

_Phase 06 research complete: 2026-06-13_
