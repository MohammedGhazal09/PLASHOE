# Phase 06: admin-fulfillment-operations - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 06 adds protected admin fulfillment operations for paid or legacy non-provider orders: dedicated admin order list/detail/update APIs, bounded pagination and safe filtering for admin order/coupon/contact lists, frontend admin API wrapper methods, and API documentation. The phase implements operator-facing backend contracts and wrapper coverage only; it does not add full admin UI pages, admin cancellation, refund initiation, catalog architecture cleanup, or deployment operations.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `06-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `06-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Dedicated admin order list and detail APIs for all orders.
- Admin fulfillment/status updates for `processing`, `shipped`, and `delivered` orders.
- Carrier, tracking number, optional estimated delivery date, optional tracking event description/location, and append-only tracking history behavior.
- Pagination and safe filtering for admin order, coupon, and contact list endpoints.
- Admin authorization tests for new/changed admin routes.
- Frontend API wrapper methods for Phase 6 admin operations.
- API documentation for the new admin fulfillment and list contracts.

**Out of scope (from SPEC.md):**
- Full admin UI pages or dashboard navigation - this phase locks backend/API wrapper behavior first.
- Admin order cancellation - customer cancellation and stock restoration already have sensitive payment/inventory rules.
- Admin refund initiation - Phase 5 intentionally handles refunds from provider-origin webhook events only.
- Product admin UI, product catalog pagination/index work, and product query indexes - catalog cleanup is Phase 7.
- Splitting `contactApi` and `couponApi` out of `ordersApi.js` as an architecture cleanup - that is Phase 7.
- Password reset, email verification, wishlist, reviews, and marketing features - they are outside v1 admin fulfillment readiness.
- CI/CD, observability, health/readiness expansion, and deployment verification - those are Phase 8.
- Frontend build-tool migration away from Create React App - that remains deferred unless a later dependency phase requires it.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Execution Boundaries
- **D-01:** Use installed local skills as supporting guidance: `express-rest-api`, `mongodb`, and `api-testing`.
- **D-02:** Do not install duplicate external skills for Phase 06 unless planning discovers a concrete missing capability. The local skills cover Express routes, Mongoose querying/indexing, and Supertest-style route verification.
- **D-03:** Do not use subagents while the repository instruction says not to use subagents. Research, planning, and execution should run inline unless the user later changes that instruction.

### Admin Routing and File Boundaries
- **D-04:** Add new admin order endpoints under `/api/admin/orders`.
- **D-05:** Keep existing customer `/api/orders` routes stable. Do not reuse customer order list/detail/cancel routes for admin list/update behavior.
- **D-06:** Do not move existing coupon/contact admin routes under `/api/admin/*` in Phase 06. Keep pagination/filtering changes on the current `/api/coupons` and `/api/contact` admin endpoints.
- **D-07:** Create dedicated backend files such as `Backend/routes/adminOrderRoutes.js` and `Backend/controllers/adminOrderController.js` for admin order behavior.
- **D-08:** Avoid one broad `adminRoutes.js` file for all resources; it would mix order fulfillment with unrelated admin resources.

### Fulfillment Domain Logic
- **D-09:** Put payment-gate and fulfillment-transition rules in a focused service/helper such as `Backend/services/fulfillmentService.js`.
- **D-10:** Keep admin order controllers as HTTP mapping layers. They may parse request data and call service functions, but should not own status-transition logic directly.
- **D-11:** The fulfillment service should validate payment shippability, status transition sequence, required tracking fields, timestamp assignment, tracking history append behavior, and domain conflict errors.

### Admin Query and Pagination Helpers
- **D-12:** Add small shared helpers for common admin list behavior: pagination parsing, `page`/`limit` bounds, date range filters, escaped regex search, and pagination metadata.
- **D-13:** Do not introduce a full query framework or heavy abstraction in Phase 06.
- **D-14:** Admin order, coupon, and contact lists should share the response metadata shape: `success`, `count`, `total`, `page`, `limit`, `pages`, and `data`.

