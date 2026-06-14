# Phase 10: frontend-tooling-modernization-and-warning-cleanup - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 10 replaces the PLASHOE frontend's CRA/react-scripts build and test stack with maintained Vite/Vitest tooling, removes the accepted CRA audit exception, and makes routine frontend test/build output clean enough that new warnings are visible. The phase is implementation-only around tooling, tests, docs, CI command wiring, audit policy, and known warning cleanup; product behavior and runtime feature scope remain unchanged.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**9 requirements are locked.** See `10-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `10-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- In-place migration of `Frontend/Ecommerce-main/my-app` from CRA/react-scripts to Vite.
- Migration of frontend tests from CRA/Jest execution to Vitest with React Testing Library.
- Conversion of frontend test mocks/spies/timers from `jest.*` to Vitest-compatible APIs where required.
- Vite configuration needed to preserve existing `REACT_APP_*` environment variable names.
- Static asset and HTML entry changes required by Vite.
- GitHub Actions frontend command update from CRA one-shot test flags to the new Vitest one-shot command.
- Removal of CRA/react-scripts accepted-risk logic from `scripts/ci/check-audits.mjs` and its tests.
- Cleanup of known frontend test/build warnings listed in Phase 10.
- Documentation updates that remove active CRA instructions and record the new commands.

**Out of scope (from SPEC.md):**
- React 19 or other React major upgrade - Phase 10 is tooling migration, not a runtime framework migration.
- React Router 7 upgrade - existing React Router 6 behavior should be preserved while warnings are cleaned.
- Tailwind 4 or broad visual/styling migration - visual output should remain stable.
- TypeScript migration - the project is currently JavaScript and this phase should not expand language scope.
- New E2E, browser, Lighthouse, or visual regression framework - Phase 10 is local build/test tooling cleanup.
- Hard coverage thresholds - coverage policy remains deferred until broader stable coverage exists.
- New storefront features, route redesigns, checkout behavior changes, payment-provider changes, or cart model changes - these are product changes, not tooling cleanup.
- Production cutover, external staging setup, monitoring, alerting, or backup verification - those remain in Phases 9, 11, and 12.

</spec_lock>

<decisions>
## Implementation Decisions

### Skill and Workflow Boundaries
- **D-01:** Use installed local skills as supporting guidance: `react-best-practices`, `react-testing`, `dependency-upgrade`, and `ci-cd`.
- **D-02:** Do all work inline and do not use subagents. This carries forward the repository instruction and prior GSD decisions.
- **D-03:** Preserve unrelated dirty/untracked planning placeholders. Stage only explicit Phase 10 artifacts or files changed by the approved Phase 10 implementation.

### Vite and Vitest Baseline
- **D-04:** Target latest stable Vite 8, Vitest 4, and `@vitejs/plugin-react` for the migration.
- **D-05:** Configure Vite to emit production output to `build` instead of Vite's default `dist` so existing deployment assumptions remain stable.
- **D-06:** Use Vite's default dev server port `5173`; do not force the old CRA `3000` port.
- **D-07:** Set frontend scripts to preserve existing command contracts while adding standard Vite commands: `start: vite`, `dev: vite`, `build: vite build`, `test: vitest run`, `test:watch: vitest`, and `preview: vite preview`.

### Vitest Test Migration
- **D-08:** Enable Vitest globals to reduce churn, but convert project test code from `jest.*` to `vi.*`. Do not add a `jest` global shim.
- **D-09:** Use `jsdom` as the Vitest test environment because current React Testing Library tests rely on DOM APIs but do not require a real browser runner.
- **D-10:** Upgrade Testing Library packages as part of the test-runner migration so the old CRA/Testing Library warning surface is not preserved.
- **D-11:** Keep test intent user-facing and behavior-oriented. Do not replace current tests with snapshots or implementation-detail assertions.

### Environment and Public Asset Compatibility
- **D-12:** Preserve the public `REACT_APP_*` variable names by configuring Vite with `envPrefix: "REACT_APP_"`.
- **D-13:** Add a small frontend env helper so source code reads a controlled env facade instead of scattering `import.meta.env` across components and services.
- **D-14:** Replace `process.env.PUBLIC_URL` with a public-path helper based on `import.meta.env.BASE_URL`. Do not add a new `REACT_APP_PUBLIC_URL`.
- **D-15:** Create a root `Frontend/Ecommerce-main/my-app/index.html` for Vite, remove CRA `%PUBLIC_URL%` placeholders/comments, and keep needed static assets under `public`.

