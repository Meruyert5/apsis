# Model and assumptions

A security tool that hides its assumptions produces confident results that are difficult to trust. This document states what an edge means, what counts as administrator, what the engine refuses to guess, and where the results are known to be wrong.

## What an edge means

An edge from `A` to `B` says: an attacker holding `A`'s credentials can obtain `B`'s authority, using the permissions currently granted to `A`. The edge carries the IAM actions required, the statement that allowed it, and the MITRE ATT&CK technique.

Edges are derived from identity policies and trust policies. A path is a sequence of edges that ends at an administrator. Nothing else is inferred.

## What counts as administrator

A principal is an administrator when its effective identity policies contain an unconditional `Allow` of `*` on `*`, or `iam:*` on `*`. The second case is account takeover even though AWS separates it from `AdministratorAccess`.

A policy with a `Condition` is not treated as administrator. A `NotAction` or `NotResource` statement is not treated as full admin either, because the engine does not attempt to prove that the exclusion set is irrelevant.

The synthetic `Administrator` node is where paths terminate when a technique grants rights directly rather than by assuming another identity, for example attaching `AdministratorAccess` to your own user.

## Conditions

The engine evaluates the condition operators it can ground in known request
facts: string, ARN, Bool, IP, date and numeric comparisons, plus `Null` and the
`IfExists`/`ForAllValues`/`ForAnyValue` forms. The context carries the caller
ARN, account, region, source account/ARN/VPC endpoint and secure transport.

What it cannot know stays unknown. `aws:PrincipalOrgID`, MFA, tags, external IDs
and request-time IPs remain conditional unless the caller supplies them. A
condition that is provably false removes the statement; a condition that stays
unknown still counts as a possible route and is marked `conditional`.

The report marks conditional edges with `=>` in the terminal and a dashed curve
on the site.

## Trust policies

`sts:AssumeRole` on a role requires both a matching `Allow` in the caller's
identity policy and an entry in the role's trust policy. Trust entries are
matched as ARN patterns. A trust of `arn:aws:iam::<account>:root` admits any
principal in the account, which is how several of the fixture routes begin.

Resource-based policies are evaluated for modelled resources: an Allow in the
resource policy can satisfy an action even when the identity policy does not,
and an explicit Deny in either policy wins. Resource policies outside the
modelled resource list are not inferred.

## Groups

A group is a node because a principal can join one. `iam:AddUserToGroup` on a group produces an edge to that group, and a group that can attach policies to `*` produces an edge to administrator, since any member can attach an administrator policy to itself.

A user's effective statements include the policies of its groups. A group's own statements are evaluated as the group, which is why the group node can carry an edge.

## Self-escalation

Several techniques only matter when the actor is also the target. The engine applies them carefully:

- `iam:AttachUserPolicy` and `iam:PutUserPolicy` on your own ARN end at administrator.
- `iam:CreatePolicyVersion` and `iam:SetDefaultPolicyVersion` end at administrator only for a policy attached to the actor.
- The same actions against a role end at the role, and only when the actor can already assume it.
- The same actions against another user are not an edge, because the actor still needs that user's credentials.

Each rule is there to avoid the two failure modes that make graph tools useless: claiming a route that needs a step the attacker does not have, and missing the route where a role rewrites its own policy.

## Coverage

Eighteen techniques ship in the registry. Broadly:

- trust and assumption: cross-role assumption, trust policy rewriting
- compute: `iam:PassRole` into Lambda, EC2, CloudFormation, Glue, and SageMaker; rewriting a function's code; SSM command execution
- identity: attaching or writing policies on yourself, on a trusted role, or on an attached policy; creating access keys or console logins for another user; joining a group

Run `apsis techniques` for the exact list with MITRE mappings and fixes.

## Deliberate exclusions

These are not bugs and the engine says so in the report:

- **Service control policies.** An SCP can cap what an edge reaches. An SCP-protected account can look worse here than it is.
- **Resource policies outside the modelled resources.** The evaluator handles policies on resources present in the scenario; bucket, queue, KMS and Secrets Manager policies that were not imported are not inferred.
- **Organizations and Identity Center.** SSO assignments are flattened by the export. Permission sets are not modelled.
- **Session policies and permission boundaries.** Boundaries reduce effective permissions and are not subtracted.
- **Data exfiltration.** The engine models privilege, not which bucket is interesting.

## Known false positives

- A conditional grant whose guard is actually enforced, when the context needed
  to evaluate it was not supplied, will be reported as a route.
- `iam:PassRole` is checked against the role ARN, but the engine does not verify that the passable role can be attached to the target service's execution model.
- The engine does not know whether a role is used by anything. A dormant admin role still counts.

## Known false negatives

- Escalation through resource policies that are not imported, SCP gaps, or cross-account trust outside the modelled account.
- Techniques that need several API calls the registry does not compose, such as creating a user, attaching a policy, and minting a key as separate steps.
- A condition whose context is unknown and whose guard is actually enforced.

## Severing

`sever` answers two questions and reports both.

The **minimum edge cut** is exact: unit capacity on every escalation step, super-source over all identities, super-sink over all administrators, Dinic max-flow. Removing those steps disconnects the account by construction. The test suite proves minimality by adding each cut edge back and checking that a route returns.

The **permission cut** is a greedy set cover over IAM actions. It is not optimal, and it is not meant to be. It answers the question a reviewer asks: which revocations close the account per unit of change. On the startup fixture, revoking `sts:AssumeRole` and `iam:CreatePolicyVersion` closes all six routes.

A cut removes permissions, not identities. Revoking an action from an account is a policy change with its own blast radius, and the report names the action rather than pretending the change is free.

## Adding a technique

1. Write a function that takes `World` and yields `Edge` objects.
2. Add a `Technique` entry with the actions, the MITRE mapping, and the fix.
3. Add a fixture case that proves the edge fires, and one that proves it does not fire when a prerequisite is missing.

Techniques are pure functions of the account, so the test does not need a graph or a mock.

## Data handling

The engine reads JSON and writes JSON, Markdown, SARIF, and Mermaid. It never calls a mutating AWS API and does not need credentials when given an export. Fixtures are synthetic, with a documented account number and invented identities.
