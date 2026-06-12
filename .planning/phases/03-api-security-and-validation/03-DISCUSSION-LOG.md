# Phase 03: api-security-and-validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 03-api-security-and-validation
**Areas discussed:** skill selection, security plumbing, rate limits, request-size controls, startup config, JWT, error envelopes, validators, dependency remediation, token storage, public config, verification

---

## Skill Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Use local skills | Use local `api-sec`, `jwt-security`, `dependency-upgrade`, and `api-testing`. | yes |
| Install external skills | Install external skills found through `npx skills find`. | |

**User's choice:** Approved recommendation.
**Notes:** External search results were off-stack, duplicate, or lower signal than local skills. No subagents were used.

---

## Security Plumbing

| Option | Description | Selected |
|--------|-------------|----------|
| Small local modules | Add scoped config, security middleware, validation middleware, and validator modules. | yes |
| Inline in controllers | Add security logic directly where each route currently needs it. | |
| Larger framework | Introduce a broader security/auth framework. | |

**User's choice:** Approved recommendation.
**Notes:** Preserve the existing app/server split from Phase 2 so tests can import `Backend/app.js`.

---

## Runtime Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast in startup | Validate required config in `Backend/server.js` startup helpers before DB/listen. | yes |
| Validate during requests | Let JWT/DB/CORS failures surface when routes are hit. | |
| Validate at app import | Run validation when `Backend/app.js` is imported. | |

**User's choice:** Approved recommendation.
**Notes:** Required values are `MONGO_URI`, valid `FRONTEND_URL`, and strong `JWT_SECRET`; optional `PORT` and `JWT_EXPIRE` are validated when present.

---

## Rate Limits

| Option | Description | Selected |
|--------|-------------|----------|
| IP-based local limits | Use `express-rate-limit` with global and high-abuse route limits. | yes |
| Distributed limits | Add Redis or another shared store now. | |
| Account/email limits | Key auth limits by account or email now. | |

**User's choice:** Approved recommendation.
**Notes:** Approved defaults: global `/api` `300/15min`; auth register/login `5/15min`; contact `5/hour`; coupon validate `30/15min`.

---

## Request Size Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Route-aware JSON caps | Use stricter `8kb` caps on auth/coupon/contact and `64kb` elsewhere. | yes |
| Global-only cap | Use a single global `64kb` JSON cap. | |
| Controller validation only | Let controllers reject large payload fields after parsing. | |

**User's choice:** Approved recommendation.
**Notes:** Oversized bodies should return a stable JSON `413` before controller persistence.

---

## JWT Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Compatible hardening | Keep `{ id }`, default `1h`, sign `HS256`, verify allowed algorithms. | yes |
| Payload migration | Move to `sub` or a different token contract now. | |
| Session architecture | Replace bearer JWT with cookies or refresh rotation now. | |

**User's choice:** Approved recommendation.
**Notes:** This phase stays inside the current bearer-token model.

---

## Error Envelopes

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve envelope | Keep `{ success: false, message }` and optionally add `errors`. | yes |
| New error schema | Replace all errors with a new structured format. | |
| Raw validation errors | Return library/database messages directly. | |

**User's choice:** Approved recommendation.
**Notes:** Known security failures get stable messages; unexpected `500` responses stay generic to clients.

---

## Validators and DTOs

| Option | Description | Selected |
|--------|-------------|----------|
| Strict Zod schemas | Reject unknown write fields and map only validated DTOs. | yes |
| Strip unknown fields | Silently drop extras and continue. | |
| Mongoose-only validation | Keep relying on schema validation and controller destructuring. | |

**User's choice:** Approved recommendation.
**Notes:** Applies to auth/profile/address, cart, order, contact, product, and coupon writes.

---

## Query and Param Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit bounds | Validate ObjectIds, allow known query values, cap product `limit` at `100`. | yes |
| Clamp silently | Coerce invalid values into defaults where possible. | |
| Database errors | Let invalid params reach Mongoose/controllers. | |

**User's choice:** Approved recommendation.
**Notes:** Product query validation should protect public browsing paths without changing catalog architecture.

---

## Dependency Remediation

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted patch/minor | Upgrade direct vulnerable packages within current major lines first. | yes |
| Big-bang majors | Move to Express 5, Mongoose 9, Router 7, React 19, or Vite now. | |
| Document only | Skip upgrades and record accepted risk only. | |

**User's choice:** Approved recommendation.
**Notes:** Backend direct targets: Express, Mongoose, CORS. Frontend direct targets: Axios, React Router DOM, styled-components.

---

## Audit Risk Register

| Option | Description | Selected |
|--------|-------------|----------|
| Phase risk register | Document remaining audit findings under the Phase 3 directory. | yes |
| Top-level security doc only | Put all audit details in a global doc. | |
| No risk register | Require both audits to become clean before completion. | |

**User's choice:** Approved recommendation.
**Notes:** Remaining `react-scripts` chains are likely accepted/deferred risk unless direct remediation proves otherwise.

---

## Frontend Token Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Session storage | Move Zustand auth persistence from localStorage to sessionStorage. | yes |
| Keep localStorage | Accept current persistence and document compensating controls only. | |
| Cookie sessions | Rebuild auth around HttpOnly cookies and refresh tokens now. | |

**User's choice:** Approved recommendation.
**Notes:** Preserve login, logout, auth header attachment, and logout-on-401 behavior.

---

## Public Map Config

| Option | Description | Selected |
|--------|-------------|----------|
| Remove fallback key | Require env configuration and degrade the map gracefully when missing. | yes |
| Keep fallback documented | Leave fallback in source and document it as public/demo-only. | |
| Remove map | Disable map rendering entirely until a key exists. | |

**User's choice:** Approved recommendation.
**Notes:** Browser map keys are public, but production should not silently depend on a source fallback.

---

## Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Full Phase 3 gate | Backend tests, frontend tests, frontend build, audits, and static checker. | yes |
| Tests only | Run backend/frontend tests but skip audits and build. | |
| Audit only | Focus on dependency output and skip behavior tests. | |

**User's choice:** Approved recommendation.
**Notes:** Docs must be updated where behavior/config/commands change.

---

## Agent Discretion

- Exact names and grouping for validators/config helpers may vary if the same decisions remain enforceable.
- Test seams may use any deterministic reset/override approach that avoids rate-limit flakiness.
- Small shared error helpers are allowed if they preserve existing API envelopes.

## Deferred Ideas

- Distributed or account-aware rate limiting.
- HttpOnly cookie or refresh-token auth architecture.
- Full CRA-to-Vite/frontend tooling migration unless security remediation forces it.
- Payment, inventory transaction, admin fulfillment, CI, and observability work.
