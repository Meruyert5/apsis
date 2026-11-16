from __future__ import annotations

import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import build, load_scenario  # noqa: E402
from apsis.diff import compare  # noqa: E402


def survey(name: str):
    return build(load_scenario(os.path.join(ROOT, "scenarios", name, "account.json")))


class DriftTest(unittest.TestCase):
    def test_pull_request_introduces_one_edge_and_two_routes(self) -> None:
        drift = compare(survey("ci-cd"), survey("ci-cd-after"))
        self.assertEqual(len(drift.added), 1)
        self.assertEqual(drift.removed, [])
        self.assertEqual(len(drift.new_routes), 2)
        self.assertTrue(drift.worsened)
        self.assertEqual(drift.before_sources, 0)
        self.assertEqual(drift.after_sources, 2)

    def test_added_edge_names_the_technique(self) -> None:
        drift = compare(survey("ci-cd"), survey("ci-cd-after"))
        edge = drift.added[0]
        self.assertEqual(edge.technique, "passrole_lambda")
        self.assertEqual(edge.source, "gha-deploy")
        self.assertEqual(edge.target, "platform-admin")

    def test_reverse_direction_is_a_fix(self) -> None:
        drift = compare(survey("ci-cd-after"), survey("ci-cd"))
        self.assertEqual(len(drift.removed), 1)
        self.assertFalse(drift.worsened)
        self.assertEqual(len(drift.lost_routes), 2)

    def test_identical_snapshots(self) -> None:
        drift = compare(survey("startup"), survey("startup"))
        self.assertFalse(drift.worsened)
        self.assertEqual(drift.added, [])
        self.assertEqual(drift.removed, [])


if __name__ == "__main__":
    unittest.main()
