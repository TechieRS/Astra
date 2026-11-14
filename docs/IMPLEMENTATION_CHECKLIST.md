# ASTRA implementation checklist

- [x] Inspect workspace: empty; no existing application or applicable AGENTS.md.
- [x] Choose modular React / FastAPI architecture with server-authoritative turns.
- [x] Implement persistence, migration, simulation rules, and validated API.
- [x] Implement full mission navigation and Phaser exploration.
- [x] Integrate verified NASA sources, offline catalog, and optional cached image search.
- [x] Polish responsive UI, controls, accessibility, and explanations.
- [x] Run backend, frontend, browser journeys, type checks, production build, and lint.
- [x] Write setup, methodology, deployment, demo, and final status documentation.

Verification evidence and remaining limitations belong in `docs/STATUS.md`.

## Game UI redesign — 13 November 2026

- [x] Audit existing pages, repeated patterns, game interactions, and source boundaries.
- [x] Define game identity, typography, color tokens, cast, and original local artwork.
- [x] Replace the landing page and crew onboarding; open the briefing directly from Start.
- [x] Redesign mission selection, briefing, route illustration, and equipment preparation.
- [x] Prioritize the Phaser map with compact supplies/objective HUD and contextual actions.
- [x] Add crew dialogue, optional explanations, resource feedback, and rover interaction.
- [x] Redesign mission outcomes, celebration, journal, and science notebook.
- [x] Execute 42 backend, 10 frontend, and 8 browser tests; build, review screenshots, and check responsive/accessibility behavior.

## Lunar Expedition refinement — 13 November 2026

- [x] Audit the illustration/gameplay disconnect and prioritize specific weaknesses.
- [x] Define vector silhouettes, controlled shapes, lighting, type and motion rules.
- [x] Use the actual Phaser scene and API mission coordinates on arrival.
- [x] Share characters, emotional states and environment objects between React and Phaser.
- [x] Replace repetitive floating card treatments with expedition operations, equipment compartments, integrated instruments and report sections.
- [x] Connect map objects, supply labels, alerts and route selection without changing simulation rules.
- [x] Verify narrow layouts, accessibility, complete mission journeys and persistence.
- [x] Run backend, frontend, browser and production checks; capture and inspect desktop/mobile screenshots.

Current evidence: [visual-review/REFINEMENT.md](visual-review/REFINEMENT.md).

## Previous version restored — 13 November 2026

- [x] Restore the illustrated landing, original portraits, fonts, palette, equipment art, results, and Phaser scene.
- [x] Preserve existing mission functionality and saved data.
- [x] Verify 10 frontend tests, 8 browser tests, production build, and desktop/mobile screenshots.

The Lunar Expedition refinement above is historical and has been reverted at the user’s request.
