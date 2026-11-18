"""Renderers: terminal, Markdown, SARIF, Mermaid, and the web export bundle.

Every renderer reads the same `Survey`, so a finding is never shaped differently
depending on where it is printed. The web bundle is the one exporters get wrong
most often: it carries the real engine output, which is why the site's graph can
be trusted as a demo.
"""

from __future__ import annotations

import datetime
import json
from typing import Any, Dict, Iterable, List, Optional, Sequence

from . import techniques as technique_mod
from .diff import Drift
from .graph import Survey, technique_counts
from .model import ADMIN, Edge, Path
from .sever import SeverResult
from . import paths as pathmod

from . import __version__ as VERSION

_RESET = "\033[0m"
_BOLD = "\033[1m"
_DIM = "\033[2m"
_RED = "\033[31m"
_GREEN = "\033[32m"
_YELLOW = "\033[33m"
_CYAN = "\033[36m"
_MAGENTA = "\033[35m"

_SEVERITY_COLOR = {"critical": _RED, "high": _YELLOW, "medium": _CYAN, "low": _DIM}


def _paint(text: str, colour: str, enabled: bool) -> str:
    return "%s%s%s" % (colour, text, _RESET) if enabled else text


def _route_line(survey: Survey, path: Path, index: int, colour: bool) -> str:
    parts = []
    for edge_id in path.edges:
        edge = survey.edges[int(edge_id[1:])]
        arrow = "=>" if edge.conditional else "->"
        parts.append("%s %s" % (arrow, survey.label(edge.target)))
    head = "  %d." % index
    return "%s %s" % (head, _paint("".join(parts), _GREEN, colour))


def text_report(survey: Survey, limit: int = 3, colour: bool = True) -> str:
    routes = pathmod.all_paths(survey, limit=limit)
    total_routes = sum(len(group) for group in routes.values())
    admins = survey.admin_ids()

    lines: List[str] = []
    title = survey.scenario.title
    lines.append(_paint(title, _BOLD, colour))
    lines.append(_paint("account %s · %s · %d identities · %d escalation edges" % (
        survey.scenario.account_id,
        survey.scenario.region,
        len(survey.world.identities),
        len(survey.edges),
    ), _DIM, colour))
    lines.append("")

    if not admins:
        lines.append(_paint("No administrator identity found. Nothing to escalate to.", _YELLOW, colour))
        return "\n".join(lines)

    if total_routes:
        lines.append(_paint("%d routes from %d identities reach administrator" % (
            total_routes, len(routes)), _RED if colour else "", colour))
    else:
        lines.append(_paint("No identity can currently reach administrator.", _GREEN, colour))
    lines.append("")

    for source in sorted(routes):
        identity = survey.world.identities.get(source)
        label = identity.label if identity else source
        kind = identity.kind if identity else "?"
        note = (" — " + identity.note) if identity and identity.note else ""
        lines.append("%s %s%s" % (_paint("●", _MAGENTA, colour), _paint(label, _BOLD, colour), note))
        lines.append(_paint("  %s · %d hops" % (kind, routes[source][0].hops), _DIM, colour))
        for position, route in enumerate(routes[source], start=1):
            lines.append(_route_line(survey, route, position, colour))
            for edge_id in route.edges:
                edge = survey.edges[int(edge_id[1:])]
                guard = " (conditional)" if edge.conditional else ""
                lines.append(_paint("     %-26s %s%s" % (
                    edge.technique, edge.evidence, guard), _DIM, colour))
        lines.append("")

    counts = technique_counts(survey)
    if counts:
        lines.append(_paint("Techniques observed", _BOLD, colour))
        for technique_id, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
            technique = technique_mod.find(technique_id)
            name = technique.name if technique else technique_id
            lines.append("  %2d  %s %s" % (count, name, _paint("(%s)" % technique_id, _DIM, colour)))
    return "\n".join(lines)


