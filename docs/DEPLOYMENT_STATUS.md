# Hosted ASTRA

Deployed: **15 November 2026**.

- Frontend: **https://astra-one-flame.vercel.app** — Vercel Hobby, project `astra`.
- API: **https://astra-api-mkqh.onrender.com** — Render Free, service `astra-api`.
- API health: https://astra-api-mkqh.onrender.com/api/health
- Interactive API documentation: https://astra-api-mkqh.onrender.com/api/docs
- Database: `astra-db`, dedicated PostgreSQL 16, Render Free, Oregon, external IP allow-list empty (private connections only).
- Database expiration reported by Render: **15 December 2026**. Export or upgrade before expiration to retain demo data.
- Source: `https://github.com/TechieRS/Astra`, branch `main`.

## Configuration

Vercel builds from the local `frontend` directory with the tracked Vite configuration. Production `VITE_API_URL` is set to the Render API origin. The production frontend allows 90 seconds for an API request, accommodating the free Render service's cold startup.

Render builds from repository root so the bundled scientific references are included. It installs the pinned Python dependencies, applies Alembic migrations, then starts uvicorn with access logging disabled. `DATABASE_URL` references the dedicated internal PostgreSQL connection. `ALLOWED_ORIGINS` is exactly `https://astra-one-flame.vercel.app`. Secrets are stored in the providers' environment configuration, not source control. CLI authentication and Vercel local environment files are also outside tracked source.

The Render API is connected to GitHub with deploy-on-commit. The Vercel frontend was deployed using the authenticated CLI from `frontend`; its GitHub auto-deploy connection has not been configured. To publish a frontend update, run `npx vercel deploy --prod --yes --scope ravis-projects-ad3c2dff` from the linked `frontend` directory.

## Database replacement

The workspace previously had its sole free PostgreSQL slot occupied by `nourish-db`. The user explicitly requested deleting that database and replacing it with ASTRA's database. The exact named database was verified, then deleted. A `pg_dump` backup attempt could not connect because the old database closed the SSL connection; **no backup was saved**. No other Render services were deleted or reconfigured.

## Verification

- Vercel production deployment returned `READY` and the public frontend returned HTTP 200 without a sign-in redirect.
- Render API deployment returned `live`; database-backed health returned HTTP 200 and `status: ok`.
- CORS preflight for the exact production frontend returned HTTP 200.
- **8 hosted Playwright tests passed** (four each on desktop and mobile Chromium) against the public production URLs: complete mission, actual depletion failure, pause/reload/resume, scientific references, ORBIT, accessibility settings, rover loadout, report/export/replay and a safe early return. The browser suite includes axe-core accessibility scans.
- A separate hosted mission was created, prepared, launched and inspected for persistence verification across the final backend redeploy. Its post-redeploy result is recorded below once checked.

## Free-tier behavior

Render's free API sleeps after idle time and can take about a minute to wake. The free PostgreSQL database has a fixed expiration date and no provider backup feature. See [Render's free-tier documentation](https://render.com/docs/free).
