# Phase 2: Automated Test Foundation - Specification

**Created:** 2026-06-12
**Ambiguity score:** 0.08 (gate: <= 0.20)
**Requirements:** 11 locked

## Goal

PLASHOE changes from one stale frontend starter test and no backend test command to repeatable one-shot backend, frontend, and contract-checker verification that protects the stabilized core purchase path.

## Background

Phase 1 fixed concrete contact, checkout, coupon, and cart contract defects and left the static core-flow checker passing with `{"PASS":7,"WARN":2}`. Those fixes are still mostly protected by source checks rather than real automated tests.

The frontend already has Create React App test tooling through `react-scripts test`, React Testing Library, `@testing-library/jest-dom`, and `src/setupTests.js`. The only detected frontend test is `Frontend/Ecommerce-main/my-app/src/App.test.js`, and it still asserts the default CRA "learn react" text that the ecommerce app does not render.

The backend is an Express/Mongoose API under `Backend`. `Backend/package.json` has `start`, `dev`, and `seed`, but no `test` script and no backend test dependencies. `Backend/server.js` currently configures Express, connects to MongoDB, and starts listening in the same module, which makes route-level testing awkward because tests need to import an app without connecting to the production database or opening a port.

Phase 2 creates the automated test foundation for the existing core paths. It does not solve payment production readiness, inventory transactions, CI/CD, dependency remediation, or broad architecture cleanup.

## Requirements

1. **Backend one-shot test command**: The backend must have a deterministic test command.
   - Current: `Backend/package.json` has no `test` script and no backend test runner dependency.
   - Target: Running `npm test` from `Backend` executes the backend automated test suite once and exits without watch mode.
   - Acceptance: `cd Backend && npm test` exits 0 when tests pass and runs through an ESM-compatible runner suitable for this codebase.

2. **Importable backend app**: Backend route tests must be able to import the Express app without starting the production server.
   - Current: `Backend/server.js` loads environment, connects to MongoDB, defines the Express app, and calls `app.listen(...)` in one file.
   - Target: Tests can import an Express `app` instance without opening a network listener or connecting to the production database; runtime startup still keeps `server.js` as the listening entrypoint.
   - Acceptance: A backend route test uses Supertest against the imported app and completes without binding `PORT`.

3. **Isolated backend persistence harness**: Backend tests must run against disposable test data.
   - Current: There is no test database setup, fixture pattern, or cleanup behavior.
   - Target: Backend tests run against an isolated MongoDB test database using `mongodb-memory-server` or equivalent disposable local harness.
   - Acceptance: Two consecutive `cd Backend && npm test` runs pass without requiring a developer-provided `MONGODB_URL` and without state leaking between tests.

4. **Auth and route-boundary coverage**: Authentication and protected-route behavior must have automated coverage.
   - Current: Auth routes and middleware protect cart/order behavior, but no tests cover token creation, current-user lookup, missing-token rejection, invalid-token rejection, or protected route access.
   - Target: Backend tests cover register/login/me success paths and protected route rejection for missing or invalid credentials.
   - Acceptance: Tests assert successful auth envelopes for valid register/login/me flows and rejection envelopes/status codes for missing or invalid tokens.

5. **Cart, coupon, and order API coverage**: The core purchase-path backend APIs must have meaningful route tests.
   - Current: Cart, coupon, and order flows have no automated tests; Phase 1 fixed them through source edits and a static checker.
   - Target: Backend tests cover cart add, update, remove, clear, valid coupon, invalid coupon, missing-cart coupon removal, order creation from a cart, and empty-cart order rejection.
   - Acceptance: Supertest route tests assert response statuses, `success` envelopes, cart/order state changes, coupon discount values, and the missing-cart coupon-removal `data: null` behavior.

6. **Contact API coverage**: Public contact submission must be covered by backend tests.
   - Current: The contact endpoint has no automated coverage, and Phase 1 fixed misleading frontend success behavior without a backend test gate.
   - Target: Backend tests cover successful contact submission and required-field rejection.
   - Acceptance: Contact route tests assert a successful envelope for valid data and a failed validation response for missing required data.

7. **Frontend starter test replacement**: The stale CRA starter test must be replaced with a PLASHOE-specific smoke test.
   - Current: `Frontend/Ecommerce-main/my-app/src/App.test.js` asserts `learn react`, which is unrelated to the storefront.
   - Target: The starter test is replaced with a stable storefront route-shell assertion based on PLASHOE UI that actually exists.
   - Acceptance: `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` does not contain or depend on a `learn react` assertion and exits 0.

8. **Frontend cart-state coverage**: Core cart store calculations and coupon state must be tested.
   - Current: `cartStore.js` has no tests for item counts, subtotal, total, coupon state, guest cart operations, or `clearCart`.
   - Target: Frontend tests cover `selectItemCount`, `selectSubtotal`, `selectTotal`, guest `addItem`, quantity changes, coupon state, and cart clearing with isolated store state.
   - Acceptance: Tests prove totals are computed from cart items and percentage discounts, coupon state resets on clear, and guest cart mutations do not require network calls.

9. **Frontend route and form behavior coverage**: Frontend tests must protect the Phase 1 UI contracts.
   - Current: There are no frontend tests for protected checkout access, checkout coupon feedback/auth guard, or contact failure preservation.
   - Target: Frontend tests cover protected route behavior, checkout coupon success/error feedback, unauthenticated checkout guard behavior, and contact form failure preserving entered data.
   - Acceptance: Tests use mocked APIs/stores and React Testing Library user-facing assertions to prove those behaviors without hitting real backend services.

