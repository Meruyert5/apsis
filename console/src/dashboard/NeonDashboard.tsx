import { useEffect, useMemo, useRef, useState } from "react";
import { FleetTable, type SortKey } from "./FleetTable";
import { OrbitFigure } from "./OrbitFigure";
import { RouteAtlas } from "./RouteAtlas";
import {
  downloadSnapshot,
  fleet,
  generatedLabel,
  showcase,
  showcaseRoute,
  shortest,
  snapshot,
} from "./model";

type IconName =
  | "overview"
  | "atlas"
  | "fleet"
  | "evidence"
  | "search"
  | "download"
  | "shield"
  | "menu"
  | "close";

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "overview") {
    return (
      <svg {...common}>
        <rect x="2" y="2" width="5" height="5" />
        <rect x="9" y="2" width="5" height="5" />
        <rect x="2" y="9" width="5" height="5" />
        <rect x="9" y="9" width="5" height="5" />
      </svg>
    );
  }
  if (name === "atlas") {
    return (
      <svg {...common}>
        <path d="M2 12.5 C5 3, 10 14, 14 4.5" />
        <circle cx="2" cy="12.5" r="1.6" />
        <circle cx="14" cy="4.5" r="1.6" />
      </svg>
    );
  }
  if (name === "fleet") {
    return (
      <svg {...common}>
        <circle cx="8" cy="5.5" r="2.4" />
        <path d="M3 14c0-3 2.2-4.4 5-4.4s5 1.4 5 4.4" />
      </svg>
    );
  }
  if (name === "evidence") {
    return (
      <svg {...common}>
        <path d="M8 1.8 13 4v4.2c0 3-2.1 5-5 6-2.9-1-5-3-5-6V4z" />
        <path d="m5.8 8 1.6 1.6 3-3.2" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="7" cy="7" r="4.4" />
        <path d="m10.4 10.4 3 3" />
      </svg>
    );
  }
  if (name === "download") {
    return (
      <svg {...common}>
        <path d="M8 2v8" />
        <path d="m4.6 6.8 3.4 3.4 3.4-3.4" />
        <path d="M2.5 13.5h11" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M8 1.8 13 4v4.2c0 3-2.1 5-5 6-2.9-1-5-3-5-6V4z" />
        <path d="M5.6 8.1 7.3 9.8l3.2-3.5" />
      </svg>
    );
  }
  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M2 4h12M2 8h12M2 12h12" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="m3 3 10 10M13 3 3 13" />
    </svg>
  );
}

const NAV = [
  { id: "overview", label: "Overview", icon: "overview" as const },
  { id: "atlas", label: "Route atlas", icon: "atlas" as const },
  { id: "fleet", label: "Fleet", icon: "fleet" as const },
  { id: "evidence", label: "Evidence", icon: "evidence" as const },
];

const KPI = [
  { label: "Accounts", value: snapshot.accounts, foot: "monitored", tone: "" },
  { label: "Identities", value: snapshot.identities, foot: "fleet-wide", tone: "" },
  { label: "Routes", value: snapshot.routes, foot: "to administrator", tone: "" },
  { label: "Edges cut", value: snapshot.cut, foot: "minimum cut", tone: "lime" },
  { label: "Deepest", value: snapshot.deepest, foot: "hops to admin", tone: "magenta" },
];

const EVENTS = [
  {
    label: "Snapshot",
    detail: `${snapshot.identities} identities across ${snapshot.accounts} accounts`,
    tone: "ice",
  },
  {
    label: "Analysis",
    detail: `${snapshot.routes} routes found; deepest ${String(snapshot.deepest).padStart(2, "0")} hops`,
    tone: "lime",
  },
  {
    label: "Decision",
    detail: `${snapshot.cut} edges cut; no routes remain`,
    tone: "magenta",
  },
  {
    label: "Guardrail",
    detail: "0 writes; read-only preserved",
    tone: "ice",
  },
];

function PanelHead({ title, meta }: { title: string; meta: string }) {
  return (
    <header className="panel-head">
      <h2>{title}</h2>
      <span className="panel-meta">{meta}</span>
    </header>
  );
}

