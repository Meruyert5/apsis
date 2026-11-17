## Unreleased

### Changed

- The console is now a bioluminescent deep-sea instrument: a 3D living-account
  Map, a 3D fleet specimen with a 2D fallback, a merged proof act, and a
  mission rail. The solar-system survey and planet atlas are retired.
- Sora, IBM Plex Sans, and IBM Plex Mono are the only type families; the
  palette is abyss teal, cyan, mint, violet, coral and amber.
- The Map and Decide sections are Three.js scenes that pause when offscreen and
  fall back to static/2D views for reduced motion.

### Added

- A command palette (`Ctrl/⌘ K`) for acts, accounts and techniques.
- A living-account model with deterministic depth, route and spiral layout,
  covered by Node tests.
- A 3D specimen core and a 2D radial alternative.
- A revocation ledger sourced from `permissionSteps`.

### Removed

- The solar-system constellation, the planet hero, the planet atlas and the
  astronaut. The planet textures are no longer shipped.

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
