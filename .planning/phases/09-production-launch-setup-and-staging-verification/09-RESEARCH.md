---
phase: 09-production-launch-setup-and-staging-verification
researched: 2026-06-13
mode: inline-no-subagents
---

# Phase 09 Research: Production Launch Setup and Staging Verification

## Research Summary

Phase 09 should be planned as three execution plans:

1. Staging setup and redacted configuration evidence.
2. Local gates plus hosted backend/frontend staging smoke evidence.
3. Stripe test-mode webhook/payment proof and final secret-free closeout.

This sequencing matches the roadmap candidates and the locked SPEC: first create an evidence surface that says what must exist, then prove the staged app is actually reachable, then prove Stripe test-mode delivery and close the phase. The largest implementation risk is not source-code design; Phase 08 already added CI, `/api/ready`, `X-Request-Id`, structured redaction, env templates, and deployment docs. The real risk is producing source-controlled evidence that is honest and useful without leaking secrets or pretending external dashboards were configured when they were not.

## Skills Used

- `deployment-procedures`: staging-first deployment, pre-deploy verification, smoke checks, rollback criteria, and evidence discipline.
- `ci-cd`: local/remote gate structure, `npm ci`, test/build/audit checks, and CI evidence handling.
- `stripe-webhooks`: raw-body signature verification, endpoint secret handling, event delivery proof, and webhook retry/failure semantics.
- `secret-scanning`: source-control boundary for MongoDB URIs, JWT secrets, Stripe keys, webhook secrets, and dashboard payloads.
- `observability`: health/readiness/request-id/log evidence and no-secret operational summaries.

No external subagents were used. Installed local skills were sufficient; no additional skill installation was needed.

## Source Research

- Stripe webhook endpoints must receive events at a public HTTPS endpoint, verify `Stripe-Signature`, and use the raw request body for signature verification. This matches the current `Backend/app.js` raw webhook mount and `paymentProvider.constructWebhookEvent` implementation.
  - https://docs.stripe.com/webhooks
  - https://docs.stripe.com/webhooks/quickstart
  - https://docs.stripe.com/webhooks/signature
- Stripe webhook endpoints have configured event lists and a `livemode` field; Phase 09 must prove the staging endpoint is in test mode and subscribes to the PLASHOE event set.
  - https://docs.stripe.com/api/webhook_endpoints/object
  - https://docs.stripe.com/api/events/types
- Stripe payment webhook guidance reinforces using webhooks for payment events that happen outside the immediate checkout flow, including successful and failed payments. Phase 09 should verify dashboard delivery rather than only local signed-payload tests.
  - https://docs.stripe.com/webhooks/handling-payment-events
- Create React App embeds custom `REACT_APP_*` environment variables at build time in the static bundle. A staging `REACT_APP_API_URL` change requires rebuilding the frontend; runtime host config alone will not change the built API base URL.
  - https://create-react-app.dev/docs/adding-custom-environment-variables/
  - https://create-react-app.dev/docs/deployment/
  - https://create-react-app.dev/docs/production-build/
- MapTiler documents allowed HTTP origins as a key protection option. A staging MapTiler key should be browser-visible but domain-restricted, or the phase should document fallback-only behavior.
  - https://docs.maptiler.com/cloud/api/authentication-key/
  - https://docs.maptiler.com/guides/maps-apis/maps-platform/how-to-protect-your-map-key/
- GitHub secret scanning and push protection are designed to catch or block hardcoded credentials. Phase 09 should use a local secret-looking value scan for the new planning artifacts and optionally record repository secret scanning status if available.
  - https://docs.github.com/code-security/secret-scanning/about-secret-scanning
  - https://docs.github.com/en/code-security/concepts/secret-security/push-protection
  - https://docs.github.com/en/code-security/reference/secret-security/supported-secret-scanning-patterns
- MongoDB official docs establish connection strings as the application connection mechanism and Atlas project/cluster hierarchy as an isolation boundary. The locked SPEC already requires a separate staging database; the plan should record redacted provider/project/cluster/database labels and readiness evidence, not the URI.
  - https://www.mongodb.com/docs/manual/reference/connection-string/
  - https://www.mongodb.com/docs/atlas/architecture/current/hierarchy/
- Render documentation is useful as a concrete managed-host example, but Phase 09 remains provider-neutral because the SPEC did not select a host.
  - https://render.com/docs/deploy-node-express-app
  - https://render.com/docs/configure-environment-variables
  - https://render.com/docs/health-checks

## Current Repo Findings

