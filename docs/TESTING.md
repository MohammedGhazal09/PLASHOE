<!-- generated-by: gsd-doc-writer -->
# Testing

PLASHOE now has local automated coverage for the stabilized purchase-path, Phase 3 security contracts, and Phase 4 checkout data-integrity contracts:

- Backend API route tests run with Vitest, Supertest, and MongoMemoryReplSet.
- Frontend behavior tests run through the existing Vitest setup.
- Phase 5 payment tests use mocked provider seams and locally signed webhook payloads; they do not call live Stripe services.
- Frontend build, backend/frontend suites, and the static checker are part of the Phase 5 gate.
- The static core-flow contract checker remains as a root-level safety check.

## Current Test State

| Area | Current state | Evidence |
| --- | --- | --- |
| Backend test runner | Configured with `vitest run` | `Backend/package.json`, `Backend/vitest.config.js` |
| Backend API/security tests | Auth, cart/coupon, order, contact, checkout idempotency, checkout rollback, stock, cancellation, app health, config validation, security middleware, and request validation tests exist | `Backend/test/*.test.js` |
| Backend database isolation | Uses `MongoMemoryReplSet` with `wiredTiger` and clears collections after each test | `Backend/test/setup.js` |
| Frontend test runner | Configured through `vitest run` | `Frontend/Ecommerce-main/my-app/package.json` |
| Frontend behavior/security tests | App shell, cart store normalization, auth store persistence, public config, ProtectedRoute, Checkout idempotency/conflict behavior, order API headers, and Contact tests exist | `Frontend/Ecommerce-main/my-app/src/**/*.test.*` |
| Frontend build | Configured through `vite build` | `Frontend/Ecommerce-main/my-app/package.json` |
| Production dependency audits | Run manually through `npm audit --omit=dev` in each nested app | `Backend/package-lock.json`, `Frontend/Ecommerce-main/my-app/package-lock.json` |
| Static contract checker | Retained as a root command | `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` |
| CI test execution | Configured through GitHub Actions | `.github/workflows/ci.yml` |
| Coverage threshold | Not configured | No Jest/Vitest coverage threshold is configured |

## Commands

Run backend tests once:

```bash
cd Backend
npm test
```

Run backend tests in watch mode:

```bash
cd Backend
npm run test:watch
```

Run frontend dependency installation before frontend test commands in a fresh checkout:

```bash
cd Frontend/Ecommerce-main/my-app
npm install
```

Run the frontend Vitest suite once:

```bash
cd Frontend/Ecommerce-main/my-app
npm test
```

Run one frontend test file:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- App.test.js
```

Run Phase 4 focused backend checkout/cart tests:

```bash
cd Backend
npm test -- order.test.js cart.test.js
```

Run Phase 5 focused backend payment tests:

```bash
cd Backend
npm test -- order.test.js payment-state.test.js payment-webhook.test.js
```

Run Phase 4 focused frontend cart/checkout tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- cartStore.test.js Checkout.test.jsx ordersApi.test.js
```

Run Phase 5 focused frontend payment tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- Checkout.test.jsx CheckoutReturn.test.jsx ordersApi.test.js
```

Run the frontend production build:

```bash
cd Frontend/Ecommerce-main/my-app
npm run build
```

Run backend production dependency audit:

```bash
cd Backend
npm audit --omit=dev
```

Run frontend production dependency audit:

```bash
cd Frontend/Ecommerce-main/my-app
npm audit --omit=dev
```

Run the audit policy gate from the repository root:

```bash
node scripts/ci/check-audits.mjs
```

Run the retained static contract checker from the repository root:

```bash
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
```

## Verification Snapshot

Latest Phase 4 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- order.test.js cart.test.js` | Passed: 2 test files, 33 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- cartStore.test.js Checkout.test.jsx ordersApi.test.js` | Passed: 3 test suites, 15 tests |
| `cd Backend && npm test` | Passed: 9 test files, 71 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test` | Passed through the frontend one-shot test runner |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Passed with 8 `PASS`, 1 `WARN`, and no `FAIL` findings |

