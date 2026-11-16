"""Record real CLI output for the Commands section.

The section composes an invocation and previews what the engine printed. That
preview has to be the engine's own text, not a browser-side imitation, so this
script runs each supported invocation through the report renderers and stores
the exact string. Standard library only, like the engine.

    python scripts/export_commands.py console/src/data/commands.json
"""

from __future__ import annotations

import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from apsis import build, load_scenario  # noqa: E402
from apsis import report, techniques as technique_mod  # noqa: E402
from apsis.graph import Survey  # noqa: E402
from apsis.sever import sever  # noqa: E402
from apsis import paths as pathmod  # noqa: E402

LIMIT = 3


def survey_for(name: str) -> Survey:
    return build(load_scenario(os.path.join(ROOT, "scenarios", name, "account.json")))


def scan_records(name: str, survey: Survey) -> list[dict]:
    base = "python -m apsis scan --scenario %s" % name
    return [
        {
            "key": "%s|scan|text" % name,
            "verb": "scan",
            "scenario": name,
            "format": "text",
            "command": "%s --limit %d --no-color" % (base, LIMIT),
            "output": report.text_report(survey, limit=LIMIT, colour=False),
        },
        {
            "key": "%s|scan|json" % name,
            "verb": "scan",
            "scenario": name,
            "format": "json",
            "command": "%s --limit %d --json" % (base, LIMIT),
            "output": report.to_json(report.web_bundle(survey, limit=LIMIT)),
        },
        {
            "key": "%s|scan|sarif" % name,
            "verb": "scan",
            "scenario": name,
            "format": "sarif",
            "command": "%s --limit %d --sarif apsis.sarif" % (base, LIMIT),
            "file": "apsis.sarif",
            "output": report.to_json(report.sarif(survey, limit=LIMIT)),
        },
        {
            "key": "%s|scan|mermaid" % name,
            "verb": "scan",
            "scenario": name,
            "format": "mermaid",
            "command": "%s --mermaid apsis.mmd" % base,
            "file": "apsis.mmd",
            "output": report.mermaid(survey),
        },
    ]


def sever_records(name: str, survey: Survey) -> list[dict]:
    result = sever(survey)
    base = "python -m apsis sever --scenario %s" % name
    return [
        {
            "key": "%s|sever|text" % name,
            "verb": "sever",
            "scenario": name,
            "format": "text",
            "command": "%s --no-color" % base,
            "output": report.sever_text(result, survey, colour=False),
        },
        {
            "key": "%s|sever|json" % name,
            "verb": "sever",
            "scenario": name,
            "format": "json",
            "command": "%s --json" % base,
            "output": report.to_json({
                "scenario": survey.scenario.name,
                "routesBefore": result.routes_before,
                "routesAfter": result.routes_after,
                "routesAfterRevoke": result.routes_after_revoke,
                "closed": result.closed,
                "permissionSteps": [
                    {
                        "action": step.action,
                        "edgesRemoved": step.edges_removed,
                        "routesKilled": step.routes_killed,
                    }
                    for step in result.permission_steps
                ],
                "edgeCut": [
                    {
                        "source": survey.edges[index].source,
                        "target": survey.edges[index].target,
                        "technique": survey.edges[index].technique,
                    }
                    for index in result.edge_cut.edges
                ],
            }),
        },
    ]


def check_record(name: str, survey: Survey) -> dict:
    routes = pathmod.all_paths(survey, limit=LIMIT)
    total = sum(len(group) for group in routes.values())
    lines = []
    if not routes:
        lines.append("apsis: clean. no identity reaches administrator in %s" % survey.scenario.name)
    else:
        lines.append("apsis: %d route(s) from %d identit%s to administrator in %s" % (
            total,
            len(routes),
            "y" if len(routes) == 1 else "ies",
            survey.scenario.name,
        ))
        for source in sorted(routes):
            route = routes[source][0]
            lines.append("  %s: %s" % (
                survey.label(source),
                " -> ".join(survey.label(node) for node in route.nodes),
            ))
    return {
        "key": "%s|check|text" % name,
        "verb": "check",
        "scenario": name,
        "format": "text",
        "command": "python -m apsis check --scenario %s --limit %d" % (name, LIMIT),
        "output": "\n".join(lines),
        "exit": 0 if not routes else 1,
    }


def technique_records() -> list[dict]:
    rows = technique_mod.registry()
    width = max(len(row["id"]) for row in rows)
    text = "\n".join(
        "%-*s  %-9s %-9s %s" % (width, row["id"], row["severity"], row["mitre"], row["name"])
        for row in rows
    )
    return [
        {
            "key": "all|techniques|text",
            "verb": "techniques",
            "scenario": None,
            "format": "text",
            "command": "python -m apsis techniques",
            "output": text,
        },
        {
            "key": "all|techniques|json",
            "verb": "techniques",
            "scenario": None,
            "format": "json",
            "command": "python -m apsis techniques --json",
            "output": report.to_json(rows),
        },
    ]


def main() -> int:
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        ROOT, "console", "src", "data", "commands.json"
    )
    root = os.path.join(ROOT, "scenarios")
    names = sorted(
        name for name in os.listdir(root)
        if os.path.exists(os.path.join(root, name, "account.json"))
    )

    records: list[dict] = []
    for name in names:
        survey = survey_for(name)
        records.extend(scan_records(name, survey))
        records.extend(sever_records(name, survey))
        records.append(check_record(name, survey))
    records.extend(technique_records())

    payload = {
        "generated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "records": records,
    }
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=1)
    size = os.path.getsize(out)
    print("wrote %d records to %s (%.0f KB)" % (len(records), out, size / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
