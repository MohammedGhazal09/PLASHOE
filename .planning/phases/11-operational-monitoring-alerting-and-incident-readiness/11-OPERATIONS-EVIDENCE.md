---
phase: 11-operational-monitoring-alerting-and-incident-readiness
status: pending
evidence_policy: redacted
requirements:
  - MON-01
  - MON-02
  - MON-03
  - MON-04
---

# Phase 11 Operations Evidence

## Verdict

Source-level webhook logging evidence can pass locally through focused backend tests and static checks. Live-provider rows remain blocked until Phase 09 supplies the missing staging backend origin, staging frontend origin, MongoDB isolation/provider evidence, Stripe test-mode endpoint/dashboard evidence, selected host/log provider, notification path, and MapTiler decision where applicable.

This ledger records operational readiness evidence only. It does not prove that PLASHOE has been deployed or that provider dashboards already exist.

## Runtime Signal Routing

| Signal | Source | Expected capture point | Operator check location | Healthy state | Evidence required before Phase 12 | Current status | Blocker notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backend structured logs | `Backend/utils/logger.js` stdout/stderr JSON records | Selected backend host native logs | Host log viewer or exported safe log summary | JSON records include `timestamp`, `level`, `event`, and safe metadata | Selected host/log provider label plus safe sample log capture | blocked | Missing Phase 09 selected host/log provider and staging backend origin. |
| Request completion logs | `api-request-completed` from `Backend/middleware/requestContext.js` | Backend host logs | Host log viewer filtered by request id | API requests include `requestId`, path, status, and duration | Safe request-id trace from a staged API call | blocked | Missing Phase 09 staging backend origin and host log provider. |
| Backend liveness | `GET /api/health` | Host uptime monitor or manual smoke check | Uptime check or safe command output | `200` with API running payload | Hosted health check against staging backend origin | blocked | Missing Phase 09 staging backend origin. |
| Backend readiness | `GET /api/ready` and `readiness-check-failed` | Host uptime/readiness monitor and backend logs | Readiness monitor plus host logs | `200`, `ready: true`, MongoDB state `connected` | Hosted readiness check with redacted MongoDB provider evidence | blocked | Missing Phase 09 staging backend origin and MongoDB isolation/provider evidence. |
| MongoDB connection logs | `mongodb-connected`, `mongodb-connection-failed`, `mongodb-unavailable` | Backend host logs | Host log viewer and MongoDB provider dashboard | Connection succeeds or degraded state is visible without secrets | Safe host log summary plus provider status label | blocked | Missing Phase 09 MongoDB isolation/provider evidence and selected host/log provider. |
| Stripe webhook operational events | `stripe-webhook-invalid-signature`, `stripe-webhook-duplicate`, `stripe-webhook-accepted`, `stripe-webhook-processing-failed` | Backend host logs and Stripe dashboard delivery view | Host log viewer plus Stripe test-mode endpoint delivery view | Valid events are accepted, duplicates are no-op, failures emit safe error metadata | Local test proof now; hosted Stripe delivery proof before Phase 12 | blocked | Local source proof passed in Plan 11-01; live Stripe proof is blocked on Phase 09 Stripe test-mode endpoint/dashboard evidence and staging backend origin. |
| Deployment events | GitHub Actions and selected host deploy logs | CI run summary and host deployment event stream | GitHub Actions run plus host deployment activity view | Deploy event maps to commit and startup logs without sustained errors | Safe CI/host deployment event label and timestamp | blocked | Missing Phase 09 selected backend/frontend host providers and staging origins. |
| 5xx behavior | API response status and `api-request-completed` logs | Backend host logs and smoke checks | Host logs filtered by 5xx status and request id | No sustained 5xx pattern on auth, catalog, checkout, webhook, or admin paths | Safe 5xx window summary after staging smoke | blocked | Missing Phase 09 staging backend origin, selected host/log provider, and staged smoke traffic. |
| Frontend/API routing | Staging frontend bundle calling deployed backend `/api` | Browser network summary or safe smoke evidence | Frontend host plus browser/network summary | Storefront uses staging backend API, not localhost | Safe staging frontend origin and API URL wiring proof | blocked | Missing Phase 09 staging frontend origin, staging backend origin, and MapTiler decision where applicable. |

