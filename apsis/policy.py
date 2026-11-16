"""IAM policy parsing and action/resource matching.

The matcher is intentionally conservative:

* explicit Deny beats Allow, at any position in the policy set;
* a statement guarded by a Condition still matches, but the resulting edge is
  flagged `conditional` so the report can ask a human to verify the guard;
* wildcards follow IAM semantics (`*` and `?`), not shell semantics.

Conditions are never silently trusted. A survey that pretends to evaluate
`aws:SourceVpce` without account context would produce confident nonsense.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from .model import Policy, Statement

_ARN_GLOB_CACHE: Dict[str, re.Pattern] = {}


def _glob(pattern: str) -> re.Pattern:
    """Compile an IAM wildcard pattern to a case-insensitive regex."""
    cached = _ARN_GLOB_CACHE.get(pattern)
    if cached is not None:
        return cached
    escaped = re.escape(pattern)
    escaped = escaped.replace(r"\*", ".*").replace(r"\?", ".")
    compiled = re.compile(r"\A" + escaped + r"\Z", re.IGNORECASE | re.DOTALL)
    _ARN_GLOB_CACHE[pattern] = compiled
    return compiled


def matches(pattern: str, value: str) -> bool:
    return _glob(pattern).match(value) is not None


def _as_tuple(value: Any) -> Tuple[str, ...]:
    if value is None:
        return ()
    if isinstance(value, str):
        return (value,)
    return tuple(str(item) for item in value)


def parse_statement(raw: Dict[str, Any]) -> Statement:
    return Statement(
        effect=str(raw.get("Effect", "Allow")),
        actions=_as_tuple(raw.get("Action")),
        resources=_as_tuple(raw.get("Resource")),
        not_actions=_as_tuple(raw.get("NotAction")),
        not_resources=_as_tuple(raw.get("NotResource")),
        condition=raw.get("Condition") or None,
        sid=raw.get("Sid"),
    )


def parse_document(raw: Any) -> List[Statement]:
    """Accept a full policy document, a list of statements, or a list of docs."""
    if raw is None:
        return []
    if isinstance(raw, list):
        out: List[Statement] = []
        for item in raw:
            if isinstance(item, dict) and "Statement" in item:
                out.extend(parse_document(item))
            elif isinstance(item, dict) and ("Action" in item or "NotAction" in item):
                out.append(parse_statement(item))
        return out
    if isinstance(raw, dict):
        statement = raw.get("Statement")
        if statement is None:
            return []
        return parse_document(statement)
    raise ValueError("unsupported policy document: %r" % (type(raw),))


def load_policy(policy_id: str, raw: Dict[str, Any], arn: str = "", managed: bool = False) -> Policy:
    return Policy(
        id=policy_id,
        name=str(raw.get("Name") or policy_id),
        statements=parse_document(raw.get("Document") or raw.get("document") or raw),
        arn=arn,
        managed=managed,
        source=str(raw.get("Source") or "customer"),
    )


def _action_matches(statement: Statement, action: str) -> bool:
    if statement.not_actions:
        if any(matches(pattern, action) for pattern in statement.not_actions):
            return False
        return True
    return any(matches(pattern, action) for pattern in statement.actions)


def _resource_matches(statement: Statement, resource: str) -> bool:
    if statement.not_resources:
        if any(matches(pattern, resource) for pattern in statement.not_resources):
            return False
        return True
    if not statement.resources:
        # A statement with no Resource is malformed in IAM; ignore it.
        return False
    return any(matches(pattern, resource) for pattern in statement.resources)


def evaluate(
    statements: Sequence[Statement], action: str, resource: str
) -> Tuple[bool, Optional[Statement]]:
    """Return (allowed, the allowing statement). Explicit deny wins."""
    allowing: Optional[Statement] = None
    for statement in statements:
        if not _action_matches(statement, action):
            continue
        if not _resource_matches(statement, resource):
            continue
        if statement.effect.lower() == "deny":
            return False, None
        if allowing is None:
            allowing = statement
    return allowing is not None, allowing


def grants_full_admin(statements: Iterable[Statement]) -> bool:
    """True when a policy set grants unrestricted action on all resources."""
    for statement in statements:
        if statement.effect.lower() != "allow":
            continue
        if statement.not_actions:
            continue
        if statement.not_resources:
            continue
        if not any(matches(pattern, "*") for pattern in statement.actions):
            # iam:* on * is not administrator, but it is account takeover.
            continue
        if any(pattern in ("*", "*:*") for pattern in statement.resources):
            if not statement.condition:
                return True
    return False


def is_account_takeover(statements: Iterable[Statement]) -> bool:
    """`iam:*` on `*` is close enough to admin to be worth reporting as admin."""
    for statement in statements:
        if statement.effect.lower() != "allow" or statement.condition:
            continue
        actions = set(pattern.lower() for pattern in statement.actions)
        if actions & {"*", "iam:*"} and any(
            pattern in ("*", "*:*") for pattern in statement.resources
        ):
            return True
    return False


def describe(statement: Statement) -> str:
    """Short human-readable rendering used in edge evidence strings."""
    if statement.not_actions:
        action = "NotAction " + ", ".join(statement.not_actions[:3])
    else:
        action = ", ".join(statement.actions[:3]) or "?"
    if statement.not_resources:
        resource = "NotResource " + ", ".join(statement.not_resources[:3])
    else:
        resource = ", ".join(statement.resources[:3]) or "?"
    return "%s %s on %s" % (statement.effect, action, resource)


def dump_document(statements: Sequence[Statement]) -> Dict[str, Any]:
    """Round-trip a policy back to JSON, used by `apsis export`."""
    out = []
    for statement in statements:
        item: Dict[str, Any] = {"Effect": statement.effect}
        if statement.actions:
            item["Action"] = list(statement.actions)
        if statement.not_actions:
            item["NotAction"] = list(statement.not_actions)
        if statement.resources:
            item["Resource"] = list(statement.resources)
        if statement.not_resources:
            item["NotResource"] = list(statement.not_resources)
        if statement.condition:
            item["Condition"] = statement.condition
        if statement.sid:
            item["Sid"] = statement.sid
        out.append(item)
    return {"Version": "2012-10-17", "Statement": out}


def dumps(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=False)
