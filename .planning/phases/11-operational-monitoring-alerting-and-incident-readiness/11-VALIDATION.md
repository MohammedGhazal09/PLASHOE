---
phase: 11
slug: operational-monitoring-alerting-and-incident-readiness
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-14
---

# Phase 11 - Validation Strategy

Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest + Supertest for backend API tests; deterministic `rg` checks for docs/evidence |
| Config file | `Backend/package.json` scripts; no new test framework required |
| Quick run command | `cd Backend; npx vitest run test/payment-webhook.test.js` |
| Full suite command | `cd Backend; npm test` |
| Estimated runtime | Backend focused test: under 30 seconds; full backend suite: under 2 minutes on a warm local setup |

## Sampling Rate

- After every backend source/test task commit: run `cd Backend; npx vitest run test/payment-webhook.test.js`.
- After every docs/evidence task commit: run the exact `rg` checks listed in that task.
- After every plan wave: run `cd Backend; npm test` if backend source changed in that wave; otherwise run the docs/evidence static checks.
- Before `$gsd-verify-work`: run the full backend suite, required section checks, and secret-pattern scan.
- Max feedback latency: about 2 minutes for source changes; under 30 seconds for docs-only changes.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | MON-01, MON-02 | T-11-01 / T-11-02 | Webhook logs omit payloads, signatures, secrets, stacks, and PII | integration | `cd Backend; npx vitest run test/payment-webhook.test.js` | yes | pending |
| 11-01-02 | 01 | 1 | MON-01 | T-11-02 | Raw `console.error(error?.stack || error)` removed | static | `rg -n "console\\.error\\(error\\?\\.stack \\|\\| error\\)" Backend/controllers/webhookController.js` must return no matches | yes | pending |
| 11-01-03 | 01 | 1 | MON-01 | T-11-03 | Evidence ledger uses blocked rows instead of fabricated links | static | `rg -n "Runtime Signal Routing|blocked|Phase 09" .planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-OPERATIONS-EVIDENCE.md` | no until plan executes | pending |
| 11-02-01 | 02 | 2 | MON-01, MON-02 | T-11-04 | Operations docs identify signals, owners, and low-noise alert patterns | static | `rg -n "Runtime Signal Routing|Alert Catalog|Dashboard Checklist|Access Matrix" docs/OPERATIONS.md` | no until plan executes | pending |
| 11-02-02 | 02 | 2 | MON-02, MON-04 | T-11-04 | Alerts have response actions and do not expose secrets | static | `rg -n "backend downtime|readiness failure|sustained 5xx|Stripe webhook|MongoDB connectivity|checkout-start" docs/OPERATIONS.md` | no until plan executes | pending |
| 11-03-01 | 03 | 3 | MON-03 | T-11-05 | Restore drill targets disposable staging, never production | static | `rg -n "disposable staging|provider-managed|restore drill|blocked" docs/OPERATIONS.md .planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-OPERATIONS-EVIDENCE.md` | no until plan executes | pending |
| 11-03-02 | 03 | 3 | MON-04 | T-11-06 | Incident runbook includes owners, thresholds, communication, rollback, and 5/15/60 checks | static | `rg -n "SEV1|Primary Operator|Backup Operator|Business Owner|5 minutes|15 minutes|60 minutes|Rollback" docs/INCIDENT-RESPONSE.md` | no until plan executes | pending |
| 11-03-03 | 03 | 3 | MON-01, MON-02, MON-03, MON-04 | T-11-07 | Final proof blocks unavailable live evidence and scans for secrets | mixed | `cd Backend; npm test` plus Phase 11 secret scan | no until plan executes | pending |

## Wave 0 Requirements

Existing infrastructure covers all Phase 11 validation requirements:

- `Backend/package.json` already exposes `npm test`.
- `Backend/test/payment-webhook.test.js` already covers the webhook route.
- `Backend/test/security-middleware.test.js` already covers logger redaction and error serialization.
- `Backend/test/app.test.js` already covers `/api/health`, `/api/ready`, and request id behavior.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Host log routing evidence | MON-01 | Requires selected host/log provider and staging backend origin from Phase 9 | Keep row `blocked` until provider log view is supplied; record only safe provider label and evidence summary. |
| Live uptime/readiness alert proof | MON-02 | Requires selected alert provider and staging backend origin from Phase 9 | Keep row `blocked` until alert provider path and notification target exist. |
| MongoDB provider restore drill | MON-03 | Requires provider-managed backup access and disposable staging restore target | Keep row `blocked` until restore target exists; never use production data or commit connection strings. |
| Stripe dashboard delivery evidence | MON-01, MON-02 | Requires Stripe test-mode endpoint and dashboard evidence from Phase 9 | Keep row `blocked` until dashboard proof exists; record status, event names, and HTTP result only. |

## Validation Sign-Off

- [x] All planned tasks have automated or deterministic static verification.
- [x] Sampling continuity avoids docs-only work without static checks.
- [x] No watch-mode flags are required.
- [x] Backend source changes require both focused webhook tests and full backend tests.
- [x] Live external evidence remains blocked unless real safe evidence exists.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-06-14 for planning use
