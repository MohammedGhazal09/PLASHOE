# Testing Patterns

**Analysis Date:** 2026-06-08

## Test Framework

**Runner:**
- Frontend: Jest through Create React App `react-scripts test` from `Frontend/Ecommerce-main/my-app/package.json`.
- Backend: Vitest through `npm test` from `Backend/package.json`.
- Config: CRA-managed Jest configuration through `react-scripts`; backend uses `Backend/vitest.config.js` and shared setup in `Backend/test/setup.js`.

**Assertion Library:**
- Frontend: Jest assertions plus `@testing-library/jest-dom` matchers configured in `Frontend/Ecommerce-main/my-app/src/setupTests.js`.
- Backend: Not detected.

**Run Commands:**
```bash
cd Backend && npm test
cd Backend && npm test -- order.test.js cart.test.js
cd Frontend/Ecommerce-main/my-app && npm test              # Run frontend Jest tests in CRA watch mode
cd Frontend/Ecommerce-main/my-app && npm test -- --watchAll=false              # Run frontend tests once
cd Frontend/Ecommerce-main/my-app && npm test -- --coverage --watchAll=false   # Run frontend coverage
```

## Test File Organization

**Location:**
- Frontend tests are co-located with source files under `Frontend/Ecommerce-main/my-app/src`.
- Frontend tests are co-located under `Frontend/Ecommerce-main/my-app/src/**/*.test.*`.
- Shared test setup lives in `Frontend/Ecommerce-main/my-app/src/setupTests.js`.
- Backend tests live under `Backend/test`.

**Naming:**
- Use CRA/Jest naming with `.test.js` for frontend tests, as in `Frontend/Ecommerce-main/my-app/src/App.test.js`.
- Backend tests use `.test.js` under `Backend/test`.

**Structure:**
```text
Backend/test/
├── setup.js           # MongoMemoryReplSet setup and collection cleanup
├── helpers/           # Auth and factory helpers
└── *.test.js          # Vitest/Supertest route and service behavior tests

Frontend/Ecommerce-main/my-app/src/
├── **/*.test.js       # Co-located CRA/Jest tests
└── setupTests.js      # Global Testing Library matcher setup
```

## Test Structure

**Suite Organization:**
```javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

**Patterns:**
- Tests use top-level `test(...)` rather than nested `describe(...)`, as shown in `Frontend/Ecommerce-main/my-app/src/App.test.js`.
- React components are rendered with `render(...)` from `@testing-library/react` in `Frontend/Ecommerce-main/my-app/src/App.test.js`.
- DOM queries use `screen.getByText(...)` in `Frontend/Ecommerce-main/my-app/src/App.test.js`.
- Assertions use jest-dom matchers such as `toBeInTheDocument()` enabled by `Frontend/Ecommerce-main/my-app/src/setupTests.js`.
- No setup/teardown pattern (`beforeEach`, `afterEach`) is currently established.

## Mocking

**Framework:** Jest, via CRA. No explicit mocks are currently used.

**Patterns:**
```javascript
// No project-specific mocking pattern is established.
// Prefer Jest mocks when isolating modules imported by React components.
```

**What to Mock:**
- Mock API wrapper modules such as `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`, `Frontend/Ecommerce-main/my-app/src/api/cartApi.js`, and `Frontend/Ecommerce-main/my-app/src/api/authApi.js` when testing pages or stores that perform network calls.
- Mock Zustand stores such as `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` and `Frontend/Ecommerce-main/my-app/src/store/authStore.js` when testing presentational components that should not exercise persisted state.
- Mock browser integrations or router context when testing components using `react-router-dom`, such as `Frontend/Ecommerce-main/my-app/src/App.js`, `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`, and `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`.

**What NOT to Mock:**
- Do not mock `@testing-library/react` or jest-dom; keep tests user-facing through DOM queries as in `Frontend/Ecommerce-main/my-app/src/App.test.js`.
- Do not mock simple pure helpers when they can be exercised through behavior, such as cart price/detail helpers in `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`.

## Fixtures and Factories

**Test Data:**
```javascript
const product = {
  _id: 'product-1',
  name: 'Test Shoe',
  image: '/database/Male/0.jpg',
  price: { current: 99, original: 129 },
  rating: 4.5,
};
```

**Location:**
- No dedicated fixture or factory directory exists.
- Product fallback data is stored in `Frontend/Ecommerce-main/my-app/public/database/database.json`, but tests should use small inline fixtures or a future `src/__fixtures__` directory instead of depending on the full public dataset.
- Backend seed data exists in `Backend/utils/seedData.js`; it is a database seeding utility, not a test fixture module.

## Coverage

**Requirements:** None enforced. No coverage thresholds are configured in `Frontend/Ecommerce-main/my-app/package.json`, and no backend coverage tooling is configured in `Backend/package.json`.

**View Coverage:**
```bash
cd Frontend/Ecommerce-main/my-app && npm test -- --coverage --watchAll=false
```

## Test Types

**Unit Tests:**
- Frontend unit/component testing is available through Jest and React Testing Library in `Frontend/Ecommerce-main/my-app/src/App.test.js`.
- Backend route/service tests are configured with Vitest, Supertest, and Mongoose.

**Integration Tests:**
- Backend API integration tests cover Express routes through the importable app in `Backend/app.js`.
- Frontend store/API interaction coverage exists for auth, cart normalization, checkout, and contact flows. Router guard behavior is covered by `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.test.jsx`.

**E2E Tests:**
- Not used. No Playwright, Cypress, or Selenium dependency/configuration detected in `Backend/package.json` or `Frontend/Ecommerce-main/my-app/package.json`.

## Common Patterns

**Async Testing:**
```javascript
// No async test pattern currently exists.
// Use Testing Library async queries for UI that waits on API-backed state.
const item = await screen.findByText(/order placed successfully/i);
expect(item).toBeInTheDocument();
```

**Error Testing:**
```javascript
// No error test pattern currently exists.
// Use mocked rejected API calls and assert the rendered message or returned store result.
expect(await result).toEqual({ success: false, message: 'Login failed' });
```

---

*Testing analysis: 2026-06-08*
