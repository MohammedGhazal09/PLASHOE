# Phase 07: Catalog and Frontend Architecture Cleanup - Specification

**Created:** 2026-06-13
**Ambiguity score:** 0.09 (gate: <= 0.20)
**Requirements:** 8 locked

## Goal

PLASHOE catalog and frontend API/page boundaries change from duplicated mixed-shape product loading to a normalized, bounded, resource-split, tested catalog architecture.

## Background

Phase 7 starts after checkout, payments, and admin fulfillment are already stabilized. The remaining catalog/frontend risks are structural rather than new feature gaps. Backend `GET /api/products` already accepts validated query params with `page` and capped `limit`, but specific product routes such as `/api/products/men`, `/api/products/women`, and `/api/products/sale` still return unpaginated collections, product query indexes are not explicit on the model, and there is no dedicated backend product route test file.

On the frontend, `Home.jsx`, `Men.jsx`, `Women.jsx`, `Sale.jsx`, and `Collection.jsx` each load products and maintain their own static JSON fallback behavior. Static fallback products use `img`, `price.old`, and `price.new`, while backend products use `image`, `price.original`, and `price.current`. `ProductCard.jsx` and `QuickViewModal.jsx` still compensate for both shapes directly. `ordersApi.js` exports `ordersApi`, `contactApi`, and `couponApi`, which keeps unrelated resources in one module. Large pages such as `Checkout.jsx`, `Account.jsx`, and `Home.jsx` still mix data loading, orchestration, form logic, filtering, and rendering. Cart item normalization already exists from earlier phases and must be preserved rather than redesigned.

## Requirements

1. **Normalized product view model**: All frontend product browsing UI must consume one normalized product shape.
   - Current: Product pages and components handle both backend fields (`image`, `price.current`, `price.original`) and static fallback fields (`img`, `price.new`, `price.old`).
   - Target: Product data presented to catalog UI has the shape `{ id, name, gender, category, image, price: { current, original }, rating, sizes, stock, isOnSale, description, source }`, with backend and static fallback inputs normalized before they reach product display components.
   - Acceptance: Frontend tests prove backend product fixtures and static JSON-style fixtures normalize into the same internal shape, and product display components no longer read `product.img`, `price.new`, or `price.old`.

2. **Shared catalog loading boundary**: Product pages must use a shared catalog loading service or hook instead of duplicating backend/fallback mapping.
   - Current: `Home.jsx`, `Men.jsx`, `Women.jsx`, `Sale.jsx`, and `Collection.jsx` each fetch products and each owns fallback mapping or filtering details.
   - Target: Product loading, backend-primary behavior, static fallback loading, and normalization live behind one reusable frontend catalog boundary that those pages consume.
   - Acceptance: Grep or tests show catalog pages no longer fetch `database/database.json` directly, and page tests or loader tests cover successful backend data, empty backend data where relevant, and static fallback normalization.

3. **Backend-primary catalog behavior**: Backend products are the primary catalog source, while static JSON fallback remains demo-only and normalized.
   - Current: Static fallback can silently hide backend failures and can produce a different product shape from backend data.
   - Target: The frontend attempts backend catalog loading first; fallback is treated as demo/resilience behavior and produces the same normalized shape as backend data.
   - Acceptance: Tests prove a backend success path does not fetch static JSON, and a fallback path returns normalized products that render through the same product components.

4. **Bounded and indexed catalog queries**: Catalog read APIs must be bounded, validated, and backed by explicit product query indexes.
   - Current: `GET /api/products` has query validation and a capped `limit`, but category-specific routes return entire collections and `Product.js` does not define explicit indexes for common catalog filter/sort paths.
   - Target: Catalog query behavior supports only the existing Phase 7 filter set: `gender`, `category`, `sale`, `sort`, `page`, and `limit`; product list responses remain bounded with default `limit: 20` and max `limit: 100`; query paths have supporting indexes for gender/category, sale, rating/newest, and price sorting.
   - Acceptance: Backend route tests verify valid filters, invalid filters, pagination metadata, max-limit rejection or capping per existing validator behavior, and that category/sale read paths cannot return unbounded collections. Schema inspection or model tests confirm the required product indexes exist.

