---
phase: 02-automated-test-foundation
status: complete
created: 2026-06-12
research_mode: inline
skills_used: [api-testing, vitest, javascript-testing-patterns]
external_skills_installed: []
---

# Phase 02: Automated Test Foundation - Research

## RESEARCH COMPLETE

Phase 2 should be planned as a test infrastructure and regression-coverage phase, not as a feature phase. The implementation path is low-risk if it keeps the current Express/Mongoose and CRA/Jest boundaries, adds one importable backend app module, and uses real route tests around disposable MongoDB state.

## Scope Inputs

- `02-SPEC.md` locks 11 requirements for backend one-shot tests, importable app structure, disposable MongoDB tests, backend route coverage, frontend CRA/Jest coverage, retained checker, and testing docs.
- `02-CONTEXT.md` locks 31 implementation decisions, including `Backend/app.js`, `vitest run`, Supertest, `mongodb-memory-server`, resource-level backend suites, CRA/Jest frontend tests, Jest module mocks, and final verification commands.
- `01-CONTEXT.md` and Phase 1 summaries confirm the core contracts now pass the static checker with `PASS: 7`, `WARN: 2`; Phase 2 should protect those contracts with automated tests.

## Skills Research

The requested `find-skills` search was run with:

`npx skills find "vitest supertest mongodb memory server api testing react testing library zustand"`

Useful external matches were weak or low-install for this repo context:

- `shipshitdev/library@testing-expert` - 124 installs.
- `shipshitdev/library@testing-cicd-init` - 113 installs.
- `laurigates/claude-plugins@vitest-testing` - 74 installs.

Recommendation: do not install those matches for Phase 2. The installed local skills are more directly applicable and already available:

- `api-testing` - Supertest-style HTTP API coverage, auth headers, response shape assertions, and reset-between-test guidance.
- `vitest` - ESM-compatible backend runner and `vitest run` one-shot semantics.
- `javascript-testing-patterns` - Jest/Vitest/Testing Library patterns, module mocks, fixtures, and cleanup.

## Current Technical Findings

### Backend

- `Backend/package.json` has `"type": "module"` and no `test` script.
- `Backend/server.js` currently does all runtime work in one module: dotenv loading, `connectDB()`, app creation, route mounting, health route, error handler, and `app.listen(...)`.
- Route tests need to import an app without opening `PORT` or connecting to the production database. The smallest safe shape is:
  - Create `Backend/app.js` for `express()`, CORS, JSON middleware, route mounts, health route, and error handler.
  - Keep `Backend/server.js` for `dotenv.config()`, `connectDB()`, importing `app`, and `app.listen(PORT)`.
- Backend test setup should set `process.env.JWT_SECRET` and `process.env.JWT_EXPIRE`, start `MongoMemoryServer`, connect Mongoose to its URI, delete all collections after each test, and disconnect/stop after all tests.
- Resource-level suites map cleanly to the current code:
  - `Backend/test/auth.test.js`
  - `Backend/test/cart.test.js`
  - `Backend/test/order.test.js`
  - `Backend/test/contact.test.js`
  - shared helpers under `Backend/test/helpers`
- The backend models are sufficient for factories:
  - `User` hashes passwords on save and supports `matchPassword`.
  - `Product` requires `name`, `gender`, `category`, `image`, and `price.original/current`.
  - `Cart` stores `items`, `couponCode`, `discount`, and has `subtotal`/`total` virtuals.
  - `Coupon` uppercases `code` and exposes `isValid()`.
  - `Order` generates `orderNumber` in a pre-save hook.
  - `ContactMessage` has required `name`, `email`, and `message`.

### Frontend

- The frontend already has CRA/Jest and React Testing Library dependencies.
- `src/App.test.js` is stale and still asserts `learn react`.
- `src/setupTests.js` already imports `@testing-library/jest-dom`.
- `App.js` owns `BrowserRouter`, so full route injection at the `App` level is awkward. Keep `App.test.js` as a shallow smoke with module mocks for heavy page components if needed.
- `ProtectedRoute.jsx` can be tested directly with `MemoryRouter` and Zustand auth state.
- `cartStore.js` uses `persist`, so tests must clear `localStorage` and reset both cart and auth store state before each test.
- `Checkout.jsx` should be tested with mocked `useCartStore`, `useAuthStore`, `ordersApi.create`, and `react-hot-toast`; avoid live backend calls.
- `Contact.jsx` imports Leaflet and `leaflet/dist/leaflet.css`; tests should mock Leaflet and the CSS import path if CRA/Jest needs it.
- `@testing-library/user-event@13.5.0` is currently installed. Keep it for this phase unless a test failure forces an upgrade.

## Official Documentation Findings

- Vitest documents `vitest run` as the single-run command without watch mode; this supports using `"test": "vitest run"` in `Backend/package.json`.
- Supertest accepts an Express app/function and binds an ephemeral port if the server is not already listening; this supports importing `app` rather than starting `server.js`.
- `mongodb-memory-server` current quick start lists Node.js `20.19.0+`; local Node is `v24.8.0`, so the current runtime is compatible.
- Testing Library's guiding principle is user-like tests rather than implementation details; frontend plans should prefer roles/text/form behavior over internal component state.
- Create React App documents `--watchAll=false` or CI mode for one-shot Jest runs; this matches the Phase 2 frontend command.
- `user-event` v13 docs mark v13 as no longer maintained and recommend v14, but upgrading is dependency remediation unless Phase 2 tests require it.

