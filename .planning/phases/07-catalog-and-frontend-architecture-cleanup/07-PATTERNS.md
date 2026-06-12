# Phase 07: Catalog and Frontend Architecture Cleanup - Pattern Map

**Mapped:** 2026-06-13
**Status:** Complete

## Backend Patterns

### Product Routes

- `Backend/routes/productRoutes.js` keeps route files thin and applies validators before controllers.
- Existing public routes are stable paths and should remain:
  - `GET /api/products`
  - `GET /api/products/men`
  - `GET /api/products/women`
  - `GET /api/products/sale`
- Recommendation: add query validation to the legacy convenience routes and delegate all four list routes to one bounded controller helper.

### Query Validation

- `Backend/validators/product.js` already defines `productQuerySchema` with strict object behavior and `limit` capped at `100`.
- `Backend/validators/shared.js` provides strict object and primitive validators used by earlier phases.
- Recommendation: reuse the existing schema as the default and only add route-specific schemas if the executor needs to prevent conflicting route defaults such as `/men?gender=female`.

### Bounded List Envelope

- Phase 06 admin lists use a stable pagination envelope: `success`, `count`, `total`, `page`, `limit`, `pages`, `data`.
- `Backend/controllers/productController.js` currently has most of this shape but lacks `page` and `limit`.
- Recommendation: align product list responses to the shared envelope so frontend pages can use one pagination model.

### MongoDB Indexes

- `Backend/models/Coupon.js`, `Backend/models/ContactMessage.js`, and `Backend/models/Order.js` show the schema-level index pattern.
- `Backend/models/Product.js` has no product indexes yet.
- Recommendation: add focused product indexes for `gender/category`, sale browsing, price sorting, rating sorting, and newest sorting. Do not add a migration script.

### Backend Tests

- `Backend/test/validation.test.js` already exercises product query validation failures and the valid query cap.
- `Backend/test/helpers/factories.js` has `createProduct(...)` for route tests.
- `Backend/app.js` is importable by Supertest.
- Recommendation: create `Backend/test/product.test.js` for route behavior and keep `validation.test.js` for generic validator behavior.

## Frontend Patterns

### API Wrappers

- Frontend API modules import `api` from `./axios` and return response `data`.
- `ordersApi.test.js` and `adminApi.test.js` mock `./axios` and assert the exact endpoint, payload, params, and config.
- Recommendation: mirror this style in `productsApi.test.js`, `contactApi.test.js`, and `couponApi.test.js`.

### Product Loading Pages

- `Collection.jsx`, `Men.jsx`, `Women.jsx`, `Sale.jsx`, and `Home.jsx` currently duplicate product loading and fallback parsing.
- Recommendation: route pages should call a shared hook, pass route-specific query defaults, and render the existing page banners/sections around normalized product data.

### Product Components

- `ProductCard.jsx` and `QuickViewModal.jsx` are the shared product display and cart-entry points.
- Both components currently support mixed backend/static shapes.
- Recommendation: after normalization, make these components require the normalized shape and add focused tests for price, image, discount, quick view, and cart payload behavior.

### Cart Boundary

- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` already normalizes cart item shapes with `normalizeCartItem`.
- Recommendation: preserve this boundary. Product components should adapt normalized products into the existing `addItem(productData, quantity, size)` input rather than changing cart persistence.

### Component Extraction

- Prior phases used targeted extraction rather than broad rewrites.
- Recommendation: extract only the catalog-related pieces needed to make product pages smaller and testable, such as catalog normalization, catalog service, catalog hook, query helpers, or catalog controls. Do not chase arbitrary line-count reductions in unrelated checkout/account sections.

## Documentation Patterns

- `docs/API.md` is the canonical public API contract and wrapper mapping document.
- `docs/DEVELOPMENT.md` explains backend/frontend command locations and architectural boundaries.
- Recommendation: update only the product query response, catalog wrapper mapping, split API files, and stale test-command text that Phase 07 touches.

## Verification Patterns

- Backend: `cd Backend; npm test`.
- Frontend tests: `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false`.
- Frontend build: `cd Frontend/Ecommerce-main/my-app; npm run build`.
- Static contract checks should use `rg` for forbidden legacy product shapes and mixed API exports.

## Pattern Mapping Complete
