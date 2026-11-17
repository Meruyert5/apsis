## Unreleased

### Changed

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
