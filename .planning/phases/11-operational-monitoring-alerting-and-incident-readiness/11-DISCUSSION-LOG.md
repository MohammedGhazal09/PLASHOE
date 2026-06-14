# Phase 11: operational-monitoring-alerting-and-incident-readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 11-operational-monitoring-alerting-and-incident-readiness
**Areas discussed:** Artifact shape and provider evidence, Webhook operational logging, Alerting and severity, Incident and rollback runbook, Backup access and verification

---

## Artifact Shape and Provider Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Phase-only artifacts | Keep Phase 11 output only under `.planning/phases/11-*`. | |
| Durable docs | Write only durable operator docs under `docs/`. | |
| Both phase proof and durable docs | Keep auditable phase evidence and durable operator-facing docs. | selected |

**User's choice:** Approved recommendation.
**Notes:** Phase proof stays auditable while operators get stable docs outside `.planning`.

| Option | Description | Selected |
|--------|-------------|----------|
| Fully provider-neutral | Avoid naming provider surfaces or evidence shape. | |
| Host-native provider | Use host-native logs/alerts plus MongoDB and Stripe native dashboards. | selected |
| New APM/logging tool | Add a dedicated observability vendor/tooling layer. | |

**User's choice:** Approved recommendation.
**Notes:** Phase 9 has not selected staging providers; broad APM is out of scope.

| Option | Description | Selected |
|--------|-------------|----------|
| Omit unavailable evidence | Do not include evidence rows that cannot be collected yet. | |
| Mark pending | Leave unavailable evidence as generic pending work. | |
| Mark blocked with exact missing input | Identify the Phase 9 blocker for each unavailable live-provider row. | selected |

**User's choice:** Approved recommendation.
**Notes:** Prevents fabricated evidence and keeps Phase 9 blockers explicit.

---

## Webhook Operational Logging

| Option | Description | Selected |
|--------|-------------|----------|
| Inline logger calls | Add direct logger calls at each webhook branch. | |
| Helper in controller | Add a small local helper in `Backend/controllers/webhookController.js`. | selected |
| New logging abstraction | Add a broader shared operational logging abstraction. | |

**User's choice:** Approved recommendation.
**Notes:** The local helper keeps scope tight and reuses the existing structured logger.

| Option | Description | Selected |
|--------|-------------|----------|
| Only failures | Log only webhook failures. | |
| All required outcomes | Log invalid signature, duplicate, accepted, and processing failure outcomes. | selected |
| Verbose per-handler events | Log every internal payment transition branch. | |

**User's choice:** Approved recommendation.
**Notes:** Covers the spec without creating avoidable log noise.

| Option | Description | Selected |
|--------|-------------|----------|
| No log | Return 400 without an operational log. | |
| RequestId only | Log only the request id. | |
| RequestId plus signaturePresent | Log request id and whether a signature header was present. | selected |

**User's choice:** Approved recommendation.
**Notes:** Signature presence is operationally useful while the signature value and payload remain forbidden.

| Option | Description | Selected |
|--------|-------------|----------|
| Static rg only | Verify only by searching for forbidden raw console patterns. | |
| Focused tests only | Verify only through webhook test assertions. | |
| Focused tests plus static check | Add focused webhook logging tests and static no-raw-console check. | selected |

**User's choice:** Approved recommendation.
**Notes:** Existing webhook tests are the right target; static checks guard the specific regression.

---

## Alerting and Severity

| Option | Description | Selected |
|--------|-------------|----------|
| Exact numeric SLOs | Define exact traffic/error SLOs before baseline traffic exists. | |
| Threshold patterns | Define actionable patterns without fabricated traffic numbers. | selected |
| Vague guidance | Describe alerts without concrete trigger shape. | |

**User's choice:** Approved recommendation.
**Notes:** Unknown traffic volume makes exact SLO numbers unreliable for this phase.

