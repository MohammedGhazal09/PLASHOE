# Roadmap: PLASHOE Production Readiness

## Overview

This roadmap turns the verified PLASHOE gaps into execution phases. The sequence starts with defects already proven by spike 001, then adds test coverage, security hardening, checkout integrity, payment readiness, admin fulfillment, catalog/frontend cleanup, deployment operations, production launch setup, frontend tooling modernization, operational monitoring, and final release cutover. Post-release phases then expand the store into richer admin operations, shopping intent, product confidence, discovery, checkout conversion, returns, sustainability content, retention, shoppable merchandising, account self-service, admin analytics, lifecycle operations, moderation, merchandising tooling, shipping rules, demo admin portfolio access, and sandbox payment demonstrations.

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
- [x] **Phase 10: Frontend Tooling Modernization and Warning Cleanup** - Remove accepted CRA/tooling debt and clean non-blocking frontend test/build warnings. (completed 2026-06-14)
- [ ] **Phase 11: Operational Monitoring Alerting and Incident Readiness** - Wire live monitoring, alerts, backup verification, and incident response operations.
- [ ] **Phase 12: Release Gate Production Cutover and Post Launch Review** - Run the final release gate, production cutover, rollback readiness, and post-launch review.
- [x] **Phase 13: Admin Store Management Console** - Build protected operator screens for store administration beyond raw API access. (completed 2026-06-20)
- [x] **Phase 14: Wishlist and Saved Shopping Intent** - Let shoppers save products and resume purchase intent across sessions. (completed 2026-06-20)
- [x] **Phase 15: Product Detail Reviews and Fit Confidence** - Add richer product detail, reviews, fit guidance, and related products. (completed 2026-06-20)
- [x] **Phase 16: Advanced Catalog Discovery and Search** - Improve product finding through search, filters, URL state, and indexed queries. (completed 2026-06-20)
- [x] **Phase 17: Checkout Conversion and Guest Cart Experience** - Reduce checkout friction with the selected guest or cart-login policy. (completed 2026-06-21)
- [x] **Phase 18: Returns Exchanges and Refund Requests** - Add customer return/exchange requests and operator resolution workflows. (completed 2026-06-21)
- [x] **Phase 19: Sustainability Impact and Product Care Content** - Make product sustainability and care information first-class content. (completed 2026-06-20)
- [x] **Phase 20: Retention Lifecycle Commerce and Personalization** - Add back-in-stock, reorder, cart recovery, and recommendation workflows. (completed 2026-06-21)
- [x] **Phase 21: Shoppable Lookbook and Outfit Bundles** - Turn lookbook content into tagged, bundle-ready merchandising. (completed 2026-06-21)
- [x] **Phase 22: Account Settings and Address Management** - Complete account self-service for profile and saved addresses. (completed 2026-06-30)
- [x] **Phase 23: Admin Metrics Dashboard and Store Health Snapshot** - Give operators a compact business and operations dashboard. (completed 2026-06-30)
- [x] **Phase 24: Back-in-Stock Admin Workflow and Notification Readiness** - Let admins manage restock demand before provider delivery is selected. (completed 2026-06-30)
- [x] **Phase 25: Newsletter Subscription Capture and Consent Management** - Turn the newsletter UI into a consent-backed subscription workflow. (completed 2026-06-30)
- [x] **Phase 26: Review Moderation and Customer Trust Controls** - Add admin moderation for public review quality and trust. (completed 2026-06-30)
- [x] **Phase 27: Searchable Admin Product Picker for Merchandising Workflows** - Replace manual product-id entry with reusable admin product selection. (completed 2026-06-30)
- [x] **Phase 28: Shipping Rates and International Checkout Rules** - Add server-owned shipping methods, country rules, and checkout totals. (completed 2026-06-30)
- [x] **Phase 29: Demo Admin Portfolio Access and Safe Preview Mode** - Let signed-in portfolio reviewers open a restricted admin preview with all actions disabled. (completed 2026-06-30)
- [x] **Phase 30: Hybrid Sandbox Payment Demo Mode** - Show payment-system handling with Stripe test mode when configured and a mock gateway fallback otherwise. (completed 2026-06-30)

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

**Plans**: 3 plans

Plans:
**Wave 1**

