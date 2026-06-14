---
phase: 10-frontend-tooling-modernization-and-warning-cleanup
researched: 2026-06-14
mode: inline-no-subagents
---

# Phase 10 Research: Frontend Tooling Modernization and Warning Cleanup

## Research Summary

Phase 10 should be executed as three dependent waves:

1. Migrate the frontend package from CRA/react-scripts to Vite while preserving the public command contract, `build` output directory, static assets, Tailwind processing, and `REACT_APP_*` env names.
2. Move the frontend test suite from CRA/Jest execution to Vitest/jsdom and clean test warning output without changing test intent.
3. Remove the CRA audit allowlist, update CI/docs, and prove the release gate shape still passes.

Recommendation: do not batch runtime major upgrades into this phase. `npm outdated` shows major updates for React, React DOM, React Router, MUI, FontAwesome, Flowbite, Tailwind, and Zustand, but Phase 10 is specifically about replacing the unmaintained CRA tooling boundary. Pulling those majors into the same lockfile change would make failures harder to diagnose and would violate the approved dependency boundary.

## Skills Used

- `find-skills`: selected existing local skills instead of installing duplicates.
- `react-testing`: kept tests behavior-oriented and React Testing Library based.
- `vitest`: guided config, `vi.*` migration, jsdom environment, setup files, and one-shot command choices.
- `dependency-upgrade`: separated tooling/test dependency changes from runtime major upgrades.
- `ci-cd`: preserved deterministic CI jobs, npm lockfile usage, and explicit command gates.
- `react-best-practices`: guided the `OrderDetail.jsx` hook dependency cleanup toward a normal React-safe refactor instead of warning suppression.

## Source Research

- Vite resolves `vite.config.js` from the project root and supports `defineConfig`; this fits the existing JavaScript app without converting to TypeScript.
  - https://vite.dev/config/
- Vite serves `publicDir` assets at `/` during dev and copies them into the build output, matching the current app's public asset model.
  - https://vite.dev/config/shared-options
- Vite `envPrefix` defaults to `VITE_`, but can expose another prefix through `import.meta.env`; Phase 10 should set `envPrefix: "REACT_APP_"` and keep the prefix non-empty to avoid exposing secrets.
  - https://vite.dev/config/shared-options#envprefix
- Vite can keep `build.outDir` as `build`, and `publicDir` is copied to the output by default.
  - https://vite.dev/config/build-options
- Vitest is Vite-native and requires Vite `>=6.0.0` and Node `>=20.0.0`; current package registry checks support Vite 8 and Vitest 4 on this codebase's Node/GitHub Actions LTS posture.
  - https://vitest.dev/guide/
- Vitest does not enable Jest globals by default, but the `globals` config option is available. The approved path is to enable globals to reduce churn while converting `jest.*` APIs to `vi.*`.
  - https://vitest.dev/guide/migration.html
- Vitest module mock factories must return an object with explicit exports, which matters for the existing API module mocks.
  - https://vitest.dev/guide/migration.html
- React Router v6 future flags can silence the v7 warning path without upgrading to React Router 7. Existing `App.js` already uses `v7_startTransition` and `v7_relativeSplatPath`.
  - https://reactrouter.com/upgrading/v6
  - https://reactrouter.com/6.30.4/upgrading/future

## Current Package Evidence

Latest registry versions checked from `Frontend/Ecommerce-main/my-app` on 2026-06-14:

| Package | Latest |
|---------|--------|
| `vite` | `8.0.16` |
| `@vitejs/plugin-react` | `6.0.2` |
| `vitest` | `4.1.8` |
| `jsdom` | `29.1.1` |
| `@testing-library/react` | `16.3.2` |
| `@testing-library/jest-dom` | `6.9.1` |
| `@testing-library/user-event` | `14.6.1` |

Current frontend `npm outdated --json` shows runtime majors available for React 19, React Router 7, MUI 9, FontAwesome 7, Flowbite 4, Tailwind 4, and Zustand 5. These are deferred by SPEC and CONTEXT decisions.

Current frontend `npm audit --omit=dev --json` reports 46 production vulnerabilities, including a direct `react-scripts` finding and transitive CRA/Jest/Webpack findings. This validates that moving test/build tooling out of production dependencies and removing `react-scripts` is necessary for `TOOL-01` and `TOOL-02`.

## Codebase Findings

- `Frontend/Ecommerce-main/my-app/package.json` currently uses `react-scripts` for `start`, `build`, and `test`, has an `eject` script, and extends `react-app` plus `react-app/jest`.
- Testing Library packages are currently in `dependencies`; they should move to `devDependencies` with Vite/Vitest so production audit no longer includes test-only packages.
- `public/index.html` is CRA-specific, uses `%PUBLIC_URL%`, and contains CRA instructional comments. Vite needs a root `index.html`.
- `src/index.js` imports and calls `reportWebVitals`; no other source path needs it.
- `src/config/config.js` is the only broad `REACT_APP_*` access point and should keep that role by reading a small Vite-compatible env facade.
- Runtime `PUBLIC_URL` usage exists in:
  - `src/services/catalog/normalizeProduct.js`
  - `src/services/catalog/catalogService.js`
  - `src/components/CartSidebar.jsx`
