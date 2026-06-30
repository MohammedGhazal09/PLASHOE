# Phase 26 Discussion Log

## Decisions

- Keep new verified-purchase reviews auto-approved as before; Phase 26 adds moderation control rather than changing submission policy.
- Use `isApproved` as the approval state instead of adding a second status field.
- Provide `Hide` rather than `Delete` as the admin action.
- Reuse product aggregate recalculation instead of duplicating rating math in moderation code.

## Recommendations

- Add moderation history if review governance becomes a compliance requirement.
- Add product picker integration for review filters after Phase 27 introduces the reusable picker.
- Keep public user data limited to display name on product detail.

## Risks

- The admin review list exposes customer email under existing admin policy; public review responses still omit email.
- Product ID filter remains raw until Phase 27.
