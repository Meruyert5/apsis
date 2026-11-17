import { useCallback, useEffect, useMemo, useState } from "react";
import { ActHeader } from "../components/ActHeader";
import { SpecimenCore } from "../decide/SpecimenCore";
import { bundles, coverage, techniques, categoryOrder, categoryLabel } from "../lib/data";
import type { Category } from "../lib/data";

const ACCOUNT_SHORT: Record<string, string> = {
  startup: "SaaS", enterprise: "Ent", "ml-platform": "ML", legacy: "Lgcy",
  "multi-account": "Multi", "ci-cd": "CI", "ci-cd-after": "CI+", fintech: "Fin",
  healthcare: "Hlth", "games-studio": "Game", "gov-contractor": "Gov", retail: "Ret",
  media: "Media", research: "R&D", logistics: "Logi", platform: "Plat",
};
const COLORS: Record<string, string> = { identity: "#8b7bff", compute: "#4fe3c1", trust: "#d6fff2" };
const CX = 380;
const CY = 380;
const R0 = 90;
const R1 = 310;
const N = 16;
const M = 18;
const ringR = (index: number) => R0 + ((R1 - R0) * index) / (N - 1);
const angle = (index: number) => ((-90 + (index * 360) / M) * Math.PI) / 180;
const polar = (radius: number, a: number) => [CX + Math.cos(a) * radius, CY + Math.sin(a) * radius];

function accountShort(key: string) {
  return ACCOUNT_SHORT[key] ?? key;
}

