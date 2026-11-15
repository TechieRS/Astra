# ASTRA — Junior Mission Commander

**Live demo:** https://astra-one-flame.vercel.app · [Hosting status](docs/DEPLOYMENT_STATUS.md)


**Every choice shapes your mission.** An interactive lunar mission trainer for curious explorers aged 7–12, created from a NASA Space Apps Challenge 2026 project brief. This is an independent educational project; NASA has not endorsed or certified it. The supplied challenge brief is treated as the product specification, not a verified official 2026 challenge listing.

## The problem and the experience

Space exploration involves trade-offs: a discovery is only useful if the crew can get home. ASTRA teaches those trade-offs through one complete, replayable mission: **The Lunar Outpost Emergency**. Inspect your habitat, respond to a solar-array malfunction, choose a power strategy, cross a compact lunar map, collect two different samples, encounter a scripted particle event, and return to base.

Every accepted action has an explanation, resource changes, and persistent consequences. There are six outcomes: excellent, science complete with smaller reserves, safe return with one sample, partial completion, emergency abort, and practice-mission failure. No account or personal details are needed.

## Implemented features

- Illustrated game start screen with interactive outpost discoveries, original Captain Nova/ORBIT/Scout artwork, direct mission briefing, and warm lunar field-station identity. See [the redesign record](docs/REDESIGN.md).
- Landing, mission selection, private callsign onboarding, briefing, two-slot loadout, mission control, exploration, decision desk, NASA science explorer, results, journal/learning report, and accessibility settings.
- Original Phaser 3 lunar environment with astronaut, parked or equipped rover, habitat, solar array, two science sites, shelter, validated movement, collision mask, site routing, and keyboard/touch controls. A compact HUD prioritizes the scene; crew dialogue offers short feedback with optional scientific detail.
- Server-authoritative oxygen, energy, elapsed time, and educational radiation-risk calculations. Equipment affects the whole sortie. Repairs generate energy on future turns; samples cannot be collected twice.
- Automatic save after every accepted action, browser-local session recovery, persistent pause/resume, request idempotency, stale-state protection, and downloadable journal JSON.
- NASA-attributed reference catalog, optional public image search with validation/caching/fallback, scientific limits, and deterministic ORBIT explanations. No external AI key required.
- Reduced motion, larger text, optional tips, visible focus, labeled indicators, and accessible alternatives to the canvas.

## Stack and architecture

React 19, Vite, TypeScript, Chakra UI 3, React Router, TanStack Query, Zustand, and Phaser 3. Python 3.12+, FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL. SQLite is available for local development. Tests use Pytest, Vitest/React Testing Library, Playwright, axe-core, Ruff, and TypeScript.

React renders the interface; Phaser draws the environment. Both display the same API-owned state. The pure Python simulation validates commands and computes the next state. Database transactions save state, action history, resource deltas, and terminal reports together. A session version and action UUID prevent concurrent or retried commands from charging twice.

```text
frontend/src/
  app/          navigation and application shell
  components/   reusable interface and original vector art
  features/     preparation, mission, science, reports, settings
  game/         lazy-loaded Phaser exploration
  hooks/        API-backed session and command hooks
  services/     typed HTTP client
  stores/       local preferences and anonymous session pointer
backend/
  app/          API, validation, persistence, simulation, NASA service
  alembic/      database migration
  tests/        deterministic rules, API, NASA, and PostgreSQL checks
data/scientific-references/  attributed offline science catalog
docs/                       methodology, operations, and verification
```

## Run locally

Prerequisites: **Python 3.12+**, **Node.js 22.12+ on the 22 LTS line** (or 24+), and npm. No NASA or Gemini key is required.

From the repository root:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/pip install -r backend/requirements.lock.txt
cp .env.example backend/.env
cd frontend
npm ci
cd ..
```

Start the backend in one terminal:

```sh
cd backend
../.venv/bin/alembic upgrade head
../.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Start the frontend in another:

```sh
cd frontend
npm run dev
```

Open **http://127.0.0.1:5173**. API documentation is at **http://127.0.0.1:8000/api/docs**. The default database is `backend/astra.db`, created by the migration. Application startup requires an already migrated database. The Vite development proxy forwards `/api` to port 8000.

After installation, `./scripts/dev.sh` from root also starts both services in one terminal and shuts down its API child when you exit.

