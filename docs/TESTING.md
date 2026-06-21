<!-- generated-by: gsd-doc-writer -->
# Testing

PLASHOE now has local automated coverage for the stabilized purchase-path, Phase 3 security contracts, Phase 4 checkout data-integrity contracts, Phase 13 admin console contracts, Phase 14 wishlist saved-intent contracts, Phase 15 product detail/review contracts, Phase 16 catalog discovery/search contracts, Phase 17 checkout conversion/cart-merge contracts, Phase 18 returns/exchanges/RMA contracts, Phase 19 sustainability/product-care content contracts, Phase 20 retention/recommendation contracts, and Phase 21 lookbook/bundle contracts:

- Backend API route tests run with Vitest, Supertest, and MongoMemoryReplSet.
- Frontend behavior tests run through the existing Vitest setup.
- Phase 5 payment tests use mocked provider seams and locally signed webhook payloads; they do not call live Stripe services.
- Frontend build, backend/frontend suites, and the static checker are part of the Phase 5 gate.
- The static core-flow contract checker remains as a root-level safety check.

## Current Test State

| Area | Current state | Evidence |
| --- | --- | --- |
| Backend test runner | Configured with `vitest run` | `Backend/package.json`, `Backend/vitest.config.js` |
| Backend API/security tests | Auth, cart/coupon, wishlist, product detail, sustainability validation, retention intent, recommendations, lookbook entries, product search/filtering, reviews, order, returns/exchanges, contact, checkout idempotency, checkout rollback, stock, cancellation, app health, config validation, security middleware, and request validation tests exist | `Backend/test/*.test.js` |
| Backend database isolation | Uses `MongoMemoryReplSet` with `wiredTiger` and clears collections after each test | `Backend/test/setup.js` |
| Frontend test runner | Configured through `vitest run` | `Frontend/Ecommerce-main/my-app/package.json` |
| Frontend behavior/security tests | App shell, cart store normalization, wishlist store/API/UI behavior, product detail/review/sustainability/retention UI behavior, shoppable lookbook behavior, catalog URL search/filter behavior, auth store persistence, public config, ProtectedRoute/AdminRoute, Checkout idempotency/conflict behavior, order API headers, return/exchange UI/API behavior, admin screens, and Contact tests exist | `Frontend/Ecommerce-main/my-app/src/**/*.test.*` |
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

Run Phase 14 focused backend wishlist tests:

```bash
cd Backend
npm test -- wishlist.test.js
```

Run Phase 14 focused frontend wishlist tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- src/api/wishlistApi.test.js src/store/wishlistStore.test.js src/components/WishlistButton.test.jsx src/components/ProductCard.test.jsx src/components/QuickViewModal.test.jsx src/components/Header.test.jsx src/pages/Account.test.jsx src/config/config.test.js
```

Run Phase 15 focused backend product detail and review tests:

```bash
cd Backend
npm test -- product-detail.test.js review.test.js product.test.js
```

Run Phase 15 focused frontend product detail and review tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- --run src/api/productsApi.test.js src/api/reviewsApi.test.js src/pages/ProductDetail.test.jsx src/components/ProductCard.test.jsx src/components/WishlistButton.test.jsx src/services/catalog/normalizeProduct.test.js src/config/config.test.js
```

Run Phase 16 focused backend catalog discovery tests:

```bash
cd Backend
npm test -- product.test.js
```

Run Phase 16 focused frontend catalog discovery tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- --run src/components/ProductGrid.test.jsx src/services/catalog/catalogService.test.js src/api/productsApi.test.js src/hooks/useCatalogUrlQuery.test.jsx
```

Run Phase 17 focused backend checkout conversion tests:

```bash
cd Backend
npm test -- cart.test.js order.test.js
```

Run Phase 17 focused frontend checkout conversion tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- cartStore.test.js authStore.test.js Account.test.jsx Checkout.test.jsx ProtectedRoute.test.jsx CheckoutReturn.test.jsx
```

Run Phase 18 focused backend returns/exchanges tests:

```bash
cd Backend
npm test -- return-request.test.js payment-webhook.test.js
```

Run Phase 18 focused frontend returns/exchanges tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- returnsApi.test.js adminApi.test.js AdminReturns.test.jsx OrderDetail.test.jsx
```

Run Phase 19 focused backend sustainability/product-care tests:

```bash
cd Backend
npm test -- product.test.js product-detail.test.js
```

Run Phase 19 focused frontend sustainability/product-care tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- normalizeProduct.test.js ProductDetail.test.jsx AdminResourceForms.test.jsx
```

Run Phase 20 focused backend retention tests:

```bash
cd Backend
npm test -- retention.test.js order.test.js
```

Run Phase 20 focused frontend retention tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- backInStockApi.test.js recommendationsApi.test.js ordersApi.test.js ProductDetail.test.jsx OrderDetail.test.jsx normalizeProduct.test.js
```

Run Phase 21 focused backend lookbook tests:

```bash
cd Backend
npm test -- lookbook.test.js
```

Run Phase 21 focused frontend lookbook tests:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- lookbookApi.test.js adminApi.test.js AdminResourceForms.test.jsx LookBook.test.jsx
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

Latest Phase 14 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- wishlist.test.js` | Passed: 1 test file, 7 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --run src/api/wishlistApi.test.js src/store/wishlistStore.test.js src/components/WishlistButton.test.jsx src/components/ProductCard.test.jsx src/components/QuickViewModal.test.jsx src/components/Header.test.jsx src/pages/Account.test.jsx src/config/config.test.js` | Passed: 8 test files, 28 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| Headless Chrome UI smoke at `http://127.0.0.1:5174` with `REACT_APP_ENABLE_WISHLIST=true` | Passed desktop home save/count smoke and mobile account wishlist management smoke; screenshots saved under `.planning/phases/14-wishlist-and-saved-shopping-intent/artifacts/` |

Latest Phase 15 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- product-detail.test.js review.test.js product.test.js` | Passed: 3 test files, 16 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --run src/api/productsApi.test.js src/api/reviewsApi.test.js src/pages/ProductDetail.test.jsx src/components/ProductCard.test.jsx src/components/WishlistButton.test.jsx src/services/catalog/normalizeProduct.test.js src/config/config.test.js` | Passed: 7 test files, 25 tests |
| `cd Backend && npm test` | Passed: 19 test files, 162 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test` | Passed: 33 test files, 133 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build with no warnings |
| Headless Chrome UI smoke at `http://127.0.0.1:5175/products/local-male-0` with `REACT_APP_ENABLE_REVIEWS=true` and `REACT_APP_ENABLE_WISHLIST=true` | Passed desktop decision-area and mobile fit/reviews/related-product smoke; screenshots saved under `.planning/phases/15-product-detail-reviews-and-fit-confidence/artifacts/` |

Latest Phase 16 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- product.test.js` | Passed: 1 test file, 7 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --run src/components/ProductGrid.test.jsx src/services/catalog/catalogService.test.js src/api/productsApi.test.js src/hooks/useCatalogUrlQuery.test.jsx` | Passed: 4 test files, 20 tests |
| `cd Backend && npm test` | Passed: 19 test files, 164 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test` | Passed: 34 test files, 141 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `git diff --check` | Passed with line-ending warnings only |
| Headless Chrome UI smoke at `http://127.0.0.1:5176/collection?q=trail&size=41&minPrice=80&sort=price-asc&page=2` | Passed desktop/mobile catalog control restore, no mobile horizontal overflow, fallback/error state visibility, and no-results state; screenshots saved under `.planning/phases/16-advanced-catalog-discovery-and-search/artifacts/` |

