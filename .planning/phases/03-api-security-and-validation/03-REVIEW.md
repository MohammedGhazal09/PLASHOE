---
phase: 03-api-security-and-validation
status: findings
depth: standard
reviewed_at: 2026-06-12
reviewer: codex
skills_used:
  - gsd-code-review
  - find-skills
  - code-review-analysis
  - code-review-security
  - api-sec
  - dependency-upgrade
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
---

# Phase 03 Code Review

## Verdict

Phase 03 is not ready to close. The backend still leaks raw exception messages from controller catch blocks, which defeats the generic 500 envelope added by the security middleware. The frontend dependency graph is also only reproducible with `--legacy-peer-deps`, but that requirement is not encoded in the repo.

## Review Scope

- Backend security middleware and runtime validation: `Backend/app.js`, `Backend/server.js`, `Backend/config/*.js`, `Backend/middleware/*.js`
- Backend route validation and controllers: `Backend/routes/*.js`, `Backend/validators/*.js`, `Backend/controllers/*.js`
- Backend package/audit remediation: `Backend/package.json`, `Backend/package-lock.json`
- Frontend auth persistence and public config: `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, `Frontend/Ecommerce-main/my-app/src/config/config.js`, `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`
- Frontend package/audit remediation: `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/package-lock.json`
- Phase 03 docs, risk register, verification, and static contract checker

## Findings

### CR-01: Controller catch blocks bypass the generic 500 envelope and leak raw error messages

**Severity:** Critical  
**Files:** `Backend/controllers/*.js`

Phase 03 added `handleApplicationErrors` in `Backend/middleware/security.js` to return `{ success: false, message: "Server Error" }` for unexpected 500s, and `Backend/test/security-middleware.test.js` verifies that helper directly. Most controllers still catch errors themselves and return `message: error.message`, including 500 paths such as:

- `Backend/controllers/authController.js:84-86`
- `Backend/controllers/cartController.js:21-23`
- `Backend/controllers/contactController.js:47-49`
- `Backend/controllers/couponController.js:41-43`
- `Backend/controllers/orderController.js:93-95`
- `Backend/controllers/productController.js:38-40`

Because the controllers respond directly, unexpected database, JWT, or model errors never reach `handleApplicationErrors`. Public routes such as product listing, contact submission, coupon validation, and auth can still disclose internal exception text to clients. This contradicts the Phase 03 summary claim that unexpected 500 responses return generic client messages.

**Recommendation:** Convert async controllers to pass unexpected errors to `next(error)` or introduce a shared async handler. Keep explicit client-safe 400/401/403/404 responses local, but route unexpected failures through `handleApplicationErrors`. Add route-level tests that force a model/controller failure and assert the HTTP response is `Server Error`, not the thrown message.

### WR-01: Frontend clean install is only reproducible with an undocumented legacy peer resolver

**Severity:** Warning  
**Files:** `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/package-lock.json`, `docs/TESTING.md`

`npm ci --dry-run` from `Frontend/Ecommerce-main/my-app` fails with:

```text
Missing: @types/react@18.3.31 from lock file
Missing: typescript@6.0.3 from lock file
```

The same command passes only when run as `npm ci --dry-run --legacy-peer-deps`. The docs currently tell contributors to run plain `npm install` before frontend tests, and no `.npmrc` or package script encodes the legacy peer resolver requirement. A default CI job using `npm ci` will fail even though the Phase 03 summary reports the frontend tests/build passing.

**Recommendation:** Prefer making the graph default-resolver clean by regenerating the frontend lockfile under normal npm resolution and adding any required direct dev dependencies at compatible versions. If this project intentionally keeps the legacy resolver until the CRA migration, commit a local `.npmrc` with `legacy-peer-deps=true` and update `docs/TESTING.md` / `docs/GETTING-STARTED.md` so fresh installs and CI use the same resolver deliberately.

## Checks Run

| Command | Result |
| --- | --- |
| `node "$HOME\.codex\get-shit-done\bin\gsd-tools.cjs" query init.phase-op 3` | Passed; Phase 03 located with context, plans, summaries, and verification. |
| `npx skills find "code review security dependency express react"` | Returned external skill candidates; local skills were sufficient and avoided extra installs. |
| `rg -n "message: error\.message" Backend\controllers` | Found direct raw-error response patterns across auth, cart, contact, coupon, order, and product controllers. |
| `cd Frontend/Ecommerce-main/my-app && npm ci --dry-run` | Failed; lockfile missing default-resolver peer entries. |
| `cd Frontend/Ecommerce-main/my-app && npm ci --dry-run --legacy-peer-deps` | Passed; confirms current graph depends on legacy peer resolution. |
| `cd Frontend/Ecommerce-main/my-app && npm install --dry-run` | Passed without modifying the working tree. |
| `cd Backend && npm ci --dry-run` | Passed. |

## Notes

- Full backend/frontend test suites were not rerun during this review because this pass did not modify source code. The review relies on Phase 03 verification artifacts plus the targeted checks above.
- `Backend/.env.example` is untracked and was not modified by this review.
