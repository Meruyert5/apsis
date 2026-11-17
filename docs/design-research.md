# Apsis design research — the darkroom observatory

Date: 17 November 2026
Scope: total restyle of the Apsis console. Reference-first, then tokens, then code.

The previous console was a neon bioluminescent instrument: teal glass, rose and
amber gradients, rounded panels, glows. It read as a sci-fi HUD. This rework
moves the product to a printed, archival register: a series of observatory
plates for a cloud account, with one ink per act and a live instrument inside
each plate.

---

## 1. Sources

### 1.1 NOCTRA — Observatory Website Design (primary)

- Pin: https://www.pinterest.com/pin/20758848278854123/
  (also https://www.pinterest.com/pin/563935184615335445/)
- Creator on Pinterest: Maria Knyazeva
- Source: https://www.behance.net/gallery/248063485/NOCTRA-Observatory-Website-Design-UXUI
- Cover image: https://i.pinimg.com/736x/13/b5/4f/13b54f8e262e8686c3d48cf8676f63e7.jpg
- Caption (public pin page): “An observatory that approaches the night sky as a
  narrative. Noctra presents the cosmos as a space of constructed meaning —
  something that was reimagined across time.”
- Tags on the pin: `#darkaesthetic #spaceaesthetic #astronomyart #webdesign
  #webinspiration #editorialwebdesign #uiuxdesign #darkui #landingpage`
- Public Behance search snippet, quoted because the project page itself returned
  HTTP 403: “Such a poetic concept. The archival illustrations against the dark
  interface really echo the night sky, and the pixel serif with monospace pairing
  adds just the right tension.”

Observed: a warm-black page, one enormous high-contrast serif headline in white
(“CONSTELLATIONS AND ABSENCE”), mono metadata in the corners, a faint ghosted
figure behind the type, archival duotone imagery, a dotted star band, and small
cream buttons. Enormous empty margins. Thin rules, no cards with shadows. The
page is a sequence of sections with plate-like headings (`STRUCTURE`,
`DOME EXPERIENCE`, `OTHER PROGRAMS`) and numbered entries (`01 PATTERN AND
IMPOSITION`, `02 ABSENCE AND DISRUPTION`).

Lesson for Apsis: the account is the night sky. The page should feel like an
observatory publication, not a dashboard. Let type and emptiness carry the
authority; the 3D scene is an archival instrument, not a toy.

### 1.2 Swiss Design 037 — Zeka Design

- Pin: https://es.pinterest.com/pin/758082549815312189/
- Caption (public pin page): “Looking for fresh Swiss graphic design
  inspiration? This stunning poster features grid-system layout, minimalist
  style approach and a bold typography and predominant purple color to create
  contrast with black and white image, blending creativity with eye-catching
  visuals. This poster was made with Photoshop and illustr…”
- Cover image: https://i.pinimg.com/736x/9b/03/44/9b03448c0d946ad1f235826a1bed1131.jpg

Observed: a warm paper-grey field, a visible pink grid, a huge condensed display
wordmark in violet, one halftone black-and-white image, small body text, vertical
micro-labels in the margin, three tiny colour swatches, and a coloured square
clipping the image. The grid is not hidden; it is part of the composition.

Lesson for Apsis: keep one visible grid in the hero only, use a single ink for
the act, and let a halftone specimen or 3D plate clip into the grid. Put act
numbers and plate labels in the margin, not in floating pills.

### 1.3 Flowers of the Sky — comet plate

- Pin: https://www.pinterest.com/pin/344877283940752528/
- Caption (public pin page): “Vintage comet images, thanks to the Flowers of the
  Sky collection on the Public Domain Review website.
  http://publicdomainreview.org/collections/flowers-of-the-sky/”
- Cover image: https://i.pinimg.com/736x/01/f3/3a/01f33a7c90df6ca1e2cb811a12c907df.jpg

Observed: warm cream ink on black, a comet rendered in fine parallel hatching,
a small city silhouette at the bottom, and a printed caption
`Fig. 4.—Comet of 1811.` The engraving is low-contrast and precise; the caption
is part of the artwork.

Lesson for Apsis: use real figure captions (`Fig. 01 — Signature transfer`) under
every instrument, and use fine rules and hatching rather than glow to describe
volume. The act accent should behave like ink on paper.

### 1.4 Deep Sea Bioluminescence — specimen plate

- Pin: https://www.pinterest.com/pin/264445809364399195/
- Caption (public pin page): “Deep Sea Bioluminescence Glowing Creatures Fine Art
  Print Poster Ocean Love Gift - Etsy | Deep sea glowing creatures, Aquatic
  organisms, Bio luminescent”
- Cover image: https://i.pinimg.com/736x/c0/46/ce/c046ce8986adb5fa6d341b20c6376d.jpg

Observed: black field, a single electric blue used for every specimen, thirteen
numbered organisms, a centred legend naming each number, and generous black
space. There is no second accent and no gradient; the blue is the subject.

Lesson for Apsis: the Decide act can stay bioluminescent, but it needs one ink
and a numbered legend, not a rainbow. Number every specimen/technique in the
margin and put the key at the foot of the plate.

### 1.5 Adjacent surfaces searched

Searches included: Swiss typography and grid posters; vintage astronomy and
scientific illustration; deep-sea and bioluminescence posters; 1950s analog
meters; dark editorial websites; mission-control panels; 2026 gradient palettes.
The useful adjacent evidence was the Swiss grid board, the vintage astronomy
board, and the dark-editorial results. The generic “mission control” and
“gradient dashboard” results were rejected because they reproduce the exact
sci-fi HUD language this rework is leaving behind.

### 1.6 Access notes

- Pinterest board interiors and some pin pages require login. Public pin pages
  were used for captions and cover images. No Pinterest internal board page is
  claimed as read.
- The Behance project page returned HTTP 403. Its caption was taken from the
  public Pinterest pin and a public search snippet; it is labelled as such.
- No video pins were part of this reference set. Motion decisions below are
  marked as original decisions, informed by the static compositions and the
  project's interaction needs.
- Reference images were downloaded for review into a local temp folder and are
  not committed, to avoid republishing third-party artwork.

---

## 2. Evidence table

| Domain | NOCTRA | Swiss 037 | Comet plate | Deep-sea plate | Decision for Apsis |
| --- | --- | --- | --- | --- | --- |
| Attention | One giant serif headline over a ghosted figure | One giant condensed wordmark over a halftone image | One engraved comet in a black field | One electric-blue specimen field | The act title is the loudest object; the instrument is second. No neon. |
| Structure | Editorial sections with plate headings and numbered entries | Poster with margin labels and a grid | Single figure + caption | 13 numbered specimens + legend | Each act is a numbered plate with a title, deck, instrument and figure caption. |
| Grid | Asymmetric, huge margins | Visible pink grid, 4-column feel | Centred plate, wide black margins | 3-column specimen field | 12-column page, visible grid only in the hero; rules replace cards. |
| Typography | High-contrast serif display + mono labels | Condensed display + small body | Engraved caption | Numbered legend | Instrument Serif display, Sora body, IBM Plex Mono labels. Three roles, no fourth. |
| Colour | Warm black, bone, one cream button | Paper grey, violet ink, pink grid | Cream on black | Black + one electric blue | Warm-black paper, bone ink, one act ink: gold, ultramarine, verdigris, rust. |
| Texture | Grain, ghosted figure, duotone archive | Paper grain, halftone, riso-like offset | Fine hatching | Fine stipple | Fine grain over the page; one halftone/dot overlay per instrument; hatching in figures. |
| Surface | Matte, flat, no glass | Matte paper | Matte print | Matte print | No glass, no blur cards, no drop-shadow stacks. 0–2px radii. |
| Motion | Slow editorial reveal | Static poster | Static plate | Static plate | One staged entrance per plate, 60ms stagger; slow ambient orbit; no pulsing everywhere. |
| Interface | Small cream buttons, mono nav | Margin labels | Caption | Legend | Squared cream buttons, hairline controls, mono state labels, underlined tabs. |
| Icons | Minimal | None | None | None | One stroke family; the Apsis mark is the only ornament. |
| Accents | Cream button, dotted star band | Colour swatches, grid lines | Figure number | Specimen numbers | Plate numbers, figure captions, margin ticks, one ink per act. |
| Copy | Poetic, short, editorial | Explanatory, quiet | Scientific caption | Taxonomic legend | Keep the plain, exact Apsis voice; shorten labels; no marketing adjectives. |

---

## 3. Direction

**A darkroom observatory: a bound series of archival plates for a living AWS
account.**

The console becomes a printed survey. Each act is a plate with a number, a
serif title, a short deck, a framed live instrument and a figure caption. The
account is drawn as an engraved orrery; the people are engraved field figures;
the evidence is a contact sheet. One ink per act, one cream action per screen.

### Three moves that prove it

1. **Paper, not glass.** Warm-black paper (`#090909`), bone ink (`#ece6d8`),
   hairline rules, 0px radii, a fine grain. The only filled surface is a cream
   primary button. No gradients on buttons, panels or titles.
2. **A publication, not a dashboard.** Instrument Serif for display, IBM Plex
   Mono for plate numbers, dates, data and captions, Sora for reading. Every
   act opens with `PLATE 01 / SIGNAL`, a deck and a right-hand meta column, and
   closes with a `Fig. 0N — …` caption.
3. **One ink per act, one instrument per plate.** Signal gold, Map ultramarine,
   Decide verdigris, Prove rust. The 3D scene sits inside a ruled aperture with
   corner ticks and a dotted halftone; labels live on the perimeter, never
   floating over the scene.

### What we will not do

- No purple/teal SaaS gradients, neon glows, glassmorphism cards, pill buttons,
  or 32px rounded panels.
- No five-accent rainbow. One act ink at a time, plus gold as the shared apsis.
- No HUD chrome: no scanline-everything, no fake coordinates, no chrome.
- No floating labels over the 3D scene.
- No copying NOCTRA's monochrome-only rule; the act inks are a deliberate
  extension for wayfinding.
- No motion carnival. Ambient motion is weather; the instruments are the only
  things that play.

### Named palette

| Token | Hex | Job |
| --- | --- | --- |
| paper | `#090909` | page field |
| plate | `#121211` | instrument / panel field |
| well | `#070707` | terminal and input wells |
| ink | `#ece6d8` | display, primary text |
| text | `#c9c2b3` | body |
| mute | `#9a9487` | secondary labels |
| faint | `#7b766b` | tertiary captions |
| rule | `rgba(236,230,216,.14)` | hairlines |
| gold | `#d8b25e` | Signal ink; shared apsis accent |
| ultramarine | `#8ea2ff` | Map ink |
| verdigris | `#7fc9d8` | Decide ink |
| rust | `#d08a6c` | Prove ink |

All text pairs were checked at 1440 and 390 against the existing audit floor.

### Type roles

- **Instrument Serif** — display, act titles, the italic word, the closure zero.
- **IBM Plex Mono** — plate numbers, nav, data, captions, tags, terminal, buttons.
- **Sora** — decks, body, notes, FAQ.
- No fourth family. Display never sets paragraphs.

### Motion principles

- One staged entrance per plate: 12px rise + fade, 60ms stagger, total < 1.2s.
- Ambient orbit / drift is slower than the entrance.
- Hover 160ms; press 100ms; state 280ms; scene 620ms.
- Instruments keep their live behaviour (Signal phase, Map walk, Prove waveform)
  but lose the pulsing neon. A single 1px playhead marks the state.
- `prefers-reduced-motion` keeps the final frame; live timers stop.

---

## 4. Decision log

| Observed | Decision | Trade-off |
| --- | --- | --- |
| NOCTRA: serif display + mono labels over warm black | Instrument Serif + IBM Plex Mono, warm-black paper | Less “product UI” familiarity; more authored, more memorable. |
| NOCTRA: archival images, huge margins | Ruled apertures, figure captions, generous section padding | More vertical length; each act breathes. |
| Swiss 037: visible grid | Grid only in the Signal cover; hairline rules elsewhere | Keeps the structure legible without turning every section into a poster. |
| Comet plate: engraved caption | `Fig. 0N` captions on every instrument | Captions must be real, so they are generated from the fixture names. |
| Deep-sea plate: one ink + numbered legend | One act ink, numbered principals/species/techniques | Less colour variety per screen; stronger wayfinding across acts. |
| Neon gradients in the old build | Remove gradient buttons, glow shadows and glass | The page is quieter; the live instruments carry the energy. |
| Motion in the old build | Slow, staged, instrument-only | Less constant stimulation; better focus and accessibility. |

---

## 5. QA checklist

- [x] Public pin pages opened for all four references; captions read.
- [x] Cover images downloaded and reviewed at full size.
- [x] Adjacent terms searched (Swiss, vintage astronomy, deep sea, analog meter,
      dark editorial, mission control, gradients).
- [x] Behance 403 and Pinterest login walls recorded, not hidden.
- [x] One direction chosen; three moves; explicit do-not list.
- [x] Palette hexes named; text pairs tested by the audit.
- [x] Type roles strict: serif display, sans body, mono data.
- [ ] Video pins reviewed — none in this set; motion is an original decision.
- [x] 390 / 768 / 1440 layouts tested.
- [x] Focus visible; targets at least 44px.
- [x] `prefers-reduced-motion` keeps the final state.
- [x] One poster move per act, not five.

---

## 6. Revision 2 — the cyber console (final)

After the first editorial pass was reviewed, the direction moved to a futuristic
operations console. The evidence is unchanged; the material and register changed.
This section supersedes §3.

**Direction: four cyber decks of one orbital operations console.**

Three moves that prove it:

1. **Glass and signal, not paper.** Deep navy field, 1px gradient borders,
   scanlines, neon inks, and glow only where a state is live. The page is still
   one instrument; it is now a console rather than a bound journal.
2. **A console, not a magazine.** Sora 600 carries the display; IBM Plex Mono
   carries deck numbers, HUD labels, data, terminal output and figure captions.
   The label is `Deck 01` rather than `Plate 01`.
3. **One architecture per deck.** Signal is a holographic uplink (cyan/amber,
   beveled glass, scanline); Map is a magnetic array (blue/violet, square,
   blueprint grid); Decide is a containment bay (emerald/magenta, organic
   rounded, radial); Prove is a flight recorder (rust/amber, terminal, scanline).

Kept from the evidence: visible grids, one ink family per act, numbered
specimens, real figure captions, squared controls, generous negative space, and
no five-accent rainbow.

Changed from the first pass: warm paper → deep navy glass; Instrument Serif →
Sora 600; printed captions → HUD captions; static plates → live scanlines,
pulses and glows; grayscale crew → act-tinted crew.

Still refused: five-accent rainbow, glass on every micro-card, floating labels
over the 3D scene, and motion that hides content.

The evidence trail in §1–§2 is retained because it still governs the structure:
grid, hierarchy, one ink per act, numbered specimens, and the archival figure
caption. The two-pass decision log is the point: the research was not discarded
when the surface changed.
