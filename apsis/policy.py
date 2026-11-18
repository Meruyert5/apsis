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

import ipaddress
import json
import re
from dataclasses import dataclass
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


@dataclass(frozen=True)
class ConditionContext:
    """Known request facts for condition evaluation.

    Anything absent stays unknown and the edge remains conditional. The engine
    never invents a value for MFA, org id, source VPC or a tag it was not given.
    """

    principal_arn: str = ""
    principal_account: str = ""
    principal_id: str = ""
    principal_name: str = ""
    account: str = ""
    region: str = ""
    source_arn: str = ""
    source_account: str = ""
    source_vpce: str = ""
    source_ip: str = ""
    principal_org_id: str = ""
    mfa: Optional[bool] = None
    secure_transport: bool = True
    tags: Optional[Dict[str, str]] = None
    now: Optional[str] = ""


def _context_value(key: str, ctx: ConditionContext) -> Optional[str]:
    lowered = key.lower()
    fixed = {
        "aws:principalarn": ctx.principal_arn,
        "aws:principalaccount": ctx.principal_account or ctx.account,
        "aws:principalid": ctx.principal_id,
        "aws:userid": ctx.principal_id,
        "aws:username": ctx.principal_name,
        "aws:sourceaccount": ctx.source_account or ctx.account,
        "aws:sourcearn": ctx.source_arn,
        "aws:sourcevpce": ctx.source_vpce,
        "aws:sourceip": ctx.source_ip,
        "aws:requestedregion": ctx.region,
        "aws:principalorgid": ctx.principal_org_id,
        "aws:currenttime": ctx.now or "",
    }
    if lowered in fixed:
        value = fixed[lowered]
        return value if value else None
    if lowered == "aws:securetransport":
        return "true" if ctx.secure_transport else "false"
    if lowered == "aws:multifactorauthpresent":
        if ctx.mfa is None:
            return None
        return "true" if ctx.mfa else "false"
    if lowered.startswith("aws:principaltag/"):
        tag = lowered.split("/", 1)[1]
        return (ctx.tags or {}).get(tag)
    return None


def _condition_matches(operator: str, actual: Optional[str], expected: Any) -> Optional[bool]:
    """Return True/False/None for one operator/key pair."""
    values = _as_tuple(expected)

    def one(value: str) -> Optional[bool]:
        if operator in ("StringEquals", "ArnEquals"):
            return actual == value
        if operator == "StringEqualsIgnoreCase":
            return actual is not None and actual.lower() == value.lower()
        if operator in ("StringLike", "ArnLike"):
            return actual is not None and matches(value, actual)
        if operator == "StringNotEquals":
            return actual != value
        if operator == "StringNotEqualsIgnoreCase":
            return actual is None or actual.lower() != value.lower()
        if operator == "StringNotLike":
            return actual is None or not matches(value, actual)
        if operator == "ArnNotEquals":
            return actual != value
        if operator == "ArnNotLike":
            return actual is None or not matches(value, actual)
        if operator == "Bool":
            return actual is not None and actual.lower() == value.lower()
        if operator in ("IpAddress", "NotIpAddress"):
            if actual is None:
                return None
            try:
                address = ipaddress.ip_address(actual)
                network = ipaddress.ip_network(value, strict=False)
            except ValueError:
                return None
            inside = address in network
            return inside if operator == "IpAddress" else not inside
        if operator.startswith("Date"):
            if actual is None:
                return None
            try:
                left = _parse_time(actual)
                right = _parse_time(value)
            except ValueError:
                return None
            if operator.endswith("Equals"):
                return left == right
            if operator.endswith("LessThan"):
                return left < right
            if operator.endswith("GreaterThan"):
                return left > right
            return None
        if operator.startswith("Numeric"):
            if actual is None:
                return None
            try:
                left = float(actual)
                right = float(value)
            except ValueError:
                return None
            if operator.endswith("Equals"):
                return left == right
            if operator.endswith("LessThan"):
                return left < right
            if operator.endswith("GreaterThan"):
                return left > right
            return None
        return None

    if operator == "Null":
        wanted = str(values[0]).lower() == "true" if values else True
        return (actual is None) == wanted

    if actual is None and operator.endswith("IfExists"):
        return True
    if operator.endswith("IfExists"):
        operator = operator[: -len("IfExists")]

    if operator.startswith("ForAllValues:"):
        operator = operator.split(":", 1)[1]
        results = [one(value) for value in values]
        if any(result is False for result in results):
            return False
        return True if all(result is True for result in results) else None
    if operator.startswith("ForAnyValue:"):
        operator = operator.split(":", 1)[1]
        results = [one(value) for value in values]
        if any(result is True for result in results):
            return True
        return False if all(result is False for result in results) else None

    if actual is None:
        return None
    results = [one(value) for value in values]
    if any(result is True for result in results):
        return True
    if any(result is None for result in results):
        return None
    return False


