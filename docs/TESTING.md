# Testing

## Backend

From `backend`:

```sh
../.venv/bin/pytest -q
../.venv/bin/ruff check .
../.venv/bin/ruff format --check .
```

The deterministic suite covers phase locks, immutable input state, equipment bonuses, oxygen/energy formulas, repaired generation and capacity, collision and path validation, pause/resume, unique samples/decisions, event timing, protected time, all six outcomes, and travel interruption at resource exhaustion. API tests run the actual Alembic migration in a fresh temporary SQLite database, then verify persistence, request idempotency, stale actions, concurrent writes, terminal report storage, CORS, input and body limits, rate limits, NASA fallback/schema failure, successful caching, and deterministic explanations.

An opt-in PostgreSQL test uses a randomly named test-owned schema, applies the same migration, makes concurrent identical API calls, and checks the persisted version/action count. It drops only its own schema afterward:

```sh
ASTRA_TEST_POSTGRES_URL='postgresql+psycopg://user:password@localhost:5432/astra_test' \
  ../.venv/bin/pytest -q tests/test_postgres.py
```

The database role needs permission to create/drop schemas in that database. This is intentionally opt-in rather than pointing automated tests at a user's arbitrary production database.

## Frontend

From `frontend`, `npm run test` runs Vitest and React Testing Library. Tests cover direct start-screen-to-briefing navigation, private callsign selection, loading and error states, no-session recovery, meaningful accessible resource values, persisted accessibility preferences, decision request payloads, failure/replay/report links, interactive character discoveries with focus restoration, and optional deeper mission explanations.

`npm run build` runs TypeScript and the Vite production build. The Phaser scene is lazy-loaded for exploration; landing and learning pages do not load the game bundle.

## Browser journeys

First migrate the backend database. From `frontend`:

```sh
npx playwright install chromium
npm run test:e2e
```

Use `PLAYWRIGHT_CHROME_CHANNEL=chrome` if an installed Google Chrome is preferred. The suite uses one worker with desktop and mobile Chromium projects. Servers start automatically when absent. Use an isolated local database for repeated test runs if you want to keep demo session history separate. This suite creates anonymous sessions and never alters an existing session selected by a user.

Four journeys run on each viewport: successful completion from direct briefing to report/export/replay; a real resource-depletion failure; NASA attribution, landing discoveries, ORBIT, and accessibility settings; and optional crew onboarding plus the rover loadout and a safe early return. The rover journey asserts the actual 1.5 Wh travel cost. Accessibility scans cover landing, discoveries, mission selection, active mission, science, results, report, and settings. Failure artifacts and representative screenshots are under `frontend/test-results`; HTML reports are under `frontend/playwright-report`.

Automated accessibility checks are useful evidence, not a complete manual accessibility audit. Keyboard focus, touch alternatives, color-independent units/status, motion controls, and screen-reader structure are implemented; classroom usability studies and multiple real mobile-device/browser engines remain future work.

## Audits and container configuration

Run `npm audit --audit-level=moderate` in `frontend` and `.venv/bin/pip-audit --progress-spinner off` at root. Audit results reflect the installed lockfiles at execution time, not a future guarantee. Run `docker compose config --quiet` when Docker is installed, then build and exercise the containers. See [STATUS.md](STATUS.md) for actual results and unavailable checks.

## CI

The GitHub Actions workflow supplies PostgreSQL, migrates it, runs Python and frontend tests/builds/audits, installs Chromium, executes Playwright, checks Compose configuration, and retains browser failures. A workflow file is not evidence of a hosted CI run; no remote repository workflow has been executed as part of this local delivery.
