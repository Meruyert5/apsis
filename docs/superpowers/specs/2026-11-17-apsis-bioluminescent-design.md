# Apsis — Bioluminescent Abyss design

**Status:** approved direction · 2026-11-17
**Supersedes:** the visual system and the Map section of
`2026-11-17-apsis-command-deck-design.md`.
**Keeps:** the four-act structure, the shell, the vocabulary, the ledger,
the command palette, the accessibility and performance floors, and the
verification gates from that document.

---

## 1. Intent

The console becomes a **living deep-sea instrument**. The account is an
organism; the fleet is the ecosystem it belongs to; the administrator is
the nucleus that every route reaches. The page is still a security tool, so
every glowing thing has a data job and every count stays exact.

The three approved mockups are the visual target:

- `docs/superpowers/specs/mockups/map-bio.html` — the 3D living account.
- `docs/superpowers/specs/mockups/core-prove.html?theme=bio` — the 3D
  specimen and the abyss.
- the six stills in `docs/superpowers/specs/mockups/`.

The solar-system Map is retired. The spatial logic survives: distance from
the administrator is still hop depth, and the shortest route is still the
bright spine.

---

## 2. What changes from the command-deck spec

| Area | Command deck | Bioluminescent Abyss |
| --- | --- | --- |
| Palette | navy, blue, violet, gold | abyss teal, cyan, mint, violet, coral, amber |
| Surfaces | glass over a star field | membrane/hull over a living abyss |
| Map | 3D solar system | 3D organism: nucleus, growth rings, cells, veins, membrane |
| Decide | 2D radial core | 3D specimen funnel, 2D radial as an alternate view |
| Prove | event horizon + astronaut | abyss vortex + diver |
| Background | fleet graph + stars | fleet filaments + plankton + caustic light |
| Copy | sun / orbit / planet | nucleus / growth ring / cell / vein |

The acts, the mission rail, the top bar, the command palette, the focus
account, the vocabulary, the verification gates and the licence split are
unchanged unless this document says otherwise.

---

## 3. Palette and surfaces

```
--abyss   #02090c   page base
--hull    #03110f   work panels
--hull-2  #041815   raised chrome
--well    #020c0b   data wells, terminal
--ink     #eafff8   primary text
--read    #a9e6d6   body text
--mute    #6fb8a8   labels
--faint   #3f7d72   metadata
--cyan    #4fe3c1   compute / live / primary signal
--violet  #8b7bff   identity
--mint    #d6fff2   trust / light
--rose    #ff8fa3   severance, critical
--amber   #ffd27a   nucleus, administrator, one live lure
```

- Two surfaces:
  - **Membrane** — translucent teal gradient, 1px cool edge, soft inner
    rim, asymmetric radius (22px / 7px). Used for work panels.
  - **Hull** — near-opaque abyss panel with a hairline, used for the
    terminal, readout and stage.
- Data wells are `#020c0b` with a 1px teal hairline.
- Amber is reserved for the nucleus and the one live signal. It is never a
  surface fill.
- Coral is reserved for severance. It never marks a healthy state.
- Category markers: identity violet circle, compute cyan diamond, trust
  mint double-ring.
- Typography is unchanged: Sora display, IBM Plex Sans reading, IBM Plex
  Mono telemetry. Nothing below 14px.

---

## 4. Act 01 — Signal

**Goal:** state the route and the fleet in one screen.

- H1: **Every route ends at the nucleus.**
- Lede: “Apsis reads an AWS account as a living system: cells on growth
  rings, the administrator at the nucleus. It finds every route a stolen
  credential could walk, then the fewest actions that close them all.”
- Right: **HeroRoute**, a 2D canvas/SVG of the focus account's signature
  route. Eight cells on a curved vein, pulses travelling to an amber
  nucleus, a faint membrane arc behind. No 3D on the first paint.
- Fleet readout: accounts, identities, routes, revocations. A route-depth
  sparkline underneath, drawn from per-account routes.
- **Process bus**: `INGEST 194 ─ COMPOSE 18 ─ FIND 144 ─ SEVER 32 ─ PROVE 5`
  with `37 edges` under SEVER. Five nodes on a hairline; clicking jumps to
  the act that owns the stage.
- Primary **Open the map**; secondary **Read the evidence**.
- The background is the fleet field: filaments and plankton at 8–14%.

---

## 5. Act 02 — Map (the living account)

**Goal:** inspect one account, one principal, one route.

### 5.1 Workbench

Desktop grid: `292px | 1fr | 352px` inside a membrane plate.

- **Toolbar:** account selector, title/account/region, stats (routes,
  reach, edges cut, actions), **Sever minimum cut / Restore routes**, live
  region.
- **Principal rail:** search, All / Users / Roles, rows with kind dot,
  label, hop count; keyboard listbox; count of principals with a route.
