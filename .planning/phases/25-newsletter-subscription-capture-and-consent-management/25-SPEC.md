# Phase 25 Spec: Newsletter Subscription Capture and Consent Management

## Objective

Turn the storefront newsletter form into a real consent-backed subscription workflow with protected admin visibility and unsubscribe handling before any provider delivery integration.

## Scope

- Add a newsletter subscription model with email, consent, source, status, unsubscribe token, subscribed timestamp, and unsubscribe timestamp.
- Add public subscribe and unsubscribe APIs.
- Add protected admin list and summary APIs.
- Wire the Home newsletter form to the public API with explicit consent.
- Add an admin Newsletter section for compact subscription visibility.

## Acceptance Criteria

- Public subscription requires explicit consent and stores a duplicate-safe active record.
- Duplicate active subscriptions are idempotent.
- Unsubscribe by token changes status to `unsubscribed` without deleting the record.
- Resubscribe reactivates the same email record and rotates the unsubscribe token.
- Admin summary/list endpoints are protected and do not expose unsubscribe tokens.
- Tests and visual QA cover success, duplicate, unsubscribe, admin, empty, and error states.

## Recommendations

- Keep provider delivery out of scope until suppression checks, audit logging, and send-rate policy are specified.
- Use Phase 25 data as the consent foundation for future lifecycle messaging.
- Do not add export or bulk-send controls until provider and privacy requirements are explicit.
