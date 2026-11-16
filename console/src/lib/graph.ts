import type { Bundle, GraphEdge, GraphNode, NodeKind } from "./types";

export interface RouteModel {
  nodes: string[];
  edges: GraphEdge[];
  hops: number;
}

export interface GraphIndex {
  nodes: Map<string, GraphNode>;
  byId: Map<string, GraphEdge>;
  out: Map<string, GraphEdge[]>;
  principals: string[];
  admins: string[];
}

export function indexGraph(bundle: Bundle): GraphIndex {
  const nodes = new Map(bundle.nodes.map((node) => [node.id, node]));
  const byId = new Map(bundle.edges.map((edge) => [edge.id, edge]));
  const out = new Map<string, GraphEdge[]>();
  for (const edge of bundle.edges) {
    const list = out.get(edge.source);
    if (list) list.push(edge);
    else out.set(edge.source, [edge]);
  }
  const principals = bundle.nodes
    .filter((node) => (node.kind === "user" || node.kind === "role") && !node.admin)
    .map((node) => node.id)
    .sort();
  const admins = bundle.nodes.filter((node) => node.admin).map((node) => node.id);
  return { nodes, byId, out, principals, admins };
}

const isGoal = (index: GraphIndex, node: string) =>
  Boolean(index.nodes.get(node)?.admin);

/**
 * Breadth-first shortest route from one principal to any administrator,
 * skipping severed edges. The same walk the engine runs, ported to the page.
 */
export function shortestRoute(
  index: GraphIndex,
  source: string,
  cut: ReadonlySet<string>,
): RouteModel | null {
  if (isGoal(index, source)) return null;
  const seen = new Set<string>([source]);
  const parent = new Map<string, { node: string; edge: GraphEdge }>();
  const queue: string[] = [source];

  while (queue.length > 0) {
    const node = queue.shift() as string;
    const edges = (index.out.get(node) ?? [])
      .filter((edge) => !cut.has(edge.id))
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
    for (const edge of edges) {
      if (seen.has(edge.target)) continue;
      seen.add(edge.target);
      parent.set(edge.target, { node, edge });
      if (isGoal(index, edge.target)) {
        const nodes = [edge.target];
        const path: GraphEdge[] = [];
        let cursor = edge.target;
        while (cursor !== source) {
          const step = parent.get(cursor);
          if (!step) return null;
          path.push(step.edge);
          nodes.push(step.node);
          cursor = step.node;
        }
        nodes.reverse();
        path.reverse();
        return { nodes, edges: path, hops: path.length };
      }
      queue.push(edge.target);
    }
  }
  return null;
}

/** Every principal id that still reaches an administrator. */
export function reachableSources(index: GraphIndex, cut: ReadonlySet<string>): Set<string> {
  const reached = new Set<string>();
  for (const source of index.principals) {
    if (shortestRoute(index, source, cut)) reached.add(source);
  }
  return reached;
}

/** Route for every principal that still has one, cheapest first. */
export interface PrincipalRow {
  id: string;
  label: string;
  kind: NodeKind;
  route: RouteModel;
}

export function principalRoutes(index: GraphIndex, cut: ReadonlySet<string>): PrincipalRow[] {
  const rows: PrincipalRow[] = [];
  for (const source of index.principals) {
    const route = shortestRoute(index, source, cut);
    if (!route) continue;
    const node = index.nodes.get(source);
    rows.push({
      id: source,
      label: node?.label ?? source,
      kind: node?.kind ?? "role",
      route,
    });
  }
  return rows.sort((a, b) => a.route.hops - b.route.hops || a.label.localeCompare(b.label));
}
