# Phase 07: catalog-and-frontend-architecture-cleanup - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 07 cleans up PLASHOE catalog and frontend structure after checkout, payments, and admin fulfillment are already stabilized. It normalizes product data before rendering, centralizes backend-first catalog loading with demo-only fallback, makes catalog APIs bounded and indexed, splits contact/coupon wrappers out of the order API module, and extracts touched frontend catalog/page logic into smaller tested units.

This phase does not add new storefront features, new catalog filters, visual redesign, admin product UI, build-tool migration, payment/admin behavior, deployment operations, or cart-store redesign.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `07-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream planning and execution MUST read `07-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
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

**Out of scope (from SPEC.md):**
- Wishlist implementation - deferred to v2 requirement `V2-01`.
- Product reviews - deferred to v2 requirement `V2-02`.
- Full admin product/coupon UI - deferred to v2 requirement `V2-03`.
- Create React App to Vite/tooling migration - deferred to v2 requirement `V2-04` or dependency remediation work.
- New catalog filters such as brand, size, text search, color, or price range - Phase 7 only hardens the existing filter contract.
- Visual redesign of storefront pages - Phase 7 is architecture and contract cleanup, not a UI redesign phase.
- Payment, fulfillment, admin order, and deployment/CI behavior changes - those belong to completed Phases 5/6 or future Phase 8.
- Cart store redesign - existing normalized cart behavior is preserved, not reopened.
- New runtime dependencies - avoid unless a requirement cannot be met with existing React, Zustand, Express, Mongoose, and test tooling.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Workflow Boundaries
- **D-01:** Use installed local skills as supporting guidance: `react-best-practices`, `zustand-state-management`, `mongodb`, and `api-testing`.
- **D-02:** Do not install duplicate external skills for Phase 07 unless planning discovers a concrete missing capability. External storefront/React/MongoDB candidates were found, but the installed local skills match this repo's stack more directly.
- **D-03:** Do not use subagents while the repository instruction says not to use subagents. Research, planning, execution, and verification should run inline unless the user later changes that instruction.

### Product Normalization Boundary
- **D-04:** Put product normalization in `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js`, with focused tests beside the catalog service/hook.
- **D-05:** The normalized product view model should match the SPEC shape: `id`, `name`, `gender`, `category`, `image`, `price.current`, `price.original`, `rating`, `sizes`, `stock`, `isOnSale`, `description`, and `source`.
- **D-06:** Static fallback products should use deterministic local IDs such as `local-female-0` and `local-male-0`, with `source: 'fallback'`. Avoid random IDs because product cards and cart interactions need stable identities.
- **D-07:** Normalize `image` into a render-ready value before product display components receive it. `ProductCard.jsx` and `QuickViewModal.jsx` should not know about `img`, `price.new`, `price.old`, or fallback path differences.
- **D-08:** Preserve the Phase 04 cart normalization boundary. Product normalization may pass clean product data into cart actions, but it must not redesign `cartStore.js`.

### Catalog Loading Boundary
- **D-09:** Use service functions plus a small `useCatalogProducts` hook for catalog loading. Do not put catalog server state in Zustand; Zustand remains for cross-route auth/cart state.
- **D-10:** The hook/service should expose enough state for product pages without becoming global state: `products`, `pagination`, `loading`, `error`, `source`, and `reload`.
- **D-11:** Attempt backend catalog loading first. Static JSON fallback activates only on backend request failure, not on a legitimate empty backend response.
- **D-12:** Home may use the same catalog boundary for demo product sections, but it should not fetch `public/database/database.json` directly.
- **D-13:** Keep client-side filtering only for the small normalized static fallback dataset. Backend-backed catalog pages should use API query params.

