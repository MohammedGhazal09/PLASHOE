---
phase: 10-frontend-tooling-modernization-and-warning-cleanup
plan: 01
subsystem: tooling
tags: [vite, vitest, react, npm, public-assets]
requires:
  - phase: 09-production-launch-setup-and-staging-verification
    provides: production-readiness context and deferred frontend tooling risk
provides:
  - Vite frontend package contract without react-scripts
  - Vite root HTML shell writing production output to build
  - Vite-compatible public env and public asset helpers
affects: [frontend, ci, audit-policy, docs]
tech-stack:
  added: [vite, "@vitejs/plugin-react", vitest, jsdom, postcss, autoprefixer]
  patterns:
    - Vite config preserves REACT_APP_* through envPrefix
    - import.meta.env is isolated behind frontend helpers
    - public assets are joined through a BASE_URL helper
key-files:
  created:
    - Frontend/Ecommerce-main/my-app/vite.config.js
    - Frontend/Ecommerce-main/my-app/postcss.config.js
    - Frontend/Ecommerce-main/my-app/index.html
    - Frontend/Ecommerce-main/my-app/src/config/env.js
    - Frontend/Ecommerce-main/my-app/src/utils/publicPath.js
    - Frontend/Ecommerce-main/my-app/src/utils/publicPath.test.js
  modified:
    - Frontend/Ecommerce-main/my-app/package.json
    - Frontend/Ecommerce-main/my-app/package-lock.json
    - Frontend/Ecommerce-main/my-app/src/index.js
    - Frontend/Ecommerce-main/my-app/src/config/config.js
    - Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js
    - Frontend/Ecommerce-main/my-app/src/services/catalog/catalogService.js
    - Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx
key-decisions:
  - "Pinned React 18 type packages as dev-only dependencies to keep npm peer resolution off React 19 types."
  - "Used Vite 8 transformWithOxc for JSX in existing .js files instead of renaming source files."
  - "Split vendor chunks with rolldownOptions.manualChunks instead of raising the chunk warning threshold."
patterns-established:
  - "Public env values are read through readPublicEnv(name, fallback)."
  - "Public asset URLs are produced with joinPublicPath(value)."
requirements-completed: [TOOL-01, TOOL-04]
duration: 24 min
completed: 2026-06-14
---

# Phase 10 Plan 01: Vite Toolchain and Runtime Compatibility Summary

**Vite frontend runtime with preserved REACT_APP config names, build output, Tailwind pipeline, and public asset paths**

## Performance

- **Duration:** 24 min
- **Started:** 2026-06-14T00:55:00Z
- **Completed:** 2026-06-14T01:19:00Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Removed CRA/react-scripts and web-vitals from the frontend package and lockfile.
- Added Vite 8, Vitest 4, plugin-react, jsdom, PostCSS, autoprefixer, and upgraded Testing Library as dev tooling.
- Added Vite root app shell, explicit PostCSS/Tailwind config, and `build` output preservation.
- Replaced CRA `PUBLIC_URL` usage with a Vite `BASE_URL` public-path helper.
- Preserved existing `REACT_APP_*` config names behind a small env helper.

## Task Commits

1. **Task 10-01-01: Package contract** - `c8adeef` (chore)
2. **Task 10-01-02: Vite app shell** - `64f871c` (chore)
3. **Task 10-01-03: Env and public asset helpers** - `2d4d042` (chore)

## Files Created/Modified

- `Frontend/Ecommerce-main/my-app/package.json` - Vite/Vitest scripts and dev dependency boundary.
- `Frontend/Ecommerce-main/my-app/package-lock.json` - Regenerated npm lockfile without react-scripts.
- `Frontend/Ecommerce-main/my-app/vite.config.js` - Vite, React plugin, env prefix, build output, test config, JSX-in-JS transform, and vendor chunking.
- `Frontend/Ecommerce-main/my-app/postcss.config.js` - Tailwind and autoprefixer processing.
- `Frontend/Ecommerce-main/my-app/index.html` - Vite root HTML entry.
- `Frontend/Ecommerce-main/my-app/src/config/env.js` - Public env helper.
- `Frontend/Ecommerce-main/my-app/src/utils/publicPath.js` - Vite BASE_URL public asset helper.
- `Frontend/Ecommerce-main/my-app/src/config/config.js` - Preserved config shape backed by `readPublicEnv`.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js` - Product image paths use `joinPublicPath`.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/catalogService.js` - Fallback database fetch uses `joinPublicPath`.
- `Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx` - Cart image paths use `joinPublicPath`.

## Decisions Made

- Added `@types/react@18.3.31` and `@types/react-dom@18.3.7` as dev-only dependencies after npm tried to resolve React 19 type peers for Testing Library. This keeps runtime React unchanged.
- Used a Vite 8 OXC pre-transform for existing JSX-in-`.js` files because the older esbuild loader workaround is ignored by the current build pipeline.
- Added vendor chunk grouping instead of increasing `chunkSizeWarningLimit`, keeping the build warning meaningful.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Resolved Testing Library peer conflict without runtime upgrades**
- **Found during:** Task 10-01-01
- **Issue:** `npm install` failed when `@testing-library/react@16.3.2` caused npm to select React 19 type peers.
- **Fix:** Added React 18 type packages as dev-only dependencies.
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npm ls react react-dom react-router-dom tailwindcss --depth=0`
- **Committed in:** `c8adeef`

**2. [Rule 3 - Blocking] Adapted JSX-in-JS handling for Vite 8/OXC**
- **Found during:** Task 10-01-02
- **Issue:** `npm run build` failed on JSX inside existing `.js` files, and older esbuild options emitted deprecation warnings.
- **Fix:** Added a pre-transform plugin using `transformWithOxc(..., { lang: "jsx" })`.
- **Files modified:** `vite.config.js`
- **Verification:** `npm run build`
- **Committed in:** `64f871c`

**3. [Rule 3 - Blocking] Removed new Vite large-chunk warning**
- **Found during:** Task 10-01-02
- **Issue:** The first successful Vite build emitted a single large chunk warning.
- **Fix:** Added stable vendor chunk groups through `build.rolldownOptions.output.manualChunks`.
- **Files modified:** `vite.config.js`
- **Verification:** `npm run build`
- **Committed in:** `64f871c`

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All fixes were tooling-compatibility corrections required for the Vite migration. No runtime major or product behavior change was introduced.

## Issues Encountered

- Full `npm test` now invokes Vitest but still fails on remaining Jest globals and JSX test-file migration. This is the planned scope of Plan 10-02, so it is not resolved in Plan 10-01.

## Verification

- `npm run build` - passed with Vite output in `build`.
- `npx vitest run src/config/config.test.js src/services/catalog/normalizeProduct.test.js src/services/catalog/catalogService.test.js src/utils/publicPath.test.js` - 4 files, 16 tests passed.
- `rg -n "react-scripts|react-app/jest|react-app" package.json package-lock.json` - no matches.
- `rg -n "process\\.env\\.PUBLIC_URL|%PUBLIC_URL%" src public index.html` - no matches.
- `npm ls react react-dom react-router-dom tailwindcss --depth=0` - React 18.3.1, React Router 6.30.4, Tailwind 3.x retained.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 10-02 to complete the Vitest/Jest API conversion and warning cleanup.

## Self-Check: PASSED

Plan 10-01 produced the Vite runtime/tooling base, preserved public config/asset behavior, and left only the explicitly planned 10-02 test migration work open.

---
*Phase: 10-frontend-tooling-modernization-and-warning-cleanup*
*Completed: 2026-06-14*
