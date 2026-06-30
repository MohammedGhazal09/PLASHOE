# Phase 27 Context

## Existing Surface

- `AdminLookbook.jsx` previously showed product reference IDs and required manual product ID text entry.
- `adminApi.getProducts` already calls the bounded `/api/products` search endpoint.
- Phase 27 constraints explicitly require reusing existing product search.

## Implementation Notes

- `AdminProductPicker` loads recent products on mount and searches with `q`, `limit: 8`, and `sort: newest`.
- The picker exposes selected, loading, no-results, error, stale-selected, and stock-context states.
- Lookbook integration appends selected product rows to hotspot and bundle textareas.

## Constraints

- No subagents were used.
- No new backend admin search endpoint was added.
- UI work used `npx ui-skills start` and accessibility form/control guidance.
