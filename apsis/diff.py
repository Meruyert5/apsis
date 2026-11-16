"""Snapshot drift.

A route that existed yesterday and does not exist today is a fix. The reverse is
an incident. `diff` compares two account snapshots by technique edge, then
re-derives routes so the report talks about attacker options rather than JSON
deltas.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple

from . import paths as pathmod
from .graph import Survey
from .model import Edge, Path


@dataclass
class Drift:
    added: List[Edge] = field(default_factory=list)
    removed: List[Edge] = field(default_factory=list)
    new_routes: List[Path] = field(default_factory=list)
    lost_routes: List[Path] = field(default_factory=list)
    before_sources: int = 0
    after_sources: int = 0

    @property
    def worsened(self) -> bool:
        return bool(self.added) or bool(self.new_routes)


def _route_key(path: Path) -> Tuple[str, ...]:
    return tuple(path.edges)


def compare(before: Survey, after: Survey, limit: int = 3) -> Drift:
    before_edges = {edge.key: edge for edge in before.edges}
    after_edges = {edge.key: edge for edge in after.edges}

    drift = Drift()
    drift.added = [after_edges[key] for key in sorted(after_edges.keys() - before_edges.keys())]
    drift.removed = [before_edges[key] for key in sorted(before_edges.keys() - after_edges.keys())]

    before_routes = pathmod.all_paths(before, limit=limit)
    after_routes = pathmod.all_paths(after, limit=limit)

    def flat(group: Dict[str, List[Path]]) -> Set[Tuple[str, ...]]:
        return {_route_key(path) for routes in group.values() for path in routes}

    before_flat = flat(before_routes)
    after_flat = flat(after_routes)

    for source in sorted(after_routes):
        for route in after_routes[source]:
            if _route_key(route) not in before_flat:
                drift.new_routes.append(route)
    for source in sorted(before_routes):
        for route in before_routes[source]:
            if _route_key(route) not in after_flat:
                drift.lost_routes.append(route)

    drift.before_sources = len(before_routes)
    drift.after_sources = len(after_routes)
    return drift
