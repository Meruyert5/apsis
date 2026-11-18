import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  averageRoutes,
  criticalAccounts,
  fleet,
  ledgerCsv,
  ledgerRows,
  severityCounts,
  snapshot,
  techniqueCount,
  techniqueRows,
} from "../model";
import type { ViewId } from "../model";
import type { Severity } from "../../lib/types";
import { Chip, Count, Donut, FigurePanel, Icon, Panel } from "../ui";

type SortKey = "identities" | "routes" | "cut";
type SeverityFilter = "all" | "critical" | "high" | "medium";

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#2b3cff",
  high: "#7a6cff",
  medium: "#44506e",
  low: "#242b3b",
};

export function Survey({
  navigate,
  pickAccount,
  motion,
  notify,
}: {
  navigate: (view: ViewId) => void;
  pickAccount: (key: string) => void;
  motion: boolean;
  notify: (message: string) => void;
}) {
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "routes", dir: -1 });
  const [scanning, setScanning] = useState(false);
  const scanTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
  }, []);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return fleet
      .filter((row) => severity === "all" || row.severity === severity)
      .filter((row) =>
        !term ||
        [row.title, row.short, row.key, row.accountId, row.region]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .sort((a, b) => (a[sort.key] - b[sort.key]) * sort.dir || a.short.localeCompare(b.short));
  }, [severity, query, sort]);

  const maxRoutes = Math.max(...fleet.map((row) => row.routes), 1);
  const maxEdges = Math.max(...techniqueRows.map((row) => row.edges), 1);
  const totalCells = techniqueCount * fleet.length;
  const coveredCells = techniqueRows.reduce((sum, row) => sum + row.accounts, 0);
  const ledger = useMemo(() => ledgerRows(), []);
  const [ledgerAll, setLedgerAll] = useState(false);

  const downloadLedger = () => {
    const blob = new Blob([ledgerCsv(ledger)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "apsis-ledger.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify(`Ledger CSV exported · ${ledger.length} edge rows`);
  };

  const scan = () => {
    setScanning(true);
    notify(`Survey replayed · ${snapshot.accounts} accounts scanned`);
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => setScanning(false), 2300);
  };

  const sortBy = (key: SortKey) => {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === -1 ? 1 : -1 } : { key, dir: -1 },
    );
  };

  return (
    <>
      <section className="view-hero survey-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span>02</span> Survey / Fleet posture</p>
          <h1>Read the fleet like a <em>system.</em></h1>
          <p className="lede">
            Sixteen synthetic accounts, one permission model. Rank the exposure, inspect the
            severity mix, then drop into the exact route that matters.
          </p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => pickAccount(fleet[0].key)}>
              <Icon name="path" />Open the top route
            </button>
            <button type="button" className="btn" onClick={scan}>
              <Icon name="survey" />{scanning ? "Scanning…" : "Replay scan"}
            </button>
            <button type="button" className="btn" onClick={downloadLedger}>
              <Icon name="copy" />Download ledger CSV
            </button>
          </div>
        </div>
        <FigurePanel
          variant="dish"
          index="FIG. 02"
          title="Survey dish"
          meta="Account contacts / sweep"
          tags={[`${snapshot.accounts} accounts`, `${techniqueCount} primitives`, `${snapshot.deepest} deep`]}
          note="Auto: the sweep wakes each contact"
          foot={scanning ? "Scanning" : "Idle"}
          motion={motion}
          className={scanning ? "is-scanning" : ""}
        />
      </section>

      <section className="kpi-grid six" aria-label="Survey figures">
        {[
          { label: "Accounts", value: snapshot.accounts, foot: "in the survey", tone: "" },
          { label: "Identities", value: snapshot.identities, foot: "across the fleet", tone: "" },
          { label: "Routes", value: snapshot.routes, foot: "to administrator", tone: "" },
          { label: "Critical", value: criticalAccounts, foot: "of 16 accounts", tone: "blue" },
          { label: "Average", value: averageRoutes, foot: "routes per account", tone: "" },
          { label: "Cut", value: snapshot.cut, foot: "edges / minimum", tone: "accent" },
        ].map((item, index) => (
          <article key={item.label} className={`kpi ${item.tone}`.trim()} style={{ "--i": index } as CSSProperties}>
            <span className="kpi-label">{item.label}</span>
            <b className="kpi-value"><Count value={item.value} motion={motion} /></b>
            <span className="kpi-foot">{item.foot}</span>
          </article>
        ))}
      </section>

      <div className="survey-top">
        <Panel title="Exposure ranking" meta="routes per account" actions={<span className="mini-note">click to open</span>}>
          <div className="rank-list">
            {fleet.slice(0, 9).map((row, index) => (
              <button
                key={row.key}
                type="button"
                className="rank-row"
                onClick={() => pickAccount(row.key)}
                style={{ "--i": index } as CSSProperties}
              >
                <span className="rank-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="rank-name"><b>{row.short}</b><em>{row.title}</em></span>
                <span className="rank-bar"><i style={{ width: `${(row.routes / maxRoutes) * 100}%` }} /></span>
                <span className="rank-value">{row.routes}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Severity" meta="accounts by scenario">
          <div className="severity-block">
            <Donut
              segments={[
                { label: "Critical", value: severityCounts.critical, color: SEVERITY_COLOR.critical },
                { label: "High", value: severityCounts.high, color: SEVERITY_COLOR.high },
                { label: "Medium", value: severityCounts.medium, color: SEVERITY_COLOR.medium },
                { label: "Low", value: severityCounts.low, color: SEVERITY_COLOR.low },
              ]}
              center={<><b>{criticalAccounts}</b><span>critical</span></>}
            />
            <div className="severity-legend">
              {(["critical", "high", "medium"] as Severity[]).map((key) => (
                <div key={key}>
                  <i style={{ background: SEVERITY_COLOR[key] }} />
                  <span>{key}</span>
                  <b>{severityCounts[key]}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="coverage-mini">
            <div>
              <span>Coverage</span>
              <b>{Math.round((coveredCells / totalCells) * 100)}%</b>
            </div>
            <div className="coverage-spark">
              {techniqueRows.map((row) => (
                <i
                  key={row.id}
                  title={`${row.name} — ${row.edges} edges / ${row.accounts} accounts`}
                  style={{ height: `${Math.max(8, (row.edges / maxEdges) * 100)}%` }}
                />
              ))}
            </div>
            <button type="button" className="text-link" onClick={() => navigate("extensions")}>
              Open coverage <Icon name="arrow" size={13} />
            </button>
          </div>
        </Panel>
      </div>

      <Panel
        title="Fleet ledger"
        meta={`${rows.length} of ${snapshot.accounts} accounts`}
        actions={<span className="mini-note">row → path map</span>}
        className="ledger-panel"
      >
        <div className="table-toolbar">
          <div className="field">
            <Icon name="search" size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search accounts, IDs, regions…"
              aria-label="Search accounts"
            />
          </div>
          <div className="chip-row">
            {(["all", "critical", "high", "medium"] as SeverityFilter[]).map((item) => (
              <Chip key={item} active={severity === item} onClick={() => setSeverity(item)}>
                {item}
              </Chip>
            ))}
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <caption className="sr-only">Fleet accounts and exposure</caption>
            <thead>
              <tr>
                <th scope="col">Account</th>
                <th scope="col">
                  <button type="button" onClick={() => sortBy("identities")}>
                    Identities <i>{sort.key === "identities" ? (sort.dir === -1 ? "↓" : "↑") : "↕"}</i>
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => sortBy("routes")}>
                    Routes <i>{sort.key === "routes" ? (sort.dir === -1 ? "↓" : "↑") : "↕"}</i>
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => sortBy("cut")}>
                    Cut <i>{sort.key === "cut" ? (sort.dir === -1 ? "↓" : "↑") : "↕"}</i>
                  </button>
                </th>
                <th scope="col">Severity</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} onClick={() => pickAccount(row.key)} tabIndex={0} onKeyDown={(event) => {
                  if (event.key === "Enter") pickAccount(row.key);
                }}>
                  <th scope="row">
                    <span className={`mark ${row.severity}`} />
                    <div><b>{row.short}</b><span>{row.key} / {row.accountId}</span></div>
                  </th>
                  <td>{row.identities}</td>
                  <td>{row.routes}</td>
                  <td>{String(row.cut).padStart(2, "0")}</td>
                  <td><span className={`sev ${row.severity}`}>{row.severity}</span></td>
                  <td><span className={`state ${row.state}`}>{row.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Route ledger"
        meta={`${ledger.length} edge rows`}
        actions={
          <div className="ledger-actions">
            <button type="button" className="ghost-toggle" onClick={() => setLedgerAll((value) => !value)}>
              {ledgerAll ? "First 40" : "Show all"}
            </button>
            <button type="button" className="ghost-toggle" onClick={downloadLedger}>
              <Icon name="copy" size={12} />CSV
            </button>
          </div>
        }
        className="ledger-panel"
      >
        <div className="ledger-toolbar">
          <span className="mini-note">Every account / every route / one edge per row</span>
          <span className="mini-note">account, source, hop, technique, from → to, observed</span>
        </div>
        <div className="table-scroll ledger-scroll">
          <table className="data-table ledger-table">
            <caption className="sr-only">Route ledger for every account</caption>
            <thead>
              <tr>
                <th scope="col">Account</th>
                <th scope="col">Source</th>
                <th scope="col">Hop</th>
                <th scope="col">Technique</th>
                <th scope="col">Edge</th>
                <th scope="col">Observed</th>
              </tr>
            </thead>
            <tbody>
              {(ledgerAll ? ledger : ledger.slice(0, 40)).map((row, index) => (
                <tr key={`${row.account}-${row.source}-${row.route}-${row.hop}-${index}`}>
                  <th scope="row">
                    <b>{row.short}</b>
                    <span>{row.account}</span>
                  </th>
                  <td>
                    <b className="ledger-source-label">{row.source}</b>
                    <span className="ledger-route-label">route {row.route}</span>
                  </td>
                  <td>{row.hop}/{row.hops}</td>
                  <td>{row.technique}</td>
                  <td>{row.from} → {row.to}</td>
                  <td>{row.observed ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
