# Apsis console — Command Deck design

**Status:** proposed · 2026-11-17
**Scope:** the whole `console/` UI. The Python engine, fixtures, exported data,
workflows and licence split stay as they are.
**Chosen direction:** Command deck with a radial core, a persistent mission
rail, two short sticky scenes, and the solar-system survey kept and rebuilt.

---

## 1. Intent

A security engineer opens Apsis with one question: *which identities can reach
administrator, and what is the fewest set of grants that closes them?* The
current page answers that, but it does it across five unrelated plates that
each restart the story. The atlas is a re-skinned table, the closed state sits
on top of the map as a stamp, and the event horizon is boxed in a square.

This rework makes the page one instrument with four acts:

```
SIGNAL → MAP → DECIDE → PROVE
```

Every act has one job, one primary action, and one hand-off to the next. The
space language stays; the cyber language becomes structural, not decorative.

### Why now

The engine and dataset are stable: 16 accounts, 194 identities, 163 edges, 144
routes, 114 recorded commands, 18 primitives. The console is the part that no
longer matches the quality of the data. A re-layout cannot fix that; the
section model, the atlas encoding, the closed state and the zero state all
need replacing together.

### Success looks like

- A first-time visitor can state what Apsis does after the first screen.
- A reviewer can go from fleet map to one principal's route in two clicks.
- The atlas reads as an instrument, not a spreadsheet with planet emoji.
- Severing feels like a result, not an overlay.
- The closing zero feels like the end of the instrument, not a card.
- Nothing on the page is decorative without a data job.

---

## 2. Goals, non-goals, anti-goals

### Goals

1. Replace the five-plate scroll with four acts and a persistent mission rail.
2. Rebuild the survey as a solar system workbench with a route readout.
3. Replace the planet atlas with a radial core and an exact ledger.
4. Merge the command log and resolution into one proof act.
5. Add a full-bleed event horizon and a wireframe astronaut.
6. Add a real background: a canvas fleet field, HUD furniture and figures.
7. Add functional depth: principal search, edge inspection, copy route, cut
   ledger, command palette, focus-account context.
8. Keep the engine, fixtures, data files and licence split untouched.
9. Keep the accessibility and performance floors already asserted by
   `verify`/`audit`.

### Non-goals

- No engine changes, new primitives, new fixtures or live AWS import.
- No backend, analytics, cookies, auth or network calls.
- No new runtime dependency. React, Three.js, Lucide, CSS, SVG and canvas only.
- No light theme or theme switch.
- No side-by-side account comparison (possible later; the CI before/after pair
  stays a labelled pair, not a diff view).

### Anti-goals

- A dashboard where every panel is the same glass card.
- A page that hides the data behind a metaphor.
- Scroll-jacking or long pinned sequences that trap the reader.
- Decorative motion that continues when the page is offscreen or motion is
  reduced.
- A radial chart that cannot be read without hovering every node.

---

## 3. Constraints

- **Data is fixed.** The UI derives everything from `src/data/*.json`. No
  invented scores. Counts are identities, edges, routes, cuts, grants.
- **One page, static build.** GitHub Pages, relative assets, CSP with
  `script-src 'self'`.
- **Text floor 14px, contrast 4.5:1, targets 24px**, no horizontal overflow at
  390, reduced-motion parity. These are audit gates.
- **Solar system stays.** The user asked to keep the survey graph as a solar
  system and design it in detail.
- **Palette discipline.** Deep navy hull, electric blue and violet as the two
  accents, rose for severance, gold only for a live signal. No new accent hue.
- **Two WebGL scenes maximum.** The survey constellation and the event
  horizon. The hero uses 2D canvas/SVG.
- **Windows dev environment.** Paths, CRLF, and the existing preview/verify
  scripts stay usable.

### 3.1 Vocabulary

The engine emits three different things that the current page calls “grants”.
The rework uses them precisely, and every count is derived at runtime:

| Term | Meaning | Source |
| --- | --- | --- |
| **Route** | A walk from a principal to an administrator | `stats.routes`, `paths` |
| **Edge** | One escalation step, source → target with a technique | `stats.edges` (163 fleet) |
| **Edge cut** | The minimum set of edges whose removal closes the account | `sever.edgeCut.edges` (37 fleet) |
| **Revocation** | One IAM action a human can revoke, with edges removed and routes killed | `sever.permissionSteps` (32 fleet) |

- The atlas counts **edges observed** (163), not “grants”.
- The Signal readout shows **32 revocations**, not 37 cuts.
- The Map cut says **2 edges cut · 2 actions revoked** for Games studio.
- The Prove zero says **37 edges cut · 32 actions revoked**.
- `sever.edgeCut.byAction` is not used as a grant count: one edge can list more
  than one action, so its entries sum above the edge count. The actionable
  ledger comes from `permissionSteps`, which is the engine's greedy,
  human-readable answer.
- Illustrative numbers in this document are examples. The build derives every
  count from the bundle; no literal number in the copy is hardcoded.

---

## 4. Approaches considered

### A. Command deck — chosen

Four acts, a persistent mission rail, the radial core, a merged proof act.
Clear path, enough spectacle, keeps the engine's structure and the existing
solar-system scene.

### B. Persistent instrument panel

A left rail with accounts, techniques and commands, and four tabs instead of a
scroll. Clearest for repeated use, but it hides the narrative, makes the first
visit feel like an internal tool, and needs a drawer on mobile.

### C. Cinematic pinned scroll

Long pinned scenes: graph assembles, core draws, account closes. Strongest
mood, but slowest to use and it works against the "clear path" brief.

### Why A

