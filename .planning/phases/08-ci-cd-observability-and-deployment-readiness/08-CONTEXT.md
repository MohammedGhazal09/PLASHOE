# Phase 08: ci-cd-observability-and-deployment-readiness - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 08 makes PLASHOE operationally ready for v1: GitHub Actions CI for the existing backend/frontend test, build, audit, and static-check commands; separate backend liveness and readiness behavior; structured safe backend logs with request correlation; corrected environment templates; deployment readiness documentation; and a verification artifact proving the operational checks.

This phase does not add product features, perform a live deployment, choose or configure a mandatory production host, add Docker, add external APM, add browser E2E/Lighthouse/ZAP gates, set hard coverage thresholds, or migrate Create React App tooling.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `08-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `08-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- GitHub Actions CI workflow for PRs and pushes to `main`.
- Node 20 LTS and Ubuntu runner baseline for CI.
- Backend `npm ci`, backend `npm test`, frontend `npm ci`, frontend `npm test -- --watchAll=false`, frontend `npm run build`, dependency audits, and retained static contract checker in CI.
- Documented audit policy that keeps accepted CRA/tooling risk distinct from new production dependency risk.
- Backend liveness/readiness behavior for `/api/health` and a readiness endpoint such as `/api/ready`.
- Structured backend logs for request completion, application errors, startup/config validation, database connection state, and readiness failures.
- Request correlation through `X-Request-Id` and matching error-envelope `requestId`.
- Correct backend and frontend `.env.example` templates with placeholders only.
- Deployment readiness documentation, rollback checklist, smoke checks, and post-deploy monitoring windows.
- Phase 08 verification artifact or summary with exact commands and outcomes.

**Out of scope (from SPEC.md):**
- Live production deployment - credentials, host selection, and production URLs are not locked.
- Production deployment automation - this phase makes deployment repeatable and documented but does not push to a live host.
- Dockerization or docker-compose - no Docker baseline exists and the roadmap does not require it for v1 readiness.
- Create React App to Vite/tooling migration - deferred to v2 requirement `V2-04` unless a separate dependency-remediation phase reopens it.
- External APM/SaaS monitoring integration - structured logs and health/readiness are the v1 observability baseline.
- Hard coverage thresholds - current docs explicitly say thresholds are not configured.
- Browser E2E/Lighthouse/ZAP gates - useful later, but this phase locks CI around the existing test/build/audit/checker baseline.
- Wishlist, product reviews, and full admin product/coupon UI - deferred to v2.
- Real secret values in docs, examples, CI, or planning artifacts - only placeholders are allowed.
- Platform-specific rollback commands - rollback criteria and generic process are in scope, host-specific commands wait for a chosen platform.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Workflow Boundaries
- **D-01:** Use `ci-cd`, `github-actions-cicd`, `observability`, and `deployment-procedures` as supporting guidance for Phase 08.
- **D-02:** Do not use `dev-structured-logs` as authoritative guidance for implementation because the installed external skill is .NET-focused. Use the local `observability` skill for Node/Express logging and readiness decisions.
- **D-03:** Do not use subagents while the repository instruction forbids subagents. Research, planning, execution, review, and verification should run inline unless the user later changes that instruction.

### CI Workflow Shape
- **D-04:** Add one workflow file at `.github/workflows/ci.yml`.
- **D-05:** The workflow should trigger on `pull_request` and `push` to `main`.
- **D-06:** Use multiple jobs inside the one workflow: backend checks, frontend checks, static contract checker, and dependency audit/policy checks.
- **D-07:** Run backend and frontend jobs in parallel. Run static checker and audit jobs independently where possible instead of serializing the whole workflow unnecessarily.
- **D-08:** Use `actions/setup-node` with Node 20 LTS and npm cache enabled. Use separate `cache-dependency-path` values for `Backend/package-lock.json` and `Frontend/Ecommerce-main/my-app/package-lock.json`.
- **D-09:** Use official GitHub actions pinned to explicit major versions for the initial workflow. Document full commit-SHA pinning as future supply-chain hardening, not as Phase 08 implementation work.
- **D-10:** Keep CI permissions minimal, starting with `contents: read`. Do not add deploy, package, or id-token permissions in Phase 08 because live deployment is out of scope.

### CI Commands and Audit Gate
- **D-11:** CI should run nested `npm ci` in both `Backend` and `Frontend/Ecommerce-main/my-app`.
- **D-12:** CI should run `npm test` in `Backend`.
- **D-13:** CI should run `npm test -- --watchAll=false` in `Frontend/Ecommerce-main/my-app`.
- **D-14:** CI should run `npm run build` in `Frontend/Ecommerce-main/my-app`.
- **D-15:** CI should run `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` from the repo root.
- **D-16:** Add a small repo script such as `scripts/ci/check-audits.mjs` to run or evaluate production audit JSON and apply the accepted-risk policy.
- **D-17:** Keep backend production audit findings blocking unless they are explicitly documented as accepted risk.
- **D-18:** Keep frontend production audit execution visible, but preserve the Phase 03 accepted CRA/tooling risk boundary. Findings outside the documented CRA/tooling risk should fail or require a new accepted-risk entry.
- **D-19:** Document the audit policy in `docs/TESTING.md` or a focused `docs/AUDIT-POLICY.md`. The audit script and docs should agree on the same rule.

