# Phase 08: CI/CD, Observability, and Deployment Readiness - Specification

**Created:** 2026-06-13
**Ambiguity score:** 0.09 (gate: <= 0.20)
**Requirements:** 8 locked

## Goal

PLASHOE changes from a locally verified split ecommerce app to a deployment-ready project with repeatable GitHub Actions checks, explicit liveness/readiness behavior, structured operational logs, accurate environment templates, and documented deployment verification.

## Background

Phase 08 starts after Phases 01-07 stabilized the core ecommerce flow, automated tests, security/config validation, checkout integrity, Stripe-backed payment state, admin fulfillment, catalog APIs, and frontend catalog architecture. The remaining v1 operations requirements are OPS-01 through OPS-04.

The current repository has no `.github/workflows` directory and `docs/TESTING.md` says CI is not configured. Backend tests run through Vitest/Supertest in `Backend`, frontend tests/build run through Create React App in `Frontend/Ecommerce-main/my-app`, and the retained static contract checker runs from the repository root. Dependency audits are documented as manual commands. Frontend audit debt tied to Create React App tooling is already accepted/deferred through the Phase 03 security risk register and the v2 tooling migration requirement.

The backend currently exposes a basic `/api/health` endpoint from `Backend/app.js`, but docs already warn that this health response does not prove MongoDB-backed routes are usable. Backend startup and database connection status still use `console.log`, `console.warn`, and `console.error`, and request/error logs do not have structured request ids. Deployment/config docs list many required values but still include verification placeholders, and the checked-in env templates are known to need correction.

## Requirements

1. **GitHub Actions CI workflow**: The repository must include a GitHub Actions workflow that runs on pull requests and pushes to `main`.
   - Current: No `.github/workflows` directory or CI workflow exists.
   - Target: A workflow under `.github/workflows/` uses Ubuntu runners and Node 20 LTS to install backend and frontend dependencies from their nested app roots, with duplicate in-progress runs canceled for the same branch/ref.
   - Acceptance: Inspecting the workflow proves it triggers on `pull_request` and `push` to `main`, sets minimal repository permissions, uses Node 20, runs nested `npm ci` steps for `Backend` and `Frontend/Ecommerce-main/my-app`, and uses concurrency cancellation.

