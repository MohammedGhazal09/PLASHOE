# Operations

This guide defines PLASHOE operational readiness practices for logs, checks, alerts, access, and incident preparation. It is not proof that a live deployment exists. Live provider proof stays blocked until Phase 09 supplies staging origins, provider labels, dashboard evidence, notification paths, and safe public configuration decisions.

## Operations Stack Decision

Use the smallest provider-native stack that can operate the store:

- Backend host native logs and alerts for stdout/stderr JSON logs, uptime checks, readiness checks, deploy events, and 5xx behavior.
- MongoDB provider dashboard for connectivity, backup status, and restore evidence.
- Stripe dashboard for test-mode webhook endpoint delivery and webhook failure inspection.
- GitHub Actions plus the selected host deployment history for deploy-event evidence.

Do not add a new APM, tracing, Prometheus/Grafana, or custom metrics stack for Phase 11. Revisit that only if host-native signals cannot support the alert catalog after staging evidence exists.

## Severity Model

| Severity | Meaning | Response target | Owner |
| --- | --- | --- | --- |
| SEV1 | Complete outage or payment failure affecting all users | Immediate response | Primary Operator with Business Owner informed |
| SEV2 | Major checkout, API, or payment-path degradation | Within 15 minutes | Primary Operator |
| SEV3 | Limited operational degradation affecting a subset of flows | Within 1 hour | Primary Operator or Backup Operator |
| SEV4 | Low-impact, noisy, cosmetic, or next-business-day issue | Next business day | Backup Operator or Business Owner |

## Runtime Signal Routing

| Signal | Source | Where to check | Healthy state | Degraded state | Rollback-triggering state | Evidence required before Phase 12 | Current status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backend JSON logs | `Backend/utils/logger.js` stdout/stderr records | Selected host log viewer, required-before-Phase-12 | JSON records include `timestamp`, `level`, `event`, and redacted metadata | Missing fields or logs delayed in host viewer | No backend logs visible during smoke checks | Selected host/log provider label and safe sample log capture | blocked |
| API request logs | `api-request-completed` | Host logs filtered by `requestId`, required-before-Phase-12 | API paths emit status and duration with request id | Missing request id or repeated slow/error statuses | Sustained 5xx on auth, product, cart, checkout, webhook, or admin paths | Safe request-id trace from staging smoke | blocked |
| Runtime config startup | `runtime-config-validated` | Host startup logs, required-before-Phase-12 | Startup validates runtime config and logs payments state without secrets | Config validation retries or partial startup | `runtime-config-validation-failed` prevents listener startup | Safe startup log summary | blocked |
| Server listening | `server-listening` | Host startup logs, required-before-Phase-12 | Backend starts on provider-supplied port | Startup slow or restarts repeatedly | Backend cannot keep a listener open | Safe startup log summary after deploy | blocked |
| MongoDB connected | `mongodb-connected` | Host logs and MongoDB provider status | MongoDB ready state is connected | Intermittent reconnects or slow readiness | Readiness stays not ready after startup window | Host log summary plus provider label | blocked |
| MongoDB failed | `mongodb-connection-failed` | Host logs and MongoDB provider status | No failures during stable runtime | One failure followed by recovery | Repeated failures or no successful readiness | Safe failure/recovery summary | blocked |
| MongoDB unavailable | `mongodb-unavailable` | Host logs | App explicitly records degraded database startup | Backend serves only limited behavior | Database unavailable during checkout or admin operations | Safe degraded-state log summary | blocked |
| Readiness warning | `readiness-check-failed` | Host logs and `/api/ready` monitor | No readiness failures after startup | Short startup-only failures | Sustained `503` readiness after startup window | Readiness monitor evidence | blocked |
| Backend liveness | `GET /api/health` | Uptime monitor or manual smoke check | `200` with API running payload | Intermittent non-200 or high latency | Repeated non-200 or host reports service down | Staging backend origin and health evidence | blocked |
| Backend readiness | `GET /api/ready` | Readiness monitor or manual smoke check | `200`, `ready: true`, MongoDB `connected` | `503` during expected startup only | Sustained `503` after startup window | Staging backend origin plus MongoDB isolation/provider evidence | blocked |
| Invalid Stripe signature | `stripe-webhook-invalid-signature` | Host logs and Stripe dashboard | Rare invalid signatures, no payload logged | Spike in invalid signature attempts | Repeated invalid signatures plus failed legitimate deliveries | Local proof passed; hosted proof required-before-Phase-12 | blocked |
| Duplicate Stripe event | `stripe-webhook-duplicate` | Host logs | Duplicate events are no-op success | Duplicate volume increases after retries | Duplicate retries hide underlying 5xx delivery failure | Local proof passed; hosted proof required-before-Phase-12 | blocked |
| Accepted Stripe event | `stripe-webhook-accepted` | Host logs and Stripe delivery view | Accepted events include event id/type and processed status | Missing host log while Stripe shows delivery | Accepted delivery not reflected in order state | Local proof passed; hosted proof required-before-Phase-12 | blocked |
| Stripe processing failure | `stripe-webhook-processing-failed` | Host logs and Stripe delivery view | No sustained processing failures | Single retryable failure with safe error metadata | Repeated 5xx or reconciliation failures on payment events | Local proof passed; hosted proof required-before-Phase-12 | blocked |
| Deployment events | GitHub Actions and selected host deploy history | GitHub Actions run plus host deploy activity, required-before-Phase-12 | Commit, build, deploy, startup, and smoke evidence correlate | Deploy succeeds but smoke evidence is missing | Deploy introduces rollback-triggering health/readiness/5xx behavior | Safe CI run and host deploy event summary | blocked |

