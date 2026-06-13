---
phase: 08-ci-cd-observability-and-deployment-readiness
researched: 2026-06-13
mode: inline-no-subagents
---

# Phase 08 Research: CI/CD, Observability, and Deployment Readiness

## Research Summary

Phase 08 should be implemented as three execution plans: CI and audit policy, backend readiness and structured logging, then deployment documentation, environment templates, and final verification. This matches the roadmap's three planned work items while separating independent CI work from backend runtime changes.

The current repository has two nested npm projects and no GitHub Actions workflow. The backend already has an importable Express `app.js`, a runtime `server.js`, Mongoose connection helper, Vitest/Supertest tests with MongoMemoryReplSet, and centralized runtime env validation. These are strong foundations for adding `/api/ready`, request-id middleware, JSON logging, and focused route/middleware tests without adding a logging dependency.

External research found one important drift from the locked spec: Node.js 20 is no longer an active LTS line on 2026-06-13. The Node.js release page lists v20 as EOL, while v22 and v24 are LTS. GitHub also started deprecating Node 20 as an action runtime and current official action examples show `actions/checkout@v6` and `actions/setup-node@v6`. Because `08-SPEC.md` and `08-CONTEXT.md` lock Node 20 for this phase, Plan 08-01 preserves that locked runtime for CI execution unless the spec is amended. Recommendation: record the Node 20 EOL finding in Phase 08 verification and open a follow-up runtime upgrade to Node 22 or Node 24 rather than silently changing a locked acceptance criterion during execution.

## Skills Used

- `ci-cd`: pipeline structure, caching, `npm ci`, permissions, and parallel job guidance.
- `github-actions-cicd`: GitHub Actions workflow/security guidance; Phase 08 intentionally excludes its broader CodeQL/ZAP/Lighthouse/deployment automation recommendations.
- `observability`: structured decision-point logging, health/readiness surfaces, and explicit failure modes.
- `deployment-procedures`: platform-neutral deployment preparation, rollback, smoke checks, and monitoring windows.
- `javascript-typescript-jest`: frontend Jest/React Testing Library testing conventions for CI-visible frontend checks.
- `deployment-checklist-generator`: deployment checklist structure; narrowed to Phase 08's platform-neutral documentation scope.

External skill discovery also found `hack23/homepage@github-actions-cicd`, `github/awesome-copilot@javascript-typescript-jest`, and `patricio0312rev/skills@deployment-checklist-generator`. The Skills CLI copied the Codex skill folders; it also reported a PromptScript global-install limitation for non-Codex targets.

## Source Research

- GitHub workflow syntax requires workflow YAML files under `.github/workflows`; supports `pull_request` and `push` branch filters, `permissions`, and workflow-level `concurrency`.
  - https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- GitHub Actions `setup-node` supports npm caching and `cache-dependency-path` for nested lockfiles in monorepos.
  - https://github.com/actions/setup-node
- `actions/setup-node` latest release line is v6, and current README examples use `actions/checkout@v6` and `actions/setup-node@v6`.
  - https://github.com/actions/setup-node/releases
- `actions/checkout` releases include v6, with v5 requiring runner `v2.327.1` or newer and v6 adding Node 24 support details.
  - https://github.com/actions/checkout/releases
- Node.js official releases list production applications as using Active or Maintenance LTS; v20 is EOL while v22 and v24 are LTS as of the page snapshot.
  - https://nodejs.org/en/about/previous-releases
- GitHub's Actions changelog says Node20 reaches EOL in April 2026 and GitHub is migrating actions toward Node24.
  - https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
- npm audit exits non-zero by default on vulnerabilities and supports omit behavior for dependency types.
  - https://docs.npmjs.com/cli/v8/commands/npm-audit/
- Mongoose documents `connection.readyState` values: 0 disconnected, 1 connected, 2 connecting, and 3 disconnecting.
  - https://mongoosejs.com/docs/api/connection.html

## Technology Recommendations

