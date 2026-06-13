---
phase: 08-ci-cd-observability-and-deployment-readiness
plan: 01
subsystem: ci
tags: [github-actions, npm-audit, ci, testing]
requires:
  - phase: 03-api-security-and-validation
    provides: accepted frontend CRA tooling risk boundary
provides:
  - GitHub Actions CI workflow for backend, frontend, static checker, and audit policy jobs
  - Production dependency audit-policy script for both nested npm apps
  - Testing documentation for CI and accepted-risk audit behavior
affects: [ops, deployment-readiness, testing, security]
tech-stack:
  added: [github-actions]
  patterns: [nested npm app CI jobs, audit policy script]
key-files:
  created:
    - .github/workflows/ci.yml
    - scripts/ci/check-audits.mjs
  modified:
    - docs/TESTING.md
key-decisions:
  - "Preserved the locked Phase 08 Node 20 CI runtime while documenting the Node 20 EOL follow-up."
  - "Kept audit policy in a Node script so CI YAML stays simple and the accepted-risk boundary is testable locally."
patterns-established:
  - "CI jobs use nested working directories and lockfile-scoped npm caches."
  - "Production audit findings are parsed from npm audit JSON instead of prose."
requirements-completed: [OPS-01]
duration: 7 min
completed: 2026-06-13
---

# Phase 08 Plan 01: CI Workflow and Audit Policy Summary

**GitHub Actions CI with backend/frontend/static/audit jobs and a production dependency audit policy that preserves the accepted CRA tooling-risk boundary**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-13T03:58:00+03:00
- **Completed:** 2026-06-13T04:05:16+03:00
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `.github/workflows/ci.yml` with backend, frontend, static contract, and audit-policy jobs triggered on `pull_request` and `push` to `main`.
- Added `scripts/ci/check-audits.mjs` to run production audits for both nested apps and fail findings outside the documented Phase 03 risk boundary.
- Updated `docs/TESTING.md` so CI, local command equivalents, audit policy, accepted frontend tooling debt, and the Node 20 EOL caveat are documented.

## Task Commits

Each task was committed atomically:

1. **Task 08-01-01: GitHub Actions CI workflow** - `4e246a9` (`feat`)
2. **Task 08-01-02: Dependency audit policy gate** - `0f76db5` (`feat`)
3. **Task 08-01-03: CI and audit policy docs** - `e1f8afa` (`docs`)

## Files Created/Modified

- `.github/workflows/ci.yml` - Runs backend tests, frontend tests/build, static contract checker, and audit policy in separate jobs.
- `scripts/ci/check-audits.mjs` - Parses `npm audit --omit=dev --json` output and applies backend-blocking/frontend-accepted-risk rules.
- `docs/TESTING.md` - Documents GitHub Actions, local command equivalents, audit policy, accepted CRA tooling risk, and Node 20 EOL caveat.

## Decisions Made

- Used `actions/checkout@v6` and `actions/setup-node@v6` with `node-version: 20` to keep action majors current while preserving the locked Phase 08 runtime.
- Kept frontend audit debt visible and accepted only for the exact CRA/tooling-family packages documented in the Phase 03 security risk register.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted Windows npm audit process invocation**
- **Found during:** Task 08-01-02
- **Issue:** Direct `npm.cmd` execution returned `spawnSync npm.cmd EINVAL` on Windows.
- **Fix:** Routed Windows audit execution through `cmd.exe /d /s /c` while keeping direct `npm` execution on Linux CI.
- **Files modified:** `scripts/ci/check-audits.mjs`
- **Verification:** `node scripts/ci/check-audits.mjs` passed without process warnings.
- **Committed in:** `0f76db5`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required for local Windows verification and does not broaden Phase 08 scope.

## Issues Encountered

- The audit script initially passed after using `shell: true` on Windows, but Node emitted a deprecation warning. The final implementation avoids the warning with explicit `cmd.exe` invocation.

## Verification

| Command | Result |
| --- | --- |
| `rg -n "pull_request|push|branches: \[main\]|permissions:|contents: read|concurrency|setup-node|cache-dependency-path|npm ci|npm test|watchAll=false|npm run build|check-contracts|check-audits" .github/workflows/ci.yml` | Passed |
| `rg -n "GitHub Actions|CI|check-audits|npm audit --omit=dev|Create React App|accepted|03-SECURITY-RISK-REGISTER|check-contracts" docs/TESTING.md` | Passed |
| `node scripts/ci/check-audits.mjs` | Passed: backend clean, frontend 46 accepted CRA/tooling findings visible |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 08-02 can use the CI/audit baseline while adding backend readiness, request correlation, and structured logging.

---
*Phase: 08-ci-cd-observability-and-deployment-readiness*
*Completed: 2026-06-13*
