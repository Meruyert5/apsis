"""Core data model for an AWS account survey.

Everything the engine reasons about is a node or an edge:

    node  - an identity (user, role, group), a resource that carries a role
            (lambda, ec2, ecs task), or the synthetic administrator terminus.
    edge  - one escalation technique that moves control from one node to
            another, with the IAM actions that make it possible.

The model deliberately stays plain: dataclasses and dictionaries, no
third-party types. A survey has to run on a stock interpreter on a rebuilt
jump host, so the package has no dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

#: Synthetic sink every privilege-escalation path terminates at.
ADMIN = "__admin__"

IDENTITY_KINDS = ("user", "role", "group")
RESOURCE_KINDS = ("lambda", "ec2", "ecs", "glue", "sagemaker", "cloudformation", "datapipeline")

#: Techniques that end at the administrator terminus instead of another node.
TERMINAL_TECHNIQUES = (
    "iam_attach_user_policy",
    "iam_put_user_policy",
    "iam_create_policy_version_self",
    "iam_set_default_policy_version",
)


@dataclass(frozen=True)
class Statement:
    """One IAM statement, flattened enough to match against."""

    effect: str
    actions: Tuple[str, ...] = ()
    resources: Tuple[str, ...] = ()
    not_actions: Tuple[str, ...] = ()
    not_resources: Tuple[str, ...] = ()
    condition: Optional[Dict[str, Any]] = None
    sid: Optional[str] = None

    @property
    def conditional(self) -> bool:
        return bool(self.condition)


@dataclass
class Policy:
    """A named policy document attached to one or more identities."""

    id: str
    name: str
    statements: List[Statement] = field(default_factory=list)
    arn: str = ""
    managed: bool = False
    source: str = "customer"


@dataclass
class Identity:
    """A principal: user, role, or group."""

    id: str
    label: str
    kind: str
    arn: str
    attached: List[str] = field(default_factory=list)
    inline: List[Policy] = field(default_factory=list)
    groups: List[str] = field(default_factory=list)
    trust: List[str] = field(default_factory=list)
    admin: bool = False
    note: str = ""


@dataclass
class Resource:
    """Something that carries a role and can be driven by an attacker."""

    id: str
    label: str
    kind: str
    arn: str
    role: str = ""
    note: str = ""
    policy: Optional[Dict[str, Any]] = None


@dataclass
class Edge:
    """A single escalation step: `source` can obtain `target`'s authority."""

    source: str
    target: str
    technique: str
    actions: Tuple[str, ...] = ()
    conditional: bool = False
    evidence: str = ""
    #: Filled in by the registry so exporters stay dumb.
    name: str = ""
    mitre: str = ""
    severity: str = "high"
    narration: str = ""
    observed: bool = False
    first_seen: str = ""
    last_seen: str = ""

    @property
    def key(self) -> Tuple[str, str, str]:
        return (self.source, self.target, self.technique)


@dataclass
class Node:
    """Flattened graph node handed to layout and exporters."""

    id: str
    label: str
    kind: str
    arn: str = ""
    admin: bool = False
    note: str = ""
    x: float = 0.0
    y: float = 0.0


@dataclass
class Path:
    """A route from an identity to administrator."""

    source: str
    nodes: List[str]
    edges: List[str]

    @property
    def hops(self) -> int:
        return len(self.edges)


@dataclass
class Scenario:
    """An account fixture as loaded from disk."""

    name: str
    title: str
    account_id: str
    region: str
    summary: str
    identities: Dict[str, Identity] = field(default_factory=dict)
    resources: Dict[str, Resource] = field(default_factory=dict)
    policies: Dict[str, Policy] = field(default_factory=dict)
    severity: str = "high"
    source: str = ""
    #: Fixture-author's chosen route to lead the report with.
    signature_source: str = ""