- `09-SPEC.md` locks 8 requirements and explicitly makes Phase 09 staging proof only.
- `09-CONTEXT.md` locks 43 implementation decisions, including no subagents, two evidence artifacts, user-owned dashboard setup, redacted evidence, staging MongoDB isolation, local pre-deploy gates, hosted smoke checks, and Stripe test-mode proof.
- `docs/DEPLOYMENT.md` already defines the managed Node backend root, static frontend build root, pre-deploy gates, Stripe setup reminders, smoke checks, rollback criteria, and 5/15/60 minute windows.
- `docs/CONFIGURATION.md` and both `.env.example` files already list backend secrets separately from frontend public `REACT_APP_*` values. Phase 09 should verify or clarify placeholder status, not rewrite config architecture.
- `Backend/app.js` already mounts `/api/webhooks` with `express.raw({ type: "application/json" })` before JSON parsers.
- `Backend/app.js` exposes `/api/health` and `/api/ready`; readiness comes from `Backend/utils/readiness.js` and reports MongoDB `connected` only when Mongoose is ready.
- `Backend/middleware/requestContext.js` already returns `X-Request-Id` and logs API completion except `/api/health`.
- `Backend/utils/logger.js` already redacts bearer tokens, MongoDB URIs, Stripe keys, webhook secrets, JWT-like values, request bodies, payloads, and sensitive keys.
- `Frontend/Ecommerce-main/my-app/src/config/config.js` centralizes `REACT_APP_API_URL`, MapTiler, social, company, and feature flag values.
- `.github/workflows/ci.yml` already runs backend tests, frontend tests/build, static contract checker, and audit policy on pull requests and pushes to `main`.

## Planning Recommendations

1. Plan 09-01 should create `09-USER-SETUP.md` and a verification skeleton with exact redacted fields for backend host, frontend host, MongoDB staging isolation, backend env vars, frontend build vars, Stripe test-mode endpoint, MapTiler, and public content placeholders.
2. Plan 09-01 should inspect docs/templates for ambiguous production placeholder language and update only where needed to mark checked-in values as examples or staging placeholders.
3. Plan 09-02 should run local gates before accepting hosted smoke proof: backend tests, frontend tests, frontend build, static checker, and `node scripts/ci/check-audits.mjs`.
4. Plan 09-02 should then record hosted smoke checks for backend health, backend readiness, `X-Request-Id`, frontend load, product browsing, auth/API reachability, checkout return routes, and staging backend URL usage.
5. Plan 09-03 should verify Stripe test-mode setup with endpoint `<staging-backend-origin>/api/webhooks/stripe`, the six documented events, delivery statuses for success/failure/expiry paths, and no sustained backend 5xx evidence.
6. Plan 09-03 should run a source-controlled artifact secret scan before closeout and update `09-VERIFICATION.md` with pass/fail/blocker status for every locked acceptance criterion.

## Potential Pitfalls

- Do not record `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, raw webhook payloads, bearer tokens, dashboard screenshots containing secrets, or real `.env` files.
- Do not treat a frontend host dashboard variable change as effective until the static CRA bundle has been rebuilt with the staging `REACT_APP_*` values.
- Do not accept `GET /api/health` as proof of database readiness. `/api/ready` must return `ready: true` and MongoDB state `connected`.
- Do not treat local signed webhook tests as Phase 09 Stripe proof. They are regression coverage; Phase 09 needs hosted test-mode dashboard delivery to staging.
- Do not add E2E tooling, production release tags, live customer payments, monitoring/alerts, backup drills, or frontend tooling migration in Phase 09.
- Do not mark Phase 09 complete if external dashboard access is missing. Record blocked rows in `09-USER-SETUP.md` and keep verification failed/blocked.

## Verification Recommendations

Use PowerShell-friendly commands in the plans:

```powershell
cd Backend
npm test

cd ..\Frontend\Ecommerce-main\my-app
npm test -- --watchAll=false
npm run build

cd ..\..\..
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
node scripts/ci/check-audits.mjs
rg -n "sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+|mongodb(\\+srv)?://[^<\\s]+|eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+|Bearer\\s+[A-Za-z0-9._~+/-]{20,}" .planning/phases/09-production-launch-setup-and-staging-verification/09-USER-SETUP.md .planning/phases/09-production-launch-setup-and-staging-verification/09-VERIFICATION.md docs Backend/.env.example Frontend/Ecommerce-main/my-app/.env.example
```

Hosted smoke commands should be written with placeholders in the plan and filled in `09-USER-SETUP.md` during execution:

```powershell
Invoke-WebRequest "$STAGING_BACKEND_ORIGIN/api/health"
Invoke-WebRequest "$STAGING_BACKEND_ORIGIN/api/ready"
Invoke-WebRequest "$STAGING_FRONTEND_ORIGIN"
```

## Open Questions

None blocking for planning. The actual execution may block on user-provided staging host, MongoDB, Stripe, and MapTiler dashboard access. Recommendation: make those blocks explicit in `09-USER-SETUP.md` rather than broadening the phase or faking evidence.

---
_Phase 09 Research_
