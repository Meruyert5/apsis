import { useMemo, useState } from "react";
import {
  caseStudy,
  contracts,
  coverageCells,
  coverageMax,
  fleet,
  techniqueCount,
  techniqueRows,
} from "../model";
import type { ViewId } from "../model";
import { Chip, FigurePanel, Icon, Panel, Tabs } from "../ui";

type Tab = "techniques" | "coverage" | "contracts" | "cases";
type Category = "all" | "identity" | "compute" | "trust";
type SeverityFilter = "all" | "critical" | "high" | "medium";

const ALERT_SAMPLE = `{
  "schema": "penumbra.alert/v1",
  "kind": "path.opened",
  "source": "apsis",
  "account": "555566667777",
  "principal": "gs-intern",
  "route": ["Tools intern", "Build role", "…", "Administrator"],
  "cut": ["iam:CreatePolicyVersion", "iam:CreateAccessKey"],
  "guardrails": ["SCP + Config", "CloudTrail alarm"],
  "severity": "critical"
}`;

export function Extensions({
  techniqueId,
  setTechniqueId,
  motion,
  notify,
  navigate,
  setAccount,
}: {
  techniqueId: string;
  setTechniqueId: (id: string) => void;
  motion: boolean;
  notify: (message: string) => void;
  navigate: (view: ViewId) => void;
  setAccount: (key: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("techniques");
  const [category, setCategory] = useState<Category>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [query, setQuery] = useState("");
  const [gaps, setGaps] = useState(false);

  const selected = techniqueRows.find((row) => row.id === techniqueId) ?? techniqueRows[0];
  const focus = Math.max(0, techniqueRows.findIndex((row) => row.id === selected.id));

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return techniqueRows.filter((row) => {
      const categoryOk = category === "all" || row.category === category;
      const severityOk = severity === "all" || row.severity === severity;
      const queryOk =
        !term ||
        `${row.name} ${row.id} ${row.mitre} ${row.summary} ${row.fix}`
          .toLowerCase()
          .includes(term);
      return categoryOk && severityOk && queryOk;
    });
  }, [category, severity, query]);

  const totalCells = techniqueCount * fleet.length;
  const coveredCells = techniqueRows.reduce((sum, row) => sum + row.accounts, 0);

  const copyAlert = async () => {
    try {
      await navigator.clipboard.writeText(ALERT_SAMPLE);
      notify("Alert contract copied");
    } catch {
      notify("Copy blocked by the browser");
    }
  };

  return (
    <>
      <section className="view-hero extensions-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span>07</span> Extensions / Registry + contracts</p>
          <h1>Everything the engine <em>knows.</em></h1>
          <p className="lede">
            Eighteen escalation primitives, a 16 × 18 coverage field, the evidence contract and the
            observed-path case. Every layer keeps its source and its owner.
          </p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => { setTab("coverage"); }}>
              <Icon name="extensions" />Inspect coverage
            </button>
            <button type="button" className="btn" onClick={() => { setTab("cases"); }}>
              <Icon name="shield" />Open the case
            </button>
          </div>
          <div className="meta-line">
            <span><i />{techniqueCount} primitives</span>
            <span>{coveredCells} / {totalCells} cells</span>
            <span>{contracts.length} contracts</span>
          </div>
        </div>
        <FigurePanel
          variant="bloom"
          index="FIG. 07"
          title="Primitive bloom"
          meta="18 nodes / six rings"
          tags={[`${techniqueCount} primitives`, `${fleet.length} accounts`, `${Math.round((coveredCells / totalCells) * 100)}% covered`]}
          note="Auto: rings counter-rotate / click a node to select"
          foot={selected.mitre}
          motion={motion}
          focus={focus}
          onPick={(index) => {
            const next = techniqueRows[index];
            if (next) setTechniqueId(next.id);
          }}
        />
      </section>

      <Tabs
        items={[
          { id: "techniques", label: "Techniques", count: techniqueCount },
          { id: "coverage", label: "Coverage", count: totalCells },
          { id: "contracts", label: "Contracts", count: contracts.length },
          { id: "cases", label: "Cases", count: 1 },
        ]}
        value={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === "techniques" ? (
        <div className="techniques-panel">
          <div className="table-toolbar">
            <div className="field">
              <Icon name="search" size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search primitives, MITRE, fixes…"
                aria-label="Search techniques"
              />
            </div>
            <div className="chip-row">
              {(["all", "identity", "compute", "trust"] as Category[]).map((item) => (
                <Chip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Chip>
              ))}
            </div>
            <div className="chip-row compact">
              {(["all", "critical", "high", "medium"] as SeverityFilter[]).map((item) => (
                <Chip key={item} active={severity === item} onClick={() => setSeverity(item)}>{item}</Chip>
              ))}
            </div>
          </div>
          <div className="technique-grid">
            {filtered.map((technique) => {
              const active = technique.id === selected.id;
              return (
                <div
                  key={technique.id}
                  className={`technique-card ${active ? "is-active" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={active}
                  onClick={() => setTechniqueId(technique.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setTechniqueId(technique.id);
                    }
                  }}
                >
                  <span className="technique-top">
                    <span className={`category ${technique.category}`}>{technique.category}</span>
                    <span className={`sev ${technique.severity}`}>{technique.severity}</span>
                  </span>
                  <b>{technique.name}</b>
                  <em>{technique.mitre} / {technique.id}</em>
                  <p>{technique.summary}</p>
                  <span className="technique-stats">
                    <span>{technique.edges} edges</span>
                    <span>{technique.accounts} accounts</span>
                    <span>{technique.actions.length} actions</span>
                  </span>
                  {active ? (
                    <span className="technique-detail">
                      <span className="detail-block"><span>Actions</span><span className="action-tags">{technique.actions.map((action) => <code key={action}>{action}</code>)}</span></span>
                      <span className="detail-note"><b>Fix.</b> {technique.fix}</span>
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 ? <p className="empty-note">No primitive matches those filters.</p> : null}
        </div>
      ) : null}

      {tab === "coverage" ? (
        <Panel
          title="Coverage field"
          meta={`${coveredCells} of ${totalCells} cells`}
          className="coverage-panel"
          actions={
            <button type="button" className={`ghost-toggle ${gaps ? "is-active" : ""}`} onClick={() => setGaps((value) => !value)}>
              {gaps ? "Highlight gaps" : "Show all"}
            </button>
          }
        >
          <div className={`matrix-wrap ${gaps ? "show-gaps" : ""}`}>
            <div className="matrix">
              <div className="matrix-row matrix-head">
                <span className="matrix-label">Primitive</span>
                {fleet.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    className="matrix-account"
                    title={row.title}
                    onClick={() => {
                      setAccount(row.key);
                      navigate("path");
                    }}
                  >
                    {row.short.slice(0, 3)}
                  </button>
                ))}
              </div>
              {techniqueRows.map((technique) => (
                <div key={technique.id} className={`matrix-row ${technique.id === selected.id ? "is-active" : ""}`}>
                  <button type="button" className="matrix-label" onClick={() => setTechniqueId(technique.id)} title={technique.name}>
                    <span>{technique.name}</span>
                    <em>{technique.mitre}</em>
                  </button>
                  {fleet.map((row, accountIndex) => {
                    const count = coverageCells[accountIndex]?.techniques[techniqueRows.findIndex((item) => item.id === technique.id)] ?? 0;
                    const alpha = count === 0 ? 0 : 0.16 + (count / coverageMax) * 0.84;
                    return (
                      <button
                        key={`${technique.id}-${row.key}`}
                        type="button"
                        className={`matrix-cell ${count === 0 ? "is-zero" : ""}`}
                        style={{ background: count === 0 ? undefined : `rgba(43,60,255,${alpha})` }}
                        title={`${technique.name} · ${row.title} · ${count} edge${count === 1 ? "" : "s"}`}
                        aria-label={`${technique.name}, ${row.title}, ${count} edges`}
                        onClick={() => setTechniqueId(technique.id)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="matrix-legend">
            <span><i style={{ background: "rgba(43,60,255,.2)" }} />1</span>
            <span><i style={{ background: "rgba(43,60,255,.55)" }} />2</span>
            <span><i style={{ background: "rgba(43,60,255,.95)" }} />3+</span>
            <span className="push">Click a row to focus it / an account to open its path</span>
          </div>
        </Panel>
      ) : null}

      {tab === "contracts" ? (
        <div className="contracts-layout">
          <Panel title="Contracts" meta="one evidence handoff">
            <div className="contract-list">
              {contracts.map((contract) => (
                <div key={contract.file} className="contract-row">
                  <span className={`tag ${contract.status}`}>{contract.status}</span>
                  <div><b>{contract.name}</b><em>{contract.file}</em><p>{contract.detail}</p></div>
                  <span className="contract-owner">{contract.owner}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Alert sample"
            meta="penumbra.alert/v1"
            actions={<button type="button" className="ghost-toggle" onClick={copyAlert}><Icon name="copy" size={12} />Copy</button>}
          >
            <pre className="contract-code">{ALERT_SAMPLE}</pre>
            <p className="detail-note">The emitted case alert is in <code>cases/01-observed-path/alert.json</code>; the delivered copy is in <code>detection-lab/integrations/apsis/</code>. Apsis produces; Penumbra consumes. No connector API, no shared database, no cross-repository import.</p>
          </Panel>
        </div>
      ) : null}

      {tab === "cases" ? (
        <div className="case-layout">
          <Panel title="Case 01" meta={caseStudy.kind} glow>
            <div className="case-head">
              <span className="case-id">01</span>
              <div><h3>{caseStudy.title}</h3><p>{caseStudy.account} / {caseStudy.window}</p></div>
              <span className="tag ready">observed</span>
            </div>
            <p className="case-summary">{caseStudy.summary}</p>
            <div className="case-chain">
              {caseStudy.route.map((label, index) => (
                <span key={`${label}-${index}`}><b>{label}</b>{index < caseStudy.route.length - 1 ? <i>→</i> : null}</span>
              ))}
            </div>
            <div className="case-columns">
              <div><span className="case-label">Cut</span><ul>{caseStudy.cut.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><span className="case-label">Guardrails</span><ul>{caseStudy.guardrails.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className="case-after"><span>After</span><b>{caseStudy.after}</b></div>
            <div className="case-links">
              <span><b>Alert</b><code>{caseStudy.alert}</code></span>
              <span><b>Handoff</b><code>{caseStudy.handoff}</code></span>
            </div>
            <p className="detail-note">{caseStudy.note}</p>
          </Panel>
          <Panel title="Case timeline" meta="recorded">
            <ol className="case-timeline">
              <li><span>18:00</span><b>Window opens</b><p>CloudTrail evidence begins for the games studio account.</p></li>
              <li><span>18:42</span><b>Path observed</b><p>Every edge in the signature route is observed.</p></li>
              <li><span>18:48</span><b>Alert emitted</b><p>path.opened with the evidence manifest.</p></li>
              <li><span>18:48</span><b>Cut recorded</b><p>37 edges; two human-readable revocations.</p></li>
            </ol>
          </Panel>
        </div>
      ) : null}
    </>
  );
}

