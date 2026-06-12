# Phase 07: catalog-and-frontend-architecture-cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution workflows.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 07-catalog-and-frontend-architecture-cleanup
**Areas discussed:** skill and workflow boundaries, product normalization, catalog loading, backend product API, catalog controls and pagination, frontend API module split, frontend extraction, testing and verification, documentation and deferred scope

---

## Skill and Workflow Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Use installed local skills | Use `react-best-practices`, `zustand-state-management`, `mongodb`, and `api-testing`. | yes |
| Install external storefront/React/MongoDB skills | Install external candidates found by `find-skills`. | |
| Use subagents | Delegate research/planning to subagents. | |

**User's choice:** Approved recommendations globally.
**Notes:** Repository instruction says not to use subagents. External skills were found, but local skills cover the current stack.

---

## Product Normalization

| Option | Description | Selected |
|--------|-------------|----------|
| `src/services/catalog/normalizeProduct.js` | Central normalizer/service boundary for backend and fallback product shapes. | yes |
| Utility-only helper | Put normalization in a generic utility file. | |
| API-wrapper-only mapping | Normalize inside `productsApi.js`. | |

**User's choice:** Approved recommendations globally.
**Notes:** Product display components should consume normalized `image`, `price.current`, and `price.original` only. Static fallback IDs should be deterministic and marked with `source: 'fallback'`.

---

## Catalog Loading

| Option | Description | Selected |
|--------|-------------|----------|
| Service plus hook | Use catalog service functions and `useCatalogProducts`. | yes |
| Zustand store | Store catalog server state globally. | |
| Page-local fetching | Keep each page responsible for its own backend/fallback logic. | |

**User's choice:** Approved recommendations globally.
**Notes:** Backend requests are primary. Static fallback should run on backend request failure only, not on a valid empty backend response.

---

## Backend Product API

| Option | Description | Selected |
|--------|-------------|----------|
| Keep legacy routes bounded | Keep `/men`, `/women`, and `/sale`, but implement them through shared validated pagination/list logic. | yes |
| Remove legacy routes | Force all callers to use only `/api/products`. | |
| Leave legacy routes unbounded | Preserve current behavior unchanged. | |

**User's choice:** Approved recommendations globally.
**Notes:** Frontend catalog pages should prefer canonical `productsApi.getAll(params)`. Product list responses should add consistent `page` and `limit` metadata while preserving existing envelope fields.

---

## Catalog Controls and Pagination

| Option | Description | Selected |
|--------|-------------|----------|
| Server-driven controls | Page/query state owns category, sort, page, and limit. | yes |
| Client-only controls | Keep filtering/sorting full arrays in `ProductGrid`. | |
| Add new backend filters | Extend backend contract for price/rating/search now. | |

**User's choice:** Approved recommendations globally.
**Notes:** Phase 07 should not add new backend filters. Use simple Previous/Next pagination and avoid infinite scroll.

---

## Frontend API Module Split

| Option | Description | Selected |
|--------|-------------|----------|
| Hard split | Move contact/coupon wrappers into `contactApi.js` and `couponApi.js`, with no re-export from `ordersApi.js`. | yes |
| Temporary re-export | Split files but keep compatibility exports from `ordersApi.js`. | |
| Leave mixed module | Keep contact/coupon wrappers in `ordersApi.js`. | |

**User's choice:** Approved recommendations globally.
**Notes:** Update imports, tests, mocks, and docs to make `ordersApi.js` order-only.

---

## Frontend Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Focused extraction | Extract touched catalog/product/API pieces and only affected Checkout/Account pieces. | yes |
| Broad page refactor | Aggressively shrink all large pages. | |
| Minimal wiring only | Move APIs but avoid extracting helper units. | |

**User's choice:** Approved recommendations globally.
**Notes:** Home marketing sections should remain out of scope. Stop when data/derived logic is delegated and tested, not at an arbitrary line count.

---

## Testing and Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Focused backend/frontend tests plus static checks | Add product route tests, catalog normalizer/loader tests, wrapper tests, and final grep/build/test verification. | yes |
| E2E/browser suite | Add Playwright/Cypress coverage for catalog browsing. | |
| Minimal snapshot/build verification | Rely mainly on build and existing tests. | |

**User's choice:** Approved recommendations globally.
**Notes:** Required verification should include backend tests, frontend tests, frontend build, and `rg` checks for legacy fields and mixed API exports.

---

## Documentation and Deferred Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted docs update | Update `docs/API.md` and `docs/DEVELOPMENT.md` for changed contracts/conventions. | yes |
| Broad docs refresh | Rewrite wider documentation. | |
| Defer docs | Leave docs unchanged until later. | |

**User's choice:** Approved recommendations globally.
**Notes:** Deferred scope includes wishlist, reviews, admin product UI, new catalog filters/search, visual redesign, CRA/Vite migration, and Phase 08 CI/CD/observability.

---

## the agent's Discretion

- Exact helper filenames under `src/services/catalog` may vary if the normalizer/loading boundary is clear and tested.
- Exact ProductGrid pagination component split may vary if backend query state is controlled outside the grid.
- Exact index composition may vary if indexes directly support approved filters/sorts and avoid deferred search/filter scope.
- Exact empty-state copy may vary if valid empty backend results do not trigger static fallback.

## Deferred Ideas

- Wishlist.
- Product reviews.
- Full admin product/coupon UI.
- Create React App to Vite/tooling migration.
- Price/rating backend filter params, search, size/brand/color filters, and broader catalog search/faceting.
- Visual redesign.
- CI/CD, observability, readiness checks, and deployment operations.
