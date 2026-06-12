<!-- generated-by: gsd-doc-writer -->
# Testing

PLASHOE now has local automated coverage for the stabilized purchase-path, Phase 3 security contracts, and Phase 4 checkout data-integrity contracts:

- Backend API route tests run with Vitest, Supertest, and MongoMemoryReplSet.
- Frontend behavior tests run through the existing Create React App Jest setup.
- Frontend build, backend/frontend suites, and the static checker are part of the Phase 4 gate.
- The static core-flow contract checker remains as a root-level safety check.

## Current Test State

| Area | Current state | Evidence |
| --- | --- | --- |
| Backend test runner | Configured with `vitest run` | `Backend/package.json`, `Backend/vitest.config.js` |
| Backend API/security tests | Auth, cart/coupon, order, contact, checkout idempotency, checkout rollback, stock, cancellation, app health, config validation, security middleware, and request validation tests exist | `Backend/test/*.test.js` |
| Backend database isolation | Uses `MongoMemoryReplSet` with `wiredTiger` and clears collections after each test | `Backend/test/setup.js` |
| Frontend test runner | Configured through `react-scripts test` | `Frontend/Ecommerce-main/my-app/package.json` |
| Frontend behavior/security tests | App shell, cart store normalization, auth store persistence, public config, ProtectedRoute, Checkout idempotency/conflict behavior, order API headers, and Contact tests exist | `Frontend/Ecommerce-main/my-app/src/**/*.test.*` |
| Frontend build | Configured through `react-scripts build` | `Frontend/Ecommerce-main/my-app/package.json` |
| Production dependency audits | Run manually through `npm audit --omit=dev` in each nested app | `Backend/package-lock.json`, `Frontend/Ecommerce-main/my-app/package-lock.json` |
| Static contract checker | Retained as a root command | `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` |
| CI test execution | Not configured | No CI workflow is currently documented as present |
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

Run the frontend Jest suite once:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- --watchAll=false
```

Run one frontend test file:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- App.test.js --watchAll=false
```

Run Phase 4 focused backend checkout/cart tests:

```bash
cd Backend
npm test -- order.test.js cart.test.js
```

Run Phase 4 focused frontend cart/checkout tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- cartStore.test.js Checkout.test.jsx ordersApi.test.js --watchAll=false
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

Run the retained static contract checker from the repository root:

```bash
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
```

## Verification Snapshot

Latest Phase 4 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- order.test.js cart.test.js` | Passed: 2 test files, 33 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- cartStore.test.js Checkout.test.jsx ordersApi.test.js --watchAll=false` | Passed: 3 test suites, 15 tests |
| `cd Backend && npm test` | Passed: 9 test files, 71 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | Passed: 8 test suites, 28 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed with the existing `OrderDetail.jsx` hook dependency warning plus CRA/Browserslist toolchain notices |
| `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Passed with 8 `PASS`, 1 `WARN`, and no `FAIL` findings |

The frontend test command currently emits React 18 deprecation/act warnings from the older CRA/React Testing Library stack. They do not fail the suite. The frontend build also emits an existing `OrderDetail.jsx` hook dependency warning.

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
| `Backend/test/order.test.js` | Missing token, idempotency header validation, empty cart, missing shipping field, transactional checkout, exact retry, stale-key conflict, rollback failure seams, stock conflict, deleted product conflict, coupon max-use/concurrency, cancellation stock restore, and concurrent `PLS-` order-number uniqueness |
| `Backend/test/contact.test.js` | Public contact success and required-field rejection |
| `Backend/test/security-config.test.js` | Runtime config validation, JWT secret length, JWT expiry format, and startup defaults |
| `Backend/test/security-middleware.test.js` | Rate limits, request-size caps, and stable security envelopes |
| `Backend/test/validation.test.js` | Request allowlists, query validation, param validation, and DTO behavior |

## Frontend Test Setup

The frontend still uses the Jest configuration bundled with Create React App. Tests should stay user-facing and avoid implementation snapshots.

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
| `Frontend/Ecommerce-main/my-app/src/pages/Contact.test.jsx` | Required-field validation, successful submit clear, failed submit preservation |

Use Jest module mocks for API wrappers, toast calls, and Leaflet. Route-oriented tests should use the real `react-router-dom` test routers. Do not require a live backend or browser map service for these tests.

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

No CI workflow is currently present. The local commands above are the source of truth for Phase 4 verification.

Recommended future CI shape after this phase:

1. Install backend dependencies in `Backend`.
2. Run `npm test`.
3. Install frontend dependencies in `Frontend/Ecommerce-main/my-app`.
4. Run `npm test -- --watchAll=false`.
5. Run `npm run build`.
6. Run `npm audit --omit=dev` in both nested apps and fail or require an accepted-risk entry for non-clean output.
7. Run `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` from the repository root.

Keep production payment, inventory, admin fulfillment, browser E2E, and frontend tooling migration work in their planned later phases.
