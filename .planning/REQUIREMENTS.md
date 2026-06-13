# Requirements: PLASHOE Production Readiness

**Defined:** 2026-06-12
**Core Value:** Customers can complete a reliable purchase flow and operators can safely run the store.

## v1 Requirements

### Core Flow Stabilization

- [x] **CORE-01**: Contact form calls the API wrapper method that actually exists.
- [x] **CORE-02**: Contact submission only shows success when the backend accepts the message.
- [x] **CORE-03**: Checkout routing matches the intended guest/authenticated checkout policy.
- [x] **CORE-04**: Coupon application UI and cart store agree on the returned discount/message contract.
- [x] **CORE-05**: Removing a coupon handles a missing cart without throwing.

### Testing

- [x] **TEST-01**: Backend has an automated test runner and route-test setup.
- [x] **TEST-02**: Auth, cart, coupon, checkout/order, and contact API paths have automated coverage.
- [x] **TEST-03**: Frontend starter test is replaced with PLASHOE-specific tests.
- [x] **TEST-04**: Core flow contract checker is retained or converted into tests.

### Security

- [x] **SEC-01**: Auth and high-abuse endpoints have rate limiting and request-size protection.
- [x] **SEC-02**: Backend validates required secrets and configuration before listening.
- [x] **SEC-03**: Controllers map request bodies through explicit allowlists or validators before persistence.
- [x] **SEC-04**: Dependency audit findings are addressed or documented with accepted risk.
- [x] **SEC-05**: Browser token storage risk is reduced or documented with compensating controls.

### Checkout Integrity

- [x] **CHK-01**: Order creation is idempotent or transactional across order, cart, coupon, and inventory updates.
- [x] **CHK-02**: Product stock is validated before cart/order mutation and decremented or reserved during checkout.
- [x] **CHK-03**: Order numbers are collision-safe under concurrent checkout.
- [x] **CHK-04**: Cart item data is normalized at store/API boundaries.

### Payments

- [x] **PAY-01**: Demo payment copy is replaced by a real payment flow.
- [x] **PAY-02**: Orders track payment status separately from fulfillment status.
- [x] **PAY-03**: Payment confirmation, failure, cancellation, and refund paths are represented.
- [x] **PAY-04**: Payment webhook handling is covered by tests.

### Admin Fulfillment

- [x] **ADM-01**: Admins can list and inspect orders.
- [x] **ADM-02**: Admins can update fulfillment status, carrier, tracking number, and tracking history.
- [x] **ADM-03**: Admin list endpoints support pagination and safe filtering.
- [x] **ADM-04**: Admin routes are protected by authentication and admin authorization tests.

### Catalog and Frontend Architecture

- [x] **CAT-01**: Product loading uses one normalized product shape across static fallback and backend data.
- [x] **CAT-02**: Catalog filtering/pagination has backend limits and supporting indexes.
- [x] **CAT-03**: API modules are split by resource instead of mixing contact/coupon into orders.
- [x] **CAT-04**: Large checkout/account/product page logic is extracted into smaller components/hooks where useful.

### Operations

- [x] **OPS-01**: CI installs backend/frontend dependencies and runs tests/build/audit checks.
- [x] **OPS-02**: Backend has health/readiness behavior suitable for deployment.
- [x] **OPS-03**: Backend has structured request/error logging.
- [x] **OPS-04**: Frontend and backend deployment/environment requirements are documented and verified.

## v2 Requirements

- **V2-01**: Wishlist feature works end to end.
- **V2-02**: Product reviews work end to end.
- **V2-03**: Full admin product/coupon UI exists.
- **V2-04**: Frontend build tooling migrates away from Create React App if dependency remediation requires it.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New storefront marketing features | Current risk is reliability and production readiness, not more surface area. |
| Mobile app | Web checkout must be reliable first. |
| Multi-vendor marketplace | Not supported by current data model or admin workflow. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 1 | Complete |
| TEST-01 | Phase 2 | Complete |
| TEST-02 | Phase 2 | Complete |
| TEST-03 | Phase 2 | Complete |
| TEST-04 | Phase 2 | Complete |
| SEC-01 | Phase 3 | Complete |
| SEC-02 | Phase 3 | Complete |
| SEC-03 | Phase 3 | Complete |
| SEC-04 | Phase 3 | Complete |
| SEC-05 | Phase 3 | Complete |
| CHK-01 | Phase 4 | Complete |
| CHK-02 | Phase 4 | Complete |
| CHK-03 | Phase 4 | Complete |
| CHK-04 | Phase 4 | Complete |
| PAY-01 | Phase 5 | Complete |
| PAY-02 | Phase 5 | Complete |
| PAY-03 | Phase 5 | Complete |
| PAY-04 | Phase 5 | Complete |
| ADM-01 | Phase 6 | Complete |
| ADM-02 | Phase 6 | Complete |
| ADM-03 | Phase 6 | Complete |
| ADM-04 | Phase 6 | Complete |
| CAT-01 | Phase 7 | Complete |
| CAT-02 | Phase 7 | Complete |
| CAT-03 | Phase 7 | Complete |
| CAT-04 | Phase 7 | Complete |
| OPS-01 | Phase 8 | Complete |
| OPS-02 | Phase 8 | Complete |
| OPS-03 | Phase 8 | Complete |
| OPS-04 | Phase 8 | Complete |
| V2-01 | Post-v1 | Deferred |
| V2-02 | Post-v1 | Deferred |
| V2-03 | Post-v1 | Deferred |
| V2-04 | Post-v1 | Deferred |

**Coverage:**

- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-06-12 after codebase mapping, documentation verification, and spike 001.*
