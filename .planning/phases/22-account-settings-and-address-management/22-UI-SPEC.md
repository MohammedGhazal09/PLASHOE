# Phase 22 UI Spec

## Account Settings Tab
- Replace placeholder copy with two settings sections: profile details and address book.
- Profile form fields: full name, phone, read-only email.
- Address form fields: first name, last name, company, country, street, apartment, city, state, ZIP/postal code, phone, and default checkbox.
- Saved address list shows recipient, street/city/state/ZIP/country, phone, and a default badge.
- Non-default addresses expose a Set default action.
- All addresses expose a Delete action with confirmation.

## Credential Boundary
- Add a compact credential section that states password changes are not available in this workflow.
- Do not render a password form until the backend supports current-password verification or reset-token flow.

## Accessibility
- Every input has a visible label.
- Required fields use native `required` and clear labels.
- Loading and form actions disable only the active submission.
- Important failures are shown through existing toast feedback and reflected by stable button state.
