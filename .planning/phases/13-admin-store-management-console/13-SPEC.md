# Phase 13: Admin Store Management Console - Specification

**Created:** 2026-06-20
**Ambiguity score:** 0.10 (gate: <= 0.20)
**Requirements:** 5 locked

## Goal

Authenticated administrators can use protected frontend admin screens to run day-to-day store operations for orders, products, coupons, and contact messages without raw API tooling.

## Background

Phase 6 already added protected backend admin APIs for order listing, order detail, fulfillment updates, coupon lists, contact-message lists, and supporting admin tests. Product create, update, and delete endpoints also exist behind backend admin authorization. The frontend currently has no admin route shell in `Frontend/Ecommerce-main/my-app/src/App.js`; `ProtectedRoute` only checks authentication, not `user.isAdmin`; and `Frontend/Ecommerce-main/my-app/src/api/adminApi.js` only wraps order list/detail/fulfillment, coupon list, and contact-message list calls. Product admin mutations, coupon mutations, contact-message mutations, admin navigation, and admin screens are missing.

Phase 13 depends on Phase 12 in the roadmap. This specification can drive source-controlled post-release feature work, but it does not claim production cutover, hosted-provider readiness, or Phase 12 completion.

## Requirements

1. **Admin route authorization**: The frontend must expose admin routes only to authenticated users whose auth state includes `user.isAdmin === true`.
   - Current: `ProtectedRoute` permits any authenticated user, and no admin route exists.
   - Target: Admin routes use an explicit admin guard; unauthenticated users are sent to account login, and authenticated non-admin users cannot see or use the admin console.
   - Acceptance: Focused route tests prove unauthenticated users are redirected, non-admin users see a forbidden state or safe redirect, and admin users render the admin shell.

2. **Admin route shell and navigation**: The frontend must provide an admin shell with operator navigation for orders, products, coupons, and contact messages.
   - Current: Store operators must use API tooling or inspect backend routes directly; no admin navigation exists in the app.
   - Target: `/admin` and child routes render a compact operational shell with clear navigation, active section state, loading states, empty states, and error states.
   - Acceptance: Tests or manual UI verification show the shell renders each admin section and keeps navigation usable on desktop and mobile widths without layout breakage.

3. **Order management screens**: Admins must be able to list, filter, inspect, and update fulfillment for orders from the frontend.
   - Current: Backend admin order APIs and partial frontend API wrappers exist, but no order management UI exists.
   - Target: Admin order screens call existing list/detail/fulfillment endpoints, support bounded filters and pagination already defined by the API, show payment and fulfillment state, and submit carrier, tracking, status, and notes updates through existing backend validation.
   - Acceptance: Focused tests cover order list loading, filter submission, detail rendering, and a fulfillment update request; backend authorization remains enforced by existing API tests.

4. **Product, coupon, and contact management screens**: Admins must be able to manage products, coupons, and contact messages from frontend screens backed by the existing protected APIs.
   - Current: Backend product mutation endpoints, coupon create/delete endpoints, and contact read/delete endpoints exist; frontend admin wrappers and screens are incomplete.
   - Target: `adminApi` or resource-specific admin wrappers cover product create/update/delete, coupon create/delete, and contact read/delete operations; screens expose forms or actions with validation-friendly payloads and safe success/error feedback.
   - Acceptance: API-wrapper tests assert the correct endpoints and payloads for product, coupon, and contact operations; UI tests or focused manual checks cover at least one create/update/delete or mark-read flow per resource group.

5. **Admin workflow verification and documentation**: Critical admin workflows must have focused tests and the docs must describe the available admin console paths.
   - Current: Backend admin APIs have tests, but frontend admin workflows and docs do not cover a console.
   - Target: Frontend tests cover route authorization, admin API wrappers, and critical screen behavior; docs identify the admin console route, required admin account state, and covered API capabilities.
   - Acceptance: Relevant frontend tests pass; any backend tests touched by the phase pass; documentation references the admin console without exposing credentials or weakening backend admin requirements.

## Boundaries

**In scope:**
- Frontend admin route guard based on existing authenticated user state.
- Frontend admin shell, route structure, and navigation for orders, products, coupons, and contact messages.
- Frontend API wrapper additions for existing protected admin endpoints.
- Admin order list/detail/fulfillment UI built on existing backend contracts.
- Product, coupon, and contact-message management UI built on existing backend contracts.
- Focused frontend tests and docs for the admin console.

**Out of scope:**
- Backend admin authorization redesign - existing backend `protect` and `admin` middleware remain the enforcement boundary.
- Admin user provisioning or role-management UI - current auth model only exposes `isAdmin`.
- New payment, refund, inventory reservation, or fulfillment-state semantics - those belong to earlier or later phases.
- Production deploy, release cutover, hosted smoke tests, or provider setup - those belong to phases 9, 11, and 12.
- Bulk product import, image upload pipelines, analytics dashboards, and multi-admin audit logs - useful later but not required for the Phase 13 console.

## Constraints

- Do not weaken backend admin authorization; frontend hiding is only a user experience layer.
- Reuse existing API response envelopes and validation rules from `docs/API.md`.
- Keep admin queries bounded and compatible with existing pagination/filter contracts.
- Do not commit real admin credentials, tokens, API keys, or provider-only values.
- Admin UI should be dense, scannable, and operational rather than marketing-oriented.
- Local source verification is acceptable for Phase 13, but production or hosted-provider success must not be claimed without real evidence.

## Acceptance Criteria

- [ ] Admin routes are inaccessible to unauthenticated users and authenticated non-admin users.
- [ ] Admin users can open an admin shell with navigation for orders, products, coupons, and contact messages.
- [ ] Admin users can list, filter, inspect, and submit fulfillment updates for orders through existing admin APIs.
- [ ] Admin users can create/update/delete products, create/delete coupons, and read/delete or mark contact messages through protected APIs.
- [ ] Focused frontend tests cover admin route authorization, admin API wrappers, and critical admin workflows.
- [ ] Documentation describes the admin console route and does not expose credentials or imply backend authorization is optional.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.92 | 0.75 | met | Roadmap and v2 requirements identify the operator console outcome. |
| Boundary Clarity | 0.95 | 0.70 | met | Backend auth redesign, provisioning, provider proof, and later growth features are excluded. |
| Constraint Clarity | 0.84 | 0.65 | met | Existing API contracts, admin authorization, bounded queries, and no-secret rules constrain work. |
| Acceptance Criteria | 0.86 | 0.70 | met | Pass/fail criteria cover guard, screens, operations, tests, and docs. |
| **Ambiguity** | 0.10 | <=0.20 | met | Requirements are clear enough for discussion and planning. |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists for admin operations today? | Backend admin APIs and partial wrappers exist; frontend routes and screens are missing. |
| 2 | Simplifier | What is the minimum viable console? | Guarded admin shell plus order, product, coupon, and contact workflows over existing APIs. |
| 3 | Boundary Keeper | What should this phase not solve? | No backend auth redesign, production cutover, role provisioning, payment changes, or bulk admin tooling. |
| 4 | Failure Analyst | What would make the result unsafe or rejected? | Non-admin access, raw credential exposure, unbounded queries, bypassed backend validation, or unsupported production claims. |
| 5 | Seed Closer | Which gray-area recommendations are approved? | Auto-selected recommended answers per objective: use existing contracts, frontend-focused implementation, and source-controlled verification. |

---

*Phase: 13-admin-store-management-console*
*Spec created: 2026-06-20*
*Next step: $gsd-discuss-phase 13 - implementation decisions*
