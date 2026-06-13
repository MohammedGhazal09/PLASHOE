# Roadmap: PLASHOE Production Readiness

## Overview

This roadmap turns the verified PLASHOE gaps into execution phases. The sequence starts with defects already proven by spike 001, then adds test coverage, security hardening, checkout integrity, payment readiness, admin fulfillment, catalog/frontend cleanup, and deployment operations.

## Phases

**Phase Numbering:**

- Integer phases are planned milestone work.
- Decimal phases are reserved for urgent insertions.

- [x] **Phase 1: Core Flow Stabilization** - Fix the current contact, coupon, checkout, and cart contract defects. (completed 2026-06-12)
- [x] **Phase 2: Automated Test Foundation** - Add backend/frontend automated tests around the stabilized purchase path. (completed 2026-06-12)
- [x] **Phase 3: API Security and Validation** - Add API hardening, config validation, dependency remediation, and request allowlists. (completed 2026-06-12)
- [x] **Phase 4: Checkout Data Integrity and Inventory** - Make order creation, coupons, carts, stock, and order numbers consistent under real usage. (completed 2026-06-12)
- [x] **Phase 5: Production Payments** - Replace demo checkout with a real payment flow and payment-state model. (completed 2026-06-12)
- [x] **Phase 6: Admin Fulfillment Operations** - Add admin order fulfillment APIs and operational views. (completed 2026-06-12)
- [x] **Phase 7: Catalog and Frontend Architecture Cleanup** - Normalize product/cart data and reduce fragile frontend/API structure. (completed 2026-06-13)
- [x] **Phase 8: CI/CD, Observability, and Deployment Readiness** - Add pipeline checks, deployment readiness, logging, and environment verification. (completed 2026-06-13)

## Phase Details

### Phase 1: Core Flow Stabilization

**Goal**: The existing storefront purchase path no longer has known contract mismatches from spike 001.
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05
**Canonical refs**: `.planning/spikes/001-core-flow-contract-check/results.json`, `.planning/codebase/CONCERNS.md`, `docs/API.md`
**Success Criteria** (what must be TRUE):

  1. Contact submission calls the implemented API wrapper and does not show false success.
  2. Checkout guest/auth policy is explicit and reachable behavior matches that policy.
  3. Coupon application displays accurate success/discount feedback.
  4. Removing a coupon with no cart returns a safe response.
  5. `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` has no `FAIL` findings.

**Plans**: 3

Plans:
**Wave 1**

- [x] 01-01: Fix contact, coupon, checkout-routing, and remove-coupon defects.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: Update the contract checker or add equivalent focused assertions.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03: Smoke-check the stabilized core flow.

**Cross-cutting constraints:**

- D-16: react19-test-patterns, express-rest-api, and zustand-state-management are supporting guidance only, not extra gates.

### Phase 2: Automated Test Foundation

**Goal**: PLASHOE has automated test coverage for the core backend and frontend flows that currently lack protection.
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Canonical refs**: `docs/TESTING.md`, `.planning/codebase/TESTING.md`, `.planning/spikes/001-core-flow-contract-check/README.md`
**Success Criteria** (what must be TRUE):

  1. Backend test command exists and runs in one-shot mode.
  2. Auth, cart, coupon, order, and contact API paths have meaningful tests.
  3. Frontend tests assert PLASHOE behavior instead of CRA starter content.
  4. Contract-check findings from Phase 1 are covered by automated tests or retained as a runnable check.

**Plans**: 4
Plans:
**Wave 1**

- [x] 02-01: Add backend test runner and app-test structure.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02: Add core API route tests.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03: Replace frontend starter test and add core UI/store tests.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04: Update testing docs, retain the contract checker, and run final verification.

**Cross-cutting constraints:**

- D-30: Backend/.env.example remains untouched.
- D-31: No CI, payment, inventory transaction, admin fulfillment, dependency audit, or frontend tooling migration work enters Phase 2.

### Phase 3: API Security and Validation

**Goal**: Authentication, input handling, configuration, and dependencies meet a defensible baseline for a public ecommerce API.
**Depends on**: Phase 2
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Canonical refs**: `.planning/codebase/CONCERNS.md`, `docs/API.md`, `docs/CONFIGURATION.md`
**Success Criteria** (what must be TRUE):

  1. Login/register/contact/coupon validation have rate limiting and request-size controls.
  2. Backend fails fast when required secrets/configuration are missing.
  3. Controllers use explicit validation/allowlists before persistence.
  4. Dependency audit output is clean or remaining risk is documented.
  5. Token storage risk is reduced or explicitly accepted with compensating controls.

**Plans**: 3

Plans:

**Wave 1**

- [x] 03-01: Add security middleware and startup configuration validation.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02: Add request validators/DTO allowlists.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03: Remediate dependency audit findings and token-storage risk.

**Cross-cutting constraints:**

- D-33: `Backend/.env.example` remains untouched.
- D-22: Avoid Express 5, Mongoose 9, React Router 7, React 19, and CRA-to-Vite migration unless Phase 3 audit evidence requires it.

### Phase 4: Checkout Data Integrity and Inventory

**Goal**: Checkout writes are consistent, stock-aware, and resilient to concurrency and retries.
**Depends on**: Phase 3
**Requirements**: CHK-01, CHK-02, CHK-03, CHK-04
**Canonical refs**: `.planning/codebase/CONCERNS.md`, `Backend/controllers/orderController.js`, `Backend/controllers/cartController.js`, `Backend/models/Product.js`
**Success Criteria** (what must be TRUE):

  1. Order creation cannot leave cart, coupon, order, and inventory state partially updated.
  2. Product stock is enforced before and during checkout.
  3. Order numbers are collision-safe under concurrent order creation.
  4. Frontend cart item shape is normalized at store/API boundaries.

