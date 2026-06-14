# Phase 11: Operational Monitoring Alerting and Incident Readiness - Specification

**Created:** 2026-06-14
**Ambiguity score:** 0.11 (gate: <= 0.20)
**Requirements:** 8 locked

## Goal

PLASHOE changes from having local structured logs, health/readiness endpoints, and deployment guidance into having a documented and verifiable operational readiness layer covering live log routing, actionable alerts, MongoDB backup/restore proof, and incident/rollback procedures.

## Background

Phase 08 added backend structured JSON logging in `Backend/utils/logger.js`, request correlation in `Backend/middleware/requestContext.js`, sanitized readiness in `Backend/utils/readiness.js`, startup/database logs in `Backend/server.js` and `Backend/config/db.js`, and deployment guidance in `docs/DEPLOYMENT.md`. Phase 10 removed frontend tooling warning noise and tightened the audit policy. Phase 09 remains blocked on external staging backend/frontend origins, MongoDB isolation proof, Stripe test-mode dashboard setup, and MapTiler/public-config decisions.

Phase 11 therefore must not pretend live infrastructure exists. It must produce source/doc/runbook artifacts and evidence tables that are ready for the selected host/logging provider, while allowing external rows to remain explicitly blocked when Phase 09 staging inputs are still unavailable. One current code gap is that Stripe webhook processing failures still use raw `console.error(error?.stack || error)` in `Backend/controllers/webhookController.js`; Phase 11 should make webhook operational signals structured and redacted like the rest of the backend logging surface.

## Requirements

1. **Operations stack selection and evidence shape**: Phase 11 records a minimal operations stack based on host-native logs/alerts plus MongoDB and Stripe native dashboards, with placeholders for provider-specific links only where the actual provider is not yet known.
   - Current: Phase 09 has no staging backend/frontend origins or provider evidence; Phase 08 docs are platform-neutral and do not name a live logging or alerting target.
   - Target: A Phase 11 operations evidence artifact identifies the intended log source, uptime/readiness monitor source, MongoDB backup/monitoring source, Stripe webhook source, deploy-event source, and the status of each evidence row as passed, blocked, pending, or failed.
   - Acceptance: The artifact exists, references no fabricated dashboard URLs or secret values, and has explicit blocked rows for any live-provider evidence that cannot be collected because Phase 09 staging inputs are still unavailable.

2. **Structured Stripe webhook operational events**: Stripe webhook accepted, duplicate, invalid-signature, and processing-failure paths emit safe structured operational events.
   - Current: The backend has a redacting structured logger, but webhook processing failures still call `console.error(error?.stack || error)` and accepted/duplicate/invalid-signature webhook outcomes have no structured operational event.
   - Target: Webhook operational outcomes are logged with event names, request id when available, Stripe event id/type when safely available, processing status, and serialized/redacted error data; raw webhook payloads, signatures, secrets, stack traces, full request bodies, and PII are not logged.
   - Acceptance: Focused backend tests or static checks prove webhook failure logging uses the structured logger, no raw `console.error(error?.stack || error)` remains in the webhook controller, and redaction coverage still protects webhook payloads/secrets.

3. **Runtime signal routing checklist**: Backend logs, `/api/health`, `/api/ready`, Stripe webhook outcomes, and deployment events have a documented route to the selected host/logging provider.
   - Current: Logs are emitted to stdout/stderr and health/readiness endpoints exist, but there is no source-controlled proof that the host captures those logs or that deployment events are connected to release evidence.
   - Target: The Phase 11 evidence artifact defines how each runtime signal is captured, where an operator checks it, what healthy looks like, and what exact evidence is required before Phase 12 production cutover.
   - Acceptance: Evidence rows cover backend structured logs, health checks, readiness checks, Stripe webhook outcomes, MongoDB connectivity state, and deployment events, with pass/fail or blocked status and no secret-bearing output.

4. **Actionable alert catalog**: Phase 11 defines low-noise alert requirements for backend downtime, readiness failure, sustained 5xx errors, Stripe webhook delivery/processing failures, database connectivity issues, and checkout-start/payment-path degradation.
   - Current: `docs/DEPLOYMENT.md` lists rollback criteria and 5/15/60 minute monitoring windows, but no alert catalog, thresholds, owners, or notification paths exist.
   - Target: A documented alert catalog lists every required alert, the signal source, owner role, severity, notification path, threshold pattern, first response action, and false-positive/noise guidance.
   - Acceptance: The alert catalog includes all required failure modes, uses threshold patterns instead of fabricated traffic-specific numbers, assigns Primary Operator, Backup Operator, and Business Owner roles, and rejects broad metrics that nobody is expected to review.

5. **Minimal operational dashboard/checklist**: Operators have one minimal operational dashboard/checklist covering health, readiness, 5xx behavior, webhook failures, MongoDB state, and backup status.
   - Current: No dashboard artifact or operator checklist exists beyond deployment smoke checks and monitoring windows.
   - Target: A minimal dashboard/checklist document tells an operator where to check each production signal and what healthy, degraded, and rollback-triggering states look like.
   - Acceptance: The checklist covers the six required signal areas, links to provider locations only when real safe links are available, uses placeholders marked required-before-Phase-12 otherwise, and does not introduce a broad APM/dashboard suite.