- **Stage:** the 3D organism, 640px tall; drag to orbit, scroll to zoom;
  hover a cell for the label/kind/hops; click to select; membrane, growth
  rings, cells, veins, nucleus, plankton.
- **Readout:** Route / Node / Cut tabs.
  - Route: selected principal, hops, step list (technique, action,
    evidence), copy route, sever.
  - Node: label, kind, degree, depth, ARN, note, walk this cell's route.
  - Cut: `0 routes remain`, routes before/after, edges cut, actions
    revoked with edges/routes counts, restore.
- **Hop bar:** numbered hops, play/pause, active step name, count.
- **Clean account** (`ci-cd`): no route, no selection; the organism shows
  the nucleus and cells but no lit vein; Sever disabled; readout says
  `0 routes · nothing to sever`; the hop bar says `no route`.

### 5.2 The organism

One account is one organism.

- **Nucleus** — the administrator cluster at the centre, amber, with a
  corona ring. Multiple administrators are separate lobes inside one
  nucleus; a route ends on the specific lobe it reaches.
- **Growth rings** — one per hop depth, organic wobble, faint teal. The
  outer ring is the deepest route; the centre is 0.
- **Cells** — identities. User violet, role cyan, group mint, resource
  ice. Sphere radius grows with degree. Administrators are amber lobes.
- **Veins** — escalation edges. Curved filaments; the selected route is a
  bright tube with two travelling pulses; other veins are faint.
- **Membrane** — a fresnel bubble around the account, breathing slowly.
  It is the account boundary, not decoration.
- **Severed state** — veins cut by `edgeCut.edges` turn coral, thicken,
  and carry a coral mark; the organism dims; the nucleus loses its warm
  glow; no route is lit.
- **Layout** — the signature route is the spiral spine: its nodes get
  monotonically decreasing angles from the outer ring to the nucleus;
  other cells at the same depth fill the rest of the ring. Nodes carry a
  small z undulation. The layout is deterministic from the export.
- **Camera** — perspective, orbit on drag, zoom on wheel/pinch, reset from
  the toolbar; initial view frames the whole membrane.

### 5.3 Interaction contract

- Choose account → rebuild organism, select its signature source, reset
  step/cut/tab.
- Select principal → route lit, readout Route, step at the last hop.
- Step a hop → no camera move; route lit through that hop.
- Sever → cut state, readout Cut, coral veins, live region; no overlay.
- Restore → route state.
- Click a cell → if it has a route, select it; otherwise Node tab.
- Hover a cell → tooltip; no layout shift.
- Copy route → `A → B → … → Administrator`.
- Palette account → set focus account and scroll here.
- The canvas is `aria-hidden`; the rail/readout carry the same data.

### 5.4 Copy

- H2: **The account, alive.**
- Lede: “The administrator is the nucleus. Every identity is a cell on the
  growth ring its hops allow; every escalation is a vein. Pick a principal,
  walk its route, then sever the cut.”
- Footer: `Fig. 02 / living account / nucleus · growth rings · veins`.

---

## 6. Act 03 — Decide (the fleet specimen)

**Goal:** show which primitives carry the fleet, and where.

### 6.1 Default 3D specimen

- A 3D funnel of 16 growth rings (accounts, inner = most exposed) and 18
  longitudinal ribs (techniques), with photophores at the intersections.
  Depth is the ring stack; the selected rib and ring glow; a nucleus glow
  sits at the centre.
- Categories: identity violet, compute cyan, trust mint.
- Drag to orbit, scroll to zoom; hover a photophore for technique,
  account and exact edge count; click to select both.
- The 3D canvas is the overview; the ledger is the exact reading path.
- **2D radial** toggle: the same data as an SVG radial core for clarity,
  reduced motion, low-power devices, or a failed WebGL context. The 2D
  view is the accessible fallback and remains fully interactive.
- Default: 3D on desktop with WebGL; 2D when `prefers-reduced-motion` is
  set, when WebGL is unavailable, or on narrow screens (<720px).

### 6.2 Ledger

- Search, category chips, 18 ranked technique rows with accounts and edge
  counts.
- Selected technique card: name, MITRE, severity, summary, 16 exact account
  bars, actions, fix, “open busiest account in the map”.
- Account ring index: 16 rows with a ring swatch and routes; selects the
  account and shows an account card with routes, reach, cuts, top
  techniques, “inspect in map”.
- Sticky core on desktop while the ledger scrolls; no pin for reduced
  motion or <1000px.

### 6.3 Copy

- H2: **Every way through, in one core.**
- Lede: “16 accounts on the rings, 18 primitives on the ribs. A
  photophore is an edge the engine observed; the ledger carries the exact
  counts, the actions and the fix.”
- Meta: `Specimen 01 / technique × account / source: engine export`.

