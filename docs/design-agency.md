# Apsis design overhaul — agency review

Date: 17 November 2026
Brief: a huge design overhaul, five complete design systems and UI kits, one
choice. The site will be 3D.

The five directions are standalone HTML files under
`console/public/design-lab/`, served at `/design-lab/` by the app. The index is
`console/public/design-lab/index.html`. Every direction includes a real WebGL
stage (orbital orrery, orthographic diagram, or living specimen) with drag,
zoom, a 2D fallback and a reduced-motion path.

---

## The room

**Cast**

- Mara — CEO
- Ilya — CTO
- Priya — engineer
- Noa — designer

### Round 1 — the brief

**Mara (CEO):** It looks like every other AI security dashboard. We sell trust to
people who have seen a hundred of these. The site should feel like a flagship
instrument, not a template with our logo on it.

**Ilya (CTO):** A flagship has to survive sixteen fixtures, four 3D scenes,
reduced motion, a 390px screen and a 14px floor. I do not want a design that only
works in the hero and falls apart in the readout.

**Priya (engineer):** No new runtime dependency, no layout thrash, one focus
system. If the type needs a remote font, we self-host it. I want the tokens to be
boring enough that another engineer can extend a panel without asking Noa.

**Noa (designer):** Then we need one idea per direction, not five features. I
will bring five systems that make different bets: editorial, cyber, Swiss,
organic, terminal. Same product, same data, five different arguments about what a
security instrument should feel like.

### Round 2 — the five

**Noa:** **The Observatory** is the editorial bet. Warm black, bone, gold, a
high-contrast serif display, mono captions, a 3D orrery treated as an engraved
plate. It is the most memorable. The risk is that it reads as a magazine rather
than an operator console.

**Mara:** I like it. It has a point of view.

**Ilya:** I worry about density. A CISO scanning a route table at 7am wants the
data to be immediate. The serif has to stay in display only.

**Noa:** **Orbital Ops** is the category bet. Four cyber decks, one glass console,
a different neon ink per act, a real holographic 3D stage, scanlines and HUD
labels. It is the most direct heir to the product. It is also the easiest to
overdo. My rule: glow only where a state is live, glass on the hero and one
readout only.

**Mara:** This is the one that says “this is the category.”

**Priya:** The 3D stage is already built. One scene at a time, pause offscreen,
2D fallback, drag and zoom. It is buildable.

**Noa:** **Swiss Instrument** is the trust bet. Paper, two inks, Anton, a visible
grid, a real orthographic 3D diagram with numbered leader lines. It reads like an
instrument manual, not a sci-fi film.

**Ilya:** This is the one I trust in a procurement review. It is also the most
legible at a distance.

**Mara:** It could look like a consultancy deck if the data is not sharp.

**Noa:** That is the bet. It is the opposite of the current default. The 3D model
is a diagram, not a toy.

**Noa:** **Bioluminescent Field** is the human bet. Deep teal, aqua and coral,
Fraunces, soft radii, a living specimen, a field biologist. It makes the account
feel alive without turning it into a HUD.

**Mara:** It is beautiful. It feels different from every security product I have
seen.

**Ilya:** Softness can erode contrast and data density. It needs the hardest
numbers in the softest surface.

**Noa:** **Terminal / Raw** is the engineer bet. One monospace family, black,
paper and acid green, no radius, no shadow, a wireframe 3D orrery and a real TUI.
It is the fastest to build and the most opinionated.

**Priya:** It is the engineer-love option. It is also the one that could scare a
non-technical buyer.

**Mara:** Good. Build all five. I want to see the product in each, not a
moodboard. Then we pick with our eyes, not with a vote.

### Round 3 — the call

**Noa:** The five are not skins of one layout. Each has its own grid, type
pairing, surface logic, component shape and motion budget. Each includes a real
3D stage because the site is 3D. The comparison is only useful if the bones
differ.

**Ilya:** Then the decision is a positioning decision: category flagship, trust
instrument, or engineer cult.