### Health and Readiness
- **D-20:** Keep `GET /api/health` as the cheap liveness endpoint.
- **D-21:** Add `GET /api/ready` for deployment readiness.
- **D-22:** Implement readiness through a small backend helper that reads Mongoose connection state and returns sanitized readiness data. Do not put all operational logic inline in `Backend/app.js`.
- **D-23:** Attempt the MongoDB connection before `app.listen`, keep the current tolerant runtime behavior of not exiting on DB failure, log the connection failure structurally, and let `/api/ready` return `503` when MongoDB is unavailable.
- **D-24:** Readiness responses must not expose `MONGO_URI`, hostnames embedded in connection strings, Stripe secrets, JWT secrets, tokens, passwords, raw webhook payloads, or stack traces.
- **D-25:** Backend tests should cover `/api/health` liveness, `/api/ready` success while connected to the in-memory test database, and `/api/ready` `503` when database readiness is unavailable or simulated as disconnected.

### Structured Logging and Correlation
- **D-26:** Add a lightweight `Backend/utils/logger.js` JSON logger rather than adding Pino, Winston, or another runtime dependency in Phase 08.
- **D-27:** Emit structured JSON to stdout/stderr with fields such as `timestamp`, `level`, `event`, and relevant safe metadata.
- **D-28:** Add request correlation middleware that accepts a sane inbound `X-Request-Id` or generates `crypto.randomUUID()`.
- **D-29:** Echo the request id in the `X-Request-Id` response header.
- **D-30:** Include the same `requestId` in application error envelopes.
- **D-31:** Log request completion for API requests, but keep `/api/health` low-noise or sampled. Always log readiness failures and application errors.
- **D-32:** Log startup/config validation success or failure, MongoDB connection success or failure, readiness failures, and final application errors as structured events.
- **D-33:** Add a serializer/redaction helper and tests proving sensitive values are not emitted in logs.
- **D-34:** Redaction must cover bearer tokens, passwords, JWT secrets, Stripe secrets, raw webhook payloads, MongoDB connection strings, and full request bodies.

### Documentation and Environment Templates
- **D-35:** Add a dedicated `docs/DEPLOYMENT.md` and cross-link from `docs/TESTING.md`, `docs/CONFIGURATION.md`, or `docs/GETTING-STARTED.md` only where useful.
- **D-36:** Update both nested env templates: `Backend/.env.example` and `Frontend/Ecommerce-main/my-app/.env.example`.
- **D-37:** Keep env examples to safe placeholders only. Do not commit real secrets, local `.env` contents, or secret-looking values.
- **D-38:** Backend env template should include backend-only runtime variables from `Backend/config/env.js`, including payment-related server variables when payments are enabled.
- **D-39:** Frontend env template should include frontend `REACT_APP_*` public variables and feature flags from `Frontend/Ecommerce-main/my-app/src/config/config.js`.
- **D-40:** Deployment docs should be platform-neutral while giving concrete examples for managed backend hosting and static frontend hosting.
- **D-41:** Deployment docs should include env setup, CI status checks, frontend build environment, backend health/readiness smoke checks, Stripe webhook/return URL reminders, rollback criteria, and first 5/15/60 minute post-deploy monitoring windows.
- **D-42:** Rollback documentation should use generic rollback criteria and verification windows only. Do not add host-specific rollback commands in Phase 08.

### Verification Strategy
- **D-43:** Write `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-VERIFICATION.md` as the canonical Phase 08 proof file.
- **D-44:** Do not add `actionlint` as a dependency in Phase 08. Validate the workflow locally through static file checks and document that live GitHub runner validation happens after push.
- **D-45:** Use targeted `rg` checks for required deployment, audit, env, readiness, request-id, and logging terms, plus manual read-back summarized in `08-VERIFICATION.md`.
- **D-46:** Final Phase 08 verification should include full backend tests, full frontend tests, frontend build, static contract checker, both audit commands or the audit-policy script, focused readiness/logging tests, and docs/template checks.
- **D-47:** Preserve known existing frontend test/build warnings as documented risk if they remain the same: React Testing Library act warnings, React Router future flag warnings, `OrderDetail.jsx` exhaustive-deps warning, Browserslist data warning, and Node `fs.F_OK` deprecation. Do not hide new failures under these known warnings.

