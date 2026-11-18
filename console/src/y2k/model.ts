import commandsRaw from "../data/commands.json";
import {
  accountShort,
  bundles,
  byKey,
  coverage,
  signatureRoute,
  techniques,
  totals,
} from "../lib/data";
import type { Bundle, CommandRecord, GraphEdge, Route, Severity, Technique } from "../lib/types";

export interface FleetRow {
  key: string;
  short: string;
  title: string;
  accountId: string;
  region: string;
  identities: number;
  routes: number;
  cut: number;
  admins: number;
  shortest: number | null;
  severity: Severity;
  state: "contained" | "open";
}

export const snapshot = {
  accounts: totals.accounts,
  identities: totals.identities,
  routes: totals.routes,
  cut: totals.cut,
  deepest: totals.deepest,
  writes: 0,
};

export const fleet: FleetRow[] = bundles
  .map(({ key, bundle }): FleetRow => ({
    key,
    short: accountShort(key),
    title: bundle.scenario.title,
    accountId: bundle.scenario.accountId,
    region: bundle.scenario.region,
    identities: bundle.stats.identities,
    routes: bundle.stats.routes,
    cut: bundle.sever.edgeCut.edges.length,
    admins: bundle.stats.admins.length,
    shortest: bundle.stats.shortest,
    severity: bundle.scenario.severity,
    state: bundle.sever.routesAfter === 0 ? "contained" : "open",
  }))
  .sort((a, b) => b.routes - a.routes || b.identities - a.identities);

export const showcase = byKey.get("games-studio") ?? bundles[0].bundle;
export const showcaseRoute: Route = signatureRoute(showcase)!;
export const shortest = showcase.stats.shortest ?? 0;
export const engineLabel = `${showcase.engine.name} ${showcase.engine.version}`;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const two = (value: number) => String(value).padStart(2, "0");
const generated = new Date(showcase.generated);

export const generatedLabel = `${two(generated.getUTCDate())} ${
  MONTHS[generated.getUTCMonth()]
} ${generated.getUTCFullYear()} / ${two(generated.getUTCHours())}:${two(
  generated.getUTCMinutes(),
)} UTC`;

export const generatedIso = showcase.generated;

/* ---------------------------------------------------------------- routes */
export interface RouteGroup {
  sourceId: string;
  source: string;
  routes: Route[];
}

export function routesFor(bundle: Bundle): RouteGroup[] {
  const labels = new Map(bundle.nodes.map((node) => [node.id, node.label]));
  return Object.entries(bundle.paths)
    .map(([sourceId, routes]) => ({
      sourceId,
      source: labels.get(sourceId) ?? sourceId,
      routes: routes.filter((route) => route.hops > 0),
    }))
    .filter((group) => group.routes.length > 0)
    .sort(
      (a, b) =>
        Math.max(...b.routes.map((route) => route.hops)) -
          Math.max(...a.routes.map((route) => route.hops)) || a.source.localeCompare(b.source),
    );
}

export const routeGroups = new Map(bundles.map(({ key, bundle }) => [key, routesFor(bundle)]));

/* ------------------------------------------------------------------ drift */
export interface DriftRoute {
  source: string;
  sourceLabel: string;
  labels: string[];
  hops: number;
  edges: string[];
}

export interface DriftSummary {
  beforeKey: string;
  afterKey: string;
  beforeTitle: string;
  afterTitle: string;
  beforeRoutes: number;
  afterRoutes: number;
  added: GraphEdge[];
  removed: GraphEdge[];
  newRoutes: DriftRoute[];
  lostRoutes: DriftRoute[];
  status: "worsened" | "improved" | "steady";
}

function flattenRoutes(bundle: Bundle): DriftRoute[] {
  const labels = new Map(bundle.nodes.map((node) => [node.id, node.label]));
  return Object.entries(bundle.paths).flatMap(([source, routes]) =>
    routes.map((route) => ({
      source,
      sourceLabel: labels.get(source) ?? source,
      labels: route.labels,
      hops: route.hops,
      edges: route.edges,
    })),
  );
}

