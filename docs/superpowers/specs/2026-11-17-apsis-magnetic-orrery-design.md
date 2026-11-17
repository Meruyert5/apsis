# Apsis — the magnetic orrery

**Status:** approved direction · 2026-11-17
**Supersedes:** the Map and Prove sections of the bioluminescent design; the
shell, palette, ledger, evidence vocabulary and verification gates stay.

## 1. The title decides the design

**Apsis** is the point in an orbit where a body is farthest from, or nearest to,
its primary — the turning point of the orbit. The console should be the same
thing: an orbital instrument where every route reaches its turning point at the
administrator.

So:

- the Map is an **orrery**, not an organism;
- the administrator is the **primary star**, not a nucleus;
- hop distance is an **orbit shell**;
- an escalation is a **flux tube** between bodies;
- the cut is a **field collapse**;
- the proof is the **apsis** — the point where the route ends and the account
  is closed.

The H1 becomes **“Every route reaches its apsis.”** That is the project name,
the tagline and the information design in one line.

The old problem was the planet **atlas**, not the orbit **Map**. The atlas
turned 18 techniques × 16 accounts into a matrix of planets, which was the wrong
job for that encoding. An orrery is the right job for hop distance. The Decide
act stays a radial core; it does not go back to planets.

## 2. One page, four physical registers

Every act shares the same three languages — space, bioluminescence, magnetism —
and adds one dominant physical idea.

| Act | Dominant register | Space | Bio | Magnetism | Evidence |
| --- | --- | --- | --- | --- | --- |
| **Signal** | **Gravity** — the apsis | A star, one elliptical transfer, a body at the turning point | A living pulse along the transfer | A field line with one live charge | `observed` vs `theoretical` on the signature route |
| **Map** | **Magnetism** — the orrery | Star, orbit shells, bodies, moons, crystals | Bioluminescent bodies with aurora and growth rings | Flux tubes, polarity, field collapse on sever | CloudTrail-observed routes solid; theoretical routes ghosted |
| **Decide** | **Containment** — the core | A containment specimen | Photophores and membrane | A containment field with guardrail rings | Observed badge on techniques/accounts; guardrail per technique |
| **Prove** | **Collapse** — the apsis | The abyss | The diver and the zero | The field collapse and residual charge | Revocation + guardrail ledgers, case file, Penumbra handoff |

The page tells one physical story: a signal enters, the body orbits, the core
contains, the field collapses at the apsis. The title is not a skin; it is the
sequence.

## 3. What changes from the bioluminescent build

| Area | Current | New |
| --- | --- | --- |
| H1 | Every route ends at the nucleus | **Every route reaches its apsis.** |
| Map | 3D organism: nucleus, growth rings, cells, veins | 3D magnetic orrery: star, shells, bodies, flux tubes |
| Signal | 2D SVG route | 3D orbital transfer, one star and one body |
| Decide | 3D specimen + 2D radial | Keep; recast as a containment core; add observed/guardrail states |
| Prove | CSS abyss | 3D abyss / field collapse; keep terminal, zero, ledgers |
| The organism | Default Map | Retired as the default; optional “cell view” only if it earns it |
| Evidence | Theoretical only | Observed vs theoretical, guardrails, handoff |

The Map is the only act that is fully rebuilt. The shell, type, palette, ledger,
mission rail, palette and proof copy stay.

## 4. The magnetic orrery

### 4.1 Scene

- **Primary star** — the administrator cluster at the centre. Amber-white
  corona, magnetic field lines, a slow pulse. Multiple administrators are
  separate lobes inside one star; a route ends on the specific lobe.
- **Orbit shells** — one shell per hop count, 1..max. Thin aurora rings with a
  magnetic shimmer; the selected shell brightens. The outer shell is the
  deepest route.
- **Bodies** — identities. User violet, role cyan, group mint, resource ice.
  Sphere/capsule size grows with degree. Each body has a small aurora and a
  magnetic axis; the selected body tilts its axis toward the star.
- **Moons and crystals** — groups orbit a small cluster; resources are
  crystalline shards on the shell.
- **Flux tubes** — escalation edges. Curved magnetic filaments between shells.
  A selected route is a bright tube with two travelling charges; other edges are
  faint. Observed edges are solid; theoretical edges are dashed/ghosted.
- **Guardrail rings** — a cut edge gets a thin closed ring around the removed
  tube, in the guardrail colour (mint), labelled by control type. This is the
  preventive layer, not decoration.
- **Field collapse** — on sever, the cut flux tubes snap coral, the star dims,
  the shells contract slightly, and the organism-free field goes quiet. The
  readout switches to Cut.
- **Membrane** — a very faint outer field boundary around the system; no
  organism body.

### 4.2 Interaction

Keep the current workbench exactly: principal rail, Route/Node/Cut readout, hop
bar, account selector, live region. Add:

- a **Live / All** toggle in the toolbar: `observed` paths only, or all;
- an **observed badge** on routes, nodes and cells;
- a **guardrail** panel in Cut;
- a **CloudTrail window** chip (`last 24h`, `last 7d`, `all`);
- a **Penumbra handoff** button in Prove.

Camera: orbit on drag, zoom on wheel/pinch, reset, `frame route`. Reduced motion:
static frame, 2D readout only.

