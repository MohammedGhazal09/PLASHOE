# Phase 16: Advanced Catalog Discovery and Search - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 16 upgrades product catalog discovery. It keeps the existing product-list and catalog-page architecture, adds bounded backend search/filter support, and makes storefront catalog state shareable through URL query strings.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `16-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream work MUST read `16-SPEC.md` before planning or implementing. Requirements are not duplicated here.

</spec_lock>

<decisions>
## Implementation Decisions

### Backend Discovery Contract
- **D-01:** Keep product discovery under existing product list endpoints rather than adding a new `/search` route.
- **D-02:** Use `q` as the bounded search query parameter.
- **D-03:** Search should cover product `name`, `category`, and `description`.
- **D-04:** Support filters for category, gender, sale, size, current-price range, and minimum rating.
- **D-05:** Keep sort values to the existing stable set: `price-asc`, `price-desc`, `rating`, and `newest`.
- **D-06:** Keep `limit` capped at 100 and `page` minimum 1.
- **D-07:** Use MongoDB text index support for product search; do not introduce unbounded regex scans.

### URL State and Route Semantics
- **D-08:** Use URL query params as the source of truth for catalog page discovery state.
- **D-09:** Route-forced filters (`gender=male`, `gender=female`, `sale=true`) win over query-string attempts to override them.
- **D-10:** Omit route-forced filters and default page/limit values from shareable URLs.
- **D-11:** Filter changes reset to page 1; explicit pagination changes update only page.

### Frontend Catalog Experience
- **D-12:** ProductGrid should own visible discovery controls; pages should only wire route defaults/forced filters.
- **D-13:** Keep backend responses authoritative, while catalog service and ProductGrid retain defensive/fallback filtering for local catalog data and stale mocks.
- **D-14:** Show clear text states for loading, fallback/error, and no-results.
- **D-15:** Keep fallback catalog loading only for backend request failure, not valid empty backend envelopes.

### Verification
- **D-16:** Cover Phase 16 with backend route/index tests, frontend API wrapper tests, catalog service tests, URL-state hook tests, ProductGrid tests, docs, build, full suites, and browser smoke.

### the agent's Discretion
- **D-17:** Choose exact helper names and component boundaries as long as the API and URL contracts stay stable.
- **D-18:** Choose exact filter-control layout within existing PLASHOE styling conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream work MUST read these before planning or implementing.**

### Phase Scope
- `.planning/phases/16-advanced-catalog-discovery-and-search/16-SPEC.md` - Locked Phase 16 requirements and boundaries.
- `.planning/ROADMAP.md` - Phase 16 goal, dependencies, canonical refs, and success criteria.
- `.planning/REQUIREMENTS.md` - V2-DISC traceability.
- `.planning/STATE.md` - Current project state and production-readiness caveats.

### Backend
- `Backend/controllers/productController.js` - Product list query construction and response envelopes.
- `Backend/validators/product.js` - Product query validation.
- `Backend/models/Product.js` - Product schema and indexes.
- `Backend/routes/productRoutes.js` - Product route ordering and validation middleware.
- `Backend/test/product.test.js` - Product catalog route/index tests.

### Frontend
- `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.jsx` - Catalog controls and product list rendering.
- `Frontend/Ecommerce-main/my-app/src/hooks/useCatalogProducts.js` - Catalog loading hook.
- `Frontend/Ecommerce-main/my-app/src/hooks/useCatalogUrlQuery.js` - URL-backed catalog query state.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/catalogService.js` - Backend/fallback catalog service.
- `Frontend/Ecommerce-main/my-app/src/api/productsApi.js` - Product API wrapper.
- `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx` - Full catalog route.
- `Frontend/Ecommerce-main/my-app/src/pages/Men.jsx` - Route-forced men's catalog.
- `Frontend/Ecommerce-main/my-app/src/pages/Women.jsx` - Route-forced women's catalog.
- `Frontend/Ecommerce-main/my-app/src/pages/Sale.jsx` - Route-forced sale catalog.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCatalogProducts` already centralizes product list loading and pagination state.
- `catalogService` already normalizes backend/fallback product envelopes.
- `ProductGrid` already owns list controls, count text, pagination, and Quick View.
- `productsApi.getAll(params)` already passes query params through the shared axios instance.
- `routerTestUtils.jsx` provides stable React Router test helpers.

### Established Patterns
- Backend query validation uses Zod strict objects and route-level `validateRequest`.
- Backend list responses use `{ success, count, total, page, limit, pages, data }`.
- Frontend catalog pages call the catalog hook and pass query/pagination into ProductGrid.
- Frontend tests use user-facing labels and React Testing Library assertions.

### Integration Points
- Product query validation and controller filtering are the backend integration point.
- Product schema indexes are the persistence support point for bounded search/filtering.
- Catalog route pages swap local state for URL state without changing routes.
- ProductGrid receives query state and emits query/page changes through existing callback props.

</code_context>

<specifics>
## Specific Ideas

- Keep `q` short and trimmed.
- Keep controls form-like and compact; this is a shopping catalog tool, not a landing page.
- Keep route-specific pages shareable without exposing forced filters in the URL.

</specifics>

<deferred>
## Deferred Ideas

- Autocomplete/typeahead belongs in a separate phase.
- Faceted counts and filter chips belong in a future discovery iteration.
- Fuzzy search or dedicated search infrastructure should wait until there is evidence MongoDB text search is insufficient.

</deferred>

---

*Phase: 16-advanced-catalog-discovery-and-search*
*Context gathered: 2026-06-20*
