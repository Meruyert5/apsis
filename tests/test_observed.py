from __future__ import annotations

import glob
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import observed, report  # noqa: E402
from apsis.graph import build  # noqa: E402
from apsis.world import load_scenario  # noqa: E402


def survey(name: str):
    return build(load_scenario(os.path.join(ROOT, "scenarios", name, "account.json")))


class ObservedTest(unittest.TestCase):
    def test_case_cloudtrail_marks_the_signature_route(self):
        game = survey("games-studio")
        events = observed.load_events(os.path.join(ROOT, "cases", "01-observed-path", "cloudtrail.json"))
        result = observed.overlay(game, events)
        self.assertEqual(result.events, 7)
        self.assertEqual(len(result.edges), 7)
        self.assertEqual(result.unmatched, 0)
        self.assertGreaterEqual(len(result.routes), 1)
        signature = game.scenario.signature_source
        route = next(
            route for route in report.pathmod.all_paths(game, limit=1)[signature]
        )
        for edge_id in route.edges:
            edge = game.edges[int(edge_id[1:])]
            self.assertTrue(edge.observed, edge.technique)
            self.assertTrue(edge.first_seen)

    def test_unknown_event_is_reported_as_unmatched(self):
        game = survey("games-studio")
        result = observed.overlay(game, [{
            "eventTime": "2026-11-16T18:00:00Z",
            "eventName": "ListBuckets",
            "userIdentity": {"userName": "gs-intern"},
        }])
        self.assertEqual(result.unmatched, 1)
        self.assertEqual(result.edges, [])

    def test_bundle_carries_observation_fields(self):
        game = survey("games-studio")
        observed.overlay(game, observed.load_events(
            os.path.join(ROOT, "cases", "01-observed-path", "cloudtrail.json")
        ))
        bundle = report.web_bundle(game, limit=2)
        self.assertTrue(any(edge["observed"] for edge in bundle["edges"]))
        self.assertTrue(all("observed" in edge for edge in bundle["edges"]))
        step = next(
            step
            for group in bundle["paths"].values()
            for route in group
            for step in route["steps"]
        )
        self.assertIn("observed", step)

    def test_csv_ledger_has_route_rows(self):
        game = survey("games-studio")
        text = report.ledger_csv(game, limit=1)
        lines = text.strip().splitlines()
        self.assertEqual(lines[0].split(",")[0], "account")
        self.assertGreater(len(lines), 2)
        self.assertIn("technique", lines[0])
        self.assertIn("observed", lines[0])


if __name__ == "__main__":
    unittest.main()