- [x] 10-01: Migrate to Vite/Vitest tooling and preserve runtime compatibility.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 10-02: Convert the Vitest harness and clean frontend warning surfaces.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 10-03: Remove CRA audit allowlist debt and reconcile CI/docs verification.

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

**Plans**: 3 plans

Plans:

**Wave 1**

- [x] 11-01: Structured webhook logging and Phase 11 evidence baseline.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 11-02: Operations docs, signal routing, alert catalog, and access matrix.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 11-03: Backup restore procedure, incident runbook, and final verification.

**Cross-cutting constraints:**

- D-01: Use find-skills, incident-response, runbook, observability-engineer, and devops-engineer as supporting guidance.
- D-02: Do all work inline and do not use subagents.
- D-03: Preserve unrelated dirty and untracked work; stage only explicit Phase 11 files.
- D-04: Produce both phase-local proof artifacts and durable operator docs.
- D-05: Keep provider guidance based on host-native logs/alerts plus MongoDB and Stripe native dashboards.
- D-06: Mark unavailable live staging/provider proof as blocked with exact Phase 9 inputs.
- D-07: Evidence artifacts use pass/blocked/pending/failed status tables without fabricated links or secrets.
- D-30: Verification includes required artifact checks and secret-pattern scans.
- D-32: Live-provider evidence can be marked passed only from real safe evidence.

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

### Phase 13: Admin Store Management Console

**Goal**: Operators can run day-to-day store administration from protected frontend screens instead of raw API calls.
**Depends on**: Phase 12
**Requirements**: V2-ADM-01, V2-ADM-02, V2-ADM-03, V2-ADM-04
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/api/adminApi.js`, `Backend/routes/adminOrderRoutes.js`, `Backend/routes/productRoutes.js`, `docs/API.md`
**Success Criteria** (what must be TRUE):

  1. A protected admin route shell is visible only to authenticated admins.
  2. Admins can list, filter, inspect, and update order fulfillment from the frontend.
  3. Admins can manage products, coupons, and contact messages without direct API tooling.
  4. Admin navigation, authorization, and critical admin workflows have focused tests.

**Plans**: 0 plans

Plan candidates:

- 13-01: Add admin route shell, authorization guard, and navigation.
- 13-02: Build order list/detail/fulfillment screens on existing admin APIs.
- 13-03: Add product CRUD, coupon management, and contact-message operations.
- 13-04: Add admin UI tests, API-wrapper coverage, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-58: Do not weaken backend admin authorization; frontend admin hiding is only a UX layer.

### Phase 14: Wishlist and Saved Shopping Intent

**Goal**: Shoppers can save products, revisit them later, and move saved intent into cart.
**Depends on**: Phase 13
**Requirements**: V2-WISH-01, V2-WISH-02, V2-WISH-03
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx`, `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`, `Frontend/Ecommerce-main/my-app/src/config/config.js`
**Success Criteria** (what must be TRUE):

  1. Authenticated wishlists persist through backend APIs and survive device/session changes.
  2. Guest wishlist behavior is explicit, local, and reconciles or prompts safely on login.
  3. Product cards, product detail, account, and header surfaces expose wishlist state consistently.
  4. Wishlist add/remove/move-to-cart behavior has frontend and backend tests.

**Plans**: 4 plans

Plan candidates:

- 14-01: Backend wishlist persistence and API.
- 14-02: Frontend wishlist API, store, and reconciliation.
- 14-03: Storefront wishlist controls, header count, and account management.
- 14-04: Wishlist tests, documentation, browser smoke, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.

### Phase 15: Product Detail Reviews and Fit Confidence

**Goal**: Shoppers can evaluate individual products with rich product information, verified reviews, fit guidance, and related products.
**Depends on**: Phase 14
**Requirements**: V2-PDP-01, V2-REV-01, V2-REV-02, V2-FIT-01
**Canonical refs**: `Backend/models/Product.js`, `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`, `Frontend/Ecommerce-main/my-app/src/components/QuickViewModal.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx`
**Success Criteria** (what must be TRUE):

  1. Product detail routes render product media, price, stock, sizes, description, materials, and add-to-cart.
  2. Reviews support verified-purchase submission, listing, rating aggregation, and abuse-safe validation.
  3. Fit guidance and size information are visible at the decision point.
  4. Related products are generated through a bounded, testable catalog rule.

