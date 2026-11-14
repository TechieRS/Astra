# NASA data and provenance

ASTRA separates NASA scientific context from its fictional lunar mission. The tracked [reference bundle](../data/scientific-references/sources.json) contains curated facts, source URLs, retrieval dates, observation dates when known, attribution and limitations. These facts remain available without a NASA account, API key or network connection. They are not a live telemetry feed.

## Reference inventory

| ID | Official source | Application use | Time classification |
| --- | --- | --- | --- |
| `lunar-illumination` | [NASA South Pole Illumination Map, PIA13720](https://science.nasa.gov/photojournal/south-pole-illumination-map/) | Solar-power and shadow explanations | Historical composite; added December 15, 2010; exact observation interval unspecified |
| `lunar-ice` | [NASA NSSDC: Ice on the Moon](https://nssdc.gsfc.nasa.gov/planetary/ice/ice_moon.html) | Scientific motivation for a shadowed-site sample | Historical context; LCROSS impact October 9, 2009 |
| `spacesuit-life-support` | [NASA: What Is a Spacesuit?](https://www.nasa.gov/humans-in-space/what-is-a-spacesuit/) | Oxygen and life-support explanations | Educational reference; no observation date |
| `lunar-radiation` | [NASA: Protecting astronauts from space radiation](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/) | Shielding and shelter explanations | Educational reference published August 7, 2019 |
| `nasa-image-library` | [NASA media search](https://images-api.nasa.gov/search?q=lunar%20south%20pole&media_type=image&page_size=6) | Optional historical-image catalog enrichment | Historical media retrieved through a current API request |

All references were checked November 12, 2026. A retrieval date describes when this project checked a source, not when an observation occurred. A null observation date means no precise observation date is asserted.

## Verified public API

The [official API documentation](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf) describes NASA's Image and Video Library search service. The following real request succeeded using HTTPS certificate validation and no API key:

```sh
curl --fail --get 'https://images-api.nasa.gov/search' \
  --data-urlencode 'q=lunar south pole' \
  --data-urlencode 'media_type=image' \
  --data-urlencode 'page_size=6'
```

The JSON response is Collection+JSON: `collection.items` contains media entries; each entry has a `data` array with fields such as `nasa_id`, `title`, `date_created`, `media_type`, `center` and optional credits. Its `links` array contains media URLs. The checked response had six entries, including `PIA13523`, *The Lunar South Pole*, credited to NASA/GSFC/Arizona State University, with catalog `date_created` `2010-09-27T22:24:40Z`.

Treat that timestamp as catalog metadata. It is not a verified sensor-acquisition time. A refreshed media search must retain the historical-media label. Accept only validated expected fields, use timeouts and a cache, preserve attribution, and fall back to bundled records on HTTP, validation or network failure. API availability never determines whether a mission can be completed.

## Access and attribution

The reference pages and checked image search are publicly readable without credentials. NASA's [media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) allow many educational uses, subject to their conditions. Preserve individual credits and any third-party restrictions. Do not imply NASA endorsement; the NASA insignia, logotype and identifiers have separate restrictions. ASTRA's original game artwork does not require NASA imagery or logos.

## Scope and limitations

No DONKI observations drive the mission. A terrestrial or cataloged solar event alone would not establish radiation dose at a fictional lunar landing site. The game's environmental alert is explicitly simulated. Moon Trek tiles and instrument-grade elevation models are not used; the compact playable map is original fictional geography. The current integration supplies verified scientific context and optional historical media, not a physically calibrated terrain or space-weather model.