export function Decide() {
  const table = useMemo(() => coverage(), []);
  const accounts = useMemo(
    () => bundles.map(({ key, bundle }) => ({
      key,
      short: accountShort(key),
      title: bundle.scenario.title,
      routes: bundle.stats.routes,
      sources: bundle.stats.sourcesWithPath,
      total: bundle.stats.sources,
      cuts: bundle.sever.edgeCut.edges.length,
    })),
    [],
  );
  const [techId, setTechId] = useState("iam_create_access_key");
  const [accountKey, setAccountKey] = useState<string | null>("games-studio");
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [ping, setPing] = useState(0);
  const [view, setView] = useState<"2d" | "3d">(() => {
    if (typeof window === "undefined") return "2d";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || window.innerWidth < 720) return "2d";
    try {
      const canvas = document.createElement("canvas");
      return canvas.getContext("webgl2") || canvas.getContext("webgl") ? "3d" : "2d";
    } catch {
      return "2d";
    }
  });
  const selectCell = useCallback((nextTech: string, nextAccount: string) => {
    setTechId(nextTech);
    setAccountKey(nextAccount);
  }, []);

  const tech = techniques.find((item) => item.id === techId) ?? techniques[0];
  const techCounts = useMemo(
    () => accounts.map((account) => ({
      ...account,
      count: table.get(account.key)?.get(tech.id) ?? 0,
    })).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title)),
    [accounts, table, tech.id],
  );
  const techTotal = techCounts.reduce((sum, item) => sum + item.count, 0);
  const techAccounts = techCounts.filter((item) => item.count > 0).length;
  const picked = accountKey ? accounts.find((item) => item.key === accountKey) ?? null : null;
  const pickedCount = picked ? table.get(picked.key)?.get(tech.id) ?? 0 : 0;
  const observed = useMemo(() => {
    let sum = 0;
    for (const account of accounts) {
      for (const item of techniques) sum += table.get(account.key)?.get(item.id) ?? 0;
    }
    return sum;
  }, [accounts, table]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return techniques.filter((item) => {
      const categoryOk = category === "all" || item.category === category;
      const queryOk = !q || item.name.toLowerCase().includes(q) || item.id.includes(q);
      return categoryOk && queryOk;
    });
  }, [category, query]);

  const selectedIndex = techniques.findIndex((item) => item.id === tech.id);

  useEffect(() => {
    const onTechnique = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (techniques.some((item) => item.id === id)) {
        setTechId(id);
        setAccountKey(null);
      }
    };
    window.addEventListener("apsis:technique", onTechnique);
    return () => window.removeEventListener("apsis:technique", onTechnique);
  }, []);

  return (
    <section className="bio-act" id="decide" aria-labelledby="decide-title">
      <ActHeader
        index="03"
        label="Decide"
        title={
          <span id="decide-title">
            Every way through, <em>in one core.</em>
          </span>
        }
        lede={
          <>
            {techniques.length} escalation primitives, {accounts.length} accounts.
            Every photophore is an edge the engine observed; the ledger carries the
            exact counts, the actions and the fix.
          </>
        }
        meta={
          <>
            <b>{techniques.length}</b> primitives<br />
            <b>{accounts.length}</b> accounts<br />
            <b>{observed}</b> edges observed
          </>
        }
      />

      <div className="bio-decide-grid">
        <svg className="bio-whale" viewBox="0 0 600 220" aria-hidden="true">
          <path d="M40 130 Q150 40 330 58 Q440 68 520 40 L500 96 L570 74 L520 128 L550 172 L470 150 Q330 205 190 172 Q100 152 40 130 Z" fill="none" stroke="rgba(79,227,193,.2)" strokeWidth="1.4" />
          <path d="M150 118 Q190 108 230 118" fill="none" stroke="rgba(79,227,193,.16)" strokeWidth="1.2" />
          <circle cx="120" cy="112" r="3" fill="rgba(214,255,242,.35)" />
          <circle cx="86" cy="78" r="2" fill="rgba(214,255,242,.25)" />
          <circle cx="70" cy="56" r="1.5" fill="rgba(214,255,242,.2)" />
        </svg>
        <div className="bio-corecol">
          <div className="bio-coretools">
            <span>Specimen</span>
            <button type="button" aria-pressed={view === "2d"} onClick={() => setView("2d")}>2D radial</button>
            <button type="button" aria-pressed={view === "3d"} onClick={() => setView("3d")}>3D specimen</button>
            <button type="button" onClick={() => setPing((value) => value + 1)}>Sonar ping</button>
            <em>{view === "3d" ? "drag to orbit · scroll to zoom" : "flat overview · exact counts in the ledger"}</em>
          </div>
          <div className="bio-corewrap" data-view={view}>
            {view === "2d" ? (
            <svg className="bio-radial" viewBox="0 0 760 760" role="img" aria-label="Radial coverage core: 16 accounts by 18 techniques">
              <defs>
                <radialGradient id="bioCoreBed" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#4fe3c1" stopOpacity="0.08" />
                  <stop offset="0.7" stopColor="#4fe3c1" stopOpacity="0.02" />
                  <stop offset="1" stopColor="#4fe3c1" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx={CX} cy={CY} r={R1 + 26} fill="url(#bioCoreBed)" />
              {categoryOrder.map((cat) => {
                const indexes = techniques.map((item, index) => (item.category === cat ? index : -1)).filter((index) => index >= 0);
                if (indexes.length === 0) return null;
                const half = (Math.PI / M) * 0.9;
                const a0 = angle(indexes[0]) - half;
                const a1 = angle(indexes[indexes.length - 1]) + half;
                const rIn = 64;
                const rOut = R1 + 6;
                const [x1, y1] = polar(rOut, a0);
                const [x2, y2] = polar(rOut, a1);
                const [x3, y3] = polar(rIn, a1);
                const [x4, y4] = polar(rIn, a0);
                const large = a1 - a0 > Math.PI ? 1 : 0;
                return (
                  <g key={cat}>
                    <path
                      d={`M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`}
                      fill={COLORS[cat]}
                      fillOpacity="0.035"
                      stroke={COLORS[cat]}
                      strokeOpacity="0.16"
                    />
                    <text
                      x={polar(356, (a0 + a1) / 2)[0]}
                      y={polar(356, (a0 + a1) / 2)[1]}
                      fill={COLORS[cat]}
                      fontFamily="IBM Plex Mono"
                      fontSize="14"
                      textAnchor="middle"
                    >
                      {categoryLabel[cat].toUpperCase()}
                    </text>
                  </g>
                );
              })}
              {accounts.map((account, index) => (
                <circle
                  key={account.key}
                  cx={CX}
                  cy={CY}
                  r={ringR(index)}
                  fill="none"
                  stroke={account.key === accountKey ? "rgba(214,255,242,.6)" : "rgba(120,255,220,.12)"}
                  strokeWidth={account.key === accountKey ? 1.6 : 1}
                />
              ))}
              {techniques.map((item, index) => {
                const [x1, y1] = polar(R0 - 6, angle(index));
                const [x2, y2] = polar(R1 + 4, angle(index));
                return (
                  <line
                    key={item.id}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={index === selectedIndex ? "rgba(79,227,193,.8)" : "rgba(120,255,220,.1)"}
                    strokeWidth={index === selectedIndex ? 2 : 1}
                  />
                );
              })}
              {techniques.map((item, index) => {
                const [x, y] = polar(324, angle(index));
                return (
                  <text key={item.id} x={x} y={y} fill="#3f7d72" fontFamily="IBM Plex Mono" fontSize="14" textAnchor="middle" dominantBaseline="middle">
                    {String(index + 1).padStart(2, "0")}
                  </text>
                );
              })}
              {accounts.map((account, ai) =>
                techniques.map((item, ti) => {
                  const count = table.get(account.key)?.get(item.id) ?? 0;
                  const [x, y] = polar(ringR(ai), angle(ti));
                  const size = count > 0 ? 2.2 + Math.sqrt(count) * 1.55 : 1.15;
                  const selected = ti === selectedIndex;
                  const accountOn = ai === accounts.findIndex((entry) => entry.key === accountKey);
                  const dim = !selected && !accountOn;
                  const color = COLORS[item.category];
                  const common = {
                    opacity: count === 0 ? 0.16 : dim ? 0.32 : 0.92,
                    style: { cursor: count > 0 ? "pointer" : "default" } as const,
                    onClick: count > 0 ? () => { setTechId(item.id); setAccountKey(account.key); } : undefined,
                  };
                  if (item.category === "compute") {
                    return <rect key={`${account.key}-${item.id}`} x={x - size} y={y - size} width={size * 2} height={size * 2} transform={`rotate(45 ${x} ${y})`} fill={color} {...common} />;
                  }
                  if (item.category === "trust") {
                    return <circle key={`${account.key}-${item.id}`} cx={x} cy={y} r={size} fill="none" stroke={color} strokeWidth="1.4" {...common} />;
                  }
                  return <circle key={`${account.key}-${item.id}`} cx={x} cy={y} r={size} fill={color} {...common} />;
                }),
              )}
              <circle cx={CX} cy={CY} r="42" fill="rgba(79,227,193,.06)" stroke="rgba(191,255,233,.24)" />
              <text x={CX} y={CY - 4} fill="#eafff8" fontFamily="Sora" fontSize="26" fontWeight="600" textAnchor="middle" dominantBaseline="middle">{observed}</text>
              <text x={CX} y={CY + 18} fill="#6fb8a8" fontFamily="IBM Plex Mono" fontSize="14" letterSpacing="1.6" textAnchor="middle" dominantBaseline="middle">EDGES</text>
            </svg>
            ) : (
              <SpecimenCore
                accounts={accounts}
                techniques={techniques}
                table={table}
                techId={tech.id}
                accountKey={accountKey}
                onSelect={selectCell}
              />
            )}
            <div className="bio-sonar" key={ping} aria-hidden="true"><i /><i /><i /></div>
            <svg className="bio-tendrils" viewBox="0 0 100 100" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <path key={i} d={`M${18 + i * 8} 76 Q${8 + i * 9} 88 ${16 + i * 8} 100`} fill="none" stroke="rgba(79,227,193,.3)" strokeWidth="0.5" />
              ))}
            </svg>
          </div>
          <div className="bio-species" aria-hidden="true">
            <span>bell</span><span>photophore</span><span>tendril</span><span>sonar</span>
          </div>
          <div className="bio-rings">
            <h3><span>Accounts</span><span>Routes</span></h3>
            <p className="bio-ringnote">inner = most exposed</p>
            {accounts.map((account, index) => (
              <button
                key={account.key}
                type="button"
                className="bio-ringbtn"
                aria-selected={account.key === accountKey}
                onClick={() => setAccountKey(account.key === accountKey ? null : account.key)}
                title={account.title}
              >
                <i aria-hidden="true" />
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{account.short}</span>
                <em>{account.routes}</em>
              </button>
            ))}
          </div>
        </div>

        <aside className="bio-ledger" aria-label="Technique ledger">
          <div className="bio-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search techniques" aria-label="Search techniques" />
          </div>
          <div className="bio-chips" role="group" aria-label="Filter techniques">
            {(["all", ...categoryOrder] as Category[]).map((value) => (
              <button key={value} type="button" className="bio-chip" aria-pressed={category === value} onClick={() => setCategory(value)}>
                {categoryLabel[value]}
                <b>{value === "all" ? techniques.length : techniques.filter((item) => item.category === value).length}</b>
              </button>
            ))}
          </div>
          <div className="bio-trows">
            {categoryOrder.map((cat) => {
              const group = rows.filter((item) => item.category === cat).sort((a, b) => {
                const aCount = accounts.reduce((sum, account) => sum + (table.get(account.key)?.get(a.id) ?? 0), 0);
                const bCount = accounts.reduce((sum, account) => sum + (table.get(account.key)?.get(b.id) ?? 0), 0);
                return bCount - aCount || a.name.localeCompare(b.name);
              });
              if (group.length === 0) return null;
              const max = Math.max(...group.map((item) => accounts.reduce((sum, account) => sum + (table.get(account.key)?.get(item.id) ?? 0), 0)), 1);
              return (
                <div key={cat}>
                  <div className="bio-group"><span>{categoryLabel[cat]}</span><span>{group.length}</span></div>
                  {group.map((item, index) => {
                    const total = accounts.reduce((sum, account) => sum + (table.get(account.key)?.get(item.id) ?? 0), 0);
                    return (
                      <button key={item.id} type="button" className="bio-trow" aria-selected={item.id === tech.id} onClick={() => { setTechId(item.id); setAccountKey(null); }}>
                        <b>{String(index + 1).padStart(2, "0")}</b>
                        <span className="nm">{item.name}</span>
                        <span className="tr"><i style={{ width: `${(total / max) * 100}%` }} /></span>
                        <em>{total}</em>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {rows.length === 0 ? <p className="bio-empty">No technique matches.</p> : null}
          </div>

          <div className="bio-card">
            {picked ? (
              <div className="account">
                <p>ACCOUNT / <b>{picked.title}</b></p>
                <p className="meta">{picked.routes} routes · {picked.sources}/{picked.total} reach · {picked.cuts} cuts</p>
              </div>
            ) : null}
            <p className="bio-kick">{categoryLabel[tech.category]} / {tech.mitre}</p>
            <h3>{tech.name}</h3>
            <div className="bio-tags">
              <span className="bio-tag bio-tag--hot">{tech.severity}</span>
              <span className="bio-tag bio-tag--cool">{techTotal} edges</span>
              <span className="bio-tag">{techAccounts} accounts</span>
            </div>
            <p className="bio-meta">{tech.summary}</p>
            <div className="bio-bars">
              {techCounts.map((account) => (
                <button key={account.key} type="button" className="bio-bar" onClick={() => setAccountKey(account.key)} title={`${account.title}: ${account.count}`}>
                  <span>{account.short}</span>
                  <span className="track"><i style={{ width: `${(account.count / Math.max(1, techCounts[0]?.count ?? 1)) * 100}%` }} /></span>
                  <em>{account.count}</em>
                </button>
              ))}
            </div>
            <p className="bio-kick">Actions that create the edge</p>
            <div className="bio-tags">{tech.actions.map((action) => <span className="bio-tag" key={action}>{action}</span>)}</div>
            <p className="bio-fix"><b>Fix.</b> {tech.fix}</p>
            {picked ? (
              <p className="bio-note">
                {pickedCount > 0
                  ? `${pickedCount} edge${pickedCount === 1 ? "" : "s"} using ${tech.name} in ${picked.title}.`
                  : `Not observed in ${picked.title}.`}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      <p className="bio-footer" style={{ border: 0, marginTop: 18, paddingTop: 0 }}>
        <span>Specimen 01 / technique × account</span>
        <span>source: engine export / {observed} edges observed</span>
      </p>
    </section>
  );
}