## Alert Catalog

Alert thresholds are patterns because traffic baseline is not known. Do not configure broad vanity alerts without an owner and first response action.

| Alert | Signal source | Severity | Owner role | Backup role | Notification path | Threshold pattern | First response action | False-positive/noise guidance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend downtime | `/api/health` uptime monitor and host process state | SEV1 | Primary Operator | Backup Operator | required-before-Phase-12 | Consecutive failed health checks after deploy/startup window | Check host status, recent deploy, `server-listening`, and restart loop logs | Suppress during planned deploy only when deployment event is visible. |
| Readiness failure | `/api/ready` readiness monitor and `readiness-check-failed` logs | SEV2 | Primary Operator | Backup Operator | required-before-Phase-12 | Readiness remains `503` beyond expected startup or recurs during checkout/admin flows | Check MongoDB provider status, `mongodb-connection-failed`, and host env config | Ignore short startup-only readiness failures that recover before traffic. |
| Sustained 5xx behavior | Host logs filtered for 5xx and `api-request-completed` | SEV2 | Primary Operator | Backup Operator | required-before-Phase-12 | Repeated 5xx on auth, product, cart, checkout, webhook, or admin paths | Locate request ids, compare to deploy event, run health/readiness smoke | Do not page on isolated validation or user-caused 4xx errors. |
| Stripe webhook delivery failure | Stripe dashboard delivery status and backend webhook endpoint status | SEV2 | Primary Operator | Business Owner | required-before-Phase-12 | Repeated non-2xx deliveries for required payment events | Check endpoint URL, host availability, Stripe event selection, and webhook secret storage | Ignore deliberate dashboard test sends only when labeled as tests. |
| Stripe webhook processing failure | `stripe-webhook-processing-failed` and Stripe retries | SEV2 | Primary Operator | Backup Operator | required-before-Phase-12 | Repeated retryable processing failures or reconciliation errors | Check event id/type, matching order/payment state, and recent checkout changes | One unreconciled test event can be logged as non-production if clearly marked. |
| MongoDB connectivity issue | `/api/ready`, `mongodb-connection-failed`, `mongodb-unavailable`, provider status | SEV1 for checkout outage, SEV2 otherwise | Primary Operator | Provider Admin | required-before-Phase-12 | MongoDB disconnected/not ready during active traffic or after deploy | Check provider status, access boundary, connection config presence, and backup status | Suppress local-only development disconnects outside hosted staging/production. |
| Checkout-start/payment-path degradation | Checkout API 5xx/409 patterns, Stripe session creation, payment return routes | SEV1 if all checkout fails, SEV2 otherwise | Primary Operator | Business Owner | required-before-Phase-12 | Checkout cannot start, payment returns break, or paid orders do not move to processing | Run cart/checkout smoke, check Stripe session/webhook delivery, inspect order payment state | Separate expected stock/coupon conflicts from payment-path failures. |

