from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import aws_import  # noqa: E402


DETAILS = {
    "UserDetailList": [{
        "UserName": "alice",
        "Arn": "arn:aws:iam::111122223333:user/alice",
        "GroupList": ["developers"],
        "AttachedManagedPolicies": [{"PolicyArn": "arn:aws:iam::111122223333:policy/ReadOnly"}],
        "UserPolicyList": [{
            "PolicyName": "inline",
            "PolicyDocument": {"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Action": "s3:GetObject", "Resource": "*"}]},
        }],
    }],
    "GroupDetailList": [{
        "GroupName": "developers",
        "Arn": "arn:aws:iam::111122223333:group/developers",
        "AttachedManagedPolicies": [],
        "GroupPolicyList": [],
    }],
    "RoleDetailList": [{
        "RoleName": "deploy",
        "Arn": "arn:aws:iam::111122223333:role/deploy",
        "Description": "Deployment",
        "AssumeRolePolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Principal": {"AWS": "arn:aws:iam::111122223333:root"}, "Action": "sts:AssumeRole"}],
        },
        "AttachedManagedPolicies": [{"PolicyArn": "arn:aws:iam::111122223333:policy/ReadOnly"}],
        "RolePolicyList": [],
    }],
    "Policies": [{
        "PolicyName": "ReadOnly",
        "Arn": "arn:aws:iam::111122223333:policy/ReadOnly",
        "PolicyVersionList": [{
            "IsDefaultVersion": True,
            "Document": urllib.parse.quote(json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Action": "s3:Get*", "Resource": "*"}],
            })),
        }],
    }],
}


class ImportTest(unittest.TestCase):
    def test_converter_keeps_users_groups_roles_and_policies(self):
        scenario = aws_import.convert(DETAILS, name="imported")
        self.assertEqual(scenario["account_id"], "111122223333")
        identities = {item["id"]: item for item in scenario["identities"]}
        self.assertIn("user-alice", identities)
        self.assertIn("group-developers", identities)
        self.assertIn("role-deploy", identities)
        self.assertEqual(identities["user-alice"]["groups"], ["group-developers"])
        self.assertTrue(identities["user-alice"]["attached"])
        self.assertTrue(identities["role-deploy"]["trust"])
        self.assertTrue(any("111122223333" in item for item in identities["role-deploy"]["trust"]))

    def test_managed_policy_document_is_url_decoded(self):
        scenario = aws_import.convert(DETAILS)
        policy = next(item for item in scenario["policies"].values() if item["Name"] == "ReadOnly")
        self.assertEqual(policy["Document"]["Statement"][0]["Action"], "s3:Get*")

    def test_from_file_writes_a_loadable_scenario(self):
        with tempfile.TemporaryDirectory() as directory:
            source = os.path.join(directory, "details.json")
            target = os.path.join(directory, "account.json")
            with open(source, "w", encoding="utf-8") as handle:
                json.dump(DETAILS, handle)
            scenario = aws_import.from_file(target, source, name="imported")
            with open(target, encoding="utf-8") as handle:
                loaded = json.load(handle)
            self.assertEqual(loaded["name"], "imported")
            self.assertEqual(len(loaded["identities"]), len(scenario["identities"]))
            self.assertEqual(loaded["account_id"], "111122223333")


if __name__ == "__main__":
    unittest.main()
