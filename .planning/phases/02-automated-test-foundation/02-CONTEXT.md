# Phase 02: automated-test-foundation - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 creates PLASHOE's automated test foundation around the stabilized purchase path. It adds one-shot backend and frontend test commands, backend route tests for auth/cart/coupon/order/contact behavior, frontend tests for the storefront shell, cart state, protected checkout, checkout coupon/auth guard behavior, and contact form failure preservation, while retaining the Phase 1 static contract checker as a cheap gate.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**11 requirements are locked.** See `02-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `02-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Backend test runner and one-shot `npm test` command.
- Importable backend Express app support needed for route tests.
- Isolated backend test database harness for route tests.
- Backend route tests for auth, cart, coupon, order, and contact paths.
- Frontend replacement of the CRA starter test with PLASHOE-specific assertions.
- Frontend tests for cart store behavior, protected route behavior, checkout coupon/auth guard behavior, and contact failure preservation.
- Retaining the static core-flow contract checker as a cheap verification gate.
- Updating testing documentation for the new local commands.

**Out of scope (from SPEC.md):**
- Real payment provider tests - Phase 5 owns production payment behavior.
- Inventory reservation, stock decrement, and transactional checkout tests - Phase 4 owns checkout data integrity.
- Admin fulfillment tests - Phase 6 owns admin order operations.
- CI workflow creation - Phase 8 owns CI/CD and deployment readiness.
- Dependency audit remediation - Phase 3 owns dependency/security remediation.
- Create React App to Vite/Vitest frontend migration - v2 or dependency-remediation work owns frontend tooling migration unless CRA blocks basic tests.
- Browser end-to-end checkout tests - useful later, but Phase 2 focuses on backend route tests and frontend unit/component tests.
- Broad refactors unrelated to testability - only small structural changes needed to make tests import the app are allowed.

</spec_lock>

<decisions>
## Implementation Decisions

### Backend App Boundary and Test Runner
- **D-01:** Add a new `Backend/app.js` that builds and exports the Express app. Keep `Backend/server.js` responsible for dotenv loading, database connection, and `app.listen(...)`.
- **D-02:** Backend `npm test` should run `vitest run` so it executes once and exits without watch mode.
- **D-03:** Add backend test dependencies as dev dependencies and lock them in `Backend/package-lock.json`. Expected tools are Vitest, Supertest, and `mongodb-memory-server` unless implementation proves an equivalent disposable Mongo harness is safer.
- **D-04:** Keep production behavior unchanged except for the minimum app extraction needed for testability.

### Backend Persistence, Fixtures, and Isolation
- **D-05:** Use a central `Backend/test/setup.js` for `mongodb-memory-server`, Mongoose connect/disconnect lifecycle, and test cleanup.
- **D-06:** Clean backend state by deleting all model collections after each test instead of dropping the database per assertion or relying on suite-level cleanup only.
- **D-07:** Use shared lightweight backend factories for users, products, carts, coupons, orders, and contact messages with local per-test overrides. Do not reuse `Backend/utils/seedData.js` as the primary test fixture source.
- **D-08:** If `mongodb-memory-server` binary setup fails, first try pinning or configuring the package. If a disposable Mongo harness cannot be made to run, document the blocker before weakening tests to mocks or local Mongo.

### Backend Route-Test Coverage
- **D-09:** Organize backend API tests by route/resource, not as one large file: auth, cart/coupon, order, and contact suites are the expected split.
- **D-10:** Auth tests should cover register, login, current-user lookup, missing-token rejection, invalid-token rejection, and protected route access. Use route-level auth flows for auth behavior and helper-created JWTs for protected route setup in non-auth suites.
- **D-11:** Cart/coupon/order tests should cover happy paths plus key errors required by `02-SPEC.md`, not exhaustive branch coverage.
- **D-12:** Include an integration path where a valid coupon applied to a cart affects order discount/totals and order creation clears the cart.
- **D-13:** Contact API tests should cover successful public submission and required-field rejection.
- **D-14:** Use targeted response assertions such as status, `success`, `message`, `data`, totals, and key fields. Avoid broad snapshots or only checking status codes.