---

## 7. Act 04 — Prove

**Goal:** run the engine, read the record, close the account.

### 7.1 Layout

- Left 58%: terminal. Right 42%: closure, sticky on desktop.
- The abyss is a full-bleed background layer on the right: a dark vortex
  with a spiral current, a lensed ring, plankton and caustic rays. No
  square, no border, no card.
- The diver floats at the lower right of the closure, tethered to the
  panel by a dashed line. `DIVE-01 / read-only`. Decorative, `aria-hidden`,
  6px drift, static for reduced motion.

### 7.2 Terminal

- Verb tabs Scan / Sever / Check / Techniques, scenario, format, command
  with copy.
- Recorded output, 460px max, mono 14px, line tones, bottom fade.
- Header: `DIVE LOG` / `REC` / engine version / account title.
- Footer: lines, format, recorded date, record key.
- The copy is still evidence-first: “Not a sample. The N lines beside this
  command are the recorded run for this exact invocation.”

### 7.3 Closure

- Giant `0`, `routes remain`, `verified at the cut`.
- Countdown `144 → 0` on entry; static final state for reduced motion.
- `37 edges cut · 32 actions revoked · 16 accounts`.
- Revocation ledger from `permissionSteps`, grouped by action with edges
  and routes; top six, expandable; “Printed, not applied.”
- A before/after route bar.
- The amber live dot is the only warm signal.

### 7.4 Notes and footer

- Three limits only: what Apsis reads, what a route is, what minimum
  means. Links to assumptions, research, security.
- Footer: wordmark, engine version, generated date, fixtures, licence
  split, GitHub link, “Designed and built by Meruyert Oshayeva.”
- No giant repeated wordmark.

---

## 8. Background and 3D system

- **Sky:** abyss base, teal glow top-left, violet lower-right, coral
  sliver near Prove, caustic rays, a fine teal grid, a faint membrane arc.
- **Fleet field:** one fixed canvas drawing a deterministic sample of the
  real fleet graph as filaments and plankton, 8–14% opacity, slow drift,
  parallax. Paused when hidden/offscreen/reduced motion; DPR 1.5.
- **3D budget:** three potential contexts — Map organism, Decide
  specimen, Prove abyss. Only one is visible at a time; each pauses when
  offscreen. The Signal act is 2D canvas/SVG only.
- **Shared patterns:** glow texture, fresnel membrane, photophore shader,
  camera drag/zoom, raycaster, dispose-on-rebuild. Extract to
  `lib/three/` helpers; no duplicated shader strings.
- **Reduced motion:** 2D radial core by default, static membrane/no pulses,
  no countdown, no drift. The Map still renders a static frame.

---

## 9. Responsive

| Width | Shell | Signal | Map | Decide | Prove |
| --- | --- | --- | --- | --- | --- |
| ≥1280 | rail + top bar | 55/45 | 292 / 1fr / 352 | 3D sticky + 40% ledger | 58/42, sticky closure |
| 1000–1279 | top bar | 55/45 | 270 / 1fr, readout below | 3D + ledger, no sticky | 58/42 |
| 900–999 | top bar | stacked | rail above stage, readout below | stacked | stacked |
| 720–899 | top bar | stacked | stage 520, rail as chips | 2D core default | stacked |
| <720 | top bar | stacked | stage 480, full workbench stacked | 2D core | abyss 260 |

- No horizontal overflow at 390. The Map stage is fixed width; the
  canvas never scrolls the page.
- 2D core default under 720.
- Touch targets 24px; core photophores get larger invisible hit areas.

---

## 10. Accessibility

- Same landmark, heading, skip-link, focus and live-region rules as the
  command-deck spec.
- The Map canvas is `aria-hidden`; the rail and readout duplicate every
  node, route and cut.
- The Decide 3D canvas is `aria-hidden`; the 2D radial and ledger are the
  accessible views. The 2D core is keyboard operable (arrows move the
  spoke/ring, Enter selects).
- The command palette, tabs, hop bar and severity controls are keyboard
  operable.
- Reduced motion: 2D core, no pulses, no countdown, no membrane breath,
  no diver drift.
- Contrast 4.5:1, 14px floor, 24px targets, focus visible.
- Amber is never the only carrier of meaning; the nucleus is also labelled
  “Administrator”.

---

## 11. Performance

- Map organism: ~16 cells, 16 veins, 8 rings, one membrane, 220 plankton;
  one rAF; pause offscreen; DPR 1.5.
- Decide specimen: 288 photophores, 16 rings, 18 ribs; one rAF; pause
  offscreen; dispose on rebuild; 2D fallback.
- Prove abyss: existing horizon shader, one rAF; pause offscreen.
- Signal: 2D canvas/SVG, no WebGL.
- CSS: replace the old 12-layer cascade with `tokens`, `base`, `deck`,
  `signal`, `map`, `decide`, `prove`. Delete the old theme layers.
