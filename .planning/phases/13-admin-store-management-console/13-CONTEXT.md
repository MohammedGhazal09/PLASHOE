# Phase 13: admin-store-management-console - Context

**Gathered:** 2026-06-20
**Status:** Ready for UI and planning

<domain>
## Phase Boundary

Phase 13 turns the existing protected backend admin APIs into a protected frontend operator console. It adds an admin-only route shell, admin navigation, order management screens, product/coupon/contact management screens, frontend API wrappers, focused tests, and docs. This phase does not redesign backend authorization, provision admin users, perform production cutover, or add later customer-facing v2 features.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `13-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream planning and implementation MUST read `13-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Frontend admin route guard based on existing authenticated user state.
- Frontend admin shell, route structure, and navigation for orders, products, coupons, and contact messages.
- Frontend API wrapper additions for existing protected admin endpoints.
- Admin order list/detail/fulfillment UI built on existing backend contracts.
- Product, coupon, and contact-message management UI built on existing backend contracts.
- Focused frontend tests and docs for the admin console.

**Out of scope (from SPEC.md):**
- Backend admin authorization redesign - existing backend `protect` and `admin` middleware remain the enforcement boundary.
- Admin user provisioning or role-management UI - current auth model only exposes `isAdmin`.
- New payment, refund, inventory reservation, or fulfillment-state semantics - those belong to earlier or later phases.
- Production deploy, release cutover, hosted smoke tests, or provider setup - those belong to phases 9, 11, and 12.
- Bulk product import, image upload pipelines, analytics dashboards, and multi-admin audit logs - useful later but not required for the Phase 13 console.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Workflow Boundaries
- **D-01:** Use these skills as supporting guidance for this step: `find-skills`, `gsd-discuss-phase`, and `api-and-interface-design`.
- **D-02:** Do all work inline and do not use subagents, multi-agent tools, or new threads.
- **D-03:** Preserve unrelated dirty and untracked work. Stage or commit only explicit Phase 13 files if committing becomes safe.
- **D-04:** Treat Phase 13 as source-controlled post-release feature work. Do not mark phases 9, 11, or 12 complete and do not claim hosted/provider success from local source work.

### Admin Access Model
- **D-05:** Add an explicit frontend admin guard instead of expanding the existing `ProtectedRoute` semantics for every authenticated route.
- **D-06:** The admin guard should read the existing `useAuthStore` state and require both `isAuthenticated` and `user.isAdmin === true`.
- **D-07:** Unauthenticated users should follow the established account-login redirect pattern. Authenticated non-admin users should see a safe forbidden state or be redirected to a non-admin route; the implementation should choose the least disruptive pattern based on existing route/test conventions.
- **D-08:** Frontend hiding is not security. Backend `protect` and `admin` middleware remain the enforcement boundary for every admin API.

### Admin Shell and Navigation
- **D-09:** Build `/admin` as the console entry point with child views for orders, products, coupons, and contact messages.
- **D-10:** Keep the admin shell compact, dense, and operational. Use tables/lists, filters, status badges, dialogs or inline panels, and clear empty/error states rather than a marketing-style dashboard.
- **D-11:** Admin navigation may be visible only to admins in shared navigation, or limited to the admin shell if a shared header change would add risk. Route access must not depend on navigation visibility.
- **D-12:** Mobile behavior should preserve access to the same workflows with a practical stacked layout or collapsible navigation; mobile does not need a separate feature set.

### API Wrapper and Contract Decisions
- **D-13:** Reuse `Frontend/Ecommerce-main/my-app/src/api/axios.js` for all admin calls so bearer-token behavior and 401 logout handling stay centralized.
- **D-14:** Extend `adminApi.js` or add small resource-specific admin API modules only when it keeps imports clearer. Do not create a second Axios instance.
- **D-15:** Preserve the existing backend API contracts and response envelopes from `docs/API.md`; add frontend wrappers for missing product, coupon, and contact mutations instead of changing backend routes first.
- **D-16:** Form payloads should be validation-friendly and additive. Do not send unknown fields to backend allowlisted endpoints.
- **D-17:** Prefer predictable admin methods such as `createProduct`, `updateProduct`, `deleteProduct`, `createCoupon`, `deleteCoupon`, `markContactMessageRead`, and `deleteContactMessage`.

