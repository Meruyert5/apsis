# Fleet dashboard

The dashboard at `/` is the single Vite entry. It reads the static Apsis export
and renders eight views, each with a glossy planet scene and a wireframe
instrument. A `Planets` / `Wire` switch on every figure changes the language
without changing the data, the camera or the interactions.

## View map

| # | View | Question | Planet scene | Wireframe |
| --- | --- | --- | --- | --- |
| 01 | Overview | What is the fleet posture and where do I go? | Graphite planet, seven glossy bodies, two orbits | Wire globe + 7-node orbit |
| 02 | Survey | Which accounts carry the exposure? | Ringed planet, 16 contacts, radar sweep | Wire bowl + sweep |
| 03 | Path map | How does one escalation walk, hop by hop? | Solar system: ivory star, eight planets, route thread; the cut collapses the star into a black hole | Ascent ladder |
| 04 | Atlas | Which identity, role and trust edges connect? | Ivory star, 16 glossy account bodies, trust arcs | 16-node constellation |
| 05 | Drift | What changed between two snapshots? | Two planets joined by the changed edge stream | Before/after wire panels |
| 06 | Commands | What did the engine actually run? | Dark core, data ring, beam, ten moons | Monolith + scan plane |
| 07 | Extensions | Which primitives, coverage, contracts and cases exist? | Ringed planet with 18 moons | Six rings + 18 nodes |
| 08 | Blueprint | What is the whole system and is it ready? | Planet with five orbital planes, plus the event-horizon plate | Five stacked layers |

Each figure supports drag, scroll zoom, double-click reset, a **fullscreen**
toggle and a reduced-motion path. If WebGL is unavailable, a `2D` SVG board
takes over automatically. Fullscreen expands the panel over the console, locks
page scroll, keeps the header and footer, and closes on Escape or the collapse
control. Auto rotation and body pulses are consistent across views; the Path map
adds an autoplaying hop sequence and a cut state. A small `Auto` / `Paused` badge
in the figure header reports the current motion state, and the footer names the
animation that is playing.

Every figure renders through an `EffectComposer` with `UnrealBloomPass` and
`OutputPass`. The planet scenes use a key light, a cobalt fill and two point
lights, so the sphere has a terminator and a specular highlight rather than a
flat matte surface. Build details:

| Instrument | Planet scene | Wireframe | Motion |
| --- | --- | --- | --- |
| Orb | Graphite sphere, rim shell, two orbits, seven glossy bodies, comet | Shader core, Fresnel atmosphere, orbit tube, dust | Comet travels; halos breathe |
| Dish | Ringed planet, broad band, 16 contacts, rotating sweep arc | Lathe bowl, rim, feed, 28 contacts | Sweep wakes contacts |
| Ascent | Ivory star, eight planets on eight orbits, cyan route thread, black-hole state | Eight gates, S-curve, beacon, shock rings | Hops advance; the cut crossfades to the horizon |
| Atlas | Ivory star, 16 account bodies, trust arcs | Sixteen nodes, tube arcs, orbital ring | Bodies pulse; focus ring swells |
| Drift | Two planets, changed-edge stream, base grid, scan bar | Two vertical wire plates, seam | Added bodies cyan; scan reads both sides |
| Prism | Dark core, data ring, beam, ten moons | Glass monolith, scan plane, rings | Beam breathes; rings counter-rotate |
| Bloom | Ringed planet, six moon orbits, 18 glossy nodes | Six rings, eighteen nodes | Rings counter-rotate; focus body swells |
| Stack | Planet, five orbital planes, beam | Five wire layers, outlines | Planes turn; beam rises |
| Horizon | Black hole, accretion disk, photon ring, one moon | Wire sphere, three rings | Disk turns; photon ring breathes |

Clickable figures: the Path map ascent jumps to a hop, the Atlas constellation
switches account, and the Bloom node selects a primitive. The Drift split is a
before/after comparison with its own selectors and route-aware diff. Each
pickable node carries an oversized invisible hit sphere, so the target is
comfortable at any stage size.

Typography is set for reading: 17.5px body, 18px lede, 15.5-16px data and notes,
13.5-15.5px labels, 12.5-13.5px micro-labels, a 48-80px view title and a
92-154px wordmark. SVG graph labels are 17px in the 940-unit viewBox, which
renders at 14-15px in the 1440 panel.

