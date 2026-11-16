"""Every fixture must satisfy the invariants the engine assumes.

These are deliberately structural rather than count-based: a fixture can grow
without breaking the suite, but it cannot ship a dangling edge or a path that
ends anywhere other than administrator.
"""

from __future__ import annotations

import glob
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import build, load_scenario  # noqa: E402
from apsis import paths as pathmod  # noqa: E402
from apsis.sever import sever  # noqa: E402

SCENARIOS = sorted(
    os.path.dirname(path)
    for path in glob.glob(os.path.join(ROOT, "scenarios", "*", "account.json"))
)


class FixtureInvariants(unittest.TestCase):
    def test_scenarios_exist(self) -> None:
        self.assertGreaterEqual(len(SCENARIOS), 6)

    def test_each_fixture(self) -> None:
        for directory in SCENARIOS:
            with self.subTest(fixture=os.path.basename(directory)):
                survey = build(load_scenario(os.path.join(directory, "account.json")))
                name = survey.scenario.name

                self.assertTrue(survey.admin_ids(), "%s has no administrator" % name)

                for edge in survey.edges:
                    self.assertIn(edge.source, survey.nodes, edge)
                    self.assertIn(edge.target, survey.nodes, edge)
                    self.assertNotEqual(edge.source, edge.target, edge)
                    self.assertTrue(edge.evidence, edge)

                for source, routes in pathmod.all_paths(survey, limit=2).items():
                    for route in routes:
                        self.assertEqual(route.nodes[0], source)
                        self.assertTrue(survey.nodes[route.nodes[-1]].admin, route)

                result = sever(survey)
                self.assertEqual(result.routes_after, 0, "%s does not close" % name)

    def test_startup_is_worse_than_the_clean_fixture(self) -> None:
        startup = build(load_scenario(os.path.join(ROOT, "scenarios", "startup", "account.json")))
        clean = build(load_scenario(os.path.join(ROOT, "scenarios", "ci-cd", "account.json")))
        self.assertGreater(len(pathmod.all_paths(startup)), 0)
        self.assertEqual(len(pathmod.all_paths(clean)), 0)


if __name__ == "__main__":
    unittest.main()
