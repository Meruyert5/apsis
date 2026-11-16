from __future__ import annotations

import glob
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import build, load_scenario, report, techniques  # noqa: E402
from apsis import paths as pathmod  # noqa: E402
from apsis.model import ADMIN  # noqa: E402
from apsis.policy import evaluate, parse_statement  # noqa: E402
from apsis.sever import sever  # noqa: E402

FIXTURES = sorted(glob.glob(os.path.join(ROOT, "scenarios", "*", "account.json")))


def survey(name: str):
    return build(load_scenario(os.path.join(ROOT, "scenarios", name, "account.json")))


class RegistryTest(unittest.TestCase):
    def test_eighteen_techniques(self) -> None:
        self.assertEqual(len(techniques.TECHNIQUES), 18)

    def test_every_technique_has_a_fix_and_mitre_id(self) -> None:
        for item in techniques.TECHNIQUES:
            self.assertTrue(item.fix, item.id)
            self.assertRegex(item.mitre, r"^T\d{4}", item.id)


class LayoutTest(unittest.TestCase):
    def test_every_fixture_stays_in_the_unit_box(self) -> None:
        for path in FIXTURES:
            survey_instance = build(load_scenario(path))
            for node in survey_instance.nodes.values():
                self.assertGreaterEqual(node.x, 0.0, node.id)
                self.assertLessEqual(node.x, 1.0, node.id)
                self.assertGreaterEqual(node.y, 0.0, node.id)
                self.assertLessEqual(node.y, 1.0, node.id)


class TrustTest(unittest.TestCase):
    def test_root_trust_admits_an_identity_in_the_account(self) -> None:
        instance = survey("startup")
        self.assertTrue(instance.world.trusts("data-eng", "app-runtime"))

    def test_absent_trust_is_refused(self) -> None:
        instance = survey("startup")
        self.assertFalse(instance.world.trusts("app-runtime", "billing-analyst"))


class PolicyTest(unittest.TestCase):
    def test_not_resource_blocks_the_named_arn(self) -> None:
        statement = parse_statement({
            "Effect": "Allow",
            "Action": "s3:*",
            "NotResource": "arn:aws:s3:::secret/*",
        })
        self.assertFalse(evaluate([statement], "s3:GetObject", "arn:aws:s3:::secret/key")[0])
        self.assertTrue(evaluate([statement], "s3:GetObject", "arn:aws:s3:::public/key")[0])


class ReportTest(unittest.TestCase):
    def test_sarif_rules_cover_the_registry(self) -> None:
        payload = report.sarif(survey("startup"))
        rule_ids = {rule["id"] for rule in payload["runs"][0]["tool"]["driver"]["rules"]}
        self.assertEqual(rule_ids, {item.id for item in techniques.TECHNIQUES})

    def test_signature_route_matches_the_declared_source(self) -> None:
        instance = survey("startup")
        bundle = report.web_bundle(instance)
        self.assertEqual(bundle["signature"]["nodes"][0], "support-contractor")
        self.assertEqual(bundle["signature"]["nodes"][-1], "platform-admin")


class SeverTest(unittest.TestCase):
    def test_revoking_one_action_leaves_a_measurable_remainder(self) -> None:
        result = sever(survey("startup"), revoke_actions=["sts:AssumeRole"])
        self.assertEqual(result.routes_before, 6)
        self.assertLess(result.routes_after_revoke, result.routes_before)
        self.assertGreater(result.routes_after_revoke, 0)

    def test_no_mutating_admin_node_is_a_source(self) -> None:
        for path in FIXTURES:
            instance = build(load_scenario(path))
            self.assertNotIn(ADMIN, instance.sources())


if __name__ == "__main__":
    unittest.main()