Latest Phase 5 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- order.test.js payment-state.test.js payment-webhook.test.js security-config.test.js` | Passed: 4 test files, 45 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- Checkout.test.jsx CheckoutReturn.test.jsx ordersApi.test.js` | Passed: 3 test suites, 14 tests |
| `cd Backend && npm test` | Passed: 11 test files, 92 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test` | Passed through the frontend one-shot test runner |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Passed with 8 `PASS`, 1 inventory heuristic `WARN`, and no `FAIL` findings |

Phase 10 removed the prior recurring frontend test and build warning noise. Treat new routine frontend test/build warnings as regressions unless a later phase explicitly documents an accepted risk.

## Backend Test Setup

The backend test harness is intentionally route-level:

- `Backend/app.js` exports the Express app without connecting to production MongoDB or opening a listener.
- `Backend/server.js` remains responsible for runtime `dotenv`, `connectDB()`, and `app.listen(...)`.
- `Backend/test/setup.js` starts MongoMemoryReplSet with `wiredTiger`, connects Mongoose, clears all collections after each test, and disconnects after the suite.
- `Backend/test/helpers/factories.js` creates users, products, carts, coupons, orders, contact messages, and shipping addresses.
- `Backend/test/helpers/auth.js` creates JWT bearer headers for protected routes.

Backend test files:

| File | Coverage |
| --- | --- |
| `Backend/test/app.test.js` | Importable app health smoke |
| `Backend/test/auth.test.js` | Register, duplicate register, login, invalid login, current user, missing token, invalid token |
| `Backend/test/cart.test.js` | Protected cart access, cart creation, stock-conflict add/update behavior, item add/update/remove/clear, coupon success/failure/minimum, no-cart coupon removal |
| `Backend/test/order.test.js` | Missing token, idempotency header validation, empty cart, missing shipping field, transactional checkout, exact retry, stale-key conflict, rollback failure seams, stock conflict, deleted product conflict details, coupon max-use/concurrency, checkout-created cancellation stock restore, legacy cancellation no-restore guard, and concurrent `PLS-` order-number uniqueness |
| `Backend/test/payment-state.test.js` | Payment status persistence, legacy `not_required` defaults, provider event uniqueness, paid/failure/cancellation/refund transition behavior, and one-time inventory restoration |
| `Backend/test/payment-webhook.test.js` | Raw-body signed Stripe webhook route coverage, invalid signatures, duplicate event no-ops, unresolved retry failures, success/failure/expiry reconciliation, related payment-intent lookup, and full/partial refund events |
| `Backend/test/contact.test.js` | Public contact success and required-field rejection |
| `Backend/test/security-config.test.js` | Runtime config validation, JWT secret length, JWT expiry format, and startup defaults |
| `Backend/test/security-middleware.test.js` | Rate limits, request-size caps, and stable security envelopes |
| `Backend/test/validation.test.js` | Request allowlists, query validation, param validation, and DTO behavior |

## Frontend Test Setup

The frontend uses Vitest with React Testing Library. Tests should stay user-facing and avoid implementation snapshots.

Frontend test files:

| File | Coverage |
| --- | --- |
| `Frontend/Ecommerce-main/my-app/src/App.test.js` | PLASHOE app shell smoke |
| `Frontend/Ecommerce-main/my-app/src/config/config.test.js` | Public MapTiler key fallback behavior |
| `Frontend/Ecommerce-main/my-app/src/store/cartStore.test.js` | Cart normalization for backend sync and guest items, persisted old-shape migration, selectors, guest mutations, discount totals, and clear behavior |
| `Frontend/Ecommerce-main/my-app/src/store/authStore.test.js` | Session-storage auth persistence, bearer header attachment, and logout-on-401 |
| `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.test.jsx` | Authenticated and unauthenticated route guard behavior |
| `Frontend/Ecommerce-main/my-app/src/api/ordersApi.test.js` | `Idempotency-Key` header propagation for checkout creation |
| `Frontend/Ecommerce-main/my-app/src/pages/Checkout.test.jsx` | Coupon success/failure, idempotent order submission, checkout `409` conflict cart preservation/sync, empty cart, unauthenticated submit guard |
| `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.test.jsx` | Checkout success/cancel return states, authoritative order refetch, paid/pending/failed/canceled labels, and recovery actions |
| `Frontend/Ecommerce-main/my-app/src/pages/Contact.test.jsx` | Required-field validation, successful submit clear, failed submit preservation |

## Payment Testing Notes

Automated payment tests are deterministic:

- Checkout-start tests inject a fake provider through `Backend/services/paymentProvider.js` and assert amount, metadata, retry, and compensation behavior.
- Webhook tests sign JSON payloads locally with HMAC and exercise the real Express route at `/api/webhooks/stripe`.
- Frontend payment tests mock `ordersApi` and browser navigation; no Stripe script, frontend Stripe key, live backend, or network call is required.

Optional manual local webhook exploration can use the Stripe CLI to forward events to `/api/webhooks/stripe`, but that is not an automated gate for this project.

Use Vitest module mocks for API wrappers, toast calls, and Leaflet. Route-oriented tests should use the real `react-router-dom` test routers. Do not require a live backend or browser map service for these tests.

## Static Contract Checker

The retained checker is not a replacement for route or UI tests. It is a fast source-level guard for known core-flow contract drift.

Run it from the repository root:

```bash
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
```

The checker writes:

- `.planning/spikes/001-core-flow-contract-check/results.json`
- `.planning/spikes/001-core-flow-contract-check/contract-report.md`

Current expected status:

- No `FAIL` findings.
- A `WARN` finding may remain if the static inventory heuristic does not detect the service-level checkout stock enforcement; backend tests are the authoritative Phase 4 stock proof.

If a future run changes only generated timestamps, do not commit that diff by itself.

## Coverage Requirements

No coverage thresholds are configured.

| Type | Threshold |
| --- | --- |
| Statements | Not configured |
| Branches | Not configured |
| Functions | Not configured |
| Lines | Not configured |

Do not add hard coverage thresholds in Phase 4. Add thresholds only after the project has broader stable coverage and CI enforcement.

## CI Integration

GitHub Actions is configured in `.github/workflows/ci.yml` and runs on `pull_request` and `push` to `main`. The workflow uses minimal repository permissions, cancels duplicate in-progress runs for the same ref, and keeps backend, frontend, static contract, and audit policy checks in separate jobs so failures are localized.

The CI jobs run the same local gates documented above:

1. Install backend dependencies in `Backend` with `npm ci`.
2. Run backend tests with `npm test`.
3. Install frontend dependencies in `Frontend/Ecommerce-main/my-app` with `npm ci`.
4. Run frontend tests with `npm test`.
5. Run the frontend production build with `npm run build`.
6. Run the retained static checker with `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.
7. Run the audit policy script with `node scripts/ci/check-audits.mjs`.

The workflow uses `actions/setup-node` with `node-version: lts/*`, which resolves to the current Node.js LTS release on GitHub-hosted runners. This replaces the earlier pinned EOL runtime.

## Audit Policy

`scripts/ci/check-audits.mjs` runs `npm audit --omit=dev --json` in both nested apps and enforces the current production dependency policy.

Backend production findings are blocking unless a future accepted-risk entry explicitly allows them. The current expected backend production audit status is clean.

Frontend production audit findings are also blocking. The former frontend tooling exception was removed in Phase 10 after the migration to Vite and Vitest.

Keep production payment, inventory, admin fulfillment, browser E2E, Lighthouse, ZAP, and hard coverage thresholds in their planned later phases.
