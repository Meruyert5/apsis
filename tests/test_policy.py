from __future__ import annotations

import json
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import policy  # noqa: E402
from apsis.model import Statement  # noqa: E402


def statement(**kwargs) -> Statement:
    base = {"Effect": "Allow", "Action": ["s3:GetObject"], "Resource": ["*"]}
    base.update(kwargs)
    return policy.parse_statement(base)


class MatchingTest(unittest.TestCase):
    def test_service_wildcard(self) -> None:
        self.assertTrue(policy.matches("iam:*", "iam:PassRole"))
        self.assertFalse(policy.matches("iam:*", "sts:AssumeRole"))
        self.assertTrue(policy.matches("*", "anything:AtAll"))

    def test_read_only_prefix_does_not_match_writes(self) -> None:
        self.assertFalse(policy.matches("*:Get*", "iam:PassRole"))
        self.assertTrue(policy.matches("*:Get*", "secretsmanager:GetSecretValue"))

    def test_not_action(self) -> None:
        item = statement(NotAction=["iam:*"], Action=None)
        allowed, _ = policy.evaluate([item], "s3:PutObject", "arn:aws:s3:::bucket/x")
        self.assertTrue(allowed)
        allowed, _ = policy.evaluate([item], "iam:PassRole", "arn:aws:iam::1:role/r")
        self.assertFalse(allowed)

    def test_deny_beats_allow(self) -> None:
        allow = statement(Action=["*"], Resource=["*"])
        deny = statement(Effect="Deny", Action=["iam:PassRole"], Resource=["*"])
        allowed, _ = policy.evaluate([allow, deny], "iam:PassRole", "arn:aws:iam::1:role/r")
        self.assertFalse(allowed)

    def test_condition_is_kept_but_not_trusted(self) -> None:
        guarded = statement(Condition={"StringEquals": {"aws:RequestedRegion": "eu-west-1"}})
        allowed, matched = policy.evaluate([guarded], "s3:GetObject", "arn:aws:s3:::b/k")
        self.assertTrue(allowed)
        self.assertIsNotNone(matched)
        self.assertTrue(matched.conditional)


class AdminDetectionTest(unittest.TestCase):
    def test_full_admin(self) -> None:
        statements = [statement(Action=["*"], Resource=["*"])]
        self.assertTrue(policy.grants_full_admin(statements))

    def test_iam_star_is_account_takeover(self) -> None:
        statements = [statement(Action=["iam:*"], Resource=["*"])]
        self.assertFalse(policy.grants_full_admin(statements))
        self.assertTrue(policy.is_account_takeover(statements))

    def test_scoped_actions_are_not_admin(self) -> None:
        statements = [statement(Action=["lambda:UpdateFunctionCode"], Resource=["*"])]
        self.assertFalse(policy.grants_full_admin(statements))
        self.assertFalse(policy.is_account_takeover(statements))

    def test_conditional_admin_is_not_admin(self) -> None:
        statements = [statement(Action=["*"], Resource=["*"], Condition={"Bool": {"aws:SecureTransport": "true"}})]
        self.assertFalse(policy.grants_full_admin(statements))


class ParseTest(unittest.TestCase):
    def test_full_document(self) -> None:
        document = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Action": ["s3:GetObject"], "Resource": ["*"]}],
        }
        self.assertEqual(len(policy.parse_document(document)), 1)

    def test_statement_list(self) -> None:
        document = [{"Effect": "Allow", "Action": "s3:*", "Resource": "*"}]
        statements = policy.parse_document(document)
        self.assertEqual(statements[0].actions, ("s3:*",))


if __name__ == "__main__":
    unittest.main()