5. **Server-driven catalog page queries**: Catalog pages must delegate backend filtering and sorting to the product API instead of loading full arrays and filtering them in the browser.
   - Current: `ProductGrid.jsx` filters and sorts whatever product array was loaded, and pages such as `Men.jsx`, `Women.jsx`, and `Sale.jsx` use specialized wrappers rather than the canonical query contract.
   - Target: Backend-backed catalog pages call the canonical product query contract with explicit params, such as `gender`, `sale`, `category`, `sort`, `page`, and `limit`. Client-side filtering remains allowed only for the small normalized static fallback dataset.
   - Acceptance: Frontend API/page tests prove `Collection`, `Men`, `Women`, and `Sale` request the expected product query params through the shared catalog boundary, and backend list tests prove the same params produce bounded results.

6. **Resource-specific frontend API modules**: Contact and coupon wrappers must be split out of `ordersApi.js`.
   - Current: `ordersApi.js` exports `ordersApi`, `contactApi`, and `couponApi`; contact and coupon pages/tests import unrelated resource wrappers from the order module.
   - Target: `ordersApi.js` exports order operations only, `contactApi.js` exports contact submission, and `couponApi.js` exports coupon validation. Existing imports, mocks, tests, and docs use the new resource-specific modules.
   - Acceptance: Grep proves `ordersApi.js` no longer exports `contactApi` or `couponApi`, contact and coupon imports point to their own API modules, and API wrapper tests cover orders, contact, and coupon paths separately.

7. **Focused frontend extraction**: Large page/product logic must be extracted into named, testable units where Phase 7 changes touch it.
   - Current: `Checkout.jsx`, `Account.jsx`, `Home.jsx`, and product components mix orchestration, derived view models, form state, filtering, data loading, and rendering in large files.
   - Target: Phase 7 extracts touched catalog/product logic into smaller hooks, helpers, or components, and extracts checkout/account logic only where required to keep existing checkout/account behavior testable while API/product boundaries move.
   - Acceptance: New or updated tests cover each extracted unit's observable behavior, and existing checkout/account/product tests still pass after imports and boundaries are updated.

8. **Docs and regression safety**: Phase 7 changes must update project documentation and preserve completed checkout/cart/payment/admin behavior.
   - Current: `docs/API.md` still documents contact/coupon wrappers as exports from `ordersApi.js`, product routes are documented separately, and previous phase behavior depends on stable cart, checkout, payment, and admin contracts.
   - Target: Documentation reflects the normalized product/catalog conventions, resource-specific frontend API modules, bounded catalog query behavior, and static fallback boundary. Cart normalization, checkout payment redirects, payment return behavior, and admin fulfillment APIs remain functionally unchanged.
   - Acceptance: `docs/API.md` and `docs/DEVELOPMENT.md` describe the updated API/module/catalog conventions; existing backend and frontend tests for cart, checkout, payment return, admin wrappers, and orders continue to pass alongside the new Phase 7 tests.

## Boundaries

**In scope:**
- Frontend product normalizer and normalized product view model.
- Shared product/catalog loading boundary used by catalog pages.
- Backend-primary catalog loading with normalized static JSON fallback.
- Existing catalog filters only: `gender`, `category`, `sale`, `sort`, `page`, and `limit`.
- Backend product query validation, bounded result behavior, supporting indexes, and product route tests.
- Server-driven backend catalog filtering/sorting for normal catalog pages.
- Split `contactApi` and `couponApi` out of `ordersApi.js`.
- Focused extraction for touched product/catalog code and any checkout/account code affected by API/module moves.
- Documentation updates for product/catalog/API module conventions.
- Regression verification for existing cart, checkout, payment, order, and admin behavior.

**Out of scope:**
- Wishlist implementation - deferred to v2 requirement `V2-01`.
- Product reviews - deferred to v2 requirement `V2-02`.
- Full admin product/coupon UI - deferred to v2 requirement `V2-03`.
- Create React App to Vite/tooling migration - deferred to v2 requirement `V2-04` or dependency remediation work.
- New catalog filters such as brand, size, text search, color, or price range - Phase 7 only hardens the existing filter contract.
- Visual redesign of storefront pages - Phase 7 is architecture and contract cleanup, not a UI redesign phase.
- Payment, fulfillment, admin order, and deployment/CI behavior changes - those belong to completed Phases 5/6 or future Phase 8.
- Cart store redesign - existing normalized cart behavior is preserved, not reopened.
- New runtime dependencies - avoid unless a requirement cannot be met with existing React, Zustand, Express, Mongoose, and test tooling.

## Constraints

- Keep the existing React 18/Create React App frontend for this phase.
- Keep backend ES module import style with `.js` extensions.
- Keep frontend API calls behind `src/api` resource modules and the shared Axios instance.
- Keep Zustand for cross-route cart/auth state; do not replace state management.
- Keep backend validation strict and Zod-backed where route validation already exists.
- Product list `limit` defaults to `20` and must not exceed `100`.
- Static fallback data remains small/demo-only and must normalize to the same shape as backend data before rendering.
- Tests use the existing backend Vitest/Supertest in-memory MongoDB setup and frontend CRA/Jest setup.
- Do not use subagents for this workflow or subsequent planning in this repository.

