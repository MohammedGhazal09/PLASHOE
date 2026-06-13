---
status: issues_found
phase: 08
phase_name: ci-cd-observability-and-deployment-readiness
depth: standard
files_reviewed: 18
finding_counts:
  critical: 0
  warning: 2
  info: 1
  total: 3
reviewed_at: 2026-06-13
reviewer: codex-inline
subagents_used: false
skills_used:
  - gsd-code-review
  - find-skills
  - code-review-checklist
  - code-review-security
  - github-actions
  - software-backend
---

# Phase 08 Code Review

Reviewed Phase 08 inline because repository instructions forbid subagents. Scope was the 18 source, test, workflow, and documentation files listed by the Phase 08 summary artifacts, excluding planning summaries, verification artifacts, lockfiles, and unrelated dirty working-tree changes. For `Backend/app.js`, `Backend/test/security-middleware.test.js`, and `docs/API.md`, line references are against committed Phase 08 content because those files currently have unrelated unstaged changes.

## Skill Discovery

`find-skills` was used with:

- `npx --yes skills find "javascript code review security testing"`
- `npx --yes skills find "github actions ci audit review"`
- `npx --yes skills find "express observability logging readiness code review"`

Installed and used skills:

- `sickn33/antigravity-awesome-skills@code-review-checklist` (`code-review-checklist`, 970 installs): general functionality/security/performance/test checklist.
- `hieutrtr/ai1-skills@code-review-security` (`code-review-security`, 366 installs): OWASP and dependency/security review lens. Caveat: Skills CLI reported Snyk high risk for this skill package, so I used it as checklist guidance only.
- `tartinerlabs/skills@github-actions` (`github-actions`, 199 installs): CI workflow audit rules for permissions, triggers, concurrency, action pinning, caching, and Node runtime choices.
- `vasilyu1983/ai-agents-public@software-backend` (`software-backend`, 203 installs): Node/Express backend production-readiness checks for readiness, logging, config, and deployment behavior.

The Skills CLI copied each skill into `~/.agents/skills/...` and also printed a PromptScript global-install warning. Recommendation: keep using the copied Codex skill files; the PromptScript warning does not block this review.

## Findings

### WR-08-001 - Backend template placeholders pass production runtime validation

Severity: Warning

Files:

- `Backend/.env.example:10`
- `Backend/.env.example:18`
- `Backend/.env.example:19`
- `Backend/.env.example:20`
- `Backend/config/env.js:71`
- `Backend/config/env.js:73`
- `Backend/config/env.js:93`
- `Backend/config/env.js:94`
- `Backend/config/env.js:98`

