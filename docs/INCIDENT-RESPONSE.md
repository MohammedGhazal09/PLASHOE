# Incident Response

This runbook defines PLASHOE incident response and rollback procedures. It is platform-neutral until Phase 09 supplies the selected backend host, frontend host, MongoDB provider, Stripe test-mode endpoint, notification path, and host-specific rollback commands.

Host-specific rollback commands, dashboard links, and notification targets are required-before-Phase-12 and must not be invented in source control.

## Severity Model

| Severity | Criteria | Response target | Communication cadence |
| --- | --- | --- | --- |
| SEV1 | Complete outage or payment failure affecting all users | Immediate response | Every 15 minutes or on major change |
| SEV2 | Major checkout, API, MongoDB, or Stripe degradation | Within 15 minutes | Every 30 minutes |
| SEV3 | Limited operational degradation or partial feature impact | Within 1 hour | Hourly or when resolved |
| SEV4 | Low-impact noise, cosmetic issue, or next-business-day follow-up | Next business day | Next business day or closure update |

## Roles

| Role | Responsibility |
| --- | --- |
| Primary Operator | Acknowledge, triage, coordinate mitigation, decide rollback recommendation, and own the incident timeline. |
| Backup Operator | Validate checks, collect evidence, execute approved operational steps, and take over if Primary Operator is unavailable. |
| Business Owner | Decide customer/business communication, approve production rollback or customer-impact messaging when needed. |
| Provider Admin | Handle provider-specific access or restore operations when least-privilege operator access is insufficient. |

## Incident Command Flow

1. Acknowledge the alert or report and assign Primary Operator.
2. Declare severity using the table above.
3. Open the incident channel or notification path marked required-before-Phase-12.
4. Assign Backup Operator and Business Owner when customer impact, payment impact, or rollback is possible.
5. State current impact, affected systems, and next update time.
6. Run the first 5/15/60 minute checks below.
7. Mitigate with the narrowest safe action.
8. If rollback criteria are met, request Business Owner approval and run the host-specific rollback command slot after it is filled before Phase 12.
9. Verify recovery with the rollback verification checks.
10. Monitor until stable, close the incident, and write post-incident notes.

## First 5/15/60 Minute Checks

| Window | Checks | Expected healthy state |
| --- | --- | --- |
| First 5 minutes | Process startup, `/api/health`, `/api/ready`, startup logs, MongoDB connection logs | Backend live, readiness ready, MongoDB connected |
| First 15 minutes | API 4xx/5xx behavior, `api-request-completed`, checkout-start errors, Stripe webhook errors | No new sustained error pattern |
| First 60 minutes | Payment completion, admin fulfillment, product/cart/order flows, support reports | Core flows remain stable |

## Rollback

Rollback triggers are listed per scenario. Host-specific rollback commands are required-before-Phase-12:

| Surface | Command slot | Status |
| --- | --- | --- |
| Backend host rollback | required-before-Phase-12 | blocked until backend host is selected |
| Frontend host rollback | required-before-Phase-12 | blocked until frontend host is selected |
| Environment/config rollback | required-before-Phase-12 | blocked until host secret/config manager is selected |
| Database restore or point-in-time recovery | required-before-Phase-12 | blocked until MongoDB provider access and disposable restore target exist |

Rollback verification must reuse existing deployment smoke checks:

- `GET /api/health`
- `GET /api/ready`
- Auth register/login or `/api/auth/me` with a disposable staging account
- Public product browsing
- Cart/checkout start
- Payment return routes `/checkout/success` and `/checkout/cancel`
- Admin order list/detail/fulfillment check with a disposable admin account

## Scenario: API down

| Field | Procedure |
| --- | --- |
| Symptoms | `/api/health` fails, host reports process down, no `server-listening`, or repeated restarts. |
| Immediate checks | Host service status, latest deploy event, `runtime-config-validated`, `server-listening`, `/api/health`, `/api/ready`. |
| Decision thresholds | SEV1 if all API traffic is down; SEV2 if only readiness or one critical route family is degraded. |
| First response | Compare failure start time with deploy event, check config validation logs, and restore the last known-good deployment if rollback criteria are met. |
| Rollback trigger | Health remains failed after expected startup window or deploy correlates with repeated restarts. |
| Rollback verification | Re-run health, readiness, auth, product browsing, cart/checkout, payment return, and admin smoke checks. |
| Escalation | Business Owner for customer impact; Provider Admin if host access or provider incident is suspected. |
| Evidence to record | Safe timestamps, commit/deploy label, health/readiness status, redacted log event names, and rollback result. |

## Scenario: MongoDB not ready

