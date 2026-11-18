"""CloudTrail overlay.

The graph is theoretical until an event proves an edge was used. This module
maps a CloudTrail export onto the existing survey edges and marks the ones that
were observed, with the first and last event time.

The mapping is deliberately conservative: an event only marks an edge when the
actor, the action family and (where the event carries one) the target agree.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Tuple

from .graph import Survey
from .model import ADMIN

#: CloudTrail event name -> technique id prefix / exact ids.
ACTION_FAMILIES: Dict[str, Tuple[str, ...]] = {
    "assumerole": ("assume_role",),
    "passrole": ("passrole_",),
    "createpolicyversion": ("iam_create_policy_version",),
    "setdefaultpolicyversion": ("iam_set_default_policy_version",),
    "updaterolepolicy": ("iam_update_assume_role_policy",),
    "updatemfa": ("iam_update_assume_role_policy",),
    "attachuserpolicy": ("iam_attach_user_policy",),
    "putuserpolicy": ("iam_put_user_policy",),
    "attachrolepolicy": ("iam_attach_role_policy",),
    "putrolepolicy": ("iam_put_role_policy",),
    "createaccesskey": ("iam_create_access_key",),
    "createloginprofile": ("iam_create_login_profile",),
    "addusertogroup": ("iam_add_user_to_group",),
    "updatefunctioncode": ("lambda_update_code",),
    "sendcommand": ("ssm_send_command",),
}

#: Families that terminate at the synthetic administrator node.
TERMINAL_FAMILIES = {
    "iam_create_policy_version",
    "iam_set_default_policy_version",
    "iam_attach_user_policy",
    "iam_put_user_policy",
}


@dataclass
class Observed:
    events: int = 0
    edges: List[int] = field(default_factory=list)
    routes: List[Tuple[str, ...]] = field(default_factory=list)
    unmatched: int = 0
    generated: str = ""


def load_events(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as handle:
        raw = json.load(handle)
    if isinstance(raw, dict):
        records = raw.get("Records") or raw.get("records") or []
    elif isinstance(raw, list):
        records = raw
    else:
        raise ValueError("CloudTrail file must contain Records or an event list")
    return [event for event in records if isinstance(event, dict)]


def _event_time(event: Dict[str, Any]) -> str:
    return str(event.get("eventTime") or event.get("event_time") or "")


def _event_name(event: Dict[str, Any]) -> str:
    return str(event.get("eventName") or event.get("event_name") or "").replace(":", "").lower()


def _event_source_arn(event: Dict[str, Any]) -> str:
    identity = event.get("userIdentity") or {}
    return str(identity.get("arn") or identity.get("principalId") or "")


def _event_source_name(event: Dict[str, Any]) -> str:
    identity = event.get("userIdentity") or {}
    return str(identity.get("userName") or identity.get("sessionContext", {}).get("sessionIssuer", {}).get("userName") or "")


def _event_target_arn(event: Dict[str, Any]) -> str:
    params = event.get("requestParameters") or {}
    for key in ("roleArn", "policyArn", "userName", "groupName", "functionName"):
        value = params.get(key)
        if isinstance(value, str) and value:
            return value
    return ""


def _family_matches(technique: str, family: Tuple[str, ...]) -> bool:
    return any(technique == prefix or technique.startswith(prefix) for prefix in family)


def _source_matches(survey: Survey, edge_source: str, arn: str, name: str) -> bool:
    identity = survey.world.identities.get(edge_source)
    if identity is None:
        return False
    if arn and (arn == identity.arn or arn.endswith("/" + identity.label.replace(" ", ""))):
        return True
    if name and name.lower() in {
        identity.id.lower(),
        identity.label.lower().replace(" ", "-"),
        identity.label.lower().replace(" ", ""),
    }:
        return True
    return False


def _target_matches(survey: Survey, edge_target: str, arn: str) -> bool:
    if edge_target == ADMIN:
        return True
    if not arn:
        return True
    node = survey.nodes.get(edge_target)
    if node and node.arn and (node.arn == arn or arn.endswith(node.arn.split(":")[-1])):
        return True
    identity = survey.world.identities.get(edge_target)
    if identity and identity.arn == arn:
        return True
    resource = survey.world.resources.get(edge_target)
    if resource:
        if resource.arn == arn:
            return True
        role = survey.world.identities.get(resource.role)
        if role and role.arn == arn:
            return True
    return False


def overlay(survey: Survey, events: Sequence[Dict[str, Any]]) -> Observed:
    """Mark survey edges observed by the events. Returns the summary."""
    result = Observed(events=len(events))
    for event in events:
        name = _event_name(event)
        family = ACTION_FAMILIES.get(name)
        if family is None:
            result.unmatched += 1
            continue
        source_arn = _event_source_arn(event)
        source_name = _event_source_name(event)
        target_arn = _event_target_arn(event)
        candidates = [
            index
            for index, edge in enumerate(survey.edges)
            if _family_matches(edge.technique, family)
            and _source_matches(survey, edge.source, source_arn, source_name)
            and _target_matches(survey, edge.target, target_arn)
        ]
        if not candidates:
            result.unmatched += 1
            continue
        # Prefer the most specific target match; otherwise mark the first edge.
        specific = [
            index for index in candidates
            if survey.edges[index].target == ADMIN or _target_matches(survey, survey.edges[index].target, target_arn)
        ]
        chosen = specific or candidates[:1]
        stamp = _event_time(event)
        for index in chosen:
            edge = survey.edges[index]
            edge.observed = True
            if not edge.first_seen or (stamp and stamp < edge.first_seen):
                edge.first_seen = stamp
            if not edge.last_seen or (stamp and stamp > edge.last_seen):
                edge.last_seen = stamp
            if index not in result.edges:
                result.edges.append(index)

    from . import paths as pathmod

    for source, group in pathmod.all_paths(survey, limit=4).items():
        for route in group:
            indices = [int(edge_id[1:]) for edge_id in route.edges]
            if indices and all(survey.edges[index].observed for index in indices):
                result.routes.append(tuple(route.edges))
    return result


def summary(result: Observed) -> Dict[str, Any]:
    return {
        "events": result.events,
        "observedEdges": len(result.edges),
        "observedRoutes": len(result.routes),
        "unmatched": result.unmatched,
        "edges": ["e%d" % index for index in result.edges],
    }
