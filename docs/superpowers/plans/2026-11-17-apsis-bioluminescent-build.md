# Apsis Bioluminescent Abyss Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Apsis console as a bioluminescent deep-sea instrument with a 3D living-account Map, a 3D fleet specimen, and a merged proof act.

**Architecture:** One React/Vite page with four acts (Signal, Map, Decide, Prove), a fixed mission rail and top bar, a canvas fleet field, and three Three.js scenes that are only active when visible. Pure route/depth/layout maths live in `lib/organism.ts` and coverage aggregates in `lib/coverage.ts`; components render them. The old solar-system, planet atlas and astronaut are removed.

**Tech Stack:** React 19, TypeScript, Vite 8, Three.js 0.187, Lucide, CSS, Node 24 `--test` for pure logic, Playwright-free CDP scripts for verify/audit.

**Specs:**
- `docs/superpowers/specs/2026-11-17-apsis-command-deck-design.md` (structure, vocabulary, shell, accessibility)
- `docs/superpowers/specs/2026-11-17-apsis-bioluminescent-design.md` (theme, Map organism, 3D core, abyss)
- Mockups: `docs/superpowers/specs/mockups/map-bio.html`, `core-prove.html?theme=bio`, stills.

## Global Constraints

- No new runtime dependency. Dev-only `tsx` is not needed; Node 24 strips TypeScript in tests.
- Engine, fixtures and `console/src/data/*.json` are untouched.
- Vocabulary: **163 edges observed**, **37 edges cut**, **32 actions revoked**. Use `sever.permissionSteps`, not `edgeCut.byAction`, for the revocation ledger.
- Text floor 14px; contrast 4.5:1; targets 24px; no horizontal overflow at 390; reduced-motion parity.
- Amber only for the nucleus/live signal; coral only for severance/critical.
- 3D budget: at most one visible WebGL scene at a time; pause offscreen; DPR ≤1.5; 2D fallback for Decide under 720px or reduced motion.
- Author credit **Meruyert Oshayeva**; MIT code + reserved design.
- Every commit leaves `npm run build` passing.
- Do not delete an old section or its CSS until the replacement is mounted in `App.tsx`; Task 10 removes the leftovers. The page must build and render at every commit.

## Review Focus

- **Clean account (`ci-cd`)** must render a valid “0 routes / nothing to sever” state in Signal, Map and Prove, not a blank or crashed view.
- **Multiple administrators** (six fixtures) must show one nucleus with lobes, and a route must end on the specific administrator.
- **No WebGL / reduced motion** must fall back to the 2D core and static Map/abyss without losing data.
- **390px** must keep the workbench usable, with no page overflow and every control reachable.
- **3D disposal** must not leak renderers/geometries when switching account, theme view or route.

---

### Task 1: Theme foundation, sky and shell

**Files:**
- Rewrite: `console/src/styles/tokens.css`, `console/src/styles/base.css`
- Create: `console/src/styles/deck.css`
- Create: `console/src/components/SkyField.tsx`, `TopBar.tsx`, `MissionRail.tsx`, `ActHeader.tsx`
- Modify: `console/src/App.tsx`, `console/src/main.tsx`
- Delete after replacement: `Masthead.tsx`, `Cosmos.tsx`

**Interfaces:**
- Produces: `TopBar({ current, onPalette })`, `MissionRail({ current })`, `ActHeader({ index, label, title, lede, meta })`, `SkyField()`; CSS classes `deck`, `act-head`, `membrane`, `well`.
- Consumes: `useSection()`.

- [ ] **Step 1: Add failing shell checks to `console/scripts/verify.mjs`**

Replace the section selectors with `#signal, #map, #decide, #prove`, assert the top bar exists, four act links exist, and `document.documentElement.scrollWidth === innerWidth` at 1440.

- [ ] **Step 2: Run `npm run verify`; expected FAIL** — old sections/classes still present.

- [ ] **Step 3: Rewrite tokens/base and add deck.css**

Implement the palette in the bio spec §3, the membrane/hull/well surfaces, 14px+ type, focus rings, and the asymmetric radius. Import order in `main.tsx`: `tokens, base, deck` first; old theme files removed in later tasks.

- [ ] **Step 4: Implement SkyField**

A fixed `<canvas aria-hidden>`: 220 plankton points and a deterministic sample of fleet edges, 8–14% opacity, slow drift, pause on `document.hidden`/reduced motion, DPR 1.5. No fleet data yet → use a small seeded graph; replace with real edges in Task 4.

