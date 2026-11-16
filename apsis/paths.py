"""Route finding.

Two different questions, two different algorithms:

* "How would an attacker actually get there?" wants a small number of short,
  readable routes. That is a bounded enumeration of simple paths, not a count.
* "How many ways in are there?" wants reachability, which is a BFS.

Mixing them up is how tools end up claiming "1,204 paths" when there are nine.
"""

from __future__ import annotations

from collections import deque
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple

from .graph import Survey
from .model import ADMIN, Path


def _is_goal(survey: Survey, node_id: str) -> bool:
    node = survey.nodes.get(node_id)
    return bool(node and node.admin)


def min_hops(survey: Survey, source: str, blocked: Optional[Set[int]] = None) -> Optional[int]:
    """Breadth-first distance to the nearest administrator, or None."""
    blocked = blocked or set()
    seen = {source}
    queue = deque([(source, 0)])
    while queue:
        node_id, depth = queue.popleft()
        if node_id != source and _is_goal(survey, node_id):
            return depth
        for index in survey.successors(node_id):
            if index in blocked:
                continue
            target = survey.edges[index].target
            if target in seen:
                continue
            seen.add(target)
            queue.append((target, depth + 1))
    return None


def reachable(survey: Survey, source: str, blocked: Optional[Set[int]] = None) -> Set[str]:
    blocked = blocked or set()
    seen = {source}
    queue = deque([source])
    while queue:
        node_id = queue.popleft()
        for index in survey.successors(node_id):
            if index in blocked:
                continue
            target = survey.edges[index].target
            if target not in seen:
                seen.add(target)
                queue.append(target)
    return seen


def any_source_reaches_admin(survey: Survey, blocked: Optional[Set[int]] = None) -> bool:
    blocked = blocked or set()
    for source in survey.sources():
        if any(_is_goal(survey, node_id) for node_id in reachable(survey, source, blocked)):
            return True
    return False


def paths_from(
    survey: Survey,
    source: str,
    limit: int = 3,
    slack: int = 2,
    max_depth: int = 12,
    blocked: Optional[Set[int]] = None,
) -> List[Path]:
    """Enumerate up to `limit` short simple paths from one identity to admin.

    `slack` allows paths a couple of hops longer than the shortest one, which is
    where the interesting alternatives live (the direct route is often the one a
    team already guards).
    """
    blocked = blocked or set()
    if _is_goal(survey, source):
        return []
    shortest = min_hops(survey, source, blocked)
    if shortest is None:
        return []
    ceiling = min(survey.hop_limit or max_depth, shortest + slack)

    found: List[Path] = []
    stack: List[Tuple[str, List[str], List[str]]] = [(source, [source], [])]

    while stack and len(found) < limit:
        node_id, nodes, edges = stack.pop()
        if _is_goal(survey, node_id) and edges:
            found.append(Path(source=source, nodes=list(nodes), edges=list(edges)))
            continue
        if len(edges) >= ceiling:
            continue
        # Reverse so the first successor in index order is explored first.
        for index in reversed(survey.successors(node_id)):
            if index in blocked:
                continue
            target = survey.edges[index].target
            if target in nodes:
                continue
            stack.append((target, nodes + [target], edges + [survey.edge_id(index)]))

    found.sort(key=lambda path: (path.hops, path.edges))
    return found[:limit]


def all_paths(
    survey: Survey, limit: int = 3, slack: int = 2, blocked: Optional[Set[int]] = None
) -> Dict[str, List[Path]]:
    out: Dict[str, List[Path]] = {}
    for source in survey.sources():
        routes = paths_from(survey, source, limit=limit, slack=slack, blocked=blocked)
        if routes:
            out[source] = routes
    return out


def shortest_route(survey: Survey, source: str) -> Optional[Path]:
    routes = paths_from(survey, source, limit=1, slack=0)
    return routes[0] if routes else None


def rank(survey: Survey, routes: Sequence[Path]) -> List[Path]:
    """Order routes by cost of the attack, then by how few guards they pass.

    Fewer hops win, then conditional edges are penalised (the guard might save
    you), then technique severity.
    """
    severity_weight = {"critical": 0, "high": 1, "medium": 2, "low": 3}

    def score(path: Path) -> Tuple[int, int, int]:
        conditional = 0
        weight = 0
        for edge_id in path.edges:
            edge = survey.edges[int(edge_id[1:])]
            conditional += 1 if edge.conditional else 0
            weight += severity_weight.get(edge.severity, 3)
        return (path.hops, conditional, weight)

    return sorted(routes, key=score)


def summarise(survey: Survey, limit: int = 3) -> Dict[str, object]:
    routes = all_paths(survey, limit=limit)
    every_route = [route for group in routes.values() for route in group]
    return {
        "sources_with_path": len(routes),
        "sources_total": len(survey.sources()),
        "routes_found": len(every_route),
        "shortest": min((route.hops for route in every_route), default=None),
        "admins": survey.admin_ids(),
    }