## Acceptance Criteria

- [ ] Backend and static JSON-style product fixtures normalize into the same internal product view model.
- [ ] `ProductCard.jsx`, `QuickViewModal.jsx`, and catalog rendering code no longer read `product.img`, `price.new`, or `price.old`.
- [ ] Product pages no longer fetch `public/database/database.json` directly; fallback loading is centralized behind the catalog boundary.
- [ ] Backend product route tests cover valid and invalid `gender`, `category`, `sale`, `sort`, `page`, and `limit` query behavior.
- [ ] Product list responses remain bounded with default `limit: 20` and max `limit: 100`.
- [ ] Product model has explicit indexes supporting current catalog filter/sort paths.
- [ ] Catalog pages use the canonical product query contract for backend-backed filtering and sorting.
- [ ] `ordersApi.js` exports order operations only; `contactApi.js` and `couponApi.js` own their respective resources.
- [ ] Contact, coupon, order, and admin frontend API wrapper tests pass after API module split.
- [ ] Focused tests cover the new catalog loader/normalizer and any extracted page/product units.
- [ ] Existing cart, checkout, checkout return, order, payment, and admin tests pass after Phase 7 changes.
- [ ] `docs/API.md` and `docs/DEVELOPMENT.md` document the updated catalog and frontend API module conventions.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
| --- | --- | --- | --- | --- |
| Goal Clarity | 0.92 | 0.75 | PASS | Approved recommendations lock the product/API/catalog cleanup target. |
| Boundary Clarity | 0.95 | 0.70 | PASS | In-scope and out-of-scope items are explicit, including v2 and Phase 8 exclusions. |
| Constraint Clarity | 0.84 | 0.65 | PASS | Existing stack, pagination cap, fallback role, and test tools are locked. |
| Acceptance Criteria | 0.90 | 0.70 | PASS | Criteria are pass/fail and map to tests/docs/static checks. |
| **Ambiguity** | 0.09 | <=0.20 | PASS | Gate passed after user approved all recommendations. |

Status: PASS = met minimum, WARN = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective | Question summary | Decision locked |
| --- | --- | --- | --- |
| 1 | Researcher | Product source of truth | Backend products are primary; static JSON is demo-only fallback. |
| 1 | Researcher | Product view model shape | Normalize to `{ id, name, gender, category, image, price, rating, sizes, stock, isOnSale, description, source }`. |
| 1 | Researcher | Normalization location | Use a shared frontend normalizer and catalog loading boundary. |
| 2 | Simplifier | Legacy product fields in components | Product components consume normalized fields only. |
| 2 | Simplifier | Catalog endpoint strategy | Use canonical `GET /api/products` query params for normal catalog pages. |
| 2 | Simplifier | Filter scope | Limit Phase 7 to existing filters: `gender`, `category`, `sale`, `sort`, `page`, `limit`. |
| 2 | Simplifier | Pagination behavior | Use server-driven catalog queries for backend data; local filtering only for small fallback data. |
| 3 | Boundary Keeper | Index requirements | Add indexes for current catalog filter/sort paths only. |
| 3 | Boundary Keeper | API module split | Move contact and coupon wrappers out of `ordersApi.js`; do not re-export them there. |
| 3 | Boundary Keeper | Frontend extraction scope | Prioritize touched checkout/account/product/catalog logic; leave marketing pages alone. |
| 4 | Failure Analyst | Acceptance threshold for smaller units | Require named extracted units with tests, not strict line-count targets. |
| 4 | Failure Analyst | Cart behavior risk | Preserve existing normalized cart boundary; do not redesign cart state. |
| 5 | Seed Closer | Test coverage | Add backend product route tests, product normalizer/catalog tests, API wrapper tests, and focused extraction tests. |
| 5 | Seed Closer | Documentation scope | Update `docs/API.md` and `docs/DEVELOPMENT.md`. |
| 5 | Seed Closer | Explicit exclusions | Exclude wishlist, reviews, admin product UI, CRA/Vite migration, visual redesign, new filters, payment/admin changes, and Phase 8 work. |

---

*Phase: 07-catalog-and-frontend-architecture-cleanup*
*Spec created: 2026-06-13*
*Next step: $gsd-discuss-phase 7 - implementation decisions (how to build what's specified above)*
