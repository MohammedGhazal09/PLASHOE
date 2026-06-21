# Phase 16: Advanced Catalog Discovery and Search - Discussion Log

**Date:** 2026-06-20
**Mode:** Auto-approved recommendations
**Subagents used:** false

## Summary

Phase 16 discussion was handled inline because the user pre-approved defensible recommendations and explicitly prohibited subagents. The implementation decisions were recorded in `16-CONTEXT.md`.

## Questions and Auto-Approved Recommendations

| Area | Question | Recommendation | Decision |
| --- | --- | --- | --- |
| Backend route shape | Should discovery use existing list endpoints or a new search endpoint? | Keep discovery under existing product list endpoints. | `GET /api/products` and legacy `/men`, `/women`, `/sale` remain the discovery surface. |
| Search parameter | What query parameter should text search use? | Use `q`. | `q` is the bounded search parameter. |
| Search fields | Which product fields should search cover? | Search product name, category, and description. | Search uses the Product text index across name/category/description. |
| Filters | Which filters are in scope? | Category, gender, sale, size, current-price range, and minimum rating. | All listed filters are supported. |
| Sort | Should new sort modes be introduced? | Keep the stable existing sort set. | Sort remains `price-asc`, `price-desc`, `rating`, and `newest`. |
| URL state | What owns catalog state? | URL query params own catalog search/filter/sort/page state. | Catalog pages restore and update URL state. |
| Route-forced filters | Can URL params override men/women/sale route filters? | No. Route filters win and stay out of shareable URLs. | Forced filters override query-string attempts. |
| Fallback catalog | Should fallback data be filtered with parity? | Yes, but only after backend request failure. | Fallback/defensive filtering mirrors backend params; valid empty backend responses stay authoritative. |
| Deferred discovery features | Should autocomplete, fuzzy search, facet counts, recommendations, or infinite scroll be included? | Defer all. | Deferred to future phases. |

## Recommendations Carried Forward

- Keep search bounded and index-backed.
- Keep catalog controls compact and utilitarian.
- Use URL state for shareable catalog links.
- Verify backend API, frontend URL state, ProductGrid behavior, docs, build, and browser smoke.

## Result

The approved decisions were written to `16-CONTEXT.md` and used by `16-01-PLAN.md`, `16-02-PLAN.md`, and `16-03-PLAN.md`.