- [ ] **Step 5: Implement TopBar/MissionRail/ActHeader**

Top bar: wordmark, four act links, focus chip placeholder, ⌘K placeholder, read-only. Rail: act ladder, progress, account/route summary placeholders, expand button. ActHeader: left-aligned index/eyebrow/title/lede, right meta. Add the four `<section>` placeholders in `App.tsx` with ids `signal/map/decide/prove`.

- [ ] **Step 6: Run build + verify; expected PASS** for the shell checks.

- [ ] **Step 7: Commit** — `feat: add bioluminescent shell and sky`

---

### Task 2: Organism model and tests

**Files:**
- Create: `console/src/lib/organism.ts`
- Test: `console/src/lib/organism.test.ts`
- Modify: `console/package.json` scripts: `"test:logic": "node --test src/lib/*.test.ts"`

**Interfaces:**
- Produces:
  ```ts
  export interface OrganismRoute { nodes: string[]; edges: GraphEdge[]; hops: number }
  export interface OrganismModel {
    nodeById: Map<string, GraphNode>;
    admins: string[];
    depth: Map<string, number>;
    maxDepth: number;
    out: Map<string, GraphEdge[]>;
    routeFor(source: string): OrganismRoute | null;
    principals: { node: GraphNode; route: OrganismRoute }[];
    positions: Map<string, { x: number; y: number; z: number }>;
    maxRadius: number;
  }
  export function buildOrganism(bundle: Bundle): OrganismModel
  ```
- Consumes: `Bundle`, `GraphEdge`, `GraphNode` from `lib/types`.

- [ ] **Step 1: Write failing tests** for `games-studio`:
  - `depth.get('gs-intern') === 7`, `depth.get('gs-backup') === 1`, `depth.get('__admin__') === 0`.
  - `routeFor('gs-intern').hops === 7`, first node `gs-intern`, last `__admin__`.
  - `routeFor('gs-support').hops === 1` (lands on `gs-admin`).
  - `routeFor('__admin__') === null`.
  - `principals.length === 9`.
  - every position is finite; `maxRadius > 0`; the signature spine angles decrease monotonically from the outer ring to depth 1 (assert via positions’ angles).
  - For `ci-cd`: `principals.length === 0`, `routeFor(<principal>) === null`.
- [ ] **Step 2: Run `npm run test:logic`; expected FAIL** (module absent).
- [ ] **Step 3: Implement `buildOrganism`** with reverse BFS depth, directed BFS `routeFor`, principal list, signature-spine layout, deterministic angles, z undulation. Keep it pure; no Three.js.
- [ ] **Step 4: Run tests; expected PASS.**
- [ ] **Step 5: Commit** — `feat: add organism route and layout model`

---

### Task 3: Signal act

**Files:**
- Create: `console/src/sections/Signal.tsx`, `console/src/signal/HeroRoute.tsx`, `ProcessBus.tsx`, `FleetReadout.tsx`, `console/src/styles/signal.css`
- Modify: `App.tsx`

**Interfaces:**
- `HeroRoute({ route, label, adminLabel })` — 2D canvas pulses.
- `ProcessBus({ totals, counts })` — five buttons scroll to acts.
- `FleetReadout({ totals, revocations, sparkline })`.

- [ ] **Step 1: Add verify assertions** for `Every route ends at the nucleus`, `Open the map`, the five bus labels, and the fleet numbers.
- [ ] **Step 2: Run verify; expected FAIL.**
- [ ] **Step 3: Implement Signal** with H1/lede/actions, `HeroRoute` (signature route of the focus account; clean-account no-route state), readout, sparkline, process bus. Canvas only; no WebGL.
- [ ] **Step 4: Build + verify; expected PASS. Screenshot 1440/390.**
- [ ] **Step 5: Commit** — `feat: add bioluminescent signal act`

---

### Task 4: Map organism scene

**Files:**
- Create: `console/src/map/Organism.tsx`, `console/src/lib/three/glow.ts`, `membrane.ts`, `photophores.ts`, `orbit.ts`, `console/src/styles/map.css` (stage part)
- Modify: `SkyField` to use real fleet edges.
- Test: `verify` stage checks.

**Interfaces:**
- ```ts
  Organism({ bundle, model, selected, activeNodes, activeEdges, cutEdges, onSelect })
  ```
  Renders a `<canvas>`, disposes on unmount, exposes no imperative API beyond `resetView` via prop callback.

