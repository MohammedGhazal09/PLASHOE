# Phase 22 Spec: Account Settings and Address Management

## Goal
Customers can maintain profile details and saved addresses from account settings, and checkout uses the same default-address contract.

## Requirements
- V3-ACC-01: Authenticated customers can update account profile fields that are already supported by the protected auth API.
- V3-ACC-02: Authenticated customers can add, delete, and choose a default saved address without breaking checkout prefill.
- V3-ACC-03: Credential-management behavior is explicit and protected; no weak password or email mutation shortcut is introduced.

## Recommendation
Reuse the existing auth profile and address boundary, then add one narrow protected default-address endpoint. Do not implement password changes in this phase because the current backend has no current-password verification or reset-token workflow.

## In Scope
- Replace the account settings placeholder with an editable profile form.
- Add an address book UI for add, delete, and set-default operations.
- Preserve checkout default-address prefill through the existing `user.addresses` shape.
- Keep profile mutation limited to `name` and `phone`.
- Add focused backend, store, and page tests for profile and address behavior.

## Out of Scope
- Email change workflow.
- Password reset/change workflow.
- Address editing beyond delete and recreate.
- Third-party identity provider or notification integration.

## Acceptance Criteria
- The settings tab has labeled, keyboard-accessible forms and action buttons.
- Adding a first address makes it default.
- Choosing an existing address as default clears the previous default.
- Deleting the default address promotes another saved address when one remains.
- Checkout still prefills from the selected default address.
- Unsupported credential changes are visible as unavailable rather than silently implied.
