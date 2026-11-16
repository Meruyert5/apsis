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

from apsis import build, load_scenario, paths  # noqa: E402
from apsis.cli import main  # noqa: E402

TMP = os.path.join(ROOT, "tests", ".tmp-features")


def quiet(argv) -> int:
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        return main(argv)


def scenario(name: str) -> str:
    return os.path.join(ROOT, "scenarios", name, "account.json")


class FeatureTest(unittest.TestCase):
    def setUp(self) -> None:
        shutil.rmtree(TMP, ignore_errors=True)
        os.makedirs(TMP, exist_ok=True)

    def tearDown(self) -> None:
        shutil.rmtree(TMP, ignore_errors=True)

    def test_source_filter_excludes_clean_identities(self) -> None:
        self.assertEqual(
            quiet(["check", "--scenario", scenario("startup"), "--source", "billing-analyst"]),
            0,
        )
        self.assertEqual(
            quiet(["check", "--scenario", scenario("startup"), "--source", "support-contractor"]),
            1,
        )

    def test_max_hops_hides_long_routes(self) -> None:
        # The contractor route is four hops; at three it must disappear.
        self.assertEqual(
            quiet([
                "check",
                "--scenario", scenario("startup"),
                "--source", "support-contractor",
                "--max-hops", "3",
            ]),
            0,
        )

    def test_export_all_writes_every_fixture_and_an_index(self) -> None:
        code = quiet(["export", "--all", "--out", TMP])
        self.assertEqual(code, 0)
        files = sorted(name for name in os.listdir(TMP) if name.endswith(".json"))
        bundles = [name for name in files if name != "index.json"]
        self.assertGreaterEqual(len(bundles), 7)
        self.assertIn("index.json", files)

        with open(os.path.join(TMP, "index.json"), "r", encoding="utf-8") as handle:
            index = json.load(handle)
        self.assertEqual(index["totals"]["fixtures"], len(bundles))
        self.assertGreater(index["totals"]["routes"], 0)
        self.assertTrue(all("stats" in item for item in index["scenarios"]))

    def test_import_converts_an_authorization_dump(self) -> None:
        output = os.path.join(TMP, "account.json")
        code = quiet([
            "import",
            "--input", os.path.join(ROOT, "tests", "fixtures", "authorization-details.json"),
            "--out", output,
            "--name", "dump",
        ])
        self.assertEqual(code, 0)
        with open(output, "r", encoding="utf-8") as handle:
            scenario = json.load(handle)

        self.assertEqual(scenario["account_id"], "111122223333")
        self.assertEqual(len(scenario["identities"]), 4)
        role = next(item for item in scenario["identities"] if item["kind"] == "role")
        self.assertIn("lambda.amazonaws.com", role["trust"])
        self.assertTrue(role["attached"])

        survey = build(load_scenario(output))
        routes = paths.all_paths(survey)
        self.assertIn("user-ci-runner", routes)

    def test_sever_json_is_machine_readable(self) -> None:
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            code = main(["sever", "--scenario", scenario("startup"), "--json"])
        payload = json.loads(buffer.getvalue())
        self.assertEqual(code, 0)
        self.assertTrue(payload["closed"])
        self.assertEqual(payload["routesAfter"], 0)
        self.assertTrue(payload["permissionSteps"])
        self.assertTrue(payload["edgeCut"])


if __name__ == "__main__":
    unittest.main()
