<!-- generated-by: gsd-doc-writer -->
# Testing

PLASHOE now has local automated coverage for the stabilized Phase 1 purchase-path contracts:

- Backend API route tests run with Vitest, Supertest, and MongoMemoryServer.
- Frontend behavior tests run through the existing Create React App Jest setup.
- The static core-flow contract checker remains as a root-level safety check.

## Current Test State

| Area | Current state | Evidence |
| --- | --- | --- |
| Backend test runner | Configured with `vitest run` | `Backend/package.json`, `Backend/vitest.config.js` |
| Backend API tests | Auth, cart/coupon, order, contact, and app health tests exist | `Backend/test/*.test.js` |
| Backend database isolation | Uses `mongodb-memory-server` and clears collections after each test | `Backend/test/setup.js` |
| Frontend test runner | Configured through `react-scripts test` | `Frontend/Ecommerce-main/my-app/package.json` |
| Frontend behavior tests | App shell, cart store, ProtectedRoute, Checkout, and Contact tests exist | `Frontend/Ecommerce-main/my-app/src/**/*.test.*` |
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

Run the retained static contract checker from the repository root:

```bash
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
```

## Verification Snapshot

Latest Phase 2 gate evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test` | Passed: 5 test files, 25 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | Passed: 5 test suites, 15 tests |
| `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Passed with no `FAIL` findings; current checker counts are 7 `PASS`, 2 `WARN` |

The frontend command currently emits React 18 deprecation/act warnings from the older CRA/React Testing Library stack. They do not fail the suite. Dependency audit remediation is intentionally deferred to Phase 3.

## Backend Test Setup

The backend test harness is intentionally route-level:

- `Backend/app.js` exports the Express app without connecting to production MongoDB or opening a listener.
- `Backend/server.js` remains responsible for runtime `dotenv`, `connectDB()`, and `app.listen(...)`.
- `Backend/test/setup.js` starts MongoMemoryServer, connects Mongoose, clears all collections after each test, and disconnects after the suite.
- `Backend/test/helpers/factories.js` creates users, products, carts, coupons, orders, contact messages, and shipping addresses.
- `Backend/test/helpers/auth.js` creates JWT bearer headers for protected routes.

Backend test files:

| File | Coverage |
| --- | --- |
| `Backend/test/app.test.js` | Importable app health smoke |
| `Backend/test/auth.test.js` | Register, duplicate register, login, invalid login, current user, missing token, invalid token |
| `Backend/test/cart.test.js` | Protected cart access, cart creation, item add/update/remove/clear, coupon success/failure/minimum, no-cart coupon removal |
| `Backend/test/order.test.js` | Missing token, empty cart, missing shipping field, successful cart checkout with coupon totals |
| `Backend/test/contact.test.js` | Public contact success and required-field rejection |

## Frontend Test Setup

The frontend still uses the Jest configuration bundled with Create React App. Tests should stay user-facing and avoid implementation snapshots.

Frontend test files:

| File | Coverage |
| --- | --- |
| `Frontend/Ecommerce-main/my-app/src/App.test.js` | PLASHOE app shell smoke |
| `Frontend/Ecommerce-main/my-app/src/store/cartStore.test.js` | Cart selectors, guest mutations, discount totals, and clear behavior |
| `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.test.jsx` | Authenticated and unauthenticated route guard behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/Checkout.test.jsx` | Coupon success/failure, order submission, empty cart, unauthenticated submit guard |
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
- `WARN` findings may remain for production payments and inventory enforcement because those are planned later phases.

If a future run changes only generated timestamps, do not commit that diff by itself.

## Coverage Requirements

No coverage thresholds are configured.

| Type | Threshold |
| --- | --- |
| Statements | Not configured |
| Branches | Not configured |
| Functions | Not configured |
| Lines | Not configured |

Do not add hard coverage thresholds in Phase 2. Add thresholds only after the project has broader stable coverage and CI enforcement.

## CI Integration

No CI workflow is currently present. The local commands above are the source of truth for Phase 2 verification.

Recommended future CI shape after this phase:

1. Install backend dependencies in `Backend`.
2. Run `npm test`.
3. Install frontend dependencies in `Frontend/Ecommerce-main/my-app`.
4. Run `npm test -- --watchAll=false`.
5. Run `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` from the repository root.

Keep dependency audit, production payment, inventory, admin fulfillment, browser E2E, and frontend tooling migration work in their planned later phases.
