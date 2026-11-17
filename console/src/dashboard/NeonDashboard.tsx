import { useEffect, useMemo, useRef, useState } from "react";
import { FleetTable, type SortKey } from "./FleetTable";
import { OrbitFigure } from "./OrbitFigure";
import { RouteAtlas } from "./RouteAtlas";
import {
  downloadSnapshot,
  engineLabel,
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

function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
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
  { index: "01", label: "Accounts", value: snapshot.accounts, foot: "all monitored", tone: "" },
  { index: "02", label: "Identities", value: snapshot.identities, foot: "fleet-wide", tone: "" },
  { index: "03", label: "Routes", value: snapshot.routes, foot: "to administrator", tone: "" },
  { index: "04", label: "Edges cut", value: snapshot.cut, foot: "minimum cut", tone: "lime" },
  { index: "05", label: "Deepest", value: snapshot.deepest, foot: "hops / apogee", tone: "magenta" },
];

const EVENTS = [
  {
    time: "T+00",
    label: "Snapshot",
    detail: `${snapshot.identities} identities / ${snapshot.accounts} accounts`,
    tone: "ice",
  },
  {
    time: "T+02",
    label: "Analysis",
    detail: `${snapshot.routes} routes / deepest ${String(snapshot.deepest).padStart(2, "0")}`,
    tone: "lime",
  },
  {
    time: "T+04",
    label: "Decision",
    detail: `${snapshot.cut} edges cut / 0 routes remain`,
    tone: "magenta",
  },
  {
    time: "T+04",
    label: "Guardrail",
    detail: "0 writes / read-only preserved",
    tone: "ice",
  },
];

