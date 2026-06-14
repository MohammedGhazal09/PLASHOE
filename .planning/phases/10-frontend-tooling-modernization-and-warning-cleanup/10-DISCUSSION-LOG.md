# Phase 10: frontend-tooling-modernization-and-warning-cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 10-frontend-tooling-modernization-and-warning-cleanup
**Areas discussed:** Toolchain version line, Vite build/dev configuration, Vitest migration, environment and public asset compatibility, Tailwind and browser target handling, CRA artifact removal, audit policy cleanup, warning cleanup enforcement, dependency upgrade boundary, documentation and verification

---

## Toolchain Version Line

| Option | Description | Selected |
|--------|-------------|----------|
| Latest stable Vite 8/Vitest 4 | Use current maintained Vite/Vitest and plugin-react versions. | Yes |
| Older Vite 7/Vitest 3 | Avoid newest major line. | |
| Conservative pinned versions | Pin lower known versions manually. | |

**User's choice:** Approved recommendation.
**Notes:** Current official docs and npm registry checks support the latest stable Vite/Vitest path.

---

## Vite Build and Dev Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `build` output | Configure Vite `build.outDir = "build"` to preserve deployment assumptions. | Yes |
| Switch to `dist` | Use Vite default output folder and update all docs/deployment assumptions. | |
| Use dev port 5173 | Keep Vite default dev server port. | Yes |
| Force dev port 3000 | Preserve old CRA dev server port exactly. | |
| CRA-compatible command aliases | Preserve `npm start`, `npm test`, and `npm run build`, while adding Vite-standard commands. | Yes |

**User's choice:** Approved recommendations.
**Notes:** Preserving output and command contracts reduces deployment and CI churn while allowing the dev server to follow Vite defaults.

---

## Vitest Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Enable globals and convert `jest.*` to `vi.*` | Minimize imports while removing Jest-specific APIs honestly. | Yes |
| Import test APIs everywhere | More explicit but creates more churn. | |
| Add a `jest` shim | Hides migration and risks brittle compatibility. | |
| Use `jsdom` | Match current React Testing Library DOM expectations. | Yes |
| Use `happy-dom` or browser runner | Alternative environments not required by current tests. | |
| Upgrade Testing Library packages | Remove old warning surface during the runner migration. | Yes |

**User's choice:** Approved recommendations.
**Notes:** Current tests are user-facing RTL tests and do not require a real browser runner.

---

## Environment and Public Asset Compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Vite `envPrefix: "REACT_APP_"` plus env helper | Preserve public env names and centralize access. | Yes |
| Use `import.meta.env` directly everywhere | Works, but scatters config access. | |
| Polyfill `process.env` | Preserves old syntax but keeps CRA-shaped assumptions. | |
| Use `import.meta.env.BASE_URL` public-path helper | Replace `PUBLIC_URL` without adding a new env var. | Yes |
| Add `REACT_APP_PUBLIC_URL` | Adds new config surface unnecessarily. | |
| Create root `index.html` | Adopt Vite entry model and remove CRA placeholders. | Yes |

**User's choice:** Approved recommendations.
**Notes:** Live code currently centralizes `REACT_APP_*` in `src/config/config.js`, while `PUBLIC_URL` appears in product/catalog/cart image paths.

---

## Tailwind and Browser Target Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Tailwind 3 and add explicit PostCSS deps if needed | Preserve styling behavior and replace CRA transitive build dependencies only as needed. | Yes |
| Upgrade Tailwind 4 | Larger visual/tooling migration outside Phase 10. | |
| Remove Browserslist only if unused | Avoid stale CRA config while preserving necessary PostCSS behavior. | Yes |
| Keep Browserslist unconditionally | May preserve stale warning surface. | |

**User's choice:** Approved recommendations.
**Notes:** Phase 10 acceptance targets warning cleanup, not a browser-support redesign.

---

## CRA Artifact Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Remove `reportWebVitals.js` and `web-vitals` if unused | Drop CRA-era dead code. | Yes |
| Keep `web-vitals` | Preserve unused monitoring helper. | |
| Defer | Leave stale artifact for later. | |

**User's choice:** Approved recommendation.
**Notes:** Phase 11 owns deliberate monitoring and alerting.

---

## Audit Policy Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Delete CRA allowlist logic | Make frontend production audit findings blocking again. | Yes |
| Leave unused helpers | Keeps obsolete CRA code around. | |
| Keep accepted count at zero | Less direct than removing the accepted-risk machinery. | |

**User's choice:** Approved recommendation.
**Notes:** `scripts/ci/check-audits.test.mjs` currently encodes CRA reachability acceptance and must be updated with the policy change.

---

## Warning Cleanup Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted checks where stable | Catch known warning regressions without brittle full-log parsing. | Yes |
| Manual verification only | Lower automation, more reviewer burden. | |
| Broad command wrappers | Fragile and likely to fail on harmless output. | |
| Shared router test helper | Apply React Router future flags consistently in route tests. | Yes |
| Scoped console spies in tests | Silence expected error-path logs without removing production diagnostics. | Yes |

**User's choice:** Approved recommendations.
**Notes:** `CheckoutReturn.test.jsx` lacks future flags; production code already keeps BrowserRouter future flags.

---

## Dependency Upgrade Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Tooling/test deps plus direct migration requirements | Keeps Phase 10 bounded to tooling modernization. | Yes |
| All outdated frontend deps | Would pull in broad runtime major upgrades. | |
| Runtime majors too | Explicitly outside Phase 10. | |

**User's choice:** Approved recommendation.
**Notes:** `npm outdated` shows many runtime majors, but React/MUI/Router/FontAwesome/Flowbite/Zustand/Tailwind majors stay deferred.

---

## Documentation and Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Update all active CRA-facing docs | Fix user-facing docs that describe CRA/react-scripts or CRA env behavior. | Yes |
| Update only `docs/TESTING.md` | Too narrow for the active docs surface. | |
| Regenerate codebase maps | Generated map refresh is not required for Phase 10. | |
| CI parity verification | Run frontend tests/build, audit policy, static checker, and backend tests because CI/audit scripts change. | Yes |
| Frontend-only verification | Too narrow after changing CI/audit scripts. | |

**User's choice:** Approved recommendations.
**Notes:** Active docs include `TESTING`, `DEVELOPMENT`, `DEPLOYMENT`, `CONFIGURATION`, and `GETTING-STARTED`.

---

## the agent's Discretion

- Exact helper filenames for env and public path compatibility.
- Whether Vite and Vitest config are combined or split.
- Exact targeted warning checks, if any.
- Exact wording of active docs, provided CRA/react-scripts guidance is removed.

## Deferred Ideas

- React 19 upgrade.
- React Router 7 upgrade.
- Tailwind 4 upgrade.
- MUI, FontAwesome, Flowbite, Zustand, and other runtime major upgrades.
- TypeScript migration.
- Browser E2E, Lighthouse, visual regression, and hard coverage thresholds.
- Generated codebase map refresh.