### Styling, Browser Targets, and CRA Artifact Removal
- **D-16:** Keep Tailwind 3.x. Add explicit `postcss` and `autoprefixer` dev dependencies only if the Vite/Tailwind setup requires them.
- **D-17:** Remove the CRA-era Browserslist block only if Vite/PostCSS no longer needs it. Otherwise update lockfile data and verify the stale Browserslist warning is gone.
- **D-18:** Remove `reportWebVitals.js` and `web-vitals` if no code path uses them after Vite migration. Phase 11 owns intentional monitoring.

### Audit Policy Cleanup
- **D-19:** Delete the CRA/react-scripts allowlist and reachability logic from `scripts/ci/check-audits.mjs`.
- **D-20:** Update `scripts/ci/check-audits.test.mjs` so all frontend production audit findings are blocking unless a future non-CRA accepted risk is explicitly added outside Phase 10.
- **D-21:** The audit-policy output should no longer print an accepted CRA/react-scripts finding count.

### Warning Cleanup
- **D-22:** Use targeted static or log checks only where stable. Avoid broad brittle warning scanners around every command.
- **D-23:** Create or reuse a router test helper that supplies React Router future flags for route-oriented tests. Do not upgrade to React Router 7 in this phase.
- **D-24:** Silence expected error-path `console.error` or `console.warn` output in tests with scoped `vi.spyOn(console, ...)` and restore the spy in the same test. Do not remove useful production diagnostics just to clean test output.
- **D-25:** Fix the `OrderDetail.jsx` hook dependency warning through a normal React-safe refactor, such as `useCallback` or moving the load function into the effect, while preserving navigation and order-loading behavior.

### Dependency Upgrade Boundary
- **D-26:** Upgrade only tooling/test dependencies and direct migration requirements. Do not upgrade React, React DOM, React Router, MUI, FontAwesome, Flowbite, Zustand, Tailwind major, or other runtime majors during Phase 10.
- **D-27:** Keep npm and `package-lock.json`; do not switch to pnpm, yarn, Bun, or another package manager.
- **D-28:** Do not use `npm update` broadly. Apply migration dependencies intentionally and regenerate the lockfile through npm install commands for the selected packages.

### Documentation and Verification
- **D-29:** Update active docs that currently describe CRA commands or CRA env behavior: `docs/TESTING.md`, `docs/DEVELOPMENT.md`, `docs/DEPLOYMENT.md`, `docs/CONFIGURATION.md`, and `docs/GETTING-STARTED.md`.
- **D-30:** Do not regenerate `.planning/codebase/*.md` during Phase 10 unless a separate docs-update workflow explicitly refreshes generated maps.
- **D-31:** Final verification should include frontend `npm test`, frontend `npm run build`, `node scripts/ci/check-audits.mjs`, `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs`, and backend `npm test` because CI/audit scripts change.
- **D-32:** CI should keep the existing gate shape but replace the frontend test command with the new Vitest one-shot `npm test`; remove `--watchAll=false`.

