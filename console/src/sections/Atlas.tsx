import { useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import {
  bundles,
  categoryLabel,
  categoryOrder,
  coverage,
  techniques,
} from "../lib/data";
import type { Category } from "../lib/data";
import { Reveal } from "../components/Reveal";
import { SpaceCount } from "../components/SpaceCount";
const ABBR: Record<string, string> = {
  startup: "SaaS",
  enterprise: "Ent",
  "ml-platform": "ML",
  legacy: "Lgcy",
  "multi-account": "Multi",
  "ci-cd": "CI",
  "ci-cd-after": "CI+",
  fintech: "Fin",
  healthcare: "Hlth",
  "games-studio": "Game",
  "gov-contractor": "Gov",
  retail: "Ret",
  media: "Media",
  research: "R&D",
  logistics: "Logi",
  platform: "Plat",
};
const SEVERITIES = ["critical", "high", "medium", "low"] as const;
const MAX_ROUTES = Math.max(
  1,
  ...bundles.map((entry) => entry.bundle.stats.routes),
);
const SPACE_KEY = [
  { count: 0, label: "Void / 0" },
  { count: 1, label: "Moon / 1" },
  { count: 2, label: "Planet / 2-3" },
  { count: 5, label: "Ringed / 4-6" },
  { count: 8, label: "Giant / 7-9" },
  { count: 14, label: "Star / 10-19" },
  { count: 24, label: "Cluster / 20-33" },
  { count: 40, label: "Galaxy / 34+" },
];
function toneFor(category: string) {
  if (category === "compute") return "compute" as const;
  if (category === "trust") return "trust" as const;
  return "identity" as const;
}
export function Atlas() {
  const table = useMemo(() => coverage(), []);
  const initial = useMemo(() => {
    const firstGroup = techniques.filter(
      (item) => item.category === categoryOrder[0],
    );
    const pool = firstGroup.length > 0 ? firstGroup : techniques;
    let bestTech = pool[0]?.id ?? "";
    let bestCount = -1;
    for (const item of pool) {
      let count = 0;
      for (const entry of bundles)
        count += table.get(entry.key)?.get(item.id) ?? 0;
      if (count > bestCount) {
        bestCount = count;
        bestTech = item.id;
      }
    }
    let bestAccount: string | null = null;
    let bestAccountCount = 0;
    for (const entry of bundles) {
      const count = table.get(entry.key)?.get(bestTech) ?? 0;
      if (count > bestAccountCount) {
        bestAccountCount = count;
        bestAccount = entry.key;
      }
    }
    return { tech: bestTech, account: bestAccount };
  }, [table]);
  const [category, setCategory] = useState<Category>("all");
  const [techId, setTechId] = useState(initial.tech);
  const [accountKey, setAccountKey] = useState<string | null>(initial.account);
  const visible = useMemo(
    () =>
      techniques.filter(
        (tech) => category === "all" || tech.category === category,
      ),
    [category],
  );
  const tech = techniques.find((item) => item.id === techId) ?? techniques[0];
  const totals = useMemo(() => {
    let grants = 0;
    let accounts = 0;
    for (const { key } of bundles) {
      const count = table.get(key)?.get(tech.id) ?? 0;
      grants += count;
      if (count > 0) accounts += 1;
    }
    return { grants, accounts };
  }, [table, tech.id]);
  const observed = useMemo(() => {
    let grants = 0;
    for (const { key } of bundles) {
      for (const item of techniques)
        grants += table.get(key)?.get(item.id) ?? 0;
    }
    return grants;
  }, [table]);
  const coverageRows = useMemo(
    () =>
      bundles
        .map((entry) => ({
          key: entry.key,
          title: entry.bundle.scenario.title,
          short: ABBR[entry.key] ?? entry.key,
          count: table.get(entry.key)?.get(tech.id) ?? 0,
        }))
        .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title)),
    [table, tech.id],
  );
  const maxCoverage = Math.max(1, ...coverageRows.map((row) => row.count));
  const pickedAccount = accountKey
    ? coverageRows.find((row) => row.key === accountKey)
    : null;
  const groups = useMemo(() => {
    const order = categoryOrder as readonly string[];
    return order
      .map((name) => ({
        name,
        rows: visible.filter((item) => item.category === name),
      }))
      .filter((group) => group.rows.length > 0);
  }, [visible]);
  function pick(nextTech: string, nextAccount: string | null) {
    setTechId(nextTech);
    setAccountKey(nextAccount);
  }
  return (
    <section className="atlas" id="atlas" aria-labelledby="atlas-title">
      <div className="shell">
        <Reveal className="atlas__head">
          <div>
            <p className="kicker">03 / Escalation atlas</p>
            <h2 id="atlas-title" aria-label="Every way through, in one matrix.">
              Every way through, <br />
              <span className="accent-text">in one matrix.</span>
            </h2>
            <p className="atlas__pull">
              The matrix is not a score. Every body is a grant the engine
              observed.
            </p>
          </div>
          <div className="atlas__headSide">
            <p className="atlas__lede">
              {techniques.length} escalation primitives, {bundles.length} accounts. Every cell is a
              celestial body: its class and size encode the grants observed for
              that technique in that account.
            </p>
            <p className="atlas__source">
              Chart 01 / technique × account / source: engine export
            </p>
            <dl className="atlas__metrics">
              <div>
                <dt>Techniques</dt>
                <dd>
                  <SpaceCount
                    count={techniques.length}
                    tone="signal"
                    size="metric"
                    showNumber={false}
                    decorative
                  />
                  {techniques.length}
                </dd>
              </div>
              <div>
                <dt>Accounts</dt>
                <dd>
                  <SpaceCount
                    count={bundles.length}
                    tone="trust"
                    size="metric"
                    showNumber={false}
                    decorative
                  />
                  {bundles.length}
                </dd>
              </div>
              <div>
                <dt>Grants observed</dt>
                <dd>
                  <SpaceCount
                    count={observed}
                    tone="plasma"
                    size="metric"
                    showNumber={false}
                    decorative
                  />
                  {observed}
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>
        <div className="atlas__toolbar">
          <div
            className="atlas__filters"
            role="group"
            aria-label="Filter techniques by category"
          >
            {(["all", ...categoryOrder] as Category[]).map((name) => {
              const count =
                name === "all"
                  ? techniques.length
                  : techniques.filter((item) => item.category === name).length;
              return (
                <button
                  key={name}
                  type="button"
                  className="atlas__filter"
                  aria-pressed={category === name}
                  onClick={() => {
                    setCategory(name);
                    const next =
                      name === "all"
                        ? techniques
                        : techniques.filter((item) => item.category === name);
                    if (!next.some((item) => item.id === techId) && next[0]) {
                      setTechId(next[0].id);
                      setAccountKey(null);
                    }
                  }}
                >
                  {categoryLabel[name]}
                  <span className="atlas__filterCount data">{count}</span>
                </button>
              );
            })}
          </div>
          <p className="atlas__matrixKey" aria-hidden="true">
            Body = observed grants
          </p>
        </div>
        <p className="atlas__swipe" aria-hidden="true">
          Swipe the matrix to see every account <span>→</span>
        </p>
        <div className="atlas__layout">
          <div className="atlas__panel">
            <div className="atlas__scroll">
              <table className="atlas__table">
                <caption className="sr-only">
                  Escalation technique coverage by account. Pick a row to
                  inspect the technique, or a cell to inspect one account's use
                  of it.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="atlas__thTech">
                      <span>Technique</span>
                      <span className="atlas__thTotal">Total</span>
                    </th>
                    {bundles.map((entry) => (
                      <th scope="col" key={entry.key} className="atlas__th">
                        <abbr title={entry.bundle.scenario.title}>
                          {ABBR[entry.key] ?? entry.key}
                        </abbr>
                        <span className="atlas__thBar" aria-hidden="true">
                          <span
                            style={{
                              width: `${(entry.bundle.stats.routes / MAX_ROUTES) * 100}%`,
                            }}
                          />
                        </span>
                        <span className="sr-only">
                          {entry.bundle.stats.routes} routes
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                {groups.map((group) => (
                  <tbody key={group.name}>
                    <tr className="atlas__group">
                      <th scope="colgroup" colSpan={bundles.length + 1}>
                        <span>{categoryLabel[group.name]}</span>
                        <span className="data">{group.rows.length}</span>
                      </th>
                    </tr>
                    {group.rows.map((row) => {
                      const rowSelected = row.id === tech.id;
                      const rowTotal = bundles.reduce(
                        (sum, entry) =>
                          sum + (table.get(entry.key)?.get(row.id) ?? 0),
                        0,
                      );
                      return (
                        <tr
                          key={row.id}
                          className="atlas__row"
                          data-selected={rowSelected ? "true" : undefined}
                        >
                          <th scope="row" className="atlas__techCell">
                            <button
                              type="button"
                              className="atlas__tech"
                              aria-pressed={rowSelected}
                              title={`${rowTotal} grant${rowTotal === 1 ? "" : "s"}`}
                              onClick={() => pick(row.id, null)}
                            >
                              <span
                                className="atlas__sevDot"
                                data-sev={row.severity}
                                aria-hidden="true"
                              />
                              <span className="atlas__techName">
                                {row.name}
                              </span>
                              <span className="atlas__techTotal">
                                <SpaceCount
                                  count={rowTotal}
                                  tone={toneFor(row.category)}
                                  size="sm"
                                  showNumber={false}
                                />
                              </span>
                            </button>
                          </th>
                          {bundles.map((entry) => {
                            const count =
                              table.get(entry.key)?.get(row.id) ?? 0;
                            const cellPicked =
                              rowSelected && accountKey === entry.key;
                            return (
                              <td key={entry.key} className="atlas__cellWrap">
                                <button
                                  type="button"
                                  className="atlas__cell"
                                  data-on={count > 0 ? "true" : undefined}
                                  data-heat={Math.min(4, count)}
                                  data-picked={cellPicked ? "true" : undefined}
                                  aria-label={`${row.name} in ${entry.bundle.scenario.title}: ${count} grant${count === 1 ? "" : "s"}`}
                                  title={`${count} grant${count === 1 ? "" : "s"}`}
                                  onClick={() => pick(row.id, entry.key)}
                                >
                                  <SpaceCount
                                    count={count}
                                    tone={toneFor(row.category)}
                                    size="md"
                                  />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
            <div className="atlas__bodyKey" aria-hidden="true">
              <span className="atlas__bodyKeyTitle">Bodies / grants</span>
              {SPACE_KEY.map((entry) => (
                <span className="atlas__bodyKeyItem" key={entry.label}>
                  <SpaceCount
                    count={entry.count}
                    tone="signal"
                    size="xs"
                    showNumber={false}
                    decorative
                  />
                  {entry.label}
                </span>
              ))}
            </div>
            <footer className="atlas__legend">
              <span className="atlas__legendLabel">Severity</span>
              <ul>
                {SEVERITIES.map((severity) => (
                  <li key={severity}>
                    <span
                      className="atlas__sevDot"
                      data-sev={severity}
                      aria-hidden="true"
                    />
                    {severity}
                  </li>
                ))}
              </ul>
              <span className="atlas__legendBar">
                Column bar = routes to admin
              </span>
              <span className="atlas__heatKey" aria-hidden="true">
                <span>Density</span>
                {[1, 2, 3, 4].map((heat) => (
                  <i key={heat} data-heat={heat} />
                ))}
              </span>
              <span className="atlas__legendHint">
                Hover or tap a body for exact grants / scroll the matrix sideways on narrow screens
              </span>
            </footer>
          </div>
          <aside
            className="atlas__inspector"
            aria-labelledby="atlas-inspect-title"
          >
            <div className="atlas__inspect" key={tech.id}>
              <p className="atlas__inspectKicker">
                <span className="atlas__inspectMark" aria-hidden="true" />
                {categoryLabel[tech.category]} /
                <span className="data">{tech.mitre}</span>
              </p>
              <h3 id="atlas-inspect-title">{tech.name}</h3>
              <div className="atlas__chips">
                <span className="tag" data-sev={tech.severity}>
                  {tech.severity}
                </span>
                <span className="tag tag--violet">{totals.grants} grants</span>
                <span className="tag">{totals.accounts} accounts</span>
              </div>
              <div className="atlas__reach">
                <div
                  className="atlas__dial"
                  aria-hidden="true"
                  style={{
                    background: `conic-gradient(var(--signal) 0 ${(totals.accounts / Math.max(1, bundles.length)) * 100}%, rgb(242 243 238 / 8%) ${(totals.accounts / Math.max(1, bundles.length)) * 100}% 100%)`,
                  }}
                >
                  <span className="atlas__dialValue">
                    {totals.accounts} <i>/{bundles.length}</i>
                  </span>
                </div>
                <div className="atlas__reachCopy">
                  <p className="atlas__reachTitle">Accounts observed</p>
                  <p className="atlas__reachText">
                    {totals.grants} grant{totals.grants === 1 ? "" : "s"} carry
                    this primitive across the fleet.
                  </p>
                </div>
              </div>
              <p className="atlas__summary">{tech.summary}</p>
              <div className="atlas__cover">
                <header className="atlas__coverHead">
                  <span>Observed in</span>
                  {pickedAccount ? (
                    <button
                      type="button"
                      className="atlas__clear"
                      onClick={() => setAccountKey(null)}
                    >
                      {pickedAccount.short}
                      <X size={13} strokeWidth={2.4} aria-hidden />
                      <span className="sr-only">Clear account selection</span>
                    </button>
                  ) : (
                    <span className="atlas__coverHint">pick a bar</span>
                  )}
                </header>
                <ul className="atlas__bars">
                  {coverageRows.map((row) => (
                    <li key={row.key}>
                      <button
                        type="button"
                        className="atlas__bar"
                        aria-pressed={accountKey === row.key}
                        onClick={() =>
                          setAccountKey((current) =>
                            current === row.key ? null : row.key,
                          )
                        }
                      >
                        <span className="atlas__barName">{row.short}</span>
                        <span className="atlas__barTrack" aria-hidden="true">
                          <span
                            style={{
                              width: `${(row.count / maxCoverage) * 100}%`,
                            }}
                          />
                        </span>
                        <span className="atlas__barCount data">
                          {row.count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="atlas__actions">
                <p className="atlas__label">Actions that create the edge</p>
                <ul>
                  {tech.actions.map((action) => (
                    <li className="data" key={action}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="atlas__fix">
                <strong>Fix.</strong> {tech.fix}
              </p>
              {pickedAccount ? (
                <p className="atlas__picked">
                  <ArrowUpRight size={14} strokeWidth={2} aria-hidden />
                  {pickedAccount.count > 0
                    ? `${pickedAccount.count} grant${pickedAccount.count === 1 ? "" : "s"} using ${tech.name} in ${pickedAccount.title}.`
                    : `Not observed in ${pickedAccount.title}.`}
                </p>
              ) : null}
              <p className="sr-only" aria-live="polite">
                {tech.name}. {totals.grants} grants across {totals.accounts}
                accounts.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
