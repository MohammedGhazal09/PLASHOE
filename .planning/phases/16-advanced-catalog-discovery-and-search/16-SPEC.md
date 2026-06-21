# Phase 16: Advanced Catalog Discovery and Search - Specification

**Created:** 2026-06-20
**Ambiguity score:** 0.10 (gate: <= 0.20)
**Requirements:** 5 locked

## Goal

Shoppers can find products from catalog pages using bounded search, filters, sorting, pagination, and shareable URL state.

## Background

The backend already returns paginated product list envelopes from `GET /api/products` plus legacy `/men`, `/women`, and `/sale` convenience routes. Before this phase, backend filters covered gender, category, sale, sort, page, and limit only. The frontend catalog pages used `useCatalogProducts` and `ProductGrid`, but query state was stored in page-local React state and disappeared on reload/share. ProductGrid had only sort and category controls, and fallback catalog filtering did not cover search, size, price, or rating.

## Requirements

1. **Bounded product discovery API**: Product list APIs must support bounded text search plus category, gender, sale, size, price, rating, sort, and pagination filters.
   - Current: Product list APIs support category, gender, sale, sort, page, and limit only.
   - Target: `GET /api/products`, `/api/products/men`, `/api/products/women`, and `/api/products/sale` validate and apply `q`, `category`, `gender`, `sale`, `size`, `minPrice`, `maxPrice`, `minRating`, `sort`, `page`, and `limit`.
   - Acceptance: Backend route tests prove matching, sorting, pagination metadata, validation failures, and legacy route forced filters.

2. **Indexed search and filter support**: Catalog query support must stay bounded and index-backed.
   - Current: Product indexes support existing category/gender/sale/price/rating/created filters only.
   - Target: Product schema declares a text index for name/category/description search plus indexes for size and existing filter/sort fields.
   - Acceptance: Backend tests prove the expected index declarations exist, including the product text-search index and size index.

3. **Shareable catalog URL state**: Catalog pages must restore search, filter, sort, and page state from the URL.
   - Current: `/collection`, `/men`, `/women`, and `/sale` store catalog query state in component state.
   - Target: Catalog pages read/write query string state for search/filter/sort/page and preserve route-forced filters such as men's gender or sale-only routing.
   - Acceptance: Frontend tests prove URL query restore, URL updates, page updates, and route-forced filters staying out of the shareable URL.

4. **Complete catalog controls and states**: ProductGrid must expose expected search/filter controls and clear loading/error/no-results states without layout break.
   - Current: ProductGrid exposes sort/category only and no inline catalog update/error status.
   - Target: ProductGrid exposes search, category, sort, size, price range, minimum rating, and sale-only controls, plus loading/error/no-results state text.
   - Acceptance: Frontend component tests prove controls render, query changes reset page, advanced filters apply, pagination works, and loading/error states are visible.

5. **Contract coverage and documentation**: Search/filter behavior must have backend, frontend, contract-level tests and updated docs.
   - Current: Phase 16 commands and API docs are absent.
   - Target: Backend route tests, frontend API/service/hook/component tests, docs, build, and browser smoke evidence are recorded.
   - Acceptance: `16-VERIFICATION.md` records focused tests, full suites, build, diff check, docs updates, and browser smoke evidence.

## Boundaries

**In scope:**
- Backend product query validation and controller filtering for catalog discovery.
- Product indexes needed by the new search/filter contract.
- Frontend catalog URL-state hook and page integration.
- ProductGrid search/filter/sort/page controls and clear states.
- Catalog service fallback/defensive filtering parity.
- Focused/backend/frontend tests, docs, build, and browser-smoke evidence.

**Out of scope:**
- Autocomplete/typeahead - separate interaction and debounce behavior.
- Fuzzy search, synonyms, stemming tuning, or a dedicated search engine - too large for this phase.
- Facet count aggregation - requires a separate API and UI contract.
- Personalized ranking or recommendations - Phase 20 owns personalization.
- Admin catalog management changes - Phase 13 owns admin surfaces.
- Infinite scroll - current catalog contract remains page-based.

## Constraints

- Do all work inline and do not use subagents.
- Keep catalog requests bounded with validated `limit` and `page`.
- Do not introduce unindexed unbounded product search.
- Keep existing ProductCard, QuickView, cart, wishlist, and product detail behavior working.
- Keep valid empty backend catalog responses authoritative; fallback catalog is only for backend request failure.
- Route-forced filters must be applied to API calls but should not need to appear in shareable URLs.

## Acceptance Criteria

- [ ] Product list APIs validate and apply `q`, `category`, `gender`, `sale`, `size`, `minPrice`, `maxPrice`, `minRating`, `sort`, `page`, and `limit`.
- [ ] Product schema includes search/filter indexes needed by the catalog contract.
- [ ] Catalog pages restore search/filter/sort/page state from query strings.
- [ ] Catalog controls update query strings and reset to page 1 on filter changes.
- [ ] Route-forced filters for men, women, and sale pages cannot be overridden by URL query strings.
- [ ] Loading, error, and no-results catalog states are visible text states.
- [ ] Backend and frontend focused tests cover the API, API wrapper, catalog service, URL-state hook, and ProductGrid behavior.
- [ ] Docs, build, full suites, diff check, and browser smoke evidence are recorded.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.94 | 0.75 | PASS | Discovery capabilities and URL-state behavior are specific. |
| Boundary Clarity | 0.92 | 0.70 | PASS | Autocomplete, fuzzy search, facets, personalization, admin, and infinite scroll are excluded. |
| Constraint Clarity | 0.88 | 0.65 | PASS | Bounded query and indexed search constraint is explicit. |
| Acceptance Criteria | 0.90 | 0.70 | PASS | API, UI, docs, tests, build, and smoke checks are pass/fail. |
| **Ambiguity** | 0.10 | <=0.20 | PASS | Gate passed. |

## Interview Log

Auto-selected recommended answers per the project workflow instruction to auto-approve defensible recommendations after grey-area questions.

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today? | Paginated catalog APIs and ProductGrid exist; advanced search/filters and URL state do not. |
| 2 | Simplifier | Minimum viable discovery? | Bounded search, core filters, sort, page, and shareable state only. |
| 3 | Boundary Keeper | What is excluded? | Autocomplete, fuzzy search, facets, recommendations, admin changes, and infinite scroll are deferred. |
| 4 | Failure Analyst | What would make this unsafe? | Unbounded/unindexed product search, URL state that route pages can override, or fallback replacing valid empty backend results. |
| 5 | Seed Closer | What should be verified? | Backend route/index coverage, frontend URL/control coverage, docs, build, full suites, and browser smoke. |

---

*Phase: 16-advanced-catalog-discovery-and-search*
*Spec created: 2026-06-20*
*Next step: $gsd-discuss-phase 16 - implementation decisions (how to build what is specified above)*
