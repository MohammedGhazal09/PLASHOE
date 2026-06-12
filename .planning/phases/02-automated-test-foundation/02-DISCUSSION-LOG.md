# Phase 02: automated-test-foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-12T15:14:32.4130713+03:00
**Phase:** 02-automated-test-foundation
**Areas discussed:** Backend test boundary and runner, Backend persistence and fixtures, Backend route-test coverage, Frontend test strategy, Contract checker and documentation, Execution risks and workflow handoff

---

## Backend Test Boundary and Runner

| Decision | Options Presented | Selected |
| --- | --- | --- |
| App extraction shape | `Backend/app.js` export; conditional listen in `server.js`; larger `src/` move | `Backend/app.js` export |
| Backend one-shot command | `vitest run`; `vitest --run`; default `vitest` watch behavior | `vitest run` |
| Backend test setup location | Central setup file; per-suite setup; manually called helper | Central `Backend/test/setup.js` |
| Test dependency policy | Add dev dependencies; defer install; spec-only plan | Add and lock dev dependencies |

**User's choice:** Approved recommendations globally.
**Notes:** Keep `Backend/server.js` as the runtime startup entrypoint and preserve production behavior except for testability extraction.

---

## Backend Persistence and Fixtures

| Decision | Options Presented | Selected |
| --- | --- | --- |
| Mongo test harness | `mongodb-memory-server`; equivalent disposable local harness; local/prod Mongo | `mongodb-memory-server` or equivalent disposable harness |
| Cleanup granularity | Drop DB; delete collections; per-suite cleanup only | Delete collections after each test |
| Fixture strategy | Inline fixtures; shared factories; operational seed data | Shared lightweight factories |
| Binary/download failure policy | Block and document; mock models; use local Mongo | Configure/pin first, then document blocker before weakening |

**User's choice:** Approved recommendations globally.
**Notes:** Tests must not require `MONGODB_URL`, production MongoDB, or manual seeded local data.

---

## Backend Route-Test Coverage

| Decision | Options Presented | Selected |
| --- | --- | --- |
| Route test organization | One large API test; one suite per route/resource; controller unit tests only | One suite per route/resource |
| Auth setup | Login through routes only; helper-created JWTs only; both | Both, based on test purpose |
| Cart/order depth | Happy paths only; happy paths plus key failures; exhaustive branch coverage | Happy paths plus key failures |
| Coupon/order coupling | Cart-only coupon tests; order integration path; isolated unit logic | Include coupon-to-order integration path |
| Assertion strictness | Full snapshots; targeted shape assertions; status-only checks | Targeted shape assertions |

**User's choice:** Approved recommendations globally.
**Notes:** Coverage should protect Phase 1 behavior and Phase 2 acceptance criteria without expanding into payment, inventory, admin, or exhaustive branch testing.

---

## Frontend Test Strategy

| Decision | Options Presented | Selected |
| --- | --- | --- |
| App smoke target | PLASHOE shell/nav/logo; route page content; CRA starter text | PLASHOE shell/nav/logo |
| Router test strategy | Full `App` route harness; targeted `MemoryRouter`; route extraction | Minimal App smoke plus targeted `MemoryRouter` tests |
| ProtectedRoute testing | Mock store; set real Zustand state; add provider | Set/mock Zustand state directly |
| Cart store isolation | Persisted state as-is; reset store/localStorage; mock persist layer | Reset store state and localStorage |
| Cart store scope | Selectors only; actions only; selectors plus guest/coupon/clear behavior | Selectors plus guest/coupon/clear behavior |
| Checkout scope | Whole page with mocked stores/APIs; helper tests only; defer checkout | Whole page behavior with mocked stores/APIs |
| Contact scope | Mock Leaflet/API; extract form logic; skip frontend contact | Mock Leaflet/API and test form behavior |
| user-event policy | Keep v13; upgrade to v14; use only fireEvent | Keep v13 unless tests force upgrade |
| API mocking | Jest module mocks; MSW; live backend | Jest module mocks |

**User's choice:** Approved recommendations globally.
**Notes:** Tests should use user-facing React Testing Library assertions and stay within CRA/Jest for Phase 2.

---

## Contract Checker and Documentation

| Decision | Options Presented | Selected |
| --- | --- | --- |
| Static checker handling | Separate documented command; package script wrapper; convert to tests | Separate documented command |
| Docs target | `docs/TESTING.md`; planning maps; README | `docs/TESTING.md` |
| Coverage policy | No coverage; advisory coverage; hard thresholds | No hard thresholds |
| Final verification | Backend/frontend tests only; tests plus checker; tests plus checker/build/audit | Backend test, frontend test, static checker |

**User's choice:** Approved recommendations globally.
**Notes:** Frontend build can be advisory if frontend changes are broad; dependency audit remains Phase 3.

---

## Execution Risks and Workflow Handoff

| Decision | Options Presented | Selected |
| --- | --- | --- |
| Execution order | Backend first; frontend first; docs/checker first | Backend harness, backend routes, frontend tests, docs/checker |
| Untracked `Backend/.env.example` | Ignore; include; ask later | Leave untouched |
| If Mongo memory setup fails | Configure/pin; mock; use local Mongo | Configure/pin first, then document blocker |
| Next artifact after approval | Write context/log; ask again; skip to execution | Write context/log |

**User's choice:** Approved recommendations globally.
**Notes:** No deferred ideas were introduced by the user during approval. Adjacent work remains in later roadmap phases.

---

## the agent's Discretion

- Exact backend test helper filenames under `Backend/test`.
- Exact frontend test file co-location, as long as CRA/Jest can discover them and the spec coverage is met.
- Small production refactors needed only for testability, provided runtime behavior remains unchanged.

## Deferred Ideas

- Upgrade `@testing-library/user-event` v13 to v14 in dependency remediation unless Phase 2 tests require it.
- CI workflow creation remains Phase 8.
- Dependency audit remediation remains Phase 3.
- Payment provider tests remain Phase 5.
- Inventory/transaction/concurrency tests remain Phase 4.
- Browser E2E checkout tests remain later work after unit/API foundations are stable.