### Backend Product API
- **D-14:** Keep existing `/api/products/men`, `/api/products/women`, and `/api/products/sale` routes for compatibility, but route them through shared bounded list logic with validation and pagination.
- **D-15:** New frontend catalog code should prefer the canonical `GET /api/products` query contract through `productsApi.getAll(params)`.
- **D-16:** Keep the product list envelope compatible with existing docs and tests: `success`, `count`, `total`, `pages`, and `data`; add consistent `page` and `limit` metadata.
- **D-17:** Preserve strict validator behavior for invalid query params. `limit > 100`, invalid `gender`, invalid `category`, invalid `sale`, invalid `sort`, and invalid `page` should return validation errors instead of being silently coerced beyond the accepted schema.
- **D-18:** Add targeted Product schema indexes for current catalog access paths only: gender/category filtering, sale/newest filtering, rating/newest sorting, and current-price sorting. Avoid search, size, brand, or text indexes in Phase 07.

### Catalog Controls and Pagination
- **D-19:** Convert `ProductGrid` controls to be controlled by page/query state for backend-backed catalog pages. The page or catalog hook owns `category`, `sort`, `page`, and `limit`.
- **D-20:** Remove or disable price/rating filter controls for backend-backed catalog in Phase 07. Adding backend price/rating filters would be new scope.
- **D-21:** Keep sort options aligned to the current backend contract: default/newest, `price-asc`, `price-desc`, and `rating`. Avoid adding name sort unless the backend contract is extended in a later phase.
- **D-22:** Add simple pagination UI with Previous, Next, current page, and total pages. Avoid infinite scroll or broad pagination redesign.

### Frontend API Module Split
- **D-23:** Split `contactApi` into `Frontend/Ecommerce-main/my-app/src/api/contactApi.js`.
- **D-24:** Split `couponApi` into `Frontend/Ecommerce-main/my-app/src/api/couponApi.js`.
- **D-25:** After the split, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` should export order operations only. Do not keep temporary re-exports for contact or coupon wrappers.
- **D-26:** Update all imports, mocks, wrapper tests, and docs to reference the resource-specific modules.

### Focused Frontend Extraction
- **D-27:** Prioritize extraction around touched catalog/product code: catalog loader/normalizer, ProductGrid controls/pagination, and shared product display helpers if needed.
- **D-28:** Extract Checkout or Account logic only where Phase 07 API/module moves touch those files. Do not refactor large pages just to reduce line counts.
- **D-29:** For Home, extract product-loading or product-section pieces only. Leave marketing hero, testimonials, newsletter, and unrelated visual sections alone.
- **D-30:** Stop extraction when changed pages delegate data/derived logic to named helpers/components and tests cover observable behavior. Do not chase arbitrary file-size targets.

### Testing and Verification
- **D-31:** Add `Backend/test/product.test.js` for product list behavior, route compatibility, validation, pagination metadata, bounded responses, and schema/index inspection.
- **D-32:** Keep existing generic validation tests as supporting coverage, but do not rely on them as the only product-route contract tests.
- **D-33:** Add frontend unit tests for product normalization and catalog loading, including backend success, backend failure fallback, and static JSON-style fixture normalization.
- **D-34:** Add or update frontend tests for ProductGrid/page query behavior, API wrapper boundaries, and Contact import/mocking after the API split.
- **D-35:** Keep API wrapper tests separated by resource: `ordersApi.test.js`, `contactApi.test.js`, `couponApi.test.js`, and existing `adminApi.test.js`.
- **D-36:** Final verification should include `cd Backend && npm test`, `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`, `cd Frontend/Ecommerce-main/my-app && npm run build`, and static `rg` checks that product display code no longer reads legacy product fields or mixed API exports.

### Documentation and Scope Control
- **D-37:** Update `docs/API.md` for bounded product query behavior, route compatibility, product response metadata, frontend wrapper inventory, and the contact/coupon module split.
- **D-38:** Update `docs/DEVELOPMENT.md` for the catalog normalizer/loading boundary and resource-specific frontend API module convention.
- **D-39:** Do not broaden docs churn beyond files whose documented contracts change.
- **D-40:** Explicitly defer price/rating backend filters, search, size/brand/color filters, wishlist, reviews, admin product UI, visual redesign, CRA/Vite migration, and CI/CD/observability.

### the agent's Discretion
- The planner may choose exact helper filenames under `src/services/catalog` if the normalizer and catalog loading boundary remain clear and tested.
- The planner may choose whether ProductGrid pagination controls are extracted into a child component or kept inside `ProductGrid`, as long as backend query state is controlled outside the grid and tests cover behavior.
- The planner may tune exact compound indexes if they directly support approved Phase 07 filters/sorts and do not introduce deferred search/filter scope.
- The planner may choose exact fallback empty-state wording if legitimate empty backend results do not trigger static fallback.

</decisions>

<canonical_refs>
## Canonical References

**Downstream planning and execution MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/07-catalog-and-frontend-architecture-cleanup/07-SPEC.md` - Locked Phase 07 requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase ordering, Phase 07 goal, and planned slices.
- `.planning/REQUIREMENTS.md` - `CAT-01` through `CAT-04` traceability.
- `.planning/STATE.md` - Current project status, previous phase completion, and known open risks.