### the agent's Discretion
- The planner may choose exact helper filenames for the env and public-path helpers if the helpers are small, explicit, and tested.
- The planner may choose whether Vite and Vitest config live in one `vite.config.js` or a split Vitest config, as long as duplication is low and the command contract is clear.
- The planner may choose exact targeted warning checks if they are stable and do not turn routine command output into a brittle parser.
- The planner may choose exact doc wording, but active docs must no longer instruct users to use CRA/react-scripts or `--watchAll=false`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/10-frontend-tooling-modernization-and-warning-cleanup/10-SPEC.md` - Locked Phase 10 requirements, boundaries, constraints, and acceptance criteria. MUST read before planning.
- `.planning/ROADMAP.md` - Phase 10 goal, canonical refs, success criteria, plan candidates, and cross-cutting constraints.
- `.planning/REQUIREMENTS.md` - `TOOL-01` through `TOOL-04` traceability plus deferred `V2-04` platform work.
- `.planning/STATE.md` - Current project state, Phase 9 external blocker, and known frontend tooling risks.

### Prior Phase Carry-Forward
- `.planning/phases/09-production-launch-setup-and-staging-verification/09-CONTEXT.md` - Staging proof boundaries and explicit deferral of frontend tooling to Phase 10.
- `.planning/phases/08-ci-cd-observability-and-deployment-readiness/08-CONTEXT.md` - CI command shape, audit policy, known warning documentation, and no-subagent decisions.
- `.planning/phases/07-catalog-and-frontend-architecture-cleanup/07-CONTEXT.md` - Product/catalog normalization, public asset, API module, cart normalization, and frontend test boundaries to preserve.

### Frontend Tooling and Config Source
- `Frontend/Ecommerce-main/my-app/package.json` - Current CRA scripts, dependencies, browserslist, ESLint config, and migration target.
- `Frontend/Ecommerce-main/my-app/package-lock.json` - Current frontend lockfile and CRA/react-scripts dependency graph to remove.
- `Frontend/Ecommerce-main/my-app/public/index.html` - CRA HTML shell and `%PUBLIC_URL%` placeholders to replace with Vite root HTML.
- `Frontend/Ecommerce-main/my-app/src/index.js` - React 18 root bootstrap and current `reportWebVitals` import/removal target.
- `Frontend/Ecommerce-main/my-app/src/config/config.js` - Central public `REACT_APP_*` config facade that must remain the single source for frontend config.
- `Frontend/Ecommerce-main/my-app/src/setupTests.js` - Current Jest DOM setup target for Vitest setup conversion.
- `Frontend/Ecommerce-main/my-app/tailwind.config.js` - Tailwind 3 config that must continue scanning source files after Vite migration.

### Frontend Warning and Compatibility Targets
- `Frontend/Ecommerce-main/my-app/src/App.js` - BrowserRouter future flags and customer-facing route definitions to preserve.
- `Frontend/Ecommerce-main/my-app/src/pages/CheckoutReturn.test.jsx` - Route test missing future flags and using Jest mocks.
- `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx` - Existing hook dependency warning target.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js` - `process.env.PUBLIC_URL` usage and render-ready image helper target.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/catalogService.js` - `process.env.PUBLIC_URL` usage for fallback database loading.
- `Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx` - `process.env.PUBLIC_URL` usage for cart item image rendering.
- `Frontend/Ecommerce-main/my-app/src/**/*.test.*` - Jest mock/spies/timer API conversion surface.

### CI, Audit, and Docs
- `.github/workflows/ci.yml` - Frontend test command update target; gate shape should stay backend/frontend/static/audit.
- `scripts/ci/check-audits.mjs` - CRA/react-scripts accepted-risk logic removal target.
- `scripts/ci/check-audits.test.mjs` - Audit policy tests that currently encode CRA/react-scripts reachability acceptance.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Static contract checker that must keep passing.
- `docs/TESTING.md` - Test commands, CI integration, known warnings, and audit policy documentation target.
- `docs/DEVELOPMENT.md` - Frontend development command and tooling documentation target.
- `docs/DEPLOYMENT.md` - Frontend static build command and audit gate documentation target.
- `docs/CONFIGURATION.md` - `REACT_APP_*`, build-time config, and CRA env behavior documentation target.
- `docs/GETTING-STARTED.md` - Local frontend dev server and troubleshooting documentation target.

### Official External References Checked During Discussion
- `https://vite.dev/guide/` - Vite current version behavior, scripts, Node requirement, project root, and root `index.html`.
- `https://vite.dev/config/shared-options.html#envprefix` - `envPrefix` behavior and security note.
- `https://vitest.dev/guide/migration.html` - Jest-to-Vitest globals and migration differences.
- `https://vitest.dev/config/` - Vitest config, environment, setup files, and Vite config integration.
- `https://reactrouter.com/upgrading/v6` - React Router v6 future flags used to eliminate v7 warning noise without upgrading to v7.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Frontend/Ecommerce-main/my-app/src/config/config.js`: centralizes frontend public configuration and should remain the only broad config access point.
- `Frontend/Ecommerce-main/my-app/src/App.js`: already passes `v7_startTransition` and `v7_relativeSplatPath` to `BrowserRouter`; tests should mirror this.
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.test.jsx`: already uses `MemoryRouter` with the relevant future flags and can inform a shared test router helper.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js`: already has a render-ready image helper that can be moved to or backed by a public-path helper.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/catalogService.js`: already centralizes fallback database loading and can use the same public-path helper.
- `scripts/ci/check-audits.test.mjs`: current tests make the CRA allowlist behavior explicit, so they are the right regression surface for audit-policy removal.