def sever_text(result: SeverResult, survey: Survey, colour: bool = True) -> str:
    lines: List[str] = []
    lines.append(_paint("Sever", _BOLD, colour))
    verdict = _GREEN if result.closed else _RED
    lines.append("  %d identities reach admin before, %d after remediation" % (
        result.routes_before, result.routes_after))
    if result.routes_after_revoke != result.routes_before:
        lines.append("  Revoking only the actions you named leaves %d." % result.routes_after_revoke)
    if result.permission_steps:
        lines.append("")
        lines.append("  Revoke, in this order:")
        for position, step in enumerate(result.permission_steps, start=1):
            edges = "edge" if step.edges_removed == 1 else "edges"
            lines.append("   %d. %-32s kills %d identities, removes %d %s" % (
                position, step.action, step.routes_killed, step.edges_removed, edges))
    if result.edge_cut.size:
        lines.append("")
        lines.append("  Minimum edge cut: %d steps" % result.edge_cut.size)
        for index in result.edge_cut.edges:
            edge = survey.edges[index]
            lines.append("   - %s %s %s" % (
                survey.label(edge.source), edge.technique, survey.label(edge.target)))
    lines.append("")
    lines.append(_paint(
        "Account closed." if result.closed else "Still reachable with the listed actions revoked.",
        verdict, colour))
    return "\n".join(lines)


def markdown_report(survey: Survey, sever_result: Optional[SeverResult], limit: int = 3) -> str:
    routes = pathmod.all_paths(survey, limit=limit)
    total = sum(len(group) for group in routes.values())
    out: List[str] = []
    out.append("# Apsis report: %s" % survey.scenario.title)
    out.append("")
    out.append("`%s` · %s · generated by Apsis %s" % (
        survey.scenario.account_id, survey.scenario.region, VERSION))
    out.append("")
    out.append("> %s" % (survey.scenario.summary or "IAM privilege-escalation survey."))
    out.append("")
    out.append("| Metric | Value |")
    out.append("| --- | --- |")
    out.append("| Identities surveyed | %d |" % len(survey.world.identities))
    out.append("| Escalation edges | %d |" % len(survey.edges))
    out.append("| Identities that reach admin | %d |" % len(routes))
    out.append("| Routes found | %d |" % total)
    shortest = min((r.hops for group in routes.values() for r in group), default=None)
    out.append("| Shortest route | %s |" % ("%d hops" % shortest if shortest else "none"))
    out.append("")

    if routes:
        out.append("## Routes")
        for source in sorted(routes):
            identity = survey.world.identities.get(source)
            out.append("")
            out.append("### %s" % (identity.label if identity else source))
            out.append("")
            out.append("`%s`" % source)
            out.append("")
            for position, route in enumerate(routes[source], start=1):
                steps = []
                for edge_id in route.edges:
                    edge = survey.edges[int(edge_id[1:])]
                    steps.append("`%s` %s" % (edge.technique, survey.label(edge.target)))
                out.append("%d. %s" % (position, " → ".join(steps)))
            out.append("")
            for edge_id in routes[source][0].edges:
                edge = survey.edges[int(edge_id[1:])]
                out.append("- **%s** %s: %s" % (
                    edge.name or edge.technique, "conditional" if edge.conditional else "", edge.evidence))
    else:
        out.append("## Routes")
        out.append("")
        out.append("No identity reaches administrator in this snapshot.")

    if sever_result:
        out.append("")
        out.append("## Sever")
        out.append("")
        out.append("Reachable before: **%d**. After remediation: **%d**." % (
            sever_result.routes_before, sever_result.routes_after))
        if sever_result.permission_steps:
            out.append("")
            out.append("| Revoke | Identities disconnected | Edges removed |")
            out.append("| --- | --- | --- |")
            for step in sever_result.permission_steps:
                out.append("| `%s` | %d | %d |" % (step.action, step.routes_killed, step.edges_removed))

    counts = technique_counts(survey)
    if counts:
        out.append("")
        out.append("## Techniques observed")
        out.append("")
        out.append("| Technique | MITRE | Edges | Fix |")
        out.append("| --- | --- | --- | --- |")
        for technique_id, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
            technique = technique_mod.find(technique_id)
            if technique is None:
                continue
            out.append("| %s (`%s`) | %s | %d | %s |" % (
                technique.name, technique.id, technique.mitre, count, technique.fix))
    out.append("")
    return "\n".join(out)


def mermaid(survey: Survey, limit: int = 40) -> str:
    def node_id(value: str) -> str:
        return "n_" + "".join(char if char.isalnum() else "_" for char in value)

    lines = ["flowchart LR"]
    for node in survey.nodes.values():
        shape = "((%s))" % node.label if node.admin else "[%s]" % node.label
        lines.append("  %s%s" % (node_id(node.id), shape))
    for edge in survey.edges[:limit]:
        label = edge.technique.replace("_", " ")
        lines.append("  %s -->|%s| %s" % (node_id(edge.source), label, node_id(edge.target)))
    return "\n".join(lines)


