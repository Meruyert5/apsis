import { useEffect, useMemo, useRef, useState } from "react";
import { FleetTable, type SortKey } from "./FleetTable";
import { MascotOrb } from "./MascotOrb";
import { RouteAtlas } from "./RouteAtlas";
import { WaveMesh } from "./WaveMesh";
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

function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
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

const KPIS = [
  { label: "Accounts", value: snapshot.accounts, foot: "monitored", tone: "" },
  { label: "Identities", value: snapshot.identities, foot: "fleet-wide", tone: "" },
  { label: "Routes", value: snapshot.routes, foot: "to administrator", tone: "" },
  { label: "Edges cut", value: snapshot.cut, foot: "minimum cut", tone: "blue" },
  { label: "Deepest", value: snapshot.deepest, foot: "hops to admin", tone: "accent" },
  { label: "Writes", value: snapshot.writes, foot: "read-only", tone: "ink" },
];

const EVENTS = [
  { label: "Snapshot", detail: `${snapshot.identities} identities across ${snapshot.accounts} accounts`, tone: "blue" },
  { label: "Analysis", detail: `${snapshot.routes} routes found; deepest ${String(snapshot.deepest).padStart(2, "0")} hops`, tone: "ink" },
  { label: "Decision", detail: `${snapshot.cut} edges cut; no routes remain`, tone: "blue" },
  { label: "Guardrail", detail: "0 writes; read-only preserved", tone: "ink" },
  { label: "Seal", detail: "Snapshot sealed; nothing written back", tone: "blue" },
];

function PanelHead({
  title,
  meta,
  chevrons = false,
  titleId,
}: {
  title: string;
  meta: string;
  chevrons?: boolean;
  titleId?: string;
}) {
  return (
    <header className="panel-head">
      <h2 id={titleId}>{title}</h2>
      <span className="panel-meta">{meta}</span>
      {chevrons ? <span className="panel-chevrons" aria-hidden="true">‹‹‹‹</span> : null}
    </header>
  );
}

function Badge() {
  return (
    <svg className="hero-badge" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="94" fill="none" stroke="#fff" strokeOpacity=".5" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#1a1aff" strokeWidth="1" strokeDasharray="3 6" />
      <g className="badge-ring">
        <defs>
          <path id="hero-badge-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text>
          <textPath href="#hero-badge-path" startOffset="0">
            EVERY ROUTE REACHES ITS APSIS / READ-ONLY / 16 ACCOUNTS / 07 HOPS /
          </textPath>
        </text>
      </g>
      <path className="badge-star" d="M100 46 L104 96 L154 100 L104 104 L100 154 L96 104 L46 100 L96 96 Z" />
      <text className="badge-word" x="100" y="105" textAnchor="middle">APSIS</text>
    </svg>
  );
}

function GlobeStamp() {
  return (
    <svg className="globe-stamp" viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="60" cy="60" r="42" />
        <ellipse cx="60" cy="60" rx="42" ry="15" />
        <ellipse cx="60" cy="60" rx="15" ry="42" />
        <ellipse cx="60" cy="60" rx="42" ry="15" transform="rotate(55 60 60)" />
      </g>
      <circle cx="60" cy="60" r="3" fill="currentColor" />
    </svg>
  );
}

