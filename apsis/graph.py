"""Graph assembly and deterministic layout.

The survey is a directed graph of identities plus one synthetic administrator
node. Building it means running every technique against the account and keeping
the edges that land on a real node.

Layout runs here, not in the browser, for two reasons: the site must look the
same on every visit (a force simulation in the client drifts), and a stable
layout means screenshots, docs, and the CLI's Mermaid output all agree.
"""

from __future__ import annotations

import math
import random
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple

from .model import ADMIN, Edge, Identity, Node, Scenario, TERMINAL_TECHNIQUES
from .techniques import TECHNIQUES
from .world import World


@dataclass
class Survey:
    world: World
    nodes: Dict[str, Node] = field(default_factory=dict)
    edges: List[Edge] = field(default_factory=list)
    out: Dict[str, List[int]] = field(default_factory=dict)
    incoming: Dict[str, List[int]] = field(default_factory=dict)
    #: Optional survey filters, set by the CLI (`--source`, `--max-hops`).
    allowed_sources: Optional[Set[str]] = None
    hop_limit: Optional[int] = None

    # -- lookups ---------------------------------------------------------

    @property
    def scenario(self) -> Scenario:
        return self.world.scenario

    def edge(self, index: int) -> Edge:
        return self.edges[index]

    def edge_id(self, index: int) -> str:
        return "e%d" % index

    def node(self, node_id: str) -> Node:
        return self.nodes[node_id]

    def label(self, node_id: str) -> str:
        return self.nodes[node_id].label if node_id in self.nodes else node_id

    def admin_ids(self) -> List[str]:
        """Real administrator identities, excluding the synthetic terminus."""
        return [n.id for n in self.nodes.values() if n.admin and n.id != ADMIN]

    def sources(self) -> List[str]:
        """Identities that can hold a stolen credential and are not admin yet."""
        ids = [
            n.id
            for n in self.nodes.values()
            if n.kind in ("user", "role") and not n.admin
        ]
        if self.allowed_sources is not None:
            ids = [node_id for node_id in ids if node_id in self.allowed_sources]
        return ids

    def successors(self, node_id: str) -> List[int]:
        return self.out.get(node_id, [])

    def neighbours(self, node_id: str) -> List[str]:
        return [self.edges[i].target for i in self.out.get(node_id, [])]

    def degree(self, node_id: str) -> int:
        return len(self.out.get(node_id, [])) + len(self.incoming.get(node_id, []))

    def has_admin(self) -> bool:
        return bool(self.admin_ids())


def build(scenario: Scenario) -> Survey:
    world = World(scenario)
    survey = Survey(world=world)

    for identity in world.identities.values():
        survey.nodes[identity.id] = Node(
            id=identity.id,
            label=identity.label,
            kind=identity.kind,
            arn=identity.arn,
            admin=world.is_admin(identity.id),
            note=identity.note,
        )
    survey.nodes[ADMIN] = Node(id=ADMIN, label="Administrator", kind="admin", admin=True)

    seen: Set[Tuple[str, str, str]] = set()
    for technique in TECHNIQUES:
        for edge in technique.find(world):
            if edge.source not in survey.nodes or edge.source == ADMIN:
                continue
            if edge.target not in survey.nodes:
                continue
            if edge.key in seen:
                continue
            if not edge.name:
                edge.name = technique.name
            seen.add(edge.key)
            survey.edges.append(edge)

    survey.edges.sort(key=lambda e: (e.source, e.target, e.technique))
    for index, edge in enumerate(survey.edges):
        survey.out.setdefault(edge.source, []).append(index)
        survey.incoming.setdefault(edge.target, []).append(index)

    layout(survey)
    return survey


def layout(survey: Survey, seed: int = 11) -> None:
    """Layered survey layout: distance to an administrator sets the column.

    A force simulation turns an IAM graph into a hairball, because most edges
    point at the same two roles. Columns make the reading obvious: identities on
    the left, administrator on the right, one column per hop.

    Within a column, nodes are ordered by the mean position of their neighbours
    in the adjacent column (a barycentre pass), which keeps long routes from
    crossing each other.
    """
    ids = sorted(survey.nodes.keys())
    if not ids:
        return

    rng = random.Random(seed)
    outgoing: Dict[str, List[str]] = {node_id: [] for node_id in ids}
    incoming: Dict[str, List[str]] = {node_id: [] for node_id in ids}
    for edge in survey.edges:
        outgoing[edge.source].append(edge.target)
        incoming[edge.target].append(edge.source)

    admins = [node_id for node_id in ids if survey.nodes[node_id].admin]
    distance: Dict[str, int] = {node_id: 0 for node_id in admins}
    queue = deque(admins)
    while queue:
        current = queue.popleft()
        for predecessor in incoming[current]:
            if predecessor not in distance:
                distance[predecessor] = distance[current] + 1
                queue.append(predecessor)

    unreachable = max(distance.values(), default=0) + 1
    for node_id in ids:
        distance.setdefault(node_id, unreachable)

    layers: Dict[int, List[str]] = {}
    for node_id in ids:
        layers.setdefault(distance[node_id], []).append(node_id)

    order: Dict[int, List[str]] = {}
    for depth, members in layers.items():
        order[depth] = sorted(members, key=lambda item: (-len(incoming[item]), item))

    depths = sorted(layers.keys())
    for _ in range(4):
        for index in range(1, len(depths)):
            previous = order[depths[index - 1]]
            position = {node_id: pos for pos, node_id in enumerate(previous)}

            def back(node_id: str) -> float:
                neighbours = [position[n] for n in incoming[node_id] if n in position]
                return sum(neighbours) / len(neighbours) if neighbours else 1e6

            order[depths[index]].sort(key=back)
        for index in range(len(depths) - 2, -1, -1):
            following = order[depths[index + 1]]
            position = {node_id: pos for pos, node_id in enumerate(following)}

            def fwd(node_id: str) -> float:
                neighbours = [position[n] for n in outgoing[node_id] if n in position]
                return sum(neighbours) / len(neighbours) if neighbours else 1e6

            order[depths[index]].sort(key=fwd)

    span = max(depths) if depths else 0
    for depth in depths:
        members = order[depth]
        count = len(members)
        column = 0.5 if span == 0 else 0.07 + 0.86 * (1.0 - depth / span)
        for index, node_id in enumerate(members):
            share = (index + 0.5) / count
            survey.nodes[node_id].x = round(column + rng.uniform(-0.008, 0.008), 4)
            survey.nodes[node_id].y = round(0.09 + 0.82 * share, 4)


def technique_counts(survey: Survey) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for edge in survey.edges:
        counts[edge.technique] = counts.get(edge.technique, 0) + 1
    return counts
