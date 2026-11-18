/** Shapes emitted by `apsis export --all`. Mirrors apsis/report.py. */

export type Severity = "critical" | "high" | "medium" | "low";

export type NodeKind =
  | "user"
  | "role"
  | "group"
  | "admin"
  | "lambda"
  | "ec2"
  | "ecs"
  | "glue"
  | "sagemaker"
  | "cloudformation";

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  admin: boolean;
  x: number;
  y: number;
  degree: number;
  note: string;
  arn: string;
  groups: string[];
  trust: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  technique: string;
  name: string;
  severity: Severity;
  mitre: string;
  actions: string[];
  conditional: boolean;
  evidence: string;
  narration: string;
  fix: string;
  observed?: boolean;
  firstSeen?: string | null;
  lastSeen?: string | null;
}

export interface RouteStep {
  edge: string;
  technique: string;
  name: string;
  narration: string;
  actions: string[];
  mitre: string;
  evidence: string;
  conditional: boolean;
  observed?: boolean;
  firstSeen?: string | null;
  lastSeen?: string | null;
}

export interface Route {
  hops: number;
  nodes: string[];
  edges: string[];
  labels: string[];
  steps: RouteStep[];
}

export interface PermissionStep {
  action: string;
  edgesRemoved: number;
  routesKilled: number;
}

export interface SeverSummary {
  routesBefore: number;
  routesAfter: number;
  closed: boolean;
  edgeCut: {
    edges: string[];
    byTechnique: Record<string, number>;
    byAction: Record<string, number>;
  };
  permissionSteps: PermissionStep[];
}

export interface Technique {
  id: string;
  name: string;
  category: string;
  severity: Severity;
  mitre: string;
  summary: string;
  fix: string;
  actions: string[];
}

export interface Bundle {
  generated: string;
  engine: { name: string; version: string };
  scenario: {
    name: string;
    title: string;
    summary: string;
    accountId: string;
    region: string;
    severity: Severity;
  };
  stats: {
    identities: number;
    resources: number;
    edges: number;
    sourcesWithPath: number;
    sources: number;
    routes: number;
    shortest: number | null;
    admins: string[];
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths: Record<string, Route[]>;
  sever: SeverSummary;
  signature: Route | null;
  registry: Technique[];
}

export interface IndexEntry {
  key: string;
  title: string;
  stats: Bundle["stats"];
  sever: { routesBefore: number; routesAfter: number; closed: boolean };
}

export interface Index {
  generated: string;
  engine: { name: string; version: string };
  scenarios: IndexEntry[];
  totals: { identities: number; edges: number; routes: number; fixtures: number };
}

/** Output recorded from a real CLI invocation, for the Commands section. */
export interface CommandRecord {
  key: string;
  verb: "scan" | "sever" | "check" | "techniques";
  scenario: string | null;
  format: "text" | "json" | "sarif" | "mermaid";
  command: string;
  output: string;
}
