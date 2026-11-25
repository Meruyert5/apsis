## Unreleased

### Changed

- Published to GitHub Pages at `https://meruyert5.github.io/apsis/`. CI and Pages
  run on Node 22 so the accessibility audit has a global `WebSocket`; the import
  fixture is tracked and the Python matrix is 3.11/3.12.
- The observatory edition replaces the all-blue field: warm black and bone,
  Syne 700-800 display, Space Grotesk reading and IBM Plex Mono telemetry.
  Each view carries one accent (cyan, mint, amber, violet or rose) across the
  hero aura, figure rim, rail state and controls.
- Celestial bodies leave the figure panel. A cropped Canvas2D body - comet,
  ringed planet, star, galaxy, pulsar, nebula, binary or black hole - sits at
  the page edge on every view, with pointer parallax, a 30fps cap and a
  reduced-motion still.
- The identity graph is rebuilt as a full workbench: a 16-account strip, a
  940x600 organic constellation with 15px labels, distinct shapes by kind,
  straight edges within a kind and curves across kinds, hover/selection labels,
  a rotating selected ring and flowing active edges, plus a 340px inspector. On
  mobile the graph scrolls at 720px so labels stay legible.
- Texture and chrome: SVG grain, 64px HUD grid, CRT scanlines, ambient edge glow,
  warm glass topbar, cream primary button, bone hairline panels. Interactive
  states now follow the view accent instead of the old ultramarine.
- New mark in the Overview palette: three glossy four-point sparkles in gold,
  cyan and violet on a deep-blue HUD tile, with a faint orbit and star field.
  The solid/outline APSIS wordmark in Syne sits beside it. Matching 512/180
  icons. Sora, IBM Plex Sans and Instrument Serif are removed; the payload is
  Syne, Space Grotesk and IBM Plex Mono.
- The social preview is now a 1200x630 crop of the Overview dashboard instead of
  the separate sparkles card, so shared links show the console itself.
- The wireframe pass is tinted to each view accent - cyan, mint, amber, violet or
  rose - with base, pale and hot tones for structure, active lines and highlights,
  a depth fog, larger nodes and accent selection rings. The 2D fallback inherits
  the same accent.
- Every figure has two instruments. A `Planets` / `Wire` switch replaces the old
  `3D` / `2D` toggle: the default is a glossy scene (graphite sphere, lit
  terminator, small metal-rough bodies, orbit rings), and the wireframe remains
  one click away. A static 2D board appears automatically when WebGL is
  unavailable.
- The sidebar snapshot is a proper card: date, time, read-only status with a
  pulse, and 16 / 194 metrics above a quiet synthetic-fleet footer.
- Chart and graph motion: pulsing halos, flowing active edges, a soft glow on
  the rank bars, verb bars and donut, all stopped by reduced motion.
- Path map is a solar system: an ivory star, eight planets on eight orbits, a
  clear numbered route with a travelling pulse, and a cut that crossfades the
  star into a shader-lit black hole with a Doppler accretion disk, photon ring
  and lensing arc. Restoring the route brings the star back.
- Atlas is the same language at account scale: an ivory star, sixteen glossy
  account bodies and trust arcs, with a selection ring on the focused account.
- Blueprint gains an event-horizon plate: a black hole, accretion disk and
  `0 routes` closure panel that state the cut result next to the stack.
- Layout reshaped: view actions sit under the lede, the figure stage is taller and
  wider, the hero grid gives the instrument more room, and the horizon row adds a
  closing two-column plate.
- The Overview wordmark is monumental again: 124-216px display type with a
  scaled outline echo, so the hero leads the page instead of sitting at heading
  size. The rest of the type scale is unchanged.
- New mark: a sharp 2px tile with a HUD frame, two inclined orbits, an ice A, a
  cyan crossbar and a white planet at the apsis. `favicon.svg`, the 512px and
  Apple touch PNGs, and the 34px rail mark share the silhouette.
- Repository readiness: `CODE_OF_CONDUCT.md`, corrected NOTICE/SECURITY and
  CONTRIBUTING claims about the optional AWS CLI import, refreshed CITATION and
  package metadata, and an upload runbook with the exact repository
  description, topics and post-deploy edits in `docs/RELEASE.md`.
