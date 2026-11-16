"""The technique registry.

Each entry answers one question: *given this account, where can this technique
carry an attacker?* Techniques are pure functions of `World`, so adding one is a
single function plus a registry row, and the test suite can pin it in isolation.

A note on honesty: these are the permission edges that are well documented in
public AWS privilege-escalation research. Several techniques found in the wild
are deliberately absent because modelling them correctly needs API calls this
engine does not make (organizations boundaries, SCPs, resource policies on
secrets, SSO assignments). `docs/assumptions.md` lists what is covered and what
is not, and the site repeats it.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Iterable, List, Optional, Sequence, Tuple

from .model import ADMIN, Edge
from .world import Match, World


@dataclass(frozen=True)
class Technique:
    id: str
    name: str
    category: str
    severity: str
    mitre: str
    summary: str
    fix: str
    actions: Tuple[str, ...]
    find: Callable[[World], Iterable[Edge]]


def _mk(technique: Technique, source: str, target: str, match: Match) -> Edge:
    return Edge(
        source=source,
        target=target,
        technique=technique.id,
        actions=technique.actions,
        conditional=match.conditional,
        evidence=match.evidence,
        name=technique.name,
        mitre=technique.mitre,
        severity=technique.severity,
        narration=technique.summary,
    )


def _pairs(world: World):
    """Every (actor, role) pair where the two are different identities."""
    for actor in world.actors():
        for role in world.roles():
            if actor.id == role.id:
                continue
            yield actor, role


# ---------------------------------------------------------------------------
# Trust and role assumption
# ---------------------------------------------------------------------------


def _assume_role(world: World) -> Iterable[Edge]:
    for actor, role in _pairs(world):
        match = world.can_assume(actor.id, role.id)
        if match.ok:
            yield _mk(_ASSUME_ROLE, actor.id, role.id, match)


# ---------------------------------------------------------------------------
# PassRole into compute: the workhorse of real-world AWS escalation
# ---------------------------------------------------------------------------


def _passrole(world: World, service_action: str, resource: str, technique_id: str) -> Iterable[Edge]:
    technique = _BY_ID[technique_id]
    for actor, role in _pairs(world):
        pass_role = world.allows(actor.id, "iam:PassRole", role.arn)
        if not pass_role.ok:
            continue
        launch = world.allows(actor.id, service_action, resource)
        if not launch.ok:
            continue
        match = Match(
            True,
            pass_role.conditional or launch.conditional,
            "%s; %s" % (pass_role.evidence, launch.evidence),
            "iam:PassRole",
            role.arn,
        )
        yield _mk(technique, actor.id, role.id, match)


def _passrole_lambda(world: World) -> Iterable[Edge]:
    return _passrole(world, "lambda:CreateFunction", "*", "passrole_lambda")


def _passrole_ec2(world: World) -> Iterable[Edge]:
    return _passrole(world, "ec2:RunInstances", "*", "passrole_ec2")


def _passrole_cloudformation(world: World) -> Iterable[Edge]:
    return _passrole(world, "cloudformation:CreateStack", "*", "passrole_cloudformation")


def _passrole_glue(world: World) -> Iterable[Edge]:
    return _passrole(world, "glue:CreateDevEndpoint", "*", "passrole_glue")


def _passrole_sagemaker(world: World) -> Iterable[Edge]:
    return _passrole(world, "sagemaker:CreateNotebookInstance", "*", "passrole_sagemaker")


def _lambda_update_code(world: World) -> Iterable[Edge]:
    technique = _BY_ID["lambda_update_code"]
    for actor in world.actors():
        for resource in world.resources.values():
            if resource.kind != "lambda" or resource.role not in world.identities:
                continue
            if resource.role == actor.id:
                continue
            update = world.allows(actor.id, "lambda:UpdateFunctionCode", resource.arn)
            if not update.ok:
                continue
            invoke = world.allows(actor.id, "lambda:InvokeFunction", resource.arn)
            if not invoke.ok:
                continue
            match = Match(
                True,
                update.conditional or invoke.conditional,
                "%s; %s" % (update.evidence, invoke.evidence),
                "lambda:UpdateFunctionCode",
                resource.arn,
            )
            yield _mk(technique, actor.id, resource.role, match)


def _ssm_send_command(world: World) -> Iterable[Edge]:
    technique = _BY_ID["ssm_send_command"]
    for actor in world.actors():
        for resource in world.resources.values():
            if resource.kind not in ("ec2", "ecs") or resource.role not in world.identities:
                continue
            if resource.role == actor.id:
                continue
            command = world.allows_any(actor.id, "ssm:SendCommand", [resource.arn, "*"])
            if not command.ok:
                continue
            describe = world.allows(actor.id, "ec2:DescribeInstances", "*")
            if not describe.ok:
                continue
            match = Match(
                True,
                command.conditional or describe.conditional,
                "%s; %s" % (command.evidence, describe.evidence),
                "ssm:SendCommand",
                resource.arn,
            )
            yield _mk(technique, actor.id, resource.role, match)


# ---------------------------------------------------------------------------
# Identity policy writes. These end at the administrator terminus when the
# target is the actor, because the actor can then grant itself anything.
# ---------------------------------------------------------------------------


def _self_policy_write(world: World, action: str, technique_id: str) -> Iterable[Edge]:
    technique = _BY_ID[technique_id]
    for actor in world.actors():
        if actor.kind != "user":
            continue
        match = world.allows(actor.id, action, actor.arn)
        if match.ok:
            yield _mk(technique, actor.id, ADMIN, match)
    # A member of a group inherits its policies, so a group that can write user
    # policies on `*` is an administrator factory for whoever joins it.
    for group in world.identities_of("group"):
        match = world.allows(group.id, action, "*")
        if match.ok:
            yield _mk(technique, group.id, ADMIN, match)


def _attach_user_policy(world: World) -> Iterable[Edge]:
    return _self_policy_write(world, "iam:AttachUserPolicy", "iam_attach_user_policy")


def _put_user_policy(world: World) -> Iterable[Edge]:
    return _self_policy_write(world, "iam:PutUserPolicy", "iam_put_user_policy")


def _policy_version(world: World, technique_id: str, action: str) -> Iterable[Edge]:
    """Rewrite a policy that is already attached, then benefit from it."""
    technique = _BY_ID[technique_id]
    for actor in world.actors():
        # A policy attached to the actor itself is the direct case; a policy on a
        # role the actor can assume is the indirect one.
        targets: List[str] = [actor.id]
        for role in world.roles():
            if role.id != actor.id and world.can_assume(actor.id, role.id).ok:
                targets.append(role.id)
        for target in targets:
            for attached in world.attached_policies(target):
                match = world.allows(actor.id, action, attached.arn)
                if not match.ok:
                    continue
                destination = ADMIN if target == actor.id else target
                yield _mk(technique, actor.id, destination, match)


def _create_policy_version(world: World) -> Iterable[Edge]:
    return _policy_version(world, "iam_create_policy_version", "iam:CreatePolicyVersion")


def _set_default_policy_version(world: World) -> Iterable[Edge]:
    return _policy_version(world, "iam_set_default_policy_version", "iam:SetDefaultPolicyVersion")


def _role_policy_write(world: World, action: str, technique_id: str) -> Iterable[Edge]:
    technique = _BY_ID[technique_id]
    for actor, role in _pairs(world):
        match = world.allows(actor.id, action, role.arn)
        if not match.ok:
            continue
        if role.id == actor.id:
            # A role rewriting a policy on its own ARN grants itself the change
            # immediately, no assumption step required.
            yield _mk(technique, actor.id, ADMIN, match)
        elif world.can_assume(actor.id, role.id).ok:
            yield _mk(technique, actor.id, role.id, match)


def _attach_role_policy(world: World) -> Iterable[Edge]:
    return _role_policy_write(world, "iam:AttachRolePolicy", "iam_attach_role_policy")


def _put_role_policy(world: World) -> Iterable[Edge]:
    return _role_policy_write(world, "iam:PutRolePolicy", "iam_put_role_policy")


def _update_assume_role_policy(world: World) -> Iterable[Edge]:
    technique = _BY_ID["iam_update_assume_role_policy"]
    for actor, role in _pairs(world):
        rewrite = world.allows(actor.id, "iam:UpdateAssumeRolePolicy", role.arn)
        if not rewrite.ok:
            continue
        assume = world.allows(actor.id, "sts:AssumeRole", role.arn)
        if not assume.ok:
            continue
        match = Match(
            True,
            rewrite.conditional or assume.conditional,
            "%s; %s" % (rewrite.evidence, assume.evidence),
            "iam:UpdateAssumeRolePolicy",
            role.arn,
        )
        yield _mk(technique, actor.id, role.id, match)


# ---------------------------------------------------------------------------
# Credentials for somebody else
# ---------------------------------------------------------------------------


def _credential_technique(world: World, action: str, technique_id: str) -> Iterable[Edge]:
    technique = _BY_ID[technique_id]
    for actor in world.actors():
        for user in world.identities_of("user"):
            if user.id == actor.id:
                continue
            match = world.allows(actor.id, action, user.arn)
            if match.ok:
                yield _mk(technique, actor.id, user.id, match)


def _create_access_key(world: World) -> Iterable[Edge]:
    return _credential_technique(world, "iam:CreateAccessKey", "iam_create_access_key")


def _create_login_profile(world: World) -> Iterable[Edge]:
    return _credential_technique(world, "iam:CreateLoginProfile", "iam_create_login_profile")


def _add_user_to_group(world: World) -> Iterable[Edge]:
    technique = _BY_ID["iam_add_user_to_group"]
    for actor in world.actors():
        for group in world.identities_of("group"):
            match = world.allows(actor.id, "iam:AddUserToGroup", group.arn)
            if match.ok:
                yield _mk(technique, actor.id, group.id, match)


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

_ASSUME_ROLE = Technique(
    id="assume_role",
    name="Cross-role assumption",
    category="trust",
    severity="medium",
    mitre="T1078.004",
    summary="The trust policy admits this principal and its policy allows sts:AssumeRole.",
    fix="Scope the trust policy to a role ARN or aws:PrincipalArn condition, not the account root.",
    actions=("sts:AssumeRole",),
    find=_assume_role,
)

_SPECS: Sequence[Technique] = (
    _ASSUME_ROLE,
    Technique(
        id="passrole_lambda",
        name="PassRole into Lambda",
        category="compute",
        severity="critical",
        mitre="T1098.001",
        summary="Pass a privileged role to a new function, then invoke it.",
        fix="Restrict iam:PassRole with iam:PassedToService and an explicit role allowlist.",
        actions=("iam:PassRole", "lambda:CreateFunction", "lambda:InvokeFunction"),
        find=_passrole_lambda,
    ),
    Technique(
        id="passrole_ec2",
        name="PassRole into EC2",
        category="compute",
        severity="critical",
        mitre="T1098.001",
        summary="Launch an instance with an instance profile and read its metadata credentials.",
        fix="Deny iam:PassRole for EC2 unless the caller owns the instance profile.",
        actions=("iam:PassRole", "ec2:RunInstances"),
        find=_passrole_ec2,
    ),
    Technique(
        id="passrole_cloudformation",
        name="PassRole into CloudFormation",
        category="compute",
        severity="critical",
        mitre="T1098.001",
        summary="Create a stack with a service role and let the template call IAM.",
        fix="Deny cloudformation:CreateStack with a RoleARN outside the team boundary.",
        actions=("iam:PassRole", "cloudformation:CreateStack"),
        find=_passrole_cloudformation,
    ),
    Technique(
        id="passrole_glue",
        name="PassRole into Glue",
        category="compute",
        severity="critical",
        mitre="T1098.001",
        summary="Create a development endpoint that runs with the passed role.",
        fix="Block glue:CreateDevEndpoint, or pin iam:PassRole to a known role.",
        actions=("iam:PassRole", "glue:CreateDevEndpoint"),
        find=_passrole_glue,
    ),
    Technique(
        id="passrole_sagemaker",
        name="PassRole into SageMaker",
        category="compute",
        severity="critical",
        mitre="T1098.001",
        summary="Create a notebook instance with the passed role, then open its terminal.",
        fix="Deny sagemaker:CreateNotebookInstance with an arbitrary execution role.",
        actions=("iam:PassRole", "sagemaker:CreateNotebookInstance"),
        find=_passrole_sagemaker,
    ),
    Technique(
        id="lambda_update_code",
        name="Rewrite a function's code",
        category="compute",
        severity="critical",
        mitre="T1648",
        summary="Replace the handler of an existing function that already holds a strong role.",
        fix="Separate UpdateFunctionCode permission from InvokeFunction on production functions.",
        actions=("lambda:UpdateFunctionCode", "lambda:InvokeFunction"),
        find=_lambda_update_code,
    ),
    Technique(
        id="ssm_send_command",
        name="Shell through SSM",
        category="compute",
        severity="high",
        mitre="T1651",
        summary="Run a command on an instance and use its instance profile.",
        fix="Scope ssm:SendCommand to document ARNs and tag-gated instances.",
        actions=("ssm:SendCommand", "ec2:DescribeInstances"),
        find=_ssm_send_command,
    ),
    Technique(
        id="iam_attach_user_policy",
        name="Attach a policy to yourself",
        category="identity",
        severity="critical",
        mitre="T1098.003",
        summary="Attach AdministratorAccess to your own user and inherit it.",
        fix="No human or machine identity should hold iam:AttachUserPolicy on its own ARN.",
        actions=("iam:AttachUserPolicy",),
        find=_attach_user_policy,
    ),
    Technique(
        id="iam_put_user_policy",
        name="Write an inline policy on yourself",
        category="identity",
        severity="critical",
        mitre="T1098.003",
        summary="Add an inline administrator statement to your own user.",
        fix="Treat iam:PutUserPolicy on self as equivalent to administrator.",
        actions=("iam:PutUserPolicy",),
        find=_put_user_policy,
    ),
    Technique(
        id="iam_create_policy_version",
        name="New version of an attached policy",
        category="identity",
        severity="critical",
        mitre="T1098.003",
        summary="Publish a new policy version that grants more than the current one.",
        fix="CreatePolicyVersion on a policy you can also attach is a standing admin grant.",
        actions=("iam:CreatePolicyVersion",),
        find=_create_policy_version,
    ),
    Technique(
        id="iam_set_default_policy_version",
        name="Activate a dormant policy version",
        category="identity",
        severity="critical",
        mitre="T1098.003",
        summary="Promote an older, wider policy version that is still stored.",
        fix="Delete unused policy versions and block SetDefaultPolicyVersion.",
        actions=("iam:SetDefaultPolicyVersion",),
        find=_set_default_policy_version,
    ),
    Technique(
        id="iam_attach_role_policy",
        name="Attach a policy to a trusted role",
        category="identity",
        severity="critical",
        mitre="T1098.003",
        summary="Attach an administrator policy to a role you can already assume.",
        fix="Only a break-glass pipeline should hold iam:AttachRolePolicy.",
        actions=("iam:AttachRolePolicy",),
        find=_attach_role_policy,
    ),
    Technique(
        id="iam_put_role_policy",
        name="Inline policy on a trusted role",
        category="identity",
        severity="critical",
        mitre="T1098.003",
        summary="Write an inline administrator statement onto a role you can assume.",
        fix="Block iam:PutRolePolicy outside the IAM administration role.",
        actions=("iam:PutRolePolicy",),
        find=_put_role_policy,
    ),
    Technique(
        id="iam_update_assume_role_policy",
        name="Rewrite a trust policy",
        category="trust",
        severity="critical",
        mitre="T1098.003",
        summary="Add yourself to a role's trust policy, then assume it.",
        fix="iam:UpdateAssumeRolePolicy belongs only to the identity plane, never to workloads.",
        actions=("iam:UpdateAssumeRolePolicy", "sts:AssumeRole"),
        find=_update_assume_role_policy,
    ),
    Technique(
        id="iam_create_access_key",
        name="Mint credentials for another user",
        category="identity",
        severity="high",
        mitre="T1098.001",
        summary="Create an access key for a user with more access than you.",
        fix="Deny iam:CreateAccessKey on all principals except a tightly held recovery role.",
        actions=("iam:CreateAccessKey",),
        find=_create_access_key,
    ),
    Technique(
        id="iam_create_login_profile",
        name="Set a console password for another user",
        category="identity",
        severity="high",
        mitre="T1098.001",
        summary="Create a console login for a stronger identity without touching its keys.",
        fix="Alert on CreateLoginProfile and UpdateLoginProfile outside the IdP flow.",
        actions=("iam:CreateLoginProfile",),
        find=_create_login_profile,
    ),
    Technique(
        id="iam_add_user_to_group",
        name="Join a more privileged group",
        category="identity",
        severity="high",
        mitre="T1098.003",
        summary="Add yourself to a group that carries wider policies.",
        fix="Group membership changes are privilege changes; route them through review.",
        actions=("iam:AddUserToGroup",),
        find=_add_user_to_group,
    ),
)

TECHNIQUES: Tuple[Technique, ...] = _SPECS
_BY_ID = {technique.id: technique for technique in TECHNIQUES}


def find(technique_id: str) -> Optional[Technique]:
    return _BY_ID.get(technique_id)


def registry() -> List[dict]:
    """Serialisable registry for the documentation site and `apsis techniques`."""
    return [
        {
            "id": technique.id,
            "name": technique.name,
            "category": technique.category,
            "severity": technique.severity,
            "mitre": technique.mitre,
            "summary": technique.summary,
            "fix": technique.fix,
            "actions": list(technique.actions),
        }
        for technique in TECHNIQUES
    ]
