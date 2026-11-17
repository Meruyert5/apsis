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