## Soft geometry

The dashboard uses a fixed sharp scale: 2px on panels, cards, figure stages,
controls and the palette; 0px on tags, badges and matrix cells. There is no
corner variant and no asymmetric sweep. The screen frame, tables and barcode
stay square; the only soft element is the floating glass topbar.

## Engine features

- **CloudTrail overlay** - `apsis overlay`, `apsis scan --cloudtrail` and
  `apsis export --cloudtrail` map events to survey edges, set `observed` and
  first/last seen, and mark which routes are fully observed.
- **Live IAM import** - `apsis import --from-aws` runs the AWS CLI
  `get-account-authorization-details` and converts the dump into a scenario;
  `--input` does the same from a saved file. No AWS SDK is added to the engine.
- **Condition evaluation** - string, ARN, Bool, IP, date and numeric operators
  against a known request context. A condition that cannot be decided stays
  conditional instead of being silently trusted.
- **Resource policies** - resource-based Allow/Deny with Principal matching,
  combined with identity policies and explicit deny precedence.
- **Drift** - `apsis diff` and the dashboard's Drift view key edges by source,
  target and technique, then re-derive added and lost routes.
- **CSV ledger** - `apsis ledger -s <fixture>` writes one row per route edge;
  Survey can download the same ledger from the browser.
- **CI gate** - the site workflow audits all eight views at 1440 and 390, runs
  Lighthouse with accessibility, best-practice and SEO assertions, and enforces
  the JS/CSS/font budget. The performance score is a warning, not an error,
  because the instruments are WebGL.

On desktop the topbar floats as a glass pill; the rail carries the 34px orbital
mark beside the wordmark. The hero sits over a bone-on-warm-black aura with a
grain and scanline texture. A cropped Canvas2D body - comet, ringed planet,
star, galaxy, pulsar, nebula, binary or black hole - sits at the page edge and
takes the view accent. The page field is `#08090b`; one accent is active per
view (cyan, mint, amber, violet or rose).

### Atlas workbench

The identity graph is no longer a narrow centre column. The page uses a
full-width account strip (four cards per row, then two), a graph panel at 940x600
with 15px labels, distinct node shapes, straight edges within a kind and curved
edges across kinds, hover/selection labels and a 340px inspector. Selecting a node
dims the unrelated edges, lights its own and runs a travelling dash along them.
On small screens the graph keeps a 720px minimum and scrolls inside its panel, so
labels never shrink to unreadable.

### 2D fallback

Every figure has an annotated SVG fallback if WebGL is unavailable. The
fallback is a full-frame board with a title, a note, a grid and the same
geometry as the 3D instrument. It is wrapped so the `viewBox` fits the stage
with `xMidYMid meet`; in fullscreen it shows the whole board instead of cropping
the lower half. The Path map fallback draws the gate route and the context
stars; Atlas draws the disc, arcs and orbital ring; Bloom draws the six rings
and eighteen nodes; Horizon draws the disk and the photon ring.

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
- `Figure3D.tsx` - one renderer over nine variants, each with a planet scene and
  a wireframe builder. State (active hop, cut, focus body) is passed through a
  ref so scenes update without remounting.
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
- Global: command palette, motion pause, fullscreen on every figure, soft panel
  geometry, hash deep links, toast feedback, hover glow on panels and cards.

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

The Vite build emits `dist/index.html`; the Pages workflow publishes `dist/`.

Last verification: build pass; 5/5 logic tests; 89/89 Python tests (contracts,
conditions, import, overlay and ledger included); contracts valid against both
schemas; no horizontal overflow on any of the eight views at 390 or 1440 (a
dedicated text-overflow scan); the audit gate reports no contrast, heading,
unnamed-control, small-target or overflow failures across all views; the ship
budget passes (2.6MB JS, 96KB CSS, 93KB fonts); Lighthouse accessibility, best
practices and SEO pass; fullscreen (planet, wireframe and 2D), Escape-close,
portrait fit and body picking verified in the browser. The audit's 14px floor
still flags intentional HUD micro-labels.

## Boundaries

- Static fixtures by default. The engine has no AWS SDK; the optional
  `apsis import --from-aws` shells out to the AWS CLI for a live or saved IAM
  dump.
- Penumbra is a contract, not a live connector.
