from __future__ import annotations

import contextlib
import io
import json
import os
import shutil
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis.cli import main  # noqa: E402

TMP = os.path.join(ROOT, "tests", ".tmp")


def scenario(name: str) -> str:
    return os.path.join(ROOT, "scenarios", name, "account.json")


def quiet(argv) -> int:
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        return main(argv)


class CliTest(unittest.TestCase):
    def setUp(self) -> None:
        if os.path.isdir(TMP):
            shutil.rmtree(TMP, ignore_errors=True)
        os.makedirs(TMP, exist_ok=True)

    def tearDown(self) -> None:
        shutil.rmtree(TMP, ignore_errors=True)

    def test_check_fails_on_a_reachable_account(self) -> None:
        self.assertEqual(quiet(["check", "--scenario", scenario("startup")]), 1)

    def test_check_passes_on_a_clean_account(self) -> None:
        self.assertEqual(quiet(["check", "--scenario", scenario("ci-cd")]), 0)

    def test_diff_fails_when_a_route_appears(self) -> None:
        code = quiet([
            "diff",
            "--before", scenario("ci-cd"),
            "--after", scenario("ci-cd-after"),
            "--no-color",
        ])
        self.assertEqual(code, 1)

    def test_export_writes_a_usable_bundle(self) -> None:
        target = os.path.join(TMP, "bundle.json")
        self.assertEqual(
            quiet(["export", "--scenario", scenario("startup"), "--out", target]), 0
        )
        with open(target, "r", encoding="utf-8") as handle:
            bundle = json.load(handle)

        self.assertEqual(bundle["engine"]["name"], "apsis")
        self.assertEqual(len(bundle["nodes"]), 12)
        self.assertEqual(len(bundle["edges"]), 9)
        self.assertIn("support-contractor", bundle["paths"])
        self.assertEqual(bundle["signature"]["hops"], 4)
        self.assertTrue(bundle["sever"]["closed"])
        self.assertTrue(bundle["registry"])
        for node in bundle["nodes"]:
            self.assertIn("x", node)
            self.assertIn("y", node)

    def test_scan_writes_markdown_and_sarif(self) -> None:
        markdown = os.path.join(TMP, "report.md")
        sarif = os.path.join(TMP, "report.sarif")
        code = quiet([
            "scan",
            "--scenario", scenario("enterprise"),
            "--markdown", markdown,
            "--sarif", sarif,
            "--no-color",
        ])
        self.assertEqual(code, 0)
        self.assertTrue(os.path.getsize(markdown) > 500)
        with open(sarif, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
        self.assertEqual(payload["version"], "2.1.0")
        self.assertTrue(payload["runs"][0]["results"])


if __name__ == "__main__":
    unittest.main()