| Field | Procedure |
| --- | --- |
| Symptoms | `/api/ready` returns `503`, `mongodb-connection-failed`, `mongodb-unavailable`, checkout/admin data paths fail, or provider dashboard shows outage. |
| Immediate checks | `/api/ready`, MongoDB provider status, host config presence, `mongodb-connected`, `mongodb-connection-failed`, and recent config changes. |
| Decision thresholds | SEV1 if checkout or all data-backed flows are unavailable; SEV2 if readiness is degraded with partial API availability. |
| First response | Confirm provider status, verify the staging/production boundary, check host secret/config presence, and avoid changing data until the cause is known. |
| Rollback trigger | A recent deploy or config change caused sustained readiness failure, or provider restore/rollback is needed for data access. |
| Rollback verification | Verify `/api/ready` returns `ready: true`, then run safe read-only smoke checks and checkout-start only against disposable staging data. |
| Escalation | Provider Admin for provider dashboard access, backup status, or restore drill; Business Owner if checkout impact is customer-facing. |
| Evidence to record | Provider label, safe readiness status, event names, restore target label if used, and no connection strings. |

## Scenario: Stripe webhook failures

| Field | Procedure |
| --- | --- |
| Symptoms | Stripe dashboard shows repeated failed deliveries, backend logs `stripe-webhook-processing-failed`, payment orders do not move to paid/failed/canceled, or webhook endpoint returns repeated non-2xx. |
| Immediate checks | Stripe test-mode endpoint status, event selection, endpoint URL, host health/readiness, `stripe-webhook-*` event logs, and recent checkout/payment changes. |
| Decision thresholds | SEV1 if all real payments cannot reconcile; SEV2 if one event family or test-mode delivery is degraded. |
| First response | Confirm host is live, validate endpoint path, inspect event id/type in logs, and compare affected order payment state. |
| Rollback trigger | Recent deploy caused repeated webhook 5xx or processing failures for required payment events. |
| Rollback verification | Send or observe safe test-mode events, confirm `stripe-webhook-accepted`, and verify order payment state changes as expected. |
| Escalation | Business Owner for payment/customer impact; Provider Admin if Stripe dashboard access or endpoint settings are blocked. |
| Evidence to record | Event type, redacted delivery status, host status, order state summary without PII, and response status. |

## Scenario: checkout/payment degradation

| Field | Procedure |
| --- | --- |
| Symptoms | Checkout start fails, hosted checkout URL is missing, return routes break, paid orders do not become processing, or support reports failed payment completion. |
| Immediate checks | Cart/checkout API status, Stripe session creation, `api-request-completed` on checkout paths, payment return routes, and webhook processing logs. |
| Decision thresholds | SEV1 if all checkout is blocked; SEV2 if a subset of payment or return paths is degraded. |
| First response | Separate expected stock/coupon/idempotency conflicts from server/payment failures, then inspect request ids and Stripe delivery. |
| Rollback trigger | Recent deploy causes checkout-start 5xx, broken return routes, or payment reconciliation failures for real orders. |
| Rollback verification | Re-run cart/checkout smoke, payment return page checks, and webhook acceptance verification. |
| Escalation | Business Owner for revenue/customer impact; Primary Operator owns technical mitigation. |
| Evidence to record | Request ids, status codes, payment state summary, Stripe event type, and smoke result. |

## Scenario: noisy or missing alerts

| Field | Procedure |
| --- | --- |
| Symptoms | Alerts fire without actionability, expected health/readiness/webhook alerts do not fire, notification path is missing, or alert volume hides real incidents. |
| Immediate checks | Alert catalog row, notification path label, host monitor configuration, provider dashboard status, and recent deploy or provider maintenance events. |
| Decision thresholds | SEV3 if a required alert is missing during active risk; SEV4 for tuning noise with no active customer impact. |
| First response | Confirm whether the alert maps to an owner and first response action; disable only clearly non-actionable noise after documenting why. |
| Rollback trigger | Missing alerts do not normally trigger rollback; rollback only if the underlying service degradation meets another scenario trigger. |
| Rollback verification | Verify the underlying health/readiness/checkout/webhook checks after any rollback or alert config correction. |
| Escalation | Backup Operator for tuning review; Business Owner if notification policy affects customer communication. |
| Evidence to record | Alert name, signal source, owner role, notification path label, false-positive reason, and corrective action. |

## Communication Templates

### Initial Update

```text
Severity: SEV[1-4]
Status: Investigating
Impact: [who or what is affected]
Current finding: [factual observation]
Owner: Primary Operator
Next update: [time]
```

### Resolution Update

```text
Severity: SEV[1-4]
Status: Resolved
Impact window: [start to end]
Resolution: [mitigation or rollback]
Verification: [health/readiness/smoke checks]
Follow-up: [post-incident note or action item]
```

## Post-Incident Notes

Use this template after any SEV1, SEV2, rollback, data restore, payment-impacting incident, or alert failure.

| Field | Notes |
| --- | --- |
| Incident title |  |
| Date and duration |  |
| Severity |  |
| Impact |  |
| Timeline |  |
| Root cause |  |
| What worked |  |
| What failed |  |
| Action items | Owner, priority, due date |
| Evidence links | Safe provider labels or source-controlled artifact paths only |