export function NeonDashboard() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "routes", dir: -1 });
  const [active, setActive] = useState("overview");
  const [rail, setRail] = useState(false);
  const [note, setNote] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? fleet.filter((row) =>
          [row.title, row.short, row.key, row.accountId, row.region, row.severity]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : fleet;
    return [...filtered].sort(
      (a, b) => (a[sort.key] - b[sort.key]) * sort.dir || a.short.localeCompare(b.short),
    );
  }, [query, sort]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setRail(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const sections = NAV.map((item) => document.getElementById(item.id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (window.scrollY < 190) {
          setActive("overview");
          return;
        }
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-24% 0px -62% 0px", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const go = (id: string) => {
    setActive(id);
    setRail(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === -1 ? 1 : -1 } : { key, dir: -1 },
    );
  };

  const flash = (message: string) => {
    setNote(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(""), 2400);
  };

  const exportSnapshot = () => {
    downloadSnapshot();
    flash("Snapshot exported as JSON");
  };

  const clearSearch = () => {
    setQuery("");
    searchRef.current?.focus();
  };

  return (
    <div className={`neon ${rail ? "rail-open" : ""}`}>
      <div className="neon-frame" aria-hidden="true">
        <span className="crop tl" /><span className="crop tr" />
        <span className="crop bl" /><span className="crop br" />
      </div>

      <a className="skip" href="#overview">Skip to dashboard</a>

      <aside className="rail" aria-label="Primary">
        <div className="rail-head">
          <div className="wordmark">
            <span className="glyph" aria-hidden="true">A</span>
            <div>
              <b>APSIS</b>
              <i>Fleet console</i>
            </div>
          </div>
          <button type="button" className="rail-close" onClick={() => setRail(false)} aria-label="Close navigation">
            <Icon name="close" />
          </button>
        </div>

        <div className="rail-account">
          <span>Focus account</span>
          <b>{showcase.scenario.title}</b>
          <em>{showcase.scenario.accountId} / {showcase.scenario.region}</em>
        </div>

        <nav className="rail-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={active === item.id ? "active" : undefined}
              aria-current={active === item.id ? "true" : undefined}
              onClick={() => go(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="rail-spacer" />

        <div className="rail-status">
          <div><i className="pulse" />Read-only</div>
          <p>{generatedLabel}</p>
          <p>0 writes</p>
        </div>
      </aside>

      {rail ? (
        <button type="button" className="rail-scrim" onClick={() => setRail(false)} aria-label="Close navigation overlay" />
      ) : null}

      <div className="neon-main">
        <header className="topbar">
          <div className="topbar-crumb">
            <button type="button" className="rail-toggle" onClick={() => setRail(true)} aria-label="Open navigation">
              <Icon name="menu" />
            </button>
            <span className="crumb-kicker">Apsis</span>
            <span className="crumb-sep">/</span>
            <span>Games studio</span>
          </div>

          <div className="searchbox">
            <Icon name="search" size={15} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search accounts, identities, routes…"
              aria-label="Search the fleet"
            />
            <kbd>⌘K</kbd>
          </div>

          <div className="topbar-meta">
            <span className="snapshot"><i />Snapshot</span>
            <span className="avatar" aria-hidden="true">MO</span>
          </div>
        </header>

        <main className="content">
          <section id="overview" className="page-head" aria-labelledby="page-title">
            <div className="head-copy">
              <p className="eyebrow"><i />Fleet overview</p>
              <h1 id="page-title">Every route reaches its <em>apsis.</em></h1>
              <p className="lede">
                Read-only. {snapshot.identities} identities resolve into {snapshot.routes} routes
                to administrator. The minimum cut is {snapshot.cut} edges; the closest route is{" "}
                {String(shortest).padStart(2, "0")} hop, the deepest {String(snapshot.deepest).padStart(2, "0")}.
              </p>
            </div>
            <div className="head-actions">
              <button type="button" className="btn primary" onClick={() => go("evidence")}>
                <Icon name="shield" />Review evidence
              </button>
              <button type="button" className="btn" onClick={exportSnapshot}>
                <Icon name="download" />Export snapshot
              </button>
            </div>
          </section>

          <section className="kpis" aria-label="Fleet figures">
            {KPI.map((item) => (
              <article key={item.label} className={`kpi ${item.tone}`}>
                <div className="kpi-head">{item.label}</div>
                <div className="kpi-value">{String(item.value).padStart(2, "0")}</div>
                <div className="kpi-foot">{item.foot}</div>
              </article>
            ))}
          </section>

          <div className="dash-grid">
            <section id="atlas" className="panel atlas-panel" aria-labelledby="atlas-title">
              <PanelHead title="Route atlas" meta="Games studio / 07 hops" />
              <div className="atlas-intro">
                <p>
                  The signature path from a tools intern to the studio administrator. Seven
                  hops, eight identities, closed by the minimum cut.
                </p>
              </div>
              <RouteAtlas route={showcaseRoute} account={showcase.scenario.title} />
            </section>

            <section className="panel figure-panel" aria-labelledby="figure-title">
              <PanelHead title="Figure / Apsis" meta="Perigee / apogee" />
              <OrbitFigure shortest={shortest} deepest={snapshot.deepest} accounts={snapshot.accounts} />
            </section>

            <section id="fleet" className="panel fleet-panel" aria-labelledby="fleet-title">
              <PanelHead title="Fleet" meta={`${rows.length} of ${snapshot.accounts} accounts`} />
              <FleetTable
                rows={rows}
                query={query}
                sort={sort}
                onSort={onSort}
                onClear={clearSearch}
              />
            </section>

            <div className="side">
              <section className="panel posture" aria-labelledby="posture-title">
                <PanelHead title="Posture" meta="Minimum cut" />
                <div className="posture-main">
                  <b>{String(snapshot.cut).padStart(2, "0")}</b>
                  <span>edges<br />cut</span>
                </div>
                <div className="posture-bar" aria-hidden="true"><i /></div>
                <p className="posture-note">{snapshot.routes} routes closed. 0 remain. 0 writes.</p>
                <dl className="posture-list">
                  <div><dt>Routes before</dt><dd>{snapshot.routes}</dd></div>
                  <div><dt>Routes after</dt><dd>00</dd></div>
                  <div><dt>Writes</dt><dd>00</dd></div>
                  <div><dt>Mode</dt><dd className="lime">Read-only</dd></div>
                </dl>
              </section>

              <section id="evidence" className="panel evidence" aria-labelledby="evidence-title">
                <PanelHead title="Evidence" meta={generatedLabel} />
                <ol className="timeline">
                  {EVENTS.map((event) => (
                    <li key={event.label} className={event.tone}>
                      <b>{event.label}</b>
                      <p>{event.detail}</p>
                    </li>
                  ))}
                </ol>
                <button type="button" className="evidence-export" onClick={exportSnapshot}>
                  <Icon name="download" />Export the run
                </button>
              </section>
            </div>
          </div>

          <footer className="content-foot">
            <span>APSIS</span>
            <span>{snapshot.accounts} accounts · {snapshot.identities} identities · {snapshot.routes} routes · {snapshot.cut} edges cut</span>
            <span>{generatedLabel}</span>
          </footer>
        </main>
      </div>

      <div className={`toast ${note ? "show" : ""}`} role="status" aria-live="polite">
        {note}
      </div>
    </div>
  );
}