- The commands JSON stays a separate chunk; Prove reserves its height and
  lazy-loads the terminal near the viewport.
- Target: build not larger than the current bundle; CSS smaller.

---

## 12. Components and files

### Shell

- `components/TopBar.tsx`, `components/MissionRail.tsx`,
  `components/ActHeader.tsx`, `components/SkyField.tsx`,
  `components/CommandPalette.tsx`, `components/Diver.tsx`.

### Signal

- `sections/Signal.tsx`, `signal/HeroRoute.tsx`,
  `signal/ProcessBus.tsx`, `signal/FleetReadout.tsx`.

### Map

- `sections/Map.tsx`, `map/MapToolbar.tsx`, `map/PrincipalRail.tsx`,
  `map/Organism.tsx` (Three.js), `map/Readout.tsx`, `map/HopBar.tsx`.
- `lib/organism.ts` — pure depth/route/layout functions.

### Decide

- `sections/Decide.tsx`, `decide/SpecimenCore.tsx` (Three.js),
  `decide/RadialCore.tsx` (SVG fallback), `decide/TechniqueLedger.tsx`,
  `decide/TechniqueCard.tsx`, `decide/AccountRingCard.tsx`.
- `lib/coverage.ts` — coverage matrix and technique/account aggregates.

### Prove

- `sections/Prove.tsx`, `prove/Terminal.tsx`, `prove/ClosurePanel.tsx`,
  `prove/RevocationLedger.tsx`, `prove/Abyss.tsx`, `prove/MissionNotes.tsx`,
  `components/SiteFooter.tsx`.

### Shared

- `lib/three/glow.ts`, `lib/three/membrane.ts`, `lib/three/photophores.ts`,
  `lib/three/orbit.ts` (camera drag/zoom/raycast helpers).
- Keep `lib/data.ts`, `lib/graph.ts`, `lib/types.ts`, `lib/useSection.ts`,
  `lib/useInView.ts`, `lib/motion.ts`, `components/ApsisMark.tsx`,
  `components/Reveal.tsx`.
- Retire `Constellation.tsx`, `PlanetHero.tsx`, `BlackHole.tsx`,
  `SpaceCount.tsx`, `Masthead.tsx`, `Cosmos.tsx`, `SurveyAside.tsx`.
- CSS: rewrite tokens/base, add deck/signal/map/decide/prove; delete the
  old theme CSS.

---

## 13. Content and vocabulary

- Vocabulary from the command-deck spec §3.1 stays: routes, edges, edge
  cut, revocations. The console says **163 edges observed**, **37 edges
  cut**, **32 actions revoked**.
- “Sun” becomes “nucleus”; “orbit” becomes “growth ring”; “planet”
  becomes “cell”; “body” becomes “photophore” in the specimen.
- The synthetic-data framing, MIT/design split and author credit are
  unchanged.

---

## 14. Verification

1. `python -m unittest discover -s tests` — 67/67.
2. `node --test console/scripts/*.test.mjs` — organism layout/depth/route
   and coverage aggregates.
3. `npm run build` — no type errors; CSS payload smaller than before.
4. `npm run verify` — a rewritten suite covering the four acts, Map
   selection/step/sever/restore, Decide 2D/3D toggle and ledger, clean
   account, palette, reduced motion, no overflow, no console errors.
5. `npm run audit` at 1440 and 390 — contrast, names, targets, 14px floor.
6. Screenshots of Signal, Map (route + cut), Decide (3D + 2D), Prove at
   1440 and 390; refresh `docs/img` and OG.
7. Manual keyboard and 200% zoom pass.

---

## 15. Risks

| Risk | Mitigation |
| --- | --- |
| Organism reads as decoration | Every ring/cell/vein is data; ledger/readout exact; no invented scores |
| 3D is heavy | One visible context; pause offscreen; 2D fallback; DPR cap |
| Two admins make the nucleus ambiguous | One nucleus with lobes; route ends on the specific lobe; label “Administrator” |
| Bioluminescence softens severity | Coral severance, explicit counts, terminal evidence, exact ledger |
| 3D core hard to read | 2D toggle, ledger, ring index, keyboard |
| CSS rewrite regresses | Replace act by act; run build/verify/audit after each |
| Large scope | Phased plan; each act ships independently |

---

## 16. Open calls

- Exact organism cell shapes (sphere vs. capsule) and membrane opacity.
- The 3D core default camera and photophore sizes.
- Whether the Map stage has a “frame whole account” control beyond reset.
- The diver silhouette and tether path.
- The exact countdown (routes 144 → 0).
- Whether the Signal hero route is canvas or SVG (canvas preferred for
  pulses; SVG acceptable for accessibility).
