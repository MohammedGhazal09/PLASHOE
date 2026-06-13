# Phase 09: production-launch-setup-and-staging-verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-13T23:17:20.4456889+03:00
**Phase:** 09-production-launch-setup-and-staging-verification
**Areas discussed:** Evidence artifacts, external setup responsibility, staging topology and URLs, secret and configuration evidence, database isolation, pre-deploy gates, backend staging smoke checks, frontend staging smoke checks, Stripe test-mode proof, failure handling and phase boundaries

---

## Evidence Artifacts

| Option | Description | Selected |
|--------|-------------|----------|
| Only `09-USER-SETUP.md` and `09-VERIFICATION.md` | Keep setup/config evidence and verification proof in the two SPEC-required files. | yes |
| Additional evidence files | Split evidence into more source-controlled artifacts. | |
| Agent discretion | Let planning choose artifact count later. | |

**User's choice:** Approved recommendation.
**Notes:** The recommendation keeps downstream planning simple and avoids secret-bearing screenshots or raw provider exports.

---

## External Setup Responsibility

| Option | Description | Selected |
|--------|-------------|----------|
| User performs dashboard setup | User completes host, MongoDB, Stripe, and MapTiler dashboard-only actions; agent writes checklists and redacted verification steps. | yes |
| Agent attempts dashboard setup | Agent uses external dashboards or secrets directly. | |
| Hybrid | Agent and user split external setup case by case. | |

**User's choice:** Approved recommendation.
**Notes:** This preserves the repo secret boundary and avoids committing or handling real credentials.

---

## Staging Topology and URLs

| Option | Description | Selected |
|--------|-------------|----------|
| Platform-neutral with concrete fields | Keep docs host-agnostic but require actual provider labels, app roots, and canonical staging origins. | yes |
| Provider-specific runbook | Tie Phase 09 docs to one hosting provider's dashboard. | |
| Agent discretion | Let planning decide host specificity later. | |

**User's choice:** Approved recommendation.
**Notes:** The locked spec requires managed Node backend plus static frontend but does not choose a provider.

| Option | Description | Selected |
|--------|-------------|----------|
| Exact public origins | Record public staging backend/frontend origins when non-secret. | yes |
| Redacted origins | Hide staging URLs even when public. | |
| Agent discretion | Decide per provider. | |

**User's choice:** Approved recommendation.
**Notes:** Real smoke evidence needs callable staging URLs; dashboard IDs and internal/private details remain redacted.

---

## Secret and Configuration Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Redacted checklist and runtime proof | Verify configured status through checklist rows and smoke/runtime evidence without values. | yes |
| Screenshots | Store dashboard screenshots in planning artifacts. | |
| Raw values | Store secret/config values directly. | |

**User's choice:** Approved recommendation.
**Notes:** Secret scanning and source-control safety are mandatory Phase 09 constraints.

| Option | Description | Selected |
|--------|-------------|----------|
| Allow explicit staging placeholders | Public social/contact/company values may be staging placeholders if labeled. | yes |
| Require final production values | Block Phase 09 until final public company/social values are available. | |
| Agent discretion | Decide value by value. | |

**User's choice:** Approved recommendation.
**Notes:** Phase 09 proves staging readiness; Phase 12 owns final production cutover polish.

| Option | Description | Selected |
|--------|-------------|----------|
| Domain-restricted public key | Use MapTiler only with a domain-restricted browser-visible key. | yes |
| Fallback-only | Accept OpenStreetMap/fallback behavior when no MapTiler key is configured. | yes |
| Agent discretion | Decide based on actual staging config. | |

**User's choice:** Approved recommendation.
**Notes:** Both selected states are acceptable if documented honestly.

---

## Database Isolation

| Option | Description | Selected |
|--------|-------------|----------|
| Redacted database identity plus readiness | Record provider/environment/database label and readiness evidence without connection string. | yes |
| Connection string evidence | Store URI or credential-bearing screenshot. | |
| Agent discretion | Decide during execution. | |

**User's choice:** Approved recommendation.
**Notes:** The phase must prove staging does not mutate production while keeping `MONGO_URI` secret.

---

## Pre-Deploy Gates