- There are 18 frontend test files and 65 passing tests under CRA/Jest.
- Jest global usage is broad and mechanical: `jest.mock`, `jest.fn`, `jest.clearAllMocks`, `jest.resetModules`, and mocked module factories appear across API, store, page, component, hook, config, and app-shell tests.
- `ProtectedRoute.test.jsx` already demonstrates `MemoryRouter` future flags and should become the router-test helper pattern.
- `CheckoutReturn.test.jsx` uses `MemoryRouter` without future flags and is a known warning target.
- `OrderDetail.jsx` defines `loadOrder` after a `useEffect` that calls it but omits `loadOrder` and `navigate` from dependencies. Current `npm run build` confirms the exact warning.
- Current CRA test command passes: 18 suites, 65 tests.
- Current CRA build passes with warnings: `OrderDetail.jsx` hook dependency, Node `DEP0176`, stale Browserslist data, and CRA deployment messaging.

## Technology Recommendations

1. Add `vite.config.js` with `@vitejs/plugin-react`, `envPrefix: "REACT_APP_"`, `build.outDir: "build"`, Vitest `globals: true`, `environment: "jsdom"`, `setupFiles: "./src/setupTests.js"`, and test include patterns for the existing `src/**/*.test.*` files.
2. Add `postcss.config.js` and explicit `postcss` plus `autoprefixer` dev dependencies so Tailwind 3 processing does not depend on CRA transitive behavior.
3. Replace scripts with `start: vite`, `dev: vite`, `build: vite build`, `test: vitest run`, `test:watch: vitest`, and `preview: vite preview`; remove `eject`.
4. Remove `react-scripts`, `web-vitals`, CRA ESLint presets, and CRA lockfile graph entries.
5. Move Testing Library packages to dev dependencies and upgrade them with Vitest/jsdom.
6. Add `src/config/env.js` or equivalent to expose `readPublicEnv(name, fallback)` over `import.meta.env`, preserving `REACT_APP_*`.
7. Add `src/utils/publicPath.js` or equivalent to normalize `import.meta.env.BASE_URL`, then update catalog/cart/public asset paths to use it.
8. Convert test code to `vi.*`; do not add a global `jest` shim.
9. Add `src/test/routerTestUtils.jsx` or equivalent so route tests consistently set React Router future flags.
10. Fix expected error-path console output with local `vi.spyOn(console, ...)` blocks in tests that intentionally trigger errors; do not remove production diagnostics from app source.
11. Fix `OrderDetail.jsx` with `useCallback` or by moving `loadOrder` inside the effect. Recommendation: `useCallback` keeps cancel/refresh behavior easier to reuse if future tests cover it.
12. Simplify `scripts/ci/check-audits.mjs` so backend and frontend production findings are both blocking, and delete CRA reachability helpers/tests.

## Architecture Recommendations

### Wave 1: Tooling and Runtime Compatibility

Plan `10-01` should change package scripts/dependencies, lockfile, Vite config, root HTML, env/public path helpers, Tailwind/PostCSS config, and `reportWebVitals` removal. This is the base layer all later frontend tests/builds depend on.

### Wave 2: Vitest and Warning Cleanup

Plan `10-02` should convert the full test suite from Jest globals to Vitest APIs, add reusable router test rendering, silence expected console output only inside tests, and fix `OrderDetail.jsx`. This wave proves `TOOL-03` and most of `TOOL-04`.

### Wave 3: Audit, CI, Docs, Final Gate

Plan `10-03` should remove the CRA audit policy, update audit tests, update CI to `npm test`, update active docs, and run the full parity gate. This wave proves `TOOL-02` and records final acceptance evidence.

## Validation Architecture

The validation strategy should use existing local gates, not new frameworks:

- Frontend quick feedback after tooling changes: `cd Frontend/Ecommerce-main/my-app; npm test`.
- Frontend build proof after Vite migration: `cd Frontend/Ecommerce-main/my-app; npm run build`.
- Audit policy proof: `node scripts/ci/check-audits.mjs` and `node --test scripts/ci/check-audits.test.mjs`.
- Static contract proof: `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.
- Backend parity proof after shared audit/CI changes: `cd Backend; npm test`.
- Static cleanup checks:
  - `rg -n "react-scripts|react-app/jest|react-app" Frontend/Ecommerce-main/my-app/package.json Frontend/Ecommerce-main/my-app/package-lock.json`
  - `rg -n "watchAll=false" .github/workflows docs`
  - `rg -n "process\\.env\\.PUBLIC_URL|%PUBLIC_URL%|reportWebVitals" Frontend/Ecommerce-main/my-app`
  - `rg -n "jest\\." Frontend/Ecommerce-main/my-app/src`
  - `rg -n "Accepted frontend CRA|accepted CRA|react-scripts" docs scripts .github/workflows Frontend/Ecommerce-main/my-app/package.json`

## Potential Pitfalls

- `npm test` must be `vitest run`, not watch mode, so CI does not hang.
- Removing `react-scripts` without moving Testing Library packages to dev dependencies may still leave test-only packages in production audit.
- Replacing `process.env` with `import.meta.env` directly across many files creates unnecessary config scatter; keep the env helper.
- Replacing `PUBLIC_URL` with string concatenation in each component risks double slashes and subpath deploy bugs; use one public path helper.
- Vite will not transform `%PUBLIC_URL%` placeholders. Root `index.html` must use normal public-root links and include `/src/index.js`.
- Vitest module mocks differ from Jest when the factory returns a default export; test conversion should inspect failing mocks rather than search/replace blindly.
- React Router future flags must be supplied to test routers too; app-level flags alone do not silence tests that render their own routers.
- Console spies must be scoped per test and restored, otherwise they can hide real diagnostics.
- The audit script should not keep zero-count accepted CRA messaging because reviewers may think a risk acceptance still exists.

## Open Questions

None blocking. Recommendation: proceed with the three-plan split above and keep runtime major upgrades deferred.

---
_Phase 10 Research_