### Admin Order Search and Payloads
- **D-15:** Admin order `q` search should cover `orderNumber` plus limited user `email` and `name` lookup.
- **D-16:** Do not add broad item-name, address, phone, or full-text search in Phase 06 unless needed to satisfy the locked acceptance criteria.
- **D-17:** Admin order list rows should be compact operational summaries: `_id`, `orderNumber`, limited user `name`/`email`, `status`, `paymentStatus`, `total`, item count, tracking summary, `createdAt`, and `updatedAt`.
- **D-18:** Admin order detail should return the full order plus limited user `name` and `email`.
- **D-19:** Keep order items as stored order snapshots in admin detail responses. Do not populate full current product documents for Phase 06 detail payloads.

### Fulfillment Update Contract
- **D-20:** Use one fulfillment update endpoint, `PATCH /api/admin/orders/:id/fulfillment`.
- **D-21:** The fulfillment update endpoint should atomically handle status, carrier, tracking number, optional estimated delivery date, optional description, optional location, timestamps, and tracking history append behavior.
- **D-22:** Repeating the same fulfillment update should return `200` as a no-op when no tracked fields changed.
- **D-23:** Do not append duplicate tracking history entries for unchanged retry submissions.
- **D-24:** Allow same-status `shipped` tracking corrections when carrier, tracking number, estimated delivery date, description, or location changes. Append a new `shipped` history event for the correction.
- **D-25:** Setting `delivered` must require the current status to be `shipped`.
- **D-26:** If a delivered transition finds required shipment tracking fields missing, reject it until the shipment record is complete.

### Fulfillment Errors and Validation
- **D-27:** Use `400` for malformed request shape, invalid query values, and Zod validation failures.
- **D-28:** Use `409` for valid fulfillment requests blocked by current order/payment state.
- **D-29:** Use a small fixed set of fulfillment conflict codes: `INVALID_FULFILLMENT_TRANSITION`, `PAYMENT_NOT_SHIPPABLE`, `TRACKING_REQUIRED`, and `ORDER_NOT_FOUND`.
- **D-30:** Admin query schemas should live in admin-specific validators, likely `Backend/validators/adminOrder.js`, with list query schemas added to coupon/contact validators.
- **D-31:** Keep strict Zod validation and request allowlist behavior from Phase 03.

### Indexing and MongoDB Behavior
- **D-32:** Add minimal schema-level supporting indexes for the admin filters introduced in Phase 06.
- **D-33:** Order indexes should support common admin queue filters and sorts such as fulfillment status, payment status, creation date, and order number.
- **D-34:** Coupon indexes should support active-state, code/search, and validity date filtering.
- **D-35:** Contact indexes should support read-state, created-date, and email/search filtering.
- **D-36:** Do not add a production migration script for Phase 06 indexes. Use Mongoose schema-level indexes and leave production rollout/index-build operations to later deployment readiness work.

### Frontend Admin API Wrappers
- **D-37:** Add frontend admin wrapper methods in `Frontend/Ecommerce-main/my-app/src/api/adminApi.js`.
- **D-38:** Do not add Phase 06 admin wrapper methods to `ordersApi.js`; avoid growing the existing mixed module further.
- **D-39:** Do not split `contactApi` and `couponApi` out of `ordersApi.js` in Phase 06. That architecture cleanup is explicitly Phase 07.
- **D-40:** Frontend admin wrapper methods should cover admin order list, admin order detail, fulfillment update, admin coupon list, and admin contact list operations.
- **D-41:** Frontend tests should be wrapper-only Jest tests that assert endpoint paths, query params, and payloads. Do not add admin page/component tests in Phase 06 because full admin UI is out of scope.

### Backend Testing Strategy
- **D-42:** Add focused backend admin order route tests, preferably in `Backend/test/admin-order.test.js`.
- **D-43:** Keep fulfillment tests on Vitest/Supertest with the existing in-memory MongoDB setup and existing auth helpers/factories.
- **D-44:** Extend or add resource-specific contact/coupon tests only where admin list pagination/filtering changes need coverage.
- **D-45:** Test no-token `401`, non-admin `403`, admin success, customer ownership regression, valid fulfillment progression, invalid transitions, unpaid/refunded/canceled shipping rejection, required tracking fields, no-op retry behavior, tracking corrections, and delivered transition requirements.