**Mara:** Exactly. Present them. I will pick.

---

## The five directions

| # | Direction | Register | 3D scene | Best for | Watch out |
| --- | --- | --- | --- | --- | --- |
| 01 | The Observatory | Editorial dark | Engraved orrery, matte bone/gold | Trust, differentiation, a memorable launch | Less immediate as an operator console |
| 02 | Orbital Ops | Cyber console | Holographic orrery, additive cyan/blue/amber | Category fit, live instruments, flagship demo | Sci-fi cliché if the glow is not rationed |
| 03 | Swiss Instrument | Light technical | Orthographic black/red wireframe on paper | Procurement, clarity, long-term trust | Could read as a consultancy deck |
| 04 | Bioluminescent Field | Organic deep-sea | Translucent specimen, aqua/coral, tentacles | Human scale, a poetic brand | Softness can erode contrast and density |
| 05 | Terminal / Raw | Brutalist terminal | Acid wireframe orrery + TUI | Engineer-led launches, speed, cult identity | Can read as hostile to a non-technical buyer |

### Files

- `console/public/design-lab/index.html` — the agency memo, conversation and comparison
- `console/public/design-lab/01-observatory.html`
- `console/public/design-lab/02-orbital-ops.html`
- `console/public/design-lab/03-swiss-instrument.html`
- `console/public/design-lab/04-bioluminescent.html`
- `console/public/design-lab/05-terminal.html`
- `console/public/design-lab/lab.css` — the neutral review shell
- `console/public/design-lab/lab-3d.js` — the shared WebGL stage

### How to review

1. Read the cover and the thesis. Does it sound like the company you want to be?
2. Use the kit: drag the 3D stage, press Use 2D, click the tabs, resize to 390.
3. Read the trade-off. Pick the loss you can live with.

### Recommendation from the room

If the launch is category-led and the demo is the product, start with **02
Orbital Ops**. If the buyer is a CISO or a procurement committee, start with **03
Swiss Instrument**. The designer would keep **01 The Observatory** as the brand
layer and use **02** for the console. **04** and **05** are the wildcards: they
test how far the brand can go. The final call is the client's.

### 3D contract shared by all five

- One visible WebGL scene per page; pause when offscreen.
- Drag to orbit with damping, scroll to zoom, double-click reset.
- Four perimeter labels maximum; no floating labels over the geometry.
- A 2D fallback on the same surface and a reduced-motion path.
- A real command, route or specimen in the scene; no decorative geometry that
  does not map to the account.

---

## Revision 3 — five worlds, Signal only (current)

**Mara (CEO):** “All five are bad. They are design-system demos. Forget the
design and UI completely.”

**Noa (designer):** “Then we start from a world, not a component kit. Five
worlds, one Signal act each, real data, real 3D. Pick the world, then we build
Map, Decide and Prove.”

**Ilya (CTO):** “Real WebGL, real fallback, 390px and 1440px. Same contract as
before, no exceptions.”

**Priya (engineer):** “One vertical slice before the other three acts. I am not
building four screens of a world we have not chosen.”

### The five worlds

| # | World | Register | 3D | The bet |
| --- | --- | --- | --- | --- |
| 01 | GRIT | Deconstructed print / flyer | Halftone orrery, stutter, red route | The account is a scene; loud, memorable, category-breaking |
| 02 | The Quiet Survey | Atmospheric field poster | Slow, foggy landscape, one warm light | The opposite of security SaaS; a place at dusk |
| 03 | The Flight Deck | Analog hardware panel | Hologram in a physical glass display | The instrument metaphor made literal |
| 04 | The Field Notebook | Expedition log | Specimen plate on paper, sepia ink | Human scale, evidence and observation |
| 05 | The Broadcast | CRT signal room | Phosphor orrery, scanlines, one live feed | The account is being transmitted, not browsed |

The two poles the client supplied are **GRIT** (deconstructed print) and **The
Quiet Survey** (travel poster). The other three extend the range: tactile,
analog, live.

