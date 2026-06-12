# Phase 6: Admin Fulfillment Operations - Specification

**Created:** 2026-06-13
**Ambiguity score:** 0.10 (gate: <= 0.20)
**Requirements:** 8 locked

## Goal

Admin users can list, inspect, and advance paid orders through fulfillment using protected APIs, while admin order, coupon, and contact lists become paginated and safely filterable.

## Background

Phase 5 made payment state authoritative: provider-backed orders start with fulfillment `status: "pending"` and only verified payment success moves them to `processing` with `paymentStatus: "paid"`. The current backend order routes in `Backend/routes/orderRoutes.js` are customer-oriented: create checkout, list the current user's orders, read one owned/admin-accessible order, and cancel an owned order. `Backend/models/Order.js` already contains fulfillment and tracking fields such as `status`, `paymentStatus`, `trackingNumber`, `carrier`, `estimatedDeliveryDate`, `shippedAt`, `deliveredAt`, and `trackingHistory`, but there is no dedicated admin order list or fulfillment update API. Existing admin product, coupon, and contact routes use `protect` plus `admin`, but coupon and contact admin list endpoints return full collections without pagination. The frontend has customer API wrappers only; no frontend wrapper maps admin order, coupon, or contact operations.

## Requirements

1. **Admin order listing**: Admin users can request a paginated, filterable order list through a dedicated admin order endpoint.
   - Current: `GET /api/orders` returns only the current user's orders and has no admin list semantics, pagination, or filtering.
   - Target: A dedicated admin order list endpoint returns compact order rows for all orders and supports `page`, `limit`, `status`, `paymentStatus`, `q`, `createdFrom`, and `createdTo`.
   - Acceptance: A backend API test with two users' orders proves an admin receives both users' matching orders with pagination metadata, while filters exclude non-matching orders.

2. **Admin order inspection**: Admin users can fetch a full order detail payload through the admin order API without changing the customer order-detail contract.
   - Current: `GET /api/orders/:id` permits owner or admin access but is documented and wrapped as a customer order endpoint.
   - Target: A dedicated admin detail endpoint returns one full order with fulfillment, payment, shipping, tracking, and limited user identity fields.
   - Acceptance: A backend API test proves an admin can inspect another user's order through the admin detail endpoint and the response includes user `name` and `email` but not password fields or unrelated user internals.

3. **Fulfillment transition rules**: Admin fulfillment updates follow explicit status rules and payment gates.
   - Current: Orders have fulfillment statuses, but no admin endpoint validates operational status transitions.
   - Target: Admins can advance eligible orders from `processing` to `shipped` to `delivered`; admin cancellation is not part of this phase; shipping is allowed only when `paymentStatus` is `paid` or `not_required`.
   - Acceptance: Backend API tests prove valid transitions succeed, unpaid/refunded/canceled payment states cannot be shipped, skipped transitions are rejected, and rejected domain-state changes return `409` with a machine-readable `errors` entry.

4. **Tracking update contract**: Admin shipment updates capture carrier, tracking number, tracking history, and fulfillment timestamps in a trustworthy form.
   - Current: `Order` has `carrier`, `trackingNumber`, `estimatedDeliveryDate`, `shippedAt`, `deliveredAt`, and `trackingHistory`, but no API writes them as a controlled fulfillment workflow.
   - Target: Setting an order to `shipped` requires `carrier` and `trackingNumber`; optional `estimatedDeliveryDate`, `description`, and `location` can be recorded; each accepted status/tracking update appends one server-timestamped tracking history event; entering `shipped` sets `shippedAt`; entering `delivered` sets `deliveredAt`.
   - Acceptance: Backend API tests prove `carrier` and `trackingNumber` are required for `shipped`, accepted updates append rather than replace history, and `shippedAt`/`deliveredAt` are set by the server.

