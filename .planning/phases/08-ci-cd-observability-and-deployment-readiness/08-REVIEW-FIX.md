---
status: complete
phase: 08
phase_name: ci-cd-observability-and-deployment-readiness
source_review: 08-REVIEW.md
fixed_findings:
  - WR-08-001
  - WR-08-002
  - IN-08-001
created_at: 2026-06-13
---

# Phase 08 Review Fix

## Fixed

- `WR-08-001`: `Backend/config/env.js` now rejects template placeholder values outside test mode for required production values such as `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`. `Backend/.env.example` now defaults `PAYMENTS_ENABLED=false` so copied local templates do not require Stripe setup until payments are intentionally enabled.
- `WR-08-002`: `scripts/ci/check-audits.mjs` now builds a frontend lockfile dependency graph rooted at `react-scripts`. Accepted frontend audit findings must be in the documented name allowlist, reachable from the `react-scripts` tooling graph, and not a new direct dependency unless the direct package is the explicitly accepted `react-scripts` root.
- `IN-08-001`: `.github/workflows/ci.yml` now uses `node-version: lts/*` for all CI jobs, replacing the EOL runtime pin with the current Node.js LTS resolver.

## Regression Coverage

- Added `Backend/test/security-config.test.js` coverage that parses `Backend/.env.example` as production config and verifies placeholder values are rejected.
- Added `scripts/ci/check-audits.test.mjs` with Node test coverage for reachable CRA tooling findings, unreachable accepted-name findings, direct accepted-name runtime dependencies, and aggregate policy evaluation.
- Updated `docs/CONFIGURATION.md`, `docs/DEPLOYMENT.md`, and `docs/TESTING.md` to document placeholder rejection, the local payments-off template default, lockfile-graph audit acceptance, and the current LTS CI runtime.

## Verification

| Command | Result |
| --- | --- |
| `git diff --check` | Passed; only line-ending conversion warnings from existing Windows checkout settings. |
| `cd Backend && npm test` | Passed: 14 files, 129 tests. |
| `node --test scripts/ci/check-audits.test.mjs` | Passed: 4 tests. |
| `node scripts/ci/check-audits.mjs` | Passed: backend clean; frontend 46 accepted CRA/tooling findings. |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | Passed: 18 suites, 64 tests, with existing React/Router/checkout console warnings. |
| `cd Frontend/Ecommerce-main/my-app && npm run build` | Passed with existing `OrderDetail.jsx` hook warning, Node `fs.F_OK` deprecation, and stale Browserslist warnings. |
| `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` | Passed: `{"PASS":8,"WARN":1}`. |
| `rg -n "Node 20|Node.js 20|node-version: 20" .github docs Backend Frontend scripts` | Passed: no matches in active workflow/docs/source scope. |
| `rg -n "sk_live_|sk_test_|whsec_|mongodb\\+srv://[^<]|replace-with-a-long-random-secret-at-least-32-characters" Backend/.env.example Frontend/Ecommerce-main/my-app/.env.example docs/CONFIGURATION.md docs/DEPLOYMENT.md docs/GETTING-STARTED.md docs/TESTING.md` | Passed: no matches. |

## Recommendation

Keep the lockfile-graph audit policy under test whenever frontend tooling changes. If PLASHOE eventually migrates away from CRA/react-scripts, remove the accepted frontend tooling debt entirely instead of expanding the allowlist.