2. **Automated test/build/check gate**: CI must run the same backend/frontend verification commands that have been used locally through Phase 07.
   - Current: Backend tests, frontend tests, frontend build, dependency audits, and the static contract checker are documented as manual commands only.
   - Target: CI runs backend tests, frontend tests with `--watchAll=false`, frontend production build, backend and frontend production dependency audits, and `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.
   - Acceptance: The CI workflow contains explicit steps for `cd Backend && npm test`, `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false`, `cd Frontend/Ecommerce-main/my-app && npm run build`, both nested `npm audit --omit=dev` checks, and the retained static contract checker.

3. **Audit policy for accepted frontend tooling risk**: Phase 08 must distinguish new production dependency risk from already accepted Create React App/tooling risk.
   - Current: Audits are manual, and frontend audit debt from CRA/react-scripts tooling remains documented as accepted/deferred risk rather than a Phase 08 migration target.
   - Target: CI and docs run dependency audits while preserving the accepted-risk boundary: backend production audit findings fail unless explicitly documented, and frontend findings outside the accepted CRA/tooling risk fail or require a documented risk entry.
   - Acceptance: `docs/TESTING.md` or deployment/CI docs explain the audit gate and accepted-risk policy, and the CI workflow or supporting script makes the audit outcome reviewable without hiding audit execution.

4. **Liveness and readiness endpoints**: Backend runtime status must separate process liveness from dependency readiness.
   - Current: `/api/health` returns a basic `200` JSON response even though it does not prove MongoDB-backed routes are usable.
   - Target: `/api/health` remains a cheap liveness endpoint, and a readiness endpoint such as `/api/ready` returns `200` when runtime configuration and MongoDB connection state are ready and `503` with sanitized diagnostics when the process is live but not ready.
   - Acceptance: Backend route tests prove `/api/health` returns liveness without opening a listener, readiness returns `200` for a connected test database, readiness returns `503` when the database state is disconnected or unavailable, and readiness responses do not expose secrets or raw connection strings.

5. **Structured request/error logging with correlation**: Backend logs must provide queryable operational context without leaking sensitive data.
   - Current: Backend operational logs are mostly prose `console.*` statements, and request/error handling does not consistently include request ids.
   - Target: Backend logs are emitted as structured JSON to stdout/stderr for request completion, application errors, startup/config validation, MongoDB connection state, and readiness failures. Each request receives a correlation id via `X-Request-Id`, and error envelopes include that `requestId`.
   - Acceptance: Tests or focused verification prove responses include `X-Request-Id`, error responses include the same request id, request/error logs include fields such as `timestamp`, `level`, `event`, `requestId`, method, path, status, and duration where applicable, and logs do not include bearer tokens, Stripe secrets, raw webhook payloads, passwords, or full request bodies.

6. **Accurate environment templates**: Checked-in environment examples must match the backend and frontend runtime contracts.
   - Current: `docs/CONFIGURATION.md` states the checked-in backend and frontend env templates are mismatched and contain frontend-template values in the backend template.
   - Target: `Backend/.env.example` documents backend-only variables with placeholders, `Frontend/Ecommerce-main/my-app/.env.example` documents frontend `REACT_APP_*` and public config variables, and neither file contains real secrets.
   - Acceptance: Comparing env examples to `Backend/config/env.js` and `Frontend/Ecommerce-main/my-app/src/config/config.js` shows required and optional variables are represented in the correct nested app template with placeholder values only.

7. **Deployment readiness documentation**: The project must document a repeatable deployment preparation and verification process without assuming live credentials or a single mandatory host.
   - Current: Existing docs cover local setup/config/testing, but there is no dedicated deployment runbook, no CI status section for the new workflow, and several production values remain marked for verification.
   - Target: Documentation includes a platform-neutral deployment checklist with concrete examples for managed backend hosting plus static frontend hosting, required environment variables, pre-deploy checks, post-deploy smoke checks, rollback criteria, and a monitoring window.
   - Acceptance: A deployment doc such as `docs/DEPLOYMENT.md` exists and includes pass/fail checklists for env setup, CI status, frontend build env, backend health/readiness smoke checks, Stripe webhook/return URL setup, rollback decision points, and first 5/15/60 minute post-deploy verification windows.

8. **Phase 08 verification evidence and boundaries**: Phase completion must be proven through local verification and must not expand into adjacent v2 or platform-specific implementation work.
   - Current: Phase 08 has no plan artifacts or verification evidence yet, while adjacent future work includes CRA/Vite migration, v2 wishlist/reviews/admin product UI, and possible deployment-platform decisions.
   - Target: Phase 08 produces source/docs changes plus a verification artifact or summary showing the CI workflow is syntactically reviewable, backend/frontend tests pass, frontend build passes, readiness/logging checks pass, audits were run with the documented policy, and deployment docs/templates were reviewed.
   - Acceptance: Phase verification records the exact commands and outcomes for backend tests, frontend tests, frontend build, static contract checker, audit commands/policy result, readiness/logging tests, and documentation/template checks.

## Boundaries

**In scope:**
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

**Out of scope:**
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

## Constraints

- Use GitHub Actions as the CI provider.
- Use Node 20 LTS on Ubuntu runners.
- Keep both nested app roots: `Backend` and `Frontend/Ecommerce-main/my-app`.
- Use `npm ci` in CI rather than `npm install`.
- Keep CI scoped to existing test/build/audit/static-check commands; do not add broad E2E or external scanning gates in Phase 08.
- Keep dependency audit execution visible even when accepted risk prevents immediate failure on known CRA/tooling debt.
- Health/readiness endpoints must not expose secrets, MongoDB connection strings, Stripe secrets, raw webhook payloads, tokens, or passwords.
- Structured logs must be JSON and safe for stdout/stderr log collection by managed hosts.
- Deployment docs must stay platform-neutral unless a concrete platform is already present in code/docs.
- Preserve no-subagent execution for this repository.

## Acceptance Criteria

- [ ] `.github/workflows/` contains a GitHub Actions workflow triggered on `pull_request` and `push` to `main`.
- [ ] CI uses Node 20 LTS, Ubuntu runners, minimal permissions, nested `npm ci`, and concurrency cancellation.
- [ ] CI runs backend tests, frontend tests with `--watchAll=false`, frontend production build, backend/frontend production audits, and the retained static contract checker.
- [ ] Audit policy documentation distinguishes accepted CRA/tooling risk from new production dependency findings.
- [ ] `/api/health` remains a liveness endpoint with a backend test.
- [ ] A readiness endpoint such as `/api/ready` returns `200` when ready and `503` when MongoDB/readiness state is unavailable, with sanitized responses.
- [ ] Backend request/error/startup/readiness logs are structured JSON and include request correlation where applicable.
- [ ] Responses include `X-Request-Id`, and error envelopes include the same request id.
- [ ] Logging tests or focused verification prove sensitive values are not emitted in logs.
- [ ] `Backend/.env.example` and `Frontend/Ecommerce-main/my-app/.env.example` contain correct app-specific placeholder variables.
- [ ] Deployment documentation includes env setup, CI checks, health/readiness smoke checks, Stripe setup reminders, rollback criteria, and monitoring windows.
- [ ] Phase 08 verification records exact command outcomes for tests, build, audits/policy, static checker, readiness/logging checks, and docs/template checks.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
| --- | --- | --- | --- | --- |
| Goal Clarity | 0.94 | 0.75 | PASS | Approved recommendations lock CI, readiness, logging, env templates, and deployment docs as the Phase 08 target. |
| Boundary Clarity | 0.93 | 0.70 | PASS | In-scope and out-of-scope lists exclude live deployment, Docker, external APM, CRA migration, coverage thresholds, and v2 features. |
| Constraint Clarity | 0.86 | 0.65 | PASS | CI provider, runtime, audit policy, logging safety, endpoint behavior, and platform-neutral docs are specified. |
| Acceptance Criteria | 0.90 | 0.70 | PASS | Criteria are pass/fail and map to workflow inspection, tests, docs, and verification commands. |
| **Ambiguity** | 0.09 | <=0.20 | PASS | Gate passed after user approved all recommendations and requested SPEC.md generation. |

Status: PASS = met minimum, WARN = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective | Question summary | Decision locked |
| --- | --- | --- | --- |
| 1 | Researcher | CI provider and trigger | Use GitHub Actions on pull requests and pushes to `main`. |
| 1 | Researcher | Current verification baseline | CI must automate backend tests, frontend tests, frontend build, audits, and the static contract checker. |
| 1 | Researcher | Current health gap | Keep `/api/health` for liveness and add readiness behavior for database/config readiness. |
| 2 | Simplifier | Minimum deploy automation | Do not deploy live in Phase 08; make the repo deployment-ready through repeatable checks and docs. |
| 2 | Simplifier | CI runtime | Use a single Node 20 LTS Ubuntu baseline rather than a multi-version matrix. |
| 2 | Simplifier | Audit handling | Run audits while preserving the accepted CRA/tooling risk boundary. |
| 3 | Boundary Keeper | Deployment platform assumptions | Keep deployment docs platform-neutral with managed-backend/static-frontend examples. |
| 3 | Boundary Keeper | Env template scope | Fix both nested `.env.example` files with placeholders only. |
| 3 | Boundary Keeper | Explicit exclusions | Exclude live deployment, deployment automation, Docker, CRA migration, external APM, coverage thresholds, E2E/Lighthouse/ZAP gates, v2 features, and real secrets. |
| 4 | Failure Analyst | Readiness failure behavior | A live process with unavailable MongoDB should expose readiness `503` without leaking sensitive diagnostics. |
| 4 | Failure Analyst | Logging failure modes | Log request completion, errors, startup/config validation, DB state, and readiness failures as structured safe JSON. |
| 4 | Failure Analyst | Correlation | Add `X-Request-Id` and include the same id in error envelopes. |
| 5 | Seed Closer | Deployment proof | Add deployment docs with env, CI, smoke, rollback, Stripe setup, and monitoring window checklists. |
| 5 | Seed Closer | Verification proof | Phase 08 must record exact command outcomes for tests, build, audits/policy, static checker, readiness/logging checks, and docs/template checks. |

---

*Phase: 08-ci-cd-observability-and-deployment-readiness*
*Spec created: 2026-06-13*
*Next step: $gsd-discuss-phase 8 - implementation decisions (how to build what's specified above)*
