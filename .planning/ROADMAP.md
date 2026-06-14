# Roadmap: PLASHOE Production Readiness

## Overview

This roadmap turns the verified PLASHOE gaps into execution phases. The sequence starts with defects already proven by spike 001, then adds test coverage, security hardening, checkout integrity, payment readiness, admin fulfillment, catalog/frontend cleanup, deployment operations, production launch setup, frontend tooling modernization, operational monitoring, and final release cutover.

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
- [ ] **Phase 9: Production Launch Setup and Staging Verification** - Configure real production services, secrets, staging deployment, and live smoke evidence.
- [ ] **Phase 10: Frontend Tooling Modernization and Warning Cleanup** - Remove accepted CRA/tooling debt and clean non-blocking frontend test/build warnings.
- [ ] **Phase 11: Operational Monitoring Alerting and Incident Readiness** - Wire live monitoring, alerts, backup verification, and incident response operations.
- [ ] **Phase 12: Release Gate Production Cutover and Post Launch Review** - Run the final release gate, production cutover, rollback readiness, and post-launch review.

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

### Phase 9: Production Launch Setup and Staging Verification

**Goal**: Production-equivalent services, secrets, frontend build settings, Stripe dashboard setup, and staging smoke checks are complete before any production cutover.
**Depends on**: Phase 8
**Requirements**: LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04
**Canonical refs**: `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-USER-SETUP.md`, `docs/CONFIGURATION.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`
**Success Criteria** (what must be TRUE):

  1. Production/staging hosting targets, MongoDB, Stripe, frontend build variables, and MapTiler key restrictions are configured outside the repo.
  2. Placeholder production values in docs and env templates are replaced or explicitly marked as non-production examples.
  3. Staging `/api/health`, `/api/ready`, frontend load, request-id propagation, and payment return routes are smoke-tested with recorded evidence.
  4. Stripe webhook delivery is visible in the Stripe dashboard and staging backend logs show no sustained 5xx failures.

**Plans**: 3 plans

Plan candidates:

- 09-01: Complete external account, secret, domain, and build-environment setup.
- 09-02: Deploy staging and run backend/frontend/readiness smoke checks.
- 09-03: Verify Stripe webhook, payment redirect/return, and production-content configuration evidence.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-50: Do not commit real `.env` files, API keys, Stripe secrets, MongoDB credentials, or dashboard-only values.
- D-51: Treat staging as the release proving ground; production cutover belongs to Phase 12.

### Phase 10: Frontend Tooling Modernization and Warning Cleanup

**Goal**: Frontend build/test tooling no longer depends on accepted CRA/react-scripts audit debt, and routine test/build output is clean enough that new warnings are visible.
**Depends on**: Phase 9
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04
**Canonical refs**: `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/package-lock.json`, `scripts/ci/check-audits.mjs`, `docs/TESTING.md`
**Success Criteria** (what must be TRUE):

  1. Frontend tooling is migrated to a maintained build/test stack or the CRA dependency debt is otherwise removed.
  2. `node scripts/ci/check-audits.mjs` no longer needs to accept CRA/react-scripts tooling findings.
  3. Frontend tests pass without recurring React `act(...)` and React Router future-flag warning noise.
  4. Frontend production build passes without the known `OrderDetail.jsx` hook dependency warning, stale Browserslist warning, or Node deprecation noise.

**Plans**: 0 plans

Plan candidates:

- 10-01: Select and migrate the maintained frontend build/test toolchain.
- 10-02: Update test harness, environment variables, static asset handling, and CI commands.
- 10-03: Remove the audit allowlist debt and clean remaining frontend warnings.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-52: Preserve customer-facing routes, env var names, payment return behavior, cart normalization, and existing test intent during migration.
- D-53: Prefer a small, reversible migration over unrelated visual or feature changes.

### Phase 11: Operational Monitoring Alerting and Incident Readiness

**Goal**: The deployed app has live operational signals, alert paths, backup verification, and incident-response practices that make production failures diagnosable and actionable.
**Depends on**: Phase 10
**Requirements**: MON-01, MON-02, MON-03, MON-04
**Canonical refs**: `Backend/utils/logger.js`, `Backend/utils/readiness.js`, `Backend/app.js`, `docs/DEPLOYMENT.md`
**Success Criteria** (what must be TRUE):

  1. Backend logs, health/readiness status, Stripe webhook failures, and deployment events flow to the selected host/logging provider.
  2. Alerts exist for backend downtime, readiness failure, sustained 5xx errors, Stripe webhook delivery failures, and database connectivity issues.
  3. MongoDB backup/restore verification and operational access procedures are documented and tested.
  4. Incident response and rollback runbooks include owners, decision thresholds, communication steps, and first 5/15/60 minute checks.

**Plans**: 0 plans

Plan candidates:

- 11-01: Connect runtime logs, uptime checks, and readiness metrics to the selected operations stack.
- 11-02: Configure actionable alerts for service, payment, and database failure modes.
- 11-03: Verify backup/restore and write the incident/rollback runbook.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-54: Alerts must be actionable and low-noise; avoid broad metrics that nobody will review.
- D-55: Logs and alert payloads must not expose bearer tokens, Stripe secrets, webhook payloads, passwords, or raw PII.

### Phase 12: Release Gate Production Cutover and Post Launch Review

**Goal**: PLASHOE is cut over to production through a repeatable release gate with rollback readiness, remote CI proof, smoke evidence, and post-launch review.
**Depends on**: Phase 11
**Requirements**: REL-01, REL-02, REL-03, REL-04
**Canonical refs**: `.github/workflows/ci.yml`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`, `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-VERIFICATION.md`
**Success Criteria** (what must be TRUE):

  1. The final local and remote gates pass: backend tests, frontend tests, frontend build, audit policy, static contract checker, and remote GitHub Actions CI.
  2. Git history, planning state, docs, release notes, and deployment checklist are reconciled before production cutover.
  3. Production deploy, rollback plan, health/readiness checks, frontend smoke checks, and Stripe webhook/payment checks are executed with evidence.
  4. A post-launch review records issues, metrics, follow-ups, and whether any accepted risks remain for the next milestone.

**Plans**: 0 plans

Plan candidates:

- 12-01: Run final local and remote release gates and reconcile repo/planning state.
- 12-02: Execute production cutover with rollback plan and smoke checks open.
- 12-03: Monitor the launch window and write the post-launch review.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-56: Do not tag or push a production release until the user explicitly approves release actions.
- D-57: Production deploy must use environment secret stores rather than committed configuration.

## Progress

**Execution Order:** Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7 -> Phase 8 -> Phase 9 -> Phase 10 -> Phase 11 -> Phase 12

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
| 9. Production Launch Setup and Staging Verification | 3/3 | Blocked on external setup |  |
| 10. Frontend Tooling Modernization and Warning Cleanup | 1/3 | In Progress|  |
| 11. Operational Monitoring Alerting and Incident Readiness | 0/0 | Not started | |
| 12. Release Gate Production Cutover and Post Launch Review | 0/0 | Not started | |

## Recommendations

- Start Phase 9 execution next because production launch setup blocks credible staging and production evidence.
- Keep Phase 10 separate from launch setup so tooling migration risk does not block external account/configuration work.
- Treat Phase 12 as the only production cutover phase; earlier phases should produce staging proof and operational readiness.
- Preserve the no-subagent constraint for GSD execution unless the repository instruction changes.
