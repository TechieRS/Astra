# Deployment

## Local development

Use the two terminal commands in the README. Python 3.12+ and Node 22 LTS (22.12+) or Node 24+ are supported. SQLite requires no service; run `alembic upgrade head` from `backend` before starting the API. Frontend dependencies are locked by `frontend/package-lock.json`; backend versions are in `backend/requirements.lock.txt`.

## Docker Compose

Copy root `.env.example` to `.env` and replace `POSTGRES_PASSWORD` with a URL-safe local secret. Run `docker compose config --quiet`, then `docker compose up --build`. Open `http://localhost:8080`. The database is not exposed on the host. API migrations run before the server starts. PostgreSQL data persists in the `astra_pg` named volume. nginx serves the SPA and forwards `/api` internally to the backend.

The backend runs as an unprivileged user. Session URLs are private capabilities: nginx disables API access logging and the uvicorn command disables access logging. Configure upstream hosting/proxy logs to redact `/api/sessions/*` as well. Use HTTPS for any internet-facing deployment, keep database access private, and back up the PostgreSQL volume. Do not publish development passwords.

The supplied backend lock includes test/QA dependencies for reproducibility. It is intentionally one small deployable monolith, not a production-optimized minimal wheel. A smaller production-only lock can be derived later with the same audited runtime versions.

## Current hosted demo

The frontend and API were deployed on 15 November 2026. Open **https://astra-one-flame.vercel.app**. The API is **https://astra-api-mkqh.onrender.com**. Exact configuration, database expiration and verification are recorded in [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md).

## Render API and PostgreSQL

`render.yaml` describes the API and database. The build runs from repository root to include `data/scientific-references`. The start command changes to `backend`, applies migrations, and binds uvicorn to `$PORT`. Managed PostgreSQL connection strings are normalized to SQLAlchemy's psycopg driver by settings validation. Set `ALLOWED_ORIGINS` to the exact deployed frontend HTTPS origin; do not use a wildcard. No NASA or AI credentials are required.

The blueprint structure follows the [official Render specification](https://render.com/docs/blueprint-spec). The frontend's SPA fallback follows [Vercel's official Vite guidance](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

The user selected a **free demo deployment on 14 November 2026**. The blueprint now explicitly uses `plan: free` for both the API and PostgreSQL. Free API instances sleep after 15 idle minutes, so the next request can take about a minute to wake the service. Production frontend API requests allow 90 seconds for this startup; local development keeps its 15-second timeout. Free Render PostgreSQL expires 30 days after creation; this is a temporary demo, and its data needs exporting or a plan upgrade before expiration. See [Render's free-tier documentation](https://render.com/docs/free). Keep persistence on PostgreSQL, because service-local SQLite files do not survive restarts/redeploys on this plan.

For multiple API replicas, move rate limiting and NASA caching to shared storage; the current limiter/cache are bounded, in-process, and appropriate to one demo instance.

## Vercel frontend

Create a Vercel project with root directory `frontend`. Use build command `npm run build`, output `dist`, Node 22 LTS, and `VITE_API_URL=https://YOUR-API-ORIGIN` (without `/api`). The variable is a public API origin, never a secret. Redeploy after changing it. The tracked `vercel.json` provides SPA history fallback and baseline response headers. Add your actual frontend origin to backend CORS.

## Sites hosting boundary

Sites publishes static sites or Cloudflare Worker ESM servers. It cannot run the requested Python/FastAPI process and PostgreSQL stack as delivered. Publishing only these static assets without a reachable backend would produce an unplayable mission. This repository includes deployment instructions and configs for the full stack; no Sites URL is claimed. The active deployment uses Vercel and Render as documented above.

## Environment, secrets, and operations

Keep `.env` files out of source control. Configure production values through the hosting service. `ENABLE_NASA_NETWORK=false` disables enrichment for a deterministic offline demo while preserving curated references and all gameplay. Successful NASA responses cache for `NASA_CACHE_SECONDS`, failures for 60 seconds. This cache is not an archive or a space-weather feed.

The health endpoint executes a database query and returns 503 if storage is unavailable. Requests are limited to 8 KiB, inputs use Pydantic allowlists, and state-changing requests are limited to 180/minute per direct client address. Behind a trusted reverse proxy, configure trusted forwarded-IP handling carefully; do not blindly trust arbitrary client headers. Sessions have no user identity or expiry workflow; plan retention and deletion before a public classroom rollout.

## Validation limits

See `STATUS.md` for checks actually executed. Docker is not installed in the implementation environment, so container build/runtime verification cannot be claimed. Vercel and Render deployments were performed using authenticated provider CLIs. Hosted checks are recorded in DEPLOYMENT_STATUS.md; provider edge-log redaction and a full operations audit remain unverified.


## Selected deployment settings

- Source: `https://github.com/TechieRS/Astra`, branch `main`.
- Render: repository root, Python runtime, `astra-api` web service and `astra-db` PostgreSQL, both Free. Build/start/health commands are in `render.yaml`; keep both resources in the same region. Set `ALLOWED_ORIGINS` to the exact final Vercel production origin.
- Vercel: root directory `frontend`, Vite, `npm ci`, `npm run build`, output `dist`. Set production `VITE_API_URL` to the final Render HTTPS service origin without `/api` or a trailing slash. The API origin is a public build-time value.
- Order: provision Render database/API; obtain its origin; deploy Vercel with that API origin; set Render CORS to the final Vercel origin and redeploy; verify hosted health, source catalog, a mission action and reload persistence.
- Account connections are required to create/configure the hosted resources. Neither a local build nor a deployment configuration is evidence of a live deployment. Record actual hosted URLs only after the providers confirm success.
