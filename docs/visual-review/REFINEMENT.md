# ASTRA — Lunar Expedition refinement

> Historical record: this vector refinement was reverted at the user’s request on 13 November 2026. Its screenshots and character sheet are retained as design history. The active illustrated version is documented in [../REDESIGN.md](../REDESIGN.md).


Date: 2026-11-13. Scope: frontend art direction and interaction; preserve the simulation/API.

## Audit and priority

1. Replace the painted homepage/portraits: they use a different perspective, proportions and visual texture from the playable map. The original desktop screenshot is `/tmp/astra-before-refinement.png`.
2. Use the actual Phaser map on arrival. Objects must select real mission locations; preview interactions must not create or mutate a session.
3. Create a shared vector specification for Nova, ORBIT, Scout and mission structures. Reuse identical source shapes in portraits, gameplay, equipment and preparation. Supply purposeful emotional states.
4. Replace Fredoka's uniform rounded voice with Space Grotesk headings and DM Sans interface text (existing locally licensed fonts). Reserve display type for headings; use tabular numbers for resources.
5. Remove repeated offset shadows, cream cards and decorative clip/patch motifs. Keep functional equipment compartments, mission operations layouts and report sections.
6. Connect resources and objectives to the map, keep all destinations and controls accessible outside canvas, honor reduced motion.
7. Review desktop/mobile screenshots of arrival, selection, briefing, equipment, active mission and results; fix observed defects. Run existing frontend, browser, backend and build checks.

## Art rules

Vector/procedural artwork authored in source code; no claim of hand-drawn illustration. Three-quarter overhead equipment with a fixed upper-left light and lower-right hard shadows. Dust is neutral warm gray, shadowed crater is slate; orange denotes crew/control equipment, cobalt denotes energy, teal denotes science. Blocked terrain comes from the API collision mask. Terrain details support sites and legibility rather than fill empty space.

Nova: narrow practical suit, clipped-corner helmet, asymmetric orange oxygen pack, left shoulder mission bars, slate boots and a wrist instrument. Neutral/focused by default; concern during a warning and raised arm after completion.

ORBIT: offset kite-shaped chassis, one circular optical sensor, hinged instrument arm and one lower stabilizer. Teal sensor identity. Sensor aperture and arm position convey focus, concern and celebration.

Scout: long low chassis, six exposed wheels, offset binocular mast and rear sample canister; orange battery rail, cobalt deck. Mast tilt and signal indicator show scanning, warning and completion. No mascot face.

Motion: short travel interpolations, finite selection emphasis and equipment state transitions. No idle bouncing or perpetual decorative pulsing. Reduced motion places objects directly in their authoritative state.

## Verification

Implementation, browser review and corrections are recorded below.

## Implemented reference specification

All characters use a 180 × 180 SVG viewBox. `worldArt.ts` supplies the source to React images, the equipment station, survey diagrams and Phaser SVG textures. The reference sheet is [character-reference.svg](character-reference.svg). No new raster generation or unrelated character variants were used.

| Character | Distinctive equipment and color | States |
| --- | --- | --- |
| Nova | Clipped helmet, asymmetric orange oxygen pack, shoulder bars, chest readout, slate boots | Focused stance; curious brows; concerned brows during low reserves or particle warning; raised arm on return |
| ORBIT | Kite-shaped body, one optical aperture, hinged instrument arm, stabilizer, teal sensor | Normal aperture; enlarged scanning aperture; amber contracted warning sensor; raised arm |
| Scout | Low six-wheel chassis, binocular mast, rear sample canister, orange battery rail, cobalt deck | Forward mast; scanning tilt; warning tilt/amber signal; raised mast |

The stateful mission guide selects poses from actual actions and reserves. Scene equipment uses the same shapes and colors; the solar controller changes from amber to teal after repair. Movement follows the API's accepted path, and warnings follow the astronaut during the movement. Selecting a supply name highlights its related equipment and explains the connection in accessible text. Exposure remains a fictional risk index; the energy model remains an aggregate budget.

## Browser review and corrections