**Plans**: 4 plans

Plan candidates:

- 15-01: Product detail data, route, and related products.
- 15-02: Verified purchase review API and aggregation.
- 15-03: Product detail page, reviews UI, fit guidance, and related products.
- 15-04: Product detail reviews docs, browser smoke, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-59: Review content must be validated and moderated enough to avoid unsafe public rendering.

### Phase 16: Advanced Catalog Discovery and Search

**Goal**: Shoppers can find the right product quickly through search, filtering, sorting, pagination, and shareable catalog state.
**Depends on**: Phase 15
**Requirements**: V2-DISC-01, V2-DISC-02, V2-DISC-03
**Canonical refs**: `Backend/controllers/productController.js`, `Backend/validators/product.js`, `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.jsx`, `Frontend/Ecommerce-main/my-app/src/hooks/useCatalogProducts.js`
**Success Criteria** (what must be TRUE):

  1. Product list APIs support bounded text search plus category, gender, sale, size, price, rating, and sort filters.
  2. Catalog UI keeps search/filter/sort/page state in the URL and restores it on reload/share.
  3. Empty, loading, error, and no-results states are clear and do not break layout.
  4. Search/filter behavior is covered by backend, frontend, and contract-level tests.

**Plans**: 3 plans

Plan candidates:

- 16-01: Extend product query validation, indexes, and API contracts.
- 16-02: Build search/filter URL-state UI and catalog behavior.
- 16-03: Add test coverage, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-60: Keep catalog queries bounded; do not introduce unindexed unbounded search.

### Phase 17: Checkout Conversion and Guest Cart Experience

**Goal**: Checkout drop-off is reduced by making the guest/account policy explicit and removing avoidable friction in cart, address, and payment handoff.
**Depends on**: Phase 16
**Requirements**: V2-CHKX-01, V2-CHKX-02, V2-CHKX-03
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`, `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`, `Backend/controllers/orderController.js`
**Success Criteria** (what must be TRUE):

  1. The selected guest checkout or account-required cart-merge policy is documented and implemented consistently.
  2. Guest and authenticated carts reconcile without duplicate, lost, or stale items.
  3. Saved addresses and checkout validation reduce repeated entry without weakening backend validation.
  4. Checkout retry, payment return, and cart-conflict behavior remain covered by tests.

**Plans**: 0 plans

Plan candidates:

- 17-01: Decide and encode guest checkout versus login-required cart merge.
- 17-02: Implement cart reconciliation and address reuse in checkout/account flows.
- 17-03: Add checkout conversion tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-61: Preserve Phase 4 idempotency, stock, and coupon consistency guarantees.

### Phase 18: Returns Exchanges and Refund Requests

**Goal**: Customers and operators can handle returns, exchanges, and refund requests with clear eligibility and auditable status changes.
**Depends on**: Phase 17
**Requirements**: V2-RMA-01, V2-RMA-02, V2-RMA-03, V2-RMA-04
**Canonical refs**: `Backend/models/Order.js`, `Backend/controllers/webhookController.js`, `Backend/services/paymentState.js`, `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx`
**Success Criteria** (what must be TRUE):

  1. Return/exchange requests have a persisted model, customer API, admin API, and status history.
  2. Eligibility rules account for order status, payment state, delivery date, item quantity, and configured return window.
  3. Admins can approve, reject, receive, resolve, and record notes for requests.
  4. Refund request state does not conflict with Stripe-origin refund webhook state.

**Plans**: 0 plans

Plan candidates:

- 18-01: Add return/exchange data model, eligibility rules, and APIs.
- 18-02: Add customer order-detail request UI and admin resolution UI.
- 18-03: Add payment/refund consistency tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-62: Do not initiate real refunds without explicit product and payment-provider policy.

### Phase 19: Sustainability Impact and Product Care Content

**Goal**: PLASHOE product pages communicate sustainability impact, materials, care, and durability in a maintainable way.
**Depends on**: Phase 18
**Requirements**: V2-SUS-01, V2-SUS-02, V2-SUS-03
**Canonical refs**: `Backend/models/Product.js`, `Backend/validators/product.js`, `Frontend/Ecommerce-main/my-app/src/pages/OurStory.jsx`
**Success Criteria** (what must be TRUE):

  1. Product records can store structured sustainability, materials, manufacturing, and care information.
  2. Admin product management can maintain sustainability and care fields.
  3. Product detail and story surfaces render the content without unsupported claims or layout breakage.
  4. Missing sustainability data has a safe fallback that does not fabricate impact metrics.

**Plans**: 0 plans

Plan candidates:

- 19-01: Add product sustainability/care schema, validators, and admin fields.
- 19-02: Add product/story UI for impact, materials, and care guidance.
- 19-03: Add content validation, docs, tests, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-63: Do not display environmental claims without sourceable content fields.

### Phase 20: Retention Lifecycle Commerce and Personalization

**Goal**: PLASHOE can drive repeat purchases through opted-in lifecycle workflows and useful recommendations.
**Depends on**: Phase 19
**Requirements**: V2-RET-01, V2-RET-02, V2-RET-03, V2-RET-04
**Canonical refs**: `Backend/models/Product.js`, `Backend/models/Cart.js`, `Backend/models/Order.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
**Success Criteria** (what must be TRUE):

  1. Shoppers can request back-in-stock notifications by product and size.
  2. Account/order surfaces support reorder or buy-again flows when products are still available.
  3. Abandoned-cart recovery is designed with explicit opt-in, privacy, and provider boundaries.
  4. Recommendations are explainable, bounded, and do not require invasive tracking.

