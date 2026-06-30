# Phase 26 UI Spec

## Admin Reviews Section

- Header with current result count.
- Filters for approval state, product id, and search.
- Review table with review text, product, customer, rating, approval state, and actions.
- Detail panel for selected review context.
- Approve/Hide actions with saving state.
- Loading, empty, error, and success states.

## Accessibility Notes

- Native labeled controls are used for filters.
- Row actions are native buttons with text labels.
- Errors use `role="alert"` and success uses `role="status"`.
- Review table uses semantic headers.

## Customer-Facing Trust

- Public Product Detail continues to render approved reviews only.
- Verified-purchase badge remains visible for public reviews.
