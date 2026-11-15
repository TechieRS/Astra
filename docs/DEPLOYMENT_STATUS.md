# Hosting deployment status

Updated: 15 November 2026.

- GitHub source: `TechieRS/Astra`, branch `main`.
- Vercel CLI authentication: verified successfully.
- Render CLI authentication: verified successfully.
- Vercel project: `astra` in `Ravi's projects`, created and linked to `frontend`.
- Render workspace: `My Workspace`.
- Render blueprint validation: passed.
- Production API timeout: 90 seconds to allow free-instance startup; frontend tests and build passed.
- Hosted frontend/API deployment: pending the database decision below; no functional public URL is claimed.

## Current database constraint

The workspace already has an active free PostgreSQL database named `nourish-db`, expiring on 28 November 2026. Creating `astra-db` on the free plan was retried and Render returned: `cannot have more than one active free tier database`.

Two concrete ways to continue without purchasing a database:

1. With the user's permission, add a separate `astra` schema to `nourish-db`, run only ASTRA's migration in that schema, and configure ASTRA's connection search path to it. This shares database capacity and the existing expiration date. No existing application's tables need alteration.
2. Create a separate free Render workspace for ASTRA, then provision its own free database and API there. The account currently exposes one workspace; workspace creation is available through the Render Dashboard.

No changes have been made to `nourish-db`.

Provider account authentication is stored by the native CLIs outside tracked source. Vercel-generated local metadata/environment files are ignored by Git.