| Screen | Observed weakness | Implemented correction |
| --- | --- | --- |
| Arrival | Painted scene, static hotspots and a different world from gameplay | Actual Phaser scene, API coordinates, selectable structures, explicit tutorial and safe preview; no session mutation |
| Selection | Same decorative picture reused as a promotional tile | Expedition survey beside one mission assignment; shared environment assets |
| Briefing | Disconnected artwork and overlapping site labels | Survey geometry and labeled equipment match the mission; labels repositioned and shortened in scale |
| Equipment | Four floating cream cards; unrelated rover icon | Divided equipment station, clear packed state, shared six-wheel Scout art |
| Active mission | Resource deltas cover labels on mobile; warnings appear at the destination before arrival | Aligned supply instruments and deltas beside values; warnings follow the moving astronaut; screenshots wait for travel to settle |
| Results | Decorative star scattering and identical card shadows | Restrained report stamp, shared crew pose, simple evidence and achievement rows; portrait and badge occupy separate mobile columns |
| Mobile | Header overflow at 320px; science illustrations exceed their columns; fixed mission header clips navigation | Two-row narrow navigation, illustrations fit their columns, header takes its content height |
| Accessibility | Selected-site/footer contrast and mismatched visible/accessibility button labels | Darkened small text, appropriate footer colors, matching names and visible controls; Escape restores discovery-trigger focus |

The empty canvas warning label is hidden when there is no warning, removing an unexplained colored rectangle above Nova.

Screenshots of landing, mission selection, briefing, equipment, active mission, results and report were reviewed at desktop and mobile sizes. The saved evidence is indexed in [screenshots/README.md](screenshots/README.md). A tablet mission view and the original landing are included for comparison.

## Verification results

- Backend: **42 passed**, including the opt-in PostgreSQL integration test. No backend source files changed.
- Frontend: **10 Vitest/React Testing Library tests passed**.
- Browser: **10 Playwright tests passed**, five journeys each in desktop and mobile Chromium. Four affected arrival/full-mission cases also passed after the final canvas alert-visibility adjustment. The new preview journey clicks an actual Phaser object, checks the tutorial/disclosure, restores focus and observes zero POST requests. The full mission journey verifies supply-to-map highlighting.
- axe-core WCAG A/AA/2.1 A/AA tags: zero reported violations on arrival, discovery, mission selection, active mission, science, results, report and settings in the two browser projects.
- Responsive review: **44 route/viewport checks passed** with no horizontal overflow: six public routes at 320/390/768/1024/1440px, active mission at those five widths, and arrival/briefing/active mission with larger text and reduced motion at 320/390/768px. No browser page errors were observed.
- Manual keyboard skip-link check passed: focus reveals the link, Enter focuses main content, and the link hides after focus leaves.
- TypeScript and Vite production build passed. Main JS 474.59kB / 152.35kB gzip; lazy Phaser chunk 1,215.34kB / 333.20kB gzip; CSS 83.07kB / 17.47kB gzip. Vite's large-chunk notice remains; arrival now intentionally loads Phaser. No real-device performance benchmark is claimed.
- Frontend HTTP 200 and API health succeeded. The local services remain running at `http://127.0.0.1:5173/` and `http://127.0.0.1:8000/`.

## Acceptance review

- [x] Arrival begins in the same environment as the playable mission.
- [x] Characters retain recognizable silhouettes, equipment and states across screens.
- [x] Environment, characters and menus follow a shared source art system.
- [x] Repeated rounded cards, offset shadows and painted overlays are substantially reduced.
- [x] Scene selection, resource labels and warnings communicate actual mission information.
- [x] Existing authoritative gameplay, NASA references, persistence and outcomes still pass their checks.
- [x] Desktop/mobile screenshots reviewed, responsive defects corrected, tests and build pass.

The concrete improvements above do not establish that every viewer will consider the result free of AI aesthetics. This is a deliberate, simple vector game style. Character motion is limited to travel interpolation and discrete poses rather than a full frame-animation set. Automated accessibility and emulated mobile checks do not replace child usability trials or real-device/screen-reader testing.