export function driftFor(beforeKey: string, afterKey: string): DriftSummary {
  const before = byKey.get(beforeKey) ?? bundles[0].bundle;
  const after = byKey.get(afterKey) ?? bundles[0].bundle;
  const keyOf = (edge: GraphEdge): string =>
    `${edge.source}|${edge.target}|${edge.technique}`;
  const beforeEdges = new Map(before.edges.map((edge) => [keyOf(edge), edge]));
  const afterEdges = new Map(after.edges.map((edge) => [keyOf(edge), edge]));
  const added = [...afterEdges.entries()]
    .filter(([key]) => !beforeEdges.has(key))
    .map(([, edge]) => edge);
  const removed = [...beforeEdges.entries()]
    .filter(([key]) => !afterEdges.has(key))
    .map(([, edge]) => edge);
  const beforeRoutes = flattenRoutes(before);
  const afterRoutes = flattenRoutes(after);
  const routeKey = (route: DriftRoute) => route.edges.join("|");
  const beforeKeys = new Set(beforeRoutes.map(routeKey));
  const afterKeys = new Set(afterRoutes.map(routeKey));
  const newRoutes = afterRoutes.filter((route) => !beforeKeys.has(routeKey(route)));
  const lostRoutes = beforeRoutes.filter((route) => !afterKeys.has(routeKey(route)));
  const status = added.length || newRoutes.length
    ? "worsened"
    : removed.length || lostRoutes.length
      ? "improved"
      : "steady";
  return {
    beforeKey,
    afterKey,
    beforeTitle: before.scenario.title,
    afterTitle: after.scenario.title,
    beforeRoutes: beforeRoutes.length,
    afterRoutes: afterRoutes.length,
    added,
    removed,
    newRoutes,
    lostRoutes,
    status,
  };
}

export const driftPair = { before: "ci-cd", after: "ci-cd-after" };

/* ---------------------------------------------------------------- ledger */
export interface LedgerRow {
  account: string;
  short: string;
  source: string;
  route: number;
  hops: number;
  hop: number;
  from: string;
  to: string;
  technique: string;
  actions: string;
  conditional: boolean;
  observed: boolean;
}

export function ledgerRows(): LedgerRow[] {
  const rows: LedgerRow[] = [];
  for (const account of fleet) {
    const groups = routeGroups.get(account.key) ?? [];
    for (const group of groups) {
      group.routes.forEach((route, routeIndex) => {
        route.steps.forEach((step, hopIndex) => {
          rows.push({
            account: account.key,
            short: account.short,
            source: group.source,
            route: routeIndex + 1,
            hops: route.hops,
            hop: hopIndex + 1,
            from: route.labels[hopIndex] ?? group.source,
            to: route.labels[hopIndex + 1] ?? "Administrator",
            technique: step.technique,
            actions: step.actions.join(" "),
            conditional: step.conditional,
            observed: Boolean(step.observed),
          });
        });
      });
    }
  }
  return rows;
}

export function ledgerCsv(rows: LedgerRow[]): string {
  const header = [
    "account", "account_short", "source", "route", "hops", "hop",
    "from", "to", "technique", "actions", "conditional", "observed",
  ];
  const escape = (value: string | number | boolean) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    header.join(","),
    ...rows.map((row) => [
      row.account, row.short, row.source, row.route, row.hops, row.hop,
      row.from, row.to, row.technique, row.actions, row.conditional, row.observed,
    ].map(escape).join(",")),
  ].join("\n");
}



/* ---------------------------------------------------------------- commands */
const commandData = commandsRaw as { generated: string; records: CommandRecord[] };
export const commands = commandData.records;
export const commandGenerated = commandData.generated;
export const commandVerbs = [...new Set(commands.map((record) => record.verb))];
export const commandScenarios = [
  ...new Set(commands.map((record) => record.scenario).filter((value): value is string => Boolean(value))),
];

export function scenarioTitle(key: string | null): string {
  if (!key) return "All scenarios";
  return byKey.get(key)?.scenario.title ?? key;
}

/* ---------------------------------------------------------------- coverage */
const coverageTable = coverage();

export interface TechniqueRow extends Technique {
  accounts: number;
  edges: number;
}

export const techniqueRows: TechniqueRow[] = techniques
  .map((technique) => {
    let accounts = 0;
    let edges = 0;
    for (const { key, bundle } of bundles) {
      const count = coverageTable.get(key)?.get(technique.id) ?? 0;
      if (count > 0) accounts += 1;
      edges += bundle.edges.filter((edge) => edge.technique === technique.id).length;
    }
    return { ...technique, accounts, edges };
  })
  .sort((a, b) => b.edges - a.edges || a.name.localeCompare(b.name));

export const coverageCells = fleet.map((row) => ({
  account: row,
  techniques: techniqueRows.map(
    (technique) => coverageTable.get(row.key)?.get(technique.id) ?? 0,
  ),
}));

export const coverageMax = Math.max(
  1,
  ...coverageCells.flatMap((row) => row.techniques),
);

/* ---------------------------------------------------------------- survey */
export const severityCounts = fleet.reduce(
  (acc, row) => {
    acc[row.severity] += 1;
    return acc;
  },
  { critical: 0, high: 0, medium: 0, low: 0 } as Record<Severity, number>,
);

export const averageRoutes = Math.round(totals.routes / totals.accounts);
export const criticalAccounts = severityCounts.critical;
export const techniqueCount = techniques.length;

