"""Contract tests for the observed-path alert and evidence.

These tests are intentionally stdlib-only so the default engine test run stays
dependency-free. The published JSON Schemas remain the authority; these checks
catch drift between the schema, the alert instance and the evidence manifest.
"""

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASE = ROOT / "cases" / "01-observed-path"


def load(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


class AlertContractTest(unittest.TestCase):
    def setUp(self):
        self.schema = load(ROOT / "schema" / "alert.schema.json")
        self.alert = load(CASE / "alert.json")

    def test_required_fields_are_present_and_typed(self):
        for field in self.schema["required"]:
            self.assertIn(field, self.alert)
        self.assertEqual(self.alert["schema"], "penumbra.alert/v1")
        self.assertEqual(self.alert["source"], "apsis")
        self.assertIn(self.alert["kind"], self.schema["properties"]["kind"]["enum"])
        self.assertRegex(self.alert["account"], r"^[0-9]{12}$")
        self.assertIsInstance(self.alert["observed"], bool)
        self.assertIn(self.alert["severity"], self.schema["properties"]["severity"]["enum"])

    def test_route_and_edges_are_consistent(self):
        route = self.alert["route"]
        edges = self.alert["edges"]
        self.assertGreaterEqual(len(route), 2)
        self.assertEqual(len(route), len(edges) + 1)
        self.assertEqual(len(edges), len(set(edges)))
        for edge in edges:
            self.assertRegex(edge, r"^e[0-9]+$")
        self.assertEqual(self.alert["principal"], "gs-intern")
        self.assertEqual(route[0], "Tools intern")
        self.assertEqual(route[-1], "Administrator")

    def test_no_extra_properties(self):
        self.assertLessEqual(set(self.alert), set(self.schema["properties"]))


class EvidenceContractTest(unittest.TestCase):
    def setUp(self):
        self.schema = load(ROOT / "schema" / "evidence.schema.json")
        self.alert = load(CASE / "alert.json")
        self.evidence = load(CASE / "evidence.json")

    def test_evidence_shape_and_schema(self):
        for field in self.schema["required"]:
            self.assertIn(field, self.evidence)
        self.assertEqual(self.evidence["schema"], "penumbra.evidence/v1")
        self.assertRegex(self.evidence["account"], r"^[0-9]{12}$")
        for key in ("from", "to"):
            self.assertIn(key, self.evidence["window"])
        self.assertGreaterEqual(len(self.evidence["events"]), 1)
        self.assertGreaterEqual(len(self.evidence["edges"]), 1)

    def test_evidence_matches_the_alert(self):
        self.assertEqual(self.evidence["account"], self.alert["account"])
        evidence_ids = [edge["id"] for edge in self.evidence["edges"]]
        self.assertEqual(evidence_ids, self.alert["edges"])
        self.assertTrue(all(edge["observed"] for edge in self.evidence["edges"]))
        self.assertEqual(len(self.evidence["events"]), len(self.evidence["edges"]))

    def test_evidence_times_are_iso_and_ordered(self):
        stamps = [event["time"] for event in self.evidence["events"]]
        for stamp in stamps:
            self.assertRegex(stamp, r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
        self.assertEqual(stamps, sorted(stamps))
        self.assertGreaterEqual(self.alert["firstSeen"], stamps[0])
        self.assertLessEqual(self.alert["lastSeen"], stamps[-1])


if __name__ == "__main__":
    unittest.main()
