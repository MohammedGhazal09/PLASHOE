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

### Production Launch Setup

- [ ] **LAUNCH-01**: Production/staging hosting targets, MongoDB, Stripe, frontend build variables, and MapTiler key restrictions are configured outside the repo.
- [ ] **LAUNCH-02**: Placeholder production values in docs and env templates are replaced or explicitly marked as non-production examples.
- [ ] **LAUNCH-03**: Staging `/api/health`, `/api/ready`, frontend load, request-id propagation, and payment return routes are smoke-tested with recorded evidence.
- [ ] **LAUNCH-04**: Stripe webhook delivery is visible in Stripe and staging backend logs show no sustained 5xx failures.

### Frontend Tooling Modernization

- [x] **TOOL-01**: Frontend tooling is migrated to a maintained build/test stack or the CRA dependency debt is otherwise removed.
- [x] **TOOL-02**: The production audit policy no longer needs to accept CRA/react-scripts tooling findings.
- [x] **TOOL-03**: Frontend tests pass without recurring React `act(...)` and React Router future-flag warning noise.
- [x] **TOOL-04**: Frontend production build passes without the known hook dependency, stale Browserslist, or Node deprecation warnings.

### Operational Monitoring

- [ ] **MON-01**: Backend logs, health/readiness status, Stripe webhook failures, and deployment events flow to the selected host/logging provider.
- [ ] **MON-02**: Alerts exist for backend downtime, readiness failure, sustained 5xx errors, Stripe webhook delivery failures, and database connectivity issues.
- [ ] **MON-03**: MongoDB backup/restore verification and operational access procedures are documented and tested.
- [ ] **MON-04**: Incident response and rollback runbooks include owners, decision thresholds, communication steps, and first 5/15/60 minute checks.

### Release Cutover

- [ ] **REL-01**: Final local and remote gates pass: backend tests, frontend tests, frontend build, audit policy, static contract checker, and remote GitHub Actions CI.
- [ ] **REL-02**: Git history, planning state, docs, release notes, and deployment checklist are reconciled before production cutover.
- [ ] **REL-03**: Production deploy, rollback plan, health/readiness checks, frontend smoke checks, and Stripe webhook/payment checks are executed with evidence.
- [ ] **REL-04**: A post-launch review records issues, metrics, follow-ups, and any accepted risks that remain for the next milestone.

## v2 Requirements

- **V2-01**: Wishlist feature works end to end.
- **V2-02**: Product reviews work end to end.
- **V2-03**: Full admin product/coupon UI exists.
- **V2-04**: Frontend platform improvements beyond Phase 10 are deferred unless new dependency remediation requires them.

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
| LAUNCH-01 | Phase 9 | Not started |
| LAUNCH-02 | Phase 9 | Not started |
| LAUNCH-03 | Phase 9 | Not started |
| LAUNCH-04 | Phase 9 | Not started |
| TOOL-01 | Phase 10 | Complete |
| TOOL-02 | Phase 10 | Complete |
| TOOL-03 | Phase 10 | Complete |
| TOOL-04 | Phase 10 | Complete |
| MON-01 | Phase 11 | Not started |
| MON-02 | Phase 11 | Not started |
| MON-03 | Phase 11 | Not started |
| MON-04 | Phase 11 | Not started |
| REL-01 | Phase 12 | Not started |
| REL-02 | Phase 12 | Not started |
| REL-03 | Phase 12 | Not started |
| REL-04 | Phase 12 | Not started |
| V2-01 | Post-v1 | Deferred |
| V2-02 | Post-v1 | Deferred |
| V2-03 | Post-v1 | Deferred |
| V2-04 | Post-v1 | Deferred |

**Coverage:**

- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-06-12 after codebase mapping, documentation verification, and spike 001.*
