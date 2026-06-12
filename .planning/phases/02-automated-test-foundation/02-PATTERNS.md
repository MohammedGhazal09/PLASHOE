---
phase: 02-automated-test-foundation
artifact: patterns
status: complete
created: 2026-06-12
---

# Phase 02: automated-test-foundation - Pattern Map

## Purpose

This pattern map captures the closest existing PLASHOE analogs for the files Phase 2 will create or modify. Executors should read these before editing so test infrastructure follows current project shape instead of introducing a parallel architecture.

## Backend App and Runtime Boundary

| New or modified file | Role | Closest analog | Pattern to preserve |
| --- | --- | --- | --- |
| `Backend/app.js` | Importable Express app for Supertest | `Backend/server.js` | Same middleware, CORS options, route mounts, health route, and error handler |
| `Backend/server.js` | Runtime entrypoint | Current `Backend/server.js` | Keep dotenv, `connectDB()`, `PORT`, and `app.listen(...)` here |
| `Backend/vitest.config.js` | Vitest backend config | No local analog | ESM config, `environment: 'node'`, setup file points at `test/setup.js` |
| `Backend/test/setup.js` | Disposable Mongo harness | `Backend/config/db.js` | Mongoose is the single DB client; tests use a memory URI instead of `process.env.MONGO_URI` |

Important current app shape:

- `Backend/server.js` imports routes from `./routes/*Routes.js`.
- `/api/auth`, `/api/products`, `/api/cart`, `/api/orders`, `/api/coupons`, and `/api/contact` are mounted in one place.
- Health route returns `{ status: "ok", message: "PLASHOE API is running" }`.
- Error handler returns `{ success: false, message }`.

## Backend Route Tests

| Test file | Existing source to mirror | Fixture/model dependencies |
| --- | --- | --- |
| `Backend/test/auth.test.js` | `Backend/routes/authRoutes.js`, `Backend/controllers/authController.js`, `Backend/middleware/auth.js` | `User`, JWT secret |
| `Backend/test/cart.test.js` | `Backend/routes/cartRoutes.js`, `Backend/controllers/cartController.js` | `User`, `Product`, `Cart`, `Coupon` |
| `Backend/test/order.test.js` | `Backend/routes/orderRoutes.js`, `Backend/controllers/orderController.js` | `User`, `Product`, `Cart`, `Coupon`, `Order` |
| `Backend/test/contact.test.js` | `Backend/routes/contactRoutes.js`, `Backend/controllers/contactController.js` | `ContactMessage`, admin `User` if admin routes are touched |

Testing pattern:

- Import `request` from `supertest`.
- Import `app` from `../app.js`.
- Use helper-created valid auth tokens for non-auth suites.
- Assert response envelope fields with targeted expectations: `success`, `message`, `data`, totals, IDs, and status codes.
- Do not snapshot whole Mongoose documents.

## Backend Helpers

Recommended helper files:

- `Backend/test/helpers/factories.js`
- `Backend/test/helpers/auth.js`

Factory patterns:

- `createUser(overrides)` should call `User.create` so password hashing remains real.
- `createProduct(overrides)` should include required product fields: `name`, `gender`, `category`, `image`, `price.original`, `price.current`.
- `createCoupon(overrides)` should default to an active uppercase code with `discountPercentage`.
- `createCartForUser(user, items, overrides)` should persist `priceAtAdd` from product price.
- `validShippingAddress(overrides)` should include the backend-required fields: `firstName`, `lastName`, `country`, `street`, `city`, `state`, `zipCode`, `phone`.
- `authHeader(user)` should sign `{ id: user._id }` with `process.env.JWT_SECRET` and return `{ Authorization: "Bearer <token>" }`.

## Frontend Tests

| Test file | Existing source to mirror | Pattern to preserve |
| --- | --- | --- |
| `Frontend/Ecommerce-main/my-app/src/App.test.js` | `src/App.js`, `src/components/Layout.jsx`, route page exports | PLASHOE shell smoke; no `learn react` assertion |
| `Frontend/Ecommerce-main/my-app/src/store/cartStore.test.js` | `src/store/cartStore.js`, `src/store/authStore.js` | Reset Zustand and localStorage between tests |
| `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.test.jsx` | `src/components/ProtectedRoute.jsx` | Render inside `MemoryRouter`; assert redirect/children |
| `Frontend/Ecommerce-main/my-app/src/pages/Checkout.test.jsx` | `src/pages/Checkout.jsx` | Mock stores, `ordersApi`, and `react-hot-toast`; assert user-visible behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/Contact.test.jsx` | `src/pages/Contact.jsx` | Mock `leaflet`, contact API, and toast; assert form fields |

Frontend mocking patterns:

- Keep `@testing-library/react` real.
- Prefer semantic queries such as role, label text, text, and placeholder.
- Use Jest module mocks for API wrappers and stores.
- Clear persisted storage and restore mocks in `beforeEach` or `afterEach`.
- Do not introduce MSW or browser E2E for this phase.

## Documentation and Checker

| File | Existing role | Phase 2 action |
| --- | --- | --- |
| `docs/TESTING.md` | Current testing state and commands | Update to list backend `npm test`, frontend one-shot test, and static checker |
| `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Cheap Phase 1 contract checker | Keep runnable as separate root command |
| `.planning/spikes/001-core-flow-contract-check/results.json` | Current checker evidence | Do not commit timestamp-only churn |

## Constraints to Repeat in Plans

- `Backend/.env.example` remains untouched.
- No CI workflow in Phase 2.
- No dependency audit remediation in Phase 2.
- No payment provider, inventory transaction, admin fulfillment, frontend tooling migration, or browser E2E.
- No hard coverage thresholds.