The user asked for a clear path, a distinct radial atlas, more cyber elements,
and the solar system kept. A delivers all four without turning the page into
an app shell or a film. B and C contribute where they help: the mission rail
from B, and two short sticky scenes from C (the atlas core and the closure
panel), never scroll-jacking.

---

## 5. The shell

### 5.1 Top bar

Height 56px, sticky, solid hull (not glass), 1px bottom hairline.

```
┌──────────────────────────────────────────────────────────────────────┐
│ APSIS ◇  01 Signal  02 Map  03 Decide  04 Prove   [focus: Games ▾]  ⌘K  READ-ONLY │
└──────────────────────────────────────────────────────────────────────┘
```

- Wordmark left; acts centre-left as segment tabs with a moving underline.
- Focus-account chip opens the command palette filtered to accounts.
- `⌘K`/`Ctrl K` button opens the palette.
- Read-only badge right, with a 5px live dot (gold only here).
- On <900, acts become a horizontal scroll strip; the focus chip shortens to
  the account abbreviation; the read-only badge becomes an icon with a
  tooltip.
- The top bar is the only navigation that is always present.

### 5.2 Mission rail

A vertical spine on ≥1280px, 64px wide, expanding to 224px with a button or
`[` key. It is the spaceship element: orientation and telemetry, not a second
menu.

Collapsed:

```
┌────┐
│ ◇  │  Apsis mark
│ 01 │  Signal        ●
│ 02 │  Map           ○
│ 03 │  Decide        ○
│ 04 │  Prove         ○
│    │
│ 68%│  scroll ladder
│    │
│ 16 │  accounts
│ 144│  routes
│    │
│ ⌄  │  expand
└────┘
```

Expanded adds: act names, a one-line purpose per act, focus account, export
timestamp, engine version, a **Motion on/off** switch (the existing manual
control, backed by `localStorage` and `data-motion`), and a “mission patch”
(Apsis mark + `AP-01`).

- Scroll progress is a vertical hairline with a lit segment per act.
- The current act is lit; completed acts are dim blue; future acts are grey.
- Clicking an act scrolls to it.
- On <1280 the rail is hidden; the top bar carries the same state.
- The rail is `aria-label="Mission rail"`; collapsed buttons still have names.

### 5.3 Page frame

- Max content width 1440px; gutter `clamp(20px, 4vw, 64px)`.
- 12-column grid; every act aligns to it.
- Section separators are 1px hairlines with a corner tick, never full cards.
- Each act header:

```
[01]  SIGNAL                                      16 accounts · 194 identities
One fleet. One question.
Which identities can reach administrator?
──────────────────────────────────────────────────────────────────────────────
```

Act headers are left-aligned. Only the Prove zero is centred, and only inside
its own composition.

### 5.4 Background

Two layers behind everything, both `aria-hidden`:

1. **Fleet field** — a fixed `<canvas>` drawing a deterministic sample of the
   real fleet graph (about 120 nodes and 180 edges), in blue at 10–16% and
   violet at 8–12%, with slow drift and 3–5 travelling pulses. It parallaxes
   slightly with scroll. It is the same graph the page analyses, abstracted.
2. **Sky and furniture** — deep navy base; a blue glow top-right; a violet
   glow lower-left; a rose sliver near the Prove act; a fine 64px grid at 3%
   opacity; corner ticks; occasional coordinate labels (`47.2 / 08.9`) and
   section numbers in mono. Less star wallpaper; more instrument field.

Rules: the canvas pauses when `document.hidden`, when offscreen, and when
motion is off (draws one static frame). DPR capped at 1.5.

### 5.5 Command palette

`⌘K` / `Ctrl K` or the top-bar button. A glass dialog, top centre, 560px wide.

- Searches accounts (16), techniques (18) and acts (4).
- Grouped results with type labels; arrow keys move, Enter selects, Escape
  closes, focus returns to the trigger.
- Account → set focus account, close, scroll to Map.
- Technique → select it in Decide, close, scroll to Decide.
- Act → scroll to act.
- `Motion: on/off` → toggle the manual motion preference without leaving the
  palette. This is the mobile-safe home for the control.
- Empty state: "No account, technique or act matches."
- `role="dialog" aria-modal="true"`, labelled, focus trapped.
- This is also the mobile way to switch accounts and techniques.

---

## 6. Act 01 — Signal

**Job:** state the question, show the fleet, hand off to the map.
**Height:** about one and a half viewports on desktop.

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ [01] SIGNAL                                      16 accounts · 194 IDs │
│                                                                      │
│ Every route                                    ┌───────────────────┐ │
│ ends at the sun.                               │  live route field │ │
│                                                │  ○──○──○──○──◉    │ │
│ Apsis reads an AWS account as a solar system    │  principal → admin│ │
│ of permissions ...                             └───────────────────┘ │
│                                                                      │
│ [ Open the map → ]   [ Read the evidence ]                           │
│                                                                      │
│ 16 accounts   194 identities   144 routes   32 revocations           │
│ ▁▂▃▅▆▇  sparkline  …                                                │
│                                                                      │
│ INGEST 01 ─ COMPOSE 18 ─ FIND 144 ─ SEVER 32 ─ PROVE 05              │
└──────────────────────────────────────────────────────────────────────┘
```

- Left 55%: eyebrow, h1, one paragraph, two actions, fleet readout.
- Right 45%: **Hero route field** — a 2D canvas/SVG of the focus account's
  signature route. Seven nodes on a shallow arc from lower-left to upper-right,
  edges as thin filaments, small pulses travelling toward the sun. Labels:
  principal (bottom), administrator (top), hop count, technique names on
  hover. No Earth, no second WebGL scene.
- The field is not a screenshot: it uses the signature route from the bundle
  and updates when the focus account changes.

### 6.2 Process bus

One horizontal strip, not five cards:

```
INGEST 01 ─ COMPOSE 18 ─ FIND ROUTES 144 ─ SEVER 32 ─ PROVE 05
194 ids      18 prims      144 routes        actions      5 outputs
                                             37 edges
