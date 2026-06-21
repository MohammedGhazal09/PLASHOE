# Phase 13: admin-store-management-console - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution.
> Decisions are captured in `13-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 13-admin-store-management-console
**Areas discussed:** access model, shell/navigation, API wrappers, order operations, product/coupon/contact operations, tests/docs

---

## Access Model

| Option | Description | Selected |
|--------|-------------|----------|
| Auth-only guard | Reuse `ProtectedRoute` and rely on hidden navigation. | |
| Admin-specific guard | Require `isAuthenticated` and `user.isAdmin === true` for admin routes. | yes |
| Backend-only handling | Let API 403 responses be the only restriction. | |

**User's choice:** Auto-approved recommendation.
**Notes:** Selected admin-specific guard because frontend route access must match the roadmap requirement while backend middleware remains the true security boundary.

---

## Shell and Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| One dashboard page | Put all operations on one large admin page. | |
| Admin shell with child sections | Use `/admin` with sections for orders, products, coupons, and contact messages. | yes |
| Separate unrelated routes | Add top-level routes per resource without a console shell. | |

**User's choice:** Auto-approved recommendation.
**Notes:** Selected admin shell because the phase needs a console, navigation, and several related workflows.

---

## API Wrapper Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve existing contracts | Add missing frontend wrappers over existing protected backend endpoints. | yes |
| Redesign backend routes | Change backend routes to fit new screens first. | |
| New Axios/admin client | Create a separate HTTP client for admin calls. | |

**User's choice:** Auto-approved recommendation.
**Notes:** Selected existing contracts to avoid backend churn and preserve central bearer-token handling in `axios.js`.

---

## Order Operations

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only order view | List and inspect orders but do not update fulfillment. | |
| Existing fulfillment updates | Use existing list/detail/fulfillment endpoints for operational management. | yes |
| New fulfillment semantics | Add new statuses, payment logic, or inventory effects. | |

**User's choice:** Auto-approved recommendation.
**Notes:** Selected existing fulfillment updates because Phase 6 already added the backend workflow and Phase 13 should expose it safely.

---

## Product, Coupon, and Contact Operations

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum read-only admin | Show lists only. | |
| Existing mutation coverage | Add product create/update/delete, coupon create/delete, and contact mark-read/delete workflows where endpoints exist. | yes |
| Broad back-office suite | Add bulk import, uploads, analytics, and role management. | |

**User's choice:** Auto-approved recommendation.
**Notes:** Selected existing mutation coverage because it satisfies `V2-ADM-03` without expanding into separate admin platform features.

---

## Tests and Documentation

| Option | Description | Selected |
|--------|-------------|----------|
| Wrapper tests only | Test API methods but skip route/screen behavior. | |
| Focused route, wrapper, and workflow tests | Cover guard behavior, wrapper endpoints, and critical screen behavior with Vitest/RTL. | yes |
| Full browser E2E suite | Add a new browser automation framework for admin flows. | |

**User's choice:** Auto-approved recommendation.
**Notes:** Selected focused tests because the repo already uses Vitest/RTL and Phase 13 does not require a new E2E framework.

---

## the agent's Discretion

- Exact component names, page split, and admin child route structure.
- Whether order detail opens as a child route, side panel, or inline section.
- Exact loading, empty, error, and confirmation UI patterns, as long as they follow existing conventions.

## Deferred Ideas

- Admin role management and provisioning.
- Bulk product import and image upload/CDN workflows.
- Analytics dashboards and multi-admin audit logs.
- Production cutover and hosted provider proof.