5. **Shared admin pagination envelope**: Admin order, coupon, and contact list endpoints return bounded paginated responses.
   - Current: Coupon and contact admin list endpoints load and return entire collections; order admin listing does not exist.
   - Target: Admin order, coupon, and contact lists accept `page` and `limit` with default `limit=20`, maximum `limit=100`, and return `success`, `count`, `total`, `page`, `limit`, `pages`, and `data`.
   - Acceptance: Backend API tests prove each admin list endpoint defaults to 20 items, caps `limit` at 100, rejects invalid pagination, and returns accurate metadata.

6. **Safe admin filtering**: Admin coupon and contact lists expose only bounded operational filters.
   - Current: Coupon and contact admin list endpoints have no filtering and always return all records sorted newest first.
   - Target: Coupon admin list supports `isActive`, `q`, `validFrom`, and `validUntil`; contact admin list supports `isRead`, `q`, `createdFrom`, and `createdTo`; order list filters are limited to the fields named in the admin order listing requirement.
   - Acceptance: Backend API tests prove coupon code search, coupon active/date filters, contact unread filtering, contact search/date filters, and order queue filters each include expected records and exclude non-matching records.

7. **Admin authorization coverage**: Every new or changed admin operation is protected by authentication and admin authorization tests.
   - Current: `protect` and `admin` middleware exist, but Phase 6 admin order operations and list pagination behavior have no route-level coverage.
   - Target: Admin order, coupon list, and contact list admin paths require a bearer token and `isAdmin: true`; customer order ownership behavior remains intact.
   - Acceptance: Tests prove no token returns `401`, a non-admin authenticated user returns `403`, an admin succeeds, and a non-owner customer still cannot inspect another user's order through the customer endpoint.

8. **Admin API wrappers and documentation**: Frontend API wrappers and API docs describe the new admin backend contract without adding full admin pages.
   - Current: `Frontend/Ecommerce-main/my-app/src/api` has customer wrappers only, and `docs/API.md` notes that backend admin endpoints are not mapped by frontend wrappers.
   - Target: Frontend wrapper methods exist for Phase 6 admin order, coupon, and contact list/detail/update operations; `docs/API.md` documents routes, auth requirements, query parameters, transition rules, error responses, and response envelopes.
   - Acceptance: Frontend wrapper tests prove the admin wrapper methods call the expected endpoints with query params and payloads; docs include the Phase 6 admin endpoints and fulfillment constraints.

## Boundaries

**In scope:**
- Dedicated admin order list and detail APIs for all orders.
- Admin fulfillment/status updates for `processing`, `shipped`, and `delivered` orders.
- Carrier, tracking number, optional estimated delivery date, optional tracking event description/location, and append-only tracking history behavior.
- Pagination and safe filtering for admin order, coupon, and contact list endpoints.
- Admin authorization tests for new/changed admin routes.
- Frontend API wrapper methods for Phase 6 admin operations.
- API documentation for the new admin fulfillment and list contracts.

**Out of scope:**
- Full admin UI pages or dashboard navigation - this phase locks backend/API wrapper behavior first.
- Admin order cancellation - customer cancellation and stock restoration already have sensitive payment/inventory rules.
- Admin refund initiation - Phase 5 intentionally handles refunds from provider-origin webhook events only.
- Product admin UI, product catalog pagination/index work, and product query indexes - catalog cleanup is Phase 7.
- Splitting `contactApi` and `couponApi` out of `ordersApi.js` as an architecture cleanup - that is Phase 7.
- Password reset, email verification, wishlist, reviews, and marketing features - they are outside v1 admin fulfillment readiness.
- CI/CD, observability, health/readiness expansion, and deployment verification - those are Phase 8.
- Frontend build-tool migration away from Create React App - that remains deferred unless a later dependency phase requires it.

## Constraints

- Admin routes must use the existing bearer JWT `protect` middleware plus the `admin` middleware.
- Customer order APIs must keep their current ownership semantics unless explicitly documented by this spec.
- Shipping an order must be blocked unless `paymentStatus` is `paid` or `not_required`.
- Invalid fulfillment state transitions must return `409` with `success: false`, a clear message, and a machine-readable `errors` array.
- Admin list endpoints must use bounded pagination with default `limit=20` and max `limit=100`.
- Admin order list payloads must stay compact; full order information belongs on the admin detail endpoint.
- Admin order user data must be limited to operational identity fields such as `name` and `email`.
- Tracking history events must be appended by the backend with server timestamps; clients must not replace the full history array.
- The implementation must not require new third-party services.

