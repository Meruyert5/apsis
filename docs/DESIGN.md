# Apsis — design system

Apsis is four cyber decks of one orbital operations console. The account is a
living orrery; the console is the instrument that reads it. The title is the
design: every route reaches its apsis.

The reference trail is in `docs/design-research.md`. The first pass was a
darkroom observatory plate series; the final pass keeps the research structure
(visible grid, one ink per act, numbered specimens, real figure captions) and
moves the surface to a futuristic console: deep navy glass, gradient borders,
scanlines and neon HUD labels. This page records the final system.

## 1. Concept

One account is one orrery. The administrator is the primary star; identities are
bodies on hop shells; escalations are flux tubes. The console exposes the route
to an administrator and the minimum cut that closes it.

Four decks, one instrument:

| Deck | Console archetype | Ink family | Surface |
| --- | --- | --- | --- |
| Signal | Holographic uplink | cyan + amber | beveled glass, scanline, full-bleed field |
| Map | Magnetic array | blue + violet + mint | square tactical grid, crosshair stage |
| Decide | Containment bay | emerald + magenta + cyan | organic rounded glass, radial specimen |
| Prove | Flight recorder | rust + amber + rose | terminal, tape deck, forensic scanline |

Every glow has a data job. Nothing is a decorative chart.

## 2. Colour

Base tokens live in `console/src/styles/cyber.css`.

| Token | Value | Job |
| --- | --- | --- |
| `--paper` | `#04070d` | page field |
| `--plate` | `#07111f` | panel field |
| `--well` | `#030811` | data wells and terminal |
| `--ink` | `#eaf7ff` | display, primary text |
| `--text` | `#b9d2e4` | body |
| `--mute` | `#86a8c0` | secondary labels |
| `--faint` | `#6f93ad` | tertiary labels |
| `--line` | `rgba(120,210,255,.20)` | hairlines and panel borders |
| `--gold` | `#ffc46b` | shared apsis accent, Signal amber |
| `--ultramarine` | `#6f9bff` | Map ink |
| `--verdigris` | `#4fffc4` | Decide ink |
| `--rust` | `#ff8a6b` | Prove ink |

Act families:

- Signal `#4fe3ff → #7aa2ff → #ffc46b`
- Map `#4f7cff → #8b6cff → #4fe3c1`
- Decide `#3ff0b0 → #4fe3ff → #ff6fa5`
- Prove `#ff6f91 → #ff8a6b → #ffc46b`

The gradient is a subject on the deck accent and primary action; it is not a
wallpaper. One act ink leads. The base field stays navy.

## 3. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | Sora 600 | deck titles, closure zero, the accent phrase |
| Reading | Sora 400 | decks, body, notes, FAQ |
| HUD / data | IBM Plex Mono 400–500 | deck numbers, nav, labels, terminal, tags, buttons, captions |

Self-hosted from `console/public/fonts`; Instrument Serif is no longer shipped.
The 14px floor is absolute. Display never sets paragraphs. Data uses tabular
numbers where it aligns in columns.

Display line-height is 0.94–1.0; body 1.6–1.68; HUD labels one line. The accent
phrase is a gradient fill, not italic. The uppercase treatment belongs to the
wordmark and HUD labels, not paragraphs.

## 4. Surfaces and shape

- **Glass** — deep navy gradient, 1px gradient border, inner top highlight,
  8–12px blur on the hero and one readout per deck.
- **Tactical** — Map is square: 0px radius, blueprint grid, 1px rules.
- **Organic** — Decide is rounded: 30px / 10px asymmetric radii, dot matrix,
  soft green glass.
- **Recorder** — Prove is flat and warm: 2px / 18px, scanlines, rusty well.

Corners, borders and shadows are not interchangeable between decks. The deck
radius is a token (`--panel-radius`) and is overridden per act.

Controls are 44px minimum, squared or 4–6px radius. The primary action is a
gradient fill with dark text; the secondary is a transparent glass outline that
glows on hover. No pill buttons.

## 5. The four decks