### Frontend Test Strategy
- **D-15:** Replace `Frontend/Ecommerce-main/my-app/src/App.test.js` with a stable PLASHOE app shell assertion, such as rendered navigation/logo/storefront shell content, not `learn react`.
- **D-16:** Keep frontend tests on CRA/Jest/React Testing Library for Phase 2. Do not migrate the frontend to Vite or Vitest in this phase.
- **D-17:** Use minimal `App` smoke coverage and targeted `MemoryRouter` component/page tests where route state matters.
- **D-18:** Test `ProtectedRoute` by setting or mocking Zustand auth state directly and rendering inside `MemoryRouter`; there is no provider layer to introduce.
- **D-19:** For cart store tests, clear localStorage and reset Zustand state before each test. Mock API calls only for authenticated paths; guest cart operations should run without network calls.
- **D-20:** Cart store tests should cover selectors, guest add/update/remove/clear behavior, percentage discount calculations, coupon state, and coupon reset on clear.
- **D-21:** Checkout tests should assert user-visible behavior with mocked stores and API modules. Avoid extracting helpers solely for tests unless the current page shape makes reliable tests impractical.
- **D-22:** Contact page tests should mock Leaflet and `contactApi.submit`; successful submission should clear fields, and failed submission should preserve entered data.
- **D-23:** Keep the existing `@testing-library/user-event@13.5.0` for Phase 2 unless tests require an upgrade. Record the v13 EOL status as a future dependency follow-up, not Phase 2 scope.
- **D-24:** Use Jest module mocks for frontend API wrappers instead of MSW, live backend calls, or browser E2E.

### Contract Checker, Docs, and Verification
- **D-25:** Keep `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` as a separate documented root command for Phase 2. Do not convert it fully into tests or package scripts yet.
- **D-26:** Update `docs/TESTING.md` during execution to list the backend `npm test`, frontend one-shot CRA test command, and retained contract checker command.
- **D-27:** Do not add hard coverage thresholds in Phase 2. Coverage can be advisory only if cheap to expose.
- **D-28:** Phase 2 completion verification should include `cd Backend && npm test`, `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`, and `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`. A frontend build is advisory if frontend changes become broad; dependency audit remains Phase 3.

### Execution Order and Local Work Handling
- **D-29:** Plan and execute in this order: backend app extraction and harness first, backend route tests second, frontend tests third, docs and checker verification last.
- **D-30:** Leave the existing untracked `Backend/.env.example` untouched unless the user explicitly includes it later.
- **D-31:** No CI workflow, payment provider, inventory transaction, admin fulfillment, dependency audit, or frontend tooling migration work should enter Phase 2.

