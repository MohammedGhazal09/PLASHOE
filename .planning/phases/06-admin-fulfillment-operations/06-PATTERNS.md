# Phase 06 Patterns: Admin Fulfillment Operations

**Created:** 2026-06-13
**Status:** Ready for execution planning

## Existing Local Patterns To Preserve

| Pattern | Source | Use in Phase 6 |
| --- | --- | --- |
| Importable Express app | `Backend/app.js` exports `app` for Supertest. | Mount `/api/admin/orders` without starting a listener in tests. |
| Thin route modules | `Backend/routes/orderRoutes.js`, `couponRoutes.js`, `contactRoutes.js` | Keep route files to path/middleware/validator wiring. |
| `protect` plus `admin` | `Backend/middleware/auth.js` and admin resource routes | Apply to every admin order route and changed admin list route. |
| Zod request validation | `Backend/middleware/validate.js`, `Backend/validators/*.js` | Validate admin params/query/body before controllers. |
| Controller as HTTP mapper | `Backend/controllers/orderController.js` delegates checkout to services. | Put fulfillment transition logic in a service, not in controller branches. |
| Domain conflicts with `errors` | Checkout and cart conflicts use status `409` and codes. | Use `INVALID_FULFILLMENT_TRANSITION`, `PAYMENT_NOT_SHIPPABLE`, `TRACKING_REQUIRED`, `ORDER_NOT_FOUND`. |
| Mongoose schema indexes | `Backend/models/Order.js` has scoped idempotency index. | Add minimal query-support indexes on Order, Coupon, and ContactMessage. |
| Supertest route tests | `Backend/test/order.test.js` | Add admin order and admin list route tests. |
| Frontend wrapper tests | `Frontend/Ecommerce-main/my-app/src/api/ordersApi.test.js` | Add `adminApi.test.js` with mocked shared Axios. |
| API docs endpoint table | `docs/API.md` | Add admin order/list/fulfillment routes and wrappers. |

## Recommended Backend Module Shape

| Module | Responsibility | Notes |
| --- | --- | --- |
| `Backend/utils/adminListQuery.js` | Pagination parsing helpers, metadata builder, escaped regex, and date-range helpers. | Keep it generic and small. Do not create a query framework. |
| `Backend/validators/adminOrder.js` | Admin order list query, order id params, and fulfillment update body. | Use strict schemas and shared primitives. |
| `Backend/controllers/adminOrderController.js` | HTTP responses for admin list/detail/fulfillment update. | Keep projection/population and service calls here. |
| `Backend/routes/adminOrderRoutes.js` | `/`, `/:id`, and `/:id/fulfillment` admin route wiring. | Use `router.use(protect, admin)` or per-route middleware. |
| `Backend/services/fulfillmentService.js` | Payment gate, status transition, tracking/timestamp/history rules. | The service owns domain conflicts and no-op retry detection. |

Recommendation: create the admin order route foundation before fulfillment transitions so tests and docs have stable endpoint names.

## Recommended Query Pattern

Admin list endpoints should:

1. Parse `page` and `limit` with defaults `page=1`, `limit=20`, max `limit=100`.
2. Reject invalid values with the existing validation envelope.
3. Build a Mongoose filter only from approved fields.
4. Run `countDocuments(filter)` and `find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)`.
5. Return:

```json
{
  "success": true,
  "count": 20,
  "total": 45,
  "page": 1,
  "limit": 20,
  "pages": 3,
  "data": []
}
```

Recommendation: return the metadata at the top level for all three admin list resources because the context locked this envelope.

## Recommended Fulfillment State Pattern

| Current status | Target status | Required payment status | Required tracking | Result |
| --- | --- | --- | --- | --- |
| `processing` | `shipped` | `paid` or `not_required` | `carrier`, `trackingNumber` | Set shipment fields, `shippedAt`, append `shipped` history. |
| `shipped` | `shipped` | `paid` or `not_required` | existing or supplied tracking fields | No-op if unchanged, or append correction event when tracked fields change. |
| `shipped` | `delivered` | `paid` or `not_required` | complete shipment fields already present | Set `deliveredAt`, append `delivered` history. |

Rejected:

- `pending` to `shipped` or `delivered`.
- `processing` to `delivered`.
- `cancelled` to any fulfillment status.
- `delivered` to any earlier status.
- any shipment attempt for `requires_payment`, `payment_pending`, `payment_failed`, `payment_canceled`, `refunded`, or `partially_refunded`.

Recommendation: use `409` for valid requests blocked by current order/payment state and `400` for malformed request bodies.

## Recommended Test Pattern

| Test Area | Suggested File | What To Prove |
| --- | --- | --- |
| Admin order auth/list/detail | `Backend/test/admin-order.test.js` | `401`, `403`, admin success, two users' orders, filters, metadata, compact list rows, full detail user identity. |
| Fulfillment transitions | `Backend/test/admin-order.test.js` | processing -> shipped -> delivered, tracking requirements, timestamps, no-op retry, correction event, payment-state rejections. |
| Coupon/contact admin lists | `Backend/test/admin-list.test.js` | default/capped pagination, invalid pagination, coupon active/search/date filters, contact read/search/date filters. |
| Customer regression | `Backend/test/admin-order.test.js` or `order.test.js` | customer `/api/orders/:id` still rejects non-owner access. |
| Frontend admin wrappers | `Frontend/Ecommerce-main/my-app/src/api/adminApi.test.js` | paths, query `params`, fulfillment payload, and returned `data`. |

Recommendation: keep all tests route-level or wrapper-level; no admin page/component tests belong in Phase 06.

## Documentation Pattern

Update only `docs/API.md` for this phase:

- Endpoint overview rows for `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `PATCH /api/admin/orders/:id/fulfillment`.
- Updated coupon/contact list rows noting pagination/filtering.
- Admin pagination envelope example.
- Fulfillment request/response examples.
- Transition rules and payment shippability.
- Error status behavior for `400`, `401`, `403`, `404`, and `409`.
- Frontend wrapper mapping for `adminApi`.

Recommendation: keep examples representative. Do not document every possible filter combination.

## Pattern Risks

- Do not move existing coupon/contact routes under `/api/admin/*` in this phase.
- Do not add admin cancellation or refund initiation.
- Do not populate full product documents in admin order detail.
- Do not add production index migration scripts.
- Do not split `contactApi` and `couponApi` out of `ordersApi.js`; Phase 07 owns that cleanup.

---

_Pattern map generated inline because repo instructions forbid subagents._