function PanelHead({
  index,
  title,
  meta,
}: {
  index: string;
  title: string;
  meta: string;
}) {
  return (
    <header className="panel-head">
      <span className="panel-index">{index}</span>
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
        if (window.scrollY < 180) {
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
              <i>Signal 01 / Neon Luxe</i>
            </div>
          </div>
          <button type="button" className="rail-close" onClick={() => setRail(false)} aria-label="Close navigation">
            <Icon name="close" />
          </button>
        </div>

        <div className="rail-account">
          <span>FOCUS ACCOUNT</span>
          <b>{showcase.scenario.title}</b>
          <em>{showcase.scenario.accountId} / {showcase.scenario.region}</em>
        </div>

        <nav className="rail-nav">
          {NAV.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={active === item.id ? "active" : undefined}
              aria-current={active === item.id ? "true" : undefined}
              onClick={() => go(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              <em>0{index + 1}</em>
            </button>
          ))}
        </nav>

        <div className="rail-spacer" />

        <div className="rail-palette">
          <span>PALETTE / 02</span>
          <div className="swatches" aria-hidden="true">
            <i className="ice" /><i className="lime" /><i className="mag" /><i className="pitch" />
          </div>
          <p>ICE / LIME / CRIMSON</p>
        </div>

        <div className="rail-status">
          <div><i className="pulse" />SNAPSHOT / READ-ONLY</div>
          <p>{generatedLabel}</p>
          <p>{engineLabel} / 0 writes</p>
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
            <span className="crumb-kicker">Signal 01</span>
            <span className="crumb-sep">/</span>
            <span>Fleet overview</span>
          </div>

          <div className="searchbox">
            <Icon name="search" size={14} />
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
            <span className="edition">N° 02</span>
            <span className="avatar" aria-hidden="true">MO</span>
          </div>
        </header>

        <main className="content">
          <section id="overview" className="page-head" aria-labelledby="page-title">
            <div className="head-copy">
              <p className="eyebrow"><i />Signal 01 / Fleet overview / {engineLabel}</p>
              <h1 id="page-title">Every route reaches its <em>apsis.</em></h1>
              <p className="lede">
                The fleet is read-only. {snapshot.identities} identities resolve into {snapshot.routes} routes
                to administrator; the minimum cut is {snapshot.cut} edges. The closest route is{" "}
                {String(shortest).padStart(2, "0")} hop; the deepest is {String(snapshot.deepest).padStart(2, "0")}.
              </p>
            </div>
            <div className="head-actions">
              <button type="button" className="btn primary" onClick={() => go("evidence")}>
                <Icon name="shield" />Review evidence
              </button>
              <button type="button" className="btn" onClick={exportSnapshot}>
                <Icon name="download" />Export snapshot
              </button>
              <p className="head-meta">SNAPSHOT {generatedLabel} / {showcase.scenario.region.toUpperCase()}</p>
            </div>
          </section>

          <section className="kpis" aria-label="Fleet figures">
            {KPI.map((item) => (
              <article key={item.index} className={`kpi ${item.tone}`}>
                <div className="kpi-head">
                  <span>{item.index} / {item.label}</span>
                  <i aria-hidden="true" />
                </div>
                <div className="kpi-value">{String(item.value).padStart(2, "0")}</div>
                <div className="kpi-foot">{item.foot}</div>
              </article>
            ))}
          </section>

          <div className="dash-grid">
            <section id="atlas" className="panel atlas-panel" aria-labelledby="atlas-title">
              <PanelHead index="01" title="Route atlas" meta="Games studio / apogee route" />
              <div className="atlas-intro">
                <p>
                  The signature path from a tools intern to the studio administrator. Seven hops, eight
                  identities, closed by the minimum cut.
                </p>
                <span className="atlas-chip">07 HOPS / 144 ROUTES</span>
              </div>
              <RouteAtlas route={showcaseRoute} account={showcase.scenario.title} />
            </section>

            <section className="panel figure-panel" aria-labelledby="figure-title">
              <PanelHead index="02" title="Figure / Apsis" meta="Name test / perigee to apogee" />
              <OrbitFigure shortest={shortest} deepest={snapshot.deepest} accounts={snapshot.accounts} />
            </section>

            <section id="fleet" className="panel fleet-panel" aria-labelledby="fleet-title">
              <PanelHead index="03" title="Fleet" meta={`${rows.length} / ${snapshot.accounts} accounts`} />
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
                <PanelHead index="04" title="Posture" meta="Minimum cut" />
                <div className="posture-main">
                  <b>{String(snapshot.cut).padStart(2, "0")}</b>
                  <span>EDGES<br />CUT</span>
                </div>
                <div className="posture-bar" aria-hidden="true"><i /></div>
                <p className="posture-note">{snapshot.routes} routes closed. 0 remain. 0 writes.</p>
                <dl className="posture-list">
                  <div><dt>Routes before</dt><dd>{snapshot.routes}</dd></div>
                  <div><dt>Routes after</dt><dd>00</dd></div>
                  <div><dt>Techniques</dt><dd>{String(showcase.registry.length).padStart(2, "0")}</dd></div>
                  <div><dt>Mode</dt><dd className="lime">Read-only</dd></div>
                </dl>
              </section>

              <section id="evidence" className="panel evidence" aria-labelledby="evidence-title">
                <PanelHead index="05" title="Evidence" meta={generatedLabel} />
                <ol className="timeline">
                  {EVENTS.map((event) => (
                    <li key={`${event.time}-${event.label}`} className={event.tone}>
                      <span className="event-time">{event.time}</span>
                      <div>
                        <b>{event.label}</b>
                        <p>{event.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <button type="button" className="evidence-export" onClick={exportSnapshot}>
                  <Icon name="download" />Export the run
                </button>
                <div className="evidence-foot">
                  <span>RUN / {generatedLabel}</span>
                  <span>{engineLabel} / READ-ONLY / 0 WRITES</span>
                </div>
              </section>
            </div>
          </div>

          <footer className="content-foot">
            <span>APSIS / SIGNAL 01 / NEON LUXE</span>
            <span>{snapshot.accounts} ACCOUNTS · {snapshot.identities} IDENTITIES · {snapshot.routes} ROUTES · {snapshot.cut} EDGES CUT</span>
            <span>{generatedLabel} / {engineLabel}</span>
          </footer>
        </main>
      </div>

      <div className={`toast ${note ? "show" : ""}`} role="status" aria-live="polite">
        {note}
      </div>
    </div>
  );
}
