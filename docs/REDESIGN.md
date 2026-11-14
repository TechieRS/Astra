# ASTRA game identity redesign

> This illustrated design was restored at the user’s request on 13 November 2026, replacing the subsequent Lunar Expedition refinement.

Implemented in the existing frontend on **13 November 2026**. The authoritative backend, API contracts, mission rules, persistence, NASA source catalog, and outcomes were preserved.

## Audit

The original interface used one dark navy/mint treatment for almost every page. A marketing headline, feature cards, small uppercase labels, and repeated analytics panels competed with the exploration map. The original landing illustration did not respond to a player. Long in-mission explanations gave equal priority to every sentence. Preparation, exploration, and reflection felt like the same dashboard.

## Art direction and tokens

The new identity is a small lunar field station: warm tactile terrain, a rich cosmic sky, orange equipment, cream suits, and field notebooks. Pages now have distinct purposes: an illustrated start screen, crew introductions, a briefing spread, an equipment bay, a mission HUD, a science notebook, and a crew debrief.

| Token | Value / purpose |
| --- | --- |
| Cosmic blue | `#132f51`, navigation and sky |
| Astronaut cream | `#fff9eb`, dialogue and equipment labels |
| Lunar paper | `#f6efdf`, reading surfaces |
| Mission orange | `#f3a24e`, primary actions |
| Lunar gold | `#d9bd77`, frame and mission accents |
| Ink | `#213a53`, text and illustrated outlines |
| Display type | Fredoka 600, self-hosted |
| Reading type | Nunito Sans regular/bold, self-hosted |

Primary buttons have a physical pressed state, a readable dark label, a border, and a small offset shadow. Typical reading text is 15–18 px; responsive labels and units remain explicit. Colors are accompanied by names, numbers, state text, checkmarks, and icons.

## Characters with jobs

- **Captain Nova** welcomes the commander, explains the briefing, introduces the initial habitat task, and offers encouraging mission outcomes.
- **ORBIT** explains resource consequences. During exploration, a short contextual message appears first; **Tell me why** reveals the full scientific explanation. The server log and report still retain every explanation.
- **Scout** explains the rover's equipment trade-off. The equipment bay and field notebook distinguish a packed rover from a rover parked at base. When packed, the Phaser commander travels with Scout. Clicking the parked rover animates a short response and opens the same loadout explanation available through an accessible button.

Original generated illustrations and transparent character cutouts are bundled locally. Production WebP files total approximately 1.1 MB for the scene and all three portraits combined. PNG originals are retained. Exact prompts, tool mode, and asset provenance are in [ART_ASSETS.md](ART_ASSETS.md). These are fictional game illustrations, not NASA data or measured terrain.

## Interaction and flow

The primary **Start your mission** action opens the briefing directly. Mission selection and callsign/crew onboarding remain available through navigation, and the briefing includes callsign selection so no personal details or unnecessary detour are required. A separate action resumes an existing session.

The habitat, rover, and discovery hotspots on the start scene reveal contextual crew dialogue. They do not simulate resource changes before a mission exists. Keyboard users receive focus in the disclosure and can close it with Escape, returning focus to the trigger.

Exploration uses a compact next-objective bar, one integrated supplies HUD, a large tactical lunar map, one field notebook for destinations/current actions, and a collapsible full checklist. The original validated grid, shortest paths, collisions, movement costs, and save behavior remain authoritative. All destinations also have readable buttons outside the canvas.

Oxygen/power/risk changes produce temporary signed value badges. Equipment selection marks the packed item and cargo slot. A particle event has a brief entrance transition and contextual shelter advice. Terminal outcomes include crew feedback; successful outcomes receive a short star celebration. Existing reduced-motion controls and the system preference suppress CSS effects and Phaser travel/bob animation. No audio is required.

## Scientific boundary

NPC dialogue is prewritten UI feedback and never changes mission state. Full server explanations, journal deltas, source dates, observation-date limits, offline NASA fallback, and report generation remain available. Risk is still an educational point index; oxygen is still game units; the electrical pool is still a simplified mission budget. The painted background does not determine collision geometry or invent NASA measurements.

## Verification

The revised tests cover direct start-to-briefing navigation, optional crew onboarding, callsign persistence, original successful and failed mission paths, pause/reload/resume, the rover loadout's actual travel cost, early return, journal export, landing discoveries, keyboard focus restoration, short/deep science feedback, responsive overflow, and accessibility scans. Screenshots are captured from the actual running application, including briefing, loadout, exploration, results, and report. See [STATUS.md](STATUS.md) for executed results and remaining environment limits.