**Plans**: 0 plans

Plan candidates:

- 20-01: Add back-in-stock notification intent and availability checks.
- 20-02: Add reorder/buy-again flows and cart recovery boundaries.
- 20-03: Add recommendation rules and customer-facing surfaces.
- 20-04: Add privacy docs, tests, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-64: Lifecycle messaging must be opt-in and avoid committing provider secrets or contact lists.

### Phase 21: Shoppable Lookbook and Outfit Bundles

**Goal**: Lookbook content becomes shoppable merchandising where tagged products and outfit bundles can move directly into cart.
**Depends on**: Phase 20
**Requirements**: V2-LOOK-01, V2-LOOK-02, V2-LOOK-03
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/LookBook.jsx`, `Backend/models/Product.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
**Success Criteria** (what must be TRUE):

  1. Lookbook content can associate images/scenes with active products and optional outfit bundles.
  2. Shoppers can inspect tagged products and add individual items or available bundle items to cart.
  3. Admins can maintain lookbook entries without code edits or broken product references.
  4. Lookbook interactions are responsive, accessible, and covered by focused tests.

**Plans**: 0 plans

Plan candidates:

- 21-01: Add lookbook content model/API and admin maintenance workflow.
- 21-02: Build shoppable hotspots, product tag panels, and bundle add-to-cart flow.
- 21-03: Add responsive/accessibility tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-65: Bundle add-to-cart must respect stock, size selection, and cart normalization rules.

### Phase 22: Account Settings and Address Management

**Goal**: Customers can maintain profile details and saved addresses from the account settings area, and checkout can keep using the same default-address contract.
**Depends on**: Phase 21
**Requirements**: V3-ACC-01, V3-ACC-02, V3-ACC-03
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx`, `Frontend/Ecommerce-main/my-app/src/api/authApi.js`, `Backend/controllers/authController.js`, `Backend/validators/auth.js`
**Success Criteria** (what must be TRUE):

  1. The Account settings tab replaces placeholder copy with editable profile and address-management controls.
  2. Customers can add, delete, and choose a default saved address without breaking checkout address prefill.
  3. Password or credential-management behavior is explicit and protected; no weak unauthenticated mutation path is introduced.
  4. Frontend and backend tests cover success, validation, authorization, and default-address edge cases.

**Plans**: 3 plans

Plans:

- [x] 22-01: Complete profile/settings UI on existing auth APIs.
- [x] 22-02: Add address book default-address management and checkout reuse coverage.
- [x] 22-03: Add credential-management boundary, tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-66: Reuse the existing auth/address API boundary before adding new account infrastructure.

### Phase 23: Admin Metrics Dashboard and Store Health Snapshot

**Goal**: Operators can see the store's current health, revenue, fulfillment, inventory, returns, and message workload from the admin console.
**Depends on**: Phase 22
**Requirements**: V3-ADMSTAT-01, V3-ADMSTAT-02, V3-ADMSTAT-03
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/AdminConsole.jsx`, `Frontend/Ecommerce-main/my-app/src/api/adminApi.js`, `Backend/models/Order.js`, `Backend/models/Product.js`, `Backend/models/ReturnRequest.js`, `Backend/models/ContactMessage.js`
**Success Criteria** (what must be TRUE):

  1. A protected admin summary API returns bounded metrics for paid revenue, order status, low stock, open returns, unread messages, and coupon usage.
  2. The admin console shows a dashboard section with loading, error, empty, and populated states that fit desktop and mobile layouts.
  3. Metrics are computed server-side through admin-protected queries and do not expose customer-sensitive detail beyond existing admin policy.
  4. Backend aggregation tests and frontend admin dashboard tests cover the displayed metrics.