- Cleanup: removed `console/verify.log`, `console/shots/` and the TS build
  artifact; the working tree now contains only source, fixtures, docs and the
  README screenshots.
- The dashboard is now the only site entry at `/`. The legacy four-deck console,
  its component tree and the design-lab v2-v7 mocks were removed.
- Engine: a CloudTrail overlay marks observed edges and routes, `apsis import`
  converts `GetAccountAuthorizationDetails` dumps, conditions and resource
  policies are evaluated, `apsis diff` is surfaced as the Drift view, and
  `apsis ledger` writes a CSV. The Python suite is 89 tests; the dashboard
  logic suite is 5.
- CI: the site job audits all eight views at 1440 and 390 and runs Lighthouse
  with accessibility, best-practice and SEO assertions.
- Background: a drifting particle constellation with shooting stars, a rotating
  ribbon and a slow scan sweep; all stop with reduced motion.
- The 2D fallback was rebuilt as a wrapped, full-frame board for every figure:
  annotated grids, orbit/nucleus/route geometry and `xMidYMid meet` sizing.
  Fullscreen now shows the whole board in landscape and portrait instead of
  cropping the lower half.
- Typography moved up again: 17px body, 15.5-17px data, 13.5-15.5px labels and
  a 110-196px display title. The display gains a soft orbital glow.
- Corners are sharp everywhere: 2px panels and controls, 0px tags. The desktop
  topbar is a floating glass pill, the hero carries a cyan/cobalt aura over the
  grain, and the palette gained electric cyan, cobalt and periwinkle.
- New brand mark: `favicon.svg` (A inside an orbit), 512px and Apple touch PNGs,
  a web manifest, and a purpose-built 1200x630 `og.png`. The HTML entry carries
  the new icon, manifest and social metadata.
- Extensions now lists the validated alert instance and the delivered Penumbra
  handoff, and the case shows both paths. Blueprint is marked complete and ready
  for upload.
- Added six stdlib contract tests (`tests/test_contracts.py`), taking the Python
  suite to 89. README now has a reviewer path, repository map and dashboard
  screenshots.

- The console is now four cyber decks of one orbital operations console:
  Signal (holographic uplink, cyan/amber), Map (magnetic array, blue/violet),
  Decide (containment bay, emerald/magenta) and Prove (flight recorder,
  rust/amber). Deep navy glass, 1px gradient borders, scanlines and neon HUD
  labels replace the earlier bioluminescent surfaces.
- Sora 600 is the display; Sora 400 the reading face; IBM Plex Mono carries
  deck numbers, HUD labels, data, terminal output and captions. Instrument
  Serif is no longer shipped. The 14px text and 44px control floors remain.
- The Map and Decide sections are Three.js scenes that pause when offscreen and
  fall back to static/2D views for reduced motion. The crew figures are now
  act-tinted rather than grayscale.

### Added

- `docs/design-research.md`: the Pinterest reference trail (NOCTRA, Swiss 037,
  Flowers of the Sky, Deep Sea Bioluminescence), the evidence table, and the
  two-pass direction log from editorial plates to the cyber console.
- Five Signal-only design worlds under `console/public/design-lab/v2/`: GRIT,
  The Quiet Survey, The Flight Deck, The Field Notebook and The Broadcast.
  Each is a vertical slice with real data, a real WebGL stage, drag/zoom, a 2D
  fallback and a reduced-motion path. The revision log is in
  `docs/design-agency.md`.
- Ten exact style plates under `console/public/design-lab/v4/`, one page with a
  full-viewport plate per reference: Acid Graphics, Neo-Vintage Travel, Neon
  Bloom, Limbo, Astronomicon, Silent Authority, Surveillance, Atomic Apsis,
  Vampire and Mesmerize. Each style has a different object carrying the account
  (halftone body, Fuji, blossom, point cloud, megastructure, crown/sword,
  skeleton, chrome helix, fangs, jellyfish) rather than a recoloured orrery.
- The chosen hybrid, "Towards Limitless", at
  `console/public/design-lab/v5/`: Acid grid + Limbo point cloud + Cinematic
  Lo-fi rainy street, in emerald, crimson, acid lime and cyan. A real WebGL
  account cluster with a red route, acid portal, film grain and editorial
  serif italics.
