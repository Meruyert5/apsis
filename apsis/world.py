"""Scenario loading and the query surface the technique registry runs against.

`World` is the only object a technique needs. It answers three questions:

    world.allows(principal, action, resource)  -> can this happen, and under what guard
    world.trusts(role, principal)              -> does the role's trust policy admit it
    world.statements(principal)                -> every statement that applies, with provenance

Group membership is expanded here, once, so techniques never think about groups.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from . import policy
from .model import ADMIN, Identity, Policy, Resource, Scenario, Statement


@dataclass(frozen=True)
class Match:
    ok: bool
    conditional: bool = False
    evidence: str = ""
    action: str = ""
    resource: str = ""

    def __bool__(self) -> bool:  # pragma: no cover - convenience only
        return self.ok


def _arn(kind: str, account: str, region: str, name: str) -> str:
    if kind == "user":
        return "arn:aws:iam::%s:user/%s" % (account, name)
    if kind == "role":
        return "arn:aws:iam::%s:role/%s" % (account, name)
    if kind == "group":
        return "arn:aws:iam::%s:group/%s" % (account, name)
    if kind == "policy":
        return "arn:aws:iam::%s:policy/%s" % (account, name)
    if kind == "lambda":
        return "arn:aws:lambda:%s:%s:function:%s" % (region, account, name)
    if kind == "ec2":
        return "arn:aws:ec2:%s:%s:instance/%s" % (region, account, name)
    if kind == "ecs":
        return "arn:aws:ecs:%s:%s:task-definition/%s" % (region, account, name)
    if kind == "glue":
        return "arn:aws:glue:%s:%s:devEndpoint/%s" % (region, account, name)
    if kind == "sagemaker":
        return "arn:aws:sagemaker:%s:%s:notebook-instance/%s" % (region, account, name)
    if kind == "cloudformation":
        return "arn:aws:cloudformation:%s:%s:stack/%s/*" % (region, account, name)
    return "arn:aws:iam::%s:%s/%s" % (account, kind, name)


class World:
    """A loaded scenario plus the lookups every technique shares."""

    def __init__(self, scenario: Scenario) -> None:
        self.scenario = scenario
        self.account = scenario.account_id
        self.region = scenario.region
        self.identities: Dict[str, Identity] = scenario.identities
        self.resources: Dict[str, Resource] = scenario.resources
        self.policies: Dict[str, Policy] = scenario.policies
        self._cache: Dict[str, List[Tuple[str, Statement]]] = {}

    # -- identity helpers -------------------------------------------------

    def identities_of(self, *kinds: str) -> List[Identity]:
        wanted = set(kinds)
        return [item for item in self.identities.values() if item.kind in wanted]

    def roles(self) -> List[Identity]:
        return self.identities_of("role")

    def sources(self) -> List[Identity]:
        """Identities that can hold a stolen credential."""
        return self.identities_of("user", "role")

    def actors(self) -> List[Identity]:
        """Credential-holding identities that are not already administrator.

        Administrators are a destination. Letting them act as attackers turns
        every `*` policy into an edge to every role in the account and buries
        the real findings under synthetic ones.
        """
        return [identity for identity in self.sources() if not self.is_admin(identity.id)]

    def arn_for(self, identity: Identity) -> str:
        return identity.arn

    def resource_by_id(self, rid: str) -> Optional[Resource]:
        return self.resources.get(rid)

    # -- statements -------------------------------------------------------

    def statements(self, identity_id: str) -> List[Tuple[str, Statement]]:
        """All statements that apply to an identity, group policies included."""
        cached = self._cache.get(identity_id)
        if cached is not None:
            return cached

        identity = self.identities.get(identity_id)
        out: List[Tuple[str, Statement]] = []
        if identity is None:
            self._cache[identity_id] = out
            return out

        for policy_id in identity.attached:
            attached = self.policies.get(policy_id)
            if attached:
                out.extend((attached.name, statement) for statement in attached.statements)
        for inline in identity.inline:
            out.extend((inline.name, statement) for statement in inline.statements)

        if identity.kind != "group":
            for group_id in identity.groups:
                group = self.identities.get(group_id)
                if group is None:
                    continue
                for policy_id in group.attached:
                    attached = self.policies.get(policy_id)
                    if attached:
                        out.extend(
                            ("%s/%s" % (group.label, attached.name), statement)
                            for statement in attached.statements
                        )
                for inline in group.inline:
                    out.extend(
                        ("%s/%s" % (group.label, inline.name), statement)
                        for statement in inline.statements
                    )

        self._cache[identity_id] = out
        return out

    def attached_policies(self, identity_id: str) -> List[Policy]:
        """Only the policies attached directly to this identity.

        Self-escalation through `iam:CreatePolicyVersion` needs a policy that is
        actually attached to the identity taking the action, so group grants do
        not count here.
        """
        identity = self.identities.get(identity_id)
        if identity is None:
            return []
        out = []
        for policy_id in identity.attached:
            attached = self.policies.get(policy_id)
            if attached:
                out.append(attached)
        out.extend(identity.inline)
        return out

    # -- authorization ----------------------------------------------------

    def allows(self, identity_id: str, action: str, resource_arn: str) -> Match:
        allowed, statement = policy.evaluate(
            [statement for _, statement in self.statements(identity_id)], action, resource_arn
        )
        if not allowed or statement is None:
            return Match(False, action=action, resource=resource_arn)
        name = next(
            (n for n, s in self.statements(identity_id) if s is statement), "policy"
        )
        evidence = '%s allows %s on %s' % (name, action, resource_arn)
        return Match(True, statement.conditional, evidence, action, resource_arn)

    def allows_any(self, identity_id: str, action: str, resources: Iterable[str]) -> Match:
        """True if the action is allowed against any of the candidate resources."""
        first_miss: Optional[Match] = None
        for resource_arn in resources:
            match = self.allows(identity_id, action, resource_arn)
            if match.ok:
                return match
            first_miss = first_miss or match
        return first_miss or Match(False, action=action)

    def trusts(self, role_id: str, principal_id: str) -> bool:
        """Does this role's trust policy admit the principal?"""
        role = self.identities.get(role_id)
        principal = self.identities.get(principal_id)
        if role is None or principal is None:
            return False
        if not role.trust:
            return False
        for pattern in role.trust:
            if pattern == "*":
                return True
            if pattern.endswith(":root"):
                account = pattern.split(":")[4] if len(pattern.split(":")) > 4 else ""
                if account == self.account:
                    return True
                continue
            if policy.matches(pattern, principal.arn):
                return True
        return False

    def can_assume(self, identity_id: str, role_id: str) -> Match:
        role = self.identities.get(role_id)
        if role is None or role.kind != "role":
            return Match(False)
        if identity_id == role_id:
            return Match(False)
        match = self.allows(identity_id, "sts:AssumeRole", role.arn)
        if not match.ok or not self.trusts(role_id, identity_id):
            return Match(False, action="sts:AssumeRole", resource=role.arn)
        return match

    def is_admin(self, identity_id: str) -> bool:
        statements = [statement for _, statement in self.statements(identity_id)]
        return policy.grants_full_admin(statements) or policy.is_account_takeover(statements)

    def admin_ids(self) -> List[str]:
        return [i.id for i in self.sources() if self.is_admin(i.id)]

    def label(self, node_id: str) -> str:
        if node_id == ADMIN:
            return "Administrator"
        identity = self.identities.get(node_id)
        if identity:
            return identity.label
        resource = self.resources.get(node_id)
        if resource:
            return resource.label
        return node_id


