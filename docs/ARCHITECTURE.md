# Architecture

ASTRA is a modular monolith. A React/Vite/TypeScript client uses Chakra UI, React Router, TanStack Query, Zustand, and a lazy-loaded Phaser 3 scene. FastAPI owns all mission state. SQLAlchemy persists anonymous sessions, immutable actions, resource snapshots, and reports in PostgreSQL. SQLite is a documented local-development option; the same Alembic migration supports both.

## Authoritative simulation

The pure Python engine accepts a state and validated command, copies the state, checks preconditions, calculates costs, resolves persistent events, and returns the next state. No browser or assistant can set resources. Turns represent simulated minutes; real wall-clock time never drains a child's resources. The server defines terrain, collisions, shortest paths, equipment effects, costs, and mission outcomes. A state version prevents stale concurrent actions. A unique action ID plus request hash implements retries without double charging; an identical retry returns its original response, while ID reuse with a different payload fails.

Session IDs are 256-bit unguessable bearer capabilities. They stay in local storage, never in telemetry, and grant access only to one anonymous mission. A session row lock in PostgreSQL serializes writes; an optimistic version condition protects SQLite and stale clients. No registration or personal information is collected. Restart creates a fresh session and preserves the old report until the local pointer is replaced.

## Persistence

`mission_sessions` stores current JSON state and version. `mission_actions` stores a request digest, action UUID, response, and sequence; it is also the event history and resource snapshot. `learning_reports` stores terminal results. Mission definitions and source provenance are version-controlled data, avoiding duplicate mutable catalog sources. Alembic creates the schema. Application startup does not silently create tables: run migrations first.

## Data boundaries

Curated NASA facts remain available offline and are labeled as references. Optional NASA Image and Video Library search is validated, cached with retrieval times, and falls back to the bundled catalog. Imagery is educational context; it never sets oxygen, energy, radiation, or space weather. The compact lunar map is fictional, not Moon Trek terrain. All resource coefficients are educational balancing assumptions.

## Technical choices

- Turn-based travel makes consequences reproducible and enables pause, accessible controls, and low-latency animation without a live socket.
- Phaser draws original vector terrain, structures, rover, and astronaut; no external asset service is required.
- Start-screen/briefing illustrations and recurring crew portraits are local optimized WebP assets. The pure React `CrewDialogue` and `MissionDialogue` components present deterministic guidance and optional deeper explanations; they do not introduce a second mission-state store. The painted illustration is never used as measured terrain or collision data.
- ORBIT uses deterministic explanations. Gemini is omitted from the delivered scope so no model output can change state or introduce unsupported claims.
- PostgreSQL is the production database. SQLite permits a clean local run without Docker.
- Sites hosting cannot execute a Python/FastAPI process. The complete application targets Docker Compose, or Vercel plus Render; a frontend without its authoritative API is not a playable deployment.
