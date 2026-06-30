# Phase 25 Context

## Existing Surface

- `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx` had a static newsletter email input and button.
- No backend newsletter model, controller, validator, route, or admin surface existed.
- Existing admin console patterns use compact bordered panels and native controls.

## Implementation Notes

- `NewsletterSubscription.unsubscribeToken` is `select: false`, so admin list/summary responses do not expose it.
- Public subscribe is idempotent for active subscriptions and reactivates unsubscribed records.
- Public unsubscribe uses `POST /api/newsletter/unsubscribe/:token`.
- Admin routes are protected by existing `protect, admin` middleware.
- A dedicated newsletter rate limiter was added for public subscribe attempts.

## Constraints

- No subagents were used.
- No provider delivery, provider secret, bulk send, or contact-list export was added.
- UI work used `npx ui-skills start` and accessibility form guidance.