**Signal — holographic uplink.** A full-bleed 3D signature transfer, a live light
curve and scrubber, a phase readout, the observer figure and the five-stage bus.
The copy is a glass command slab with a cyan/amber edge. The deck border is a
gradient. Scanlines sit over the field at low opacity. The phase advances until
held; scrubbing stops it. Reduced motion holds the final frame.

**Map — magnetic array.** A Three.js orrery on a square blueprint stage:
primary star, hop shells, identity bodies, flux tubes and a faint membrane. The
workbench adds a principal rail, Route/Node/Cut readout, field meter, compass,
field toggle, account selector and hop rail. The selected route is a tube with
two travelling pulses; the cut turns tubes rust. The hop rail flows a gradient
while playing and restarts from the first hop at the end. Reduced motion renders
a static frame.

**Decide — containment bay.** A Three.js specimen of 16 account rings and 18
technique ribs with photophores at the intersections, sonar rings, a species
legend and an organic ledger. Identity is magenta, compute emerald, trust cyan.
The 2D radial core is the explicit alternate view and the reduced-motion
fallback. The ledger is the exact reading path with the fix and the guardrail.

**Prove — flight recorder.** The recorded terminal, a seekable waveform of the
recorded output, the 3D field collapse, the zero, the revocation and guardrail
ledgers, the Penumbra handoff and the EVA diver. The terminal is a warm black
box with scanlines and a rose/amber border. The waveform cursor highlights the
line it is playing. The closure zero is a gradient numeral, not a glow blob.

## 6. People

Three crew figures, drawn in the console palette and marked `aria-hidden`
because the data lives in the surrounding text:

- **Observer / AP-01** in Signal: seated at a curved telemetry console with a
  headset and a light-curve screen.
- **Field biologist / Specimen 03** in Decide: coat, headlamp, satchel and a
  glowing specimen jar.
- **DIVE-01** in Prove: a full suit with visor, chest console, tanks, hoses,
  wrist slate, fins, lamp and tether, paired with a ROLE / DEPTH / TETHER /
  STATUS card.

They keep their ink, gain an act-coloured drop shadow, float slowly, and stop
under reduced motion. They are the human scale of the instrument.

## 7. Motion

- One staged entrance per deck: 16px rise + fade + 4px blur, 0.78s, under 1.2s.
- Ambient orbit, drift and sonar are slower than the entrance.
- Hover 160ms; press 100ms; state 280ms; scene 620ms.
- HUD LEDs blink at 1.4–2s; scanlines run at low opacity.
- Live instruments: Signal phase, Map walk and hop sheen, Prove waveform and
  active line. These are the only things that play.
- `prefers-reduced-motion` keeps the final frame and stops the LEDs, sonar,
  reels, waveform scan and entrance.

## 8. Accessibility

- 14px minimum text; 44px minimum controls; visible focus ring on every control.
- Every text pair is checked; muted labels stay above the contrast floor.
- Colour never carries meaning alone: every ink is paired with a label, a
  numbered specimen or a state word.
- The 3D scenes are decorative and `aria-hidden`; the same data is in the
  readout, ledger, terminal and captions.
- Reduced motion is honoured in CSS and in the Three.js scenes. The Map renders
  a static frame; Decide defaults to the 2D core.
- The audit is run at 1440 and 390: no contrast failures, heading skips, small
  targets or sub-14px text.

## 9. Performance

- One visible WebGL scene at a time; each pauses offscreen.
- Self-hosted fonts, no network font request; the serif was removed.
- CSS gradients and transforms; no canvas-based decoration beyond the existing
  field and scenes.
- The `prefers-reduced-motion` path keeps the final state and stops the loops.

## 10. Ownership

Apsis owns cloud identity and the route. Penumbra owns detection and incident
response; the third project owns network evidence. The shared contract is
`schema/alert.schema.json` and `schema/evidence.schema.json`; the handoff is the
`path.opened` card in Prove.

The research, evidence table and the two-pass direction log are in
`docs/design-research.md`. The binding product spec remains under
`docs/superpowers/specs/`.