### the agent's Discretion
- The planner may choose exact job names and step names if the workflow remains easy to read and failures are localized by backend, frontend, static checker, and audit/policy area.
- The planner may choose whether the audit policy lives in `docs/TESTING.md` or `docs/AUDIT-POLICY.md`, as long as the source of truth is clear and referenced by docs/verification.
- The planner may choose the exact helper filenames for readiness and request-id/logging middleware if they remain small, testable, and easy to locate.
- The planner may choose exact JSON log field names beyond the required core fields, as long as logs remain structured, safe, and consistent.
- The planner may choose the exact static `rg` checks used for docs/templates verification if they prove the acceptance criteria without becoming a brittle docs test framework.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-SPEC.md` - Locked Phase 08 requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase 08 goal, dependencies, canonical refs, success criteria, and recommended baseline commands.
- `.planning/REQUIREMENTS.md` - `OPS-01` through `OPS-04` traceability.
- `.planning/STATE.md` - Current project status, completed prior phases, and known open risks.

### Prior Phase Carry-Forward
- `.planning/phases/07-catalog-and-frontend-architecture-cleanup/07-CONTEXT.md` - Phase 07 verification baseline and no-subagent constraint carried into Phase 08.
- `.planning/phases/07-catalog-and-frontend-architecture-cleanup/07-SPEC.md` - Catalog/API cleanup scope that Phase 08 validates operationally.
- `.planning/phases/06-admin-fulfillment-operations/06-CONTEXT.md` - Admin fulfillment behavior and tests that CI must preserve.
- `.planning/phases/05-production-payments/05-CONTEXT.md` - Stripe/payment configuration, webhook, and test decisions that deployment docs and env templates must preserve.
- `.planning/phases/04-checkout-data-integrity-and-inventory/04-CONTEXT.md` - Checkout/cart/inventory regression contracts that CI should keep covered.
- `.planning/phases/03-api-security-and-validation/03-SECURITY-RISK-REGISTER.md` - Accepted frontend CRA/tooling audit risk and backend-clean audit baseline.
- `.planning/phases/03-api-security-and-validation/03-CONTEXT.md` - Runtime config validation, error envelope, and secret-handling decisions.

### Codebase Maps and Docs
- `.planning/codebase/STACK.md` - Node/npm, Express, Mongoose, CRA, and no-Docker/no-CI baseline.
- `.planning/codebase/ARCHITECTURE.md` - Backend app/server, route/controller/service/model, error handling, and logging patterns.
- `.planning/codebase/INTEGRATIONS.md` - Current absence of CI/CD, hosting, monitoring, and deployment configuration.
- `.planning/codebase/CONCERNS.md` - Production readiness, health/readiness, scaling, and dependency risk concerns.
- `.planning/codebase/TESTING.md` - Test framework and command inventory.
- `docs/GETTING-STARTED.md` - Local setup and health-check documentation target.
- `docs/CONFIGURATION.md` - Runtime environment and template documentation target.
- `docs/TESTING.md` - CI, audit policy, and verification command documentation target.
- `docs/API.md` - Existing `/api/health` documentation target and future `/api/ready` documentation target.
- `docs/DEVELOPMENT.md` - Current note that `/api/health` does not prove DB-backed readiness.

### Backend Source Files
- `Backend/app.js` - Express app, route mounts, health endpoint, and place for request-id/logging/readiness middleware.
- `Backend/server.js` - Runtime env validation, database connection, startup logging, and listener startup.
- `Backend/config/db.js` - MongoDB connection behavior and connection-state logging target.
- `Backend/config/env.js` - Runtime config validation source for env templates and startup logging.
- `Backend/middleware/security.js` - Final application error handler and error envelope target for `requestId`.
- `Backend/test/app.test.js` - Existing health smoke test target to extend with readiness and request-id assertions.
- `Backend/test/setup.js` - MongoMemoryReplSet test harness used for readiness tests.
- `Backend/test/security-middleware.test.js` - Existing security/error middleware test style to reuse for logging/error-envelope behavior.
- `Backend/services/paymentProvider.js` - Stripe secret usage to avoid logging.
- `Backend/controllers/webhookController.js` - Webhook raw payload and payment event handling to avoid logging sensitive payloads.

### Frontend and CI Source Files
- `Backend/package.json` - Backend `npm test` command and dependencies for CI.
- `Backend/package-lock.json` - Backend npm cache and `npm ci` lockfile.
- `Frontend/Ecommerce-main/my-app/package.json` - Frontend test/build commands for CI.
- `Frontend/Ecommerce-main/my-app/package-lock.json` - Frontend npm cache and `npm ci` lockfile.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Retained static contract checker for CI and verification.
- `Backend/.env.example` - Backend environment template target.
- `Frontend/Ecommerce-main/my-app/.env.example` - Frontend environment template target.
- `.github/workflows/ci.yml` - New CI workflow target.
- `scripts/ci/check-audits.mjs` - Recommended audit-policy script target.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-VERIFICATION.md` - Phase 08 verification artifact target.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/app.js`: already exports an importable Express app for tests without starting a listener.
- `Backend/server.js`: already validates runtime environment before connecting/listening and is the right startup logging boundary.
- `Backend/config/db.js`: already centralizes MongoDB connection behavior and should become the DB connection state logging/readiness source.
- `Backend/config/env.js`: already owns backend env validation and should drive backend `.env.example` correctness.
- `Backend/middleware/security.js`: already owns final app error handling and should add request-id-safe error envelopes.
- `Backend/test/app.test.js`: already tests `/api/health` through Supertest and should be extended for readiness and request-id behavior.
- `Backend/test/setup.js`: already connects Mongoose to `MongoMemoryReplSet`, giving readiness tests a connected DB state.
- `Frontend/Ecommerce-main/my-app/src/config/config.js`: central source for frontend `REACT_APP_*` template variables.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs`: retained static checker that CI should run from the repository root.