```

- Five nodes on a hairline; each node is a button that scrolls to the act
  where that stage lives (Ingest → Map, Compose → Decide, Find → Map,
  Sever → Prove, Prove → Prove).
- On hover/focus, a one-line explanation appears under the bus.
- On scroll into view, the nodes light in sequence once (no loop).
- On <900, it becomes a 2-column grid of five compact rows.

### 6.3 Copy

- H1: **Every route ends at the sun.**
- Lede: “Apsis reads an AWS account as a solar system of permissions: identities
  on hop orbits, the administrator at the centre. It finds every route a stolen
  credential could walk, then computes the fewest grants that close them all.”
- Primary: **Open the map**. Secondary: **Read the evidence**.
- Fleet readout labels: accounts, identities, routes, revocations. Values come
  from `totals` and the summed `permissionSteps`; the sparkline is the
  per-account route distribution (a real figure, not decoration).

### 6.4 Hand-off

At the bottom of the act, a hairline strip: “Next: read one account.” with the
focus account's name and a down arrow. Clicking scrolls to Map.

---

## 7. Act 02 — Map (the solar system, kept and rebuilt)

**Job:** inspect one account, one principal, one route.
**Height:** one full viewport plus the workbench; no pinning.

### 7.1 The workbench

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [02] MAP                                             16 accounts · 144 routes │
│ Read the account as a solar system. Pick a principal; walk the route.    │
├───────────────┬──────────────────────────────────────┬───────────────────┤
│ PRINCIPALS    │                                      │  READOUT          │
│ [search…]     │        ☀  administrator              │  [Route][Node][Cut]│
│ All Users     │     ○───────○───────○               │                   │
│ Roles With    │   ○    ○    ○     ○    ○            │  Tools intern     │
│ route         │     ○───────○───────○               │  User / 7 hops    │
│               │                                      │                   │
│ Tools intern  │      solar system canvas            │  01 Cross-role…   │
│ 7 hops      ● │      hop orbits 1..7                │  02 PassRole…     │
│ Build role    │      drag · zoom · select           │  …                │
│ 5 hops        │                                      │  [Copy route]     │
│ …             │  [−][+][reset][fit][fullscreen]     │                   │
├───────────────┴──────────────────────────────────────┴───────────────────┤
│ 01 02 03 04 05 06 07   ▶   Tools intern     [copy route]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

Desktop grid: `300px minmax(0, 1fr) 360px`, gap 20px, all inside a hull plate
with 1px edges. The canvas is the only full-bleed element inside the plate.

### 7.2 Top command bar

Inside the act, above the grid:

- Account selector (the same 16; title + account id + region).
- Severity dot and `scenario.summary` on hover.
- Stats: `sourcesWithPath / sources reach admin`, routes, deepest hop, cut
  grants.
- Primary **Sever minimum cut** button; when active it becomes **Restore
  routes**.
- Reset/fullscreen icon buttons.
- A live region announces the derived state: “{sourcesWithPath} principals can
  reach an administrator in {title}.” or “Account closed. {edgeCut.edges.length}
  edges cut, {permissionSteps.length} actions revoked. No route remains.”

No overlay stamp on the canvas.

### 7.3 Solar system canvas

Keep `Constellation.tsx` and its Three.js scene. Changes:

- **Composition.** The h2 and lede move out of the canvas into the act header.
  The canvas is unobstructed except for a small orientation legend and view
  controls.
- **Sun.** The administrative centre at the middle of the scene. Most fixtures
  have one administrator; six have two or three. Keep the existing centre
  cluster: one body per administrator, under one label, `ADMINISTRATOR` when
  there is one and `ADMINISTRATORS` when there are several. A lit route ends on
  the specific administrator body it reaches, not on an aggregate point.
- **Orbits.** One ring per hop count, labelled `HOP 01`, `HOP 02` … along a
  fixed radial axis. Orbit rings are hairlines; the selected route's orbit
  segment brightens.
- **Bodies.** Identity planets keep kind colour and degree size; resources
  (lambda, ec2, ecs, glue, sagemaker, cloudformation) stay as smaller bodies or
  moons where the scene already places them. Moons/rings are decoration for
  degree, not new data.
- **Labels.** DOM labels for the selected node, the administrator, and hovered
  nodes only. On mobile, only the selected label.
- **Route.** The selected route is a continuous bright filament from principal
  to sun, with travelling pulses. Past hops stay lit; future hops dim.
- **Cut.** When severed, cut edges render as dashed rose and the rest drops to
  18% brightness. A small top-bar state reads `0 routes · 2 edges cut · 2
  actions revoked`; the readout switches to the Cut tab. No stamp.
- **Hover/focus.** A glass tooltip shows label, kind, degree, hops to admin.
  Pointer cursor over nodes. Keyboard focus is handled by the principal rail,
  not by tabbing through 3D labels.
- **Camera.** Slight tilt; drag to orbit, wheel/pinch to zoom, reset, fit route,
  fullscreen. A new handle method `frame(ids)` eases to the selected route.
- **Accessibility.** Canvas is `aria-hidden`; the route is described in a
  visually hidden paragraph and duplicated in the readout.

### 7.4 Principal rail

Left column, 300px.

- Search input (`Search principals`), live filter by label.
- Filter chips: `All`, `Users`, `Roles`, `With route`. Counts on each.
- Sort: `Hops` (default) and `Name`.
- Rows: kind icon, label, hop count, a 3px route depth bar, severity dot.
  Selected row is lit; hovering a row highlights the body in the canvas.
- Keyboard: `↑`/`↓` move, `Enter` selects; the list is a `listbox` with
  `aria-activedescendant`.
- Empty state: “No principal matches. Clear the search.”
- Foot: `X of Y principals reach administrator`.

### 7.5 Readout (right column)

Three tabs, each a real view; switching is explicit, not automatic (a click
on a node switches to Node; selecting a route switches to Route; severing
switches to Cut).

**Route**
- Principal label, kind, hops, reach.
- Vertical step list: index, technique name, action, evidence, MITRE; the
  active step (from the scrubber) is highlighted.
- A small “confidence” line for conditional edges.
- Primary **Copy route** (plain text: `Tools intern → … → Administrator` plus
  actions). Secondary **Play walk**.

**Node**
- Label, kind, connections, ARN, note, groups/trust.
- Outgoing edges list with technique + severity; clicking an edge selects the
  hop that contains it (if on the current route) or shows its evidence.
- If the node is an administrator: “Every lit route ends here.”

**Cut**
- Before → after: `{routes} → 0`.
- **edges cut** = `edgeCut.edges.length`; **actions revoked** =
  `permissionSteps.length`.
- Revocation list from `permissionSteps`: action, edges removed, routes killed.
  Each row names the actions; one row can cover several edges.
- **Restore routes** button.
- Note: “Printed, not applied. Review the operational cost before revoking.”

### 7.6 Hop scrubber

A full-width strip under the grid:

- `01 … 07` hop buttons; past hops lit, current hop bright, future dim.
- Play/pause; active step name; `07 / 07` counter.
- **Copy route** repeats the readout action for reach.
- When no route: “No route from this principal. Pick another.”

### 7.7 Interaction summary

- Change account → reset selection to the signature source, clear cut, reset
  camera, update readout.
- Select principal → route lit, readout Route, scrubber reset.
- Step a hop → camera does not move; the step list and canvas pulses update.
- Sever → cut edges, dim graph, readout Cut, top-bar state, no overlay.
- Restore → reverse.
- Fullscreen → the canvas plate expands; the readout becomes an overlay drawer.
- Focus account from the palette or Decide → set here and scroll.
- **Clean account** (`ci-cd`, 0 routes, `signature: null`): the Signal field
  shows a calm “No route to an administrator” state; Map selects the first
  principal with no route, or none; the readout shows a Clean account card
  (“0 routes · nothing to sever”); Sever is disabled with “No routes to sever”;
  the Cut tab reads “No cut required”; the hop scrubber reads “No route.” A
  clean account is a valid result, not an error.

### 7.8 Copy

- H2: **The account, in orbit.**
- Lede: “The administrator is the sun. Each identity is a body on the orbit its
  hops allow. Pick a principal, walk its route, then sever the minimum cut and
  watch the system go dark.”
- Footer meta: `Fig. 02 / solar system / hop orbits / source: apsis export`.

---

## 8. Act 03 — Decide (radial core)

**Job:** show which primitives carry the fleet, and where they concentrate.
**Height:** about two and a half viewports on desktop, with a sticky core.
**No planets or stars here.**

### 8.1 The instrument

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [03] DECIDE                                     18 techniques · 163 grants │
│ Every way through, in one core.                                          │
├──────────────────────────────────────────────┬───────────────────────────┤
│                  IDENTITY                    │  [search technique…]      │
│               ╱   ╱   ╱   ╱                  │  All Identity Compute Trust│
│           ╱   ○   ○   ○   ○   ╲              │                           │
│        COMPUTE ○   ●   ○   ○   ○  TRUST      │  Mint credentials   12 ●● │
│           ╲   ○   ○   ○   ○   ╱              │  Cross-role assum.  11 ●● │
│               ╲   ╲   ╲   ╲                  │  PassRole/Lambda     7 ●  │
│                                              │  … 18 rows                │
│   ring index →  01 Games  02 Health  …       │                           │
│                                              │  SELECTED                 │
│                                              │  Mint credentials …       │
│                                              │  30 grants / 12 accounts  │
│                                              │  [16 exact account bars]  │
│                                              │  Actions · Fix · MITRE    │
└──────────────────────────────────────────────┴───────────────────────────┘
```

