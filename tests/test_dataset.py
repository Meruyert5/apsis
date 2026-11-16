"""Dataset invariants for the rebuilt site.

These pin the things the site now depends on: sixteen accounts, more than a
hundred identities, and at least one route that is genuinely deep. A fixture
that loses its depth still passes the structural suite, so the depth needs its
own test.
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
from apsis.graph import Survey  # noqa: E402

DIRECTORIES = sorted(
    os.path.dirname(path)
    for path in glob.glob(os.path.join(ROOT, "scenarios", "*", "account.json"))
)

#: The four purpose-built accounts added for the first rebuild. These carry a
#: deep signature route, so the depth invariants below apply to them.
NEW_FIXTURES = ("fintech", "healthcare", "games-studio", "gov-contractor")

#: Five variants added to widen the coverage matrix. They reuse the shape of an
#: existing account and are not required to have a deep signature route.
VARIANT_FIXTURES = ("retail", "media", "research", "logistics", "platform")


def survey(name: str) -> Survey:
    return build(load_scenario(os.path.join(ROOT, "scenarios", name, "account.json")))


def signature_route(survey_: Survey):
    source = survey_.scenario.signature_source
    if not source:
        return None
    routes = pathmod.all_paths(survey_, limit=4)
    group = routes.get(source)
    return group[0] if group else None


class DatasetSize(unittest.TestCase):
    def test_sixteen_accounts(self) -> None:
        self.assertEqual(len(DIRECTORIES), 16)

    def test_more_than_a_hundred_identities(self) -> None:
        total = sum(len(survey(os.path.basename(name)).world.identities) for name in DIRECTORIES)
        self.assertGreaterEqual(total, 100)
        self.assertLessEqual(total, 400, "fixtures should stay readable, not just large")

    def test_more_than_forty_escalation_edges(self) -> None:
        total = sum(len(survey(os.path.basename(name)).edges) for name in DIRECTORIES)
        self.assertGreaterEqual(total, 44)

    def test_the_new_fixtures_exist(self) -> None:
        names = {os.path.basename(name) for name in DIRECTORIES}
        for fixture in NEW_FIXTURES + VARIANT_FIXTURES:
            with self.subTest(fixture=fixture):
                self.assertIn(fixture, names)


class RouteDepth(unittest.TestCase):
    def test_every_signature_route_is_at_least_five_hops(self) -> None:
        for fixture in NEW_FIXTURES:
            with self.subTest(fixture=fixture):
                route = signature_route(survey(fixture))
                self.assertIsNotNone(route, "%s has no signature route" % fixture)
                self.assertGreaterEqual(route.hops, 5)

    def test_at_least_one_seven_hop_route(self) -> None:
        deepest = 0
        for name in DIRECTORIES:
            routes = pathmod.all_paths(survey(os.path.basename(name)), limit=4)
            for group in routes.values():
                for route in group:
                    deepest = max(deepest, route.hops)
        self.assertGreaterEqual(deepest, 7)

    def test_no_signature_route_exceeds_seven_hops(self) -> None:
        for fixture in NEW_FIXTURES:
            with self.subTest(fixture=fixture):
                route = signature_route(survey(fixture))
                self.assertLessEqual(route.hops, 7)


class FixtureShape(unittest.TestCase):
    def test_labels_are_unique_inside_a_fixture(self) -> None:
        for name in DIRECTORIES:
            fixture = survey(os.path.basename(name))
            labels = [identity.label for identity in fixture.world.identities.values()]
            with self.subTest(fixture=os.path.basename(name)):
                self.assertEqual(len(labels), len(set(labels)), "duplicate identity labels")

    def test_account_ids_are_obviously_fictional(self) -> None:
        for name in DIRECTORIES:
            fixture = survey(os.path.basename(name))
            account = fixture.scenario.account_id
            with self.subTest(fixture=os.path.basename(name)):
                self.assertRegex(account, r"^[0-9]{12}$")
                self.assertNotEqual(account, "123456789012")
                self.assertNotEqual(account, "111111111111")

    def test_every_fixture_keeps_a_route_after_minimum_cut(self) -> None:
        """The site's Survey section severs edges; the engine's cut must agree."""
        from apsis.sever import minimum_edge_cut

        for name in DIRECTORIES:
            fixture = survey(os.path.basename(name))
            if not pathmod.all_paths(fixture):
                continue
            cut = minimum_edge_cut(fixture)
            with self.subTest(fixture=os.path.basename(name)):
                self.assertGreater(cut.size, 0)
                self.assertLessEqual(cut.size, len(fixture.edges))

    def test_fintech_signature_uses_four_permission_classes(self) -> None:
        """The Chain section needs one route with four distinct classes."""
        fixture = survey("fintech")
        route = signature_route(fixture)
        classes = {
            _grant_class(fixture.edges[int(edge_id[1:])].technique) for edge_id in route.edges
        }
        self.assertEqual(len(classes), 4)


def _grant_class(technique: str) -> str:
    if technique == "assume_role":
        return "trust"
    if technique.startswith("passrole_"):
        return "passrole"
    if technique == "iam_update_assume_role_policy":
        return "rewrite"
    if technique.startswith("iam_attach_") or technique.startswith("iam_put_"):
        return "write"
    if technique in ("iam_create_policy_version", "iam_set_default_policy_version"):
        return "write"
    return "other"


if __name__ == "__main__":
    unittest.main()
