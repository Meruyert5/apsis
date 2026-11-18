# Integrations — Apsis and Penumbra

Three flagships, no connector repository. **Apsis** owns cloud identity;
**Penumbra** owns detection and response; the third project owns network
evidence. They meet through an evidence contract, not shared code.

## The contract

| File | Purpose |
| --- | --- |
| `schema/alert.schema.json` | One finding, `penumbra.alert/v1` |
| `schema/evidence.schema.json` | The events and graph facts behind it |
| `cases/<id>/alert.json` | The emitted alert for that case |
| `cases/<id>/case.md` | The human narrative |
| `cases/<id>/before.json`, `after.json` | Route snapshots around a change |

Apsis is the producer. It emits an alert when a route becomes observed, when a
route is closed, when the graph drifts, or when a guardrail is missing.
Penumbra reads the alert and the evidence manifest; it does not import Apsis
code.

## Apsis → Penumbra

```json
{
  "schema": "penumbra.alert/v1",
  "kind": "path.opened",
  "source": "apsis",
  "generated": "2026-11-17T09:00:00Z",
  "account": "555566667777",
  "principal": "gs-intern",
  "route": ["Tools intern", "Build role", "Art pipeline role", "Game server role", "Live services role", "Live-ops engineer", "Backup role", "Administrator"],
  "edges": ["e4", "e3", "e0", "e10", "e5", "e8", "e1"],
  "observed": true,
  "firstSeen": "2026-11-16T18:00:00Z",
  "lastSeen": "2026-11-16T18:42:00Z",
  "cut": ["iam:CreatePolicyVersion", "iam:CreateAccessKey"],
  "guardrails": ["SCP + Config", "Config + CloudTrail alarm"],
  "evidence": "evidence.json",
  "severity": "critical"
}
```

## Penumbra → Apsis

Penumbra does not push cases back. It may reference the Apsis alert id in its
own case file and cite the evidence manifest. That keeps the ownership clean:
Apsis proves the route, Penumbra proves the response.

## The third project

The network project reuses `case.md` and `evidence.schema.json` for PCAP and
Zeek findings. It does not reuse Apsis’s graph or Penumbra’s detections. The
shared contract is the only coupling.

## What not to build

- No connector API.
- No shared database.
- No cross-repository imports.
- No Apsis SIEM, no Penumbra graph engine.

## Delivered handoff

The observed-path case is emitted as a real alert and handed to Penumbra at:

```text
detection-lab/integrations/apsis/
  alert.json
  evidence.json
  case.md
  guardrail.md
  before.json
  after.json
  cloudtrail.json
  schema/alert.schema.json
  schema/evidence.schema.json
```

Both payloads validate against the schemas above. Penumbra reads the alert and
the evidence manifest; it does not import Apsis code, and Apsis never writes to
the account.

The alert is a validated contract instance generated from the shipped case, not
yet from a live CloudTrail import. The engine overlay that derives `observed`
from a real export is the next roadmap item; the schema, the case and the
handoff are final.

Penumbra received the handoff in its own commit `b28717b` (local, pending
push), with the same payloads and a roadmap entry that marks the case, the
guardrail contract and the alert/evidence delivery as done.
