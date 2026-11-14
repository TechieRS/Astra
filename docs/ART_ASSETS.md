# ASTRA artwork provenance

> The illustrated design and WebP assets below are active again, restored at the user’s request on 13 November 2026. The later vector refinement was reverted.

Created **13 November 2026** using the built-in `image_gen.imagegen` tool. These are original illustrated game assets, not NASA photographs, observations, measurements, or a map of real lunar terrain. The scene and all character designs are fictional educational artwork. No external game, character, NASA insignia, or branded interface was used as an art reference.

## Delivered files

| Workspace path | Dimensions | Alpha | Approximate size | Intended role |
| --- | --- | --- | --- | --- |
| `frontend/public/art/lunar-outpost.webp` | 1672 × 941 | No | 393 KB | Start screen and mission briefing; upper-left sky supports headings; habitat at right; quiet terrain at lower-left supports dialogue. |
| `frontend/public/art/nova.webp` | 1312 × 1199 | Yes | 276 KB | Optimized production Captain Nova portrait; same dimensions and content as PNG. |
| `frontend/public/art/orbit.webp` | 1312 × 1199 | Yes | 159 KB | Optimized production ORBIT companion; same dimensions and content as PNG. |
| `frontend/public/art/scout.webp` | 1536 × 1024 | Yes | 289 KB | Optimized production Scout rover; same dimensions and content as PNG. |
| `frontend/public/art/nova.png` | 1312 × 1199 | Yes | 1.7 MB | Captain Nova introduces the mission, explains the next task, and gives crew feedback. |
| `frontend/public/art/orbit.png` | 1312 × 1199 | Yes | 915 KB | ORBIT gives science explanations and resource consequence feedback. |
| `frontend/public/art/scout.png` | 1536 × 1024 | Yes | 2.2 MB | Scout explains equipment/rover trade-offs and supports exploration tutorials. |

`lunar-outpost.png` is the full generated PNG source retained alongside the optimized WebP. Prefer the WebP for browser delivery. The illustration is approximately 16:9. Earth sits at upper-right; habitat/solar array at right-middle; Nova near horizontal center; Scout at lower-right; ORBIT immediately left of Nova. Lower-left terrain is intentionally quiet for a contextual dialogue overlay. The upper-left/center sky is quiet for the interface heading.

The three character cutouts have a genuine alpha channel verified with macOS `sips -g hasAlpha`. Each output was visually inspected. Warm white, mission orange, deep blue, and teal identity accents remain consistent between the scene and cutouts.

## Tool and processing

Each image was generated with the built-in tool; no API key or fallback image-generation CLI was used. The first scene was a fresh generation. Character generations used the saved scene as an explicit visual/identity reference via `referenced_image_paths`, with `transparent_background: true`. The scene used `transparent_background: false`.

Generated PNG sources were copied into the project. The scene was encoded to WebP quality 90 with `sharp-cli` invoked transiently through npm; dimensions, composition, and image content were not edited. No new application dependency was installed. macOS `sips` cannot encode WebP in this environment; the available Sharp encoder completed the conversion. No Python image editing was used.

The three character WebP siblings were encoded at quality 88 and alpha quality 100 using `sharp-cli`, preserving original dimensions, full composition, and alpha transparency. Their combined size is approximately 724 KB, versus approximately 4.8 MB for the source PNGs. The PNG sources are retained. Prefer the `.webp` versions for application references. Dimensions and `hasAlpha: yes` were verified for each production file, and the Nova WebP was also visually compared with the source. Decoded raw alpha channels were compared pixel-for-pixel with Sharp: all three WebP files have **zero differing alpha pixels** and maximum alpha difference **0** versus their PNG sources.

```sh
npm exec --yes --package=sharp-cli -- sharp -i frontend/public/art/nova.png -o frontend/public/art/nova.webp -f webp -q 88 --alphaQuality 100
npm exec --yes --package=sharp-cli -- sharp -i frontend/public/art/orbit.png -o frontend/public/art/orbit.webp -f webp -q 88 --alphaQuality 100
npm exec --yes --package=sharp-cli -- sharp -i frontend/public/art/scout.png -o frontend/public/art/scout.webp -f webp -q 88 --alphaQuality 100
```

## Exact generation prompts

### Lunar start-screen scene