## Acceptance Criteria

- [ ] Admin can list all orders through a protected admin order endpoint with `page`, `limit`, `status`, `paymentStatus`, `q`, `createdFrom`, and `createdTo`.
- [ ] Admin can inspect one order through a protected admin detail endpoint and receives payment, fulfillment, shipping, tracking, and limited user identity fields.
- [ ] Non-admin authenticated users receive `403` and unauthenticated requests receive `401` for admin order, coupon, and contact list operations.
- [ ] Customer order detail access still rejects non-owner users through the customer endpoint.
- [ ] Admin can advance an eligible `paid` or `not_required` order from `processing` to `shipped` and then to `delivered`.
- [ ] Admin cannot ship unpaid, refunded, canceled, pending-payment, failed-payment, or invalid-transition orders.
- [ ] Setting `shipped` requires `carrier` and `trackingNumber`.
- [ ] Accepted status/tracking updates append tracking history events and set `shippedAt` or `deliveredAt` when those statuses are reached.
- [ ] Admin order, coupon, and contact list endpoints return `success`, `count`, `total`, `page`, `limit`, `pages`, and `data`.
- [ ] Coupon admin list filters by active state, search text, and validity date range.
- [ ] Contact admin list filters by read state, search text, and created date range.
- [ ] Frontend admin API wrapper tests prove the wrapper calls for admin order, coupon, and contact operations use the documented endpoints and parameters.
- [ ] `docs/API.md` documents the Phase 6 admin routes, query parameters, transition rules, and error responses.

## Ambiguity Report

| Dimension           | Score | Min   | Status | Notes |
|---------------------|-------|-------|--------|-------|
| Goal Clarity        | 0.92  | 0.75  | PASS   | Goal is locked to admin APIs, fulfillment workflow, pagination, wrappers, and docs. |
| Boundary Clarity    | 0.94  | 0.70  | PASS   | Full admin UI, cancellation, refunds, Phase 7 cleanup, and Phase 8 operations are excluded. |
| Constraint Clarity  | 0.83  | 0.65  | PASS   | Payment gates, status transitions, pagination caps, response envelope, and auth constraints are explicit. |
| Acceptance Criteria | 0.90  | 0.70  | PASS   | Requirements map to backend/API wrapper tests plus docs checks. |
| **Ambiguity**       | 0.10  | <=0.20| PASS   | Gate passed after user approved all recommendations. |

Status: PASS = met minimum, WARN = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today for admin fulfillment? | Order model has tracking fields and auth/admin middleware exists; dedicated admin order APIs do not. |
| 1 | Researcher | What is the target delta from current customer order APIs? | Add dedicated admin order list/detail/update APIs and preserve customer order contracts. |
| 2 | Simplifier | What is the minimum viable Phase 6 scope? | Backend admin APIs plus frontend API wrappers and docs; no full admin UI. |
| 3 | Boundary Keeper | Which adjacent work is excluded? | Exclude full admin UI, admin cancellation, refund initiation, product catalog cleanup, API module cleanup, and CI/CD. |
| 3 | Boundary Keeper | What list resources are included? | Admin order, coupon, and contact lists get pagination and safe filtering. |
| 4 | Failure Analyst | What invalid outcomes must be blocked? | Block shipping unpaid/refunded/canceled orders, skipped fulfillment transitions, unbounded list reads, and non-admin access. |
| 4 | Failure Analyst | What must happen to tracking history? | Backend appends server-timestamped tracking events; clients do not replace the full history. |
| 5 | Seed Closer | Which response and verification contracts are locked? | Use bounded pagination envelope, `409` machine-readable domain conflicts, route authorization tests, wrapper tests, and API docs. |

---

*Phase: 06-admin-fulfillment-operations*
*Spec created: 2026-06-13*
*Next step: $gsd-discuss-phase 6 - implementation decisions (how to build what is specified above)*