## Minimal Dashboard Checklist

Use one small operator view or checklist. Until providers are selected, each check location is required-before-Phase-12.

| Area | Check location | Healthy state | Degraded state | Rollback trigger | Evidence status |
| --- | --- | --- | --- | --- | --- |
| Health | `/api/health` monitor | `200` and host process stable | Intermittent non-200 | Repeated failures after deploy | blocked |
| Readiness | `/api/ready` monitor plus readiness logs | `ready: true`, MongoDB connected | Startup-only `503` that recovers | Sustained `503` or MongoDB disconnected | blocked |
| 5xx behavior | Host logs or request summary filtered by status | No sustained 5xx on critical paths | Isolated retriable failure | Sustained 5xx on checkout, webhook, or admin flows | blocked |
| Webhook failures | Host logs plus Stripe test-mode delivery view | Accepted events and no sustained processing failures | Single retryable test failure | Repeated non-2xx or processing failures | blocked |
| MongoDB state | MongoDB provider dashboard plus readiness | Provider healthy and readiness connected | Provider warning or reconnects | Provider outage or readiness not ready | blocked |
| Backup status | MongoDB provider backup view | Managed backups enabled and recent | Backup delayed or evidence missing | No recent backup before release/cutover | blocked |
| Deployment events | GitHub Actions plus host deploy history | CI/deploy/startup/smoke correlate to commit | Deploy missing smoke proof | Deploy correlates with health/readiness/5xx regression | blocked |
| Checkout/payment path | Checkout smoke, payment return routes, Stripe dashboard | Checkout starts, return routes render, webhook updates order | Non-critical checkout warning | Checkout start or webhook path fails for real orders | blocked |

## MongoDB Backup and Restore

MongoDB backup and restore readiness must use provider-managed backups. Do not add ad hoc dump files, exported backup artifacts, production connection strings, account ids, or secret-bearing screenshots to the repository.

### Backup Evidence Shape

| Evidence item | Required safe evidence | Current status | Blocker |
| --- | --- | --- | --- |
| Provider label | Redacted MongoDB provider name, such as provider product label only | blocked | Missing Phase 09 MongoDB isolation/provider evidence. |
| Backup schedule/status | Provider-managed backup frequency and most recent successful backup status, recorded without private dashboard URLs | blocked | Missing MongoDB provider dashboard access and safe backup status summary. |
| Retention policy | Provider retention setting or required-before-Phase-12 placeholder | blocked | Missing provider-managed backup configuration evidence. |
| Restore permissions | Role with least-privilege restore access for Primary Operator or Provider Admin | blocked | Missing operational access proof. |

### Disposable Staging Restore Target

The restore drill target must be a disposable staging database, cluster, project, or credential boundary. It must never be production data and must never reuse production connection strings.

Required before the drill:

1. Record a safe provider label and disposable staging restore target label.
2. Confirm the target is isolated from production data and production credentials.
3. Point a staged backend environment at the restored target through the host secret manager only.
4. Keep all connection strings, backup artifacts, account ids, and screenshots with secrets outside source control.

### Restore Drill Procedure

