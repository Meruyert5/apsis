import type { Bundle, GraphEdge, GraphNode } from "./types";

export interface OrganismRoute {
  nodes: string[];
  edges: GraphEdge[];
  hops: number;
}

export interface OrganismPrincipal {
  node: GraphNode;
  route: OrganismRoute;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface OrganismModel {
  nodeById: Map<string, GraphNode>;
  admins: string[];
  depth: Map<string, number>;
  maxDepth: number;
  out: Map<string, GraphEdge[]>;
  routeFor(source: string): OrganismRoute | null;
  principals: OrganismPrincipal[];
  positions: Map<string, Vec3>;
  maxRadius: number;
}

const RADIUS_BASE = 72;
const RADIUS_STEP = 38;

/**
 * Build the living-account model from one exported bundle.
 *
 * Depth is the shortest directed walk to any administrator, so it matches the
 * routes the Map lights. The signature route is used as the spiral spine: its
 * nodes receive decreasing angles from the outer ring to the nucleus, and the
 * other cells on each ring fill the remaining arc. The result is deterministic
 * for a given export.
 */
export function buildOrganism(bundle: Bundle): OrganismModel {
  const nodeById = new Map(bundle.nodes.map((node) => [node.id, node]));
  const admins = bundle.nodes.filter((node) => node.admin).map((node) => node.id);
  const adminSet = new Set(admins);
  const out = new Map<string, GraphEdge[]>();
  const incoming = new Map<string, GraphEdge[]>();

  for (const edge of bundle.edges) {
    const list = out.get(edge.source);
    if (list) list.push(edge);
    else out.set(edge.source, [edge]);
    const back = incoming.get(edge.target);
    if (back) back.push(edge);
    else incoming.set(edge.target, [edge]);
  }

  // Shortest directed walk to an administrator.
  const routeFor = (source: string): OrganismRoute | null => {
    if (adminSet.has(source)) return null;
    const seen = new Set([source]);
    const parent = new Map<string, { from: string; edge: GraphEdge }>();
    let queue = [source];
    while (queue.length > 0) {
      const next: string[] = [];
      for (const id of queue) {
        for (const edge of out.get(id) ?? []) {
          if (seen.has(edge.target)) continue;
          seen.add(edge.target);
          parent.set(edge.target, { from: id, edge });
          if (adminSet.has(edge.target)) {
            const nodes = [edge.target];
            const edges = [edge];
            let cursor = id;
            while (cursor !== source) {
              const step = parent.get(cursor);
              if (!step) return null;
              edges.push(step.edge);
              nodes.push(cursor);
              cursor = step.from;
            }
            nodes.push(source);
            nodes.reverse();
            edges.reverse();
            return { nodes, edges, hops: edges.length };
          }
          next.push(edge.target);
        }
      }
      queue = next;
    }
    return null;
  };

  // Depth is the reverse walk from the administrators.
  const depth = new Map<string, number>(admins.map((id) => [id, 0]));
  let queue = [...admins];
  while (queue.length > 0) {
    const next: string[] = [];
    for (const id of queue) {
      for (const edge of incoming.get(id) ?? []) {
        if (depth.has(edge.source)) continue;
        depth.set(edge.source, (depth.get(id) ?? 0) + 1);
        next.push(edge.source);
      }
    }
    queue = next;
  }
  const maxDepth = Math.max(1, ...depth.values());
  for (const node of bundle.nodes) {
    if (!depth.has(node.id)) depth.set(node.id, maxDepth + 1);
  }

  const principals: OrganismPrincipal[] = bundle.nodes
    .filter((node) => !node.admin && (node.kind === "user" || node.kind === "role"))
    .map((node) => ({ node, route: routeFor(node.id) }))
    .filter((item): item is OrganismPrincipal => item.route !== null)
    .sort((a, b) => a.route.hops - b.route.hops || a.node.label.localeCompare(b.node.label));

  // Spiral spine from the signature route.
  const signature = bundle.signature?.nodes ?? [];
  const spine = new Map<number, number>();
  for (const id of signature) {
    const d = depth.get(id) ?? maxDepth;
    if (d > 0) {
      spine.set(d, ((210 - (maxDepth - d) * 30) * Math.PI) / 180);
    }
  }

  const byDepth = new Map<number, GraphNode[]>();
  for (const node of bundle.nodes) {
    if (node.admin) continue;
    const d = depth.get(node.id) ?? maxDepth;
    const list = byDepth.get(d);
    if (list) list.push(node);
    else byDepth.set(d, [node]);
  }

  const positions = new Map<string, Vec3>();
  for (const [d, group] of byDepth) {
    const radius = RADIUS_BASE + d * RADIUS_STEP;
    const spineAngle = spine.get(d);
    const others = group.filter((node) => !signature.includes(node.id));
    const start = (spineAngle ?? 0) + 0.42;
    others.forEach((node, index) => {
      const angle = start + ((index + 1) * (Math.PI * 1.7)) / Math.max(1, others.length + 1);
      positions.set(node.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: Math.sin(angle * 1.6 + d) * 20,
      });
    });
    if (spineAngle !== undefined) {
      const node = group.find((item) => signature.includes(item.id));
      if (node) {
        positions.set(node.id, {
          x: Math.cos(spineAngle) * radius,
          y: Math.sin(spineAngle) * radius,
          z: Math.sin(spineAngle * 1.6 + d) * 20,
        });
      }
    }
  }

  admins.forEach((id, index) => {
    const angle = (index / Math.max(1, admins.length)) * Math.PI * 2;
    positions.set(id, {
      x: Math.cos(angle) * 18,
      y: Math.sin(angle) * 18,
      z: 0,
    });
  });

  let maxRadius = 0;
  for (const point of positions.values()) {
    maxRadius = Math.max(maxRadius, Math.hypot(point.x, point.y, point.z));
  }

  return {
    nodeById,
    admins,
    depth,
    maxDepth,
    out,
    routeFor,
    principals,
    positions,
    maxRadius,
  };
}
