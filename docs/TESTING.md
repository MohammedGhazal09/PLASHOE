<!-- generated-by: gsd-doc-writer -->
# Testing

PLASHOE currently has frontend test tooling through Create React App and React Testing Library, but it does not have meaningful passing tests yet. The backend has no configured test framework or `npm test` script.

## Current Test State

| Area | Current state | Evidence |
| --- | --- | --- |
| Frontend test runner | Configured through `react-scripts test` | `Frontend/Ecommerce-main/my-app/package.json` |
| Frontend test libraries | `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` are dependencies | `Frontend/Ecommerce-main/my-app/package.json` |
| Frontend test files | One test file exists: `Frontend/Ecommerce-main/my-app/src/App.test.js` | `Frontend/Ecommerce-main/my-app/src/App.test.js` |
| Frontend setup file | jest-dom is loaded globally | `Frontend/Ecommerce-main/my-app/src/setupTests.js` |
| Backend test runner | Not configured | `Backend/package.json` has `start`, `dev`, and `seed`, but no `test` script |
| Backend test files | None detected | No `*.test.js` or `*.spec.js` files under `Backend` |
| CI test execution | Not configured | No `.github/workflows` directory is present |
| Coverage threshold | Not configured | No Jest/Vitest coverage threshold or `nyc`/`c8` config detected |

The existing frontend test is still the default CRA starter assertion:

```javascript
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

`Frontend/Ecommerce-main/my-app/src/App.js` now renders the ecommerce route shell and does not render "learn react", so this test should be replaced before the frontend suite is treated as useful.

## Available Commands

Run frontend dependency installation before test commands in a fresh checkout:

```bash
cd Frontend/Ecommerce-main/my-app
npm install
```

Run the frontend Jest suite in interactive watch mode:

```bash
cd Frontend/Ecommerce-main/my-app
npm test
```

Run the frontend Jest suite once:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- --watchAll=false
```

Run frontend coverage once:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- --coverage --watchAll=false
```

Run one frontend test file:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- App.test.js --watchAll=false
```

There is no backend test command available today. `Backend/package.json` does not define a `test` script.

## Verification Snapshot

The frontend test command was checked from this checkout with no `node_modules` directory present:

```bash
cd Frontend/Ecommerce-main/my-app
npm test -- --watchAll=false
```

Current result:

```text
'react-scripts' is not recognized as an internal or external command,
operable program or batch file.
```

Install frontend dependencies first, then replace `Frontend/Ecommerce-main/my-app/src/App.test.js` with a real PLASHOE assertion before relying on the test run.

The backend package was also checked and currently has no test script to run.

## Test Framework And Setup

### Frontend

The frontend uses the Jest configuration bundled with `react-scripts` from Create React App. There is no standalone `jest.config.*` or `vitest.config.*` file.

Relevant files:

- `Frontend/Ecommerce-main/my-app/package.json`: defines `test: react-scripts test`.
- `Frontend/Ecommerce-main/my-app/src/setupTests.js`: imports `@testing-library/jest-dom`.
- `Frontend/Ecommerce-main/my-app/src/App.test.js`: current starter test file.

Use `.test.js` for frontend tests until the project adopts a different convention. Co-locate tests next to the code they cover, matching the current `Frontend/Ecommerce-main/my-app/src/App.test.js` pattern.

### Backend

The backend is an Express/Mongoose API with route files under `Backend/routes`, controllers under `Backend/controllers`, auth middleware in `Backend/middleware/auth.js`, and models under `Backend/models`.

No backend testing dependencies are configured. There is no `supertest`, `jest`, `vitest`, `mocha`, `mongodb-memory-server`, or test script in `Backend/package.json`.

## Running Tests