1. In the MongoDB provider dashboard, start a provider-managed restore from the selected backup into the disposable staging target.
2. Configure the staging backend host to use the restored target through its secret/config manager.
3. Restart or redeploy the staging backend.
4. Verify hosted `GET /api/ready` returns `ready: true` and MongoDB state `connected`.
5. Run safe read-only smoke checks: `GET /api/health`, public product browsing, current-user auth check with a disposable staging account, and admin order read only if an admin staging account exists.
6. Record only redacted result summaries in this document or the Phase 11 evidence ledger.
7. Remove or archive the disposable restore target when the drill is complete according to provider policy.

### Backup and Restore Evidence

| Row | Evidence source | Healthy state | Current status | Blocker notes |
| --- | --- | --- | --- | --- |
| Provider-managed backup source | MongoDB provider dashboard | Backups enabled for staging/production-equivalent database | blocked | Missing MongoDB provider label and dashboard access. |
| Backup schedule/status | MongoDB provider dashboard | Recent successful backup and retention policy recorded safely | blocked | Missing backup schedule/status evidence. |
| Disposable restore target | MongoDB provider dashboard and staging host config | Restore target is isolated from production data and credentials | blocked | Missing disposable staging restore target. |
| Restore drill procedure source | This `MongoDB Backup and Restore` section | Procedure exists and forbids production targets and committed secrets | passed | Local docs evidence only. |
| `/api/ready` after restore | Hosted staging backend | `ready: true`, MongoDB `connected` | blocked | Missing staging backend origin and restored staging target. |
| Read-only smoke after restore | Hosted staging backend/frontend | Health, product browsing, and safe auth/admin reads succeed | blocked | Missing staging origins and disposable staging account/setup. |

## Operational Access Matrix

Use role placeholders only. Do not write account ids, dashboard ids, secret values, private dashboard links, or provider-internal URLs in source-controlled docs.

| Operational surface | Owner role | Backup role | Least-privilege note | Evidence required before Phase 12 | Current status | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| Backend host/logs | Primary Operator | Backup Operator | Read logs, configure service, view deploy events; write/deploy permission only for approved release operators | Provider label, access confirmed, host log location label | blocked | Missing selected backend host/log provider and staging backend origin. |
| Frontend host | Primary Operator | Backup Operator | Configure static build env and view deploy status; no backend secrets | Provider label, frontend origin, build config access confirmed | blocked | Missing staging frontend origin and frontend host provider. |
| MongoDB provider backups/restores | Primary Operator | Provider Admin | Backup/restore permission only for restore drill operators; read-only monitoring for responders | Provider label, staging boundary, backup status, restore target label | blocked | Missing MongoDB isolation/provider evidence and disposable staging restore target. |
| Stripe dashboard/webhooks | Primary Operator | Business Owner | Test-mode webhook management and delivery view; no secret values copied into docs | Test-mode endpoint status and event delivery summary | blocked | Missing Stripe test-mode endpoint/dashboard evidence. |
| MapTiler/public map configuration | Business Owner | Backup Operator | Public browser key management only; key must be domain-restricted or fallback-only approved | Domain restriction decision or fallback-only approval | blocked | Missing MapTiler decision. |
| GitHub Actions | Primary Operator | Backup Operator | Read CI results; workflow write access limited to maintainers | Passing run label and deployment-event source | blocked | Remote CI/deploy proof not recorded for Phase 11. |
| Backend secret/config store | Primary Operator | Provider Admin | Store backend-only values in host secret manager; never expose to frontend or docs | Secret presence checklist without values | blocked | Missing selected backend host and secret-store proof. |
| Frontend build config store | Primary Operator | Business Owner | Public `REACT_APP_*` values only; rebuild after changes | Build env checklist and staging API URL proof | blocked | Missing staging frontend/backend origins and public config decisions. |
| Notification/incident channel | Primary Operator | Backup Operator | Incident notifications may use a channel label; never commit secret webhook URLs | Channel/tool label and escalation owner | blocked | Missing notification path. |

## Rejected Metrics

Do not alert on broad page views, raw request count, average latency without a response action, generic CPU/memory noise without host context, or dashboard panels nobody is assigned to review. Add a metric only when it maps to an owner, severity, first response action, and rollback or escalation decision.