Latest Phase 17 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- cart.test.js` | Passed: 1 test file, 18 tests |
| `cd Backend && npm test -- cart.test.js order.test.js` | Passed: 3 test files, 60 tests |
| `cd Backend && npm test` | Passed: 19 test files, 168 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- cartStore.test.js authStore.test.js Account.test.jsx Checkout.test.jsx ProtectedRoute.test.jsx CheckoutReturn.test.jsx` | Passed: 6 test files, 41 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- Checkout.test.jsx` | Passed after disabled button contrast fix: 1 test file, 10 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --testTimeout=10000` | Passed: 34 test files, 150 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `git diff --check` | Passed with line-ending warnings only |
| Headless Chrome UI smoke at `http://127.0.0.1:5177` | Passed desktop Account checkout-intent copy and mobile Checkout local-cart review blocking smoke; screenshots saved under `.planning/phases/17-checkout-conversion-and-guest-cart-experience/artifacts/` |

Latest Phase 18 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- return-request.test.js` | Passed: 1 test file, 8 tests |
| `cd Backend && npm test -- return-request.test.js payment-webhook.test.js` | Passed: 2 test files, 19 tests |
| `cd Backend && npm test -- --hookTimeout=30000 --testTimeout=10000` | Passed: 20 test files, 176 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- returnsApi.test.js adminApi.test.js AdminReturns.test.jsx OrderDetail.test.jsx` | Passed: 4 test files, 23 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --testTimeout=15000` | Passed: 37 test files, 160 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `git diff --check` | Passed with line-ending warnings only |
| Headless Chrome UI smoke at `http://127.0.0.1:5178` | Passed customer order-detail return request and mobile admin returns queue/detail smoke with mocked backend responses; screenshots saved under `.planning/phases/18-returns-exchanges-and-refund-requests/artifacts/` |

Latest Phase 19 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- product.test.js product-detail.test.js` | Passed: 2 test files, 12 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- normalizeProduct.test.js ProductDetail.test.jsx AdminResourceForms.test.jsx` | Passed: 3 test files, 13 tests |
| `cd Backend && npm test -- --hookTimeout=30000 --testTimeout=10000` | Passed: 20 test files, 177 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --testTimeout=15000` | Passed: 37 test files, 160 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `git diff --check` | Passed with line-ending warnings only |
| Headless Chrome UI smoke at `http://127.0.0.1:5179` | Passed product detail sustainability and mobile Our Story safe-copy smoke with mocked backend product responses; screenshots saved under `.planning/phases/19-sustainability-impact-and-product-care-content/artifacts/` |

Latest Phase 20 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- retention.test.js order.test.js` | Passed: 3 test files, 47 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- backInStockApi.test.js recommendationsApi.test.js ordersApi.test.js ProductDetail.test.jsx OrderDetail.test.jsx normalizeProduct.test.js` | Passed: 6 test files, 22 tests |
| `cd Backend && npm test -- --hookTimeout=30000 --testTimeout=10000` | Passed: 21 test files, 182 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- ProductDetail.test.jsx` | Passed: 1 test file, 5 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --testTimeout=15000` | Passed: 39 test files, 165 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `git diff --check` | Passed with line-ending warnings only |
| Headless Chrome UI smoke at `http://127.0.0.1:5180` | Passed product-detail back-in-stock/recommendations and mobile order-detail buy-again smoke with mocked backend responses; screenshots saved under `.planning/phases/20-retention-lifecycle-commerce-and-personalization/artifacts/` |

Latest Phase 21 focused evidence:

| Command | Result |
| --- | --- |
| `cd Backend && npm test -- lookbook.test.js` | Passed: 1 test file, 3 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- lookbookApi.test.js adminApi.test.js AdminResourceForms.test.jsx LookBook.test.jsx` | Passed: 4 test files, 24 tests |
| `cd Backend && npm test -- --hookTimeout=30000 --testTimeout=10000` | Passed: 22 test files, 185 tests |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --testTimeout=15000` | Passed: 41 test files, 170 tests |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed through the frontend production build |
| `git diff --check` | Passed with line-ending warnings only |
| Headless Chrome UI smoke at `http://127.0.0.1:5181` | Passed active lookbook scene rendering, hotspot add-to-cart, bundle add-to-cart, and mobile cart drawer smoke with mocked backend responses; screenshots saved under `.planning/phases/21-shoppable-lookbook-and-outfit-bundles/artifacts/` |