### Order Operations
- **D-18:** Order list UI should use existing bounded filters and pagination from `GET /api/admin/orders`.
- **D-19:** Order detail UI should show operationally useful fields: order number, user identity summary, payment status, fulfillment status, items, totals, shipping address, carrier, tracking number, tracking history, and timestamps where available.
- **D-20:** Fulfillment updates should use the existing `PATCH /api/admin/orders/:id/fulfillment` contract and display backend validation/conflict errors without inventing client-only state transitions.
- **D-21:** Do not add new fulfillment states, payment states, refund behavior, or inventory side effects in Phase 13.

### Product, Coupon, and Contact Operations
- **D-22:** Product management should cover list context, create, edit, and delete using existing product endpoints and model fields documented in `docs/API.md`.
- **D-23:** Coupon management should cover list, create, and delete using existing protected coupon endpoints. Coupon editing can be omitted unless an existing backend update endpoint is present.
- **D-24:** Contact management should cover list, mark-read, and delete using existing protected contact endpoints.
- **D-25:** Delete actions should require a confirmation affordance and should surface success/error feedback through existing toast or page-level patterns.
- **D-26:** Image upload pipelines, bulk import, content moderation, and analytics are deferred.

### Testing and Verification
- **D-27:** Add focused frontend tests for the admin guard, admin API wrapper methods, and critical screen behavior. Keep tests behavior-oriented and use Vitest/React Testing Library patterns from Phase 10.
- **D-28:** Backend tests are required only if Phase 13 changes backend code. Existing backend admin tests remain the baseline for backend authorization.
- **D-29:** Verification should include targeted frontend tests first, then frontend build if route/component code changes are broad enough to affect bundling.
- **D-30:** Documentation should mention the admin console route, admin account requirement, supported workflows, and the fact that backend authorization remains mandatory.

### the agent's Discretion
- The implementer may choose exact component names and folder layout, but should prefer small route-level pages under `src/pages` plus reusable admin components when duplication becomes real.
- The implementer may choose whether admin order detail opens as a child route, side panel, or inline section if tests and accessibility remain straightforward.
- The implementer may choose exact empty/loading/error visual treatments if they match existing Tailwind/MUI conventions and do not shift layout unpredictably.
- The implementer may defer low-value polish if the core protected workflows, tests, and docs are complete.

</decisions>

<canonical_refs>
## Canonical References

**Downstream planning and implementation MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/13-admin-store-management-console/13-SPEC.md` - Locked Phase 13 requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase 13 goal, dependencies, success criteria, plan candidates, and cross-cutting constraints.
- `.planning/REQUIREMENTS.md` - `V2-ADM-01` through `V2-ADM-04` traceability.
- `.planning/STATE.md` - Current project state, Phase 9/11/12 blockers, and post-release backlog positioning.

### Prior Phase Carry-Forward
- `.planning/phases/11-operational-monitoring-alerting-and-incident-readiness/11-CONTEXT.md` - No-subagent, dirty-worktree, and no-provider-proof boundaries.
- `.planning/phases/10-frontend-tooling-modernization-and-warning-cleanup/10-CONTEXT.md` - Current Vite/Vitest command state, frontend test patterns, and runtime-major boundaries.
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-CONTEXT.md` - Staging/provider proof remains out of scope for Phase 13.
- `.planning/phases/06-admin-fulfillment-operations/06-CONTEXT.md` - Existing backend admin fulfillment API decisions if deeper order workflow context is needed.