`Backend/.env.example` uses placeholder values for `JWT_SECRET`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`, but the current runtime validator only checks that `JWT_SECRET` is present and at least the minimum length, and that Stripe fields are non-empty when payments are enabled. The exact template values are accepted in production mode:

```json
{
  "accepted": true,
  "jwtSecret": "<32-plus-character-random-secret>",
  "paymentsEnabled": true,
  "stripeSecretKey": "<stripe-secret-key-from-dashboard>",
  "stripeWebhookSecret": "<stripe-webhook-signing-secret>"
}
```

Impact: a copied template can start the backend with a public, known JWT signing secret and fake payment secrets. This is especially risky because `PAYMENTS_ENABLED=true` in the template, `connectDB` intentionally allows the app to listen when MongoDB is unavailable, and `/api/health` still returns 200 even when readiness is 503. In a misconfigured deployment, the process can appear live while auth and payment configuration are unsafe.

Recommendation: reject template placeholders at runtime, at least in non-test environments. Add an explicit placeholder detector for required secrets and URLs, for example values wrapped in `<...>`, `replace-me`, or known example strings. Also change the local template recommendation to either `PAYMENTS_ENABLED=false` by default or use placeholder values that intentionally fail validation until replaced. Add a regression test that parses `Backend/.env.example` with `NODE_ENV=production` and asserts `validateRuntimeEnv` rejects it.

### WR-08-002 - Frontend audit policy accepts vulnerable package names without proving they are CRA/tooling-only

Severity: Warning

Files:

- `scripts/ci/check-audits.mjs:11`
- `scripts/ci/check-audits.mjs:127`
- `scripts/ci/check-audits.mjs:130`
- `scripts/ci/check-audits.mjs:131`
- `scripts/ci/check-audits.mjs:134`

The audit gate accepts frontend findings solely by `vulnerability.name`. That preserves the current CRA/react-scripts debt, but it does not prove the finding is still part of the documented CRA/tooling boundary. If a future app runtime dependency is added with an accepted name such as `lodash`, `express`, `ws`, `uuid`, `qs`, or `body-parser`, a production audit finding for that dependency would still be counted as accepted.

Impact: the CI audit job can silently allow new frontend production vulnerabilities when the vulnerable package name happens to overlap with the old CRA allowlist. That weakens the stated Phase 08 contract that new findings outside the accepted Phase 03 CRA/tooling risk boundary fail the gate.

Recommendation: make the acceptance criteria path/advisory-aware instead of name-only. Prefer checking `vulnerability.nodes` and `via` so only the known react-scripts/build/test tooling chain is accepted. At minimum, fail any accepted package when `isDirect === true` unless the direct package is the explicitly accepted `react-scripts`, and store the accepted advisory IDs or package paths in a policy object. Add unit coverage with a fabricated direct `lodash` or `ws` frontend vulnerability to prove the gate fails it.

### IN-08-001 - CI is pinned to an EOL Node runtime

Severity: Info

Files:

- `.github/workflows/ci.yml:30`
- `.github/workflows/ci.yml:53`
- `.github/workflows/ci.yml:76`
- `.github/workflows/ci.yml:91`
- `docs/TESTING.md`

The CI workflow uses `node-version: 20` in all jobs. This was documented as a Phase 08 caveat, and the workflow action tags exist, but as of 2026-06-13 the official Node.js release table marks v20 as EOL. EOL runtimes no longer receive community security fixes, so continuing to validate deployment readiness on Node 20 creates an operational drift risk.

Recommendation: plan a focused Node 22 or Node 24 migration phase. Update CI, local docs, backend/frontend smoke checks, and any hosting runtime configuration together. If the project intentionally stays on Node 20 temporarily, document the commercial support/security patch strategy and a target date for leaving it.

## Passed Checks

- GitHub Actions workflow has scoped triggers, explicit `contents: read` permissions, concurrency, official GitHub-owned actions, and npm lockfile cache paths for install-heavy jobs.
- `actions/checkout@v6` and `actions/setup-node@v6` tags exist upstream.
- `/api/ready` exposes sanitized MongoDB dependency state without connection strings or secrets.
- Request correlation validates inbound `X-Request-Id`, generates replacements for unsafe values, and includes the request id in error envelopes.
- Structured logger redacts sensitive key names and common secret-looking string values.
- Env templates and deployment docs do not contain real Stripe keys, MongoDB SRV URIs, or the retired weak JWT placeholder.
- Deployment docs include CI gates, health/readiness smoke checks, Stripe setup reminders, rollback criteria, and 5/15/60 minute monitoring windows.

## Checks Run

| Command | Result |
| --- | --- |
| `node "$HOME\.codex\get-shit-done\bin\gsd-tools.cjs" query init.phase-op 8` | Passed; Phase 08 located with 3 plans and verification artifact. |
| `npx --yes skills find "javascript code review security testing"` | Passed; selected `code-review-checklist` and `code-review-security` from results. |
| `npx --yes skills find "github actions ci audit review"` | Passed; selected `github-actions` from results. |
| `npx --yes skills find "express observability logging readiness code review"` | Passed; selected `software-backend` from results. |
| Phase 08 summary extraction | Passed; resolved 18 review-scope files from `08-01-SUMMARY.md`, `08-02-SUMMARY.md`, and `08-03-SUMMARY.md`. |
| `git diff --name-status 8db7b40..a0fa2a2 -- <phase-08-scope>` | Passed; confirmed committed Phase 08 scope. |
| `git ls-remote --tags https://github.com/actions/checkout.git refs/tags/v6` | Passed; tag exists. |
| `git ls-remote --tags https://github.com/actions/setup-node.git refs/tags/v6` | Passed; tag exists. |
| `node --input-type=module <parse Backend/.env.example and validateRuntimeEnv>` | Failed as expected for review: placeholder template was accepted, confirming WR-08-001. |
| `cd Backend && npm test -- app.test.js security-middleware.test.js` | Passed: 2 files, 14 tests. |
| `node scripts/ci/check-audits.mjs` | Passed: backend clean; frontend 46 accepted CRA/tooling findings. |
| Secret-looking value `rg` check over env templates and docs | Passed: no matches. |

## Sources

- Node.js official previous releases table: https://nodejs.org/en/about/previous-releases
- Node.js official EOL guidance: https://nodejs.org/en/about/eol

## Verdict

Phase 08 is not review-clean yet. The core CI, readiness, logging, docs, and tests are in place, but runtime validation must fail copied placeholders before production, and the audit policy needs a stronger proof that accepted frontend findings remain within the old CRA/tooling boundary. My recommendation is to fix both warnings before treating Phase 08 as operationally ready. The Node 20 item should be tracked as a near-term platform migration follow-up.
