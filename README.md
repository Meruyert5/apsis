# Apsis

**Every route reaches its apsis.**

Apsis reads an AWS account as a permission system, finds every route from a
low-privilege principal to administrator, and computes the smallest set of grants
to revoke so that no route remains. Apsis turns that output into a
orbital console you can inspect, step, and sever.

[![CI](https://github.com/Meruyert5/apsis/actions/workflows/ci.yml/badge.svg)](https://github.com/Meruyert5/apsis/actions/workflows/ci.yml)
[![Pages](https://github.com/Meruyert5/apsis/actions/workflows/pages.yml/badge.svg)](https://github.com/Meruyert5/apsis/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-6f9cff)](LICENSE)
[![Engine: Python 3.9+](https://img.shields.io/badge/engine-Python%203.9%2B-8f7bf2)](pyproject.toml)
[![Console: React + Vite](https://img.shields.io/badge/console-React%20%2B%20Vite-d9b36a)](console/package.json)
[![Data: synthetic](https://img.shields.io/badge/data-synthetic%20fixtures-e0799a)](docs/RESEARCH.md)

![Apsis: a signature transfer ending at the primary star, and the fleet readout](docs/img/signal.png)

## What this is

A policy linter reads one statement and asks whether it is reasonable. Apsis
asks a different question: **what do all those statements add up to?**

- **Routes, not findings.** Every path is a chain of IAM actions, and every step
  keeps the statement that allowed it.
- **Minimum cut.** A max-flow pass identifies the exact edges to remove; a
  second pass groups them into IAM actions a human can approve.
- **Recorded evidence.** The console is a static export. The commands you see are
  the engine's recorded output for the included fixtures.
- **Read-only by construction.** The engine has no AWS client and no network
  code. It parses an export and prints a report.

> The included fleet is synthetic. No customer data, credentials, or live
> account exports are in this repository.

## Live demo

GitHub Pages hosts the console from this repository. After the Pages workflow
runs, the site is at:

**https://meruyert5.github.io/apsis/**

The build uses relative paths, so it also works from a project subpath or a
custom domain. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The current dashboard is `/dashboard.html`; the legacy four-deck console remains
at `/`. The dashboard architecture and interaction inventory are in
[docs/DASHBOARD.md](docs/DASHBOARD.md).

## Why routes

The unit of risk is not a single policy; it is a reachable authority. A principal
with `iam:PassRole` and `lambda:CreateFunction` is not obviously dangerous until
you see that it can hand a role to a function and invoke it. Apsis composes
those steps into edges and searches for the shortest walk to an administrator.

The orbital console is an explanatory layer over that graph:

- the administrator is the primary star;
- each principal is a body on the orbit its hop count allows;
- the bright flux tube is the selected route;
- severing the cut collapses the field.

The specimen is a second view of the same export: 18 escalation primitives as
ribs against the 16 fixture accounts as rings. A photophore is an edge the
engine observed; its size encodes the count, its tone the category. Exact
counts stay in the ledger and the accessible names.

## How it works

1. **Ingest.** A scenario is JSON: identities, policies, trust, and resources that
   carry a role. It has the same shape a live account export produces.
2. **Compose.** The 18 escalation primitives run against the account. Each one
   answers one question, and each edge records the permission that created it.
3. **Find routes.** A bounded depth-first search enumerates short simple paths
   from each identity to the nearest administrator.
4. **Sever.** Dinic max-flow gives the exact minimum edge cut; a greedy pass maps
   it to revocable IAM actions.
5. **Render.** Terminal, Markdown, SARIF, Mermaid, and the JSON bundle the site
   reads. `apsis export` generates the bundle; the site does not invent data.

## Repository map

```text
apsis/             engine: model, policy matcher, techniques, paths, cut, diff, renderers, cli
scenarios/            sixteen account fixtures
scripts/              export_commands.py, records CLI output for the console
tests/                engine tests, standard library only
console/             Apsis: React site, generated data, verify and audit tooling
docs/                 design, research, assumptions, deployment, screenshots
```

## Quick start

### Engine

Requirements: Python 3.9+ and no third-party packages.

```bash
git clone https://github.com/Meruyert5/apsis.git
cd apsis
python -m apsis scan --scenario startup
python -m apsis sever --scenario startup
python -m apsis check --scenario ci-cd
python -m unittest discover -s tests
```

Useful outputs:

```bash
python -m apsis scan -s enterprise \
  --markdown report.md --sarif apsis.sarif --mermaid graph.mmd
```

| Command | Purpose |
| --- | --- |
| `apsis scan -s <fixture>` | Survey an account and print the routes |
| `apsis sever -s <fixture>` | Compute the minimum cut and the revocations |
| `apsis diff --before <fixture> --after <fixture>` | Compare two snapshots, route aware |
| `apsis check -s <fixture> --sarif out.sarif` | CI gate; exits 1 when a route remains |
| `apsis export -s <fixture> -o bundle.json` | Write the JSON bundle for the console |
| `apsis techniques` | List the 18 modelled techniques |

### Console

Requirements: Node 20+.

```bash
cd console
npm ci
npm run dev
```

The local site is served by Vite. To regenerate its data from the engine:

```bash
python -m apsis export --all -o console/src/data
python scripts/export_commands.py console/src/data/commands.json
cd console && npm run build
```

### Checks

```bash
cd console
npm run build
npm run verify     # flows, responsive layout, motion parity
npm run audit      # contrast, headings, names, target size
```

`verify` and `audit` drive a local Chrome over the DevTools protocol; set
`CHROME_PATH` if Chrome is not in the default Windows location.

## The console

| Deck | What it does |
| --- | --- |
| Signal | A 3D signature transfer into the star, the fleet readout, and the five-stage bus |
| Map | The account as a magnetic orrery: primary star, hop shells, bodies, flux tubes; step a route and sever the cut |
| Decide | 18 techniques × 16 accounts as a containment core, with the exact ledger |
| Prove | A command builder, the recorded output, the 3D field collapse, the zero, guardrails and the Penumbra handoff |

Apsis is four cyber decks of one orbital operations console, not a recoloured
security dashboard. Signal is a holographic uplink in cyan and amber; Map is a
magnetic array in blue and violet; Decide is a containment bay in emerald and
magenta; Prove is a flight recorder in rust and amber. Deep navy glass, 1px
gradient borders, scanlines and HUD labels carry the system. Sora 600 sets the
display, IBM Plex Mono carries the data, and Sora carries the reading.

![The Map deck](docs/img/map.png)

The title is the information design: every route reaches its apsis. The full
system is in [docs/DESIGN.md](docs/DESIGN.md); the Pinterest reference trail and
the two-pass direction log are in
[docs/design-research.md](docs/design-research.md).

## Design lab

Two comparison surfaces live under `console/public/design-lab/`.

### Ten exact style plates (current)

One page, ten full-viewport style plates, each with the real Apsis data and a
different object that carries the account. Start at `/design-lab/v4/`:

- 01 **Acid Graphics** - strict grid, halftone body, barcodes, cyan/red-orange
- 02 **Neo-Vintage Travel** - double frame, red sun, mountain route, hanko, Seigaiha
- 03 **Neon Bloom** - solid/outline type, CMYK blossom, crop windows, EN/RU
- 04 **Limbo** - point-cloud cluster, synthwave grid, arched portal, phosphor green
- 05 **Astronomicon** - vertical spine, megastructure, rust desert, archive metadata
- 06 **Silent Authority** - crown of thorns + sword, serif, aphorisms, sepia gold
- 07 **Surveillance** - goat skeleton X-ray, thermal scanner windows, HUD, Cyrillic
- 08 **Atomic Apsis** - lowercase echo, chrome helix, clinical protocol, off-white
- 09 **Vampire** - lips and fangs, gothic serif, film grain, vertical katakana
- 10 **Mesmerize** - liquid type, thermal jellyfish, lens cutouts, black void

The objects are custom per style - not a recoloured orrery. The page is a style
capture for choosing the world; the chosen direction gets the live WebGL object
and the other three acts. The revision log is in
[docs/design-agency.md](docs/design-agency.md).

### Chosen hybrid: Towards Limitless

`/design-lab/v5/` combines the chosen languages: **Acid grid + Limbo point
cloud + Cinematic Lo-fi**. Deep emerald shadows, crimson-orange halation, acid
lime rules, a wet street, film dust and editorial serif italics. The 3D object
is a point-cloud account cluster - 16 bodies, 144 routes, a red route - inside
an acid portal, not an orrery.

### Three palette studies (current)

`/design-lab/v6/` keeps the v5 template untouched - same grid, title, copy,
point-cloud cluster and route - and re-grades it three ways:

- 01 **Thermal / Iridescent** - obsidian shadows, coral, amber, cyan, mint and
  ultraviolet, heavy stipple.
- 02 **Neon Luxe** - pitch black, ice off-white, acid lime and hot crimson
  magenta, crisp and almost grain-free.
- 03 **OPUL 77** - a sunset-to-bioluminescent wash behind white typography,
  from golden yellow through hot pink to periwinkle and seafoam.

Only the palette, background light and surface noise change. No new objects.

### Fleet dashboard (current build)

`/dashboard.html` is the current dashboard: seven views over the same static
export, each with its own WebGL instrument. It is a separate Vite entry; the
legacy console remains at `/`.

- **Overview** — orb; fleet figures, module map, fleet pulse, evidence.
- **Survey** — radar dish; severity, ranking, coverage, searchable ledger.
- **Path map** — ascending path; autoplay, step, speed, cut/restore, hop
  detail, route ledger.
- **Atlas** — account constellation; identity graph, filters, inspector.
- **Commands** — prism; 114 recorded runs, typewriter output, replay, copy.
- **Extensions** — bloom; 18 primitives, 288-cell coverage matrix, contracts,
  alert sample and the observed-path case.
- **Blueprint** — layered stack; pipeline, architecture, modules, roadmap,
  verification and open release items.

Global: `Cmd/Ctrl+K` command palette, motion toggle, corner toggle (sharp or
rounded), hash deep links, animated particle/grid/aurora background with a
grain and scanline texture, bloom-lit glass panels, neon focus states, 2D
fallback on every figure, clickable 3D nodes on Path map, Atlas and Extensions,
and the same read-only export. The architecture and interaction inventory are
in [docs/DASHBOARD.md](docs/DASHBOARD.md).

The Neon Luxe dashboard is retired. This is the dashboard build.

### Y2K / Acid Graphics mascot (current mock)

`/design-lab/v7/` is a clean departure from the previous poster directions:
pure black, white linework and electric ultramarine. The title `APSIS` repeats
three times - solid fill, white outline, blue outline - over a liquid chrome
wave, Y2K stamps, a circular badge, a swoosh and a vertical barcode.

The mascot is a real WebGL object built from two inputs: a **path** (a
Catmull-Rom orbit with seven nodes) and an **atlas** (a wireframe globe shell,
a 420-point dust field and a polar grid) around a liquid-cobalt core. It drags,
zooms, resets and falls back to an SVG wireframe illustration. A separate
dotted waveform mesh runs along the lower left.

### Previous explorations

The first five-direction lab is at `/design-lab/`, the five worlds at
`/design-lab/v2/`, and the first ten-style pass at `/design-lab/v3/`. They are
kept as the evidence trail. The live console currently follows the Orbital Ops
direction.

## Data and scope

**This is a demonstration fleet, not a benchmark.** The 16 fixtures contain 194
identities, 163 escalation edges, and 144 routes. They are deliberately small
enough to read and varied enough to exercise composition, depth, trust rewriting,
and clean-account cases. They are synthetic.

| Fixture | Account | What it exercises |
| --- | --- | --- |
| `startup` | Series A SaaS | Short, dense routes through a CI role |
| `enterprise` | Enterprise, inherited | Deep role chains across inherited policies |
| `fintech` | Fintech ledger | Regulated data paths and a break-glass user |
| `healthcare` | Health network | Claims pipeline with a writable policy step |
| `games-studio` | Games studio, live services | Player data, multiple resources, live ops |
| `gov-contractor` | Federal contractor | Benefits portal, vendor shell, batch host |
| `ml-platform` | ML platform | Outsourced labelling role and model access |
| `legacy` | Legacy account | A small account with almost no guardrails |
| `multi-account` | Multi-account platform | Cross-trust vendor audit and break-glass |
| `ci-cd` | Delivery pipeline, before | Pipeline role before a hardening PR |
| `ci-cd-after` | Delivery pipeline, after | The same account after the cut |
| `retail` | Retail marketplace | Merged platforms with an onboarding leftover |
| `media` | Media network | Release pipeline that can publish policy |
| `research` | Research lab | Grant-funded warehouse write path |
| `logistics` | Logistics network | 24/7 ops with vendor and break-glass roles |
| `platform` | Platform group | Regulated workloads and a self-rewriting role |

The console models **18 escalation primitives**. Public IAM research documents
more (Rhino Security Labs lists 21; PMapper's rule set is broader). The 18 are a
curated, tested subset. A clean result means "no route in the modelled graph",
not "no possible escalation in AWS".

The engine does not evaluate every IAM condition, service control policy, or
resource policy. The full boundary list is in
[docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md); the comparison with PMapper,
Cloudsplaining, Pacu and IAM-Deescalate is in [docs/RESEARCH.md](docs/RESEARCH.md).

To use it against a real account: export the account's authorization details,
convert them to a scenario, and run the engine with no credentials. Do not commit
the export; `.gitignore` excludes authorization dumps.

## Security

- Read-only: the engine has no AWS client, no shell execution, and no network.
- The site is static: no analytics, no cookies, no third-party scripts, no runtime
  data fetching.
- The build injects a restrictive CSP; `script-src 'self'` and `connect-src
  'self'` are part of it.
- Fixtures and exported bundles are synthetic; the repository contains no
  credentials, secrets, or customer data.
- Dependency and static-analysis workflows are in `.github/workflows`.

Report a vulnerability through a private GitHub security advisory. See
[SECURITY.md](SECURITY.md).

## Deployment

The included `.github/workflows/pages.yml` builds `console` and deploys
`console/dist` to GitHub Pages on pushes to `main`. Enable **Settings → Pages →
Source: GitHub Actions**. The site uses relative assets and needs no environment
variables.

Details, custom domains, and the CLI steps are in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Roadmap

| Now | Next | Later |
| --- | --- | --- |
| 18 primitives, 16 fixtures, route survey, minimum cut, static console, Pages workflow | Live import from `GetAccountAuthorizationDetails`; condition and resource-policy evaluation; a CSV view of the ledger | Benchmark against PMapper; drift view in the console; more primitives with fixture coverage |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Keep new behaviour test-first, keep
fixtures synthetic, never commit an authorization export, and run `npm run
verify` / `npm run audit` before a UI change.

## Credits

Sora and IBM Plex are licensed under the SIL Open Font License. Three.js,
React, Vite and Lucide retain their upstream licences. The full attribution is
in [NOTICE.md](NOTICE.md).

## License

The engine and functional source code are released under the [MIT License](LICENSE).
The **Apsis name, wordmark, visual design, and screenshots are © 2026 Meruyert
Oshayeva; all rights reserved.** The MIT grant does not grant permission to
reproduce the distinctive visual identity as a product. Third-party assets keep
their own licences. See [NOTICE.md](NOTICE.md).

## Author

Designed and built by **Meruyert Oshayeva**.

This is an independent security research project. It is not affiliated with,
endorsed by, or sponsored by Amazon Web Services.
