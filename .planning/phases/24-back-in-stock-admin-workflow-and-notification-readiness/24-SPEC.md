# Phase 24 Spec: Back-in-Stock Admin Workflow and Notification Readiness

## Objective

Admins can inspect and manage back-in-stock demand by product, size, email, and status before any notification provider is connected.

## Scope

- Add protected admin APIs for back-in-stock summary, paginated list/filter, and status updates.
- Add an admin console section for restock demand with summary, filters, empty/error states, and status actions.
- Preserve the existing public product-detail back-in-stock capture flow.
- Keep notification delivery, provider credentials, and contact-list export out of scope.

## Acceptance Criteria

- Admin APIs list and filter requests by product id, size, email, text search, and status.
- Admin summary aggregates pending demand by product/size and status without returning email lists.
- Admins can mark individual requests `notified` or `cancelled`.
- Status updates do not send email/SMS or require provider configuration.
- Tests cover admin authorization, filtering, summary aggregation, duplicate pending behavior, and status transitions.

## Recommendations

- Keep back-in-stock admin APIs under the existing `/api/back-in-stock` resource because the public request capture model already owns this lifecycle.
- Treat `notified` as an internal readiness/status marker only until newsletter/unsubscribe/suppression work is complete.
- Avoid CSV export or bulk contact operations in this phase to keep privacy and consent boundaries tight.