```text
Use case: illustration-story.
Asset type: wide landscape illustrated game start-screen background for ASTRA, a premium lunar adventure for ages 7–12.
Primary request: An original, polished lunar field station scene with a friendly astronaut Captain Nova near a compact exploration rover Scout, a habitat and solar array, and small robot ORBIT.
Scene/backdrop: rich cosmic-blue starry sky with a distant blue Earth; broad stylized rolling lunar terrain in warm gray and muted lunar gold, visible craters, a footprint trail. Moon has no air or plants.
Subjects: Captain Nova, recognizable round oversized helmet, warm tan friendly smiling face seen through a pale blue visor, offwhite pressure suit with mission-orange collar and gloves and navy details; Scout is a compact offwhite and orange six-wheel moon rover with a cute camera mast; ORBIT is a small floating offwhite robot with teal display face, two expressive teal eyes and a coral-orange antenna. Habitat is a charming offwhite/orange modular lunar pod with blue solar arrays.
Composition: panoramic 16:9-style landscape. Upper 35 percent quiet dark blue sky reserved for readable interface heading overlays. Middle distance habitat and solar arrays on right. Lower-middle foreground astronaut standing near rover, robot floating nearby. Lower-left relatively quiet terrain reserved for a dialogue overlay. Clear sense of a place a child can explore, not a marketing illustration.
Style/medium: confident hand-painted children's game concept art, tactile gouache and soft grain, appealing slightly chunky silhouettes, painterly textures, gentle dimensionality and carefully composed storytelling. Warm gold sunlight contrasting cosmic blue shadows. Original contemporary educational adventure aesthetic.
Constraints: artwork only, absolutely no words, letters, labels, logos, interface controls, frames, watermarks, or NASA insignia. No copyrighted characters or copied game style. No shiny plastic 3D rendering, no flat SaaS vectors, no photorealism. Friendly, optimistic, scientifically respectful lunar equipment. Output a large detailed landscape image.
```

### Captain Nova transparent portrait

```text
Use case: illustration-story.
Asset type: reusable transparent character portrait for a children's lunar exploration game.
Input image 1: style and character reference, not an edit target. Reuse the astronaut Captain Nova's original identity and the illustrated art style from this lunar scene.
Primary request: Show Captain Nova alone, waist-up, waving a friendly orange glove toward the child player with a warm confident smile. Same warm tan skin, short wavy dark brown hair, large expressive brown eyes, oversized offwhite round pressure helmet with clear pale-blue visor; same chunky offwhite suit, vivid orange neck ring and gloves, navy shoulder details and harness.
Style: premium polished painted children's adventure game artwork with tactile brush texture, warm sunlight, appealing chunky proportions. Recognizable silhouette and readable friendly expression.
Composition: centered single waist-up character portrait, all helmet and waving hand fully inside frame, ample transparent padding, clean cutout edges.
Background: genuinely transparent alpha background, no background scene, no ground or cast shadow, no white rectangle.
Constraints: maintain the same character identity and suit colors as reference. No text, no letters, no badges, no logos, no watermark. No extra character or prop.
```

### ORBIT transparent companion

```text
Use case: illustration-story.
Asset type: reusable transparent robot companion illustration for ASTRA children's lunar game.
Input image 1 is the original scene and style/identity reference, not an edit target. Reuse the floating robot on the left of Captain Nova.
Primary request: ORBIT alone, a small cheerful floating science robot. Rounded chunky offwhite body/head with orange side rings, a single short orange antenna ending in round orange sphere, dark navy/teal rounded screen with two expressive bright teal smiling eyes, a little cyan hovering thruster underneath. Friendly compact silhouette, angled slightly toward viewer, looking engaged and ready to help. Preserve the original warm illustrated style and identity.
Style/medium: hand-painted children's adventure game art, subtle brush texture, warm cream and orange materials, tactile shapes, restrained teal glow only from eyes and thruster, no shiny plastic rendering.
Composition: entire robot fully visible, centered, with generous transparent padding. No other characters, equipment or props.
Background: genuine transparent alpha, no background, no ground, no rectangle and no cast shadow.
Constraints: no words, letters, labels, badges, logos or watermark. Original character only.
```

### Scout transparent rover

```text
Use case: illustration-story.
Asset type: reusable transparent exploration-rover illustration for ASTRA children's lunar game.
Input image 1 is an original scene and visual identity reference, not an edit target. Reuse Scout, the compact rover near Captain Nova, with exactly the same design language.
Primary request: Scout alone, an endearing six-wheeled lunar exploration rover, full vehicle in three-quarter view, sturdy chunky offwhite body, mission-orange side panels and orange wheel hubs, dark navy solar panel on flat top, camera mast with a binocular-like offwhite/orange pair of black lenses, small stowed orange supply boxes, short orange antenna. Expressive curious pose conveyed by slightly tilted camera mast. Same recognizable rover as reference.
Style/medium: polished hand-painted children's space-adventure concept art with tactile gouache/brush grain, warm directional light, rich blue shadows, substantial rubber wheel treads and friendly rounded shapes. Not photorealism and not shiny plastic 3D.
Composition: complete rover centered with six wheels apparent, all wheels and antenna inside image, transparent padding around silhouette. No astronaut, robot, ground, extra props or environment.
Background: genuinely transparent alpha background, no background rectangle and no large cast shadow.
Constraints: no words, letters, logos, NASA insignia or watermark. Original design.
```

