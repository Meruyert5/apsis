"""Command line entry point.

    apsis scan      survey an account and print the routes
    apsis sever     compute what to revoke, and prove the account closes
    apsis diff      compare two snapshots, route aware
    apsis check     CI gate: exit 1 when any identity reaches admin
    apsis export    write the web bundle, or every fixture at once
    apsis overlay   mark survey edges observed from CloudTrail
    apsis techniques  list the registry
"""

from __future__ import annotations

import argparse
import datetime
import os
import sys
from typing import List, Optional

from . import __version__, aws_import, diff as diff_mod, observed as observed_mod, report, techniques as technique_mod
from .graph import build, Survey
from .sever import sever as compute_sever
from . import paths as pathmod
from .world import load_scenario


def resolve_scenario(value: str) -> str:
    """Accept a file, a directory, or a fixture name."""
    if os.path.isdir(value):
        candidate = os.path.join(value, "account.json")
        if os.path.exists(candidate):
            return candidate
        raise SystemExit("no account.json in %s" % value)
    if os.path.exists(value):
        return value

    candidates = [
        os.path.join("scenarios", value, "account.json"),
        os.path.join(os.path.dirname(__file__), "..", "scenarios", value, "account.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "scenarios", value, "account.json"),
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            return os.path.abspath(candidate)
    raise SystemExit("scenario not found: %s" % value)


def scenario_root() -> str:
    for candidate in (
        os.path.join(os.getcwd(), "scenarios"),
        os.path.join(os.path.dirname(__file__), "..", "scenarios"),
    ):
        if os.path.isdir(candidate):
            return os.path.abspath(candidate)
    raise SystemExit("scenarios directory not found; run from the repository root")


def load(value: str, args: Optional[argparse.Namespace] = None) -> Survey:
    survey = build(load_scenario(resolve_scenario(value)))
    if args is not None:
        sources = getattr(args, "source", None)
        if sources:
            survey.allowed_sources = set(sources)
        hops = getattr(args, "max_hops", None)
        if hops:
            survey.hop_limit = hops
    return survey


def _write(path: str, content: str) -> None:
    directory = os.path.dirname(os.path.abspath(path))
    if directory and not os.path.isdir(directory):
        os.makedirs(directory, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content if content.endswith("\n") else content + "\n")


def cmd_scan(args: argparse.Namespace) -> int:
    survey = load(args.scenario, args)
    if getattr(args, "cloudtrail", None):
        events = observed_mod.load_events(args.cloudtrail)
        result = observed_mod.overlay(survey, events)
        print("CloudTrail: %d events, %d edges observed, %d routes observed, %d unmatched" % (
            result.events, len(result.edges), len(result.routes), result.unmatched))
    if args.json:
        print(report.to_json(report.web_bundle(survey, limit=args.limit)))
    else:
        print(report.text_report(survey, limit=args.limit, colour=not args.no_color))
    if args.markdown:
        _write(args.markdown, report.markdown_report(survey, compute_sever(survey), limit=args.limit))
    if args.sarif:
        _write(args.sarif, report.to_json(report.sarif(survey, limit=args.limit)))
    if args.mermaid:
        _write(args.mermaid, report.mermaid(survey))
    return 0


def cmd_sever(args: argparse.Namespace) -> int:
    survey = load(args.scenario, args)
    result = compute_sever(survey, revoke_actions=args.revoke or ())
    if args.json:
        print(report.to_json({
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
        }))
    else:
        print(report.sever_text(result, survey, colour=not args.no_color))
    return 0 if result.closed else 1


def cmd_diff(args: argparse.Namespace) -> int:
    before = load(args.before)
    after = load(args.after)
    drift = diff_mod.compare(before, after)
    print(report.drift_text(drift, before, after, colour=not args.no_color))
    return 1 if drift.worsened else 0


def cmd_check(args: argparse.Namespace) -> int:
    survey = load(args.scenario, args)
    routes = pathmod.all_paths(survey, limit=args.limit)
    if args.sarif:
        _write(args.sarif, report.to_json(report.sarif(survey, limit=args.limit)))
    total = sum(len(group) for group in routes.values())
    if not routes:
        print("apsis: clean. no identity reaches administrator in %s" % survey.scenario.name)
        return 0
    print("apsis: %d route(s) from %d identit%s to administrator in %s" % (
        total, len(routes), "y" if len(routes) == 1 else "ies", survey.scenario.name))
    for source in sorted(routes):
        route = routes[source][0]
        print("  %s: %s" % (survey.label(source), " -> ".join(survey.label(node) for node in route.nodes)))
    return 1


def cmd_overlay(args: argparse.Namespace) -> int:
    survey = load(args.scenario, args)
    events = observed_mod.load_events(args.cloudtrail)
    result = observed_mod.overlay(survey, events)
    if args.json:
        payload = observed_mod.summary(result)
        payload["scenario"] = survey.scenario.name
        payload["routes"] = [list(route) for route in result.routes]
        print(report.to_json(payload))
        return 0
    print("CloudTrail overlay %s" % survey.scenario.name)
    print("  events       %d" % result.events)
    print("  edges        %d observed" % len(result.edges))
    print("  routes       %d observed" % len(result.routes))
    print("  unmatched    %d" % result.unmatched)
    for index in result.edges:
        edge = survey.edges[index]
        print("  e%-3d %-28s %-26s %s" % (
            index, edge.technique, survey.label(edge.source), survey.label(edge.target)))
        if edge.first_seen:
            print("       %s -> %s" % (edge.first_seen, edge.last_seen))
    return 0


def cmd_ledger(args: argparse.Namespace) -> int:
    survey = load(args.scenario, args)
    if getattr(args, "cloudtrail", None):
        observed_mod.overlay(survey, observed_mod.load_events(args.cloudtrail))
    text = report.ledger_csv(survey, limit=args.limit)
    if args.out:
        _write(args.out, text)
        print("wrote %s" % args.out)
    else:
        print(text, end="")
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    if args.all and getattr(args, "cloudtrail", None):
        raise SystemExit("--cloudtrail applies to one scenario; use --scenario with it")
    if args.all:
        root = scenario_root()
        names = sorted(
            name
            for name in os.listdir(root)
            if os.path.exists(os.path.join(root, name, "account.json"))
        )
        if not names:
            raise SystemExit("no fixtures found in %s" % root)
        os.makedirs(args.out, exist_ok=True)

        index = {
            "generated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "engine": {"name": "apsis", "version": __version__},
            "scenarios": [],
            "totals": {"identities": 0, "edges": 0, "routes": 0, "fixtures": len(names)},
        }
        for name in names:
            survey = load(os.path.join(root, name, "account.json"), args)
            bundle = report.web_bundle(survey, limit=args.limit)
            _write(os.path.join(args.out, "%s.json" % name), report.to_json(bundle))
            index["scenarios"].append({
                "key": name,
                "title": bundle["scenario"]["title"],
                "stats": bundle["stats"],
                "sever": {
                    "routesBefore": bundle["sever"]["routesBefore"],
                    "routesAfter": bundle["sever"]["routesAfter"],
                    "closed": bundle["sever"]["closed"],
                },
            })
            index["totals"]["identities"] += bundle["stats"]["identities"]
            index["totals"]["edges"] += bundle["stats"]["edges"]
            index["totals"]["routes"] += bundle["stats"]["routes"]
        _write(os.path.join(args.out, "index.json"), report.to_json(index))
        print("wrote %d bundles and index.json to %s" % (len(names), args.out))
        return 0

    if not args.scenario:
        raise SystemExit("export needs --scenario NAME or --all")
    survey = load(args.scenario, args)
    if getattr(args, "cloudtrail", None):
        observed_mod.overlay(survey, observed_mod.load_events(args.cloudtrail))
    bundle = report.web_bundle(survey, limit=args.limit)
    _write(args.out, report.to_json(bundle))
    print("wrote %s (%d nodes, %d edges, %d routes)" % (
        args.out, len(bundle["nodes"]), len(bundle["edges"]),
        sum(len(group) for group in bundle["paths"].values())))
    return 0


def cmd_import(args: argparse.Namespace) -> int:
    if args.from_aws:
        scenario = aws_import.from_aws(
            args.out, profile=args.profile, region=args.region, name=args.name
        )
    else:
        if not args.input:
            raise SystemExit("import needs --from-aws or --input FILE")
        scenario = aws_import.from_file(
            args.out, args.input, name=args.name, region=args.region or "us-east-1"
        )
    print("wrote %s (%d identities, %d policies)" % (
        args.out, len(scenario["identities"]), len(scenario["policies"])))
    return 0


def cmd_techniques(args: argparse.Namespace) -> int:
    rows = technique_mod.registry()
    if args.json:
        print(report.to_json(rows))
        return 0
    width = max(len(row["id"]) for row in rows)
    for row in rows:
        print("%-*s  %-9s %-9s %s" % (width, row["id"], row["severity"], row["mitre"], row["name"]))
    return 0


def _add_filters(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--source",
        action="append",
        metavar="ID",
        help="restrict the survey to one or more principal ids (repeatable)",
    )
    parser.add_argument(
        "--max-hops",
        type=int,
        metavar="N",
        help="ignore routes longer than N steps",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="apsis",
        description="Find every route from a low-privilege AWS principal to administrator.",
    )
    parser.add_argument("--version", action="version", version="apsis %s" % __version__)
    sub = parser.add_subparsers(dest="command", required=True)

    scan = sub.add_parser("scan", help="survey an account and print routes")
    scan.add_argument("--scenario", "-s", default="startup")
    scan.add_argument("--limit", type=int, default=3, help="routes per identity")
    scan.add_argument("--json", action="store_true")
    scan.add_argument("--markdown", help="write a Markdown report")
    scan.add_argument("--sarif", help="write SARIF for code scanning")
    scan.add_argument("--mermaid", help="write a Mermaid diagram")
    scan.add_argument("--cloudtrail", help="mark observed edges from a CloudTrail JSON export")
    scan.add_argument("--no-color", action="store_true")
    _add_filters(scan)
    scan.set_defaults(func=cmd_scan)

    sever = sub.add_parser("sever", help="what to revoke to close every route")
    sever.add_argument("--scenario", "-s", default="startup")
    sever.add_argument("--revoke", action="append", help="revoke an action before comparing")
    sever.add_argument("--json", action="store_true")
    sever.add_argument("--no-color", action="store_true")
    _add_filters(sever)
    sever.set_defaults(func=cmd_sever)

    drift = sub.add_parser("diff", help="compare two snapshots")
    drift.add_argument("--before", required=True)
    drift.add_argument("--after", required=True)
    drift.add_argument("--no-color", action="store_true")
    drift.set_defaults(func=cmd_diff)

    check = sub.add_parser("check", help="CI gate, exit 1 when a route exists")
    check.add_argument("--scenario", "-s", default="startup")
    check.add_argument("--limit", type=int, default=3)
    check.add_argument("--sarif", help="write SARIF for code scanning")
    _add_filters(check)
    check.set_defaults(func=cmd_check)

    export = sub.add_parser("export", help="write the web bundle")
    export.add_argument("--scenario", "-s")
    export.add_argument("--all", action="store_true", help="export every fixture plus index.json")
    export.add_argument("--out", "-o", required=True)
    export.add_argument("--limit", type=int, default=4)
    export.add_argument("--cloudtrail", help="mark observed edges in the bundle")
    _add_filters(export)
    export.set_defaults(func=cmd_export)

    overlay = sub.add_parser("overlay", help="mark observed edges from CloudTrail")
    overlay.add_argument("--scenario", "-s", required=True)
    overlay.add_argument("--cloudtrail", required=True)
    overlay.add_argument("--json", action="store_true")
    _add_filters(overlay)
    overlay.set_defaults(func=cmd_overlay)

    ledger = sub.add_parser("ledger", help="write the route ledger as CSV")
    ledger.add_argument("--scenario", "-s", required=True)
    ledger.add_argument("--out", "-o")
    ledger.add_argument("--limit", type=int, default=4)
    ledger.add_argument("--cloudtrail")
    _add_filters(ledger)
    ledger.set_defaults(func=cmd_ledger)

    imp = sub.add_parser("import", help="import an IAM authorization dump")
    imp.add_argument("--from-aws", action="store_true", help="call the AWS CLI for a live dump")
    imp.add_argument("--input", "-i", help="a saved get-account-authorization-details dump")
    imp.add_argument("--out", "-o", required=True)
    imp.add_argument("--profile")
    imp.add_argument("--region", default="us-east-1")
    imp.add_argument("--name", default="imported")
    imp.set_defaults(func=cmd_import)

    tech = sub.add_parser("techniques", help="list escalation techniques")
    tech.add_argument("--json", action="store_true")
    tech.set_defaults(func=cmd_techniques)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    # Windows consoles often default to a legacy code page; the reports use
    # symbols such as the severity dot. Keep UTF-8 output from crashing.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