def sarif(survey: Survey, limit: int = 3) -> Dict[str, Any]:
    rules = []
    for technique in technique_mod.TECHNIQUES:
        rules.append({
            "id": technique.id,
            "name": technique.name,
            "shortDescription": {"text": technique.summary},
            "fullDescription": {"text": technique.fix},
            "properties": {
                "tags": ["security", "aws", "iam", technique.mitre],
                "severity": technique.severity,
            },
            "helpUri": "https://github.com/apsis-security/apsis#%s" % technique.id,
        })

    results = []
    routes = pathmod.all_paths(survey, limit=limit)
    for source in sorted(routes):
        for route in routes[source]:
            chains = " -> ".join(
                survey.edges[int(edge_id[1:])].technique for edge_id in route.edges
            )
            labels = " -> ".join(survey.label(node) for node in route.nodes)
            results.append({
                "ruleId": route.edges and survey.edges[int(route.edges[0][1:])].technique or "assume_role",
                "level": "error" if route.hops <= 4 else "warning",
                "message": {
                    "text": "%s can reach administrator in %d hops: %s" % (
                        survey.label(source), route.hops, labels)
                },
                "properties": {"chain": chains, "source": source, "hops": route.hops},
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {"uri": "account.json"},
                        "region": {"startLine": 1},
                    }
                }],
            })

    return {
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {"driver": {
                "name": "apsis",
                "version": VERSION,
                "informationUri": "https://github.com/apsis-security/apsis",
                "rules": rules,
            }},
            "results": results,
        }],
    }


def web_bundle(survey: Survey, limit: int = 4) -> Dict[str, Any]:
    """Everything the documentation site needs, generated by this engine."""
    from .sever import sever as run_sever

    routes = pathmod.all_paths(survey, limit=limit)
    sever_result = run_sever(survey)

    nodes = []
    for node in sorted(survey.nodes.values(), key=lambda item: (item.kind, item.id)):
        identity = survey.world.identities.get(node.id)
        nodes.append({
            "id": node.id,
            "label": node.label,
            "kind": node.kind,
            "admin": node.admin,
            "x": node.x,
            "y": node.y,
            "degree": survey.degree(node.id),
            "note": node.note,
            "arn": node.arn,
            "groups": list(identity.groups) if identity else [],
            "trust": list(identity.trust) if identity else [],
        })

    edge_rows = []
    for index, edge in enumerate(survey.edges):
        technique = technique_mod.find(edge.technique)
        edge_rows.append({
            "id": "e%d" % index,
            "source": edge.source,
            "target": edge.target,
            "technique": edge.technique,
            "name": edge.name,
            "severity": edge.severity,
            "mitre": edge.mitre,
            "actions": list(edge.actions),
            "conditional": edge.conditional,
            "observed": edge.observed,
            "firstSeen": edge.first_seen or None,
            "lastSeen": edge.last_seen or None,
            "evidence": edge.evidence,
            "narration": edge.narration,
            "fix": technique.fix if technique else "",
        })

    path_rows: Dict[str, List[Dict[str, Any]]] = {}
    for source, group in routes.items():
        path_rows[source] = [
            {
                "hops": route.hops,
                "nodes": route.nodes,
                "edges": route.edges,
                "labels": [survey.label(node) for node in route.nodes],
                "steps": [
                    {
                        "edge": edge_id,
                        "technique": survey.edges[int(edge_id[1:])].technique,
                        "name": survey.edges[int(edge_id[1:])].name,
                        "narration": survey.edges[int(edge_id[1:])].narration,
                        "actions": list(survey.edges[int(edge_id[1:])].actions),
                        "mitre": survey.edges[int(edge_id[1:])].mitre,
                        "evidence": survey.edges[int(edge_id[1:])].evidence,
                        "conditional": survey.edges[int(edge_id[1:])].conditional,
                        "observed": survey.edges[int(edge_id[1:])].observed,
                        "firstSeen": survey.edges[int(edge_id[1:])].first_seen or None,
                        "lastSeen": survey.edges[int(edge_id[1:])].last_seen or None,
                    }
                    for edge_id in route.edges
                ],
            }
            for route in group
        ]

    signature = None
    preferred = survey.scenario.signature_source
    if preferred and path_rows.get(preferred):
        signature = path_rows[preferred][0]
    elif path_rows:
        ranked = sorted(
            (route for group in path_rows.values() for route in group),
            key=lambda item: (-item["hops"], item["nodes"][0]),
        )
        signature = ranked[0] if ranked else None

    return {
        "generated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "engine": {"name": "apsis", "version": VERSION},
        "scenario": {
            "name": survey.scenario.name,
            "title": survey.scenario.title,
            "summary": survey.scenario.summary,
            "accountId": survey.scenario.account_id,
            "region": survey.scenario.region,
            "severity": survey.scenario.severity,
        },
        "stats": {
            "identities": len(survey.world.identities),
            "resources": len(survey.world.resources),
            "edges": len(survey.edges),
            "sourcesWithPath": len(path_rows),
            "sources": len(survey.sources()),
            "routes": sum(len(group) for group in path_rows.values()),
            "shortest": min((route["hops"] for group in path_rows.values() for route in group), default=None),
            "admins": [survey.label(node) for node in survey.admin_ids()],
        },
        "nodes": nodes,
        "edges": edge_rows,
        "paths": path_rows,
        "sever": {
            "routesBefore": sever_result.routes_before,
            "routesAfter": sever_result.routes_after,
            "closed": sever_result.closed,
            "edgeCut": {
                "edges": ["e%d" % index for index in sever_result.edge_cut.edges],
                "byTechnique": sever_result.edge_cut.by_technique,
                "byAction": sever_result.edge_cut.by_action,
            },
            "permissionSteps": [
                {"action": step.action, "edgesRemoved": step.edges_removed, "routesKilled": step.routes_killed}
                for step in sever_result.permission_steps
            ],
        },
        "signature": signature,
        "registry": technique_mod.registry(),
    }