## Webhook Event Evidence

| Event | Path | Safe metadata allowed | Local proof expected | Current status | Blocker notes |
| --- | --- | --- | --- | --- | --- |
| `stripe-webhook-invalid-signature` | Invalid signature catch | `requestId`, `signaturePresent` | `cd Backend; npx vitest run test/payment-webhook.test.js` parsed JSON warning log and confirmed no signature or payload value | passed | Local source-level proof only; hosted provider proof remains blocked above. |
| `stripe-webhook-duplicate` | Duplicate `PaymentEvent` claim branch | `requestId`, `eventId`, `eventType`, `duplicate`, `status` | `cd Backend; npx vitest run test/payment-webhook.test.js` parsed JSON info log on duplicate event | passed | Local source-level proof only; hosted provider proof remains blocked above. |
| `stripe-webhook-accepted` | Successful webhook processing branch | `requestId`, `eventId`, `eventType`, `duplicate`, `status` | `cd Backend; npx vitest run test/payment-webhook.test.js` parsed JSON info log on accepted event | passed | Local source-level proof only; hosted provider proof remains blocked above. |
| `stripe-webhook-processing-failed` | Processing failure catch | `requestId`, `eventId`, `eventType`, `status`, serialized redacted `error` | `cd Backend; npx vitest run test/payment-webhook.test.js` parsed JSON error log and checked no stack, raw payload, signatures, provider secrets, MongoDB connection strings, or bearer tokens | passed | Local source-level proof only; hosted provider proof remains blocked above. |

## Local Command Evidence

| Command | Status | Result |
| --- | --- | --- |
| `cd Backend; npx vitest run test/payment-webhook.test.js` | passed | 1 test file and 9 tests passed on 2026-06-14. |
| Static raw-console removal check | passed | `console.error(error?.stack || error)` has no matches in `Backend/controllers/webhookController.js`. |
| Evidence secret-pattern scan | passed | No secret-looking values matched in this evidence file. |

## Durable Documentation Evidence

| Artifact | Requirement coverage | Local status | Live-provider status | Evidence |
| --- | --- | --- | --- | --- |
| `docs/OPERATIONS.md` purpose and stack decision | MON-01, MON-02, MON-04 | passed | blocked | Documents host-native logs/alerts first, MongoDB provider dashboard, Stripe dashboard, and GitHub Actions/host deploy events without adding a new APM vendor. |
| `docs/OPERATIONS.md` runtime signal routing | MON-01 | passed | blocked | Covers backend JSON logs, `api-request-completed`, startup events, MongoDB events, `/api/health`, `/api/ready`, webhook events, and deployment events. |
| `docs/OPERATIONS.md` alert catalog | MON-02 | passed | blocked | Covers backend downtime, readiness failure, sustained 5xx, Stripe delivery, Stripe processing, MongoDB connectivity, and checkout/payment-path degradation with owner roles and response actions. |
| `docs/OPERATIONS.md` minimal dashboard checklist | MON-01, MON-02 | passed | blocked | Covers health, readiness, 5xx behavior, webhook failures, MongoDB state, backup status, deployment events, and checkout/payment path. |
| `docs/OPERATIONS.md` operational access matrix | MON-04 | passed | blocked | Covers backend host/logs, frontend host, MongoDB backups/restores, Stripe dashboard/webhooks, MapTiler, GitHub Actions, secret/config stores, and notification channel. |
| `docs/DEPLOYMENT.md` operations cross-link | MON-01, MON-02, MON-04 | passed | blocked | Deployment monitoring windows link to `docs/OPERATIONS.md` for signal routing, alert ownership, dashboard checklist, and access responsibilities. |

## MongoDB Backup and Restore Evidence

