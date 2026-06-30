# Phase 25 UI Spec

## Home Newsletter Form

- Email input with accessible label.
- Explicit consent checkbox.
- Submit button with saving state.
- Inline success/error status message.
- API errors are visible in the form and not toast-only.

## Admin Newsletter Section

- Summary tiles for active subscribers, top source, and status mix.
- Filters for status, email, source, and search.
- Table with email, status, source, subscribed date, and unsubscribed date.
- Loading, empty, and error states.
- No unsubscribe token, export, or bulk-send controls.

## Accessibility Notes

- Native input/select/checkbox/button controls.
- Error messages use `role="alert"`.
- Success/loading messages use status text.
- Tables use semantic table headers.
