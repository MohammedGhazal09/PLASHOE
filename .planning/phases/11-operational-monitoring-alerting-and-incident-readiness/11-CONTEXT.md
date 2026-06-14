# Phase 11: operational-monitoring-alerting-and-incident-readiness - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 turns PLASHOE's existing structured backend logs, health/readiness endpoints, deployment guidance, and Phase 9 blocked staging evidence into operational readiness artifacts: runtime signal evidence, alert catalog, minimal operational dashboard/checklist, MongoDB backup/restore procedure and drill status, operational access matrix, focused webhook logging fixes, and an incident/rollback runbook.

This phase clarifies and plans how to build operational readiness. It does not perform production cutover, create external hosting/provider accounts, fabricate dashboard evidence, add a broad APM platform, or add customer-facing product functionality.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `11-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `11-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Phase 11 SPEC, discussion, plan, execution, verification, and review artifacts for operational monitoring/readiness.
- Focused backend logging changes only where needed to make Stripe webhook operational outcomes structured and redacted.
- Evidence artifacts for log routing, alert catalog, dashboard/checklist, deployment events, MongoDB backup/restore status, and operational access.
- One incident-response and rollback runbook with scenario sections and 5/15/60 minute checks.
- Secret scans and focused tests/static checks for any logging or documentation changes.
- Explicit blocked external evidence rows where Phase 09 staging/provider inputs are still unavailable.

**Out of scope (from SPEC.md):**
- Production cutover, production deploy, release tagging, pushing, or live traffic switch - Phase 12 owns cutover and requires explicit user approval.
- Creating or selecting the actual hosting providers, staging origins, Stripe dashboard setup, MongoDB provider account, or MapTiler restriction - Phase 09 owns external setup.
- Full APM migration, self-hosted Prometheus/Grafana, OpenTelemetry tracing, custom metrics infrastructure, or broad observability platform build-out - too large and provider-dependent for this phase.
- Frontend feature work, storefront visual changes, wishlist/reviews, admin product/coupon UI, or new customer-facing functionality - v2 or separate phases own those.
- Committing real `.env` files, account ids, dashboard exports, screenshots with secrets, MongoDB URIs, API keys, webhook secrets, bearer tokens, raw webhook payloads, or raw PII.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Workflow Boundaries
- **D-01:** Use installed/supporting skills as guidance for Phase 11: `find-skills`, `incident-response`, `runbook`, `observability-engineer`, and `devops-engineer`.
- **D-02:** Do all work inline and do not use subagents. This carries forward the repository instruction and prior GSD phase decisions.
- **D-03:** Preserve unrelated dirty and untracked work. Stage only explicit Phase 11 artifacts or files changed by the approved Phase 11 implementation.

### Artifact Shape and Provider Evidence
- **D-04:** Produce both phase-local proof artifacts and durable operator docs. Use Phase 11 evidence/verification files under `.planning/phases/11-operational-monitoring-alerting-and-incident-readiness/` and durable docs such as `docs/OPERATIONS.md` and `docs/INCIDENT-RESPONSE.md`.
- **D-05:** Keep Phase 11 provider guidance based on host-native logs/alerts plus MongoDB and Stripe native dashboards. Do not introduce a new APM/logging vendor or self-hosted observability stack unless later evidence proves host-native signals are insufficient.
- **D-06:** Where live staging/provider proof is unavailable, mark rows as blocked with the exact missing Phase 9 input. Do not omit unavailable evidence and do not mark live-provider rows passed without real safe evidence.
- **D-07:** Evidence artifacts should use simple pass/blocked/pending/failed status tables with safe public origins only when available. Provider dashboard IDs, account IDs, screenshots with secrets, raw exports, API keys, URIs, tokens, payloads, and PII remain forbidden.

### Webhook Operational Logging
- **D-08:** Implement Stripe webhook operational logging as a small local helper in `Backend/controllers/webhookController.js` that uses the existing `logInfo`, `logWarn`, `logError`, and `serializeError` utilities.
- **D-09:** Emit these structured webhook events: `stripe-webhook-invalid-signature`, `stripe-webhook-duplicate`, `stripe-webhook-accepted`, and `stripe-webhook-processing-failed`.
- **D-10:** Include safe webhook metadata only: request id when available, Stripe event id, event type, duplicate flag/status, processing status, and serialized/redacted error data. Do not log raw webhook payloads, Stripe signatures, webhook secrets, stack traces, full request bodies, bearer tokens, MongoDB URIs, passwords, or raw PII.
- **D-11:** Invalid-signature logs may include `requestId` and `signaturePresent: true/false`, but must not include the signature value or request payload.
- **D-12:** Remove the raw `console.error(error?.stack || error)` in the webhook controller. Existing structured logger internals may continue to write JSON lines to console.
- **D-13:** Verify webhook logging through focused assertions in `Backend/test/payment-webhook.test.js` plus a static check proving the raw webhook `console.error(error?.stack || error)` pattern is gone.

