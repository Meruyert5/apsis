"""Import an AWS IAM authorization dump into the scenario format.

Two entry points, one converter:

* `fetch()` shells out to the AWS CLI for `iam get-account-authorization-details`.
  Arguments are passed as a list, never through a shell.
* `convert()` turns that JSON into the same structure the fixtures use, which
  means an imported account can be scanned, severed, diffed and exported with no
  special handling.

The IAM API does not describe Lambda functions or EC2 instances, so imported
accounts start with no compute resources. Add them by hand if you are chasing a
PassRole chain through a specific function.
"""

from __future__ import annotations

import json
import subprocess
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple

#: A dump larger than this is almost certainly not an IAM export.
MAX_BYTES = 64 * 1024 * 1024


class ImportError_(RuntimeError):
    """Raised when the CLI or the dump cannot be used."""


def _decode(document: Any) -> Dict[str, Any]:
    """Managed policy documents arrive URL-encoded; assume-role policies do not."""
    if isinstance(document, str):
        text = urllib.parse.unquote(document)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"Version": "2012-10-17", "Statement": []}
    if isinstance(document, dict):
        return document
    return {"Version": "2012-10-17", "Statement": []}


def fetch(profile: Optional[str] = None, region: Optional[str] = None, timeout: int = 180) -> Dict[str, Any]:
    """Run the AWS CLI and return the parsed dump."""
    command = ["aws"]
    if profile:
        command += ["--profile", profile]
    if region:
        command += ["--region", region]
    command += ["iam", "get-account-authorization-details", "--output", "json"]

    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
            shell=False,
        )
    except FileNotFoundError as error:
        raise ImportError_(
            "the AWS CLI is not installed; install it or pass --input with a saved dump"
        ) from error
    except subprocess.TimeoutExpired as error:
        raise ImportError_("the AWS CLI timed out after %d seconds" % timeout) from error

    if completed.returncode != 0:
        message = (completed.stderr or "aws CLI exited with %d" % completed.returncode).strip()
        raise ImportError_(message[:2000])
    if len(completed.stdout.encode("utf-8", errors="ignore")) > MAX_BYTES:
        raise ImportError_("authorization dump exceeds the %d byte limit" % MAX_BYTES)
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as error:
        raise ImportError_("the AWS CLI returned invalid JSON") from error


