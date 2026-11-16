import rawIndex from "../data/index.json";
import type { Bundle, GraphEdge, GraphNode, Index, Route } from "./types";

const modules = import.meta.glob<Bundle>(["../data/*.json", "!../data/commands.json"], {
  eager: true,
  import: "default",
});

/** Account bundles only. `index.json` and `commands.json` live beside them. */
const NOT_A_BUNDLE = new Set(["index", "commands"]);

export const index = rawIndex as unknown as Index;

/** Every exported account, ordered by how exposed it is: routes first, then size. */
export const bundles: { key: string; bundle: Bundle }[] = Object.entries(modules)
  .filter(([path]) => {
    const name = path.replace("../data/", "").replace(".json", "");
    return !NOT_A_BUNDLE.has(name);
  })
  .map(([path, bundle]) => ({ key: path.replace("../data/", "").replace(".json", ""), bundle }))
  .sort((a, b) => {
    const exposure = b.bundle.stats.sourcesWithPath - a.bundle.stats.sourcesWithPath;
    if (exposure !== 0) return exposure;
    return b.bundle.stats.routes - a.bundle.stats.routes;
  });

export const byKey = new Map(bundles.map((entry) => [entry.key, entry.bundle]));

export function accountTitle(key: string): string {
  return byKey.get(key)?.scenario.title ?? key;
}

/** Column-head label. Two accounts can share a title stem, so the key wins. */
const SHORT: Record<string, string> = {
  startup: "Series A",
  enterprise: "Enterprise",
  "ml-platform": "ML platform",
  legacy: "Legacy",
  "multi-account": "Multi-acct",
  "ci-cd": "CI/CD",
  "ci-cd-after": "CI/CD after",
  fintech: "Fintech",
  healthcare: "Health",
  "games-studio": "Games",
  "gov-contractor": "Gov",
};

export function accountShort(key: string): string {
  if (SHORT[key]) return SHORT[key];
  return accountTitle(key).split(/[,:]/)[0].split(" ").slice(0, 2).join(" ");
}

export function nodeById(bundle: Bundle): Map<string, GraphNode> {
  return new Map(bundle.nodes.map((node) => [node.id, node]));
}

export function edgeById(bundle: Bundle): Map<string, GraphEdge> {
  return new Map(bundle.edges.map((edge) => [edge.id, edge]));
}

/** The registry arrives per bundle and is identical in every one. */
const registry = bundles[0]?.bundle.registry ?? [];

export const techniques = [...registry].sort(
  (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
);

export const categoryOrder = ["identity", "compute", "trust"] as const;
export type Category = (typeof categoryOrder)[number] | "all";

export const categoryLabel: Record<string, string> = {
  all: "Everything",
  identity: "Identity",
  compute: "Compute",
  trust: "Trust",
};

/** Count of escalation edges that use each technique, per account key. */
export function coverage(): Map<string, Map<string, number>> {
  const table = new Map<string, Map<string, number>>();
  for (const { key, bundle } of bundles) {
    const row = new Map<string, number>();
    for (const edge of bundle.edges) {
      row.set(edge.technique, (row.get(edge.technique) ?? 0) + 1);
    }
    table.set(key, row);
  }
  return table;
}

export function signatureRoute(bundle: Bundle): Route | null {
  return bundle.signature ?? Object.values(bundle.paths)[0]?.[0] ?? null;
}

export const totals = {
  accounts: bundles.length,
  identities: bundles.reduce((sum, entry) => sum + entry.bundle.stats.identities, 0),
  edges: bundles.reduce((sum, entry) => sum + entry.bundle.stats.edges, 0),
  routes: bundles.reduce((sum, entry) => sum + entry.bundle.stats.routes, 0),
  cut: bundles.reduce((sum, entry) => sum + entry.bundle.sever.edgeCut.edges.length, 0),
  techniques: techniques.length,
  deepest: Math.max(
    0,
    ...bundles.flatMap((entry) =>
      Object.values(entry.bundle.paths).flatMap((group) => group.map((route) => route.hops)),
    ),
  ),
};