Phase 10 removed the prior recurring frontend test and build warning noise. Treat new routine frontend test/build warnings as regressions unless a later phase explicitly documents an accepted risk.

## Backend Test Setup

The backend test harness is intentionally route-level:

- `Backend/app.js` exports the Express app without connecting to production MongoDB or opening a listener.
- `Backend/server.js` remains responsible for runtime `dotenv`, `connectDB()`, and `app.listen(...)`.
- `Backend/test/setup.js` starts MongoMemoryReplSet with `wiredTiger`, connects Mongoose, clears all collections after each test, and disconnects after the suite.
- `Backend/test/helpers/factories.js` creates users, products, carts, wishlists, reviews, coupons, orders, contact messages, and shipping addresses.
- `Backend/test/helpers/auth.js` creates JWT bearer headers for protected routes.

Backend test files:

| File | Coverage |
| --- | --- |
| `Backend/test/app.test.js` | Importable app health smoke |
| `Backend/test/auth.test.js` | Register, duplicate register, login, invalid login, current user, missing token, invalid token |
| `Backend/test/cart.test.js` | Protected cart access, cart creation, guest cart merge auth/duplicate/stock/missing-product behavior, stock-conflict add/update behavior, item add/update/remove/clear, coupon success/failure/minimum, no-cart coupon removal |
| `Backend/test/wishlist.test.js` | Protected wishlist access, empty wishlist creation, populated add/list behavior, duplicate-save idempotency, remove no-op behavior, request validation, and missing product handling |
| `Backend/test/product.test.js` | Bounded product pagination, category/gender/sale/search/size/price/rating filters, sorting, legacy route envelopes, query validation, source-backed sustainability validation, and supporting index declarations |
| `Backend/test/product-detail.test.js` | Rich product detail and sustainability fields, related product ordering/exclusion, related limit validation, and missing source product handling |
| `Backend/test/retention.test.js` | Back-in-stock opt-in intent capture, consent/availability rejection, and bounded explainable recommendations |
| `Backend/test/lookbook.test.js` | Public active lookbook listing, populated hotspots/bundles, admin create/update, invalid product references, and hotspot coordinate validation |
| `Backend/test/review.test.js` | Public approved review listing, protected review submission, verified-purchase enforcement, strict validation, aggregate updates, duplicate review conflicts, and limited user display data |
| `Backend/test/return-request.test.js` | Customer return/exchange ownership and eligibility, active quantity bounds, exchange size validation, admin transitions, and refund-state isolation from Stripe webhook fields |
| `Backend/test/order.test.js` | Missing token, idempotency header validation, empty cart, missing shipping field, transactional checkout, exact retry, stale-key conflict, rollback failure seams, stock conflict, deleted product conflict details, coupon max-use/concurrency, reorder cart rebuild/conflicts, checkout-created cancellation stock restore, legacy cancellation no-restore guard, and concurrent `PLS-` order-number uniqueness |
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
| `Frontend/Ecommerce-main/my-app/src/config/config.test.js` | Public MapTiler key fallback behavior plus wishlist/review feature-flag defaults |
| `Frontend/Ecommerce-main/my-app/src/store/cartStore.test.js` | Cart normalization for backend sync and guest items, authenticated local-cart merge, local-only preservation, conflict preservation, persisted old-shape migration, selectors, guest mutations, discount totals, and clear behavior |
| `Frontend/Ecommerce-main/my-app/src/store/wishlistStore.test.js` | Wishlist item normalization, backend-safe id detection, guest local saves, authenticated API sync, local-only fallback preservation, and login/register merge failure handling |
| `Frontend/Ecommerce-main/my-app/src/store/authStore.test.js` | Session-storage auth persistence, address save state update, bearer header attachment, and logout-on-401 |
| `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.test.jsx` | Authenticated and unauthenticated route guard behavior with checkout return-state preservation |
| `Frontend/Ecommerce-main/my-app/src/components/AdminRoute.test.jsx` | Admin-only route guard behavior for unauthenticated, non-admin, and admin users |
| `Frontend/Ecommerce-main/my-app/src/components/WishlistButton.test.jsx` | Accessible saved/unsaved wishlist button labels, pressed state, and local toggle behavior |
| `Frontend/Ecommerce-main/my-app/src/components/Header.test.jsx` | Wishlist header link/count visibility and feature-flag hiding |
| `Frontend/Ecommerce-main/my-app/src/api/adminApi.test.js` | Admin wrapper endpoint coverage for order, product, coupon, and contact operations |
| `Frontend/Ecommerce-main/my-app/src/api/wishlistApi.test.js` | Wishlist wrapper endpoint coverage for list, add, and remove calls |
| `Frontend/Ecommerce-main/my-app/src/api/productsApi.test.js` | Product list discovery params and related-products wrapper endpoint coverage |
| `Frontend/Ecommerce-main/my-app/src/api/recommendationsApi.test.js` | Explainable recommendation wrapper endpoint coverage |
| `Frontend/Ecommerce-main/my-app/src/api/lookbookApi.test.js` | Public shoppable lookbook wrapper endpoint coverage |
| `Frontend/Ecommerce-main/my-app/src/api/backInStockApi.test.js` | Back-in-stock opt-in wrapper endpoint coverage |
| `Frontend/Ecommerce-main/my-app/src/api/reviewsApi.test.js` | Product review list and create wrapper endpoint coverage |
| `Frontend/Ecommerce-main/my-app/src/pages/ProductDetail.test.jsx` | Product detail load, fit guidance, sustainability details/fallback, recommendation reasons, back-in-stock intent, review list, add-to-cart, review failure states, and local fallback product behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/admin/AdminOrders.test.jsx` | Admin order list, filtering, detail, and fulfillment submit behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/admin/AdminReturns.test.jsx` | Admin return/exchange request list, filtering, detail, status update, notes, and manual refund amount action behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/admin/AdminResourceForms.test.jsx` | Admin product materials/care/sustainability payloads, lookbook entry payloads, coupon, and contact-message form/action behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/LookBook.test.jsx` | Shoppable lookbook scene rendering, hotspot add-to-cart, and bundle add-to-cart behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/Account.test.jsx` | Account wishlist tab rendering, move-to-cart removal order, failed move preservation, local wishlist merge after login, checkout-intent cart merge return, and merge-failure cart review routing |
| `Frontend/Ecommerce-main/my-app/src/api/ordersApi.test.js` | `Idempotency-Key` header propagation for checkout creation and reorder endpoint wrapper coverage |
| `Frontend/Ecommerce-main/my-app/src/api/returnsApi.test.js` | Customer return/exchange wrapper endpoint coverage for create, list, and detail calls |
| `Frontend/Ecommerce-main/my-app/src/pages/Checkout.test.jsx` | Coupon success/failure, idempotent order submission, saved address prefill/save, unresolved local cart blocking, checkout `409` conflict cart preservation/sync, empty cart, unauthenticated submit guard |
| `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.test.jsx` | Checkout success/cancel return states, authoritative order refetch, paid/pending/failed/canceled labels, and recovery actions |
| `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.test.jsx` | Customer order detail return request submission, ineligible return policy state, and buy-again cart sync behavior |
| `Frontend/Ecommerce-main/my-app/src/pages/Contact.test.jsx` | Required-field validation, successful submit clear, failed submit preservation |
| `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.test.jsx` | Catalog search/filter/sort/page controls, advanced filter application, loading/error/no-results states, and pagination callbacks |
| `Frontend/Ecommerce-main/my-app/src/hooks/useCatalogUrlQuery.test.jsx` | URL-backed catalog query restore, update, page change, and route-forced filter behavior |
| `Frontend/Ecommerce-main/my-app/src/services/catalog/catalogService.test.js` | Backend catalog envelope normalization, defensive discovery filtering, fallback filtering, and valid empty response handling |

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
