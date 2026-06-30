# Phase 27 Discussion Log

## Decisions

- Keep the existing textareas as editable advanced payload fields, but add picker insertion so raw IDs no longer need to be typed.
- Use a simple searchable list instead of a custom combobox to keep keyboard and screen-reader behavior native.
- Surface stock state directly in picker rows.
- Treat stale-selected state as a reusable component state for future integrations.

## Recommendations

- Reuse `AdminProductPicker` in Phase 28 or later admin filters where product IDs remain visible.
- If product search volume grows, add debounce and pagination rather than expanding the backend contract prematurely.

## Risks

- Lookbook rows still store product IDs after selection because the backend contract expects IDs.
- Existing lookbook forms remain textarea-based for coordinate and quantity editing.