- [ ] **Step 1: Add verify checks** for `#map3d`, `canvas` size, and no WebGL errors.
- [ ] **Step 2: Run verify; expected FAIL.**
- [ ] **Step 3: Implement shared Three helpers** (glow texture, fresnel membrane, photophore shader, camera drag/zoom/raycast, dispose).
- [ ] **Step 4: Implement Organism** using `buildOrganism`: nucleus lobes, growth rings, cells, veins, route tube + pulses, cut veins coral, membrane, plankton, hover/click, drag/zoom, pause offscreen.
- [ ] **Step 5: Build + verify; expected PASS. Screenshot stage.**
- [ ] **Step 6: Commit** — `feat: add 3D living account organism`

---

### Task 5: Map workbench

**Files:**
- Create: `console/src/sections/Map.tsx`, `console/src/map/MapToolbar.tsx`, `PrincipalRail.tsx`, `Readout.tsx`, `HopBar.tsx`
- Modify: `styles/map.css`, `App.tsx`
- Test: extend `verify.mjs`.

**Interfaces:**
- Map state: `{ focusKey, source, route, step, cut, tab, node }`.
- `Readout({ bundle, route, node, step, cut, onTab, onRestore, onCopy })`.
- `PrincipalRail({ rows, value, query, kind, onQuery, onKind, onSelect })`.
- `HopBar({ route, step, playing, onStep, onPlay })`.

- [ ] **Step 1: Add verify checks** for:
  - 9 principal rows in `games-studio`;
  - selecting the third row changes the readout title;
  - 7 hop buttons;
  - sever → `0 routes remain`, `0/13 reach`, `2 edges`, `2 actions`, restore;
  - clean account `ci-cd` → no rows, sever disabled, cut tab `0 routes`;
  - copy route writes the arrow path.
- [ ] **Step 2: Run verify; expected FAIL.**
- [ ] **Step 3: Implement Map** with toolbar/rail/stage/readout/hop bar, account selector, live region, keyboard rail, clean-account state, and Organism wiring.
- [ ] **Step 4: Build + verify; expected PASS. Screenshots route + cut, 1440/390.**
- [ ] **Step 5: Commit** — `feat: add living-account workbench`

---

### Task 6: Decide — 3D specimen, 2D fallback, ledger

**Files:**
- Create: `console/src/lib/coverage.ts`, test `coverage.test.ts`
- Create: `console/src/sections/Decide.tsx`, `decide/SpecimenCore.tsx`, `RadialCore.tsx`, `TechniqueLedger.tsx`, `TechniqueCard.tsx`, `AccountRingCard.tsx`, `styles/decide.css`
- Delete after replacement: `Atlas.tsx`, `SpaceCount.tsx`, `atlas.css`

**Interfaces:**
- `buildCoverage(bundles): { matrix, techniques, accounts, totals, revocations }`
- `SpecimenCore({ coverage, techId, accountKey, onSelect })`
- `RadialCore({ coverage, techId, accountKey, onSelect })`

- [ ] **Step 1: Write failing coverage tests**:
  - 18 techniques, 16 accounts, 163 edges;
  - `Mint credentials` total 30 / 12 accounts;
  - `Cross-role assumption` total 57;
  - revocation ledger has 6 actions, sum edges 37, `sts:AssumeRole` 31 edges;
  - per-account bars for `games-studio` sum 16.
- [ ] **Step 2: Run logic tests; expected FAIL.**
- [ ] **Step 3: Implement coverage; run tests PASS.**
- [ ] **Step 4: Implement Decide** with 3D specimen default on desktop/WebGL, 2D fallback under 720/reduced-motion/no WebGL, toggle, ledger, 16 account bars, ring index, account card, sticky core, category dim.
- [ ] **Step 5: Add verify checks** for toggle, ledger selection, account ring, 2D fallback; build/verify PASS.
- [ ] **Step 6: Commit** — `feat: add 3D fleet specimen and technique ledger`

---

### Task 7: Prove — terminal and closure

**Files:**
- Create: `console/src/sections/Prove.tsx`, `prove/Terminal.tsx`, `ClosurePanel.tsx`, `RevocationLedger.tsx`, `styles/prove.css`
- Modify: `App.tsx`
- Delete after replacement: `Commands.tsx`, `Close.tsx`, `commands.css`, `close.css`

**Interfaces:**
- `Terminal({ focusKey })` — verb/scenario/format, recorded output, copy.
- `ClosurePanel({ totals })` — zero, countdown, revocation ledger.