6. **MongoDB backup and restore verification**: MongoDB backup/restore readiness is documented around provider-managed backups and an actual restore drill to a disposable staging database.
   - Current: `MONGO_URI` is required and readiness reports MongoDB connected/disconnected state, but no backup schedule, access procedure, restore proof, or drill artifact exists.
   - Target: Phase 11 documents the backup source, backup frequency/status evidence shape, restore target requirements, disposable restore drill steps, validation checks, and operational access required to perform restore.
   - Acceptance: The restore procedure requires a real provider-managed restore to a staging/disposable database when external access exists; if access is unavailable, the evidence row is blocked with the exact missing provider/input; no production connection string or backup artifact secret is committed.

7. **Operational access matrix**: Phase 11 documents who can access hosting logs, alert configuration, MongoDB backups/restores, Stripe webhook dashboards, frontend host configuration, and secret stores.
   - Current: External setup docs list required providers and variables, but no access matrix defines operational roles or least-privilege expectations.
   - Target: An access matrix records Primary Operator, Backup Operator, Business Owner, and optional Provider Admin responsibilities for every operational surface without naming secrets or embedding account ids.
   - Acceptance: The matrix covers backend host/logs, frontend host, MongoDB provider, Stripe dashboard, MapTiler/public map setting if applicable, GitHub Actions, and secret/config stores, and every row has an owner role plus least-privilege note.

8. **Incident and rollback runbook**: Phase 11 creates one incident-response and rollback runbook with scenario sections for API down, MongoDB not ready, Stripe webhook failures, checkout/payment degradation, and noisy or missing alerts.
   - Current: `docs/DEPLOYMENT.md` has rollback criteria and 5/15/60 minute monitoring windows, but no incident command structure, owner roles, communication cadence, scenario steps, or host-specific command placeholders.
   - Target: The runbook includes severity levels, owners, first 5/15/60 minute checks, communication steps, decision thresholds, rollback triggers, rollback verification, and required host-specific command slots to fill before Phase 12.
   - Acceptance: The runbook is executable as a platform-neutral procedure without fabricated commands; it marks host-specific rollback commands as required-before-Phase-12, includes measurable rejection/rollback triggers, and reuses existing health/readiness/payment/admin smoke checks for verification.

## Boundaries

**In scope:**
- Phase 11 SPEC, discussion, plan, execution, verification, and review artifacts for operational monitoring/readiness.
- Focused backend logging changes only where needed to make Stripe webhook operational outcomes structured and redacted.
- Evidence artifacts for log routing, alert catalog, dashboard/checklist, deployment events, MongoDB backup/restore status, and operational access.
- One incident-response and rollback runbook with scenario sections and 5/15/60 minute checks.
- Secret scans and focused tests/static checks for any logging or documentation changes.
- Explicit blocked external evidence rows where Phase 09 staging/provider inputs are still unavailable.

**Out of scope:**
- Production cutover, production deploy, release tagging, pushing, or live traffic switch - Phase 12 owns cutover and requires explicit user approval.
- Creating or selecting the actual hosting providers, staging origins, Stripe dashboard setup, MongoDB provider account, or MapTiler restriction - Phase 09 owns external setup.
- Full APM migration, self-hosted Prometheus/Grafana, OpenTelemetry tracing, custom metrics infrastructure, or broad observability platform build-out - too large and provider-dependent for this phase.
- Frontend feature work, storefront visual changes, wishlist/reviews, admin product/coupon UI, or new customer-facing functionality - v2 or separate phases own those.
- Committing real `.env` files, account ids, dashboard exports, screenshots with secrets, MongoDB URIs, API keys, webhook secrets, bearer tokens, raw webhook payloads, or raw PII.

## Constraints

- Do all work inline and do not use subagents.
- Prefer host-native logging/alerts and provider-native MongoDB/Stripe dashboards until the actual hosting stack is known.
- Alerts must be actionable and low-noise; threshold patterns are acceptable where traffic volume is unknown, but every alert must have a response action and owner role.
- Logs, alert payloads, evidence, and runbooks must not expose bearer tokens, Stripe secrets, webhook payloads, passwords, MongoDB URIs, raw PII, full request bodies, or stack traces.
- Provider-specific dashboard URLs, rollback commands, account ids, and access paths must either trace to real supplied evidence or be marked as assumptions/placeholders required before Phase 12.
- MongoDB restore verification must target staging/disposable data, never production data.
- External live evidence may remain blocked when Phase 09 staging/provider setup is absent, but every blocked row must name the exact missing input.

## Acceptance Criteria

