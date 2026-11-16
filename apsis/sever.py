"""Severing routes.

Two remediation answers, because defenders ask two different questions.

`minimum_edge_cut` is exact: the smallest set of escalation steps whose removal
disconnects every identity from administrator. It comes from a max-flow
computation (Dinic), with unit capacity per step. Useful for proving the graph
is closed.

`permission_cut` is the answer a human can act on: revoke whole IAM actions,
greedily choosing the one that kills the most routes per call. Removing
`iam:PassRole` from three roles beats editing nine individual edge conditions,
and it is a change a reviewer can reason about.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple

from .graph import Survey
from .model import ADMIN
from . import paths as pathmod


class _Dinic:
    """Small max-flow implementation. No dependencies, no surprises."""

    def __init__(self, size: int) -> None:
        self.size = size
        self.graph: List[List[List[int]]] = [[] for _ in range(size)]
        self.arcs: List[Tuple[int, int, int, Optional[int]]] = []

    def add(self, source: int, target: int, capacity: int, edge_index: Optional[int] = None) -> None:
        forward = [target, capacity, len(self.graph[target])]
        backward = [source, 0, len(self.graph[source])]
        self.graph[source].append(forward)
        self.graph[target].append(backward)
        self.arcs.append((source, target, capacity, edge_index))

    def _levels(self, source: int, sink: int) -> List[int]:
        level = [-1] * self.size
        level[source] = 0
        queue = deque([source])
        while queue:
            node = queue.popleft()
            for target, capacity, _ in self.graph[node]:
                if capacity > 0 and level[target] < 0:
                    level[target] = level[node] + 1
                    queue.append(target)
        return level

    def _push(self, node: int, sink: int, flow: int, level: List[int], cursor: List[int]) -> int:
        if node == sink:
            return flow
        while cursor[node] < len(self.graph[node]):
            arc = self.graph[node][cursor[node]]
            target, capacity, reverse = arc
            if capacity > 0 and level[target] == level[node] + 1:
                pushed = self._push(target, sink, min(flow, capacity), level, cursor)
                if pushed > 0:
                    arc[1] -= pushed
                    self.graph[target][reverse][1] += pushed
                    return pushed
            cursor[node] += 1
        return 0

    def maxflow(self, source: int, sink: int) -> int:
        total = 0
        while True:
            level = self._levels(source, sink)
            if level[sink] < 0:
                return total
            cursor = [0] * self.size
            while True:
                pushed = self._push(source, sink, 10**9, level, cursor)
                if pushed == 0:
                    break
                total += pushed

    def reachable_from(self, source: int) -> Set[int]:
        seen = {source}
        queue = deque([source])
        while queue:
            node = queue.popleft()
            for target, capacity, _ in self.graph[node]:
                if capacity > 0 and target not in seen:
                    seen.add(target)
                    queue.append(target)
        return seen


def _sources(survey: Survey) -> List[str]:
    return [node_id for node_id in survey.sources()]


def count_reachable_sources(survey: Survey, blocked: Optional[Set[int]] = None) -> int:
    blocked = blocked or set()
    total = 0
    for source in _sources(survey):
        reached = pathmod.reachable(survey, source, blocked)
        if any(survey.nodes[node].admin for node in reached):
            total += 1
    return total


@dataclass
class EdgeCut:
    edges: List[int] = field(default_factory=list)
    by_technique: Dict[str, int] = field(default_factory=dict)
    by_action: Dict[str, int] = field(default_factory=dict)

    @property
    def size(self) -> int:
        return len(self.edges)


@dataclass
class PermissionStep:
    action: str
    edges_removed: int
    routes_killed: int


@dataclass
class SeverResult:
    routes_before: int
    routes_after: int
    routes_after_revoke: int = 0
    edge_cut: EdgeCut = field(default_factory=EdgeCut)
    permission_steps: List[PermissionStep] = field(default_factory=list)
    disconnected: List[str] = field(default_factory=list)

    @property
    def closed(self) -> bool:
        return self.routes_after == 0

    @property
    def revoke_closed(self) -> bool:
        return self.routes_after_revoke == 0


def minimum_edge_cut(survey: Survey, blocked: Optional[Set[int]] = None) -> EdgeCut:
    """Exact minimum set of escalation steps to remove."""
    blocked = blocked or set()
    active = [index for index in range(len(survey.edges)) if index not in blocked]
    if not active or not survey.has_admin():
        return EdgeCut()

    id_to_index: Dict[str, int] = {}
    for node_id in survey.nodes:
        id_to_index[node_id] = len(id_to_index)
    super_source = len(id_to_index)
    super_sink = super_source + 1
    flow = _Dinic(super_sink + 1)

    infinity = len(active) + 1
    for source in _sources(survey):
        flow.add(super_source, id_to_index[source], infinity)
    admin_nodes = [node_id for node_id, node in survey.nodes.items() if node.admin]
    for admin in admin_nodes:
        flow.add(id_to_index[admin], super_sink, infinity)

    for index in active:
        edge = survey.edges[index]
        flow.add(id_to_index[edge.source], id_to_index[edge.target], 1, edge_index=index)

    flow.maxflow(super_source, super_sink)
    reachable = flow.reachable_from(super_source)

    cut = EdgeCut()
    for source, target, capacity, edge_index in flow.arcs:
        if edge_index is None:
            continue
        if capacity != 1:
            continue
        if source in reachable and target not in reachable:
            cut.edges.append(edge_index)
            edge = survey.edges[edge_index]
            cut.by_technique[edge.technique] = cut.by_technique.get(edge.technique, 0) + 1
            for action in edge.actions:
                cut.by_action[action] = cut.by_action.get(action, 0) + 1

    cut.edges.sort()
    return cut


def permission_cut(
    survey: Survey, blocked: Optional[Set[int]] = None, max_steps: int = 8
) -> List[PermissionStep]:
    """Greedy action-level remediation: the fewest API permissions to revoke."""
    blocked = set(blocked or set())
    steps: List[PermissionStep] = []
    ceiling = count_reachable_sources(survey, blocked)
    if ceiling == 0:
        return steps

    current = ceiling
    for _ in range(max_steps):
        if current == 0:
            break
        candidates: Set[str] = set()
        for index, edge in enumerate(survey.edges):
            if index in blocked:
                continue
            candidates.update(edge.actions)

        best: Optional[Tuple[int, int, str, Set[int]]] = None
        for action in sorted(candidates):
            removed = {
                index
                for index, edge in enumerate(survey.edges)
                if index not in blocked and action in edge.actions
            }
            if not removed:
                continue
            after = count_reachable_sources(survey, blocked | removed)
            killed = current - after
            if killed <= 0:
                continue
            key = (-killed, len(removed), action)
            if best is None or key < best[:3]:
                best = (key[0], key[1], action, removed)

        if best is None:
            break
        _, removed_count, action, removed_edges = best
        after = count_reachable_sources(survey, blocked | removed_edges)
        steps.append(PermissionStep(action=action, edges_removed=len(removed_edges), routes_killed=current - after))
        blocked |= removed_edges
        current = after

    return steps


def sever(
    survey: Survey,
    blocked: Optional[Set[int]] = None,
    revoke_actions: Sequence[str] = (),
) -> SeverResult:
    """Run both cuts and report the before/after picture.

    `routes_after_revoke` answers the narrow question a reviewer asks during a
    change review: if we revoke only these actions, what stays open?
    `routes_after` answers the planning question: after the recommended
    remediation, is the account closed?
    """
    explicit = set(blocked or set())
    for action in revoke_actions:
        for index, edge in enumerate(survey.edges):
            if action in edge.actions:
                explicit.add(index)

    before = count_reachable_sources(survey, set())
    after_revoke = count_reachable_sources(survey, explicit)

    cut = minimum_edge_cut(survey, explicit)
    steps = permission_cut(survey, explicit)

    remediated = set(explicit)
    for step in steps:
        for index, edge in enumerate(survey.edges):
            if step.action in edge.actions:
                remediated.add(index)
    after = count_reachable_sources(survey, remediated)

    disconnected = []
    for source in _sources(survey):
        reached = pathmod.reachable(survey, source, explicit)
        if any(survey.nodes[node].admin for node in reached):
            disconnected.append(source)

    return SeverResult(
        routes_before=before,
        routes_after=after,
        routes_after_revoke=after_revoke,
        edge_cut=cut,
        permission_steps=steps,
        disconnected=disconnected,
    )