def load(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _slug(value: str) -> str:
    cleaned = "".join(char if char.isalnum() or char in "-_." else "-" for char in value)
    return cleaned.strip("-").lower() or "unnamed"


def _trust_principals(document: Any) -> List[str]:
    decoded = _decode(document)
    principals: List[str] = []
    for statement in decoded.get("Statement", []) or []:
        if str(statement.get("Effect", "Allow")).lower() != "allow":
            continue
        principal = statement.get("Principal")
        if isinstance(principal, str):
            principals.append(principal)
        elif isinstance(principal, list):
            principals.extend(str(item) for item in principal)
        elif isinstance(principal, dict):
            for value in principal.values():
                if isinstance(value, str):
                    principals.append(value)
                elif isinstance(value, list):
                    principals.extend(str(item) for item in value)
    return sorted(set(principals))


def _account_from(details: Dict[str, Any]) -> str:
    for collection in ("UserDetailList", "RoleDetailList", "GroupDetailList"):
        for item in details.get(collection, []) or []:
            arn = str(item.get("Arn") or "")
            parts = arn.split(":")
            if len(parts) > 4 and parts[4].isdigit():
                return parts[4]
    for policy in details.get("Policies", []) or []:
        parts = str(policy.get("Arn") or "").split(":")
        if len(parts) > 4 and parts[4].isdigit():
            return parts[4]
    return "000000000000"


def convert(
    details: Dict[str, Any],
    name: str = "imported",
    region: str = "us-east-1",
    title: Optional[str] = None,
) -> Dict[str, Any]:
    """Turn an authorization dump into a scenario document."""
    account = _account_from(details)
    policies: Dict[str, Any] = {}
    by_arn: Dict[str, str] = {}

    for index, entry in enumerate(details.get("Policies", []) or []):
        arn = str(entry.get("Arn") or "")
        versions = entry.get("PolicyVersionList", []) or []
        default = next((item for item in versions if item.get("IsDefaultVersion")), None)
        document = _decode((default or {}).get("Document"))
        policy_name = str(entry.get("PolicyName") or ("policy-%d" % index))
        policy_id = "managed-%s" % _slug(policy_name)
        if policy_id in policies:
            policy_id = "%s-%d" % (policy_id, index)
        policies[policy_id] = {
            "Name": policy_name,
            "Arn": arn,
            "Document": document,
            "Source": "aws",
        }
        if arn:
            by_arn[arn] = policy_id

    def attached(entry: Dict[str, Any]) -> List[str]:
        out = []
        for item in entry.get("AttachedManagedPolicies", []) or []:
            policy_id = by_arn.get(str(item.get("PolicyArn") or ""))
            if policy_id:
                out.append(policy_id)
        return out

    def inline(entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        out = []
        for item in entry.get("UserPolicyList", []) or entry.get("RolePolicyList", []) or entry.get("GroupPolicyList", []) or []:
            out.append({
                "Name": item.get("PolicyName") or "inline",
                "Document": _decode(item.get("PolicyDocument")),
            })
        return out

    identities: List[Dict[str, Any]] = []

    for group in details.get("GroupDetailList", []) or []:
        label = str(group.get("GroupName") or "group")
        identities.append({
            "id": "group-%s" % _slug(label),
            "name": label,
            "label": label,
            "kind": "group",
            "arn": group.get("Arn"),
            "attached": attached(group),
            "inline": inline(group),
            "note": "Imported group.",
        })

    for user in details.get("UserDetailList", []) or []:
        label = str(user.get("UserName") or "user")
        identities.append({
            "id": "user-%s" % _slug(label),
            "name": label,
            "label": label,
            "kind": "user",
            "arn": user.get("Arn"),
            "attached": attached(user),
            "inline": inline(user),
            "groups": ["group-%s" % _slug(str(item)) for item in user.get("GroupList", []) or []],
            "note": "Imported user.",
        })

    for role in details.get("RoleDetailList", []) or []:
        label = str(role.get("RoleName") or "role")
        identities.append({
            "id": "role-%s" % _slug(label),
            "name": label,
            "label": label,
            "kind": "role",
            "arn": role.get("Arn"),
            "attached": attached(role),
            "inline": inline(role),
            "trust": _trust_principals(role.get("AssumeRolePolicyDocument")),
            "note": str(role.get("Description") or "Imported role."),
        })

    return {
        "name": name,
        "title": title or ("Imported account %s" % account),
        "account_id": account,
        "region": region,
        "severity": "high",
        "summary": (
            "Imported from AWS IAM: %d users, %d roles, %d groups, %d managed policies."
            % (
                len(details.get("UserDetailList", []) or []),
                len(details.get("RoleDetailList", []) or []),
                len(details.get("GroupDetailList", []) or []),
                len(details.get("Policies", []) or []),
            )
        ),
        "policies": policies,
        "identities": identities,
        "resources": [],
    }


def from_aws(
    output: str,
    profile: Optional[str] = None,
    region: Optional[str] = None,
    name: str = "imported",
) -> Dict[str, Any]:
    details = fetch(profile=profile, region=region)
    scenario = convert(details, name=name, region=region or "us-east-1")
    with open(output, "w", encoding="utf-8") as handle:
        json.dump(scenario, handle, indent=2)
        handle.write("\n")
    return scenario


def from_file(output: str, source: str, name: str = "imported", region: str = "us-east-1") -> Dict[str, Any]:
    scenario = convert(load(source), name=name, region=region)
    with open(output, "w", encoding="utf-8") as handle:
        json.dump(scenario, handle, indent=2)
        handle.write("\n")
    return scenario
