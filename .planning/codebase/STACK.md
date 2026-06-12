# Technology Stack

**Analysis Date:** 2026-06-08

## Languages

**Primary:**
- JavaScript (ES modules in backend, JSX in frontend) - Backend API code in `Backend/server.js`, `Backend/controllers/authController.js`, and React UI code in `Frontend/Ecommerce-main/my-app/src/App.js`.

**Secondary:**
- CSS/Tailwind utility classes - Tailwind configuration in `Frontend/Ecommerce-main/my-app/tailwind.config.js` and component styling across `Frontend/Ecommerce-main/my-app/src/pages/*.jsx`.
- HTML - Create React App shell in `Frontend/Ecommerce-main/my-app/public/index.html`.

## Runtime

**Environment:**
- Node.js - Version not pinned; no `engines` field, `.nvmrc`, or `.node-version` detected.
- Browser runtime - Frontend is compiled by Create React App from `Frontend/Ecommerce-main/my-app/package.json`.

**Package Manager:**
- npm - Both app folders use npm lockfiles.
- Lockfile: present at `Backend/package-lock.json` and `Frontend/Ecommerce-main/my-app/package-lock.json`.

## Frameworks

**Core:**
- Express `^4.18.2` - HTTP API server and routing in `Backend/server.js` and `Backend/routes/*.js`.
- React `^18.3.1` - Frontend UI rendered from `Frontend/Ecommerce-main/my-app/src/index.js` and `Frontend/Ecommerce-main/my-app/src/App.js`.
- Create React App / react-scripts `5.0.1` - Frontend build, dev server, and Jest setup from `Frontend/Ecommerce-main/my-app/package.json`.
- Mongoose `^8.0.3` - MongoDB object modeling in `Backend/models/*.js` and connection handling in `Backend/config/db.js`.
- React Router DOM `^7.0.1` - Client routing in `Frontend/Ecommerce-main/my-app/src/App.js` and route links in `Frontend/Ecommerce-main/my-app/src/components/Header.jsx`.
- Zustand `^4.4.7` - Frontend auth/cart state in `Frontend/Ecommerce-main/my-app/src/store/authStore.js` and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
- Material UI `^6.1.6` and MUI icon packages - UI dependency set declared in `Frontend/Ecommerce-main/my-app/package.json`.
- Tailwind CSS `^3.4.13` - Utility CSS scanning `./src/**/*.{html,js,jsx}` via `Frontend/Ecommerce-main/my-app/tailwind.config.js`.

**Testing:**
- Jest through react-scripts `5.0.1` - Frontend test command in `Frontend/Ecommerce-main/my-app/package.json`; setup file at `Frontend/Ecommerce-main/my-app/src/setupTests.js`.
- React Testing Library `^13.4.0`, `@testing-library/jest-dom` `^5.17.0`, and `@testing-library/user-event` `^13.5.0` - Frontend testing dependencies in `Frontend/Ecommerce-main/my-app/package.json`.
- Backend test framework: Not detected in `Backend/package.json`.

**Build/Dev:**
- Backend dev server: `node --watch server.js` from `Backend/package.json`.
- Backend production start: `node server.js` from `Backend/package.json`.
- Backend seed command: `node utils/seedData.js` from `Backend/package.json`.
- Frontend dev server: `react-scripts start` from `Frontend/Ecommerce-main/my-app/package.json`.
- Frontend build: `react-scripts build` from `Frontend/Ecommerce-main/my-app/package.json`.

## Key Dependencies

**Critical:**
- `express` `^4.18.2` - Defines API routes and middleware in `Backend/server.js`.
- `mongoose` `^8.0.3` - Persists users, products, carts, orders, coupons, and contact messages in `Backend/models/*.js`.
- `jsonwebtoken` `^9.0.2` - Signs and verifies user bearer tokens in `Backend/controllers/authController.js` and `Backend/middleware/auth.js`.
- `bcryptjs` `^2.4.3` - Hashes and verifies user passwords in `Backend/models/User.js`.
- `cors` `^2.8.5` - Restricts browser origins in `Backend/server.js`.
- `dotenv` `^16.3.1` - Loads backend environment variables in `Backend/server.js` and `Backend/utils/seedData.js`.
- `axios` `^1.6.2` - Frontend API client in `Frontend/Ecommerce-main/my-app/src/api/axios.js`.
- `zustand` `^4.4.7` - Persists auth and cart state in `Frontend/Ecommerce-main/my-app/src/store/authStore.js` and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.

**Infrastructure:**
- `leaflet` `^1.9.4` - Contact page map rendering in `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`.
- `react-hot-toast` `^2.4.1` - UI notifications in `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, and other pages.
- `@fortawesome/*` packages - Icon rendering in components such as `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`.
- `styled-components` `^6.1.13` and Emotion packages - Styling dependencies declared in `Frontend/Ecommerce-main/my-app/package.json`.
- `flowbite` `^2.5.2` and `nouislider` `^15.8.1` - Frontend UI dependencies declared in `Frontend/Ecommerce-main/my-app/package.json`.
- `web-vitals` `^2.1.4` - CRA web vitals helper in `Frontend/Ecommerce-main/my-app/src/reportWebVitals.js`.

## Configuration

**Environment:**
- Backend reads environment variables with `dotenv.config()` in `Backend/server.js`.
- Backend database connection uses `MONGO_URI` in `Backend/config/db.js`.
- Backend JWT signing uses `JWT_SECRET` and optional `JWT_EXPIRE` in `Backend/controllers/authController.js`; verification uses `JWT_SECRET` in `Backend/middleware/auth.js`.
- Backend CORS uses `FRONTEND_URL`, defaulting to `http://localhost:5173`, in `Backend/server.js`.
- Backend HTTP port uses `PORT`, defaulting to `5000`, in `Backend/server.js`.
- Frontend centralizes `REACT_APP_*` variables in `Frontend/Ecommerce-main/my-app/src/config/config.js`.
- Frontend API base URL uses `REACT_APP_API_URL`, defaulting to `http://localhost:5000/api`, in `Frontend/Ecommerce-main/my-app/src/config/config.js`.
- `.env` files are present at `Backend/.env` and `Frontend/Ecommerce-main/my-app/.env`; contents are not read or documented.
- `.env.example` files are present at `Backend/.env.example` and `Frontend/Ecommerce-main/my-app/.env.example`; treat them as environment templates only.

**Build:**
- Backend package configuration: `Backend/package.json`.
- Frontend package configuration: `Frontend/Ecommerce-main/my-app/package.json`.
- Frontend Tailwind configuration: `Frontend/Ecommerce-main/my-app/tailwind.config.js`.
- Frontend browserslist and ESLint configuration are embedded in `Frontend/Ecommerce-main/my-app/package.json`.
- No TypeScript configuration detected.
- No Dockerfile or compose deployment configuration detected.

## Platform Requirements

**Development:**
- Run backend commands from `Backend` with npm.
- Run frontend commands from `Frontend/Ecommerce-main/my-app` with npm.
- Provide backend `MONGO_URI` and `JWT_SECRET` before using authenticated database-backed flows.
- Configure frontend `REACT_APP_API_URL` to point at the backend API exposed from `Backend/server.js`.

**Production:**
- Deployment target not detected in repository configuration.
- Production requires a Node.js host for `Backend/server.js`, a MongoDB-compatible database reachable through `MONGO_URI`, and static hosting for the Create React App build output from `Frontend/Ecommerce-main/my-app/build`.

---

*Stack analysis: 2026-06-08*