**Plans**: 3 plans

Plans:

- [x] 23-01: Add admin summary API and model aggregation tests.
- [x] 23-02: Add dashboard section to the admin console.
- [x] 23-03: Add UI tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-67: Keep dashboard metrics compact and query-bounded; do not add a general analytics framework.

### Phase 24: Back-in-Stock Admin Workflow and Notification Readiness

**Goal**: Admins can inspect and manage back-in-stock demand by product, size, and email before any notification provider is connected.
**Depends on**: Phase 23
**Requirements**: V3-BIS-01, V3-BIS-02, V3-BIS-03
**Canonical refs**: `Backend/models/BackInStockRequest.js`, `Backend/controllers/backInStockController.js`, `Backend/routes/backInStockRoutes.js`, `Frontend/Ecommerce-main/my-app/src/pages/ProductDetail.jsx`
**Success Criteria** (what must be TRUE):

  1. Admin APIs can list, filter, and summarize pending back-in-stock requests by product, size, email, and status.
  2. Admins can mark requests notified or cancelled without sending provider messages or exporting contact lists.
  3. Product/admin views make restock demand visible enough to guide inventory decisions.
  4. Tests cover duplicate pending requests, status transitions, filtering, and authorization.

**Plans**: 3 plans

Plans:

- [x] 24-01: Add admin back-in-stock list, summary, and status APIs.
- [x] 24-02: Add admin retention-demand UI.
- [x] 24-03: Add tests, docs, and provider-boundary verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-68: Do not add email/SMS delivery, provider secrets, or contact-list export in this phase.

### Phase 25: Newsletter Subscription Capture and Consent Management

**Goal**: The storefront newsletter form becomes a real consent-backed subscription workflow with safe admin visibility and unsubscribe handling.
**Depends on**: Phase 24
**Requirements**: V3-NEWS-01, V3-NEWS-02, V3-NEWS-03, V3-NEWS-04
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, `Backend/app.js`, `Backend/middleware/validate.js`, `Backend/config/security.js`
**Success Criteria** (what must be TRUE):

  1. Public newsletter subscription captures email, consent, source, duplicate-safe status, and unsubscribe token.
  2. Duplicate subscriptions are idempotent and do not create repeated active records for the same email.
  3. Admins can list or summarize subscription records through protected APIs without exposing unnecessary personal data.
  4. Unsubscribe or suppression behavior is implemented before any provider-delivery integration.

**Plans**: 3 plans

Plans:

- [x] 25-01: Add newsletter model, validators, public subscribe, and unsubscribe APIs.
- [x] 25-02: Wire the Home newsletter UI and admin subscription visibility.
- [x] 25-03: Add consent, duplicate, unsubscribe, tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-69: Lifecycle messaging remains opt-in; no provider delivery secrets or bulk contact export in this phase.

### Phase 26: Review Moderation and Customer Trust Controls

**Goal**: Admins can moderate product reviews so public review content remains useful, approved, and consistent with rating aggregates.
**Depends on**: Phase 25
**Requirements**: V3-REV-MOD-01, V3-REV-MOD-02, V3-REV-MOD-03
**Canonical refs**: `Backend/models/Review.js`, `Backend/controllers/reviewController.js`, `Frontend/Ecommerce-main/my-app/src/pages/ProductDetail.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/AdminConsole.jsx`
**Success Criteria** (what must be TRUE):

  1. Admin APIs can list reviews by approval state, inspect review detail, and approve or hide reviews.
  2. Public review listing and product rating summaries only reflect approved reviews after moderation changes.
  3. Admin UI exposes moderation actions with clear states and no accidental destructive default.
  4. Tests cover moderation transitions, aggregate recalculation, public visibility, and authorization.

