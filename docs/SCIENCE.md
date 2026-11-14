# Scientific methodology

ASTRA teaches how limited supplies shape mission decisions. It is an educational simulation, not a flight-planning tool. Resource capacities, action costs, equipment bonuses, event timing, map coordinates, scores and success thresholds are game-design parameters. NASA sources explain the underlying concepts; they do not validate those parameters.

## Models and units

The backend simulation engine is authoritative. Resource updates happen when a validated action is accepted, not with browser frame rate or time spent reading. This gives children time to think and makes sessions reproducible.

| Model | Inputs | Output and equation | Main simplifications |
| --- | --- | --- | --- |
| Oxygen | Previous reserve, action duration, activity rate, equipment modifier | `O₂_next = max(0, O₂_previous − duration × activity_rate × modifier)` in educational oxygen units | Units are fictional reserve units, not liters, grams, pressure or physiological dose. No metabolic or carbon-dioxide model. |
| Electrical energy | Previous stored energy, action duration, load, usable solar generation, capacity | `E_next = clamp(E_previous + generated_Wh − consumed_Wh, 0, capacity_Wh)` | Watt-hours are the energy unit; loads and capacities are invented. No electrical network, thermal, battery chemistry or detailed illumination calculation. |
| Mission time | Previous elapsed time, action duration | `t_next = t_previous + duration` in simulated minutes | Compressed fictional schedule; wall-clock time does not drain supplies. |
| Radiation risk | Previous index, duration outside shelter, event multiplier, shielding modifier | Accumulate nonnegative exposure contributions into a bounded educational risk index | Dimensionless index; not mGy, mSv, a percentage chance of illness or a validated human exposure limit. |
| Movement | Current map location, validated destination/path, transport | Travel duration and oxygen/energy costs | Compact fictional map; no validated lunar topography, real rover speed or measured astronaut workload. |
| Science | Completed unique collection/investigation actions and equipment | Discrete progress/sample count | A gameplay objective, not a measurement of scientific value or confirmation that a sample contains water. |

## Gameplay coefficients

These are teaching parameters, not empirical NASA measurements. The simulation engine remains the executable source of truth.

| Action or parameter | Duration / capacity | Oxygen cost | Electrical cost |
| --- | --- | --- | --- |
| Starting oxygen | 100 educational units; extra tank adds 25 | — | — |
| One validated movement step | 1 simulated minute | 0.9 units | 1.5 Wh with rover, 0.7 Wh walking |
| Outdoor wait | 5 minutes | 4.5 units | 2 Wh |
| Habitat inspection | 4 minutes inside | 0 | 2 Wh |
| Solar-array repair | 9 minutes; 6 with solar tools | 1.2 units per minute | 12 Wh; 8 Wh with tools |
| Ridge sample | 8 minutes | 9.6 units | 12 Wh |
| Crater sample | 12 minutes | 14.4 units | 18 Wh |
| Shelter | 8 minutes protected | 0 at habitat; 0.4 units/min at field shelter | 2 Wh |
| Repaired solar generation | Subsequent action time only | Does not create oxygen | +1.2 Wh per simulated minute, capped at energy capacity |

For outside actions, risk accumulates at 0.35 index points per minute, or 1.8 during the fictional storm. Shielding halves that contribution. Protected habitat/shelter time contributes zero; it does not lower the accumulated index. The scripted storm begins at mission minute `30 + seed % 7` and lasts 14 minutes. It is not a forecast or DONKI observation. The mission has a 100-minute limit; depleted oxygen or energy, or risk reaching 100, ends the simulated sortie unsuccessfully. Exact boundary behavior and any action-specific exceptions are tested in the engine.

Action-specific costs are defined in the engine and exposed in action previews. Action outcomes must use the same rules as the previews. An action cannot produce negative reserves, overfill a battery, repeat a unique sample, bypass a locked mission phase or alter a completed mission. Shelter can reduce future exposure; it does not erase accumulated exposure. A repaired solar array supplies energy only through the modeled generation rule and never restores oxygen.

The electrical store is an aggregate mission budget: generation at the outpost offsets mission consumption even during excursions. It is not a physically routed power system, and it does not imply remote wireless battery charging. Travel always counts as outside activity, including the step that arrives at shelter; subsequent protected actions add no exposure. Indoor waiting costs no suit oxygen. Sampling and repair are outdoor activities; oxygen and risk increase with their full modeled duration.

## Scientific basis

Spacesuit backpacks provide oxygen and remove exhaled carbon dioxide. That motivates the finite reserve and return-planning mechanic, rather than any claim of a NASA-derived consumption rate. [NASA: What Is a Spacesuit?](https://www.nasa.gov/humans-in-space/what-is-a-spacesuit/)

The lunar south pole contains sharply different lighting conditions. ASTRA uses that principle to make stored energy and solar-system repair meaningful. Its map is not a reconstruction of the historical illumination observations. [NASA South Pole Illumination Map](https://science.nasa.gov/photojournal/south-pole-illumination-map/)

Evidence from lunar missions motivates looking for water-bearing material in cold regions. A fictional collected sample earns science progress, not a scientifically proven ice discovery or usable oxygen supply. [NASA NSSDC: Ice on the Moon](https://nssdc.gsfc.nasa.gov/planetary/ice/ice_moon.html)

Solar energetic particles are a real exploration concern, and shielding can help protect a crew. The scripted alert illustrates planning a protected return. Shadow alone does not provide shielding from penetrating energetic particles. [NASA radiation protection overview](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/)

## Provenance and data labels

The source bundle distinguishes curated educational references and historical media. Simulated resource readings and fictional events must remain visibly identified as simulation values. Historical observations retain their date where one is known; otherwise the observation date remains null. Retrieval timestamps describe retrieval only. See [NASA_DATA_SOURCES.md](NASA_DATA_SOURCES.md) for verified access, attribution and integration limits.

## Learning design and limits

Decision feedback connects action, resource impact, outcome and a possible future choice. Multiple strategies should work: spend time repairing power, prioritize a short science excursion, or take a conservative return. Successful safety decisions can produce less science without being framed as a personal failure. An unsuccessful simulated sortie is an invitation to replay with a different plan.

The model omits suit pressure, carbon-dioxide scrubbing, temperature, dust damage physics, orbital mechanics, detailed human performance, radiation transport and sample chemistry. The game must never convert its risk index into a medical claim. No live NASA dataset or generative AI changes mission state.