## Environment and PostgreSQL

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./astra.db` |
| `ALLOWED_ORIGINS` | Exact comma-separated browser origins | local frontend on port 5173 |
| `ENABLE_NASA_NETWORK` | Optional NASA media enrichment | `true` |
| `NASA_CACHE_SECONDS` | Successful image response cache lifetime | `3600` |
| `POSTGRES_PASSWORD` | Docker Compose database password | must be set in root `.env` |
| `VITE_API_URL` | Frontend build-time API origin; omit `/api` | empty; same-origin proxy |
| `ASTRA_TEST_POSTGRES_URL` | Opt-in PostgreSQL integration-test connection | unset |

Set `DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/astra` in `backend/.env`, then run `alembic upgrade head`. Ordinary `postgresql://` or `postgres://` managed-host URLs are normalized to the installed psycopg driver. Use a database you created for ASTRA; migrations create its tables without deleting existing user data.

Anonymous session IDs are private bearer capabilities. The browser stores only a session pointer and preferences; authoritative resources stay in the database. Do not log session request URLs. There is no registration, analytics, or collection of names, emails, or locations. A different browser does not automatically share a mission. Local storage clearing loses the pointer, not the server record.

## NASA data and scientific methodology

The bundled catalog contains verified official NASA references on spacesuits, lunar illumination, lunar ice, and radiation protection. Optional enrichment calls the actual unauthenticated NASA Image and Video Library search endpoint. A validated response is cached with a retrieval timestamp; malformed responses, timeouts, errors, or disabled network use the bundled historical-media record. A NASA outage never blocks gameplay.

References, historical images, fictional mission events, and simulation resources are visibly distinguished. Image catalog dates are not asserted to be observation dates. No screen claims live lunar telemetry or live space weather. Moon Trek terrain and DONKI forecasts are not integrated.

Action costs use simulated minutes, educational oxygen units, watt-hours with invented capacities/loads, and dimensionless exposure-risk points. The risk index is neither a radiation dose nor a disease probability. The energy pool is an aggregate mission budget, not a model of power delivery or remote charging. Solar generation, equipment bonuses, scripted events, map distances, and mission limits are teaching parameters. See [SCIENCE.md](docs/SCIENCE.md) and [NASA_DATA_SOURCES.md](docs/NASA_DATA_SOURCES.md).

## Test and build

```sh
cd backend
../.venv/bin/pytest -q
../.venv/bin/ruff check .
../.venv/bin/ruff format --check .
cd ../frontend
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Run backend migrations before browser tests. The browser suite starts local servers if absent. If Google Chrome is installed, `PLAYWRIGHT_CHROME_CHANNEL=chrome npm run test:e2e` uses it instead of downloading Chromium. Playwright covers desktop and a mobile viewport; it exercises the actual API and database. The PostgreSQL test is opt-in and creates/removes only its own randomly named schema. See [TESTING.md](docs/TESTING.md) for evidence and detailed commands.

## Deploy

Docker Compose runs PostgreSQL, the API, and nginx serving the built frontend:

```sh
cp .env.example .env
# Set a suitable POSTGRES_PASSWORD in .env; use URL-safe characters.
docker compose up --build
```

Open **http://localhost:8080**. For managed hosting, deploy the API and PostgreSQL on Render using `render.yaml`, and set a Vercel frontend project root to `frontend`. Set `VITE_API_URL` to the HTTPS API origin and `ALLOWED_ORIGINS` to the exact frontend origin. The live Vercel/Render deployment is recorded in [DEPLOYMENT_STATUS.md](docs/DEPLOYMENT_STATUS.md). See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for setup details.

## Limits and future improvements

One mission is implemented. This is a turn-based training game with original vector art, not a physics, terrain, radiation, physiological, or flight-operations model. Persistent resource choices, protected time, and science progress are implemented; detailed equipment durability, communications outages, measured solar/weather inputs, additional missions, classroom accounts, and Gemini integration are not. ORBIT uses curated topic explanations rather than free-form chat. The app requires its backend for gameplay; NASA enrichment can be offline. There is no service-worker offline installation or cross-device account sync.

Future work could add teacher evaluation, a measured terrain layer with proper provenance, an accessible richer map, additional mission scenarios, and optional bounded AI explanations. Any expansion should retain the deterministic authority boundary.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Gameplay and strategies](docs/GAMEPLAY.md)
- [Scientific methodology](docs/SCIENCE.md)
- [NASA provenance](docs/NASA_DATA_SOURCES.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- [Implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md)
- [Game redesign and design system](docs/REDESIGN.md)
- [Original artwork, prompts, and provenance](docs/ART_ASSETS.md)
- [Final implementation status](docs/STATUS.md)

Source code is MIT licensed. NASA media and bundled font licenses retain their own terms and credits.
