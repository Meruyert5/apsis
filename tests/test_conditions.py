from __future__ import annotations

import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import policy  # noqa: E402
from apsis.model import Identity, Resource, Scenario  # noqa: E402
from apsis.policy import ConditionContext, evaluate, evaluate_condition, parse_statement  # noqa: E402
from apsis.world import World  # noqa: E402

ACCOUNT = "111122223333"
ALICE = "arn:aws:iam::%s:user/alice" % ACCOUNT
BOB = "arn:aws:iam::%s:user/bob" % ACCOUNT


class ConditionTest(unittest.TestCase):
    def test_string_equals_and_wildcards(self):
        ctx = ConditionContext(principal_arn=ALICE)
        self.assertTrue(evaluate_condition(
            {"StringEquals": {"aws:PrincipalArn": ALICE}}, ctx
        ))
        self.assertFalse(evaluate_condition(
            {"StringEquals": {"aws:PrincipalArn": BOB}}, ctx
        ))
        self.assertTrue(evaluate_condition(
            {"ArnLike": {"aws:PrincipalArn": "arn:aws:iam::%s:user/*" % ACCOUNT}}, ctx
        ))

    def test_bool_transport_and_mfa(self):
        self.assertTrue(evaluate_condition(
            {"Bool": {"aws:SecureTransport": "true"}}, ConditionContext()
        ))
        self.assertIsNone(evaluate_condition(
            {"Bool": {"aws:MultiFactorAuthPresent": "true"}}, ConditionContext()
        ))
        self.assertTrue(evaluate_condition(
            {"Bool": {"aws:MultiFactorAuthPresent": "true"}}, ConditionContext(mfa=True)
        ))

    def test_ip_and_source(self):
        ctx = ConditionContext(source_vpce="vpce-123", source_arn="arn:aws:lambda:eu-west-2:1:function:f")
        self.assertTrue(evaluate_condition(
            {"StringEquals": {"aws:SourceVpce": "vpce-123"}}, ctx
        ))
        self.assertTrue(evaluate_condition(
            {"IpAddress": {"aws:SourceIp": "203.0.113.0/24"}}, ConditionContext()
        ) is None)  # no source IP supplied: unknown, not a false result
        self.assertFalse(evaluate_condition(
            {"StringEquals": {"aws:SourceVpce": "vpce-999"}}, ctx
        ))

    def test_false_condition_removes_the_statement(self):
        statement = parse_statement({
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "*",
            "Condition": {"StringEquals": {"aws:PrincipalArn": BOB}},
        })
        allowed, _ = evaluate([statement], "s3:GetObject", "arn:aws:s3:::b/k", ConditionContext(principal_arn=ALICE))
        self.assertFalse(allowed)
        allowed, _ = evaluate([statement], "s3:GetObject", "arn:aws:s3:::b/k", ConditionContext(principal_arn=BOB))
        self.assertTrue(allowed)

    def test_unknown_condition_stays_possible_but_conditional(self):
        statement = parse_statement({
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "*",
            "Condition": {"StringEquals": {"aws:PrincipalOrgID": "o-abc123"}},
        })
        allowed, allowing = evaluate([statement], "s3:GetObject", "arn:aws:s3:::b/k", ConditionContext())
        self.assertTrue(allowed)
        self.assertIs(policy.condition_verdict(allowing, ConditionContext()), None)


class ResourcePolicyTest(unittest.TestCase):
    def world(self, principal, effect="Allow"):
        scenario = Scenario(
            name="test",
            title="test",
            account_id=ACCOUNT,
            region="us-east-1",
            summary="",
        )
        scenario.identities["alice"] = Identity(
            id="alice", label="Alice", kind="user", arn=ALICE
        )
        scenario.resources["bucket"] = Resource(
            id="bucket",
            label="bucket",
            kind="ec2",
            arn="arn:aws:s3:::bucket/*",
            policy={
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": effect,
                    "Principal": {"AWS": principal},
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::bucket/*",
                }],
            },
        )
        return World(scenario)

    def test_resource_policy_can_allow_an_identity_policy_miss(self):
        world = self.world("*")
        match = world.allows("alice", "s3:GetObject", "arn:aws:s3:::bucket/key")
        self.assertTrue(match.ok)
        self.assertIn("resource policy", match.evidence)

    def test_resource_policy_principal_is_checked(self):
        world = self.world(BOB)
        self.assertFalse(world.allows("alice", "s3:GetObject", "arn:aws:s3:::bucket/key").ok)

    def test_resource_policy_deny_wins(self):
        world = self.world("*", effect="Deny")
        self.assertFalse(world.allows("alice", "s3:GetObject", "arn:aws:s3:::bucket/key").ok)

    def test_identity_condition_is_evaluated_against_the_identity(self):
        world = self.world(BOB)
        # The resource policy is for Bob; Alice cannot use it.
        match = world.allows("alice", "s3:GetObject", "arn:aws:s3:::bucket/key")
        self.assertFalse(match.ok)


if __name__ == "__main__":
    unittest.main()
