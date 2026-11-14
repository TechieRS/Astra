# Deployment

## Local development

Use the two terminal commands in the README. Python 3.12+ and Node 22 LTS (22.12+) or Node 24+ are supported. SQLite requires no service; run `alembic upgrade head` from `backend` before starting the API. Frontend dependencies are locked by `frontend/package-lock.json`; backend versions are in `backend/requirements.lock.txt`.

## Docker Compose

Copy root `.env.example` to `.env` and replace `POSTGRES_PASSWORD` with a URL-safe local secret. Run `docker compose config --quiet`, then `docker compose up --build`. Open `http://localhost:8080`. The database is not exposed on the host. API migrations run before the server starts. PostgreSQL data persists in the `astra_pg` named volume. nginx serves the SPA and forwards `/api` internally to the backend.

The backend runs as an unprivileged user. Session URLs are private capabilities: nginx disables API access logging and the uvicorn command disables access logging. Configure upstream hosting/proxy logs to redact `/api/sessions/*` as well. Use HTTPS for any internet-facing deployment, keep database access private, and back up the PostgreSQL volume. Do not publish development passwords.

The supplied backend lock includes test/QA dependencies for reproducibility. It is intentionally one small deployable monolith, not a production-optimized minimal wheel. A smaller production-only lock can be derived later with the same audited runtime versions.

## Render API and PostgreSQL

`render.yaml` describes the API and database. The build runs from repository root to include `data/scientific-references`. The start command changes to `backend`, applies migrations, and binds uvicorn to `$PORT`. Managed PostgreSQL connection strings are normalized to SQLAlchemy's psycopg driver by settings validation. Set `ALLOWED_ORIGINS` to the exact deployed frontend HTTPS origin; do not use a wildcard. No NASA or AI credentials are required.

The blueprint structure follows the [official Render specification](https://render.com/docs/blueprint-spec). The frontend's SPA fallback follows [Vercel's official Vite guidance](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

Review provider plan availability in your account before applying the blueprint; no plan purchase or hosted deployment was performed during implementation. For multiple API replicas, move rate limiting and NASA caching to shared storage; the current limiter/cache are bounded, in-process, and appropriate to one hackathon instance.

## Vercel frontend

Create a Vercel project with root directory `frontend`. Use build command `npm run build`, output `dist`, Node 22 LTS, and `VITE_API_URL=https://YOUR-API-ORIGIN` (without `/api`). The variable is a public API origin, never a secret. Redeploy after changing it. The tracked `vercel.json` provides SPA history fallback and baseline response headers. Add your actual frontend origin to backend CORS.

## Sites hosting boundary

Sites publishes static sites or Cloudflare Worker ESM servers. It cannot run the requested Python/FastAPI process and PostgreSQL stack as delivered. Publishing only these static assets without a reachable backend would produce an unplayable mission. This repository includes deployment instructions and configs for the full stack; no Sites URL or hosted deployment is claimed.

## Environment, secrets, and operations

Keep `.env` files out of source control. Configure production values through the hosting service. `ENABLE_NASA_NETWORK=false` disables enrichment for a deterministic offline demo while preserving curated references and all gameplay. Successful NASA responses cache for `NASA_CACHE_SECONDS`, failures for 60 seconds. This cache is not an archive or a space-weather feed.

The health endpoint executes a database query and returns 503 if storage is unavailable. Requests are limited to 8 KiB, inputs use Pydantic allowlists, and state-changing requests are limited to 180/minute per direct client address. Behind a trusted reverse proxy, configure trusted forwarded-IP handling carefully; do not blindly trust arbitrary client headers. Sessions have no user identity or expiry workflow; plan retention and deletion before a public classroom rollout.

## Validation limits

See `STATUS.md` for checks actually executed. Docker is not installed in the implementation environment, so container build/runtime verification cannot be claimed. Provider deployments and their production logging, HTTPS, and secrets configuration require the user's hosting account and remain unverified.