export function Y2kDashboard() {
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
      if (event.key === "Escape") setRail(false);
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
        if (window.scrollY < 220) {
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
    flash("Snapshot exported");
  };

  const clearSearch = () => {
    setQuery("");
    searchRef.current?.focus();
  };

  return (
    <div className={`y2k ${rail ? "rail-open" : ""}`}>
      <div className="screen-frame" aria-hidden="true">
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
      </div>

      <a className="skip" href="#overview">Skip to dashboard</a>

      <aside className="rail" aria-label="Primary">
        <div className="rail-head">
          <div className="brand">
            <b>APSIS</b>
            <i>Path + Atlas</i>
          </div>
          <button type="button" className="rail-close" onClick={() => setRail(false)} aria-label="Close navigation">
            <Icon name="close" />
          </button>
        </div>

        <div className="account">
          <span>Focus account</span>
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
              <em>0{index + 1}</em>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="rail-spacer" />

        <div className="rail-stamp" aria-hidden="true">
          <div className="rail-barcode" />
          <span className="rail-chevrons">‹‹‹‹</span>
          <span className="rail-star">✦</span>
        </div>

        <div className="rail-status">
          <div><i className="dot" />Read-only</div>
          <p>{generatedLabel}</p>
          <p>0 writes / 16 accounts</p>
        </div>
      </aside>

      {rail ? (
        <button type="button" className="rail-scrim" onClick={() => setRail(false)} aria-label="Close navigation overlay" />
      ) : null}

      <div className="main">
        <header className="topbar">
          <div className="crumb">
            <button type="button" className="rail-toggle" onClick={() => setRail(true)} aria-label="Open navigation">
              <Icon name="menu" />
            </button>
            <b>APSIS</b>
            <span>/</span>
            <span>GAMES STUDIO</span>
          </div>

          <div className="search">
            <Icon name="search" size={16} />
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

          <div className="topmeta">
            <span className="snapshot"><i />Snapshot</span>
            <span className="avatar" aria-hidden="true">MO</span>
          </div>
        </header>

        <main className="content">
          <section id="overview" className="hero" aria-labelledby="title">
            <div className="hero-copy">
              <p className="eyebrow"><i />Fleet overview / Path + Atlas</p>
              <h1 id="title" aria-label="Apsis">
                <span className="solid">APSIS</span>
                <span className="outline">APSIS</span>
              </h1>
              <p className="lede">
                Read-only. {snapshot.identities} identities resolve into {snapshot.routes} routes
                to administrator. The minimum cut is {snapshot.cut} edges; the closest route is{" "}
                {String(shortest).padStart(2, "0")} hop, the deepest {String(snapshot.deepest).padStart(2, "0")}.
              </p>
              <div className="hero-actions">
                <button type="button" className="btn primary" onClick={() => go("evidence")}>
                  <Icon name="shield" />Review evidence
                </button>
                <button type="button" className="btn" onClick={exportSnapshot}>
                  <Icon name="download" />Export snapshot
                </button>
              </div>
            </div>

            <div className="mascot">
              <p className="sr-only">
                Interactive 3D mascot: a wireframe globe atlas with a seven-node orbit path.
                Drag to rotate, scroll to zoom, double-click to reset. Use 2D for a static fallback.
              </p>
              <div className="mascot-frame">
                <MascotOrb />
                <Badge />
                <span className="mascot-tag">Mascot / Path + Atlas</span>
                <span className="mascot-note">07 nodes / 01 path</span>
              </div>
              <p className="mascot-caption">Atlas = wireframe shell / path = 07-hop orbit</p>
            </div>
          </section>

          <section className="kpis" aria-label="Fleet figures">
            {KPIS.map((item) => (
              <div key={item.label} className={`kpi ${item.tone}`}>
                <span>{item.label}</span>
                <b>{item.value === 0 ? "0" : String(item.value).padStart(2, "0")}</b>
                <em>{item.foot}</em>
              </div>
            ))}
          </section>

          <div className="wave-band">
            <WaveMesh />
            <span className="wave-label">Atlas field / {snapshot.identities} identities</span>
            <span className="wave-barcode" aria-hidden="true" />
          </div>

          <div className="panels">
            <section id="atlas" className="panel atlas-panel" aria-labelledby="atlas-title">
              <PanelHead title="Route atlas" meta="Games studio / 07 hops" chevrons titleId="atlas-title" />
              <div className="atlas-intro">
                <p>The signature path from a tools intern to the studio administrator, closed by the minimum cut.</p>
              </div>
              <RouteAtlas route={showcaseRoute} account={showcase.scenario.title} />
            </section>

            <section className="panel paper posture" aria-labelledby="posture-title">
              <PanelHead title="Posture" meta="Minimum cut" titleId="posture-title" />
              <GlobeStamp />
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
                <div><dt>Mode</dt><dd>Read-only</dd></div>
              </dl>
              <div className="posture-foot">
                <span>Atlas / {snapshot.accounts} accounts</span>
                <b>{snapshot.cut} cuts / 0 routes</b>
              </div>
            </section>

            <section id="fleet" className="panel paper fleet-panel" aria-labelledby="fleet-title">
              <PanelHead title="Fleet" meta={`${rows.length} of ${snapshot.accounts} accounts`} titleId="fleet-title" />
              <FleetTable
                rows={rows}
                query={query}
                sort={sort}
                onSort={onSort}
                onClear={clearSearch}
              />
            </section>

            <section id="evidence" className="panel paper evidence" aria-labelledby="evidence-title">
              <PanelHead title="Evidence" meta={generatedLabel} titleId="evidence-title" />
              <ol className="timeline">
                {EVENTS.map((event) => (
                  <li key={event.label} className={event.tone}>
                    <b>{event.label}</b>
                    <p>{event.detail}</p>
                  </li>
                ))}
              </ol>
                <button type="button" className="export-run" onClick={exportSnapshot}>
                  <Icon name="download" />Export the run
                </button>
                <div className="evidence-foot">
                  <span>Run / {generatedLabel}</span>
                  <span>{showcase.engine.name} {showcase.engine.version} / read-only / 0 writes</span>
                </div>
              </section>
          </div>

          <footer className="content-foot">
            <span>APSIS / PATH + ATLAS / 2026</span>
            <span>{snapshot.accounts} accounts · {snapshot.identities} identities · {snapshot.routes} routes · {snapshot.cut} edges cut</span>
            <span>{generatedLabel} / READ-ONLY</span>
          </footer>
        </main>
      </div>

      <div className={`toast ${note ? "show" : ""}`} role="status" aria-live="polite">
        {note}
      </div>
    </div>
  );
}
