# Phase 25 Discussion Log

## Decisions

- Store newsletter lifecycle in a dedicated `NewsletterSubscription` collection.
- Keep statuses to `active`, `unsubscribed`, and `suppressed` so future suppression work has a defined status vocabulary.
- Use a raw unsubscribe token stored with `select: false` for this project stage; admin APIs do not return it.
- Make duplicate active subscriptions idempotent and reactivation non-duplicating.
- Add admin visibility without row-level actions in this phase.

## Recommendations

- Before provider delivery, add send audit records, suppression checks, retry policy, and rate limits.
- Consider hashing or encrypting unsubscribe tokens if the future provider workflow can retain or regenerate raw unsubscribe links safely.
- Keep exports disabled unless a clear privacy/legal requirement is documented.

## Risks

- The unsubscribe endpoint is API-only; a customer-facing unsubscribe landing page can be added when provider email links are introduced.
- Admin source filtering is functional but intentionally compact.