### Files

- `console/public/design-lab/v2/index.html` — the five-world comparison
- `console/public/design-lab/v2/grit.html`
- `console/public/design-lab/v2/quiet-survey.html`
- `console/public/design-lab/v2/flight-deck.html`
- `console/public/design-lab/v2/field-notebook.html`
- `console/public/design-lab/v2/broadcast.html`

### What each mock proves

- A world can carry the real Apsis data: 16 accounts, 194 identities, 144
  routes, 37 edges cut, the seven-hop tools-intern route, the Penumbra handoff.
- The 3D stage can change material language without changing the geometry:
  halftone, dusk, amber hardware, sepia ink, phosphor.
- A Signal-only vertical slice is enough to judge the world. The other acts are
  deliberately not designed yet.

### Room recommendation

If the brand needs to be unmistakable: **GRIT** or **The Quiet Survey**. If the
buyer is a CISO: **The Flight Deck** or **The Field Notebook**. If the story is
live operations: **The Broadcast**. The designer would prototype **The Quiet
Survey** and **GRIT** first because they are the two poles; the next step is one
Signal slice in the chosen world, then Map.


---

## Revision 4 - ten exact style plates (current)

The five worlds were still interpretations. This pass treats the ten supplied descriptions as the brief and builds one full-viewport plate per style in a single comparison page: `/design-lab/v4/`.

Each plate has the real Apsis data (16 accounts, 194 identities, 144 routes, 37 edges cut, 07 hops) and a different object that carries the account. The object is chosen for the style, not reused from an orrery:

01 Acid - a halftone data body with a red/cyan route ribbon and motion blur.
02 Neo-Vintage - a low-poly Fuji with a red route climbing to the summit, torii markers, hanko and Seigaiha.
03 Neon - a 16-petal CMYK blossom with a magenta glow, crop windows and EN/RU microcopy.
04 Limbo - a phosphor point-cloud cluster of cubes/spheres inside an arched portal and synthwave grid.
05 Astronomicon - a ringed megastructure in a rust desert, with tiny figures and archival metadata.
06 Silent Authority - a crown of thorns around a greatsword, haloed in sepia gold and blood red.
07 Surveillance - a goat skeleton X-ray with thermal amber/cyan scanner windows and HUD reticles.
08 Atomic Apsis - a chrome DNA helix on off-white, with the lowercase echo and protocol commands.
09 Vampire - lips and fangs in a 90s flash close-up, gothic serif, film grain and vertical katakana.
10 Mesmerize - a thermal jellyfish with liquid type, lens cutouts and marginal descriptors.

The plates are style frames, not the final build: the chosen direction becomes the live 3D object and the other three acts. The first pass (v2) and the earlier style pass (v3) are kept as evidence only.


---

## Revision 5 - chosen hybrid: Towards Limitless

The client chose Acid Graphics + Limbo + Cinematic Lo-fi Editorial. The mock is at `/design-lab/v5/`.

It combines the acid grid, barcodes, crop compartments and registration marks with Limbo's phosphor point-cloud cluster and arched portal, over a deep-emerald rainy street with red-orange halation, film dust and scratches. Typography is Archivo Black for TOWARDS, Bodoni italic for Limitless and the vertical 'the', IBM Plex Mono for dates, credits and the STRANGE barcode, and Inter Tight for reading.

The 3D object is a cluster of 16 cubes/spheres (the accounts) joined by a red route through the seven hops, with an acid ring and a warm core. It is a real WebGL object with drag, zoom, reset and Use 2D, not a recoloured orrery.

The palette is emerald #03140F, crimson #FF3B1F, orange #FF6B35, acid lime #C8FF00, cyan #4FE3FF and bone #F2F0E8.

Next: take this Signal mock to the live app, then extend the same world to Map, Decide and Prove.


---

## Revision 6 - three palette studies on the v5 template

Three colour grades of the approved v5 poster at `/design-lab/v6/`. The layout, type, grid, portal, copy, data strip and the point-cloud account cluster are unchanged. Only the palette, background light and surface texture move.