## Recommended Architecture

### Backend Test Foundation

1. Add dev dependencies in `Backend`: `vitest`, `supertest`, `mongodb-memory-server`.
2. Add scripts:
   - `"test": "vitest run"`
   - `"test:watch": "vitest"`
3. Add `Backend/app.js` as the importable Express app.
4. Simplify `Backend/server.js` to runtime-only startup.
5. Add `Backend/test/setup.js` and `Backend/vitest.config.js`.
6. Add helper factories/auth helpers to keep route tests small.
7. Add one app/health smoke test before route suites.

### Backend Route Coverage

Route tests should assert status codes plus targeted response envelope fields:

- Auth:
  - `POST /api/auth/register` success returns `success: true`, user fields, and token.
  - Duplicate register returns `400` and `success: false`.
  - `POST /api/auth/login` success returns token.
  - Invalid login returns `401`.
  - `GET /api/auth/me` accepts a valid token and rejects missing/invalid tokens.
- Cart/coupon:
  - Protected routes reject missing token.
  - Add item validates product and size and persists `priceAtAdd`.
  - Update/remove/clear modify cart state.
  - Valid coupon stores `couponCode` and percentage `discount`.
  - Invalid coupon and min-order failure return failure envelopes.
  - Removing a coupon with no cart returns `success: true` and `data: null`.
- Order:
  - Empty cart order returns `400`.
  - Missing shipping fields return `400`.
  - Order creation from cart returns `201`, subtotal/discount/total/couponCode, increments coupon usage, and clears cart.
- Contact:
  - Valid public contact submission returns `201`.
  - Missing required fields return `400`.

### Frontend Coverage

- Replace the CRA starter test with a stable PLASHOE shell assertion.
- Add cart store tests for selectors, guest `addItem`, quantity updates, remove, `clearCart`, coupon percentage totals, and reset behavior.
- Add `ProtectedRoute.test.jsx` using `MemoryRouter` and direct Zustand state setup.
- Add `Checkout.test.jsx` with mocked stores/API/toast and user-visible assertions for coupon success/failure and unauthenticated defensive guard.
- Add `Contact.test.jsx` with mocked Leaflet and contact API success/failure behavior.

## Validation Architecture

The phase should be validated as a sequence of increasingly broad checks:

1. After Plan 02-01:
   - `cd Backend && npm test -- --runInBand` is not a Vitest flag and must not be used.
   - Correct quick check is `cd Backend && npm test`.
   - The initial suite should prove the app can be imported and health route can be tested.
2. After Plan 02-02:
   - `cd Backend && npm test` must pass all auth/cart/order/contact route suites twice without manual DB setup.
3. After Plan 02-03:
   - `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` must pass after replacing the stale starter assertion.
4. After Plan 02-04:
   - Backend tests pass.
   - Frontend tests pass.
   - `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` reports no `FAIL` findings.
   - `docs/TESTING.md` lists the implemented backend, frontend, and checker commands.

No manual-only verification is required. If dependency installation or Mongo binary download fails, that blocker must be documented with the exact failing command before weakening acceptance criteria.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `mongodb-memory-server` binary download fails | Backend route tests cannot run locally | Pin/configure the dependency first; document blocker rather than switching to production Mongo |
| App extraction changes runtime behavior | Backend startup regression | Keep middleware, route mounts, health route, and error handler identical in `app.js`; `server.js` only imports and listens |
| Persisted Zustand state leaks between tests | Flaky frontend tests | Clear localStorage and reset store state before each test |
| Leaflet breaks Jest environment | Contact tests fail before rendering form | Mock `leaflet` and CSS import behavior |
| user-event v13 API differs from v14 examples | Frontend tests fail or hang | Use the installed v13 API; avoid v14-only `userEvent.setup()` unless dependency is upgraded intentionally |
| Tests become broad and brittle | Slow or unreliable Phase 2 | Use targeted assertions and avoid snapshots |

## Planning Recommendation

Use four plans:

1. `02-01` - backend runner, app extraction, test setup, factories, health smoke.
2. `02-02` - backend auth/cart/coupon/order/contact route suites.
3. `02-03` - frontend App/cart store/protected route/checkout/contact tests.
4. `02-04` - testing docs, retained checker, final command verification, summary evidence.

Wave structure:

- Wave 1: `02-01` and `02-03` can proceed independently.
- Wave 2: `02-02` depends on `02-01`.
- Wave 3: `02-04` depends on `02-02` and `02-03`.

## Sources

- Vitest CLI: https://vitest.dev/guide/cli
- Supertest README: https://github.com/forwardemail/supertest
- mongodb-memory-server quick start: https://typegoose.github.io/mongodb-memory-server/docs/guides/quick-start-guide/
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/
- Create React App running tests: https://create-react-app.dev/docs/running-tests/
- user-event v13 docs: https://testing-library.com/docs/user-event/v13
