# Phase 11: Operational Monitoring Alerting and Incident Readiness - Research

**Researched:** 2026-06-14
**Phase:** 11-operational-monitoring-alerting-and-incident-readiness
**Requirements:** MON-01, MON-02, MON-03, MON-04
**Mode:** Inline research; no subagents

## Research Question

What do we need to know to plan Phase 11 well?

## Sources Read

- `.planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-SPEC.md`
- `.planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-USER-SETUP.md`
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-VERIFICATION.md`
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-VERIFICATION.md`
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-USER-SETUP.md`
- `docs/DEPLOYMENT.md`
- `docs/CONFIGURATION.md`
- `docs/API.md`
- `Backend/utils/logger.js`
- `Backend/utils/readiness.js`
- `Backend/app.js`
- `Backend/server.js`
- `Backend/config/db.js`
- `Backend/middleware/requestContext.js`
- `Backend/middleware/security.js`
- `Backend/controllers/webhookController.js`
- `Backend/models/PaymentEvent.js`
- `Backend/test/payment-webhook.test.js`
- `Backend/test/security-middleware.test.js`
- `Backend/test/app.test.js`
- `.github/workflows/ci.yml`
- Skills used as guidance: `find-skills`, `incident-response`, `runbook`, `observability-engineer`, `devops-engineer`, `mongodb`, `secret-scanning`, and `api-testing`.

## Current State Findings

1. Phase 8 already created a usable operational baseline: JSON structured logs, redaction, request ids, `/api/health`, `/api/ready`, MongoDB readiness state, startup logs, deployment smoke checks, rollback criteria, and 5/15/60 minute monitoring windows.
2. Phase 9 is still blocked on external staging inputs: backend origin, frontend origin, MongoDB isolation proof, Stripe test-mode endpoint/evidence, hosted smoke proof, and MapTiler decision. Phase 11 cannot mark live provider evidence passed without those inputs.
3. The main source-code gap is in `Backend/controllers/webhookController.js`: the processing-failure path still uses `console.error(error?.stack || error)`, and accepted, duplicate, and invalid-signature outcomes do not emit dedicated structured operational events.
4. `Backend/utils/logger.js` already provides `logInfo`, `logWarn`, `logError`, `serializeError`, and redaction of authorization, password, secret, token, JWT, Stripe, webhook, Mongo URI, raw body, payload, and request-body keys. Phase 11 should reuse this instead of introducing a logging dependency.
5. `Backend/test/payment-webhook.test.js` already gives a focused Supertest surface for invalid signatures, accepted events, duplicates, retryable processing failures, and persisted `PaymentEvent` status. It is the right place for operational log assertions.
6. `Backend/test/security-middleware.test.js` already proves redaction and `serializeError` behavior without stacks. Phase 11 can rely on that test and add webhook-specific assertions instead of duplicating the whole redaction suite.
7. `docs/DEPLOYMENT.md` already has the smoke checks and rollback criteria the incident runbook should reuse. Phase 11 should not invent a separate verification model.

## Planning Implications

### Webhook Structured Logging

Plan the code change as a narrow backend task:

- Import `logInfo`, `logWarn`, `logError`, and `serializeError` into `Backend/controllers/webhookController.js`.
- Add a small local helper for safe webhook metadata.
- Emit exactly these events:
  - `stripe-webhook-invalid-signature`
  - `stripe-webhook-duplicate`
  - `stripe-webhook-accepted`
  - `stripe-webhook-processing-failed`
- Include only safe fields: `requestId`, `eventId`, `eventType`, `status`, `duplicate`, `signaturePresent`, and serialized/redacted `error`.
- Remove the raw `console.error(error?.stack || error)` call.

Recommendation: keep helper functions in the controller for now. A shared logging module would be premature because this phase has one webhook-specific logging need.

### Operations Evidence Shape

Phase 11 needs both phase-local proof and durable operator docs:

- `.planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-OPERATIONS-EVIDENCE.md`
- `.planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-VERIFICATION.md`
- `docs/OPERATIONS.md`
- `docs/INCIDENT-RESPONSE.md`

Evidence tables should use `passed`, `blocked`, `pending`, and `failed`. Provider-specific live proof should stay `blocked` until Phase 9 supplies the missing origin/provider/dashboard evidence.

Recommendation: use `11-OPERATIONS-EVIDENCE.md` as the phase proof ledger and `docs/OPERATIONS.md` as the durable operator reference. This avoids making the durable docs look like live evidence when the live evidence is still blocked.

### Alert Catalog

The alert catalog should favor threshold patterns because traffic baseline is unknown. Required alert families:

- Backend downtime
- Readiness failure
- Sustained 5xx errors
- Stripe webhook delivery or processing failures
- MongoDB connectivity issues
- Checkout-start/payment-path degradation

Every alert row needs a signal source, severity, owner role, notification path or required-provider placeholder, threshold pattern, first response action, and false-positive/noise guidance.

Recommendation: use SEV1-SEV4 from the approved context and avoid exact numeric traffic thresholds until live staging/production volume exists.

### MongoDB Backup and Restore

The codebase uses Mongoose and `MONGO_URI`; no provider is selected in source. The restore procedure must therefore be provider-managed and evidence-based:

- Record provider-managed backup source and schedule/status evidence shape.
- Require a disposable staging restore target.
- Validate restored `/api/ready` and safe read-only smoke checks.
- Keep the actual restore drill blocked until MongoDB provider access and staging/disposable target exist.
- Never commit connection strings, backup artifacts, account IDs, or screenshots with secrets.

Recommendation: document a provider-neutral restore drill now, with exact evidence rows for the missing provider inputs. Do not add scripts or dump/restore commands without knowing the selected provider.

### Incident and Rollback Runbook

The runbook should be one consolidated durable document with scenario sections:

- API down
- MongoDB not ready
- Stripe webhook failures
- Checkout/payment degradation
- Noisy or missing alerts

It should include incident command roles, severity levels, communication cadence, first 5/15/60 minute checks, rollback triggers, rollback verification, escalation, and post-incident notes.

Recommendation: leave host-specific rollback commands as `required-before-Phase-12` slots. Fabricated commands would be worse than placeholders because provider choice is still unknown.

## Validation Architecture

Phase 11 validation should sample both source behavior and documentation/evidence completeness.

### Automated Checks

- Focused webhook tests:
  - `cd Backend; npm test -- --run Backend/test/payment-webhook.test.js`
  - If the runner does not accept the path form, use `cd Backend; npx vitest run test/payment-webhook.test.js`
- Full backend suite after backend source changes:
  - `cd Backend; npm test`
- Static raw-console removal check:
  - `rg -n "console\\.error\\(error\\?\\.stack \\|\\| error\\)" Backend/controllers/webhookController.js`
  - This must return no matches.
- Required artifact/section checks:
  - `rg -n "Operations Evidence|Runtime Signal Routing|Alert Catalog|Dashboard Checklist|Backup and Restore|Access Matrix|Incident Response|Rollback" .planning/phases/11-operational-monitoring-alerting-and-incident-readiness docs/OPERATIONS.md docs/INCIDENT-RESPONSE.md`
- Secret-looking value scan over Phase 11 artifacts and touched docs:
  - `rg -n "sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+|mongodb(\\+srv)?://[^<\\s]+|eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+|Bearer\\s+[A-Za-z0-9._~+/-]{20,}" .planning/phases/11-operational-monitoring-alerting-and-incident-readiness docs/OPERATIONS.md docs/INCIDENT-RESPONSE.md docs/DEPLOYMENT.md Backend/controllers/webhookController.js Backend/test/payment-webhook.test.js`

### Manual or Blocked Checks

- Live host log routing remains blocked until Phase 9 supplies a staging backend origin and host/log provider.
- Live uptime/readiness alert proof remains blocked until Phase 9 supplies a staging backend origin and selected alert provider.
- MongoDB restore drill remains blocked until provider-managed backup access and a disposable staging restore target exist.
- Stripe dashboard delivery proof remains blocked until Phase 9 supplies the test-mode endpoint and dashboard evidence.

### Nyquist Sampling

Every plan should have at least one automated or static verification command. Documentation-only tasks should have deterministic `rg` checks, secret-pattern scans, and evidence status assertions. Backend source tasks should run focused tests plus the full backend test suite before the phase is verified.

## Risks and Recommendations

| Risk | Planning Recommendation |
| --- | --- |
| False live-provider confidence | Keep provider evidence rows blocked unless Phase 9 supplies real safe evidence. |
| Secret leakage in docs/logs | Keep forbidden values out of all artifact examples and run a secret-pattern scan before completion. |
| Alert noise | Use threshold patterns plus first-response actions; avoid alerts nobody is assigned to review. |
| Overbuilding observability | Prefer host-native logs/alerts and provider-native MongoDB/Stripe dashboards. Avoid APM, OpenTelemetry, Prometheus/Grafana, or new vendors in this phase. |
| Webhook log regression | Test accepted, duplicate, invalid-signature, and failure paths; assert no stacks/raw payloads/signatures are logged. |
| Provider ambiguity | Use required-before-Phase-12 placeholders for dashboard links, notification paths, rollback commands, and restore evidence. |

## Recommended Plan Shape

1. `11-01`: Structured Stripe webhook logging and Phase 11 evidence baseline.
2. `11-02`: Operations documentation, runtime signal routing, dashboard/checklist, alert catalog, and access matrix.
3. `11-03`: MongoDB backup/restore procedure, incident/rollback runbook, and final verification.

## RESEARCH COMPLETE