**Plans**: 3 plans

Plans:

- [x] 26-01: Add admin review moderation APIs and aggregate-safe status changes.
- [x] 26-02: Add admin moderation UI and customer-facing trust states.
- [x] 26-03: Add tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-70: Review moderation must not publish unapproved content or desynchronize product rating summaries.

### Phase 27: Searchable Admin Product Picker for Merchandising Workflows

**Goal**: Admin merchandising screens can select products through a reusable searchable picker instead of manual MongoDB id entry.
**Depends on**: Phase 26
**Requirements**: V3-PICK-01, V3-PICK-02, V3-PICK-03
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/admin/AdminLookbook.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/admin/AdminProducts.jsx`, `Frontend/Ecommerce-main/my-app/src/api/adminApi.js`, `Backend/controllers/productController.js`
**Success Criteria** (what must be TRUE):

  1. A reusable admin product picker searches existing bounded product APIs and returns id, name, image, category, stock, and price context.
  2. Lookbook hotspot and bundle forms can select products without typing raw IDs.
  3. Picker states cover loading, no results, selected product, deleted/stale product, and low/out-of-stock context.
  4. Frontend tests cover picker behavior and lookbook/admin integration.

**Plans**: 3 plans

Plan candidates:

- [x] 27-01: Add reusable admin product picker component on existing product APIs.
- [x] 27-02: Integrate picker into lookbook hotspot and bundle forms.
- [x] 27-03: Add tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-71: Reuse existing bounded product search before adding any new admin search endpoint.

### Phase 28: Shipping Rates and International Checkout Rules

**Goal**: Checkout totals and order records include server-owned shipping methods, shipping rates, and country availability rules.
**Depends on**: Phase 27
**Requirements**: V3-SHIP-01, V3-SHIP-02, V3-SHIP-03, V3-SHIP-04
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Backend/services/checkoutService.js`, `Backend/models/Order.js`, `Backend/validators/order.js`
**Success Criteria** (what must be TRUE):

  1. Backend checkout computes shipping availability, shipping price, and final total from server-owned country/method rules.
  2. Checkout UI shows eligible shipping methods and blocks unsupported countries before payment handoff.
  3. Orders persist selected shipping method, shipping price, country, and total in a way compatible with payment and fulfillment state.
  4. Tests cover supported/unsupported countries, method selection, total calculation, Stripe amount inputs, and order persistence.

**Plans**: 3 plans

Plan candidates:

- [x] 28-01: Add shipping rule model/config, validation, and checkout total calculation.
- [x] 28-02: Add checkout shipping-method UI and order persistence.
- [x] 28-03: Add payment amount, fulfillment, tests, docs, and verification.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-72: Checkout totals remain backend-owned; do not trust frontend-submitted shipping prices.

### Phase 29: Demo Admin Portfolio Access and Safe Preview Mode

**Goal**: Recruiters and portfolio reviewers who create an account can reach the admin page as a clearly restricted demo preview without receiving real admin permissions or mutation ability.
**Depends on**: Phase 28
**Requirements**: V3-DEMOADMIN-01, V3-DEMOADMIN-02, V3-DEMOADMIN-03, V3-DEMOADMIN-04, V3-DEMOADMIN-05
**Canonical refs**: `Frontend/Ecommerce-main/my-app/src/components/AdminRoute.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/AdminConsole.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/admin/`, `Frontend/Ecommerce-main/my-app/src/api/adminApi.js`, `Backend/middleware/auth.js`
**Success Criteria** (what must be TRUE):

  1. Any authenticated non-admin account can reach the admin page in demo mode without being marked or treated as a real admin.
  2. The admin shell and every admin resource screen show clear recruiter/portfolio copy explaining that this is a restricted demo and why controls are disabled.
  3. Create, update, delete, status-change, fulfillment, moderation, notification, and other mutation controls are disabled or converted to no-op restricted actions in demo mode.
  4. Demo admin preview uses sanitized/example data or safe read-only views; backend admin APIs that expose sensitive data or mutate state remain protected by real admin authorization.
  5. Tests cover signed-out access, signed-in demo access, real-admin access, disabled action states, restricted messaging, and direct non-admin API mutation attempts.