### 4.3 Evidence states

```
theoretical  dashed flux tube, ghosted body, no CloudTrail
observed     solid tube, bright body, lastSeen/count in the readout
active       every edge observed in the selected window
severed      coral tube, guardrail ring, no route
```

The Map can show a mixed route: observed edges solid, theoretical edges dashed.
The route is `active` only when all edges are observed. That is the “prove which
ones are real” story.

## 5. Apsis extensions

### 5.1 CloudTrail-observed paths

- Ingest CloudTrail JSON (`apsis import-cloudtrail` or a fixture loader).
- Map events to edge actions. An edge is observed if the action was used by the
  source principal in the window.
- A route is active when every edge is observed.
- Emit `path.opened` when a route transitions from theoretical to active.
- Readout: event names, first/last seen, count, source IP/UA if present.
- Map: solid vs dashed flux tubes; active route pulses amber.

### 5.2 Guardrails

For each cut edge, recommend one preventive control:

| Technique family | Guardrail |
| --- | --- |
| PassRole into compute | SCP denying `iam:PassRole` to the resource, or a permissions boundary |
| Policy rewrite | SCP denying `iam:CreatePolicyVersion` / `Put*Policy` outside the platform role |
| Trust rewrite | Access Analyzer + SCP on `sts:AssumeRole` targets |
| Access key minting | Config rule + CloudTrail alarm on `CreateAccessKey` |
| Group escalation | SCP on `AddUserToGroup` / `Attach*Policy` |
| Console password | Config rule on `CreateLoginProfile` |

Guardrails are recommendations; Apsis remains read-only. The Prove act gets a
guardrail ledger beside the revocation ledger, and the Map shows guardrail rings
on the cut tubes.

### 5.3 Attack-path case study

`cases/01-observed-path/`:

- `case.md` — the narrative;
- `evidence.json` — the event/edge manifest;
- `before.json` / `after.json` — the route before and after the cut;
- `cloudtrail.json` — the observed events;
- `guardrail.md` — the control that prevents recurrence.

The case study is the demo that proves the extension end to end.

### 5.4 Penumbra handoff

Shared contract, no connector repo:

```text
schema/alert.schema.json
schema/evidence.schema.json
cases/README.md
```

Apsis emits an alert like:

```json
{
  "schema": "penumbra.alert/v1",
  "kind": "path.opened",
  "source": "apsis",
  "account": "555566667777",
  "principal": "arn:aws:iam::555566667777:user/gs-intern",
  "route": ["Tools intern", "Build role", "Art pipeline role", "..."],
  "edges": ["e4", "e3", "e0", "e10", "e5", "e8", "e1"],
  "observed": true,
  "firstSeen": "2026-11-16T18:00:00Z",
  "lastSeen": "2026-11-16T18:42:00Z",
  "cut": ["iam:CreateAccessKey", "sts:AssumeRole"],
  "guardrails": ["SCP: deny iam:PassRole", "Config: create-access-key"],
  "evidence": "evidence.json"
}
```

Penumbra triages it; Apsis does not call Penumbra.

## 6. 3D architecture

Four 3D scenes, only one active at a time:

- **Signal** — a small star + transfer + body; one scene, no heavy bloom.
- **Map** — the orrery; the main scene.
- **Decide** — the containment core; existing specimen, recast.
- **Prove** — a light abyss/collapse shader; no post-processing bloom.

Each scene:

- pauses when offscreen or hidden;
- renders a static frame under reduced motion;
- DPR capped at 1.5;
- disposes geometry/material on account/section change;
- falls back to 2D/SVG for Signal and Decide on low-power/mobile; Map falls
  back to a static poster plus the rail/readout; Prove stays a static field.

Shared `lib/three/` helpers: glow texture, magnetic filament material, aurora
sprite, camera drag/zoom/raycast, disposal.

## 7. What Apsis refuses

- A cloud SIEM or detection library.
- A SOAR or ticketing system.
- Real AWS exploitation.
- The network project. The third project owns network evidence; Apsis only
  emits the shared alert/evidence schema.

## 8. Build order

1. **Magnetic orrery prototype** — real Games studio data, synthetic
   `observed`/`theoretical` states, guardrail rings, Live/All toggle. This is
   the visual gate.
2. **Schema + exporter** — `alert.schema.json`, `evidence.schema.json`,
   `apsis export-alert`, tests.
3. **CloudTrail overlay** — edge observation, active routes, `path.opened`.
4. **Guardrails** — mapping, ledger, Map rings.
5. **Case study + Penumbra handoff**.
6. **3D Signal and Prove**; re-skin Decide; docs, screenshots, verify.

Each step produces a working demo. The orrery prototype is next.

## 9. Open decisions

- Whether the organism survives as an optional “cell view” or is removed. My
  call: remove it from the default build; keep the code path only if it proves
  useful in the prototype.
- Whether the Map’s upper-left label reads `Apsis / orbit 02` or `Account /
  orrery` — copy, not architecture.
- Whether the guardrail colour is mint (containment) or amber (live). My call:
  mint for guardrails, amber for the star and the active route.
- Whether Signal is 3D on mobile. My call: 2D poster on mobile; 3D desktop.