| Option | Description | Selected |
|--------|-------------|----------|
| Critical/warning | Use a two-level severity model. | |
| SEV1-SEV4 | Use a four-level incident severity model with timing guidance. | selected |
| No severity model | Leave severity to operator judgment only. | |

**User's choice:** Approved recommendation.
**Notes:** SEV1-SEV4 gives enough response clarity without overfitting to a specific provider.

| Option | Description | Selected |
|--------|-------------|----------|
| Named people | Put specific humans in source-controlled docs. | |
| Role placeholders | Use Primary Operator, Backup Operator, Business Owner, and Provider Admin roles. | selected |
| No owners | Avoid assigning ownership. | |

**User's choice:** Approved recommendation.
**Notes:** Role placeholders avoid stale personal data while satisfying the ownership requirement.

---

## Incident and Rollback Runbook

| Option | Description | Selected |
|--------|-------------|----------|
| One consolidated runbook | Create one durable incident response doc with scenario sections. | selected |
| Separate runbook per scenario | Create a separate runbook for every incident type. | |
| Only deployment rollback notes | Extend deployment docs only. | |

**User's choice:** Approved recommendation.
**Notes:** One consolidated runbook gives operators a single entry point and avoids doc sprawl.

| Option | Description | Selected |
|--------|-------------|----------|
| Invent examples | Add provider-specific rollback command examples before provider selection. | |
| Leave blank | Leave rollback commands empty until Phase 12. | |
| Required-before-Phase-12 placeholders | Mark host rollback commands and dashboard links as required before cutover. | selected |

**User's choice:** Approved recommendation.
**Notes:** Provider-specific commands cannot be truthful until providers exist.

---

## Backup Access and Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Document only | Write backup docs without drill status. | |
| Require real restore now | Block the whole phase until provider access exists. | |
| Document plus blocked drill evidence | Document provider-managed restore and mark the actual drill blocked until access exists. | selected |

**User's choice:** Approved recommendation.
**Notes:** Phase 11 can prepare the procedure while keeping live restore proof honest.

| Option | Description | Selected |
|--------|-------------|----------|
| Only backend host | List only backend host/log access. | |
| Core providers only | List backend, MongoDB, and Stripe. | |
| All operational surfaces | Include backend host/logs, frontend host, MongoDB, Stripe, MapTiler/public config, GitHub Actions, and secret/config stores. | selected |

**User's choice:** Approved recommendation.
**Notes:** All listed surfaces can block launch operations or incident response.

| Option | Description | Selected |
|--------|-------------|----------|
| Docs-only review | Verify only by reading docs. | |
| Focused backend checks | Run focused backend checks only. | |
| Focused backend checks plus docs/artifact scans | Run focused webhook/logging tests, full backend tests when backend changes, static artifact checks, and secret scans. | selected |

**User's choice:** Approved recommendation.
**Notes:** Phase 11 changes backend logging and docs, so verification should match that risk surface.

---

## the agent's Discretion

- The planner may choose exact Phase 11 local evidence artifact filenames, with `11-OPERATIONS-EVIDENCE.md` and `11-VERIFICATION.md` preferred.
- The planner may choose exact table layouts for operations evidence, alerts, access, dashboard/checklist, and backup/restore drill status.
- The planner may choose exact helper names in the webhook controller as long as scope stays small and tests cover behavior.
- The planner may choose exact static `rg` checks for no-secret/no-raw-console/no-missing-section verification.

## Deferred Ideas

- Production cutover, production deploy, release tagging, pushing, live traffic switch, and post-launch review remain Phase 12.
- External hosting provider setup, staging origins, MongoDB provider account/configuration, Stripe dashboard endpoint setup, and MapTiler dashboard restriction remain Phase 9.
- Full APM migration, OpenTelemetry tracing, self-hosted Prometheus/Grafana, custom metrics infrastructure, and broad observability platform work remain deferred.
- Frontend features, storefront visual changes, wishlist/reviews, and admin product/coupon UI expansion remain outside Phase 11.