- Three palette studies at `console/public/design-lab/v6/`, all using the exact
  v5 template and the same point-cloud cluster: Thermal / Iridescent (obsidian,
  coral, amber, cyan, mint, ultraviolet, heavy stipple), Neon Luxe (pitch black,
  ice off-white, acid lime, hot crimson magenta) and OPUL 77 (a
  sunset-to-bioluminescent wash behind white type). Palette and light only.
- A new Neon Luxe dashboard at `console/dashboard.html`, built from scratch as
  its own Vite entry with a separate shell, route atlas, sortable fleet table,
  posture, evidence and JSON export. It reads the real bundle totals and the
  real Games Studio 7-hop route. The Figure / Apsis panel tests the project name
  as an orbit: perigee = 1-hop route, apogee = 7-hop route.
- A Y2K / Acid Graphics poster at `console/public/design-lab/v7/`: pure black,
  white linework, electric ultramarine, repeated outline title, liquid chrome
  band and Y2K vector stamps. The 3D mascot is a real WebGL object built from a
  path (7-node orbit) and an atlas (wireframe globe, dust field, polar grid),
  with drag/zoom/reset and an SVG fallback.
- The Fleet dashboard at `console/dashboard.html` now renders
  `console/src/y2k/` as an eight-view control surface: Overview, Survey, Path map,
  Atlas, Drift, Commands, Extensions and Blueprint. Each view has a distinct WebGL
  instrument (orb, dish, ascent, constellation, prism, bloom, stack) with
  drag/zoom/reset and a 2D fallback. Adds a `Cmd/Ctrl+K` command palette, motion
  toggle, animated background, auto-escalation and cut, 114 recorded commands
  with typewriting, an 18 × 16 coverage matrix, contracts, the observed-path
  case, and the full architecture/release plan. The Neon Luxe dashboard
  implementation was retired. `docs/DASHBOARD.md` records the architecture.
- The instruments now render through an `EffectComposer` with
  `UnrealBloomPass`: a shader core and Fresnel atmosphere on the orb, a lathed
  survey bowl, curved constellation arcs, ascents with platforms and a travelling
  pulse, a glass prism with beam and rings, blooming primitive nodes and stacked
  layer outlines. Figures pause offscreen and fall back to SVG without WebGL.
- The dashboard gained an `Auto` / `Paused` badge per figure, clickable 3D nodes
  on Path map, Atlas and Extensions, a scanline and grain texture over the
  animated field, and hover glow on panels.
- Path map and Atlas were rebuilt: the ascent is now a constellation-threaded
  route in depth, with gate rings, hex platforms, context stars, a beacon, shock
  rings and a travelling pulse; the constellation gained a nucleus, base stems,
  node rings, an orbital ring with data pulses and a nebula field. The identity
  graph moved to a uniform-fit layout with curved directed edges, short labels,
  shape-by-kind nodes and an animated trust flow. All 3D pickables now carry
  oversized invisible hit targets.
- Corner geometry is fixed at 2px panels and controls with 0px tags. The screen
  frame and tables stay square; there is no corner toggle.
- Typography moved up across the console: 16.5px body, 15–16.5px data and notes,
  13–15px labels and a 100–174px display. Every figure now has a fullscreen
  control that expands the panel over the console, keeps the header and footer,
  and closes on Escape.
- Added `cases/01-observed-path/alert.json` (`penumbra.alert/v1`), validated
  between the alert and evidence schemas, and delivered the handoff to
  `detection-lab/integrations/apsis/`.
- Added `docs/RELEASE.md`, finished the roadmap state in the Blueprint view and
  README, removed the stale bioluminescent verify script and unused screenshots,
  and prepared the `origin` remote without pushing.
- The internal working title was removed from every surface; the dashboard,
  docs, design lab and metadata now use the product language only.
- A live Signal instrument: auto-advancing phase, gradient light curve with
  area fill and echo, T−/phase readout, and a hold control that stops on scrub.
- A hop rail with a flowing gradient progress bar, a pulsing play head and a
  replay from the first hop; a seekable Prove waveform with a cursor, a line
  readout and an active-line highlight that follows playback.
