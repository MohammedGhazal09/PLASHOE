# Phase 24 UI Spec

## Admin Restock Section

Location: `Frontend/Ecommerce-main/my-app/src/pages/admin/AdminBackInStock.jsx`

## Required States

- Loading: status text while summary/list requests resolve.
- Populated: summary tiles, largest pending demand, filters, and request table.
- Empty: clear no-results state when filters return no requests.
- Error: visible alert when the admin API fails.
- Saving: row actions disable during status update and show saving text.

## Controls

- Status select with all, pending, notified, and cancelled.
- Email search input.
- Product ID input as a temporary filter until Phase 27 product picker work.
- Size numeric input bounded by the backend validator.
- Search input for email/product-name matching.
- Row actions for `Mark notified` and `Cancel`.

## Accessibility Notes

- Native labels wrap each input/select.
- Row actions are native buttons with text labels.
- Errors use `role="alert"`.
- Loading and success notices use status text.
- Tables use semantic `table`, `thead`, `th`, and `tbody`.