def ledger_rows(survey: Survey, limit: int = 4) -> List[Dict[str, Any]]:
    """One row per edge occurrence in a route, ready for CSV or a table."""
    routes = pathmod.all_paths(survey, limit=limit)
    rows: List[Dict[str, Any]] = []
    for source in sorted(routes):
        for route_index, route in enumerate(routes[source], start=1):
            for hop, edge_id in enumerate(route.edges, start=1):
                edge = survey.edges[int(edge_id[1:])]
                rows.append({
                    "account": survey.scenario.account_id,
                    "scenario": survey.scenario.name,
                    "source": survey.label(source),
                    "route": route_index,
                    "hops": route.hops,
                    "hop": hop,
                    "from": survey.label(edge.source),
                    "to": survey.label(edge.target),
                    "technique": edge.technique,
                    "actions": " ".join(edge.actions),
                    "conditional": edge.conditional,
                    "observed": edge.observed,
                    "firstSeen": edge.first_seen,
                    "lastSeen": edge.last_seen,
                })
    return rows


def ledger_csv(survey: Survey, limit: int = 4) -> str:
    import csv
    import io

    rows = ledger_rows(survey, limit=limit)
    fields = [
        "account", "scenario", "source", "route", "hops", "hop",
        "from", "to", "technique", "actions", "conditional", "observed",
        "firstSeen", "lastSeen",
    ]
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()


def drift_text(drift: Drift, before: Survey, after: Survey, colour: bool = True) -> str:
    lines: List[str] = []
    lines.append(_paint("Drift", _BOLD, colour))
    lines.append("  identities reaching admin: %d -> %d" % (drift.before_sources, drift.after_sources))
    if drift.added:
        lines.append("")
        lines.append(_paint("  New escalation edges", _RED, colour))
        for edge in drift.added:
            lines.append("   + %s %s %s" % (after.label(edge.source), edge.technique, after.label(edge.target)))
    if drift.removed:
        lines.append("")
        lines.append(_paint("  Removed escalation edges", _GREEN, colour))
        for edge in drift.removed:
            lines.append("   - %s %s %s" % (before.label(edge.source), edge.technique, before.label(edge.target)))
    if drift.new_routes:
        lines.append("")
        lines.append(_paint("  New routes", _RED, colour))
        for route in drift.new_routes:
            lines.append("   + %s" % " -> ".join(after.label(node) for node in route.nodes))
    if drift.lost_routes:
        lines.append("")
        lines.append(_paint("  Closed routes", _GREEN, colour))
        for route in drift.lost_routes:
            lines.append("   - %s" % " -> ".join(before.label(node) for node in route.nodes))
    if not drift.worsened and not drift.removed:
        lines.append("  No change in reachable privilege.")
    return "\n".join(lines)


def to_json(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=False, default=str)
