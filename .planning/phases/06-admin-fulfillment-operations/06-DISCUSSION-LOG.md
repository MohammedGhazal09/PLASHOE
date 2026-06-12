# Phase 06: admin-fulfillment-operations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 06-admin-fulfillment-operations
**Areas discussed:** Admin route namespace, Admin route/controller files, Fulfillment domain logic, Admin query/pagination helpers, Admin order list search, Admin list indexes, Admin order list payload, Admin order detail population, Fulfillment update endpoint shape, Repeat fulfillment submissions, Same-status tracking corrections, Delivered transition requirements, Error codes, Query validation placement, Frontend admin wrapper placement, Frontend wrapper test style, Backend test file layout, Docs update depth, State conflict status codes, Admin order indexes and migration risk

---

## Admin Route Namespace

| Option | Description | Selected |
|--------|-------------|----------|
| `/api/admin/orders` | Add a dedicated namespace for admin order APIs only. | selected |
| Reuse `/api/orders` | Add admin list/update behavior to existing customer order routes. | |
| Move all admin resources | Move products/coupons/contact/admin orders under `/api/admin/*`. | |

**User's choice:** Approved recommendation.
**Notes:** Keep customer order routes stable and avoid route churn for coupon/contact.

## Admin Route and Controller Files

| Option | Description | Selected |
|--------|-------------|----------|
| Extend customer files | Add admin order behavior to current order route/controller files. | |
| Dedicated admin order files | Add `adminOrderRoutes.js` and `adminOrderController.js`. | selected |
| One broad admin file | Put all admin resources into a single admin route/controller. | |

**User's choice:** Approved recommendation.
**Notes:** Separate operator behavior from customer checkout/list/detail/cancel behavior.

## Fulfillment Domain Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Controller only | Put payment gates and status rules in the admin controller. | |
| Model methods | Put transition methods directly on the Mongoose model. | |
| Service helper | Use a focused fulfillment service/helper. | selected |

**User's choice:** Approved recommendation.
**Notes:** Service owns transition rules, payment gates, timestamps, history append behavior, and domain conflicts.

## Admin Query and Pagination Helpers

| Option | Description | Selected |
|--------|-------------|----------|
| Duplicate per controller | Keep list query logic local to each controller. | |
| Small shared helpers | Share pagination/date/search/envelope helper functions. | selected |
| Full query framework | Introduce a broader query abstraction. | |

**User's choice:** Approved recommendation.
**Notes:** Order/coupon/contact lists need the same envelope without a heavy abstraction.

## Admin Order List Search

| Option | Description | Selected |
|--------|-------------|----------|
| Order number only | Search only `orderNumber`. | |
| Order and user identity | Search `orderNumber`, user `email`, and user `name`. | selected |
| Broad search | Search items, shipping address, phone, and other fields. | |

**User's choice:** Approved recommendation.
**Notes:** Operator search should cover common order/customer lookup without heavy broad search.

## Admin List Indexes

| Option | Description | Selected |
|--------|-------------|----------|
| No indexes | Add filters without schema index support. | |
| Minimal supporting indexes | Add only indexes tied to Phase 06 filters. | selected |
| Broad text indexes | Add broader text/search index coverage. | |

**User's choice:** Approved recommendation.
**Notes:** Support admin queues without expanding into Phase 07 catalog indexing.

## Admin Order List Payload

| Option | Description | Selected |
|--------|-------------|----------|
| Full order documents | Return full order records from list endpoints. | |
| Compact operational summary | Return core order/user/status/tracking summary fields. | selected |
| IDs only | Return minimal identifiers and force detail fetches. | |

**User's choice:** Approved recommendation.
**Notes:** Lists stay light; detail endpoint carries the full payload.

## Admin Order Detail Population

| Option | Description | Selected |
|--------|-------------|----------|
| Raw order only | Return the order without user identity. | |
| Limited user identity | Return order plus user `name` and `email`. | selected |
| Full population | Populate full user and current product documents. | |

**User's choice:** Approved recommendation.
**Notes:** Stored order item snapshots are authoritative for checkout-time item data.

## Fulfillment Update Endpoint Shape

| Option | Description | Selected |
|--------|-------------|----------|
| One fulfillment endpoint | `PATCH /api/admin/orders/:id/fulfillment`. | selected |
| Separate status/tracking endpoints | Split status and tracking updates. | |
| Generic order update | `PUT /api/admin/orders/:id`. | |

**User's choice:** Approved recommendation.
**Notes:** Status and tracking should update atomically.

## Repeat Fulfillment Submissions

| Option | Description | Selected |
|--------|-------------|----------|
| Reject repeats | Return an error when the same update is sent again. | |
| Append duplicate history | Add a history entry for every request. | |
| No-op unchanged retries | Return `200` without appending if nothing changed. | selected |