def evaluate_condition(condition: Optional[Dict[str, Any]], ctx: ConditionContext) -> Optional[bool]:
    """Evaluate a condition block. None means the engine cannot know."""
    if not condition:
        return True
    verdict: Optional[bool] = True
    for operator, entries in condition.items():
        if not isinstance(entries, dict):
            return None
        for key, expected in entries.items():
            result = _condition_matches(str(operator), _context_value(str(key), ctx), expected)
            if result is False:
                return False
            if result is None:
                verdict = None
    return verdict


def _parse_time(value: str):
    from datetime import datetime

    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))



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
    statements: Sequence[Statement],
    action: str,
    resource: str,
    context: Optional[ConditionContext] = None,
) -> Tuple[bool, Optional[Statement]]:
    """Return (allowed, the allowing statement). Explicit deny wins.

    When a context is supplied, a condition that is provably false removes the
    statement; a condition that remains unknown is still treated as a possible
    allow and the edge stays conditional.
    """
    allowing: Optional[Statement] = None
    for statement in statements:
        if not _action_matches(statement, action):
            continue
        if not _resource_matches(statement, resource):
            continue
        if context is not None:
            verdict = evaluate_condition(statement.condition, context)
            if verdict is False:
                continue
        if statement.effect.lower() == "deny":
            return False, None
        if allowing is None:
            allowing = statement
    return allowing is not None, allowing


def condition_verdict(statement: Optional[Statement], context: ConditionContext) -> Optional[bool]:
    if statement is None:
        return None
    return evaluate_condition(statement.condition, context)


def explicit_deny(
    statements: Sequence[Statement],
    action: str,
    resource: str,
    context: Optional[ConditionContext] = None,
) -> bool:
    for statement in statements:
        if statement.effect.lower() != "deny":
            continue
        if not _action_matches(statement, action):
            continue
        if not _resource_matches(statement, resource):
            continue
        if context is not None and evaluate_condition(statement.condition, context) is False:
            continue
        return True
    return False


def _principal_admits(principal: Any, principal_arn: str, account: str) -> bool:
    if principal is None:
        return False
    if isinstance(principal, str):
        candidates = [principal]
    elif isinstance(principal, list):
        candidates = [str(item) for item in principal]
    elif isinstance(principal, dict):
        values = principal.get("AWS", [])
        if isinstance(values, str):
            values = [values]
        candidates = [str(item) for item in values]
    else:
        return False
    for candidate in candidates:
        if candidate == "*":
            return True
        if candidate == account:
            return principal_arn.startswith("arn:aws:iam::%s:" % account)
        if candidate.endswith(":root"):
            parts = candidate.split(":")
            if len(parts) > 4 and parts[4] == account:
                return True
            continue
        if matches(candidate, principal_arn):
            return True
    return False


def resource_policy_evaluate(
    document: Optional[Dict[str, Any]],
    action: str,
    resource_arn: str,
    principal_arn: str,
    account: str,
    context: Optional[ConditionContext] = None,
) -> Tuple[bool, bool, str, bool]:
    """Evaluate a resource-based policy for one principal.

    Returns (allowed, conditional, evidence, denied). A resource-based policy
    only applies when its Principal admits the caller.
    """
    if not document:
        return False, False, "", False
    raw_statements = document.get("Statement", [])
    if isinstance(raw_statements, dict):
        raw_statements = [raw_statements]
    allowing = False
    conditional = False
    denied = False
    for raw in raw_statements:
        if not isinstance(raw, dict):
            continue
        if raw.get("Principal") is not None and not _principal_admits(
            raw.get("Principal"), principal_arn, account
        ):
            continue
        statement = parse_statement(raw)
        if not _action_matches(statement, action):
            continue
        if not _resource_matches(statement, resource_arn):
            continue
        verdict = evaluate_condition(statement.condition, context) if context else None
        if verdict is False:
            continue
        if statement.effect.lower() == "deny":
            denied = True
            continue
        allowing = True
        conditional = conditional or verdict is None
    evidence = "resource policy"
    return allowing, conditional, evidence, denied




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
