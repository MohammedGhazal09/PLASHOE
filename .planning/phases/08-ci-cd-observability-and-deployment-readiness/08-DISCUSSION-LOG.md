# Phase 08: ci-cd-observability-and-deployment-readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 08-ci-cd-observability-and-deployment-readiness
**Areas discussed:** CI Workflow, Audit Gate, Health And Readiness, Structured Logging, Docs And Env, Verification Artifacts

---

## CI Workflow

| Option | Description | Selected |
| --- | --- | --- |
| One big `ci.yml` | Put every check in one workflow/job shape. | |
| Split workflows | Separate CI into several workflow files. | |
| One CI workflow with multiple jobs | Use one workflow file with backend, frontend, static-checker, and audit jobs. | yes |

**User's choice:** Approved recommendations.
**Notes:** Chosen to keep Phase 08 simple while making failures easy to locate.

| Option | Description | Selected |
| --- | --- | --- |
| Fully sequential | Run jobs in one strict order. | |
| Mostly parallel | Run backend/frontend jobs in parallel and avoid unnecessary dependencies. | yes |
| All in one job | Put every command in one runner job. | |

**User's choice:** Approved recommendations.
**Notes:** Chosen for faster feedback and clearer CI failures.

| Option | Description | Selected |
| --- | --- | --- |
| No cache | Use cold installs every run. | |
| Setup-node npm cache | Use `actions/setup-node` npm cache with nested lockfile paths. | yes |
| Manual cache | Add custom cache steps. | |

**User's choice:** Approved recommendations.
**Notes:** Chosen as the lowest-complexity CI speedup for two npm lockfiles.

| Option | Description | Selected |
| --- | --- | --- |
| Major version tags | Pin official actions to major versions such as `v4`. | yes |
| Full commit SHA | Pin every action to an immutable SHA. | |
| Leave unpinned | Do not constrain action versions. | |

**User's choice:** Approved recommendations.
**Notes:** Full-SHA pinning is noted as future supply-chain hardening.

---

## Audit Gate

| Option | Description | Selected |
| --- | --- | --- |
| Inline shell | Encode audit policy directly in workflow YAML. | |
| Dedicated script | Add a small repo script to run/read audit JSON and apply accepted-risk rules. | yes |
| Docs-only interpretation | Run audits but interpret output manually. | |

**User's choice:** Approved recommendations.
**Notes:** Needed because the frontend CRA audit exception is nuanced.

| Option | Description | Selected |
| --- | --- | --- |
| Hardcode package allowlist | Put allowed audit packages only in code. | |
| Parse risk register | Try to infer policy from `03-SECURITY-RISK-REGISTER.md`. | |
| New or clear audit policy doc | Document policy in `docs/TESTING.md` or `docs/AUDIT-POLICY.md`, aligned with the script. | yes |

**User's choice:** Approved recommendations.
**Notes:** Downstream verifiers need a human-readable rule, not only script behavior.

---

## Health And Readiness

| Option | Description | Selected |
| --- | --- | --- |
| `/api/ready` | Add a dedicated readiness endpoint. | yes |
| `/api/health/ready` | Nest readiness under health. | |
| Replace `/api/health` | Change the existing health endpoint to readiness. | |

**User's choice:** Approved recommendations.
**Notes:** Keeps liveness and readiness separate.

| Option | Description | Selected |
| --- | --- | --- |
| Inline Mongoose state | Inspect `mongoose.connection.readyState` directly in the route. | |
| Helper module | Add a small readiness helper for sanitized state. | yes |
| Cached startup state only | Report only startup-time readiness. | |

**User's choice:** Approved recommendations.
**Notes:** Helper keeps the endpoint testable and avoids operational logic in `app.js`.

| Option | Description | Selected |
| --- | --- | --- |
| Exit on DB failure | Refuse to listen if MongoDB cannot connect. | |
| Listen with readiness `503` | Keep process live but surface unready state. | yes |
| Retry loop before listen | Block startup while retrying. | |

**User's choice:** Approved recommendations.
**Notes:** Preserves current tolerant runtime behavior while giving deployment platforms a readiness signal.

---

## Structured Logging

| Option | Description | Selected |
| --- | --- | --- |
| Add `pino` | Bring in a production logger dependency. | |
| Add `winston` | Bring in a configurable logger dependency. | |
| Lightweight JSON logger | Add a small local `Backend/utils/logger.js`. | yes |

**User's choice:** Approved recommendations.
**Notes:** Phase 08 needs structured signals, not a broad logging framework migration.

