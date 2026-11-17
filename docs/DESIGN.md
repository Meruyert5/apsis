# Apsis — design system

The console is one bioluminescent instrument: a living-account Map, a fleet
specimen, and a proof act in the abyss. The binding spec is
`docs/superpowers/specs/2026-11-17-apsis-bioluminescent-design.md`; this page
records the system a reviewer needs to extend it.

## 1. Concept

One account is one organism. The administrator is the nucleus; identities are
cells on growth rings; escalations are veins. The fleet is the ecosystem: the
Decide core is the specimen of all 16 organisms, and the Prove act is the
environment they live in.

Every glow has a data job. Nothing in the interface is a decorative chart.

## 2. Colour

| Token | Value | Use |
| --- | --- | --- |
| `--abyss` | `#02090c` | page base |
| `--hull` | `#03110f` | work panels |
| `--well` | `#020c0b` | data wells, terminal |
| `--ink` | `#eafff8` | primary text |
| `--read` | `#a9e6d6` | reading text |
| `--cyan` | `#4fe3c1` | compute, live, primary signal |
| `--violet` | `#8b7bff` | identity |
| `--mint` | `#d6fff2` | trust, light |
| `--rose` | `#ff8fa3` | severance, critical |
| `--amber` | `#ffd27a` | nucleus, administrator, one live lure |

Amber is never a surface fill. Coral never marks a healthy state.

## 3. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | Sora 300–800 | headings, figures, wordmark |
| Reading | IBM Plex Sans 400–600 | body, controls |
| Telemetry | IBM Plex Mono 400–500 | data, labels, terminal |

Self-hosted from `console/public/fonts`; only these families ship. Text never
drops below 14px.

## 4. Surfaces and shape

- **Membrane** — translucent teal gradient, 1px cool hairline, soft inner
  highlight, asymmetric radius (22px / 7px). Work panels.
- **Hull** — near-opaque abyss panel with a hairline. Terminal, readout, stage.
- **Well** — `#020c0b` with a teal hairline. Data, code, inputs.
- Controls use an 8px radius; data chips 4px. Not everything is a pill.
- The top bar is solid; the mission rail is fixed at 66px and expands to 226px.

## 5. The four acts

**Signal** — a 2D signature vein to an amber nucleus, the fleet readout, and a
five-stage bus. No WebGL on the first paint.

**Map** — a Three.js organism: nucleus lobes, organic growth rings, identity
cells, curved veins, a fresnel membrane and plankton. The selected route is a
tube with two travelling pulses. Severing turns the cut veins coral and dims the
organism. The workbench adds a principal rail, Route/Node/Cut readout, hop bar
and account selector. Reduced motion renders a static frame.

**Decide** — a Three.js specimen of 16 account rings and 18 technique ribs with
photophores at the intersections. The 2D radial core is the fallback and the
explicit alternate view. The ledger is the exact reading path.

**Prove** — the recorded terminal, the abyss, the zero, the revocation ledger
and the diver. The abyss is full-bleed and unframed.

## 6. Motion

- Pulses travel along the selected vein; the membrane breathes; the specimen
  rotates slowly.
- One visible WebGL scene at a time; each pauses offscreen.
- `prefers-reduced-motion` and the manual motion switch resolve to the 2D core,
  static Map, no countdown and no drift.
- Durations: 120 press, 180 hover, 280 state, 620 scene.

## 7. Accessibility

- The Map canvas and the 3D core are `aria-hidden`; the principal rail, readout
  and ledger carry every value.
- The 2D radial core is keyboard-operable and is the reduced-motion default.
- Tabs, hop bar, palette, selects and sever controls are keyboard reachable.
- Contrast 4.5:1, 14px floor, 24px targets, visible focus, no overflow at 390.
- Amber is never the only carrier of meaning.

## 8. Performance

- Map: ~16 cells, 16 veins, 8 rings, 220 plankton; one rAF, paused offscreen.
- Decide: 288 photophores, 16 rings, 18 ribs; one rAF, disposed on rebuild.
- Prove: the existing horizon shader, one rAF.
- Sky: a single fixed canvas with the fleet graph at 8–14% opacity.
- DPR capped at 1.5. The old theme CSS and unused textures are removed.

## 9. Ownership

The design, wordmark, and screenshots are © 2026 Meruyert Oshayeva. The source
code is MIT; the visual identity is reserved. See `NOTICE.md`.
