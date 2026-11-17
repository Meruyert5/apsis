import { accountShort, bundles, byKey, signatureRoute, totals } from "../lib/data";
import type { Route, Severity } from "../lib/types";

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

function two(value: number) {
  return String(value).padStart(2, "0");
}

const generated = new Date(showcase.generated);

export const generatedLabel = `${two(generated.getUTCDate())} ${
  MONTHS[generated.getUTCMonth()]
} ${generated.getUTCFullYear()} / ${two(generated.getUTCHours())}:${two(
  generated.getUTCMinutes(),
)} UTC`;

export const generatedIso = showcase.generated;

export function downloadSnapshot() {
  const payload = {
    engine: showcase.engine,
    generated: showcase.generated,
    scenario: showcase.scenario,
    snapshot,
    accounts: fleet,
    signature: showcaseRoute,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "apsis-signal-snapshot.json";
  link.click();
  URL.revokeObjectURL(url);
}