### Established Patterns
- Frontend source is JavaScript/JSX, not TypeScript.
- Frontend tests are co-located under `src/**/*.test.*` and use React Testing Library with user-facing assertions.
- Frontend mocks currently use CRA/Jest globals heavily; conversion should be mechanical and focused.
- Project CI is split into backend, frontend, static contract checker, and audit policy jobs.
- Prior phases prefer preserving command contracts and documentation over introducing new workflow shapes.
- Phase docs and verification artifacts avoid secrets, broad resets, and unrelated changes.

### Integration Points
- Vite config connects `package.json`, root `index.html`, `src/index.js`, `src/config/config.js`, public assets, Tailwind config, and output directory behavior.
- Vitest config connects `src/setupTests.js`, Testing Library packages, `src/**/*.test.*`, jsdom, and `vi.*` mock conversion.
- Public path compatibility connects `normalizeProduct.js`, `catalogService.js`, `CartSidebar.jsx`, Vite `base`, and static assets under `public`.
- Router warning cleanup connects `App.js`, `ProtectedRoute.test.jsx`, `CheckoutReturn.test.jsx`, and any shared test render helper.
- Audit cleanup connects `scripts/ci/check-audits.mjs`, `scripts/ci/check-audits.test.mjs`, `package-lock.json`, `docs/TESTING.md`, and `.github/workflows/ci.yml`.
- Documentation cleanup connects all active docs that currently mention CRA, react-scripts, `--watchAll=false`, or CRA env behavior.

</code_context>

<specifics>
## Specific Ideas

- User approved all Phase 10 discussion recommendations on 2026-06-14.
- No phase-matched todos were found during discussion.
- No existing Phase 10 `CONTEXT.md`, plans, or discussion checkpoint were present when context capture started.
- Live package registry checks during discussion showed current latest versions: Vite 8.0.16, `@vitejs/plugin-react` 6.0.2, Vitest 4.1.8, jsdom 29.1.1, `@testing-library/react` 16.3.2, `@testing-library/jest-dom` 6.9.1, and `@testing-library/user-event` 14.6.1.
- `npm outdated --json` in the frontend shows many runtime majors are available, but Phase 10 intentionally does not take React 19, React Router 7, MUI 9, FontAwesome 7, Flowbite 4, Zustand 5, Tailwind 4, or broad runtime major upgrades.
- Current source uses `process.env.REACT_APP_*` only through `src/config/config.js` and `process.env.PUBLIC_URL` in product/catalog/cart image paths.
- Current `public/index.html` is still CRA-specific and includes `%PUBLIC_URL%` placeholders and CRA instructional comments.
- Current frontend has 18 test files and many `jest.*` usages, so the migration should expect a broad but mechanical test API conversion.
- Current worktree still has unrelated untracked phase placeholder files; Phase 10 planning should avoid broad staging and preserve them.

</specifics>

<deferred>
## Deferred Ideas

- React 19 upgrade remains outside Phase 10.
- React Router 7 upgrade remains outside Phase 10.
- Tailwind 4 upgrade remains outside Phase 10.
- MUI, FontAwesome, Flowbite, Zustand, and other runtime major upgrades remain outside Phase 10 unless a direct migration blocker is proven.
- TypeScript migration remains outside Phase 10.
- Browser E2E, Lighthouse, visual regression, and hard coverage thresholds remain outside Phase 10.
- Generated `.planning/codebase/*.md` map refresh remains deferred unless a docs-update workflow refreshes generated maps.

</deferred>

---

*Phase: 10-frontend-tooling-modernization-and-warning-cleanup*
*Context gathered: 2026-06-14*
