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
each carry two instruments: a glossy planet scene and a wireframe schematic.

| View | Planet scene | Wireframe | Question |
| --- | --- | --- | --- |
| Overview | Graphite planet + seven bodies | Orb | Fleet posture and the signature orbit |
| Survey | Ringed planet + 16 contacts | Dish | Exposure, severity and account ranking |
| Path map | Solar system + black-hole cut | Ascent | One route, hop by hop, then the cut |
| Atlas | Ivory star + 16 account bodies | Constellation | Accounts, identities and trust |
| Drift | Two planets + edge stream | Split | Before and after, route aware |
| Commands | Dark core + data ring | Prism | Recorded CLI runs |
| Extensions | Ringed planet + 18 moons | Bloom | Primitives, coverage, contracts, case |
| Blueprint | Orbital planes + event horizon | Stack | Architecture, roadmap and release |

## Planet language

The planet scene is deliberately untextured. A graphite sphere with a warm key
light, an accent fill and a white specular point gives a terminator, a rim and a
small glossy highlight without an image download, a texture licence, or a
photoreal surface that would fight the HUD. Bodies are small metal-rough spheres
in the view accent, bone, violet, mint and amber; the administrator is an ivory
star. Orbit rings are 1px additive circles, and the route or trust relationships
are thin arcs. The same body language appears twice: a large, cropped Canvas2D
body at the page edge and the interactive WebGL instrument in the figure panel.

| View | Accent | Page body | Figure body |
| --- | --- | --- | --- |
| Overview | Cyan `#7ce7ff` | Graphite planet | Graphite planet + 7 bodies |
| Survey | Mint `#9ff0c8` | Ringed planet | Ringed planet + 16 contacts |
| Path map | Amber `#ffb26b` | Star | Solar system; cut becomes a black hole |
| Atlas | Violet `#a78bfa` | Cluster | Star + 16 account bodies |
| Drift | Rose `#ff9ecb` | Binary | Two planets + edge stream |
| Commands | Mint `#9ff0c8` | Gas giant | Dark core + data ring |
| Extensions | Violet `#a78bfa` | Moon | Ringed planet + 18 moons |
| Blueprint | Amber `#ffb26b` | Black hole | Orbital planes + event horizon |

The **black hole** is the only state that replaces the star. The horizon is a
black sphere that occludes the disk behind it, wrapped in a white photon ring, an
accent secondary ring and an eight-band accretion disk. On Path map it
crossfades in when the cut is applied; on Blueprint it is a static closing
plate. The wireframe alternative remains a hollow sphere with three rings, so
the toggle never dead-ends.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| Void | `#08090b` | Page and instrument background |
| Bone | `#f4efe3` | Primary ink, display, admin |
| Paper | `#eee6d2` | Primary button, display echo |
| Muted | `#9d9a90` | Body copy, labels |
| Amber | `#ffb26b` | Warm signal, Path/Blueprint accent, critical |
| Cyan | `#7ce7ff` | Overview accent, added state |
| Violet | `#a78bfa` | Atlas/Extensions accent, users |
| Mint | `#9ff0c8` | Survey/Commands accent, contained |
| Rose | `#ff9ecb` | Drift accent |
| Periwinkle | `#7b86c9` | Roles, wireframe structure |
| Line | `rgb(236 231 218 / .10)` | Hairline rules |

The field is warm black, not blue. One accent is active per view: it drives the
hero aura, the figure rim, the rail selection and the interactive states. Blue
is now one body colour among several; it never owns the whole surface.

## Type

- **Instrument Serif** - display, view titles and italic accent phrases. Weight
  400 only; the size and the contrast do the work.
- **Space Grotesk** - reading copy, controls, panel titles.
- **IBM Plex Mono** - HUD labels, figures, commands, ledgers, every number.

Scale: 17.5px body, 18px lede, 54-88px view titles, 128-238px wordmark,
13.5-16px data, 12.5-13.5px labels. The HUD floor is 12.5px; no body copy sits
below 17px.

## Surface and geometry

- Sharp 2px panels and controls, 0px tags. No corner variant.
- Warm glass: `rgb(20 22 26 / .74)` over blur, 1px bone at 10%.
- The desktop topbar floats as a glass pill; the rail stays fixed at 224px.
- Page bodies sit at the right edge, cropped and low-contrast; the hero aura and
  the ambient edge glow take the view accent.
- Texture: 64px HUD grid, fine SVG grain, 4px CRT scanlines, half-seen orbits.
  Every layer stops under `prefers-reduced-motion`.
- View actions sit under the lede; the figure stage is 430px tall and the Atlas
  graph is a full workbench, not a column.

## Mark

The mark is a sharp 2px tile: a bone HUD frame, a coordinate grid, two inclined
orbits in amber and cyan, a bone serif A with an amber crossbar, and a warm
planet sitting at the apsis of the outer orbit. The same silhouette is used for
`favicon.svg`, the 512px and Apple touch PNGs, the 34px rail mark and the OG
card, so the tab, the home screen and the console header read as one system.

## Motion

Motion explains state, never decorates a static claim:

- auto-rotating instruments with a visible `Auto` badge and a `Paused` state;
- the Path map advances hops, carries a pulse and crossfades its star into a
  black hole on cut; Blueprint carries the same horizon as a closing plate;
- Atlas bodies pulse, the focus ring swells, the orbits turn;
- Drift scans both planets and lights added edges in cyan;
- the `Planets` / `Wire` switch rebuilds the scene without remounting the panel;
- fullscreen on every figure, closes on Escape;
- 32fps cap (10fps when motion is off), offscreen pause, automatic `2D` fallback.

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
