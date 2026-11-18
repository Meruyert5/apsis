# Apsis - design system

Apsis is one control surface over an AWS identity graph. The account is an
orrery; the dashboard is the instrument that reads it. Every route reaches its
apsis.

This is the current system. The shipped implementation and interaction
inventory are in [`DASHBOARD.md`](DASHBOARD.md); the revision trail is in
[`design-agency.md`](design-agency.md).

## Concept

One account is one field. The administrator is the primary star, identities are
bodies at their hop depth, and an escalation is a route through them. Eight views
each carry a different instrument:

| View | Instrument | Question |
| --- | --- | --- |
| Overview | Orb | Fleet posture and the signature orbit |
| Survey | Dish | Exposure, severity and account ranking |
| Path map | Ascent | One route, hop by hop, then the cut |
| Atlas | Constellation | Accounts, identities and trust |
| Drift | Split | Before and after, route aware |
| Commands | Prism | Recorded CLI runs |
| Extensions | Bloom | Primitives, coverage, contracts, case |
| Blueprint | Stack | Architecture, roadmap and release |

## Colour

| Token | Value | Use |
| --- | --- | --- |
| Void | `#05070d` | Page and instrument background |
| Ultramarine | `#2b3cff` | Primary ink, routes, active state |
| Bright blue | `#4e5fff` | Focus and active borders |
| Violet | `#7a6cff` | Secondary data and severity |
| Electric cyan | `#1ab2ff` | Added edges, live pulse, accents |
| Periwinkle | `#8db7ff` | HUD labels and secondary text |
| Ice | `#d6ecff` | Highlights and display glow |
| Ink | `#eef4ff` | Primary text |
| Muted | `#8493aa` | Body copy |

The palette is deliberately narrow. Ultramarine and white do the work; cyan,
cobalt and periwinkle add atmosphere without turning the console into a
rainbow.

## Type

- **Sora** - display and section headings. Weight 600-800, tight tracking.
- **IBM Plex Sans** - reading copy, labels, controls.
- **IBM Plex Mono** - HUD labels, figures, commands, ledgers.

Scale: 17px body, 15.5-17px data and notes, 13.5-15.5px labels, 11.5-13.5px
micro-labels, a 124-216px display title. Nothing that carries a decision is
smaller than 13px; HUD microcopy is the only exception.

## Surface and geometry

- Sharp 2px panels and controls, 0px tags. No corner variant.
- Deep glass: `rgb(10 16 28 / .6)` over blur, 1px `rgb(150 175 255 / .14)`.
- The desktop topbar floats as a glass pill; the rail stays fixed.
- The hero sits over a cyan/cobalt mesh aura; a grain and scanline layer sits
  over the whole field.
- Animated field: drifting grid, aurora, constellation particles, shooting
  stars and a slow scan sweep. Every layer stops under `prefers-reduced-motion`.

## Mark

The mark is a sharp 2px tile: a HUD frame, a faint coordinate grid, two inclined
orbits, an ice A with a cyan crossbar, and a white planet sitting at the apsis
of the outer orbit. The same silhouette is used for `favicon.svg`, the 512px and
Apple touch PNGs, and the 34px rail mark, so the tab, the home screen and the
console header read as one system.

## Motion

Motion explains state, never decorates a static claim:

- auto-rotating instruments with a visible `Auto` badge and a `Paused` state;
- the Path map advances hops, carries a pulse and fractures on cut;
- Atlas nodes pulse, the focus beam rises, the orbital ring turns;
- Drift scans before and after and lights added edges in cyan;
- fullscreen on every figure, closes on Escape;
- 32fps cap (10fps when motion is off), offscreen pause, `2D` board fallback.

## Content rules

- Every figure has a title, a one-line explanation and a footer naming its
  animation.
- Numbers are the fixture totals, never invented.
- The synthetic nature of the data is stated in the rail, README and footer.
- Read-only is a product promise: the console never writes to an account.

## Accessibility

- Semantic headings, labelled controls, `aria-current`, `aria-pressed`,
  `aria-expanded`, table captions and focus-visible rings.
- Full-screen and 2D fallbacks are keyboard operable.
- Contrast, target size and overflow are gated across all eight views at 1440
  and 390. Lighthouse gates accessibility, best practices and SEO.
