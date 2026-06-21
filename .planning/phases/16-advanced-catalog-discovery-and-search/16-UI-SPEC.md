# Phase 16: Advanced Catalog Discovery and Search - UI Specification

**Created:** 2026-06-21
**Status:** Approved
**Subagents used:** false

## Goal

Catalog pages expose compact, shareable search and filter controls that let shoppers narrow products without turning the storefront into a dense admin-style tool.

## Surfaces

| Surface | Route | UI responsibility |
| --- | --- | --- |
| Full collection catalog | `/collection` | Restore and update search, filters, sort, and page from URL query params. |
| Men's catalog | `/men` | Same controls as collection, with gender forced to male outside the URL. |
| Women's catalog | `/women` | Same controls as collection, with gender forced to female outside the URL. |
| Sale catalog | `/sale` | Same controls as collection, with sale forced outside the URL and no duplicate sale checkbox requirement. |

## Layout Contract

- Keep the existing visual hierarchy: hero first, discovery controls immediately below hero, product count, product grid, then pagination.
- Controls must fit in one compact bordered control band on desktop.
- Desktop control band uses a 4-column grid where available.
- Mobile stacks controls vertically with full-width inputs/selects and no horizontal scrolling.
- Product cards remain in the existing responsive grid; this phase does not redesign cards.
- Pagination remains explicit previous/next buttons with page text, not infinite scroll.

## Controls

| Control | Type | Label | Contract |
| --- | --- | --- | --- |
| Search | Search input | `Search products` | Restores `q`, trims empty values, resets page to 1 on change. |
| Sort | Select | `Sort products` | Supports default, newest, price low-to-high, price high-to-low, and rating. |
| Category | Select | `Filter by category` | Supports all, Training, Running, Sneaker, Classic. |
| Size | Select | `Filter by size` | Supports EU sizes 35-45 plus all sizes. |
| Minimum price | Number input | `Minimum price` | Non-negative numeric filter; placeholder `Min price`. |
| Maximum price | Number input | `Maximum price` | Non-negative numeric filter; placeholder `Max price`. |
| Minimum rating | Select | `Minimum rating` | Supports all ratings plus 4+, 3+, 2+, 1+. |
| Sale only | Checkbox | `Sale products only` | Visible only when sale is not route-forced. |

## State Contract

- Loading: show visible text `Updating catalog...` near the controls/count.
- Backend request failure with fallback data: show visible text `Live catalog unavailable. Showing available product data.`
- No results: show visible text `No products found matching your criteria.`
- Count: show `Showing X of Y products`.
- Route-forced filters must not need visible explanatory text; the route title/hero already communicates the page context.

## Typography

- Use existing PLASHOE storefront typography and Tailwind utility scale.
- Hero headings keep existing page styling.
- Controls use compact body-sized text; no hero-scale type inside the control band.
- Error/fallback state text is small and centered.

## Color

- Keep controls on a white background with neutral gray borders.
- Do not introduce a new phase-specific palette.
- Fallback/error state uses a restrained amber text color.
- Product cards retain existing card styling and wishlist/cart affordances.

## Spacing

- Control band uses 4px-multiple spacing.
- Keep vertical separation from hero and product grid consistent with existing catalog pages.
- Avoid nested cards; the control band is a single tool surface, not a card inside a card.

## Accessibility

- Every input/select/checkbox must have a stable accessible label.
- URL-restored values must be visible in the controls after reload.
- Pagination buttons must remain disabled when unavailable.
- Mobile must have no page-level horizontal overflow.

## Out of Scope

- Autocomplete/typeahead.
- Fuzzy search hints or suggestions.
- Facet count badges.
- Filter chips or saved filter presets.
- Infinite scroll.
- Product-card visual redesign.

## Verification Expectations

- Component tests assert labels, query-change behavior, advanced filters, loading/error/no-results states, and pagination.
- URL hook tests assert restore, update, page changes, and route-forced filter behavior.
- Browser smoke captures desktop and mobile catalog URL restore with no mobile horizontal overflow.

## Approval

Approved inline using the user's standing recommendation auto-approval. This UI-SPEC records the implemented Phase 16 UI contract retroactively because the implementation and verification already exist.
