import type { Bundle, GraphNode } from "./types";
import { hashIndex } from "./arch";

/* A deterministic permission orrery. Administrators are the sun at the
   centre; every other identity sits on an ecliptic orbit whose radius is
   its hop depth from an administrator. Coordinates are world units,
   projected to pixels by `projectPoint`. */

export interface SpatialNode {
  id: string;
  label: string;
  kind: GraphNode["kind"];
  admin: boolean;
  depth: number;
  x: number;
  y: number;
  z: number;
}

export interface SpatialRing {
  depth: number;
  y: number;
  radius: number;
}

export interface SpatialLayout {
  nodes: SpatialNode[];
  rings: SpatialRing[];
  maxDepth: number;
}

function assignDepths(
  nodes: Pick<GraphNode, "id" | "admin">[],
  edges: { source: string; target: string }[],
): { depth: Map<string, number>; max: number } {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }
  const depth = new Map<string, number>();
  const queue = nodes.filter((node) => node.admin).map((node) => node.id);
  for (const id of queue) depth.set(id, 0);
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const from = depth.get(current) ?? 0;
    for (const next of adjacency.get(current) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, from + 1);
        queue.push(next);
      }
    }
  }
  const max = Math.max(0, ...Array.from(depth.values()));
  for (const node of nodes) if (!depth.has(node.id)) depth.set(node.id, max + 1);
  return { depth, max: Math.max(max, 1) };
}

export function spatialLayout(bundle: Bundle): SpatialLayout {
  const { depth, max } = assignDepths(bundle.nodes, bundle.edges);
  const byRing = new Map<number, GraphNode[]>();
  for (const node of bundle.nodes) {
    const ring = depth.get(node.id) ?? max;
    const list = byRing.get(ring);
    if (list) list.push(node);
    else byRing.set(ring, [node]);
  }

  const nodes: SpatialNode[] = [];
  const rings: SpatialRing[] = [];

  for (const [depthValue, members] of byRing) {
    if (depthValue === 0) {
      const ordered = [...members].sort((a, b) => a.id.localeCompare(b.id));
      ordered.forEach((node, index) => {
        nodes.push({
          id: node.id,
          label: node.label,
          kind: node.kind,
          admin: node.admin,
          depth: 0,
          x: (index - (ordered.length - 1) / 2) * 0.18,
          y: 0.02,
          z: (index % 2 === 0 ? 0.04 : -0.04),
        });
      });
      continue;
    }

    const t = Math.min(1, depthValue / max);
    const radius = 0.62 + 1.62 * t;
    const y = 0.02 + (depthValue % 2 === 0 ? 0.025 : -0.015);
    rings.push({ depth: depthValue, y, radius });

    const ordered = [...members].sort(
      (a, b) => hashIndex(a.id) - hashIndex(b.id) || a.id.localeCompare(b.id),
    );

    ordered.forEach((node, index) => {
      const angle =
        ((index + 0.5) / ordered.length) * Math.PI * 2 +
        depthValue * 0.58 +
        ((hashIndex(node.id) % 23) / 23 - 0.5) * 0.08;
      const lift = ((hashIndex(node.id) % 13) / 13 - 0.5) * 0.035;
      nodes.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        admin: node.admin,
        depth: depthValue,
        x: Math.cos(angle) * radius,
        y: y + lift,
        z: Math.sin(angle) * radius,
      });
    });
  }

  nodes.sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
  return { nodes, rings, maxDepth: max };
}