### Established Patterns
- Backend uses ES modules with explicit `.js` relative imports.
- Backend app/server split is already in place: `app.js` is importable for tests, `server.js` owns runtime config, DB connect, and `listen`.
- Backend route/controller/service/model boundaries should stay intact; do not add business logic into routes.
- Backend global errors use `{ success: false, message, errors? }`; Phase 08 should extend that envelope with `requestId` without changing status semantics.
- Backend tests use Vitest/Supertest with in-memory MongoDB.
- Frontend tests use Create React App Jest with `--watchAll=false`.
- Frontend build uses `react-scripts build`; CRA tooling migration is deferred.
- Both nested apps use npm lockfiles, so CI should use `npm ci`.

### Integration Points
- CI connects `.github/workflows/ci.yml`, `Backend/package.json`, `Backend/package-lock.json`, `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/package-lock.json`, `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs`, and the audit-policy script/docs.
- Readiness connects `Backend/app.js`, a readiness helper, `Backend/config/db.js`, Mongoose connection state, and `Backend/test/app.test.js`.
- Request correlation connects middleware in `Backend/app.js`, `Backend/middleware/security.js`, structured logger utilities, and tests that assert `X-Request-Id` and error-envelope `requestId`.
- Structured logging connects startup paths in `Backend/server.js`, DB connection in `Backend/config/db.js`, readiness failures, request completion, and final application errors.
- Env-template updates connect `Backend/config/env.js`, `Frontend/Ecommerce-main/my-app/src/config/config.js`, `Backend/.env.example`, `Frontend/Ecommerce-main/my-app/.env.example`, and `docs/CONFIGURATION.md`.
- Deployment docs connect `docs/DEPLOYMENT.md`, `docs/GETTING-STARTED.md`, `docs/CONFIGURATION.md`, `docs/TESTING.md`, health/readiness endpoints, Stripe setup, rollback criteria, and monitoring windows.

</code_context>

<specifics>
## Specific Ideas

- User approved all Phase 08 discussion recommendations on 2026-06-13.
- No phase-matched todos were found during discussion.
- No existing Phase 08 `CONTEXT.md`, plans, or discussion checkpoint were present when context capture started.
- External `find-skills` search found GitHub Actions, structured logging, and deployment procedure candidates. The useful installed/supporting skills for this phase are `ci-cd`, `github-actions-cicd`, `observability`, and `deployment-procedures`.
- `dev-structured-logs` was found/installed in a previous Phase 08 pass, but it is .NET-focused and should not drive Node/Express logging implementation.
- The worktree contains existing local changes from prior phases; Phase 08 planning/execution should preserve unrelated local work and avoid broad resets or broad staging.

</specifics>

<deferred>
## Deferred Ideas

- Full commit-SHA pinning of GitHub Actions is deferred as future supply-chain hardening.
- `actionlint` or a dedicated workflow-lint dependency is deferred until workflow validation grows beyond static inspection.
- External APM/SaaS monitoring is deferred beyond v1 Phase 08.
- Browser E2E, Lighthouse, ZAP, and broad DevSecOps scanning gates are deferred beyond this phase.
- Live production deployment and production deployment automation are deferred until host credentials and deployment targets are locked.
- Dockerization and docker-compose remain out of scope because no Docker baseline exists and v1 does not require it.
- Create React App to Vite/tooling migration remains deferred to `V2-04` or a future dependency-remediation phase.
- Wishlist, product reviews, and full admin product/coupon UI remain v2 deferred features.

</deferred>

---

*Phase: 08-ci-cd-observability-and-deployment-readiness*
*Context gathered: 2026-06-13*
