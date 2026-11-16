# Apsis — design system

Apsis is both the console and the engine that produces its data. This document
records the visual and interaction system so the interface can be reviewed,
extended, or replaced without guessing at intent.

## 1. Concept

The console is framed as a **field instrument for an orbital survey**, not a
marketing dashboard. The account is a small solar system: the administrator is
the sun, principals are bodies on hop orbits, and the atlas is a coverage chart
where each body's class encodes a grant count. The metaphor is explanatory, not
literal; the graph, routes, and counts are the engine's data.

Three rules keep the metaphor honest:

1. Every instrument has a data job. No decorative chart without an encoding.
2. The engine's evidence (actions, ARNs, MITRE technique) stays one click away.
3. The interface never implies complete AWS coverage. The technique set and the
   fixture fleet are stated in the UI and in the README.

## 2. Colour

The palette is a near-black deep-space chassis with two cold accents — electric
blue and violet — a restrained rose edge, and a very small gold live signal.

| Token | Value | Use |
| --- | --- | --- |
| `--chassis` | `#03050e` | page base |
| `--chassis-2` | `#070b18` | rails, raised chrome |
| `--well` | `#060b18` | recessed panels |
| `--chalk` | `#eef3ff` | primary text |
| `--chalk-2` | `#b7c5e6` | reading text |
| `--mute` | `#8b9bc4` | labels, metadata |
| `--accent` | `#5b8cff` | primary signal, active route |
| `--cobalt` | `#7aa2ff` | compute, secondary signal |
| `--violet` | `#8b5cf6` | identity, escalation |
| `--violet-lit` | `#c9b8ff` | trust, soft highlights |
| `--oxide` | `#ff7696` | severance, critical states |
| `--gold` | `#e6b86a` | live/REC flecks, final zero |

Data inks are deliberately separate from UI signal: identity `#8b5cf6`, compute
`#7aa2ff`, trust `#c9b8ff`, severity `#ff7696`. Gold is never a surface fill.

Surfaces are one glass recipe: a 155° blue-tinted gradient, a 1px cool hairline,
`blur(22px) saturate(145%)`, and an inset top highlight. The sky behind them is a
fixed layer of blue, violet, and a faint rose horizon, so every panel refracts the
same field.

## 3. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | **Sora** 300–800 | headings, figures, wordmark |
| Reading | **IBM Plex Sans** 400–600 | body copy, control labels |
| Telemetry | **IBM Plex Mono** 400–500 | data, labels, terminal |

All fonts are self-hosted from `console/public/fonts` with their OFL licences.
Text never drops below 14px. Headings use tight tracking and large, quiet sizes;
labels use normal case rather than all-caps so the interface reads as a tool, not
a poster.

## 4. Form and layout

- **The field**: a fixed layer behind the whole page with a drifting blue-violet
  mesh, two starfields, a 176vw arc, a smaller rotated arc, two CSS orbs, a
  horizon glow, and faint axis lines. It is decorative, `aria-hidden`, and never
  scrolls.
- **Top rail**: a floating glass command bar. It carries the wordmark, the section
  index, the live status waveform, the motion preference, and the section counter.
  It is not a sidebar; on mobile it becomes a compact bar.
- **Plates**: sections sit directly on the field. Panels use a 22–24px radius and
  a glass edge; tables keep their square grid inside a dark glass frame. Tools are
  soft, data is ruled.
- **Detail wells**: the survey dossier and atlas inspector are glass plates with a
  violet/blue corner bracket and a top index rail.
- **The recorded log** is the one true console screen: a grid, a dark REC bar, and
  gold only on the recording mark. It is evidence, not decoration.
- **The black hole** is an instrument plate; the final zero is gold.

## 5. Data encodings

### Survey

- Sun = administrator.
- Orbit radius = hop count.
- Body class = identity kind (user, role, group, resource).
- Route spine = the shortest path to the administrator.
- Sever = the minimum edge cut, with the affected actions and evidence in the
  dossier.

### Atlas

- Rows = the 18 modelled escalation primitives.
- Columns = the 16 fixture accounts, with a short label in the header.
- Body class = observed grant count: void, moon, planet, ringed, giant, star,
  cluster, galaxy.
- Tone = category: identity, compute, trust.
- Exact counts are in the accessible name, the title, and the inspector. The
  matrix itself is intentionally number-free.
- The matrix runs full width and the selected technique opens as a detail plate
  underneath, because the fleet no longer fits beside it.

## 6. Motion

- One live 3D scene per plate: Earth, survey, event horizon. Each pauses when it
  leaves the viewport and renders a static frame when motion is off.
- The sky is the only page-level animation: the mesh drifts on a 32s alternate,
  and two orbs float slowly. Both stop for reduced motion and for the in-app
  switch.
- No cursor-following Earth, no custom cursor, no permanent scroll-linked
  animation.
- The top-bar waveform, gauge ring, and hover sheen are the small moving details.
- `prefers-reduced-motion` and the in-app motion switch both resolve to stable
  final states; the audit asserts this.

## 7. Performance

- Textures are 1K for the small planets and 2K only for the hero Earth.
- Pixel ratio is capped at 1.5 on high-DPI screens.
- The survey uses standard materials and sprite glows; its full-resolution bloom
  pass was removed.
- Survey labels update at 10fps rather than every frame.
- The sky is two composited layers with `will-change: transform`; glass blur is
  dropped at 900px, where the panels are full width and the cost is not worth it.
- Sections below the fold are ordinary DOM; the Commands chunk is eager so the
  page height does not jump.

## 8. Accessibility

The console targets WCAG 2.2 A/AA floors:

- text contrast at least 4.5:1;
- no text below 14px;
- targets at least 24px (most controls are 36–44px);
- keyboard reachable controls with visible focus;
- no horizontal overflow at 1440 or 390;
- accessible names on every instrument control;
- reduced-motion parity.

`console/scripts/audit.mjs` measures contrast, heading order, names and target
size. `console/scripts/verify.mjs` exercises the flows and responsive layouts.

## 9. Ownership

The design, wordmark, and screenshots are © 2026 Meruyert Oshayeva. The source
code is MIT; see the repository notice for the split between functional code and
visual identity.