def load_scenario(path: str) -> Scenario:
    with open(path, "r", encoding="utf-8") as handle:
        raw = json.load(handle)

    scenario = Scenario(
        name=str(raw.get("name") or os.path.basename(os.path.dirname(path)) or "account"),
        title=str(raw.get("title") or raw.get("name") or "AWS account"),
        account_id=str(raw.get("account_id") or "111122223333"),
        region=str(raw.get("region") or "us-east-1"),
        summary=str(raw.get("summary") or ""),
        severity=str(raw.get("severity") or "high"),
        source=os.path.abspath(path),
        signature_source=str(raw.get("signature_source") or ""),
    )

    for policy_id, body in (raw.get("policies") or {}).items():
        arn = body.get("Arn") or _arn(
            "policy", scenario.account_id, scenario.region, str(body.get("Name") or policy_id)
        )
        scenario.policies[policy_id] = policy.load_policy(policy_id, body, arn=arn, managed=False)

    for item in raw.get("identities") or []:
        kind = str(item.get("kind") or "user")
        name = str(item.get("name") or item.get("id"))
        identity = Identity(
            id=str(item["id"]),
            label=str(item.get("label") or item["id"]),
            kind=kind,
            arn=str(item.get("arn") or _arn(kind, scenario.account_id, scenario.region, name)),
            attached=[str(pid) for pid in item.get("attached") or []],
            groups=[str(gid) for gid in item.get("groups") or []],
            trust=[str(p) for p in item.get("trust") or []],
            note=str(item.get("note") or ""),
        )
        for index, inline in enumerate(item.get("inline") or []):
            policy_id = "%s.inline.%d" % (identity.id, index)
            identity.inline.append(
                Policy(
                    id=policy_id,
                    name=str(inline.get("Name") or "%s-inline" % identity.label),
                    statements=policy.parse_document(inline.get("Document") or inline),
                    arn=_arn("policy", scenario.account_id, scenario.region, policy_id),
                )
            )
        scenario.identities[identity.id] = identity

    for item in raw.get("resources") or []:
        kind = str(item.get("kind") or "lambda")
        name = str(item.get("name") or item.get("id"))
        resource = Resource(
            id=str(item["id"]),
            label=str(item.get("label") or item["id"]),
            kind=kind,
            arn=str(item.get("arn") or _arn(kind, scenario.account_id, scenario.region, name)),
            role=str(item.get("role") or ""),
            note=str(item.get("note") or ""),
        )
        scenario.resources[resource.id] = resource

    return scenario
