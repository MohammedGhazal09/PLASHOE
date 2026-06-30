# Phase 27 Spec: Searchable Admin Product Picker for Merchandising Workflows

## Objective

Admin merchandising screens can select products through a reusable searchable picker instead of manually typing raw product IDs.

## Scope

- Add a reusable admin product picker that uses the existing bounded product API.
- Integrate the picker into lookbook hotspot and bundle workflows.
- Cover loading, no-results, selected, stale, and stock-context states.
- Avoid adding a new admin search endpoint.

## Acceptance Criteria

- Picker searches products through `adminApi.getProducts`.
- Picker displays id-independent product context: name, category, price, and stock state.
- Lookbook hotspot and bundle fields can be populated by selecting products.
- Tests cover picker behavior and lookbook integration.
- Visual QA covers selected, mobile, no-results, and error states.

## Recommendations

- Reuse this picker for future review/product filters that still rely on raw product IDs.
- Keep the picker native and explicit before considering a custom combobox.