- Detailed crew figures: an observatory controller in Signal, a field biologist
  in Decide and an EVA diver with a telemetry card in Prove.
- The diver is drawn in full: gradient suit and limbs, twin tanks, harness,
  chest console, hoses, wrist slate, knee pads, fins, helmet bolts, lamp beam
  and rising bubbles.
- Magnetic field lines, guardrail rings and a theoretical/observed route state
  in Map.
- A command palette (`Ctrl/⌘ K`) for acts, accounts and techniques.
- A living-account model with deterministic depth, route and spiral layout,
  covered by Node tests.
- A 3D specimen core and a 2D radial alternative.
- A revocation ledger sourced from `permissionSteps`, a guardrail mapping and a
  Penumbra handoff card.
- A 3D Signal transfer and a 3D field-collapse Prove scene.
- A light curve and scrubber in Signal; a compass, field meter and field toggle
  in Map; sonar rings, a ping, a whale and a species legend in Decide; a
  playable recorded waveform in Prove.
- `schema/alert.schema.json`, `schema/evidence.schema.json`,
  `docs/INTEGRATIONS.md` and the observed-path case study under
  `cases/01-observed-path/`.

### Removed

- The planet atlas, the earlier bioluminescent and paper surfaces, the unused
  Instrument Serif font files, and the astronaut. Planet textures are no longer
  shipped.

# Changelog

All notable changes are recorded here. The project follows Semantic Versioning.

## [0.2.0] — 2026-11-16

### Added

- Apsis, the orbital security console: a static React site with a live
  permission survey, an escalation atlas, a command log, and a resolution plate.
- A 3D survey with real Solar System Scope textures, atmosphere shells, moons,
  ring systems, orbital trails, a pulsar, a ringed gas giant, and an event
  horizon rendered with Three.js.
- A GitHub Pages workflow that builds and deploys `console/dist` with relative
  assets.
- A design system, research note, assumptions document, deployment guide, and
  security policy.
- Self-hosted Sora, IBM Plex Sans, and IBM Plex Mono.
- Responsive layouts at 1440 and 390, reduced-motion parity, and automated
  contrast/name/target checks.
- Five more synthetic accounts (`retail`, `media`, `research`, `logistics`,
  `platform`), bringing the fleet to 16 accounts, 194 identities, 163 edges, and
  144 routes. The recorded command log now carries 114 invocations.

### Changed

- Renamed the project from Overpass/Meridian to **Apsis**: the Python package is
  `apsis`, the CLI is `python -m apsis`, and the console folder is `console`.
- The console is a deep-space cybernetic instrument: one fixed blue-violet field,
  glass panels, a floating rail, a restrained rose edge, and gold only as a live
  signal.
- The atlas now runs full width with the selected technique in an inspector
  underneath, because 16 accounts no longer fit beside the matrix.
- The final zero is the event horizon; the black-hole plate is square with a
  rounded edge.
- The site copy distinguishes the synthetic fixture fleet from a live account.

### Fixed

- Removed the custom cursor follower, the pointer-driven hero, and the noisy
  grid/comet/satellite decorations.
- Removed the full-page grain and blur that caused scroll jank; capped device
  pixel ratio; removed the survey bloom pass; paused the surveyed renderer when
  offscreen; throttled DOM label updates.
- Fixed the CSP regression caused by an inline motion-preference script.
- Fixed double horizontal padding in the hero copy.
- Reduced planet textures to 1K; the hero Earth remains 2K.
- Removed the legacy `web/` tree and internal session notes from the public tree.
- `python -m apsis` now reconfigures stdout/stderr to UTF-8, so reports with
  severity glyphs no longer crash on legacy Windows code pages.

### Security

- Moved the motion bootstrap to an external file so `script-src 'self'` is
  enforced without an inline-script exception.
- Documented the read-only/offline model, synthetic data policy, CSP limits on
  GitHub Pages, and the private-advisory reporting path.

## [0.1.0] — 2026-11-11

- Initial engine: scenario ingest, 18 escalation primitives, route enumeration,
  minimum cut, diff, and text/JSON/Markdown/SARIF/Mermaid output.
