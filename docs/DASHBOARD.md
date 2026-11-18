# Fleet dashboard

The dashboard at `/dashboard.html` is a separate Vite entry from the legacy
console at `/`. It reads the same static Apsis export and adds a multi-view
control surface with one distinct WebGL instrument per view.

## View map

| # | View | Question | 3D instrument | Shape |
| --- | --- | --- | --- | --- |
| 01 | Overview | What is the fleet posture and where do I go? | Orb | Sphere + 7-node orbit |
| 02 | Survey | Which accounts carry the exposure? | Dish | Wireframe bowl + radar sweep |
| 03 | Path map | How does one escalation walk, hop by hop? | Ascent | Rising gate ladder |
| 04 | Atlas | Which identity, role and trust edges connect? | Constellation | 16-node disc + orbital ring |
| 05 | Commands | What did the engine actually run? | Prism | Monolith + scan plane |
| 06 | Extensions | Which primitives, coverage, contracts and cases exist? | Bloom | Six rings + 18 nodes |
| 07 | Blueprint | What is the whole system and is it ready? | Stack | Five stacked layers |

Each figure supports drag, scroll zoom, double-click reset, a `2D` SVG fallback
and a reduced-motion path. Auto rotation and node pulses are consistent across
views; the Path map adds an autoplaying hop sequence and a cut state. A small
`Auto` / `Paused` badge in the figure header reports the current motion state,
and the footer names the animation that is playing.

Every figure renders through an `EffectComposer` with `UnrealBloomPass` and
`OutputPass`. The canvas is screen-blended over the glass stage, so only the
lit linework and halos add light. Build details:

| Instrument | Surface | Motion |
| --- | --- | --- |
| Orb | Shader core, Fresnel atmosphere, orbit tube, dust, comet | Comet travels the orbit; halos breathe |
| Dish | Lathe bowl, rim, feed, 28 contacts | Sweep rotates and wakes contacts |
| Ascent | Eight gates, hex platforms, cylinder hops, target beacon, shock rings | Hops advance; pulse travels the live segment; rings expand from the active hop |
| Constellation | Sixteen nodes, curved tube arcs, node rings, orbital ring, nucleus, base stems | Nodes pulse; rings spin; data motes orbit; focus beam rises |
| Prism | Glass monolith, beam, scan plane, stacked rings | Scan climbs; rings counter-rotate |
| Bloom | Six rings, eighteen pickable nodes, wire nucleus | Rings counter-rotate; focus node swells |
| Stack | Five wire layers, outlines, beam, connectors | Layers breathe; beam rises |

Clickable figures: the Path map ascent jumps to a hop, the Atlas constellation
switches account, and the Bloom node selects a primitive. Each pickable node
carries an oversized invisible hit sphere, so the target is comfortable at any
stage size.

## Soft geometry

The dashboard uses a small fixed radius rather than a corner variant: 7px on
panels, cards, figure stages and the palette shell; 5px on buttons, fields,
chips, rails and nav items; 3px on tags, badges and matrix cells. The screen
frame, tables and barcode stay square so the console keeps its technical edge.
There is no toggle and no `?corners` parameter.

## Data

- `console/src/lib/data.ts` — bundles, totals, techniques, coverage, routes.
- `console/src/data/commands.json` — 114 recorded CLI runs, copied verbatim.
- `console/src/y2k/model.ts` — fleet rows, route groups, technique stats,
  coverage cells, case study, contracts, pipeline and roadmap.
- `cases/01-observed-path` — the observed-path narrative and guardrails.
- `schema/alert.schema.json`, `schema/evidence.schema.json` — the Penumbra
  evidence contract.

All numbers are real fixture totals: 16 accounts, 194 identities, 144 routes,
37 cut edges, 07 deepest hops, 0 writes.

## Shell

- `App.tsx` — hash routing (`#/survey`), rail, sticky topbar, motion toggle,
  toasts and the command palette.
- `BackgroundFX.tsx` — a 2D particle field with pointer parallax; CSS grid and
  aurora sit behind it.
- `CommandPalette.tsx` — `Cmd/Ctrl+K`; searches views, accounts, commands and
  techniques; arrow keys and Enter navigate.
- `ui.tsx` — icons, count-up, panels, figure frame, chips, tabs, donut, badge.
- `Figure3D.tsx` — one renderer and seven scene builders. State (active hop,
  cut, focus node) is passed through a ref so scenes update without remounting.
- `views/*` — one file per view.

## Interaction inventory

- Overview: KPI count-up, fleet pulse bars, module navigation, evidence feed.
- Survey: severity filters, account search, exposure ranking, 16-row ledger,
  row-to-path navigation, scan replay overlay.
- Path map: account/source/route selection, autoplay with loop, play/pause,
  step, reset, speed, cut/restore, clickable hop rail, clickable 3D hop nodes,
  real hop detail, clickable route ledger.
- Atlas: 16-account constellation with raycast selection, curved directed
  identity edges with animated flow, shape-by-kind nodes, always-on short
  labels, kind filters, search, node inspector, route count.
- Commands: verb/scenario/format filters, 114-run list, typewriter output,
  replay, copy, verb mix.
- Extensions: technique filters and expansion, clickable 3D primitive nodes,
  coverage matrix (18 × 16 = 288 cells), gaps toggle, contracts, alert sample,
  case study.
- Blueprint: pipeline stage selection, release checklist, architecture flow,
  module map, roadmap, open items.
- Global: command palette, motion pause, soft panel geometry, hash deep links,
  toast feedback, hover glow on panels and cards.

## Accessibility and motion

- Skip link, semantic headings, labelled controls, `aria-current`, `aria-pressed`,
  `aria-expanded`, table captions, focus-visible rings.
- `prefers-reduced-motion` disables auto motion; the topbar toggle pauses CSS
  animation and passes `motion=false` to the 3D engine.
- The local audit reports no contrast, heading, unnamed-control, small-target or
  horizontal-overflow failures at 1440 and 390. HUD micro-labels are intentionally
  below 14px; body copy, lede text and primary data stay at 14px or the display
  sizes.
- Figures pause when offscreen; DPR is capped; only the current view's figure is
  mounted.

## Build and verification

```bash
npm --prefix console run build
npm --prefix console run test:logic
python -m unittest discover -s tests -v
```

The Vite build emits `dist/index.html` (legacy console) and
`dist/dashboard.html` (this dashboard). The Pages workflow publishes `dist/`.

Last verification: build pass; 9/9 logic tests; 67/67 Python tests; no
horizontal overflow on any of the seven views at 390, 768 or 1440; local audit
reports no contrast, heading, unnamed-control, small-target or overflow
failures. The audit's 14px floor still flags intentional HUD micro-labels.

## Boundaries

- Static fixtures only. No AWS client, no backend and no live import.
- Penumbra is a contract, not a live connector.
- The legacy four-deck console remains available at `/`; this dashboard is the
  new build.
