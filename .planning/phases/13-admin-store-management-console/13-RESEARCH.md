# Phase 13: Admin Store Management Console - Research

**Created:** 2026-06-20
**Status:** Complete

## Research Scope

Phase 13 needs a frontend admin console over existing protected backend APIs. Research focused on current route/auth patterns, frontend API wrappers, backend admin contracts, test patterns, and UI constraints.

## Findings

### Current Frontend State

- `Frontend/Ecommerce-main/my-app/src/App.js` has no `/admin` route.
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` only checks `isAuthenticated`.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` persists `user`, `token`, and `isAuthenticated`; backend auth responses include `isAdmin`.
- `Frontend/Ecommerce-main/my-app/src/api/adminApi.js` wraps:
  - `GET /admin/orders`
  - `GET /admin/orders/:id`
  - `PATCH /admin/orders/:id/fulfillment`
  - `GET /coupons`
  - `GET /contact`
- `Frontend/Ecommerce-main/my-app/src/api/adminApi.test.js` already uses Vitest and mocks the shared Axios client.
- `Frontend/Ecommerce-main/my-app/src/test/routerTestUtils.jsx` provides route test helpers with React Router future flags.

### Backend Contract Baseline

- Backend admin authorization is enforced through `protect` and `admin` middleware.
- Admin order routes already support list, detail, and fulfillment updates.
- Product admin endpoints already support create, update, and delete on `/api/products`.
- Coupon admin endpoints already support list, create, and delete on `/api/coupons`.
- Contact admin endpoints already support list, mark-read, and delete on `/api/contact`.
- Product payloads are strict and limited to `name`, `gender`, `category`, `image`, `price`, `rating`, `sizes`, `stock`, `isOnSale`, and `description`.
- Coupon create payloads are strict and limited to `code`, `discountPercentage`, `minOrderAmount`, `maxUses`, `validFrom`, `validUntil`, and `isActive`.
- Contact admin list filters are `page`, `limit`, `isRead`, `q`, `createdFrom`, and `createdTo`.

### Implementation Direction

- Add a dedicated frontend admin guard instead of widening `ProtectedRoute`.
- Keep all admin HTTP calls on the existing shared Axios instance.
- Extend `adminApi.js` first so screens have a single admin integration surface.
- Add route-level admin pages under `src/pages` or `src/pages/admin` and export them from `src/pages/index.js` only where needed by `App.js`.
- Build order workflows before broader resource management because order operations prove the shell and data-loading patterns.
- Keep UI dense and utilitarian per `13-UI-SPEC.md`.

### Verification Direction

- Targeted frontend tests should cover:
  - admin guard unauthenticated, non-admin, and admin states;
  - admin API wrappers for every missing mutation;
  - critical admin screen behavior such as loading, empty/error states, and submit actions.
- Frontend build should run after route and component additions.
- Backend tests are not required unless backend source changes.

## Recommendation

Plan Phase 13 as four execution waves:

1. Admin guard, route shell, and navigation.
2. Order list/detail/fulfillment screens.
3. Product, coupon, and contact management screens plus missing admin API wrappers.
4. Focused tests, documentation, and final verification.

This keeps each wave independently reviewable and prevents the console from turning into a broad backend rewrite.