### Prior Phase Carry-Forward
- `.planning/phases/06-admin-fulfillment-operations/06-CONTEXT.md` - Admin wrapper/list behavior and explicit deferral of contact/coupon API split to Phase 07.
- `.planning/phases/05-production-payments/05-CONTEXT.md` - Payment return/account/order behavior that Phase 07 must preserve while touching imports or pages.
- `.planning/phases/04-checkout-data-integrity-and-inventory/04-CONTEXT.md` - Cart normalization boundary that Phase 07 must preserve.
- `.planning/phases/03-api-security-and-validation/03-CONTEXT.md` - Strict validation, allowlist, and error-envelope decisions that product route changes should keep.
- `.planning/phases/02-automated-test-foundation/02-CONTEXT.md` - Backend Vitest/Supertest and frontend CRA/Jest test harness context.

### Codebase Maps and Docs
- `.planning/codebase/STACK.md` - Express, Mongoose, React, CRA/Jest, Axios, and Zustand stack context.
- `.planning/codebase/ARCHITECTURE.md` - Backend route/controller/model layering and frontend API/store/page/component layering.
- `.planning/codebase/CONVENTIONS.md` - Naming, import, test, and frontend API module conventions.
- `.planning/codebase/CONCERNS.md` - Duplicate product-loading strategies, mixed product shapes, unbounded catalog queries, and misleading API module naming.
- `.planning/codebase/TESTING.md` - Current test locations and commands.
- `docs/API.md` - API and frontend wrapper documentation target.
- `docs/DEVELOPMENT.md` - Catalog/frontend architecture documentation target.
- `docs/TESTING.md` - Verification command reference if Phase 07 changes documented test coverage.

### Backend Source Files
- `Backend/controllers/productController.js` - Product list, route compatibility, and shared bounded list logic target.
- `Backend/routes/productRoutes.js` - Product route validation and legacy route compatibility target.
- `Backend/validators/product.js` - Existing strict product query schema and product DTO validation.
- `Backend/models/Product.js` - Product schema and catalog index target.
- `Backend/test/setup.js` - In-memory MongoDB test harness.
- `Backend/test/helpers/factories.js` - Product/user/order factory patterns to reuse or extend.
- `Backend/test/validation.test.js` - Existing query-validation coverage to preserve.
- `Backend/test/product.test.js` - New focused product route test target.