**Plans**: 3 plans

Plan candidates:

- [x] 29-01: Add demo-admin access contract and route-state boundary for signed-in non-admins.
- [x] 29-02: Add restricted admin preview UI with persistent notices and disabled mutation controls across admin screens.
- [x] 29-03: Add backend/frontend tests, docs, and visual QA for demo restrictions and real-admin authorization boundaries.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-73: Demo access must not set `isAdmin`, weaken backend `admin` middleware, or rely on frontend-only disabled controls for security.
- D-74: Restriction messaging must be visible on initial admin load and near disabled actions, including keyboard/accessibility states.

### Phase 30: Hybrid Sandbox Payment Demo Mode

**Goal**: PLASHOE can demonstrate real payment-system thinking without charging real money by using Stripe test mode when configured and a controlled mock gateway fallback when Stripe is unavailable.
**Depends on**: Phase 29
**Requirements**: V3-PAYDEMO-01, V3-PAYDEMO-02, V3-PAYDEMO-03, V3-PAYDEMO-04, V3-PAYDEMO-05
**Canonical refs**: `Backend/services/paymentService.js`, `Backend/services/paymentProvider.js`, `Backend/services/paymentState.js`, `Backend/controllers/webhookController.js`, `Backend/config/env.js`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.jsx`, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`
**Success Criteria** (what must be TRUE):

  1. Checkout uses Stripe test-mode hosted checkout when sandbox Stripe configuration is present and clearly states that no real money is charged.
  2. Checkout falls back to a mock payment gateway only when Stripe sandbox configuration is missing, with explicit approve, decline, and cancel outcomes.
  3. Both Stripe-test and mock outcomes drive the existing order payment states instead of creating a separate fake payment model.
  4. The UI shows the active payment mode, supported demo outcomes, and safe retry/cancel messaging without collecting or storing card data.
  5. Tests cover configured Stripe flow, mock fallback, success/failure/cancel return paths, payment-state persistence, and webhook/authorization boundaries.

**Plans**: 3 plans

Plan candidates:

- [x] 30-01: Add payment-mode selection and mock gateway fallback behind existing payment services.
- [x] 30-02: Add checkout and return UI copy for sandbox Stripe and mock payment outcomes.
- [x] 30-03: Add tests, docs, and visual QA for payment demo states and no-real-money messaging.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-75: Do not store card numbers, fake PANs, or payment secrets; the mock gateway only emits controlled demo outcomes.
- D-76: Keep real Stripe production setup blocked behind Phase 9/12 provider evidence and explicit release approval.

### Phase 31: Implement PayPal sandbox checkout provider support

**Goal:** Checkout can use PayPal sandbox hosted checkout as the visible payment-provider path when PayPal sandbox config is present, while retaining Stripe support and mock fallback.
**Requirements**: V3-PAYPAL-01, V3-PAYPAL-02, V3-PAYPAL-03, V3-PAYPAL-04, V3-PAYPAL-05
**Depends on:** Phase 30
**Canonical refs**: `Backend/services/paymentService.js`, `Backend/services/paymentProvider.js`, `Backend/controllers/webhookController.js`, `Backend/config/env.js`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.jsx`, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`
**Success Criteria** (what must be TRUE):

  1. Runtime config selects PayPal only when `PAYMENT_PROVIDER=paypal`, payments are enabled, and required PayPal sandbox vars are present.
  2. Checkout creates a PayPal Orders v2 hosted approval URL and persists PayPal provider ids on the existing order payment fields.
  3. PayPal success return captures the order through a protected backend endpoint and transitions the local order to paid.
  4. `/api/webhooks/paypal` verifies PayPal webhook deliveries and reconciles completed, failed/reversed, and refunded events idempotently.
  5. Checkout and return UI clearly show PayPal sandbox hosted-payment behavior without collecting card data in PLASHOE.

**Plans:** 3 plans

Plans:

- [x] 31-01: Add PayPal provider config and hosted checkout creation.
- [x] 31-02: Add PayPal capture and webhook reconciliation.
- [x] 31-03: Add frontend return handling, docs, tests, visual QA, and reviews.

**Cross-cutting constraints:**

- D-03: Do all work inline and do not use subagents.
- D-77: Keep PayPal credentials backend-only and out of source, frontend bundles, logs, and planning artifacts.
- D-78: Keep mock fallback available whenever selected provider config is incomplete or payments are disabled.

## Progress

**Execution Order:** Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7 -> Phase 8 -> Phase 9 -> Phase 10 -> Phase 11 -> Phase 12 -> Phase 13 -> Phase 14 -> Phase 15 -> Phase 16 -> Phase 17 -> Phase 18 -> Phase 19 -> Phase 20 -> Phase 21 -> Phase 22 -> Phase 23 -> Phase 24 -> Phase 25 -> Phase 26 -> Phase 27 -> Phase 28 -> Phase 29 -> Phase 30 -> Phase 31

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
| 10. Frontend Tooling Modernization and Warning Cleanup | 3/3 | Complete | 2026-06-14 |
| 11. Operational Monitoring Alerting and Incident Readiness | 3/3 | Blocked on external setup |  |
| 12. Release Gate Production Cutover and Post Launch Review | 0/0 | Not started | |
| 13. Admin Store Management Console | 4/4 | Complete    | 2026-06-20 |
| 14. Wishlist and Saved Shopping Intent | 4/4 | Complete    | 2026-06-20 |
| 15. Product Detail Reviews and Fit Confidence | 4/4 | Complete    | 2026-06-20 |
| 16. Advanced Catalog Discovery and Search | 3/3 | Complete    | 2026-06-20 |
| 17. Checkout Conversion and Guest Cart Experience | 3/3 | Complete    | 2026-06-21 |
| 18. Returns Exchanges and Refund Requests | 3/3 | Complete    | 2026-06-21 |
| 19. Sustainability Impact and Product Care Content | 3/3 | Complete    | 2026-06-20 |
| 20. Retention Lifecycle Commerce and Personalization | 4/4 | Complete    | 2026-06-21 |
| 21. Shoppable Lookbook and Outfit Bundles | 3/3 | Complete    | 2026-06-21 |
| 22. Account Settings and Address Management | 3/3 | Complete | 2026-06-30 |
| 23. Admin Metrics Dashboard and Store Health Snapshot | 3/3 | Complete | 2026-06-30 |
| 24. Back-in-Stock Admin Workflow and Notification Readiness | 3/3 | Complete | 2026-06-30 |
| 25. Newsletter Subscription Capture and Consent Management | 3/3 | Complete | 2026-06-30 |
| 26. Review Moderation and Customer Trust Controls | 3/3 | Complete | 2026-06-30 |
| 27. Searchable Admin Product Picker for Merchandising Workflows | 3/3 | Complete | 2026-06-30 |
| 28. Shipping Rates and International Checkout Rules | 3/3 | Complete | 2026-06-30 |
| 29. Demo Admin Portfolio Access and Safe Preview Mode | 3/3 | Complete | 2026-06-30 |
| 30. Hybrid Sandbox Payment Demo Mode | 3/3 | Complete | 2026-06-30 |
| 31. Implement PayPal sandbox checkout provider support | 3/3 | Complete | 2026-06-30 |

## Recommendations

- Resume Phase 9 evidence capture when external staging, MongoDB, Stripe, host/log provider, notification path, rollback command, and MapTiler inputs are available.
- Keep Phase 11 focused on live monitoring, alerting, backup/restore, and incident-readiness evidence once the provider setup exists.
- Treat Phase 12 as the only production cutover phase; local completion of phases 13-21 does not imply hosted release approval.
- Product-growth and portfolio-demo phases 22-31 are complete; deploy with PayPal sandbox env vars before claiming hosted production availability.
- Keep Phase 29 as a read-only preview path for signed-in reviewers; do not grant real admin privileges to every signup.
- Keep Phase 30 as sandbox-only payment demonstration work; do not imply production payment launch or real-money processing.
- Keep PayPal sandbox configured only through backend deployment secrets; do not expose payment secrets in frontend env vars.
- Preserve the no-subagent constraint for GSD execution unless the repository instruction changes.