**User's choice:** Approved recommendation.
**Notes:** Prevent duplicate history from retry clicks.

## Same-Status Tracking Corrections

| Option | Description | Selected |
|--------|-------------|----------|
| Reject corrections | Disallow `shipped` updates when already shipped. | |
| Allow and append | Permit tracking corrections and append a history entry. | selected |
| Overwrite silently | Change fields without recording history. | |

**User's choice:** Approved recommendation.
**Notes:** Operators need correction capability, but the correction should remain visible.

## Delivered Transition Requirements

| Option | Description | Selected |
|--------|-------------|----------|
| Allow from any paid state | Set delivered from any paid/not-required order. | |
| Require shipped | Only `shipped` orders can become `delivered`. | selected |
| Require shipped plus tracking | Require shipped and complete tracking fields. | selected |

**User's choice:** Approved recommendation.
**Notes:** Require current `shipped`; if shipment tracking is missing, reject until completed.

## Fulfillment Conflict Error Codes

| Option | Description | Selected |
|--------|-------------|----------|
| Generic code | Use one code for all fulfillment conflicts. | |
| Small fixed set | Use a few stable machine-readable codes. | selected |
| Many granular codes | Create a large taxonomy of codes. | |

**User's choice:** Approved recommendation.
**Notes:** Approved codes: `INVALID_FULFILLMENT_TRANSITION`, `PAYMENT_NOT_SHIPPABLE`, `TRACKING_REQUIRED`, and `ORDER_NOT_FOUND`.

## Query Validation Placement

| Option | Description | Selected |
|--------|-------------|----------|
| In controllers | Parse/validate list queries directly in controller code. | |
| Extend existing validators | Put list schemas beside relevant resource validators. | selected |
| New admin validators | Add admin-specific validators for admin order queries. | selected |

**User's choice:** Approved recommendation.
**Notes:** Use admin-specific order validators and extend coupon/contact validators for list schemas.

## Frontend Admin Wrapper Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `ordersApi.js` | Add admin methods to the mixed existing wrapper file. | |
| Create `adminApi.js` | Put Phase 06 admin wrapper methods in a new module. | selected |
| Split resource wrappers now | Move contact/coupon wrappers out of `ordersApi.js`. | |

**User's choice:** Approved recommendation.
**Notes:** Satisfies Phase 06 while leaving API-module cleanup for Phase 07.

## Frontend Wrapper Test Style

| Option | Description | Selected |
|--------|-------------|----------|
| No frontend tests | Skip wrapper tests. | |
| Wrapper-only tests | Assert endpoint paths, query params, and payloads. | selected |
| Page/component tests | Add admin UI tests. | |

**User's choice:** Approved recommendation.
**Notes:** Full admin UI is out of scope.

## Backend Test File Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `order.test.js` | Add admin order tests into customer order tests. | |
| Create `admin-order.test.js` | Use a focused admin order test file. | selected |
| One large `admin.test.js` | Combine all admin resources into one file. | |

**User's choice:** Approved recommendation.
**Notes:** Contact/coupon pagination tests can live near their resources.

## Docs Update Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Endpoint table only | Add route rows only. | |
| Examples for key operations | Add route table plus representative query/body examples. | selected |
| Exhaustive examples | Document every filter combination. | |

**User's choice:** Approved recommendation.
**Notes:** Enough detail for implementation and verification without bloating docs.

## State Conflict Status Codes

| Option | Description | Selected |
|--------|-------------|----------|
| All `400` | Treat every invalid fulfillment request as bad input. | |
| `400` vs `409` split | Use `400` for malformed input and `409` for state conflicts. | selected |
| All `409` | Treat all fulfillment rejections as state conflicts. | |

**User's choice:** Approved recommendation.
**Notes:** Matches Phase 04/05 conflict conventions.

## Admin Order Indexes and Migration Risk

| Option | Description | Selected |
|--------|-------------|----------|
| Schema indexes only | Add Mongoose schema indexes without migration script. | selected |
| Migration script | Add an explicit production migration/index-build script. | |
| No index changes | Leave schema indexes unchanged. | |

**User's choice:** Approved recommendation.
**Notes:** Deployment/index-build operations belong to a later readiness phase.

## the agent's Discretion

- Exact helper filenames are flexible if the approved boundaries remain clear.
- Exact compact order-list projection field names are flexible if they preserve the approved operational summary.
- Exact index combinations are flexible if they directly support Phase 06 filters.
- Exact placement of coupon/contact pagination tests is flexible if coverage is complete.

## Deferred Ideas

- Full admin UI pages and dashboard navigation.
- Admin order cancellation.
- Admin refund initiation.
- Moving all admin routes under `/api/admin/*`.
- Splitting `contactApi` and `couponApi` out of `ordersApi.js`.
- Broad full-text/item/address order search.
- Production index migration scripts and deployment/index-build operations.