| Evidence row | Requirement coverage | Local status | Live-provider status | Evidence or blocker |
| --- | --- | --- | --- | --- |
| Provider-managed backup requirement | MON-03 | passed | blocked | `docs/OPERATIONS.md` requires provider-managed backups; live proof blocked by missing Phase 09 MongoDB isolation/provider evidence. |
| Backup schedule/status | MON-03 | passed | blocked | Evidence shape is documented; actual schedule/status proof blocked by missing MongoDB provider dashboard access and safe backup summary. |
| Disposable staging restore target | MON-03 | passed | blocked | Restore target requirements are documented; drill blocked by missing disposable staging database/cluster/project/credential boundary. |
| Restore drill procedure | MON-03 | passed | blocked | Procedure exists and forbids production targets, committed connection strings, backup artifacts, account ids, and secret-bearing screenshots. |
| `/api/ready` proof after restore | MON-03 | pending | blocked | Hosted proof blocked by missing Phase 09 staging backend origin and restored disposable staging target. |
| Read-only smoke proof after restore | MON-03 | pending | blocked | Smoke proof blocked by missing staging backend/frontend origins and disposable staging setup. |

## Incident and Rollback Evidence

| Artifact or evidence row | Requirement coverage | Local status | Live-provider status | Evidence or blocker |
| --- | --- | --- | --- | --- |
| `docs/INCIDENT-RESPONSE.md` severity and roles | MON-04 | passed | blocked | Defines SEV1-SEV4 plus Primary Operator, Backup Operator, Business Owner, and Provider Admin role responsibilities. |
| Incident command flow and communication cadence | MON-04 | passed | blocked | Documents acknowledgment, severity declaration, role assignment, next update timing, mitigation, verification, monitoring, closure, and follow-up notes. |
| First 5/15/60 minute checks | MON-04 | passed | blocked | Reuses deployment signals: startup, health, readiness, MongoDB logs, API 4xx/5xx, checkout-start, Stripe webhook errors, payment completion, admin fulfillment, and support reports. |
| Scenario runbooks | MON-04 | passed | blocked | Covers API down, MongoDB not ready, Stripe webhook failures, checkout/payment degradation, and noisy or missing alerts. |
| Host-specific rollback command slots | MON-04 | passed | blocked | Slots are marked required-before-Phase-12; live commands blocked by missing selected backend/frontend hosts and provider rollback details. |
| `docs/DEPLOYMENT.md` incident cross-link | MON-04 | passed | blocked | Deployment rollback section links to `docs/INCIDENT-RESPONSE.md`; live runbook proof remains blocked until Phase 12 cutover rehearsal. |

## Live Provider Blockers from Phase 09

| Missing input | Blocks | Required safe evidence |
| --- | --- | --- |
| Staging backend origin | Hosted health, readiness, request-id, webhook endpoint, 5xx window, and host log proof | Public staging backend origin only, no secrets. |
| Staging frontend origin | Storefront smoke, API wiring proof, payment return URLs, and MapTiler domain decision | Public staging frontend origin only, no secrets. |
| MongoDB isolation/provider evidence | `/api/ready`, MongoDB connection evidence, backup status, and restore drill | Provider label, staging boundary label, and isolation summary without connection strings or account ids. |
| Stripe test-mode endpoint/dashboard evidence | Webhook delivery status, event selection, and Stripe alert proof | Test-mode endpoint status and delivery summary without signing secret or account ids. |
| Selected host/log provider | Backend structured log routing, uptime/readiness alerts, deployment event capture, and 5xx evidence | Provider label and safe log capture location, not private dashboard URLs. |
| Notification path | Alert routing and incident escalation | Channel or tool label only, not secret webhook URLs. |
| MapTiler decision | Frontend public config and map behavior evidence | Either domain-restricted public key decision or fallback-only approval without exposing key value. |

## No-Secret Evidence Policy

Do not commit dashboard IDs, account IDs, private dashboard URLs, screenshots with secrets, MongoDB connection strings, API keys, Stripe secret keys, webhook signing secrets, bearer tokens, raw webhook payloads, raw PII, full request bodies, host secret-store values, or backup artifacts.

Allowed source-controlled evidence is limited to provider labels, public staging origins when safe, event names, request ids from local tests, redacted status summaries, command names, and pass/blocked/pending/failed status rows.