| Option | Description | Selected |
| --- | --- | --- |
| Always generate | Ignore incoming request ids. | |
| Honor inbound header or generate | Accept safe `X-Request-Id` and generate one otherwise. | yes |
| Include in errors only | Do not add a response header. | |

**User's choice:** Approved recommendations.
**Notes:** Supports platform/proxy correlation and support debugging.

| Option | Description | Selected |
| --- | --- | --- |
| All requests | Log every request including health. | |
| Only errors | Log only failures. | |
| All API except low-noise health | Log API completions, readiness failures, and errors; keep health low-noise or sampled. | yes |

**User's choice:** Approved recommendations.
**Notes:** Follows observability guidance to log useful signals, not noisy activity.

| Option | Description | Selected |
| --- | --- | --- |
| Trust callers | Rely on developers to avoid sensitive fields. | |
| Sanitize known fields | Redact common sensitive values. | |
| Sanitize and test redaction | Add serializer/redaction helper plus tests. | yes |

**User's choice:** Approved recommendations.
**Notes:** Auth/payment data makes log leakage a real production risk.

---

## Docs And Env

| Option | Description | Selected |
| --- | --- | --- |
| `docs/DEPLOYMENT.md` | Add a focused deployment runbook. | yes |
| Fold into getting started | Put deployment content in local setup docs. | |
| Fold into configuration | Put deployment content in env docs. | |

**User's choice:** Approved recommendations.
**Notes:** Deployment readiness is large enough to deserve one focused doc.

| Option | Description | Selected |
| --- | --- | --- |
| Update docs only | Leave env example files unchanged. | |
| Update both nested `.env.example` files | Correct backend and frontend templates with placeholders. | yes |
| Add production examples | Create additional environment example files. | |

**User's choice:** Approved recommendations.
**Notes:** Current docs say templates are mismatched; extra env files would add maintenance burden.

| Option | Description | Selected |
| --- | --- | --- |
| Generic checklist | Include generic rollback criteria and monitoring windows. | yes |
| Platform-specific commands | Document host-specific rollback commands. | |
| No rollback | Omit rollback content. | |

**User's choice:** Approved recommendations.
**Notes:** Host selection is out of Phase 08 scope.

---

## Verification Artifacts

| Option | Description | Selected |
| --- | --- | --- |
| `08-VERIFICATION.md` | Add a dedicated Phase 08 proof file. | yes |
| `08-VALIDATION.md` | Use validation naming instead. | |
| Plan summaries only | Rely only on execution summaries. | |

**User's choice:** Approved recommendations.
**Notes:** Operational readiness needs one easy-to-review proof artifact.

| Option | Description | Selected |
| --- | --- | --- |
| Install `actionlint` | Add a workflow linter dependency/tooling path. | |
| Static inspect only | Use local static checks and document live GitHub validation after push. | yes |
| Rely on GitHub after push | Do no local workflow checks. | |

**User's choice:** Approved recommendations.
**Notes:** Keeps Phase 08 from adding tooling for one workflow file.

| Option | Description | Selected |
| --- | --- | --- |
| Manual read | Verify docs by reading only. | |
| Static grep checks | Use targeted `rg` checks plus manual read-back. | yes |
| Custom docs checker | Build a custom documentation verifier. | |

**User's choice:** Approved recommendations.
**Notes:** Enough proof for docs without creating a documentation test framework.

| Option | Description | Selected |
| --- | --- | --- |
| Focused ops tests only | Run only new readiness/logging tests. | |
| Full backend/frontend tests/build | Run full tests and build. | |
| Full tests/build plus audit/checker | Run full tests, build, audits/policy, static checker, and focused ops checks. | yes |

**User's choice:** Approved recommendations.
**Notes:** Directly maps to all Phase 08 acceptance criteria.

---

## the agent's Discretion

- Exact CI job names and step names.
- Exact audit policy doc location between `docs/TESTING.md` and `docs/AUDIT-POLICY.md`.
- Exact helper filenames for readiness, request-id middleware, and logger utilities.
- Exact optional JSON log field names beyond the core fields.
- Exact static `rg` checks used to verify docs/templates.

## Deferred Ideas

- Full commit-SHA GitHub Action pinning as future supply-chain hardening.
- `actionlint` or a workflow-lint dependency if CI workflow complexity grows.
- External APM/SaaS monitoring.
- Browser E2E, Lighthouse, ZAP, and broad DevSecOps gates.
- Live production deployment and deployment automation.
- Dockerization.
- CRA/Vite migration.