| Option | Description | Selected |
|--------|-------------|----------|
| Local gates required, CI optional evidence | Require backend tests, frontend tests/build, static checker, and audit policy locally; record remote CI if available. | yes |
| Remote CI required | Block Phase 09 until GitHub Actions remote run is available. | |
| Agent discretion | Decide during planning. | |

**User's choice:** Approved recommendation.
**Notes:** Phase 12 owns final remote release gate; Phase 09 should not fake unavailable remote CI.

| Option | Description | Selected |
|--------|-------------|----------|
| Manual smoke evidence | Use curl/browser/network/dashboard evidence. | yes |
| Add Playwright/E2E | Introduce a browser automation framework. | |
| Agent discretion | Decide during planning. | |

**User's choice:** Approved recommendation.
**Notes:** Phase 09 is external setup and proof, not tooling expansion.

---

## Backend Staging Smoke Checks

| Option | Description | Selected |
|--------|-------------|----------|
| Required liveness/readiness/request-id | Verify hosted `/api/health`, `/api/ready`, and `X-Request-Id`. | yes |
| Add broader API sweep | Add extra backend route coverage as a hard gate. | |
| Agent discretion | Decide during planning. | |

**User's choice:** Approved recommendation.
**Notes:** These checks map directly to the locked spec and Phase 08 implementation.

---

## Frontend Staging Smoke Checks

| Option | Description | Selected |
|--------|-------------|----------|
| Browser/network evidence | Prove runtime calls use the staging backend URL, not localhost. | yes |
| Build artifact grep only | Inspect static output without runtime browser proof. | |
| Agent discretion | Decide during planning. | |

**User's choice:** Approved recommendation.
**Notes:** Runtime network evidence catches misconfigured static host build variables.

| Option | Description | Selected |
|--------|-------------|----------|
| Disposable staging data | Use staging test user/cart/order and cleanup notes. | yes |
| Production-like reusable account | Reuse stable accounts/data. | |
| Agent discretion | Decide during planning. | |

**User's choice:** Approved recommendation.
**Notes:** Disposable staging data protects production data and keeps payment smoke reversible.

---

## Stripe Test-Mode Proof

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe test mode dashboard proof | Use hosted test-mode checkout/test events, dashboard delivery, and backend no-sustained-5xx evidence. | yes |
| Local Stripe CLI only | Use local forwarding as the primary proof. | |
| Live payments | Execute real customer charge flow. | |

**User's choice:** Approved recommendation.
**Notes:** Phase 09 proves staging without live charges.

| Option | Description | Selected |
|--------|-------------|----------|
| Subscription required, smoke optional | Subscribe refund events; test refund only if safe test refund path exists. | yes |
| Refund smoke required | Block Phase 09 without refund smoke proof. | |
| Defer refund events | Leave refund events out of staging endpoint. | |

**User's choice:** Approved recommendation.
**Notes:** The code supports refund events, but core Phase 09 smoke focuses on success, failure, and expiry.

---

## Failure Handling and Phase Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Block honestly | Record blocked setup rows and do not mark Phase 09 complete when external access is missing. | yes |
| Mark pending but pass | Pass Phase 09 with missing external proof. | |
| Agent discretion | Decide during execution. | |

**User's choice:** Approved recommendation.
**Notes:** The phase is evidence-based; incomplete external setup cannot be silently accepted.

| Option | Description | Selected |
|--------|-------------|----------|
| Staging only | Keep production cutover in Phase 12. | yes |
| Include production cutover | Expand Phase 09 into release execution. | |
| Agent discretion | Decide during planning. | |

**User's choice:** Approved recommendation.
**Notes:** This preserves the locked roadmap split across Phases 9, 10, 11, and 12.

---

## Agent Discretion

- Exact `09-USER-SETUP.md` and `09-VERIFICATION.md` table layouts.
- Exact command syntax for curl, PowerShell, browser network notes, and secret-looking value scans.
- Whether optional admin-critical smoke evidence is included, based on staging admin account availability.
- Exact secret-scan regex implementation, as long as forbidden secret classes are covered.

## Deferred Ideas

- Production cutover, production tag/push, live payment execution, and post-launch review remain Phase 12.
- Frontend tooling migration and warning cleanup remain Phase 10.
- External monitoring, alerting, backups, and incident-response ownership remain Phase 11.
- Browser E2E/Lighthouse/ZAP and broad DevSecOps expansion remain outside Phase 09.
- New storefront/admin features remain outside Phase 09.