### Alerting and Severity
- **D-14:** Define alerts as actionable threshold patterns rather than fabricated exact numeric SLOs while traffic baseline is unknown.
- **D-15:** Required alert patterns cover backend downtime, readiness failure, sustained 5xx behavior, Stripe webhook delivery or processing failures, MongoDB connectivity issues, and checkout-start/payment-path degradation.
- **D-16:** Every alert must include signal source, owner role, severity, notification path or required-provider placeholder, threshold pattern, first response action, and false-positive/noise guidance.
- **D-17:** Use a SEV1-SEV4 severity model with response timing guidance. SEV1 is complete outage or payment failure affecting all users; SEV2 is major checkout/API degradation; SEV3 is limited operational degradation; SEV4 is low-impact or next-business-day follow-up.
- **D-18:** Use role placeholders instead of named people: Primary Operator, Backup Operator, Business Owner, and optional Provider Admin.

### Incident and Rollback Runbook
- **D-19:** Create one consolidated `docs/INCIDENT-RESPONSE.md` with scenario sections rather than one file per incident type.
- **D-20:** Required scenarios are API down, MongoDB not ready, Stripe webhook failures, checkout/payment degradation, and noisy or missing alerts.
- **D-21:** The runbook must include severity levels, owner roles, incident command/communication flow, first 5/15/60 minute checks, decision thresholds, rollback triggers, rollback verification, escalation, and post-incident notes/action items.
- **D-22:** Reuse existing health/readiness/payment/admin smoke checks from `docs/DEPLOYMENT.md` for rollback verification instead of inventing a separate verification model.
- **D-23:** Do not invent host-specific rollback commands before providers are selected. Use required-before-Phase-12 placeholders for host rollback commands and dashboard links.

### MongoDB Backup Restore and Access
- **D-24:** Document MongoDB backup/restore readiness around provider-managed backups, backup schedule/status evidence, restore target requirements, and restore drill steps to a disposable staging database.
- **D-25:** Keep the actual restore drill evidence blocked until MongoDB provider access and staging/disposable restore target are available. The blocked row must name the missing provider/input.
- **D-26:** Restore verification must never target production data and must never commit production connection strings, backup artifacts, account IDs, or secret-bearing screenshots.
- **D-27:** Operational access matrix must cover backend host/logs, frontend host, MongoDB provider, Stripe dashboard, MapTiler/public config, GitHub Actions, and secret/config stores.
- **D-28:** Each access matrix row must include owner role, least-privilege note, evidence/status, and whether the access is required before Phase 12.

### Verification Strategy
- **D-29:** Phase 11 verification should run focused webhook/logging tests when backend source changes and full backend tests when any backend source changes.
- **D-30:** Verification should include static checks for required operation artifacts/sections and a secret-pattern scan over Phase 11 artifacts, durable ops docs, deployment/config docs touched in the phase, and env templates.
- **D-31:** Frontend tests/build are not required unless Phase 11 unexpectedly touches frontend files. Phase 11 should not touch frontend behavior.
- **D-32:** Live-provider evidence can be marked passed only from real safe evidence; otherwise it remains blocked with the exact Phase 9 blocker.