1. Add `.github/workflows/ci.yml` with separate jobs for backend checks, frontend checks, static contract checker, and audit policy. Use `permissions: contents: read`, `concurrency`, `ubuntu-latest`, and nested `working-directory` blocks.
2. Use `actions/checkout@v6` and `actions/setup-node@v6` for current official action majors, while setting the project `node-version` to the locked Phase 08 value unless the spec is amended.
3. Use `cache: npm` plus nested `cache-dependency-path` values for `Backend/package-lock.json` and `Frontend/Ecommerce-main/my-app/package-lock.json`.
4. Add `scripts/ci/check-audits.mjs` rather than embedding nuanced audit policy in YAML. The script should run or parse backend/frontend production audit JSON, fail backend production findings, and preserve the Phase 03 accepted CRA tooling-risk boundary for frontend output.
5. Keep `/api/health` as cheap liveness and add `/api/ready` backed by a helper that reads Mongoose connection state and returns sanitized readiness diagnostics.
6. Add a small local JSON logger and request-correlation middleware instead of adding Pino/Winston. This matches the Phase 08 no-new-runtime-dependency decision.
7. Echo safe inbound `X-Request-Id` values or generate `crypto.randomUUID()`, and add `requestId` to final error envelopes.
8. Update docs and env examples after source behavior exists, then create `08-VERIFICATION.md` with exact command outcomes and the Node 20 EOL research caveat.

## Codebase Patterns

- Backend uses ES modules and explicit `.js` imports.
- `Backend/app.js` is importable without connecting to production MongoDB or opening a listener.
- `Backend/server.js` owns runtime validation, DB connection, and `app.listen`.
- `Backend/config/db.js` centralizes Mongoose connection behavior and should become the DB connection-state logging boundary.
- `Backend/middleware/security.js` owns final security/application error envelopes and is the correct place to include `requestId`.
- `Backend/test/setup.js` connects Mongoose to MongoMemoryReplSet, which can prove connected readiness.
- `Backend/test/app.test.js` already tests `/api/health` and should extend to `/api/ready` plus `X-Request-Id`.
- Frontend CI should run existing CRA Jest and build commands without adding a coverage threshold.
- Current docs already identify CI absence, audit commands, env template mismatch, and health/readiness gaps.

## Architecture Recommendations

### CI and Audit

- Keep one workflow file with multiple jobs rather than several workflow files.
- Use job-level `defaults.run.working-directory` for backend/frontend jobs to avoid noisy `cd` steps.
- Keep static checker and audit policy as separate jobs so failures localize cleanly.
- Do not add CodeQL, ZAP, Lighthouse, deployment, Docker, or coverage thresholds in Phase 08.

### Readiness and Logging

- Add `Backend/utils/readiness.js` for `getReadinessStatus()` and state-name mapping.
- Add `Backend/utils/logger.js` for JSON log emission and redaction helpers.
- Add `Backend/middleware/requestContext.js` or similarly named middleware for request ids and completion logs.
- Update `Backend/app.js` to install request context before route mounts and add `/api/ready`.
- Update `Backend/server.js` and `Backend/config/db.js` to log startup/config/database events structurally.

### Docs and Verification

- Add `docs/DEPLOYMENT.md` for deployment runbook content.
- Update `Backend/.env.example` and `Frontend/Ecommerce-main/my-app/.env.example` from source config, placeholders only.
- Update `docs/CONFIGURATION.md`, `docs/API.md`, `docs/TESTING.md`, and optionally `docs/GETTING-STARTED.md` only for Phase 08 changes.
- Use `08-VERIFICATION.md` as the final proof artifact.

## Potential Pitfalls

- Do not treat a `200` `/api/health` response as database readiness.
- Do not log full headers, bearer tokens, Stripe secrets, raw webhook payloads, MongoDB URIs, request bodies, or stack traces in normal JSON metadata.
- Do not allow CI audit handling to hide frontend audit execution. Accepted CRA/tooling risk must remain visible and bounded.
- Do not add production deployment automation while credentials and host are not locked.
- Do not use `react-scripts start` in deployment documentation; deploy the static build output.
- Do not silently change Node 20 to Node 22 or 24 without updating the locked Phase 08 spec/context.

## Verification Recommendations

Final Phase 08 verification should run:

```powershell
cd Backend
npm test

cd ..\Frontend\Ecommerce-main\my-app
npm test -- --watchAll=false
npm run build

cd ..\..\..
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
node scripts/ci/check-audits.mjs
rg -n "pull_request|push|concurrency|permissions|setup-node|cache-dependency-path|npm test|npm run build|check-contracts" .github/workflows/ci.yml
rg -n "/api/ready|X-Request-Id|requestId|ready|structured|rollback|5/15/60|STRIPE|REACT_APP_API_URL" docs Backend Frontend/Ecommerce-main/my-app/.env.example Backend/.env.example
```

## Open Questions

None blocking. Recommendation: preserve the locked Phase 08 scope and record the Node 20 EOL drift as a follow-up unless the user explicitly asks to revise the spec.

---
_Phase 08 Research_
