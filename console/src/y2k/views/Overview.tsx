import {
  commands,
  engineLabel,
  fleet,
  generatedLabel,
  modules,
  pipeline,
  snapshot,
  techniqueCount,
} from "../model";
import type { ViewId } from "../model";
import type { CSSProperties } from "react";
import { Count, FigurePanel, Icon, Panel } from "../ui";
import type { IconName } from "../ui";

const KPIS = [
  { label: "Accounts", value: snapshot.accounts, foot: "monitored", tone: "" },
  { label: "Identities", value: snapshot.identities, foot: "fleet-wide", tone: "" },
  { label: "Routes", value: snapshot.routes, foot: "to administrator", tone: "" },
  { label: "Edges cut", value: snapshot.cut, foot: "minimum cut", tone: "blue" },
  { label: "Deepest", value: snapshot.deepest, foot: "hops / apogee", tone: "accent" },
  { label: "Writes", value: snapshot.writes, foot: "read-only", tone: "ink" },
];

const MODULE_VALUE: Record<string, string> = {
  survey: `${snapshot.accounts} accounts`,
  path: `${snapshot.routes} routes`,
  atlas: `${snapshot.identities} identities`,
  commands: `${commands.length} runs`,
  extensions: `${techniqueCount} primitives`,
  blueprint: "Whole system",
};

const EVENTS = [
  { label: "Snapshot", detail: `${snapshot.identities} identities across ${snapshot.accounts} accounts` },
  { label: "Analysis", detail: `${snapshot.routes} routes; deepest ${String(snapshot.deepest).padStart(2, "0")} hops` },
  { label: "Decision", detail: `${snapshot.cut} edges cut; no routes remain` },
  { label: "Guardrail", detail: "0 writes; read-only preserved" },
  { label: "Handoff", detail: "Penumbra alert + evidence contract ready" },
];

export function Overview({
  navigate,
  pickAccount,
  motion,
}: {
  navigate: (view: ViewId) => void;
  pickAccount: (key: string) => void;
  motion: boolean;
}) {
  const maxRoutes = Math.max(...fleet.map((account) => account.routes), 1);
  const cards = modules.filter((module) => module.id !== "overview");

  return (
    <>
      <section className="view-hero overview-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span>01</span> Overview / Path + Atlas</p>
          <h1 className="display" aria-label="Apsis">
            <span className="solid">APSIS</span>
            <span className="outline" aria-hidden="true">APSIS</span>
          </h1>
          <p className="hero-line">Every route reaches its <em>apsis.</em></p>
          <p className="lede">
            Read-only. {snapshot.identities} identities resolve into {snapshot.routes} routes to
            administrator. The minimum cut is {snapshot.cut} edges; the closest route is 01 hop,
            the deepest {String(snapshot.deepest).padStart(2, "0")}.
          </p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => navigate("path")}>
              <Icon name="path" />Open path map
            </button>
            <button type="button" className="btn" onClick={() => navigate("survey")}>
              <Icon name="survey" />Run the survey
            </button>
          </div>
          <div className="meta-line">
            <span><i />Snapshot {generatedLabel}</span>
            <span>{engineLabel}</span>
            <span>0 writes</span>
          </div>
        </div>

        <FigurePanel
          variant="orb"
          index="FIG. 01"
          title="Path + Atlas"
          meta="Wireframe mascot / live"
          tags={["16 nodes", "07 hops", "01 path"]}
          note="Atlas = wireframe shell / path = seven-node orbit"
          foot="Read-only"
          motion={motion}
          badge
        />
      </section>

      <section className="kpi-grid" aria-label="Fleet figures">
        {KPIS.map((item, index) => (
          <article key={item.label} className={`kpi ${item.tone}`.trim()} style={{ "--i": index } as CSSProperties}>
            <span className="kpi-label">{item.label}</span>
            <b className="kpi-value"><Count value={item.value} motion={motion} /></b>
            <span className="kpi-foot">{item.foot}</span>
          </article>
        ))}
      </section>

      <div className="section-head">
        <div>
          <p className="kicker">Modules</p>
          <h2>The system, one jump away.</h2>
        </div>
        <p>Every surface reads the same export. Pick a lens; the route and the evidence stay attached.</p>
      </div>

      <section className="module-grid">
        {cards.map((module, index) => (
          <button
            key={module.id}
            type="button"
            className="module-card"
            style={{ "--i": index } as CSSProperties}
            onClick={() => navigate(module.id as ViewId)}
          >
            <span className="module-index">{module.index}</span>
            <span className="module-icon"><Icon name={module.id as IconName} size={18} /></span>
            <b>{module.label}</b>
            <em>{module.detail}</em>
            <span className="module-value">{MODULE_VALUE[module.id]}</span>
            <span className="module-arrow"><Icon name="arrow" size={15} /></span>
          </button>
        ))}
      </section>

      <div className="overview-lower">
        <Panel
          title="Fleet pulse"
          meta="routes by account"
          actions={<span className="mini-note">click a bar</span>}
        >
          <div className="pulse-chart">
            {fleet.map((account, index) => (
              <button
                key={account.key}
                type="button"
                className="pulse-bar"
                title={`${account.title} — ${account.routes} routes / ${account.identities} identities`}
                style={{ "--i": index } as CSSProperties}
                onClick={() => pickAccount(account.key)}
              >
                <span className="pulse-track">
                  <i style={{ height: `${Math.max(8, (account.routes / maxRoutes) * 100)}%` }} />
                </span>
                <em>{account.short.slice(0, 4)}</em>
                <b>{account.routes}</b>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Recent evidence" meta="recorded run" actions={<span className="live"><i />Live</span>}>
          <ol className="mini-timeline">
            {EVENTS.map((event, index) => (
              <li key={event.label} style={{ "--i": index } as CSSProperties}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><b>{event.label}</b><p>{event.detail}</p></div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <section className="pipeline">
        {pipeline.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            className="pipeline-stage"
            onClick={() => navigate("blueprint")}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{stage.label}</b>
            <em>{stage.value} {stage.unit}</em>
            {index < pipeline.length - 1 ? <i aria-hidden="true">→</i> : null}
          </button>
        ))}
      </section>
    </>
  );
}
