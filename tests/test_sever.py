from __future__ import annotations

import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import build, load_scenario  # noqa: E402
from apsis import paths as pathmod  # noqa: E402
from apsis.sever import (  # noqa: E402
    count_reachable_sources,
    minimum_edge_cut,
    permission_cut,
    sever,
)


def survey(name: str):
    return build(load_scenario(os.path.join(ROOT, "scenarios", name, "account.json")))


class SeverTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.survey = survey("startup")

    def test_severing_closes_the_account(self) -> None:
        result = sever(self.survey)
        self.assertEqual(result.routes_before, 6)
        self.assertEqual(result.routes_after, 0)
        self.assertTrue(result.closed)

    def test_edge_cut_is_minimal_and_effective(self) -> None:
        cut = minimum_edge_cut(self.survey)
        self.assertEqual(cut.size, 3)
        blocked = set(cut.edges)
        self.assertEqual(count_reachable_sources(self.survey, blocked), 0)
        # Dropping any one edge from the cut must reopen at least one route.
        for edge in cut.edges:
            self.assertGreater(count_reachable_sources(self.survey, blocked - {edge}), 0)

    def test_permission_cut_removes_actions_not_edges(self) -> None:
        steps = permission_cut(self.survey)
        self.assertTrue(steps)
        self.assertEqual(steps[0].action, "sts:AssumeRole")
        self.assertGreater(steps[0].routes_killed, 0)

    def test_partial_revocation_keeps_the_rest(self) -> None:
        result = sever(self.survey, revoke_actions=["sts:AssumeRole"])
        self.assertEqual(result.routes_before, 6)
        self.assertGreater(result.routes_after_revoke, 0)
        self.assertFalse(result.revoke_closed)
        # The recommended remediation still finishes the job.
        self.assertTrue(result.closed)

    def test_clean_account_has_nothing_to_sever(self) -> None:
        clean = survey("ci-cd")
        result = sever(clean)
        self.assertEqual(result.routes_before, 0)
        self.assertEqual(result.edge_cut.size, 0)
        self.assertTrue(result.closed)


if __name__ == "__main__":
    unittest.main()