### Frontend Source Files
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` - Shared Axios instance that resource API modules must use.
- `Frontend/Ecommerce-main/my-app/src/api/productsApi.js` - Product API wrapper target for canonical query usage.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` - Order-only wrapper after contact/coupon split.
- `Frontend/Ecommerce-main/my-app/src/api/contactApi.js` - New contact wrapper target.
- `Frontend/Ecommerce-main/my-app/src/api/couponApi.js` - New coupon wrapper target.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.test.js` - Existing wrapper test style to preserve.
- `Frontend/Ecommerce-main/my-app/src/api/adminApi.test.js` - Current resource-wrapper test style for endpoint/path/config assertions.
- `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx` - Catalog loading cleanup target for product sections.
- `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx` - Canonical catalog query and fallback cleanup target.
- `Frontend/Ecommerce-main/my-app/src/pages/Men.jsx` - Canonical `gender=male` query target.
- `Frontend/Ecommerce-main/my-app/src/pages/Women.jsx` - Canonical `gender=female` query target.
- `Frontend/Ecommerce-main/my-app/src/pages/Sale.jsx` - Canonical `sale=true` query target.
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` - Contact wrapper import update target.
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.test.jsx` - Contact wrapper mock update target.
- `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.jsx` - Controlled filters and pagination target.
- `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` - Legacy product field removal target.
- `Frontend/Ecommerce-main/my-app/src/components/QuickViewModal.jsx` - Legacy product field removal target.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` - Existing cart normalization boundary to preserve.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.test.js` - Regression coverage for cart normalization.
- `Frontend/Ecommerce-main/my-app/public/database/database.json` - Static fallback input source; must be consumed only through the catalog boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/validators/product.js`: already defines strict `gender`, `category`, `sale`, `sort`, `limit`, and `page` parsing, including `limit` max 100.
- `Backend/controllers/productController.js`: has the current canonical product query implementation and the unbounded legacy route handlers that can be consolidated.
- `Backend/models/Product.js`: already contains product fields and `discountPercentage`; it needs only targeted indexes for Phase 07.
- `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`: already wraps product endpoints through the shared Axios instance and can become the canonical query client.
- `Frontend/Ecommerce-main/my-app/src/api/adminApi.test.js` and `ordersApi.test.js`: provide current frontend API wrapper test patterns.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`: already normalizes cart items and should remain the cart boundary.

### Established Patterns
- Backend uses ES modules with explicit `.js` relative imports.
- Backend routes stay thin, controllers map HTTP behavior, validators use strict Zod schemas, and models own persistence shape/indexes.
- Product and admin list responses use `success`, `count`, `total`, `page`, `limit`, `pages`, and `data` metadata patterns after Phase 06.
- Frontend API calls go through `src/api` resource modules and the shared Axios instance.
- Zustand is reserved for cross-route auth/cart state, not ordinary server list state.
- Frontend tests use CRA/Jest/React Testing Library; backend tests use Vitest/Supertest with in-memory MongoDB.

### Integration Points
- Catalog API changes connect `Backend/routes/productRoutes.js`, `Backend/controllers/productController.js`, `Backend/validators/product.js`, and `Backend/models/Product.js`.
- Catalog frontend changes connect `productsApi.js`, the new catalog service/hook, `Home.jsx`, `Collection.jsx`, `Men.jsx`, `Women.jsx`, `Sale.jsx`, `ProductGrid.jsx`, `ProductCard.jsx`, and `QuickViewModal.jsx`.
- API module splitting connects `ordersApi.js`, new `contactApi.js`, new `couponApi.js`, `Contact.jsx`, `Contact.test.jsx`, wrapper tests, and `docs/API.md`.
- Regression safety connects Phase 07 changes to existing cart, checkout, payment return, order, admin, and contact tests.

</code_context>

<specifics>
## Specific Ideas

- User approved all Phase 07 discussion recommendations on 2026-06-13.
- No phase-matched todos were found during discussion.
- No existing Phase 07 `CONTEXT.md` or plans were present when context capture started.
- Static fallback must remain demo/resilience behavior, not a silent replacement for valid empty backend catalog results.
- External skills were found through `find-skills`, but no external skill installation is recommended during Phase 07 unless a concrete missing capability appears later.
- The worktree contains existing local changes from prior phases; Phase 07 planning/execution should preserve unrelated local work and avoid broad resets or broad staging.

</specifics>

<deferred>
## Deferred Ideas

- Wishlist implementation remains `V2-01`.
- Product reviews remain `V2-02`.
- Full admin product/coupon UI remains `V2-03`.
- Create React App to Vite/tooling migration remains `V2-04` or a later dependency-remediation phase.
- Price/rating backend filter params, text search, brand filters, size filters, color filters, and broader catalog search/faceting are outside Phase 07.
- Storefront visual redesign is outside Phase 07.
- Payment, fulfillment, admin order behavior, CI/CD, observability, readiness checks, and deployment operations remain completed Phase 5/6 or future Phase 8 work.

</deferred>

---

*Phase: 07-catalog-and-frontend-architecture-cleanup*
*Context gathered: 2026-06-13*
