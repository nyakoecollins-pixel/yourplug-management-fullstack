# YourPlug Management — full stack

A real, working slice of the platform:

- `backend/` — Express + TypeScript API, PostgreSQL via Prisma, JWT auth (register, email/phone verification codes, login with lockout, refresh tokens), procurement request CRUD, suppliers, admin metrics, immutable audit log.
- `frontend/` — the React/Vite UI. The login/register screens and the customer dashboard's "My Requests" call the real API when a token is present; every other screen still runs on realistic demo data (see `ARCHITECTURE.md` for what's stubbed vs real).
- `docker-compose.yml` — runs Postgres + the API + the frontend together.

## Run everything (Docker Desktop)

1. Make sure **Docker Desktop is open and running**.
2. Unzip this project and open the folder in VS Code:
   ```bash
   unzip yourplug-management-fullstack.zip
   cd yourplug-management-fullstack
   code .
   ```
3. In the VS Code terminal, from the project root:
   ```bash
   docker compose up --build
   ```
   First run takes a couple of minutes — it pulls Postgres, installs backend and frontend dependencies, creates the database schema, and seeds demo data. You'll see log lines from all three services (`postgres`, `api`, `web`) interleaved.
4. Wait for:
   - `api` to print `YourPlug API listening on :4000`
   - `web` to print a `Local: http://localhost:5173/` line
5. Open **http://localhost:5173** in your browser.

## Log in with real, seeded accounts

The database is seeded automatically on first boot. Use these on the **Log in** page (not the demo-mode buttons):

| Role | Email | Password |
|---|---|---|
| Customer | `james.mwangi@example.com` | `Password123!` |
| Admin | `admin@yourplug.co.ke` | `Password123!` |

Logging in this way gets a real JWT from the real API, and the customer dashboard's "My Requests" / "Dashboard" tabs fetch that customer's actual request from Postgres — you'll see a green "Connected to the live API" banner. Every other tab (invoices, payments, messages, etc.) still shows the curated demo dataset — wiring those up is the natural next slice of backend work, tracked in `ARCHITECTURE.md`.

There are also two **"demo mode"** links directly on the login/register page — those skip the API entirely and drop you into the fully mocked prototype from before, useful if you just want to look at the UI without the backend running.

## Try the real registration flow

1. Go to **Register**, fill in the form, and submit.
2. The API doesn't have a real email/SMS provider wired up, so it logs the verification codes to its own console instead of sending them. Look at the `api` service's terminal output for lines like:
   ```
   [verification] email code for you@example.com: 482913
   [verification] phone OTP for +254700000000: 118204
   ```
3. Log in with the email/password you just registered — verification isn't required to log in in this build (it's tracked separately on the user record), so you can go straight to the dashboard.

## Stopping / resetting

```bash
docker compose down        # stop everything, keep the database
docker compose down -v     # stop everything and wipe the database (re-seeds fresh next run)
```

## Running without Docker

**Backend** (needs a local Postgres, or point `DATABASE_URL` at any reachable one):
```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if not using Docker's Postgres
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

**Frontend** (in a second terminal):
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## What's real vs still mocked

Real: registration, password hashing, login with lockout after 5 failed attempts, JWT access + refresh tokens (refresh token in an httpOnly cookie), role-based route protection, request creation and retrieval from Postgres, audit log writes.

Still mocked in the UI: supplier quote comparison screens, invoices, payments, messaging, delivery tracking, and the admin workspace all render the curated demo dataset rather than live database records — the database models and API routes for suppliers/admin metrics exist (`backend/src/routes/`), but the frontend isn't wired to all of them yet. `ARCHITECTURE.md` has the full endpoint list and schema for finishing that wiring.