| Command | What it runs | Current status |
| --- | --- | --- |
| `cd Frontend/Ecommerce-main/my-app && npm test` | CRA/Jest in watch mode | Available after `npm install`; current test content is stale |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false` | CRA/Jest once | Available after `npm install`; current checkout could not run because dependencies are not installed |
| `cd Frontend/Ecommerce-main/my-app && npm test -- --coverage --watchAll=false` | CRA/Jest once with coverage | Available after `npm install`; no coverage thresholds configured |
| Backend automated test command | Backend tests | Not available; `Backend/package.json` is missing a `test` script |

## Writing New Frontend Tests

Use React Testing Library for user-visible behavior, not implementation details. Prefer `screen.getByRole`, `screen.getByText`, and async `findBy*` queries when UI waits for data.

Recommended near-term frontend test targets:

1. Replace `Frontend/Ecommerce-main/my-app/src/App.test.js` with a route-shell smoke test that proves the app renders PLASHOE navigation or homepage content.
2. Add a future cart store test near `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` for `selectItemCount`, `selectSubtotal`, `selectTotal`, guest `addItem`, quantity updates, coupon state, and `clearCart`.
3. Add component tests near `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` to verify unauthenticated users redirect to `/account` and authenticated users see protected children.
4. Add component tests near `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` to verify price display, sale state, size selection, `addItem`, `openCart`, and toast behavior with mocked stores.
5. Add page tests near `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx` to cover empty cart, item totals, discount display, remove, quantity update, and checkout navigation.

Example frontend test shape:

```javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the storefront route shell', () => {
  render(<App />);

  expect(screen.getByAltText(/plashoe/i)).toBeInTheDocument();
});
```

Adjust the assertion to match stable text or accessible labels that are actually rendered by the current component.

## Missing Backend Testing

Backend tests are the largest current gap. The API handles authentication, authorization, ecommerce data changes, and MongoDB persistence, but none of those paths are covered by automated tests.

Recommended backend setup:

```bash
cd Backend
npm install --save-dev vitest supertest mongodb-memory-server
```

Recommended `Backend/package.json` script after adding a test runner:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

To make API tests straightforward, refactor `Backend/server.js` so the Express `app` can be imported without starting the listener. A common structure is:

- Add a new backend app module that creates middleware, routes, and error handling, then exports `app`.
- Keep `Backend/server.js` responsible for loading environment, connecting MongoDB, importing the app module, and calling `app.listen(...)`.

Do this refactor before adding `supertest` route tests.

## Recommended Tests By Priority

| Priority | Test area | Why it matters | Suggested files |
| --- | --- | --- | --- |
| 1 | Backend auth register/login/me | JWT creation and protected user identity are core to checkout, cart, orders, and profile features | Future backend auth route test |
| 2 | Backend auth middleware | `protect` and `admin` guard sensitive cart, order, and product write routes | Future backend auth middleware test |
| 3 | Backend product routes | Product listing, category filters, sale filters, and admin product writes drive the storefront | Future backend product route test |
| 4 | Backend cart routes | Cart add/update/remove/clear/coupon flows affect purchase totals and persistence | Future backend cart route test |
| 5 | Backend order routes | Order creation, lookup, and cancellation are high-value ecommerce workflows | Future backend order route test |
| 6 | Frontend cart store | Guest cart behavior and total calculations can be tested without network or browser complexity | Future cart store test near `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` |
| 7 | Frontend protected routes | Checkout and order detail access depend on auth state | Future route-guard test near `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` |
| 8 | Frontend product and cart UI | Product cards and cart page are the highest-touch shopping UI paths | Future UI tests near `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` and `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx` |
| 9 | End-to-end checkout smoke | Full browser flow should cover browse, add to cart, login, checkout, and order confirmation after unit and API tests exist | Future browser checkout smoke test |

## Coverage Requirements

No coverage thresholds are configured.

| Type | Threshold |
| --- | --- |
| Statements | Not configured |
| Branches | Not configured |
| Functions | Not configured |
| Lines | Not configured |

When coverage gates are introduced, start with modest thresholds on newly added testable modules and raise them as backend and frontend coverage expands. Avoid enabling a repository-wide threshold before replacing the stale frontend starter test and adding backend tests.

## CI Integration

No CI workflow is currently present. Add CI only after the local commands pass consistently.

Recommended first CI shape:

1. Install frontend dependencies in `Frontend/Ecommerce-main/my-app`.
2. Run `npm test -- --watchAll=false`.
3. Install backend dependencies in `Backend`.
4. Add and run the backend test script after a backend test runner is installed.

Do not add a backend CI test step until `Backend/package.json` has a real `test` script.
