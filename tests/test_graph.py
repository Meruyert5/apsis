from __future__ import annotations

import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import build, load_scenario  # noqa: E402
from apsis import paths as pathmod  # noqa: E402
from apsis.model import ADMIN  # noqa: E402


def survey(name: str):
    return build(load_scenario(os.path.join(ROOT, "scenarios", name, "account.json")))


class StartupFixtureTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.survey = survey("startup")

    def test_shape(self) -> None:
        self.assertEqual(len(self.survey.nodes), 12)
        self.assertEqual(len(self.survey.edges), 9)

    def test_administrators_never_act_as_attackers(self) -> None:
        for edge in self.survey.edges:
            self.assertNotIn(edge.source, self.survey.admin_ids(), edge)

    def test_no_self_loops(self) -> None:
        for edge in self.survey.edges:
            self.assertNotEqual(edge.source, edge.target)

    def test_signature_route(self) -> None:
        route = pathmod.shortest_route(self.survey, "support-contractor")
        self.assertIsNotNone(route)
        assert route is not None
        self.assertEqual(route.hops, 4)
        techniques = [self.survey.edges[int(edge[1:])].technique for edge in route.edges]
        self.assertEqual(
            techniques,
            ["iam_create_access_key", "passrole_lambda", "assume_role", "assume_role"],
        )
        self.assertEqual(route.nodes[0], "support-contractor")
        self.assertTrue(self.survey.nodes[route.nodes[-1]].admin)

    def test_every_route_ends_at_an_administrator(self) -> None:
        for source, group in pathmod.all_paths(self.survey).items():
            for route in group:
                self.assertEqual(route.source, source)
                self.assertTrue(self.survey.nodes[route.nodes[-1]].admin)

    def test_clean_identity_has_no_route(self) -> None:
        self.assertFalse(pathmod.paths_from(self.survey, "billing-analyst"))

    def test_conditional_edges_are_flagged(self) -> None:
        conditional = [edge for edge in self.survey.edges if edge.conditional]
        self.assertTrue(conditional)
        self.assertTrue(all(edge.evidence for edge in conditional))

    def test_layout_is_normalised(self) -> None:
        for node in self.survey.nodes.values():
            self.assertGreaterEqual(node.x, 0.0)
            self.assertLessEqual(node.x, 1.0)
            self.assertGreaterEqual(node.y, 0.0)
            self.assertLessEqual(node.y, 1.0)


class EnterpriseFixtureTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.survey = survey("enterprise")

    def test_group_membership_is_an_escalation_path(self) -> None:
        route = pathmod.shortest_route(self.survey, "vendor-auditor")
        self.assertIsNotNone(route)
        assert route is not None
        self.assertIn("security", route.nodes)
        self.assertEqual(route.nodes[-1], ADMIN)

    def test_ssm_route_reaches_the_instance_role(self) -> None:
        route = pathmod.shortest_route(self.survey, "contractor-dev")
        self.assertIsNotNone(route)
        assert route is not None
        self.assertEqual(route.nodes[1], "build-role")

    def test_identity_without_a_path(self) -> None:
        self.assertFalse(pathmod.paths_from(self.survey, "finance-reader"))


class CleanFixtureTest(unittest.TestCase):
    def test_ci_cd_is_clean(self) -> None:
        clean = survey("ci-cd")
        self.assertEqual(pathmod.all_paths(clean), {})

    def test_ci_cd_after_the_pull_request_is_not(self) -> None:
        dirty = survey("ci-cd-after")
        routes = pathmod.all_paths(dirty)
        self.assertIn("gha-deploy", routes)
        self.assertTrue(all(route.hops <= 2 for group in routes.values() for route in group))


if __name__ == "__main__":
    unittest.main()
