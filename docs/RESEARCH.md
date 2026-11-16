# Research note — route-based IAM escalation

## The question

Can an AWS account's privilege-escalation exposure be read as a route system
rather than a list of findings: who can reach administrator, through which
actions, and what is the smallest set of grants that closes every route?

Apsis answers that question in the engine. Apsis is the demonstration
console for the answer.

## Comparable work

| Tool | Primary question | Notes |
| --- | --- | --- |
| [PMapper](https://github.com/nccgroup/PMapper) | Who can escalate, and by what path? | Graph of principals, trust and privilege-escalation edges; REPL and visualisation. The closest conceptual match. |
| [Cloudsplaining](https://github.com/salesforce/cloudsplaining) | Which policies violate least privilege? | Strong policy-risk reporting; not a route or minimum-cut tool. |
| [Pacu](https://github.com/RhinoSecurityLabs/pacu) | Exploit an account in an authorised engagement | Offensive modules, not a defensive route report. |
| [AWSPX](https://github.com/FSecureLABS/awspx) | Explore AWS effective access in a graph | Graph exploration; different product surface. |
| [IAM-Deescalate](https://github.com/PaloAltoNetworks/IAM-Deescalate) | Reduce escalation risk in existing roles | Uses PMapper to identify risk, then generates remediation. |
| [IAM Access Analyzer](https://aws.amazon.com/iam/access-analyzer/) | Find external access and unused permissions | Cloud-native policy analysis; no route enumeration. |

Palo Alto Networks' evaluation of PMapper, Cloudsplaining and Pacu reports PMapper
with the highest detection rate in its tested set. That reinforces the graph
approach; it also means a new tool must be explicit about its own coverage rather
than claiming to replace them.

## What Apsis adds

- **Routes as the unit.** Each edge keeps the IAM action, the statement that
  allowed it, and a MITRE technique; the survey shows the shortest walk to the
  administrator and lets a reviewer step it.
- **Minimum cut as a first-class result.** The sever view names the grants to
  revoke, not just the risky principals.
- **A coverage view.** The atlas shows 18 primitives across 16 accounts. It is a
  coverage chart, not a benchmark.
- **One static artifact.** The console is a recorded export; it does not call
  AWS, and it can be published without a backend.

## Coverage and limits

The fixtures model **18 escalation primitives**. Rhino Security Labs' public
research describes 21 methods; PMapper's rule set is broader still. Eighteen is a
curated, testable subset, not the whole field. The README and the site both state
that limit.

The engine models identity and trust policies. It does not evaluate every IAM
condition, service control policy, or resource policy. Those boundaries are
documented in [ASSUMPTIONS.md](ASSUMPTIONS.md). A clean result therefore means
"no route in the modelled graph", not "no possible escalation in AWS".

The 16-account, 194-identity fleet is **synthetic fixture data**, built to
exercise composition, depth, trust rewriting, and clean-account cases. It is
large enough for deterministic tests and a legible demo; it is not a
representative sample of AWS accounts and must not be used as a benchmark.

## Design assessment

The orbital metaphor is useful for routes and hop depth because it makes distance
and convergence visible. It is weaker for exact counts, so the atlas keeps exact
numbers in the accessible name, the title, and the inspector. The matrix uses
body class and tone to make coverage scannable, with a plain data trail behind
it.

The main risk is **security theatre**: a beautiful graph that hides weak
evidence. The dossier is the mitigation. It shows the action, the narration, the
MITRE mapping, the evidence, and the fix for the active hop. A future plain-table
or CSV view would make the atlas useful outside the visual metaphor.

## Recommended next work

1. Live import from `GetAccountAuthorizationDetails` and `ListRoles`.
2. Evaluate conditions and resource policies before declaring a route.
3. Benchmark route and cut counts against PMapper on a shared fixture set.
4. Add a CSV/table export and a route-diff view for drift.
5. Expand the primitive set, with each new edge covered by a fixture test.

## Sources

- NCC Group, PMapper — https://github.com/nccgroup/PMapper
- Salesforce, Cloudsplaining — https://github.com/salesforce/Cloudsplaining
- Rhino Security Labs, *AWS IAM Privilege Escalation – Methods and Mitigation* —
  https://rhinosecuritylabs.com/aws/aws-privilege-escalation-methods-mitigation/
- Palo Alto Networks, *IAM-Deescalate* —
  https://unit42.paloaltonetworks.com/iam-deescalate/
- F-Secure, AWSPX — https://github.com/FSecureLABS/awspx
- AWS, IAM Access Analyzer — https://aws.amazon.com/iam/access-analyzer/
- Rami McCarthy, *An AWS IAM Security Tooling Reference* —
  https://ramimac.me/aws-iam-tools-2024
