<!-- generated-by: gsd-doc-writer -->
# Getting Started

This guide gets PLASHOE running locally with the Express/MongoDB backend in `Backend` and the Create React App storefront in `Frontend/Ecommerce-main/my-app`.

## Prerequisites

- Git for cloning the repository.
- Node.js and npm. No top-level `engines` field is pinned, but backend dependencies in the lockfile require `Node.js >= 16.20.1`; a current Node.js LTS release is recommended.
- A MongoDB database reachable from the backend through `MONGO_URI`.
- `curl`, PowerShell `Invoke-RestMethod`, or a browser for smoke checks.

## Installation Steps

1. Clone the repository and open the project root:

   ```bash
   git clone git@github.com:MohammedGhazal09/PLASHOE.git
   cd PLASHOE
   ```

2. Install backend dependencies:

   ```bash
   cd Backend
   npm install
   ```

3. Install frontend dependencies:

   ```bash
   cd ../Frontend/Ecommerce-main/my-app
   npm install
   ```

4. Return to the repository root before following the run commands below:

   ```bash
   cd ../../..
   ```

## Environment Templates

Local runtime files are managed per app root. Template files are present at:

- `Backend/.env.example`
- `Frontend/Ecommerce-main/my-app/.env.example`

Create local environment files from the templates if they are not already present:

```powershell
Copy-Item Backend\.env.example Backend\.env
Copy-Item Frontend\Ecommerce-main\my-app\.env.example Frontend\Ecommerce-main\my-app\.env
```

For macOS, Linux, or Git Bash:

```bash
cp Backend/.env.example Backend/.env
cp Frontend/Ecommerce-main/my-app/.env.example Frontend/Ecommerce-main/my-app/.env
```

Then configure the values described in [CONFIGURATION.md](CONFIGURATION.md). For a local CRA frontend, set the backend CORS origin to `http://localhost:3000`; the backend source default is `http://localhost:5173`, which does not match the CRA dev server.

## First Run

Start the backend API from `Backend`:

```bash
cd Backend
npm run dev
```

The backend runs `node --watch server.js` and listens on `PORT` or `5000` by default.

In a second terminal, start the React app from `Frontend/Ecommerce-main/my-app`:

```bash
cd Frontend/Ecommerce-main/my-app
npm start
```

Create React App starts the storefront at `http://localhost:3000` by default. The frontend API base URL defaults to `http://localhost:5000/api` when `REACT_APP_API_URL` is not set.

## Seed Local Data

Use the backend seed script only against a local or disposable development database. `npm run seed` runs `Backend/utils/seedData.js`, which clears existing product, coupon, and user data before inserting seed records.

```bash
cd Backend
npm run seed
```

Run the seed command after `MONGO_URI` points to the intended local/development MongoDB database.

## Smoke Checks

With the backend running, check the API health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected JSON:

```json
{
  "status": "ok",
  "message": "PLASHOE API is running"
}
```

PowerShell equivalent:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Check backend dependency readiness after MongoDB is configured:

```bash
curl http://localhost:5000/api/ready
```

Expected ready response:

```json
{
  "status": "ready",
  "ready": true,
  "dependencies": {
    "mongodb": {
      "status": "ready",
      "state": "connected"
    }
  }
}
```

With the frontend running, open the React app:

```text
http://localhost:3000
```

The storefront should load product browsing routes such as `/`, `/men`, `/women`, `/collection`, and `/sale`. If product data is empty or API-backed pages fail, confirm the backend is running, `MONGO_URI` points to a seeded database, and `REACT_APP_API_URL` points to `http://localhost:5000/api`.

## Common Setup Issues

- Backend starts but product, cart, order, or auth features fail: check that MongoDB is reachable through `MONGO_URI`, then seed local data with `npm run seed` from `Backend`.
- Browser requests are blocked by CORS: set the backend frontend-origin setting to `http://localhost:3000` when using the CRA dev server.
- Frontend starts but calls the wrong API: set or correct `REACT_APP_API_URL`, then restart `npm start`; CRA only reads environment variables when the dev server starts.
- `npm run seed` deletes data: this is expected behavior from `Backend/utils/seedData.js`; use it only with a local or disposable database.
- Commands fail from the repository root: this project has no root `package.json`; run backend commands from `Backend` and frontend commands from `Frontend/Ecommerce-main/my-app`.

## Next Steps

- Read [CONFIGURATION.md](CONFIGURATION.md) for the full runtime variable list and defaults.
- Read [DEPLOYMENT.md](DEPLOYMENT.md) before preparing a hosted release.
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for how the React app, API clients, Express routes, controllers, and Mongoose models fit together.
- Read the root [README.md](../README.md) for command summaries, API route overview, and project structure.