/* ---------------------------------------------------------------- case */
export const caseStudy = {
  id: "case-01",
  title: "The observed path",
  account: showcase.scenario.title,
  accountId: showcase.scenario.accountId,
  window: "2026-11-16 18:00–18:42 UTC",
  kind: "path.opened",
  summary:
    "The signature route from Tools intern to the administrator became observed in CloudTrail. The graph had carried it as theoretical; the evidence window made every edge observed.",
  route: showcaseRoute.labels,
  cut: [
    "Revoke iam:CreatePolicyVersion from the backup policy.",
    "Revoke iam:CreateAccessKey from the support role.",
  ],
  guardrails: [
    "SCP: deny iam:PassRole to compute outside the platform role set.",
    "SCP + Config: deny iam:CreatePolicyVersion outside the policy platform role.",
    "CloudTrail alarm: CreateAccessKey outside the key service.",
  ],
  after: "0 routes after the cut",
  alert: "cases/01-observed-path/alert.json",
  handoff: "detection-lab/integrations/apsis/",
  note:
    "Synthetic, reproducible case built from the shipped fixture. No customer account, credential, or live export.",
};

/* ---------------------------------------------------------------- contracts */
export const contracts = [
  {
    file: "schema/alert.schema.json",
    name: "Alert",
    detail: "path.opened / path.closed / graph drift",
    owner: "Apsis",
    status: "ready",
  },
  {
    file: "schema/evidence.schema.json",
    name: "Evidence",
    detail: "Events and graph facts behind one finding",
    owner: "Apsis",
    status: "ready",
  },
  {
    file: "cases/01-observed-path/case.md",
    name: "Case",
    detail: "Human narrative, before and after",
    owner: "Apsis",
    status: "ready",
  },
  {
    file: "cases/01-observed-path/guardrail.md",
    name: "Guardrail",
    detail: "SCP, Config and alarm conditions",
    owner: "Apsis",
    status: "ready",
  },
  {
    file: "cases/01-observed-path/alert.json",
    name: "Alert instance",
    detail: "Validated penumbra.alert/v1 path.opened payload",
    owner: "Apsis",
    status: "ready",
  },
  {
    file: "detection-lab/integrations/apsis/",
    name: "Penumbra handoff",
    detail: "Alert, evidence, case, guardrails and before/after snapshots",
    owner: "Penumbra",
    status: "delivered",
  },
  {
    file: "penumbra.alert/v1",
    name: "Penumbra handoff",
    detail: "One alert, one evidence manifest, no connector",
    owner: "Penumbra",
    status: "contract",
  },
];

/* ---------------------------------------------------------------- plan */
export const pipeline = [
  {
    id: "ingest",
    label: "Ingest",
    value: totals.identities,
    unit: "identities",
    detail: "Parse an AWS authorization export: users, roles, groups, policies and trust.",
  },
  {
    id: "compose",
    label: "Compose",
    value: techniques.length,
    unit: "primitives",
    detail: "Compose each primitive into edges that carry the IAM action, statement and MITRE mapping.",
  },
  {
    id: "find",
    label: "Find",
    value: totals.routes,
    unit: "routes",
    detail: "Search the graph for every walk from a low-privilege principal to administrator.",
  },
  {
    id: "sever",
    label: "Sever",
    value: totals.cut,
    unit: "edges",
    detail: "Run the minimum cut, then group the edges into IAM actions a human can approve.",
  },
  {
    id: "prove",
    label: "Prove",
    value: 5,
    unit: "artifacts",
    detail: "Emit the report, alert, evidence, case and guardrail without writing to the account.",
  },
];

export const modules = [
  { id: "overview", index: "01", label: "Overview", detail: "Fleet posture and the live instruments" },
  { id: "survey", index: "02", label: "Survey", detail: "Exposure, severity and account ranking" },
  { id: "path", index: "03", label: "Path map", detail: "Step and sever the signature escalation" },
  { id: "atlas", index: "04", label: "Atlas", detail: "Accounts, identities and trust in one map" },
  { id: "drift", index: "05", label: "Drift", detail: "Compare two snapshots, route aware" },
  { id: "commands", index: "06", label: "Commands", detail: "Recorded CLI runs, replayable" },
  { id: "extensions", index: "07", label: "Extensions", detail: "18 primitives, coverage, contracts, case" },
  { id: "blueprint", index: "08", label: "Blueprint", detail: "Architecture, roadmap and release state" },
];

export const roadmap = {
  now: [
    "18 primitives, 16 fixtures, route survey, minimum cut",
    "Eight-view dashboard, CloudTrail overlay, live IAM import",
    "Condition and resource-policy evaluation, drift, CSV ledger",
    "Penumbra handoff, CI accessibility + Lighthouse, Pages workflow",
  ],
  next: [
    "Benchmark against PMapper",
    "Expand condition coverage and real-account import coverage",
    "A performance budget for the 3D instruments",
  ],
  later: [
    "Network threat-hunting lab",
    "More primitives with fixture coverage",
  ],
};

export type ViewId =
  | "overview"
  | "survey"
  | "path"
  | "atlas"
  | "drift"
  | "commands"
  | "extensions"
  | "blueprint";