01 Thermal / Iridescent - obsidian #080C0E with coral #FF3B5C, amber #FFA62B, cyan #00F0FF, phosphor mint #1EFF8E and ultraviolet #5A4BFF. Heavy stipple rises over the same street composition.

02 Neon Luxe - pitch black #0D0303, ice off-white #EFF8FF, acid lime #BBEF1F and hot crimson magenta #FF0055. Crisp, almost grain-free, two accents and one ice.

03 OPUL 77 - a pitch-black #0A0708 void with a sunset-to-bioluminescent wash: golden yellow #FFC837, tangerine #FF6B2B, hot pink #FF2A9D, periwinkle #6E7BFF and seafoam #2CEAA3. Typography stays white.

No new 3D objects: all three use the v5 cluster and route, recoloured through the shared palette table.

---

## Revision 7 - Neon Luxe dashboard build

The Neon Luxe palette is now a dashboard, not a poster. It lives at `/dashboard.html` as its own Vite entry: separate shell, components and stylesheet, with none of the old console markup or CSS.

The shell is a 236px rail plus a sticky command bar: focus account, section nav, the palette card, snapshot status. The page has five figures (16 accounts, 194 identities, 144 routes, 37 edges cut, 07 deepest), the real Games Studio 7-hop route atlas with the cut marked, a sortable/searchable 16-account fleet table, posture, an evidence timeline and a JSON snapshot export. Figures come from `src/lib/data.ts`; the row totals reconcile to 194 identities, 144 routes and 37 cut edges.

The right-hand Figure / Apsis panel is the name test. An apsis is an orbit's closest or farthest point, so the figure maps perigee to the 1-hop route and apogee to the 7-hop route. It gives the name a real product meaning without forcing the counts to spell A-P-S-I-S.

Typography is Sora for figures and headings, IBM Plex Sans for reading, IBM Plex Mono for telemetry labels, and Georgia italic for the editorial accent. Palette: pitch #0D0303, ice #EFF8FF, acid lime #BBEF1F, crimson magenta #FF0055.

The old console is untouched. This entry is the base for the next product pass; it can become the default route once the shape is approved.

### Dashboard refinement