### 8.2 Radial core

- SVG, square, 620–760px, centred in the left column.
- **Rings = accounts, 16.** Inner ring is the most exposed account; outer is
  the least. Order: `sourcesWithPath` desc, then `routes` desc, then title.
- **Spokes = techniques, 18.** Angular order is category order (identity 9,
  compute 7, trust 2), 20° apart, starting at 12 o'clock. Category arcs sit
  just outside the rings, labelled `IDENTITY`, `COMPUTE`, `TRUST` at 14px.
- **Cells = grants.** A small marker at each spoke/ring intersection. Size is
  `3 + sqrt(grants) * 2.2` in SVG units, capped. Zero is a 1.5px tick at 18%
  opacity. Marker shape encodes category: identity circle, compute diamond,
  trust double ring. Colour stays within the palette: identity violet, compute
  blue, trust ice.
- **Ring index.** A normal 16-row list beside (desktop) or below (mobile) the
  core, each row with a small ring swatch, the account short name, and its
  route count. It is not geometrically aligned to the ring radii and uses no
  leader lines; the swatch is the link. Each row is a button and the list is
  the account selector. 14px text, 44px rows, scrollable if the column is
  shorter than 16 rows.
- **Spoke index.** Numbers `01…18` around the rim at 14px, with a short label
  on hover/focus in the tooltip. The ledger carries the full names; the core
  does not try to print 18 long labels.