### the agent's Discretion
- The planner and executor may choose exact filenames inside `Backend/test` and frontend test co-location details as long as the command, isolation, and coverage decisions above remain true.
- The planner may split frontend tests into page/component/store files based on the current import seams.
- If a test cannot be made reliable without a small production refactor, the planner may include the smallest testability refactor that preserves runtime behavior.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/02-automated-test-foundation/02-SPEC.md` - Locked Phase 2 requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase ordering, Phase 2 goal, canonical refs, and success criteria.
- `.planning/REQUIREMENTS.md` - `TEST-01` through `TEST-04` traceability.
- `.planning/STATE.md` - Current phase focus and known project risks.

### Testing Documentation and Codebase Maps
- `docs/TESTING.md` - Current testing docs to update with the new backend, frontend, and checker commands.
- `.planning/codebase/TESTING.md` - Existing test tooling, gaps, commands, and recommended backend/frontend test targets.
- `.planning/codebase/CONVENTIONS.md` - Local JavaScript, controller, store, error handling, and formatting conventions.
- `.planning/codebase/STRUCTURE.md` - Backend/frontend directory layout and expected locations for routes, controllers, models, stores, pages, and tests.

### Phase 1 Context and Contract Checker
- `.planning/phases/01-core-flow-stabilization/01-CONTEXT.md` - Carry-forward decisions for contact, checkout auth, coupon behavior, and checker handling.
- `.planning/spikes/001-core-flow-contract-check/README.md` - Checker purpose, run command, and role as a cheap pre-test safety net.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Runnable static checker that must remain available.
- `.planning/spikes/001-core-flow-contract-check/results.json` - Current checker evidence showing `PASS: 7` and `WARN: 2`.

### Backend Source Files Expected to Change or Be Tested
- `Backend/package.json` - Add backend test scripts and dev dependencies.
- `Backend/package-lock.json` - Lock backend test dev dependencies.
- `Backend/server.js` - Split runtime startup from importable app creation.
- `Backend/config/db.js` - Existing MongoDB connection helper to keep out of test app import side effects.
- `Backend/routes/authRoutes.js` - Auth route coverage.
- `Backend/routes/cartRoutes.js` - Cart and coupon route coverage.
- `Backend/routes/orderRoutes.js` - Order route coverage.
- `Backend/routes/contactRoutes.js` - Public contact and admin route boundary coverage.
- `Backend/middleware/auth.js` - Protected route rejection and JWT behavior.
- `Backend/controllers/authController.js` - Register/login/me behavior.
- `Backend/controllers/cartController.js` - Cart, coupon, and missing-cart coupon removal behavior.
- `Backend/controllers/orderController.js` - Order creation and empty-cart rejection behavior.
- `Backend/controllers/contactController.js` - Contact submit validation behavior.
- `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Cart.js`, `Backend/models/Order.js`, `Backend/models/Coupon.js`, `Backend/models/ContactMessage.js` - Mongoose models needed for factories and route assertions.

### Frontend Source Files Expected to Change or Be Tested
- `Frontend/Ecommerce-main/my-app/package.json` - Existing CRA/Jest command and testing-library versions.
- `Frontend/Ecommerce-main/my-app/src/setupTests.js` - Existing jest-dom setup.
- `Frontend/Ecommerce-main/my-app/src/App.js` - Storefront shell and route structure.
- `Frontend/Ecommerce-main/my-app/src/App.test.js` - Replace stale starter test.
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` - Protected checkout/auth guard behavior.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` - Cart selectors, guest state, coupon state, and clear behavior.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` - Auth state used by ProtectedRoute and checkout tests.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` - Coupon feedback and auth guard behavior.
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` - Contact success/failure form behavior.
- `Frontend/Ecommerce-main/my-app/src/api/cartApi.js`, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`, `Frontend/Ecommerce-main/my-app/src/api/authApi.js` - Frontend API modules to mock in tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/routes/*.js` and `Backend/controllers/*.js`: route/controller split is already resource-based, so tests should mirror that structure.
- `Backend/middleware/auth.js`: existing `protect` and `admin` middleware provide direct targets for missing/invalid token and protected route behavior.
- Mongoose models under `Backend/models`: usable for lightweight test factories and DB assertions.
- `Frontend/Ecommerce-main/my-app/src/setupTests.js`: already loads jest-dom matchers for React Testing Library assertions.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`: already exports selectors `selectItemCount`, `selectSubtotal`, and `selectTotal` that can be tested directly.
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`: existing route guard can be covered without adding a provider abstraction.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs`: existing no-dependency static checker remains the cheap regression gate.

### Established Patterns
- Backend package is ESM (`"type": "module"`), so backend tests and helper imports must use ESM-compatible syntax.
- Backend controllers return JSON envelopes shaped around `success`, `message`, and `data`, with local `try/catch` blocks.
- Backend cart and order routers are protected with `router.use(protect)` while contact POST stays public.
- Frontend tests currently use CRA/Jest with `.test.js` naming and React Testing Library.
- Frontend app state uses persisted Zustand stores, so tests must reset state and localStorage.
- Frontend pages and stores communicate through API wrapper modules and `{ success, message }` action results.
- Source style uses 2-space indentation, semicolons, and mostly single quotes.

### Integration Points
- Backend app extraction connects the new `Backend/app.js` module to `Backend/server.js` and Supertest route suites.
- Backend test setup connects `mongodb-memory-server` to Mongoose and all route tests.
- Cart/coupon/order tests connect `Cart`, `Coupon`, `Order`, `Product`, and authenticated `User` fixtures through real API routes.
- Frontend route tests connect `App.js`, `ProtectedRoute.jsx`, `authStore`, and `MemoryRouter`.
- Frontend cart tests connect store selectors and persisted guest cart actions without backend services.
- Checkout/contact page tests connect mocked API wrappers, mocked stores, and user-facing DOM assertions.
- Documentation updates connect implemented commands back to `docs/TESTING.md`.

</code_context>

<specifics>
## Specific Ideas

- User approved all 29 implementation recommendations from the one-shot Phase 2 discussion on 2026-06-12.
- Official docs checked during discussion: Vitest CLI for `vitest run`, Supertest for importing an app/function, mongodb-memory-server for package/runtime expectations, React Testing Library for user-facing tests, and user-event v13 docs noting v13 EOL.
- Current local Node version during discussion was `v24.8.0`, which satisfies current `mongodb-memory-server` v11 Node requirements.
- Existing frontend `@testing-library/user-event` is `13.5.0`; keep it unless the tests require an upgrade.
- Existing untracked `Backend/.env.example` is unrelated local work and must remain untouched.

</specifics>

<deferred>
## Deferred Ideas

- Upgrading `@testing-library/user-event` from v13 to v14 is deferred to dependency remediation unless Phase 2 tests force the upgrade.
- CI workflow creation remains deferred to Phase 8.
- Dependency audit remediation remains deferred to Phase 3.
- Real payment provider tests remain deferred to Phase 5.
- Inventory/transaction/concurrency tests remain deferred to Phase 4.
- Browser E2E checkout tests remain deferred until after backend/frontend unit and route tests are stable.

</deferred>

---

*Phase: 02-automated-test-foundation*
*Context gathered: 2026-06-12*