### Frontend Source
- `Frontend/Ecommerce-main/my-app/src/App.js` - Current route tree and place to add protected admin routes.
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` - Existing auth-only guard pattern.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` - Auth state, persisted user/token, and `user.isAdmin` source from backend auth responses.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` - Shared Axios instance, bearer token injection, and 401 logout handling.
- `Frontend/Ecommerce-main/my-app/src/api/adminApi.js` - Existing partial admin order/coupon/contact wrapper target.
- `Frontend/Ecommerce-main/my-app/src/api/adminApi.test.js` - Existing admin wrapper test surface.
- `Frontend/Ecommerce-main/my-app/src/pages/index.js` - Page barrel for new admin route exports if used.
- `Frontend/Ecommerce-main/my-app/src/components/Header.jsx` - Optional shared admin navigation entry point for admin users.
- `Frontend/Ecommerce-main/my-app/src/test/routerTestUtils.jsx` - Existing router test helper for route-oriented tests.

### Backend Contracts and Tests
- `docs/API.md` - Admin endpoint contracts, response envelopes, product fields, pagination, fulfillment rules, and error semantics.
- `Backend/routes/adminOrderRoutes.js` - Protected admin order list/detail/fulfillment routes.
- `Backend/controllers/adminOrderController.js` - Admin order response shape and fulfillment behavior.
- `Backend/routes/productRoutes.js` - Existing protected product create/update/delete endpoints.
- `Backend/controllers/productController.js` - Product list and mutation behavior.
- `Backend/routes/couponRoutes.js` - Existing protected coupon list/create/delete endpoints.
- `Backend/controllers/couponController.js` - Coupon list and mutation behavior.
- `Backend/routes/contactRoutes.js` - Existing protected contact list/mark-read/delete endpoints.
- `Backend/controllers/contactController.js` - Contact admin behavior.
- `Backend/middleware/auth.js` - Backend `protect` and `admin` enforcement boundary.
- `Backend/test/admin-order.test.js` - Existing admin order authorization, list, detail, and fulfillment coverage.
- `Backend/test/admin-list.test.js` - Existing admin coupon/contact list authorization and filtering coverage.
- `Backend/test/validation.test.js` - Existing admin product validation and allowlist coverage.

### Codebase Maps and Commands
- `.planning/codebase/CONVENTIONS.md` - JS/JSX naming, imports, formatting, error handling, and frontend module conventions.
- `.planning/codebase/STRUCTURE.md` - Where to add frontend pages, components, API clients, and stores.
- `.planning/codebase/STACK.md` - React, React Router, Zustand, MUI, Tailwind, npm, and test stack notes; verify against actual package files because generated maps may lag Phase 10.
- `Frontend/Ecommerce-main/my-app/package.json` - Current frontend Vite/Vitest scripts and dependencies.
- `Backend/package.json` - Backend test command if backend code is touched.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProtectedRoute.jsx`: establishes the existing unauthenticated redirect behavior to `/account` with return state.
- `authStore.js`: persists `token`, `user`, and `isAuthenticated`; backend auth responses include `isAdmin`.
- `axios.js`: already attaches bearer tokens and logs users out on 401 responses.
- `adminApi.js`: already wraps order list/detail/fulfillment, coupon list, and contact-message list.
- `adminApi.test.js`: already mocks the Axios instance and can be extended for missing wrapper methods.
- `routerTestUtils.jsx`: provides MemoryRouter helpers with future flags for route tests.
- Existing backend admin tests: provide the proof that backend authorization remains enforced.

### Established Patterns
- Frontend source is JavaScript/JSX with route-level pages under `src/pages` and shared components under `src/components`.
- API modules return unwrapped response `data` from the shared Axios instance.
- Auth and cart state use Zustand; route-local UI state can stay in page components.
- Tests use Vitest and React Testing Library after Phase 10.
- UI uses a mix of Tailwind, MUI, FontAwesome, and existing page/component patterns. Admin screens should stay consistent rather than adding a new UI framework.
- Planning artifacts should record blocked external proof explicitly and must not contain secrets.

### Integration Points
- Admin route access connects `App.js`, a new or extended route guard, `authStore.js`, and route tests.
- Admin API wrappers connect `adminApi.js`, `axios.js`, `docs/API.md`, and wrapper tests.
- Order screens connect `adminApi.getOrders`, `adminApi.getOrder`, `adminApi.updateOrderFulfillment`, backend order contracts, and frontend route state.
- Product screens connect product admin endpoints, product field docs, and validation-friendly form payloads.
- Coupon screens connect list/create/delete endpoints and bounded admin list response metadata.
- Contact screens connect list/mark-read/delete endpoints and read/unread state.
- Documentation connects `docs/API.md`, `docs/DEVELOPMENT.md`, `docs/TESTING.md`, or another existing active doc chosen during planning.

</code_context>

<specifics>
## Specific Ideas

- Auto-selected discussion recommendations were applied per the objective: use existing backend contracts, add frontend admin workflows, avoid backend auth redesign, and keep provider/release proof out of Phase 13.
- Phase 13 should start with the admin route guard and shell because every later admin screen depends on that access boundary.
- Existing `.planning/codebase/STACK.md` still mentions CRA/react-scripts in places; actual `Frontend/Ecommerce-main/my-app/package.json` shows Vite/Vitest and should be treated as current.
- No phase-matched todos were found during this discussion pass.

</specifics>

<deferred>
## Deferred Ideas

- Phase 12 production cutover, release tags, hosted smoke proof, rollback proof, and post-launch review remain separate.
- Admin user provisioning, role management, and multiple permission tiers remain deferred.
- Bulk product import, image upload/CDN workflows, analytics dashboards, and multi-admin audit logs remain deferred.
- Wishlist, reviews, discovery search, guest cart conversion, returns, sustainability content, retention, and lookbook features remain phases 14-21.

</deferred>

---

*Phase: 13-admin-store-management-console*
*Context gathered: 2026-06-20*
