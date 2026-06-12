# Roadmap: PLASHOE Production Readiness

## Overview

This roadmap turns the verified PLASHOE gaps into execution phases. The sequence starts with defects already proven by spike 001, then adds test coverage, security hardening, checkout integrity, payment readiness, admin fulfillment, catalog/frontend cleanup, and deployment operations.

## Phases

**Phase Numbering:**

- Integer phases are planned milestone work.
- Decimal phases are reserved for urgent insertions.

- [x] **Phase 1: Core Flow Stabilization** - Fix the current contact, coupon, checkout, and cart contract defects. (completed 2026-06-12)
- [ ] **Phase 2: Automated Test Foundation** - Add backend/frontend automated tests around the stabilized purchase path.
- [ ] **Phase 3: API Security and Validation** - Add API hardening, config validation, dependency remediation, and request allowlists.
- [ ] **Phase 4: Checkout Data Integrity and Inventory** - Make order creation, coupons, carts, stock, and order numbers consistent under real usage.
- [ ] **Phase 5: Production Payments** - Replace demo checkout with a real payment flow and payment-state model.
- [ ] **Phase 6: Admin Fulfillment Operations** - Add admin order fulfillment APIs and operational views.
- [ ] **Phase 7: Catalog and Frontend Architecture Cleanup** - Normalize product/cart data and reduce fragile frontend/API structure.
- [ ] **Phase 8: CI/CD, Observability, and Deployment Readiness** - Add pipeline checks, deployment readiness, logging, and environment verification.

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

- [ ] 02-04: Update testing docs, retain the contract checker, and run final verification.

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

**Plans**: TBD

Plans:

- [ ] 03-01: Add security middleware and startup configuration validation.
- [ ] 03-02: Add request validators/DTO allowlists.
- [ ] 03-03: Remediate dependency audit findings and token-storage risk.

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

**Plans**: TBD

Plans:

- [ ] 04-01: Make checkout writes transactional or idempotent.
- [ ] 04-02: Enforce inventory in cart and order flows.
- [ ] 04-03: Normalize cart data and order-number generation.

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

**Plans**: TBD

Plans:

- [ ] 05-01: Design payment provider contract and order payment-state model.
- [ ] 05-02: Implement payment creation/confirmation and frontend checkout integration.
- [ ] 05-03: Implement webhook and refund/failure handling tests.

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

**Plans**: TBD

Plans:

- [ ] 06-01: Add admin order API operations and tests.
- [ ] 06-02: Add fulfillment/tracking workflow.
- [ ] 06-03: Add pagination/filtering for admin list endpoints.

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

**Plans**: TBD

Plans:

- [ ] 07-01: Normalize product and cart view models.
- [ ] 07-02: Add catalog query limits/indexes.
- [ ] 07-03: Split API modules and extract large frontend logic.

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

- [ ] 08-01: Add CI workflow for backend/frontend checks.
- [ ] 08-02: Add deployment readiness and observability basics.
- [ ] 08-03: Verify deployment documentation and environment templates.

## Progress

**Execution Order:** Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7 -> Phase 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Flow Stabilization | 3/3 | Complete | 2026-06-12 |
| 2. Automated Test Foundation | 3/4 | In Progress | - |
| 3. API Security and Validation | 0/3 | Not started | - |
| 4. Checkout Data Integrity and Inventory | 0/3 | Not started | - |
| 5. Production Payments | 0/3 | Not started | - |
| 6. Admin Fulfillment Operations | 0/3 | Not started | - |
| 7. Catalog and Frontend Architecture Cleanup | 0/3 | Not started | - |
| 8. CI/CD, Observability, and Deployment Readiness | 0/3 | Not started | - |

## Recommendations

- Start Phase 2 next so the fixed Phase 1 core-flow contracts are protected by automated backend/frontend tests.
- Keep payment work after checkout integrity; real payments amplify inconsistent order/cart/stock behavior.
- Keep CI/CD after tests exist; otherwise CI has too little signal.