**Plans**: 3
Plans:
**Wave 1**

- [x] 04-01: Transactional checkout and idempotency foundation.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02: Inventory, coupon, and cancellation consistency.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03: Frontend cart normalization and contract documentation.

**Cross-cutting constraints:**

- D-24: New domain conflicts use 409 with success false, message, and errors.
- D-25: Conflict errors are machine-readable.

### Phase 5: Production Payments

**Goal**: Checkout uses a real payment flow with payment status, failure handling, and webhook-backed state updates.
**Depends on**: Phase 4
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Backend/controllers/orderController.js`, `docs/API.md`
**Success Criteria** (what must be TRUE):

  1. Demo payment behavior is removed from customer checkout.
  2. Orders persist payment status independently from fulfillment status.
  3. Successful, failed, canceled, and refunded payment paths are represented.
  4. Payment webhook handling is verified by automated tests.

**Plans**: 5
Plans:
**Wave 1**

- [x] 05-01: Payment state, configuration, and provider seam.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02: Checkout-start payment session integration.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-03: Webhook reconciliation and refund handling.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 05-04: Frontend payment redirect and return states.

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 05-05: Payment docs, static checker, and final verification.

### Phase 6: Admin Fulfillment Operations

**Goal**: Operators can manage orders, statuses, tracking, and admin list views safely.
**Depends on**: Phase 5
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04
**Canonical refs**: `.planning/codebase/CONCERNS.md`, `Backend/models/Order.js`, `docs/API.md`
**Success Criteria** (what must be TRUE):

  1. Admins can list and inspect orders through protected APIs.
  2. Admins can update status, carrier, tracking number, and tracking history.
  3. Admin coupon/contact/order lists are paginated and filterable.
  4. Admin authorization is covered by tests.

**Plans**: 3
Plans:
**Wave 1**

- [x] 06-01: Add admin order API operations and tests.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 06-02: Add fulfillment/tracking workflow.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 06-03: Add pagination/filtering for admin list endpoints.

**Cross-cutting constraints:**

- D-12: Add small shared helpers for common admin list behavior.
- D-13: Do not introduce a full query framework or heavy abstraction in Phase 06.
- D-14: Admin order, coupon, and contact lists should share the response metadata shape success, count, total, page, limit, pages, and data.
- D-31: Keep strict Zod validation and request allowlist behavior from Phase 03.
- D-42: Add focused backend admin order route tests, preferably in Backend/test/admin-order.test.js.
- D-43: Keep fulfillment tests on Vitest/Supertest with the existing in-memory MongoDB setup and existing auth helpers/factories.

### Phase 7: Catalog and Frontend Architecture Cleanup

**Goal**: Product, cart, API, and page logic are easier to maintain and less fragile.
**Depends on**: Phase 6
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04
**Canonical refs**: `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`
**Success Criteria** (what must be TRUE):

  1. Static fallback and backend product data normalize to one internal product shape.
  2. Catalog queries have bounded pagination and supporting indexes.
  3. Contact and coupon API wrappers are split from `ordersApi`.
  4. Checkout/account/product pages have smaller, testable units where current files are doing too much.

**Plans**: 3
Plans:
**Wave 1**

- [x] 07-01: Backend catalog contract, bounds, and indexes.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 07-02: Frontend normalized catalog boundary.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 07-03: API module split, focused extraction, and docs.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-01: Apply react-best-practices, zustand-state-management, mongodb, and api-testing guidance as supporting constraints.
- D-08: Preserve the existing cartStore normalization boundary.
- D-30: Stop extraction when touched logic is delegated and tested; do not chase line counts.

### Phase 8: CI/CD, Observability, and Deployment Readiness

**Goal**: The project can be built, tested, audited, observed, and deployed with repeatable checks.
**Depends on**: Phase 7
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04
**Canonical refs**: `docs/GETTING-STARTED.md`, `docs/CONFIGURATION.md`, `docs/TESTING.md`
**Success Criteria** (what must be TRUE):

  1. CI installs backend/frontend dependencies and runs tests/build/audit checks.
  2. Backend exposes health/readiness behavior suitable for deployment.
  3. Backend logs requests/errors with useful structured context.
  4. Deployment and environment requirements are documented and verified.

**Plans**: TBD
Plans:
**Wave 1**

- [x] 08-01: Add CI workflow for backend/frontend checks.
- [x] 08-02: Add deployment readiness and observability basics.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 08-03: Verify deployment documentation and environment templates.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.

## Progress

**Execution Order:** Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7 -> Phase 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Flow Stabilization | 3/3 | Complete | 2026-06-12 |
| 2. Automated Test Foundation | 4/4 | Complete | 2026-06-12 |
| 3. API Security and Validation | 3/3 | Complete | 2026-06-12 |
| 4. Checkout Data Integrity and Inventory | 3/3 | Complete   | 2026-06-12 |
| 5. Production Payments | 5/5 | Complete    | 2026-06-12 |
| 6. Admin Fulfillment Operations | 3/3 | Complete   | 2026-06-12 |
| 7. Catalog and Frontend Architecture Cleanup | 3/3 | Complete | 2026-06-13 |
| 8. CI/CD, Observability, and Deployment Readiness | 3/3 | Complete    | 2026-06-13 |

## Recommendations

- Start Phase 8 specification/planning next so CI/CD, observability, and deployment readiness validate the cleaned catalog/API architecture.
- Use Phase 7's backend/frontend/build/static checks as the baseline commands for Phase 8 automation.
- Preserve the no-subagent constraint for GSD execution unless the repository instruction changes.