- [ ] Phase 11 records the operations stack/evidence shape for host-native logs/alerts plus MongoDB and Stripe native dashboards, with no fabricated provider links.
- [ ] Stripe webhook accepted, duplicate, invalid-signature, and processing-failure paths produce safe structured operational events or equivalent verifiable logging coverage.
- [ ] No raw webhook payload, Stripe signature, Stripe secret, MongoDB URI, bearer token, password, raw PII, full request body, or stack trace appears in source-controlled logs/docs/evidence.
- [ ] Runtime signal evidence rows cover backend logs, `/api/health`, `/api/ready`, Stripe webhook outcomes, MongoDB connectivity state, and deployment events.
- [ ] Alert catalog covers backend downtime, readiness failure, sustained 5xx, Stripe webhook failures, database connectivity, and checkout-start/payment-path degradation.
- [ ] Every alert has owner role, severity, notification path or required-provider placeholder, threshold pattern, and first response action.
- [ ] Minimal operational dashboard/checklist covers health, readiness, 5xx behavior, webhook failures, MongoDB state, and backup status.
- [ ] MongoDB backup/restore documentation requires provider-managed backups and a restore drill to a disposable staging database, with blocked evidence rows when provider access is unavailable.
- [ ] Operational access matrix covers backend host/logs, frontend host, MongoDB provider, Stripe dashboard, MapTiler/public map decision if applicable, GitHub Actions, and secret/config stores.
- [ ] Incident/rollback runbook includes severity levels, Primary Operator/Backup Operator/Business Owner roles, communication steps, decision thresholds, first 5/15/60 minute checks, rollback triggers, and rollback verification.
- [ ] Phase 11 verification includes focused backend tests or static checks for logging changes, full backend tests if backend source changes, and secret-pattern scans over Phase 11 artifacts/docs.
- [ ] Phase 11 verification marks live-provider evidence as passed only when real safe evidence exists; otherwise it remains blocked with the exact missing Phase 09 input.

## Ambiguity Report

| Dimension          | Score | Min   | Status | Notes |
|--------------------|-------|-------|--------|-------|
| Goal Clarity       | 0.90  | 0.75  | met    | Approved goal locks operational readiness, not production cutover. |
| Boundary Clarity   | 0.92  | 0.70  | met    | External setup and production release are explicitly out of scope. |
| Constraint Clarity | 0.83  | 0.65  | met    | Low-noise, no-secret, provider-neutral, and blocked-evidence rules are locked. |
| Acceptance Criteria| 0.88  | 0.70  | met    | Pass/fail checks cover MON-01 through MON-04 and verifier rejection cases. |
| **Ambiguity**      | 0.11  | <=0.20| met    | Gate passed after user approved all recommendations. |

Status: met = dimension meets minimum.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | Which operations stack should Phase 11 target? | Use host-native logs/alerts plus MongoDB/Stripe native dashboards first. |
| 1 | Researcher | Can Phase 11 pass without live staging origins? | Allow partial pass with blocked external evidence rows naming missing Phase 09 inputs. |
| 1 | Researcher | What deliverable shape is needed? | Produce docs/runbooks plus focused source logging fixes. |
| 1 | Researcher | Should webhook operational logs be structured? | Log accepted, duplicate, invalid-signature, and processing-failure outcomes safely. |
| 2 | Simplifier | What minimum alerts are required? | Roadmap alerts plus checkout-start/payment-path degradation visibility. |
| 2 | Simplifier | Should thresholds be fixed now? | Use threshold patterns, not fabricated provider/traffic-specific numbers. |
| 2 | Simplifier | Who owns alerts/incidents? | Use Primary Operator, Backup Operator, and Business Owner roles. |
| 3 | Boundary Keeper | What incident runbook shape is required? | One runbook with scenario sections for API, MongoDB, Stripe, checkout, and alert issues. |
| 3 | Boundary Keeper | What rollback detail is required? | Platform-neutral procedure now; host-specific command slots required before Phase 12. |
| 3 | Boundary Keeper | How are deployment events captured? | Use CI/deploy provider evidence plus startup logs; record in evidence table. |
| 4 | Failure Analyst | What MongoDB backup strategy is required? | Provider-managed backups plus documented restore drill to disposable staging DB. |
| 4 | Failure Analyst | What restore test is enough? | Actual restore to staging/disposable DB with redacted evidence when access exists. |
| 4 | Failure Analyst | What access procedures are required? | Full operational access matrix with role ownership and least-privilege notes. |
| 5 | Seed Closer | Are dashboards required? | One minimal dashboard/checklist, not a broad observability suite. |
| 5 | Seed Closer | What data is forbidden in logs/alerts/evidence? | Ban bearer tokens, Stripe secrets, webhook payloads, passwords, MongoDB URIs, raw PII, and full request bodies. |
| 5 | Seed Closer | What verification commands are required? | Focused logging checks/tests, full backend tests if source changes, and secret scans. |
| 6 | Seed Closer | What is explicitly out of scope? | Production cutover, new hosting setup, full APM migration, and frontend feature work. |
| 6 | Seed Closer | What makes verification fail? | Missing live evidence without blockers, noisy alerts, secrets in artifacts, untested restore, or no owners/escalation path. |

---

*Phase: 11-operational-monitoring-alerting-and-incident-readiness*
*Spec created: 2026-06-14*
*Next step: $gsd-discuss-phase 11 - implementation decisions (how to build what's specified above)*