### the agent's Discretion
- The planner may choose exact file names for Phase 11 local evidence artifacts, but should prefer clear names such as `11-OPERATIONS-EVIDENCE.md` and `11-VERIFICATION.md`.
- The planner may choose exact table layouts for the operations evidence, alert catalog, dashboard/checklist, backup/restore drill status, and access matrix if each row is easy to audit.
- The planner may choose exact helper function names in `Backend/controllers/webhookController.js` if the helper stays small, local, and easy to test.
- The planner may choose exact static `rg` commands for verification if they prove the required no-secret/no-raw-console/no-missing-section acceptance criteria without becoming brittle.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-SPEC.md` - Locked Phase 11 requirements, boundaries, constraints, and acceptance criteria. MUST read before planning.
- `.planning/ROADMAP.md` - Phase 11 goal, dependency on Phase 10, canonical refs, success criteria, plan candidates, and cross-cutting constraints.
- `.planning/REQUIREMENTS.md` - `MON-01` through `MON-04` traceability plus Phase 9/12 boundaries.
- `.planning/STATE.md` - Current project state, Phase 9 external blockers, and known operational risks.

### Prior Phase Carry-Forward
- `.planning/phases/10-frontend-tooling-modernization-and-warning-cleanup/10-CONTEXT.md` - Current Vite/Vitest frontend command state and no-subagent/dirty-worktree boundaries.
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-CONTEXT.md` - Staging proof boundaries, external setup responsibility, Stripe dashboard proof, and blocked staging evidence rules.
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-USER-SETUP.md` - Current Phase 9 blocked provider/staging setup rows that Phase 11 must reference instead of fabricating evidence.
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-VERIFICATION.md` - Current Phase 9 blocked hosted smoke and Stripe dashboard evidence status.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-CONTEXT.md` - Structured logging, readiness, request-id, deployment docs, and verification decisions that Phase 11 builds on.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-USER-SETUP.md` - External production setup checklist that Phase 11 should not duplicate as completed evidence.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-VERIFICATION.md` - Passed Phase 8 operational baseline and known deferred live checks.
- `.planning/phases/05-production-payments/05-CONTEXT.md` - Stripe Checkout, webhook, payment-state, return-route, and test-mode decisions that operational alerts/runbooks must respect.

### Codebase Maps and Project Docs
- `.planning/codebase/STACK.md` - Node/npm, Express, Mongoose, Vite frontend, and no mandatory hosting/provider baseline.
- `.planning/codebase/ARCHITECTURE.md` - Backend app/server split, route/controller/service/model boundaries, error handling, and frontend/backend integration shape.
- `.planning/codebase/INTEGRATIONS.md` - MongoDB, Stripe, frontend API URL, MapTiler, hosting, monitoring, and webhook integration inventory.
- `docs/DEPLOYMENT.md` - Current deployment checklist, smoke checks, Stripe setup, rollback criteria, and 5/15/60 monitoring windows.
- `docs/CONFIGURATION.md` - Backend/frontend environment variables, secret/public config separation, and placeholder rules.
- `docs/API.md` - Health/readiness, request id, Stripe webhook, payment state, and API error behavior.
- `docs/TESTING.md` - Current local command gates and audit/checker verification references.

### Backend Operational Source Files
- `Backend/utils/logger.js` - Existing structured JSON logger, redaction behavior, and serializer to reuse.
- `Backend/utils/readiness.js` - Existing MongoDB readiness state helper used by `/api/ready`.
- `Backend/app.js` - Express app, request context, health/readiness endpoints, raw Stripe webhook mount, and API route mounts.
- `Backend/server.js` - Runtime env validation, database connection, startup logging, and listener startup.
- `Backend/config/db.js` - MongoDB connection behavior and structured connection logs.
- `Backend/middleware/requestContext.js` - `X-Request-Id` generation, echoing, and request completion logging.
- `Backend/middleware/security.js` - Application error logging, error serialization, and request-id response envelope.
- `Backend/controllers/webhookController.js` - Stripe webhook event dispatch, duplicate handling, invalid signature behavior, and current raw `console.error` gap.
- `Backend/routes/webhookRoutes.js` - `POST /api/webhooks/stripe` route target.
- `Backend/services/paymentProvider.js` - Stripe API/webhook construction and secret-bearing behavior to avoid logging.
- `Backend/services/paymentService.js` - Payment return URL and checkout session integration.
- `Backend/models/PaymentEvent.js` - Stored webhook event status used to distinguish duplicates, processing, failed, and processed events.

### Test and Verification Files
- `Backend/test/payment-webhook.test.js` - Existing local signed webhook coverage and target for operational logging assertions.
- `Backend/test/app.test.js` - Existing health/readiness/request-id route tests.
- `Backend/test/security-middleware.test.js` - Existing logger redaction and error serialization tests.
- `Backend/package.json` - Backend `npm test` command for verification.
- `Frontend/Ecommerce-main/my-app/package.json` - Frontend Vite/Vitest command state; only needed if frontend files are unexpectedly touched.
- `.github/workflows/ci.yml` - Remote CI status and deployment-event evidence source when available.
- `scripts/ci/check-audits.mjs` - Production dependency audit policy gate.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Retained static contract checker for release gates.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/utils/logger.js`: provides `logInfo`, `logWarn`, `logError`, `serializeError`, and `redact`; Phase 11 should reuse it for webhook operational events rather than adding a logging dependency.
- `Backend/middleware/requestContext.js`: already provides `req.requestId` and `X-Request-Id`; webhook logs can include the existing request id.
- `Backend/utils/readiness.js`: already reports MongoDB readiness using sanitized state names; operations docs and alerts should point at this behavior.
- `Backend/app.js`: already exposes `/api/health` and `/api/ready`, logs readiness failures, and mounts Stripe webhooks with `express.raw(...)` before JSON parsers.
- `Backend/config/db.js` and `Backend/server.js`: already emit structured runtime, startup, and MongoDB connection logs.
- `Backend/test/payment-webhook.test.js`: already covers invalid signatures, duplicates, success/failure/expiry/refund handling, unresolved reconciliation, and retryable failures.
- `Backend/test/security-middleware.test.js`: already proves logger redaction for bearer tokens, passwords, JWT/Stripe/webhook/Mongo-looking values, payload fields, and serialized errors without stacks.
- `docs/DEPLOYMENT.md`: already has smoke checks, rollback criteria, and first 5/15/60 minute monitoring windows that the incident runbook should reuse.