### Documentation
- **D-46:** Update `docs/API.md` with endpoint table entries and examples for admin order list, admin order detail, fulfillment update, coupon list filters, and contact list filters.
- **D-47:** Docs should include query parameters, request body examples, response envelope shape, fulfillment transition rules, payment shippability rules, and 400/401/403/404/409 error behavior.
- **D-48:** Do not add exhaustive examples for every filter combination; document representative examples that make implementation and verification unambiguous.

### the agent's Discretion
- The planner may choose exact helper filenames if the route/controller/service/query-helper boundaries remain clear and testable.
- The planner may choose whether coupon/contact pagination tests live in existing resource test files or new focused files, as long as route behavior is covered.
- The planner may choose exact compact order list projection field names if they preserve the approved operational summary and do not expose sensitive user fields.
- The planner may choose exact index combinations if they directly support the approved Phase 06 filters without expanding into Phase 07 catalog indexing.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/06-admin-fulfillment-operations/06-SPEC.md` - Locked Phase 06 requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase ordering, Phase 06 goal, canonical refs, and planned slices.
- `.planning/REQUIREMENTS.md` - `ADM-01` through `ADM-04` traceability.
- `.planning/STATE.md` - Current project status, prior phase completion, and known open risks.

### Prior Phase Carry-Forward
- `.planning/phases/05-production-payments/05-CONTEXT.md` - Payment-state authority, refund/cancellation boundaries, and fulfillment handoff from paid orders.
- `.planning/phases/05-production-payments/05-SPEC.md` - Locked production payment behavior that Phase 06 must preserve.
- `.planning/phases/04-checkout-data-integrity-and-inventory/04-CONTEXT.md` - Checkout transaction, inventory, cancellation, conflict response, and no admin fulfillment decisions.
- `.planning/phases/03-api-security-and-validation/03-CONTEXT.md` - Strict validators, error envelopes, JWT/admin middleware, and no broad framework decisions.

### Codebase Maps and Docs
- `.planning/codebase/STACK.md` - Express, Mongoose, Vitest, Supertest, CRA/Jest, Axios, and Zustand stack context.
- `.planning/codebase/ARCHITECTURE.md` - Backend route/controller/service/model layering and frontend API wrapper pattern.
- `.planning/codebase/INTEGRATIONS.md` - Bearer auth, MongoDB/Mongoose, frontend API client, and environment context.
- `.planning/codebase/CONCERNS.md` - Admin order management and unbounded admin list endpoint concerns.
- `docs/API.md` - API documentation target for admin routes, filters, fulfillment updates, pagination envelopes, and errors.
- `docs/TESTING.md` - Test command documentation target if Phase 06 changes verification instructions.

### Backend Source Files
- `Backend/app.js` - Express mount point for new `/api/admin/orders` route group.
- `Backend/middleware/auth.js` - Existing `protect` and `admin` middleware required for admin routes.
- `Backend/middleware/validate.js` - Existing Zod validation middleware pattern.
- `Backend/validators/shared.js` - Shared validator primitives for ObjectId, strings, dates/numbers, and strict objects.
- `Backend/validators/order.js` - Existing order param/body validators and likely source for shared order param patterns.
- `Backend/validators/coupon.js` - Coupon list-query schema extension target.
- `Backend/validators/contact.js` - Contact list-query schema extension target.
- `Backend/routes/orderRoutes.js` - Customer order routes to preserve.
- `Backend/routes/couponRoutes.js` - Existing coupon admin route to add pagination/filtering validation.
- `Backend/routes/contactRoutes.js` - Existing contact admin route to add pagination/filtering validation.
- `Backend/controllers/orderController.js` - Customer order controller to preserve.
- `Backend/controllers/couponController.js` - Coupon list pagination/filter target.
- `Backend/controllers/contactController.js` - Contact list pagination/filter target.
- `Backend/models/Order.js` - Fulfillment status, payment status, tracking fields, timestamps, tracking history, and index target.
- `Backend/models/Coupon.js` - Coupon active/code/validity fields and index target.
- `Backend/models/ContactMessage.js` - Contact read/email/date fields and index target.
- `Backend/models/User.js` - Limited admin order user identity population target.
- `Backend/test/helpers/auth.js` - Auth header helper for admin/non-admin tests.
- `Backend/test/helpers/factories.js` - User, order, coupon, and contact factories to extend or reuse.
- `Backend/test/order.test.js` - Existing customer order/cancellation tests to avoid disrupting and to mirror style.
- `Backend/test/contact.test.js` - Contact route test file to extend or complement.

### Frontend Source Files
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` - Shared API client with bearer token attachment and 401 logout behavior.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` - Existing customer order/contact/coupon wrapper file; avoid growing this for admin.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.test.js` - Existing wrapper test style to mirror for `adminApi`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/app.js`: already mounts resource routers under `/api/*`; new admin order router should mount here without disrupting customer `/api/orders`.
- `Backend/middleware/auth.js`: existing `protect` and `admin` middleware provide the required auth boundary for admin routes.
- `Backend/middleware/validate.js`: existing strict Zod parsing pattern should validate admin params, query strings, and fulfillment bodies before controller logic.
- `Backend/validators/shared.js`: reusable ObjectId, string, number, and strict object helpers for new admin schemas.
- `Backend/models/Order.js`: already has `status`, `paymentStatus`, `trackingNumber`, `carrier`, `estimatedDeliveryDate`, `shippedAt`, `deliveredAt`, and `trackingHistory`.
- `Backend/test/helpers/auth.js`: can create bearer auth headers for admin and non-admin route tests.
- `Backend/test/helpers/factories.js`: can create users, orders, coupons, and contact messages for admin route tests.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js`: shared Axios instance already attaches bearer tokens; admin API wrappers should use it.

### Established Patterns
- Backend uses ES modules and explicit `.js` relative imports.
- Route files stay thin and apply middleware; controllers map HTTP; services own multi-field domain rules.
- Validation errors return `400` with `{ success: false, message: "Invalid request", errors }`.
- Domain conflicts use `409` with `{ success: false, message, errors }`.
- Admin-only routes use `protect` plus `admin`.
- Frontend resource API modules import the shared Axios instance and return `data`.
- Frontend wrapper tests mock `./axios` and assert endpoint, payload, and config arguments.

### Integration Points
- New `/api/admin/orders` route group connects `Backend/app.js`, a new admin order router, `protect`/`admin`, admin order validators, admin order controller, fulfillment service, `Order`, and limited `User` population.
- Fulfillment updates connect payment status from Phase 05 with fulfillment status/tracking fields already present on `Order`.
- Coupon/contact pagination connects existing route/controller/model files to shared admin list helper behavior.
- Frontend `adminApi` connects admin wrappers to the shared Axios auth/401 behavior without adding pages.
- Documentation connects `docs/API.md` endpoint tables, request/response examples, errors, and frontend wrapper inventory.

</code_context>

<specifics>
## Specific Ideas

- User approved all Phase 06 discussion recommendations on 2026-06-13.
- Phase 06 should add `/api/admin/orders` without moving existing coupon/contact admin paths.
- Admin order code should use dedicated admin order route/controller files and a focused fulfillment service/helper.
- Admin list behavior should be shared through small helper functions rather than duplicated or over-abstracted.
- Frontend admin wrappers should live in a new `adminApi.js` file; full admin UI remains out of scope.
- Backend tests should include a focused `admin-order.test.js` or equivalent focused file.
- No phase-matched todos were found during discussion.

</specifics>

<deferred>
## Deferred Ideas

- Full admin UI pages and dashboard navigation remain outside Phase 06.
- Admin order cancellation remains outside Phase 06.
- Admin refund initiation remains outside Phase 06.
- Moving all admin routes under `/api/admin/*` remains outside Phase 06.
- Splitting `contactApi` and `couponApi` out of `ordersApi.js` remains Phase 07 cleanup.
- Broad item/address/full-text order search remains outside Phase 06.
- Production index migration scripts and deployment/index-build operations remain Phase 08 or later deployment-readiness work.

</deferred>

---

*Phase: 06-admin-fulfillment-operations*
*Context gathered: 2026-06-13*
