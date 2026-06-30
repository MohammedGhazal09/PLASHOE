# Phase 26 Spec: Review Moderation and Customer Trust Controls

## Objective

Admins can inspect, approve, and hide product reviews while public review content and product rating aggregates stay synchronized.

## Scope

- Add protected admin review list, detail, and moderation APIs.
- Recalculate product review aggregates after moderation changes.
- Add an admin Reviews section with filters, detail inspection, approve/hide actions, and clear states.
- Preserve public review listing as approved-only with limited user display data.

## Acceptance Criteria

- Admins can list reviews by approval state and product id.
- Admins can inspect review detail with product and customer context.
- Admins can approve or hide a review without deleting it.
- Public review listing and product aggregates only reflect approved reviews.
- Tests cover moderation transitions, aggregate recalculation, public visibility, and authorization.

## Recommendations

- Keep review deletion out of this phase; hiding preserves auditability and avoids accidental destructive defaults.
- Keep verified-purchase review badges visible on public product detail pages.
- Add richer moderation history only if operational audit requirements emerge.