Second pass on the Neon Luxe dashboard. Removed the palette card and every style label. The base is now neutral charcoal (#0E0F11 / #16181B) with off-white reading type; lime and crimson are accents only, for the primary action, the cut figure, the shortest route and critical state. Type sizes and spacing were raised across the shell, figures, atlas, table and evidence. Table severity became a dot plus word, route step techniques moved to hover titles, and duplicate metadata was removed. The dashboard URL is unchanged: `/dashboard.html`.

---

## Revision 8 - Y2K / Acid Graphics mascot

A clean departure at `/design-lab/v7/`: pure black, white linework and electric ultramarine. The title APSIS repeats three times - solid white, white outline, blue outline - over a liquid chrome band, with a circular badge, stacked wireframe globes, chevrons, an atom/flower stamp, thin frames, a swoosh and a vertical barcode.

The 3D mascot is built from two inputs. The **path** is a Catmull-Rom orbit with seven nodes; the **atlas** is a wireframe globe shell, a 420-point dust field and a polar grid around a liquid-cobalt shader core. It orbits, drags, zooms, resets and has a 2D SVG fallback. A separate dotted waveform mesh sits in the lower left.

This direction drops the emerald/crimson editorial system and the Neon Luxe dashboard palette. It is a poster/mascot study first; the product surface can be derived from it after the direction is chosen.

---

## Revision 9 - Fleet dashboard

The Y2K direction is now the dashboard. `/dashboard.html` renders a new entry at `console/src/y2k/`; the Neon Luxe dashboard implementation has been retired.

The shell is black with a blue grid, white linework and electric ultramarine. The header repeats APSIS in solid white and a blue outline. The hero carries the real WebGL mascot - a 7-node orbit (path) around a wireframe globe, dust field and liquid-cobalt core (atlas) - with drag, zoom, reset and a 2D fallback. A second WebGL point mesh forms the atlas field strip.

The data moves onto white paper panels: a six-cell KPI strip (16 / 194 / 144 / 37 / 07 / 0), the real Games Studio route atlas, the 16-account fleet table, posture and evidence. Black headers, white bodies, blue state accents. The fleet table is sortable and searchable, totals are sticky, and the snapshot exports as JSON. The layout collapses to 390px with a drawer rail and a four-column mobile table.

This build keeps the Y2K vector language but treats it as a control surface, not a poster: fewer stamps, larger type, paper panels for the dense data.

---

## Revision 10 - multi-view Fleet dashboard

The dashboard is now a seven-view control surface at `/dashboard.html`, built in its own Vite entry from `console/src/y2k/`. The single-page Y2K dashboard and the Neon Luxe implementation are retired.

Views and instruments:

- Overview - orb (sphere + seven-node orbit). Fleet figures, module map, pulse chart, evidence.
- Survey - radar dish. Severity, exposure ranking, coverage summary, searchable fleet ledger.
- Path map - rising ascent. Account/source/route selection, autoplay loop, play/pause, step, speed, cut/restore, hop detail and a clickable route ledger.
- Atlas - flattened constellation. Raycast account selection, identity graph, filters, inspector.
- Commands - prism. 114 recorded runs, verb/scenario/format filters, typewriter output, replay, copy.
- Extensions - bloom. Techniques, 18 x 16 coverage matrix, contracts, alert sample, observed-path case.
- Blueprint - stack. Pipeline selection, architecture, module map, roadmap, release checklist and open items.

The shell uses dark glass, electric ultramarine, an animated particle/grid/aurora field, a `Cmd/Ctrl+K` palette across views/accounts/commands/techniques, a motion toggle, hash deep links, toasts and responsive drawers. Every figure has drag, zoom, reset and a 2D SVG fallback; motion is paused offscreen and on reduced-motion.

Verification: `npm --prefix console run build` passes; `npm --prefix console run test:logic` passes 9 tests; `python -m unittest discover -s tests -v` passes 67 tests. The local accessibility audit at 1440 and 390 reports no contrast, heading, unnamed-control, small-target or overflow failures. Documentation is in `docs/DASHBOARD.md`.

Open before publish: approval, git remote configuration and the Pages workflow. The legacy console remains at `/`; the new dashboard is `/dashboard.html`.

---

## Revision 11 - instrument polish and corner variants

The internal working title is gone from every surface. The dashboard now speaks only product language: fleet, control surface, instruments, accounts, routes.

Instrument pass:

- Every figure renders through `EffectComposer` + `UnrealBloomPass` + `OutputPass`. Canvas is screen-blended over the glass stage so only lit linework adds light.
- Orb: shader core, Fresnel atmosphere, equator, seven orbit nodes with halos, a travelling comet and trail.
- Dish: lathed bowl and skin, stand, base, bright rim, feed glow, sweep wedge and 28 pulsing contacts.
- Ascent: eight nodes on a raised arc, cylinder hop segments, platform rings, a travelling pulse, click-to-jump and a clear target node.
- Constellation: sixteen larger nodes, curved tube arcs, per-node halos, rotating focus ring, click-to-switch account.
- Prism: glass monolith, beam, three counter-rotating rings, scan plane and motes.
- Bloom: six rings with eighteen pickable nodes, halos and a wire nucleus; click-to-select primitive.
- Stack: five wire layers with edge outlines, breathing separation, rising beam and connectors.

Shell pass:

- `Auto` / `Paused` badge in every figure header; footer names the running animation; the 3D hint names click, drag, scroll and reset.
- Panel hover glow, brighter nav states, animated scanline and grain textures over the field, stronger but calmer bloom.
- Rounded-corner variant: topbar `Corners` toggle, `?corners=round` / `?corners=sharp`, persisted in `localStorage`. Sharp remains the default. (Superseded in Revision 12 by the fixed soft-geometry scale.)

Verification: build passes; 9/9 logic tests; 67/67 Python tests; no horizontal overflow on all seven views at 390, 768 and 1440; accessibility audit reports no contrast, heading, control-name, target-size or overflow failures.

---

## Revision 12 - path and atlas second pass

Path map:

- The ascent was rebuilt as an eight-gate ladder on a wider diagonal: hex platforms, cylinder hop segments, a rotating gate at each hop, an oversized target beacon, expanding shock rings on the live hop, six orbiting sparks, a travelling pulse with trail, and a cut fracture. Wireframe nodes replace the solid diamonds.
- Ruler ticks now frame both sides of the stage, and the camera was pulled back so the full climb fits without clipping.
- Each hop carries an oversized invisible hit sphere; clicking the 3D node jumps the rail.

Atlas:

- The constellation gained a wire nucleus, base stems, node rings, a tilted orbital ring with two travelling pulses, a soft nebula field and a brighter focus beam. Nodes and arcs are larger.
- The identity graph was rebuilt: uniform-fit positions preserve the authored topology, edges are curved and carry direction arrows, the selected node animates a dashed trust flow, nodes are shaped by kind, short labels are always visible with full names in the inspector, and the legend shows counts.

Global:

- Corners are softened to a fixed 7px / 5px / 3px scale. The corner toggle and URL parameter are gone.
- Path map and Atlas bloom strength is tuned separately so the additive white linework stays readable.

---

## Revision 13 - readable type, fullscreen, constellation ascent

- Type scale raised across the console: 15.5px body, 14-15px data and notes, 12-13.5px labels, 10-12px micro-labels. The display and headings keep their own scale.
- Every figure now has a fullscreen control. The panel expands over the console, keeps its header, controls and footer, locks page scroll, and closes on Escape or the collapse control. The view transition is now opacity-only so fixed positioning is never trapped by a transformed ancestor.
- Path map: the ascent is a constellation-threaded S-curve in depth, with gate rings, hex platforms, context stars linked to the hops, a target beacon, expanding shock rings and a travelling pulse. Hop labels use three lines so they stay readable.
- Alert instance: `cases/01-observed-path/alert.json` validates against `schema/alert.schema.json`; the evidence manifest validates against its schema.
- Handoff: the alert, evidence, case, guardrail, before/after snapshots and schemas are delivered to Penumbra under `detection-lab/integrations/apsis/`.
- Cleanup: removed the stale bioluminescent verify script and unused screenshots; updated README, CONTRIBUTING, INTEGRATIONS, roadmap and release state; added `docs/RELEASE.md`; prepared the `origin` remote without pushing.

---

## Revision 14 - final portfolio pass

- Type: 16.5px body, 15-16.5px data, 13-15px labels, 100-174px display. The display title gains a soft orbital glow band and slightly open tracking.
- Shape: 5px panels, 4px controls, 2px tags. One deliberate variation: the accent KPI sweeps to 16px at the top-right, the primary button to 12px. The screen frame and tables stay square.
- Surface: desktop topbar is a floating glass pill; the hero carries a cyan/cobalt aura over the existing grain and scanline texture; the palette adds electric cyan, cobalt and periwinkle beside ultramarine.
- 2D: every fallback is now a wrapped board with a title, note, grid and the same geometry as its 3D instrument. Fullscreen fits the whole board with `xMidYMid meet`.
- Brand: a new A-orbit favicon, 512px icon, Apple touch icon, manifest and a 1200x630 OG card. Both HTML entries carry the new metadata.
- Product: Extensions lists the validated alert and the delivered Penumbra handoff; the case shows both paths. Blueprint is complete and ready for upload. Contract tests cover alert/evidence consistency.
- Verification: build pass, 9/9 logic, 73/73 Python, contracts valid, no overflow at 390/768/1440, a11y audit clean, fullscreen 2D/3D and node picking checked.
