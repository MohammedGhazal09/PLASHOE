---
phase: 10
slug: frontend-tooling-modernization-and-warning-cleanup
created: 2026-06-14
mode: inline-no-subagents
---

# Phase 10 Pattern Map

## Purpose

Map Phase 10 files to existing local patterns so execution can be concrete without expanding scope.

## Tooling and Package Boundary

| File | Role | Existing Pattern | Phase 10 Use |
|------|------|------------------|--------------|
| `Frontend/Ecommerce-main/my-app/package.json` | Frontend command and dependency contract | Current nested npm app uses scripts as public commands | Preserve `start`, `build`, and `test` names while replacing internals with Vite/Vitest. |
| `Frontend/Ecommerce-main/my-app/package-lock.json` | Deterministic npm dependency graph | Existing CI uses npm cache keyed by nested lockfile | Regenerate through npm install/uninstall commands; do not hand-edit. |
| `Frontend/Ecommerce-main/my-app/tailwind.config.js` | Tailwind scan/theme config | Tailwind 3 scans `./src/**/*.{html,js,jsx}` | Keep Tailwind 3 and add PostCSS config rather than changing styling. |
| `.github/workflows/ci.yml` | CI command contract | Backend, frontend, static-contracts, audit-policy jobs are separate | Keep job shape and replace only the frontend test command. |

## Vite Runtime Compatibility

| File | Role | Existing Pattern | Phase 10 Use |
|------|------|------------------|--------------|
| `Frontend/Ecommerce-main/my-app/public/index.html` | CRA HTML template | `%PUBLIC_URL%` placeholders and CRA comments | Use as content source when creating root `index.html`; remove CRA-only placeholders/comments. |
| `Frontend/Ecommerce-main/my-app/src/index.js` | React root bootstrap | React 18 `createRoot`, StrictMode, App render | Keep bootstrap; remove `reportWebVitals` import/call. |
| `Frontend/Ecommerce-main/my-app/src/config/config.js` | Public env facade | Centralizes all `REACT_APP_*` reads | Keep this as caller-facing config; back it with a Vite env helper. |
| `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js` | Render-ready product image normalization | Builds relative product image URLs with `PUBLIC_URL` | Replace with a public-path helper using `import.meta.env.BASE_URL`. |
| `Frontend/Ecommerce-main/my-app/src/services/catalog/catalogService.js` | Fallback catalog database loading | Fetches `database/database.json` from public assets | Use the same public-path helper for fallback JSON fetch. |
| `Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx` | Cart image rendering | Prefixes cart image path with `PUBLIC_URL` | Use the shared public-path helper for cart item images. |

## Test Harness

| File/Glob | Role | Existing Pattern | Phase 10 Use |
|-----------|------|------------------|--------------|
| `Frontend/Ecommerce-main/my-app/src/setupTests.js` | Jest DOM setup | Imports `@testing-library/jest-dom` | Keep setup file, update comments/import only if needed for Vitest. |
| `Frontend/Ecommerce-main/my-app/src/**/*.test.*` | Frontend tests | Co-located user-facing RTL tests | Convert `jest.*` to `vi.*`, keep behavior assertions. |
| `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.test.jsx` | Router future flag example | Uses `MemoryRouter` future flags | Extract this pattern into a reusable router test helper. |
| `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.test.jsx` | Known router warning target | Uses `MemoryRouter` without future flags | Update to helper so future-flag warnings are silent. |
| `Frontend/Ecommerce-main/my-app/src/config/config.test.js` | Env-module reload test | Uses `jest.resetModules` and `process.env` | Convert to Vite-compatible env stubbing/import reset. |

## Warning Targets

| File | Current Warning Surface | Phase 10 Use |
|------|-------------------------|--------------|
| `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx` | `react-hooks/exhaustive-deps` warning for `loadOrder` and `navigate` | Refactor with `useCallback` or move async load into effect. |
| `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` | Production `console.error` on checkout error paths | Keep diagnostics in source; silence expected test paths locally if they leak. |
| `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` | Production `console.error` on order load failure | Keep diagnostics in source; test-only spies if needed. |
| `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` | Production `console.error` on cart failure paths | Keep diagnostics in source; test-only spies if needed. |

## Audit and Documentation

| File | Role | Existing Pattern | Phase 10 Use |
|------|------|------------------|--------------|
| `scripts/ci/check-audits.mjs` | Production audit policy | Has helper functions and exported pure functions tested by `node:test` | Simplify to backend/frontend blocking policy and keep pure tests around evaluation behavior. |
| `scripts/ci/check-audits.test.mjs` | Audit unit tests | Uses Node built-in test runner and assert | Replace CRA reachability tests with blocking frontend finding tests. |
| `docs/TESTING.md` | Primary test/audit docs | Includes current commands and historical snapshots | Update active commands to Vitest; preserve historical snapshots only if clearly historical. |
| `docs/DEVELOPMENT.md` | Local frontend dev commands | Mentions `react-scripts` build/test | Update dev server port and Vite commands. |
| `docs/DEPLOYMENT.md` | Build/audit gate commands | Mentions CRA Jest command | Update static build/test command contract. |
| `docs/CONFIGURATION.md` | Env behavior | Mentions `PUBLIC_URL` and CRA env behavior | Explain preserved `REACT_APP_*` under Vite and remove active `PUBLIC_URL` requirement. |
| `docs/GETTING-STARTED.md` | Onboarding commands | Mentions CRA/old frontend tests | Update to Vite/Vitest commands. |

## Artifacts Expected From Phase 10

- `Frontend/Ecommerce-main/my-app/vite.config.js`
- `Frontend/Ecommerce-main/my-app/postcss.config.js`
- `Frontend/Ecommerce-main/my-app/index.html`
- `Frontend/Ecommerce-main/my-app/src/config/env.js`
- `Frontend/Ecommerce-main/my-app/src/utils/publicPath.js`
- `Frontend/Ecommerce-main/my-app/src/test/routerTestUtils.jsx`
- Updated frontend package scripts/dependencies/lockfile.
- Updated frontend tests using `vi.*`.
- Updated audit policy and active docs.