### Established Patterns
- Backend code uses ES modules with explicit `.js` imports.
- Backend app/server split is established: `Backend/app.js` is importable for tests; `Backend/server.js` owns runtime start behavior.
- Backend routing stays in route files; operational logging changes should stay in controller/helper utilities, not route definitions.
- Structured logs are JSON records written to stdout/stderr by the existing logger and redacted before output.
- Source-controlled planning/docs evidence uses redacted tables and explicit `blocked` rows instead of screenshots, raw dashboard exports, or secrets.
- Prior phases prefer platform-neutral docs until real providers are supplied.

### Integration Points
- Webhook logging connects `Backend/controllers/webhookController.js`, `Backend/utils/logger.js`, `Backend/middleware/requestContext.js`, `Backend/models/PaymentEvent.js`, and `Backend/test/payment-webhook.test.js`.
- Runtime signal evidence connects `Backend/app.js`, `Backend/utils/readiness.js`, `Backend/middleware/requestContext.js`, `Backend/config/db.js`, `Backend/server.js`, host logs, health/readiness checks, Stripe dashboard delivery status, and deployment-event evidence from CI/host provider.
- Alert catalog connects `docs/DEPLOYMENT.md` rollback criteria, backend request/log events, `/api/health`, `/api/ready`, Stripe delivery failures, MongoDB readiness, and checkout-start/payment-path behavior.
- Backup/restore readiness connects MongoDB provider-managed backups, Phase 9 staging MongoDB isolation blockers, disposable staging restore target, operational access matrix, and redacted verification evidence.
- Incident response connects `docs/DEPLOYMENT.md` smoke checks, new durable incident docs, Phase 11 evidence artifacts, and Phase 12 release/cutover gates.

</code_context>

<specifics>
## Specific Ideas

- User approved all Phase 11 discussion recommendations on 2026-06-14.
- No phase-matched todos were found during discussion.
- No existing Phase 11 `CONTEXT.md`, plans, verification, review, or discussion checkpoint were present when context capture started.
- Phase 9 remains blocked on staging backend/frontend origins, MongoDB isolation proof, Stripe test-mode dashboard setup, hosted smoke evidence, and MapTiler decision. Phase 11 must reference these blockers for live evidence it cannot collect.
- The key current source gap is `Backend/controllers/webhookController.js` using raw `console.error(error?.stack || error)` in the webhook failure path.
- `find-skills` search/use selected at least three relevant skills: `incident-response`, `runbook`, `observability-engineer`, and `devops-engineer`. `runbook` installed successfully into `~/.agents/skills/runbook`; the installer also emitted the known PromptScript global-install warning, but the Codex skill copy exists.

</specifics>

<deferred>
## Deferred Ideas

- Production cutover, production deploy, release tagging, pushing, live traffic switch, and post-launch review remain Phase 12.
- External hosting provider setup, staging origins, MongoDB provider account/configuration, Stripe dashboard endpoint setup, and MapTiler dashboard restriction remain Phase 9.
- Full APM migration, OpenTelemetry tracing, self-hosted Prometheus/Grafana, custom metrics infrastructure, and broad observability platform work remain deferred.
- Frontend features, storefront visual changes, wishlist/reviews, and admin product/coupon UI expansion remain outside Phase 11.

</deferred>

---

*Phase: 11-operational-monitoring-alerting-and-incident-readiness*
*Context gathered: 2026-06-14*