- **Selection.** Selecting a technique highlights its spoke, dims other
  sectors to 30%, draws a thin wedge from centre to rim, and rings the selected
  cell. Selecting an account highlights its ring. Selecting both rings the
  intersection and shows the exact count.
- **Hover/focus tooltip.** Glass, 220px: technique name, account title, `N
  grants`, `M hops` (the account's deepest route), and a one-line action.
- **Sweep.** A 1px radial sweep rotates once every 14s at 8% opacity. It is
  decoration and stops for reduced motion.
- **No rotation of the core.** The geometry stays fixed so labels stay
  readable. “Cinematic” comes from the sweep, the category highlight, and the
  ledger crossfade, not from spinning the chart.

### 8.3 Sticky scene

- On ≥1000px and motion on, the core column is `position: sticky; top: 88px`.
- The ledger scrolls through three category groups. As a group crosses 45% of
  the viewport, an IntersectionObserver sets the active category; the core
  dims other sectors and the group header lights.
- The section is not taller than needed: roughly 2.5 viewports. No scroll
  hijacking, no `scroll-snap`.
- On <1000px or reduced motion: no sticky, no dimming. The core sits at the top
  of the act and the full ledger follows. Every category is visible at once.

### 8.4 Ledger

Right column, 40%.

- Search field (`Search techniques`).
- Category chips with counts.
- 18 ranked rows, grouped by category. Each row: rank, severity dot, name,
  accounts count, grants, a 2px bar scaled to the max. Selected row lit.
- Keyboard: roving tabindex or simple buttons; arrow keys move, Enter selects.
- Below the rows, the **selected technique card**:
  - name, MITRE, severity, summary;
  - `accounts / 16` dial or bar;
  - **16 exact account bars**, each a button that selects the account ring;
  - `Actions that create the edge` (mono list);
  - `Fix.` sentence;
  - `Open the busiest account in the map →` sets focus and scrolls.
- When an account ring is selected, an **account card** replaces the technique
  card (or appears above it): title, account id, region, identities, routes,
  sources, cuts, top three techniques, `Inspect in map →`.
- Empty states: “No technique matches.”

### 8.5 Accessibility

- The core SVG is `aria-hidden`; the ledger is the accessible view. Every
  technique row and every account bar is a button with the exact count in its
  name. This satisfies the data requirement without asking a screen reader to
  parse 288 SVG nodes.
- The core itself is focusable as one control: arrow keys move the spoke,
  PageUp/PageDown move the ring, Enter selects the technique. A live region
  announces the selection.
- The ring index is a real list of buttons; it is the account selector.

### 8.6 Copy

- H2: **Every way through, in one core.**
- Lede: “16 accounts on the rings, 18 primitives on the spokes. A marker is a
  grant the engine observed; the ledger carries the exact counts, the actions
  and the fix.”
- Meta: `Chart 01 / technique × account / source: engine export`.

---

## 9. Act 04 — Prove

**Job:** run the engine, read the record, close the account.
**Height:** about two viewports. The closure panel is sticky on desktop.

### 9.1 Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [04] PROVE                                        114 invocations · read-only │
│ The output is the evidence.                                              │
├──────────────────────────────────────────────┬───────────────────────────┤
│  [Scan][Sever][Check][Techniques]            │        ✦ event horizon     │
│  [scenario ▾] [Text][JSON][SARIF][Mermaid]   │           (full bleed)     │
│  $ python -m apsis scan --scenario …         │                           │
│  ┌────────────────────────────────────────┐  │        0                  │
│  │ recorded output                        │  │        routes remain      │
│  │ …                                      │  │        verified at the cut│
│  └────────────────────────────────────────┘  │                           │
│  123 lines · text · recorded 2026-11-16       │  144 → 0 · 37 grants      │
│                                              │  [cut ledger by action]   │
│                                              │  [astronaut ▸ tether]     │
├──────────────────────────────────────────────┴───────────────────────────┤
│ Mission notes: What it reads · What a route means · What minimum means   │
│ Footer: Apsis 0.2.0 · MIT code · design reserved · built by Meruyert     │
└──────────────────────────────────────────────────────────────────────────┘
```

- The event horizon is a full-bleed layer behind the right side, bleeding off
  the top/right/bottom of the act. No square, no border, no card.
- Left 58%: the command log. Right 42%: the closure panel, sticky at 88px.
- On <1000px: stacked, horizon as a 340px band behind the zero, terminal below.

### 9.2 Command log

Keep the builder and the recorded record, compressed:

- Verb tabs: Scan / Sever / Check / Techniques. Icon + label, 40px.
- Scenario select (defaults to the focus account) and format tabs.
- Command line with copy. Keep the recorded-output claim: the line count beside
  the command is the recorded run.
- Terminal: hull surface, mono 14px, line tones, max height 460px, scroll, a
  bottom fade to signal more. No fake scanlines; a single REC dot in gold.
- Footer: lines, format, recorded date, record key.
- On mobile: the terminal scrolls horizontally if needed; no overflow of the
  page.

### 9.3 Closure panel

- Giant `0` (display, 180–240px), `routes remain`, `verified at the cut`.
- A countdown on entry: `144 → 0` over 1.2s, with `37 edges cut · 32 actions
  revoked / 16 accounts / 0 remaining`. Static final state for reduced motion.
- **Revocation ledger:** the fleet's `permissionSteps`, grouped by action and
  summed (`edges removed`, `routes killed`), top six actions with a count and
  an expandable “all actions” view. Each row names the techniques that the
  removed edges belong to. The headline is `37 edges cut · 32 actions
  revoked`, not 37 “grants”. Honest line: “Printed, not applied.”
- A small `before → after` route bar: `144 → 0`.
- The astronaut: a 140px line-art SVG, monochrome ice-blue, floating at the
  lower right of the panel, tethered to the panel edge by a 1px line. Label
  `EVA-01 / read-only`. It is decorative, `aria-hidden`, and drifts 6px on a
  12s loop; static for reduced motion. It must not overlap text or the `0`.
- The horizon shader is reused from `BlackHole.tsx` but its container becomes
  the act background; the square dial is deleted.

### 9.4 Mission notes and footer

- Three notes only, in a slim accordion:
  1. **What Apsis reads** — identity and policy metadata; never writes.
  2. **What a route is** — a walk of permissions ending at an administrator.
  3. **What minimum means** — the fewest grants that leave no route; printed,
     not applied.
- Links: `docs/ASSUMPTIONS.md`, `docs/RESEARCH.md`, `SECURITY.md`.
- Footer: wordmark, engine version, generated date, fixtures, licence split,
  GitHub link (when public), “Designed and built by Meruyert Oshayeva.”
- The huge repeated `Apsis` wordmark at the bottom of the current footer is
  removed; it competes with the zero.

### 9.5 Copy

- H2: **The output is the evidence.**
- Lede: “Build a command, copy it, read the record the engine printed. The
  account on the right is closed by 37 edges and 32 actions; nothing here is
  hand-typed.”
- Zero: `0 routes remain` / `verified at the cut`.

---

## 10. Visual system

### 10.1 Surfaces

Two surfaces, used for different jobs:

| Surface | Use | Recipe |
| --- | --- | --- |
| **Hull** | work panels, terminal, readout | `#060a15` at 94%, 1px `rgb(140 170 255 / 18%)`, radius 14, inset top highlight |
| **Glass** | floating bars, tooltips, palette | `rgb(10 18 40 / 58%)`, `blur(18px) saturate(140%)`, 1px `rgb(158 188 255 / 22%)`, radius 12 |
| **Well** | data rows, code | `#04070f`, 1px `rgb(130 160 255 / 10%)`, radius 6 |

Not every panel is glass. Glass is for things that float over the field; the
workbench is a solid hull.

### 10.2 Colour

Keep the palette, rebalance the usage:

- `--hull #05080f`, `--hull-2 #080d19`, `--well #04070f`
- text `#eef3ff`, reading `#b7c5e6`, mute `#8b9bc4`
- blue `#5b8cff`, violet `#8b5cf6`, violet-lit `#c9b8ff`
- rose `#ff7696` for severance and critical only
- gold `#e6b86a` only for live signals and the cut mark
- Category markers: identity violet circle, compute blue diamond, trust ice
  double-ring. Severity is a dot in the ledger, not a fourth palette.

No large areas of gold. No yellow dominance.

### 10.3 Type

- Display: Sora 300–800, tight tracking, large but not shouty.
- Reading: IBM Plex Sans 400–600.
- Telemetry: IBM Plex Mono 400–500, tabular numbers, 0.04em tracking.
- Scale: 12/14/16/18/22/28/36/52/72/96; no text below 14.
- Data values use mono or Sora with `tabular-nums`.
- H1 72/0.92; H2 52/0.96; act eyebrow 14 mono; body 17/1.6.

### 10.4 Shape and controls

- Hull panels 14px; controls 10px; data wells 6px; chips 4px.
- Not everything is a pill. Pills only for status and category filters.
- Primary button: 40px, solid blue→violet, 10px radius, one per act.
- Secondary: 40px, 1px line, transparent.
- Icon buttons: 36px square, 8px radius.
- Tabs: underline segments in the top bar; local tabs are 32px text buttons
  with a 2px bottom rule, not pills.

### 10.5 Motion

- Durations: 120 press, 180 hover, 280 state, 620 scene, 1200 count.
- Easing: `cubic-bezier(.16,1,.3,1)` for entrances; `cubic-bezier(.7,0,.2,1)`
  for cuts.
- Signal: route pulses 3.4s loop; bus lights once on entry.
- Map: orbit motion slow; route pulses; camera eases 620ms.
- Decide: category dim 280ms; ledger crossfade 220ms; sweep 14s.
- Prove: countdown 1.2s once; horizon slow; astronaut 12s float.
- All loops stop offscreen; reduced motion resolves to the final state.

---

## 11. Responsive behaviour

| Width | Shell | Signal | Map | Decide | Prove |
| --- | --- | --- | --- | --- | --- |
| ≥1280 | rail + top bar | 55/45 split | 300 / 1fr / 360 | sticky core + 40% ledger | 58/42, sticky closure |
| 1000–1279 | top bar only | 55/45 | 280 / 1fr / 320 | core + ledger, no sticky | 58/42, no sticky |
| 900–999 | top bar | 55/45 | readout below canvas | stacked core then ledger | stacked |
| 720–899 | top bar | stacked, field 420px | rail collapses to a horizontal chip list; readout below | core 100%, ledger below | stacked, horizon 300px |
| <720 | top bar with scroll acts | stacked, field 320px | canvas 520px; rail as a select/sheet; readout tabs | core 320px, static; ledger | horizon 260px; terminal; notes |

- No horizontal overflow at 390. The map canvas is the only element allowed to
  scroll horizontally inside its own plate, and it does not.
- Sticky scenes are disabled below 1000 and for reduced motion.
- Touch targets: core nodes have 24px invisible hit areas; ledger rows 44px.

---

## 12. Accessibility

- Landmarks: `header`, `nav` (top bar/rail), `main`, four `section`s with
  `aria-labelledby`, `footer`.
- One `h1` (Signal), one `h2` per act, `h3` for cards.
- Skip link: “Skip to the map.”
- Command palette: dialog, focus trap, Escape, restore focus.
- Map: principal listbox with keyboard; readout tabs with `aria-selected`;
  hop buttons; live region for selection/cut; canvas `aria-hidden` plus a
  visually hidden description.
- Decide: ledger buttons carry exact counts; core is one keyboard control;
  ring index is a list of buttons; live region announces selections.
- Prove: terminal region labelled; countdown `aria-live="polite"` with the
  final value only; astronaut decorative.
- Reduced motion: no pins, no loops, no count-up, no sweep; all final states
  visible.
- Contrast, 14px floor, 24px targets, focus visible, no overflow: audited at
  1440 and 390.

---

## 13. Performance

- `FleetField` canvas: 120 nodes, 180 edges, one rAF, DPR 1.5, paused when
  hidden/offscreen/reduced motion.
- Remove `PlanetHero` so the hero has no WebGL; the survey and horizon keep the
  only two contexts.
- `Constellation` keeps its offscreen pause and 10fps label updates.
- Radial core: memoized SVG; no per-frame React state. CSS transitions only.
- Sticky scenes: IntersectionObserver, no scroll listener math beyond the
  progress rail (throttled with rAF).
- CSS: replace the 12-layer cascade (`field`, `aurora`, `orbital`, `cosmos`,
  `surfaces`, etc.) with `tokens`, `base`, `deck`, `signal`, `map`, `decide`,
  `prove`, `constellation`. Delete the unused rules. Target a smaller CSS
  payload than today.
- Commands JSON stays a separate chunk; Prove reserves height and lazy-loads
  the terminal after the act is near the viewport.
- Build warning: the bundle is dominated by Three.js. Keep it; do not add
  another 3D scene.

---

## 14. Features added

1. **Command palette** — accounts, techniques, acts.
2. **Focus account** — persists across Map, Decide and Prove.
3. **Principal search, filters, sort** in Map.
4. **Readout tabs** — Route / Node / Cut instead of one stacked dossier.
5. **Edge evidence** — selecting a hop shows the edge's action, evidence, fix.
6. **Copy route** — plain-text route with actions.
7. **Frame route** — camera eases to the selected route.
8. **Cut ledger** — before/after, edges cut, actions revoked, restore.
9. **Radial core** — 18 × 16 with hover, keyboard and ring index.
10. **Technique ledger** — ranked, searchable, with 16 exact account bars.
11. **Account ring card** — an account profile from the core.
12. **Fleet field** — canvas graph background.
13. **Process bus** — the five stages as one linked strip.
14. **Mission rail** — act progress, telemetry, mission patch, motion switch.
15. **Route-depth sparkline** — real per-account route distribution.
16. **Revocation ledger** — the engine's `permissionSteps`, which the current
    console never surfaces.
17. **Astronaut** — decorative EVA figure in Prove.

---

## 15. Content changes

- Replace the five method cards with the process bus.
- Replace “Orbital survey” with “02 / Map”; keep the solar-system lede.
- Replace the atlas copy (“Every way through, in one matrix”, “body = grants”)
  with core language: rings, spokes, markers, ledger.
- Remove “Questions the map raises” as a separate section; fold three limits
  into Prove.
- Remove the giant `Apsis` footer wordmark.
- Shorten the hero lede and keep one primary action.
- Keep the signature line “Every route ends at the sun.”
- Keep the synthetic-data framing in Prove and the footer.

---

## 16. File and component map

### Replace

| Current | New |
| --- | --- |
| `App.tsx` | shell: TopBar, MissionRail, FleetField, CommandPalette, four acts |
| `components/Masthead.tsx` | `components/TopBar.tsx` + `components/MissionRail.tsx` |
| `components/Cosmos.tsx` | `components/FleetField.tsx` + `styles/deck.css` sky |
| `sections/Hero.tsx` | `sections/Signal.tsx` + `signal/HeroRoute.tsx`, `ProcessBus.tsx`, `FleetReadout.tsx` |
| `sections/Survey.tsx` | `sections/Map.tsx` + `map/PrincipalRail.tsx`, `MapToolbar.tsx`, `Readout.tsx`, `HopScrubber.tsx` |
| `sections/Atlas.tsx` | `sections/Decide.tsx` + `decide/RadialCore.tsx`, `TechniqueLedger.tsx`, `TechniqueCard.tsx`, `AccountRingCard.tsx` |
| `sections/Commands.tsx` + `sections/Close.tsx` | `sections/Prove.tsx` + `prove/Terminal.tsx`, `ClosurePanel.tsx`, `CutLedger.tsx`, `EventHorizon.tsx`, `Astronaut.tsx`, `MissionNotes.tsx`, `SiteFooter.tsx` |
| `components/BlackHole.tsx` | `prove/EventHorizon.tsx` (shader reused, container removed) |
| `components/PlanetHero.tsx` | deleted |
| `components/SpaceCount.tsx` | deleted |
| `sections/survey/SurveyAside.tsx` | `map/Readout.tsx` |

### Keep / extend

- `components/Constellation.tsx`: add `frame(ids)` to the handle; add a
  `cut`/`dim` state; keep the existing orbit/moon/ring scene. Prop changes are
  additive.
- `components/ApsisMark.tsx`, `components/Reveal.tsx`, `lib/useSection.ts`,
  `lib/useInView.ts`, `lib/motion.ts`, `lib/graph.ts`, `lib/data.ts`.
- `lib/types.ts`: no data changes; add view-only types in `lib/view.ts`.

### New libs

- `lib/routeStats.ts`: fleet route-depth histogram, technique totals, account
  profiles, cut-by-action aggregation.
- `lib/exposure.ts`: the ring order and per-account exposure counts (derived,
  not scored).
- `lib/useStickyStep.ts`: IntersectionObserver step state for the core.
- `lib/useFocusAccount.ts`: app-level focus account (context + localStorage
  optional; default `games-studio`).

### CSS

- Rewrite `tokens.css` and `base.css`.
- Add `deck.css`, `signal.css`, `map.css`, `decide.css`, `prove.css`.
- Keep `constellation.css` (3D overlay labels) and adapt.
- Delete `field.css`, `aurora.css`, `orbital.css`, `surfaces.css`,
  `hero.css`, `survey.css`, `atlas.css`, `commands.css`, `close.css`,
  `cosmos.css` once their replacements land.
- Update `main.tsx` imports accordingly.

---

## 17. What stays untouched

- `apsis/` engine, `scenarios/`, `tests/`, `scripts/export_commands.py`.
- `console/src/data/*.json` and `commands.json`.
- `README.md` and docs except the design doc and screenshots.
- Workflows, licence, notice, security policy.

### Scripts

`verify.mjs`, `audit.mjs` and `shoot.mjs` are in scope to rewrite. They assert
the old DOM (`start/survey/atlas/commands/close`, the sever stamp, the atlas
matrix, the FAQ) which this design removes. “Done” means the new suite passes,
not that the obsolete checks are preserved:

- build;
- engine tests;
- a rewritten `verify` covering the four acts and the new flows;
- `audit` at 1440 and 390;
- screenshots of the four acts.

---

## 18. Verification

1. `python -m unittest discover -s tests` — 67/67.
2. `npm run build` — no type errors; CSS payload not larger than today.
3. `npm run verify` — a rewritten suite, replacing the old 54 checks:
   - four acts render and the top bar/rail navigate;
   - command palette opens, filters, selects an account, restores focus;
   - Map search filters principals and selects with the keyboard;
   - readout tabs switch and the cut tab shows edges cut and actions revoked;
   - core ring index selects an account and the ledger updates;
   - no overlay stamp on the map when severed;
   - clean account `ci-cd` renders its no-route state;
   - reduce-motion disables the sticky core, the countdown and the sweeps;
   - no console errors.
4. `npm run audit` at 1440 and 390 — no contrast failures, no unnamed
   controls, no targets under 24, no text under 14, no overflow.
5. Screenshots at 1440 and 390 for Signal, Map, Decide, Prove; refresh
   `docs/img`.
6. Manual: keyboard-only pass; 200% zoom; reduced motion; one full-screen
   scene at a time.

---

## 19. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Radial core is hard to read | Ring index, numbered spokes, ledger with exact counts, keyboard, tooltip |
| Sticky core causes motion sickness | Disabled below 1000 and for reduced motion; no scroll hijack; short pin |
| Background canvas hurts performance | 120/180 sample, DPR 1.5, pause offscreen/hidden, static frame |
| Two WebGL contexts | Remove PlanetHero; keep survey + horizon only |
| CSS rewrite regresses audit | Replace one act at a time; run verify/audit after each |
| Merged Prove becomes too dense | Sticky closure; terminal scrolls; three notes only |
| Astronaut reads as a gimmick | Small, wireframe, monochrome, one place, decorative, no face |
| Losing the space mood | Solar system kept, horizon full-bleed, sky field, arcs, HUD |

---

## 20. Left to the builder

- Exact microcopy beyond the lines above.
- Icon choices from Lucide.
- The precise sizes of the radial core at each breakpoint.
- Whether the account card appears above the technique card or in a sheet.
- Whether `frame(ids)` is implemented as a camera tween or a fit-to-bounds.
- The exact astronaut silhouette and tether path.
- Whether the process bus is sticky on desktop.
- The exact cut of the Prove countdown (144 routes → 0, or cuts → 0; the copy
  above prefers routes).

---

## 21. Builder questions resolved

A fresh builder reviewed the document and raised six questions. They are
settled here; none need another round.

1. **What is a “grant”?** The engine has edges, edge cuts and permission steps;
   the old page called all three “grants”. The vocabulary in §3.1 fixes it:
   edges observed (163), edges cut (37), revocations (32, from
   `permissionSteps`). The revocation ledger now surfaces the engine's
   human-readable answer, which the current console never showed.
2. **Are the verify/audit/shoot scripts in scope?** Yes. They assert the old
   DOM and the removed behaviours, so they are rewritten with the UI. The
   engine tests stay.
3. **What about an already-closed account?** `ci-cd` is a valid clean result,
   not a broken state. §7.7 defines the hero, Map, readout, disabled Sever and
   Cut-tab behaviour.
4. **How does the ring index relate to the rings?** It is a normal 16-row list
   with a ring swatch, not a 1:1 geometric leader-line chart. A literal
   alignment cannot render at 14px on 16 concentric rings.
5. **How do multiple administrators appear as “the sun”?** Keep the existing
   centre cluster; one body per administrator, labelled plural when there is
   more than one; a route lands on the specific administrator it reaches.
6. **Does the manual motion toggle survive?** Yes. It moves into the expanded
   mission rail and into the command palette, keeping the `localStorage` key
   and `data-motion` channel.

These are calls made by the design, not decisions the user was asked to make.

