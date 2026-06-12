# Phase 07: Catalog and Frontend Architecture Cleanup - Research

**Research date:** 2026-06-13
**Status:** Complete

## Scope Read

Phase 07 is a bounded architecture cleanup phase. It normalizes product data, centralizes catalog loading, brings product list queries under the same bounded backend contract, splits API wrappers by resource, and extracts only the frontend logic that is already touched by catalog/API changes.

This phase does not add wishlist, reviews, admin product UI, new catalog filters, payment changes, cart-store redesign, checkout policy changes, deployment work, visual redesign, or a CRA/Vite migration.

## Skill Findings

The requested skill search found and installed three relevant external skills into the Codex skill path:

- `mongodb` from `hoodini/ai-agents-skills@mongodb`
- `zustand-state-management` from `mindrally/skills@zustand-state-management`
- `react-testing` from `affaan-m/everything-claude-code@react-testing`

The installer copied the skills into `C:\Users\saieh\.agents\skills`, but PromptScript reported that global skill installation is not supported. Recommendation: treat the Codex skill files as available for this repo and ignore the PromptScript adapter warning.

Local skills used as primary guidance:

- `react-best-practices`: keep server state out of global stores and avoid duplicating fetch state across pages.
- `zustand-state-management`: keep cart/auth stores focused; do not put catalog list server state in Zustand.
- `mongodb`: use explicit indexes, `limit`, `skip`, projections/lean where useful, and bounded queries.
- `api-testing`: use Supertest route tests for query params, status codes, auth/errors, and response shape.
- `react-testing`: prefer user-visible behavior tests, async queries, and module-level API mocks rather than React internals.

## Current-State Findings

### Backend Catalog

- `Backend/validators/product.js` already strictly validates `/api/products` query params and caps `limit` at `100`, with a default of `20`.
- `Backend/controllers/productController.js` applies bounded pagination only in `getProducts`.
- `getMenProducts`, `getWomenProducts`, and `getSaleProducts` still call `Product.find(...)` without pagination, `total`, `page`, or `limit` metadata.
- `getProducts` returns `success`, `count`, `total`, `pages`, and `data`, but not `page` or `limit`; Phase 07 should align it with the bounded list envelope used elsewhere.
- `Backend/models/Product.js` has no catalog-supporting indexes, while product browsing filters and sorts by `gender`, `category`, `isOnSale`, `rating`, `createdAt`, and `price.current`.
- Backend route tests exist through Vitest/Supertest and in-memory MongoDB, but there is no dedicated product route test file yet.

### Frontend Catalog

- `Collection.jsx`, `Men.jsx`, `Women.jsx`, `Sale.jsx`, and `Home.jsx` each own product loading and static fallback parsing.
- Several pages still fetch `public/database/database.json` directly.
- Static fallback records use legacy fields such as `price.new`, `price.old`, and `img`; backend records use `price.current`, `price.original`, and `image`.
- `ProductCard.jsx` and `QuickViewModal.jsx` still compensate for both shapes by reading `product.img`, `price.new`, and `price.old`.
- `Home.jsx` loads fallback records without normalizing price, then relies on defensive component logic.
- `ProductGrid.jsx` owns local price, rating, category, name, and sort controls over the full loaded array. That conflicts with the Phase 07 contract because backend-backed catalog pages should use the backend query contract and only keep client-side filtering for fallback data.
- Cart item normalization already exists in `cartStore.js`; Phase 07 should preserve that boundary and pass cart-compatible product data from product display components without redesigning the cart store.

### API Wrapper Boundaries

- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` exports `ordersApi`, `contactApi`, and `couponApi`.
- `Contact.jsx` imports `contactApi` from `ordersApi.js`.
- Existing wrapper tests mock `./axios` and assert method, endpoint, payload, and config. That pattern is suitable for new `contactApi.test.js` and `couponApi.test.js`.
- `couponApi` currently has no direct frontend consumer in source, but the wrapper is still part of the documented API surface and should move to its own file with tests.

### Documentation

- `docs/API.md` still documents `contactApi` and `couponApi` as exports from `ordersApi.js`; this must change.
- `docs/DEVELOPMENT.md` contains stale text saying the backend has no test script, while `Backend/package.json` now exposes `npm test` through Vitest. Phase 07 docs should correct this if verification docs are touched.

## Recommended Architecture

### Backend

Use one shared product list path inside `productController.js`:

- Build a canonical query from validated request values plus optional route defaults.
- Use the same bounded `page` and `limit` semantics for `/api/products`, `/api/products/men`, `/api/products/women`, and `/api/products/sale`.
- Keep the legacy route paths for compatibility, but have them delegate to the same implementation.
- Return `success`, `count`, `total`, `page`, `limit`, `pages`, and `data`.
- Add schema-level indexes in `Product.js` for approved catalog filters and sorts.
- Add `Backend/test/product.test.js` for success, filtering, sorting, pagination, invalid query, route compatibility, and index assertions.

### Frontend Product Shape

Create `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js` as the single normalization boundary:

```javascript
{
  id,
  name,
  gender,
  category,
  image,
  price: {
    current,
    original,
  },
  rating,
  sizes,
  stock,
  isOnSale,
  description,
  source,
  raw,
}
```

Recommendation: make `image` render-ready before components receive it. Product components should render `product.image` directly instead of adding `PUBLIC_URL` and should stop reading `product.img`.

Fallback IDs should be deterministic, such as `local-female-0`, `local-male-0`, and `local-sale-0`, so cart and test behavior is stable.

### Frontend Catalog Loading

Create a focused catalog service and hook:

- `catalogService` should call `productsApi.getAll(params)` first.
- Static fallback should happen only on backend request failure.
- A valid backend empty result must remain empty and must not trigger fallback.
- `useCatalogProducts` should return `products`, `pagination`, `loading`, `error`, `source`, and `reload`.
- Pages should pass canonical params such as `gender`, `category`, `sale`, `sort`, `page`, and `limit`; no page should fetch `database/database.json` directly.
- Catalog state should stay page/hook-local, not in Zustand.

### Product Grid and Components

Recommendation:

- Make `ProductGrid` controlled by catalog query state when the source is backend-backed.
- Keep category and sort controls aligned to the backend contract.
- Remove price/rating controls and the `name` sort from backend-backed catalog controls.
- Add simple Previous/Next pagination controls tied to `page` and backend response metadata.
- Keep client-side filtering/sorting only for fallback datasets.
- Update `ProductCard` and `QuickViewModal` so they use normalized `id`, `image`, `price.current`, and `price.original` only.
- When adding to cart, pass a cart-compatible object with `_id: product.id`, `name`, `image`, and normalized `price` to preserve the existing cart-store boundary.

### API Modules

Split wrappers by resource:

- `ordersApi.js` should export order operations only.
- `contactApi.js` should export `contactApi.submit(...)`.
- `couponApi.js` should export `couponApi.validate(...)`.
- Update imports, mocks, wrapper docs, and tests together.
- Do not re-export contact/coupon from `ordersApi.js`; the point of the phase is to remove the misleading mixed module boundary.

## Risks and Landmines

- Valid empty product results must not fallback to static JSON; otherwise backend filtering bugs can be hidden.
- Static fallback images and backend images may already be app-relative. The normalizer should avoid double-prefixing paths.
- `sale=false` currently validates but transforms to no sale filter. Tests should document or adjust this intentionally.
- `ProductGrid` can easily become both a server-query and client-filter owner. Keep it focused: controls emit query changes; fallback-only filtering can live in a small helper.
- Product display components currently add `process.env.PUBLIC_URL` before image paths. Normalized render-ready image paths require this to change in the same plan.
- Existing cart normalization expects `_id` for backend calls and local IDs for guest/fallback products. Product display components should adapt the normalized view model to that existing contract rather than changing the cart store.
- Adding schema indexes is enough for this phase; no production migration/index-build script is in scope.
- CRA tests should mock API wrapper modules and assert rendered behavior, not implementation details of React hooks.
- Existing unrelated local work is present in the repository. Phase 07 planning should only stage Phase 7 planning artifacts and state/roadmap updates.

## Validation Architecture

Phase 07 should use both automated tests and static contract checks:

- Backend product route tests through `cd Backend; npm test -- product.test.js validation.test.js`.
- Frontend normalizer, catalog service/hook, ProductGrid, product display, and API wrapper tests through `cd Frontend/Ecommerce-main/my-app; npm test -- --watchAll=false`.
- Frontend production build through `cd Frontend/Ecommerce-main/my-app; npm run build`.
- Static checks:
  - `rg -n "product\\.img|price\\.new|price\\.old" Frontend/Ecommerce-main/my-app/src`
  - `rg -n "database/database\\.json" Frontend/Ecommerce-main/my-app/src`
  - `rg -n "contactApi|couponApi" Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`

## Plan Recommendation

Use three waves:

1. Backend catalog contract, bounds, and indexes.
2. Frontend normalized catalog boundary and catalog page integration.
3. API module split, focused extraction, docs, and final regression sweep.

This sequence is recommended because it stabilizes the server contract before the frontend moves pages to server-driven queries, then finishes by cleaning imports/docs and running broad regressions.

## Research Complete

All Phase 07 requirements, decisions, carry-forward constraints, source surfaces, and verification targets have been researched.
