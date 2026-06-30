# Phase 27 UI Spec

## Product Picker

- Label and native product search input.
- Search button.
- Product result rows with name, category, price, and stock context.
- Select button per result.
- Selected product state.
- Loading, no-results, error, and stale-selected states.

## Lookbook Integration

- Hotspot product picker appends a hotspot row with default coordinates.
- Bundle product picker appends a bundle item row with first available size and quantity 1.
- Existing fields remain editable for coordinates and quantities.

## Accessibility Notes

- Native inputs and buttons are used.
- Error uses `role="alert"`.
- Loading uses `role="status"`.
- No nested forms are rendered inside the lookbook form.