10. **Contract checker retained as a cheap gate**: The Phase 1 static checker must remain runnable while real tests are added.
    - Current: `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` is the cheapest no-dependency check for the fixed Phase 1 contracts and currently reports no `FAIL` findings.
    - Target: The checker remains available and either overlaps with or complements the new tests for the Phase 1 defects.
    - Acceptance: `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` exits 0 and reports no `FAIL` findings after Phase 2 changes.

11. **Testing documentation and verification commands**: The project must document the new local test entrypoints.
    - Current: `docs/TESTING.md` documents the stale frontend starter test and the missing backend test command.
    - Target: Testing documentation reflects the backend command, frontend one-shot command, and retained contract checker command after Phase 2.
    - Acceptance: `docs/TESTING.md` or the relevant project testing doc lists the current backend, frontend, and checker commands, and those commands match the implemented scripts.

## Boundaries

**In scope:**
- Backend test runner and one-shot `npm test` command.
- Importable backend Express app support needed for route tests.
- Isolated backend test database harness for route tests.
- Backend route tests for auth, cart, coupon, order, and contact paths.
- Frontend replacement of the CRA starter test with PLASHOE-specific assertions.
- Frontend tests for cart store behavior, protected route behavior, checkout coupon/auth guard behavior, and contact failure preservation.
- Retaining the static core-flow contract checker as a cheap verification gate.
- Updating testing documentation for the new local commands.

**Out of scope:**
- Real payment provider tests - Phase 5 owns production payment behavior.
- Inventory reservation, stock decrement, and transactional checkout tests - Phase 4 owns checkout data integrity.
- Admin fulfillment tests - Phase 6 owns admin order operations.
- CI workflow creation - Phase 8 owns CI/CD and deployment readiness.
- Dependency audit remediation - Phase 3 owns dependency/security remediation.
- Create React App to Vite/Vitest frontend migration - v2 or dependency-remediation work owns frontend tooling migration unless CRA blocks basic tests.
- Browser end-to-end checkout tests - useful later, but Phase 2 focuses on backend route tests and frontend unit/component tests.
- Broad refactors unrelated to testability - only small structural changes needed to make tests import the app are allowed.

## Constraints

- Backend tests should use Vitest, Supertest, and `mongodb-memory-server` or an equivalent disposable local Mongo harness.
- Frontend tests should stay on CRA/Jest and React Testing Library for this phase.
- Test commands must run in one-shot mode and be suitable for later CI integration.
- Tests must not require a real production MongoDB, live external service, browser automation server, or manual seeded local data.
- Production behavior should remain unchanged except for the minimum backend app extraction needed for testability.
- The existing `Backend/.env.example` local untracked file must remain untouched unless the user explicitly includes it later.
- Payment and inventory checker warnings remain allowed Phase 2 non-blockers as long as they stay `WARN` and not `FAIL`.

## Acceptance Criteria

- [ ] `cd Backend && npm test` exists, runs once, and exits 0.
- [ ] Backend route tests can import the Express app without starting `app.listen(...)`.
- [ ] Backend tests use isolated disposable test data and pass on repeated runs without a real `MONGODB_URL`.
- [ ] Backend tests cover auth success/rejection, cart operations, coupon success/failure, missing-cart coupon removal, order creation from cart, empty-cart order rejection, and contact success/validation failure.
- [ ] `Frontend/Ecommerce-main/my-app/src/App.test.js` no longer asserts `learn react`.
- [ ] `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` exits 0.
- [ ] Frontend tests cover cart totals/discounts, guest cart mutations, coupon state reset, protected route behavior, checkout coupon/auth guard behavior, and contact failure preservation.
- [ ] `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` reports no `FAIL` findings.
- [ ] Testing documentation lists the backend test command, frontend one-shot test command, and retained contract-checker command.
- [ ] No CI workflow, payment provider, inventory transaction, admin fulfillment, dependency audit, or frontend tooling migration work is introduced in this phase.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.94 | 0.75 | met | Goal is tied to concrete missing commands and protected Phase 1 contracts. |
| Boundary Clarity | 0.93 | 0.70 | met | In-scope and out-of-scope work are explicit. |
| Constraint Clarity | 0.88 | 0.65 | met | Runner, database harness, frontend tooling, and CI boundaries are locked. |
| Acceptance Criteria | 0.91 | 0.70 | met | Command and coverage expectations are pass/fail. |
| **Ambiguity** | 0.08 | <=0.20 | met | Gate passed after user approved all recommendations. |

Status: `met` = dimension satisfies the minimum.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today for backend and frontend testing? | Backend has no test command; frontend has CRA/Jest with a stale starter test. |
| 1 | Researcher | What should trigger Phase 2 scope? | Protect Phase 1 core-flow fixes and establish real backend/frontend test commands. |
| 2 | Simplifier | What is the smallest useful backend test foundation? | Vitest, Supertest, disposable Mongo test harness, and one-shot `npm test`. |
| 2 | Simplifier | What is the smallest useful frontend test foundation? | Keep CRA/Jest, replace starter test, and cover cart/protected checkout/contact contracts. |
| 3 | Boundary Keeper | Which adjacent problems are excluded? | CI, payments, inventory transactions, admin fulfillment, dependency remediation, CRA migration, and browser E2E are out of scope. |
| 4 | Failure Analyst | What would cause rejection? | No backend test command, tests needing a real DB, stale `learn react` test, missing Phase 1 regression coverage, or checker `FAIL` findings. |
| 5 | Seed Closer | Should the checker be retained or converted fully? | Retain the checker while adding real tests around the same Phase 1 defect families. |
| 5 | Seed Closer | What commands define done? | Backend `npm test`, frontend one-shot Jest command, and the static contract checker must all pass. |

---

*Phase: 02-automated-test-foundation*
*Spec created: 2026-06-12*
*Next step: $gsd-discuss-phase 2 - implementation decisions (how to build what is specified above)*