- [ ] **Step 1: Add verify checks** for verb tabs, scenario default = focus account, format switch, copy, zero, `37 edges cut`, `32 actions revoked`, six revocation rows.
- [ ] **Step 2: Run verify; expected FAIL.**
- [ ] **Step 3: Implement terminal and closure** with the real commands JSON, `permissionSteps` aggregation, copy, live region, no overlay.
- [ ] **Step 4: Build + verify PASS. Screenshot 1440/390.**
- [ ] **Step 5: Commit** — `feat: merge command log and closure into proof`

---

### Task 8: Prove — abyss, diver, notes, footer

**Files:**
- Create: `console/src/prove/Abyss.tsx`, `console/src/components/Diver.tsx`, `prove/MissionNotes.tsx`, `components/SiteFooter.tsx`
- Modify: `Prove.tsx`, `styles/prove.css`

**Interfaces:**
- `Abyss({ reduced })` — full-bleed shader/canvas, no square.
- `Diver()` — decorative SVG, label `DIVE-01 / read-only`.

- [ ] **Step 1: Add verify checks** for the abyss layer, `DIVE-01`, three notes, footer credit.
- [ ] **Step 2: Implement** the abyss (reuse the existing horizon shader, transparent full-bleed), diver, notes, footer; disable motion under reduced motion.
- [ ] **Step 3: Build + verify + audit PASS. Screenshot 1440/390.**
- [ ] **Step 4: Commit** — `feat: add abyss, diver and mission notes`

---

### Task 9: Command palette, focus account, cross-act links

**Files:**
- Create: `console/src/components/CommandPalette.tsx`, `console/src/lib/useFocusAccount.tsx`
- Modify: `TopBar.tsx`, `Map.tsx`, `Decide.tsx`, `Terminal.tsx`

**Interfaces:**
- `useFocusAccount(): { focusKey, setFocusKey }`
- `CommandPalette({ open, onClose, onAccount, onTechnique, onAct })`

- [ ] **Step 1: Add verify checks** for ⌘K open/filter/Escape/focus return, account selection scrolls to Map, technique selection selects in Decide.
- [ ] **Step 2: Implement** context, palette, top-bar chip, Map account selector, Decide account card → Map, Terminal scenario default.
- [ ] **Step 3: Build + verify PASS.**
- [ ] **Step 4: Commit** — `feat: add command palette and focus account`

---

### Task 10: Verification suite, screenshots, cleanup

**Files:**
- Rewrite: `console/scripts/verify.mjs`, `audit.mjs` selectors, `shoot.mjs` sections
- Modify: `console/src/main.tsx`, `App.tsx`
- Delete: `Constellation.tsx`, `PlanetHero.tsx`, `BlackHole.tsx`, `survey/*`, old CSS layers (`field`, `aurora`, `orbital`, `surfaces`, `hero`, `survey`, `atlas`, `commands`, `close`, `cosmos`)
- Update: `docs/img/*`, `README.md`, `docs/DESIGN.md`, `CHANGELOG.md`

- [ ] **Step 1: Rewrite verify** for four acts, Map route/step/sever/clean, Decide 3D/2D, Prove terminal/ledger, palette, reduced motion, no overflow, no console errors.
- [ ] **Step 2: Update audit** selectors and assertions (14px/contrast/targets/names).
- [ ] **Step 3: Update shoot** to `signal/map/decide/prove`, desktop/mobile, route/cut/3D states.
- [ ] **Step 4: Delete old components/CSS; verify no imports remain.**
- [ ] **Step 5: Refresh `docs/img` and OG; update README/DESIGN/CHANGELOG to the bio theme and new screenshots.**
- [ ] **Step 6: Run the full gate**:
  - `python -m unittest discover -s tests` (67/67)
  - `npm run test:logic`
  - `npm run build`
  - `npm run verify`
  - `npm run audit`
- [ ] **Step 7: Commit** — `feat: complete bioluminescent console`

---

## Self-Review Notes

- Spec coverage: shell (Task 1), Signal (3), Map model (2), Map scene/workbench (4–5), Decide (6), Prove (7–8), palette/focus (9), verification/docs (10).
- Review Focus tests are placed: clean account (2, 5), multiple admins (2, 4), no WebGL/reduced motion (6), 390 (5, 10), disposal (4, 6).
- No new runtime dependency; Node 24 type-stripping covers the pure tests.
- The mockups are the visual reference; the plan does not repeat their CSS.
