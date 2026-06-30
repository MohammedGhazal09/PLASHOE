# Phase 29 Context

## Existing System

- `/admin` was previously blocked for authenticated non-admin users by `AdminRoute`.
- Admin screens call `adminApi` wrappers directly.
- Backend admin APIs remain protected by bearer auth plus admin authorization.

## Decision

Use a frontend demo context for portfolio reviewers instead of changing backend roles. Demo mode serves sanitized sample data from `adminApi`, disables the active admin section controls, and rejects mutation wrappers before HTTP requests.

## Boundary

The demo preview is a portfolio surface only. It does not set `user.isAdmin`, call protected admin read endpoints, or weaken backend middleware.
