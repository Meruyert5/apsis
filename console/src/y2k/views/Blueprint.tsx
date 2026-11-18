import { useState } from "react";
import {
  contracts,
  generatedLabel,
  modules,
  pipeline,
  roadmap,
  snapshot,
  techniqueCount,
} from "../model";
import type { ViewId } from "../model";
import { FigurePanel, Icon, Panel } from "../ui";

const CHECKS = [
  { label: "Engine / 18 primitives", state: "ready" },
  { label: "Fixtures / 16 accounts", state: "ready" },
  { label: "Dashboard / 7 views", state: "ready" },
  { label: "Build / tsc + vite", state: "verified" },
  { label: "Logic tests / node --test", state: "verified" },
  { label: "Responsive / 390–1440", state: "checked" },
  { label: "Docs / README + changelog", state: "updated" },
  { label: "Schema contracts / alert + evidence", state: "ready" },
  { label: "Fixture validation / 16 bundles", state: "ready" },
  { label: "Reproducible / snapshot", state: "ready" },
  { label: "Pages workflow", state: "present" },
  { label: "Remote / publish", state: "approval" },
];

const ARCH = [
  { label: "Engine", detail: "Python, no AWS client", icon: "blueprint" as const },
  { label: "Static export", detail: "16 bundles + evidence", icon: "extensions" as const },
  { label: "Dashboard", detail: "React + Three.js", icon: "overview" as const },
  { label: "Penumbra", detail: "alert + evidence contract", icon: "atlas" as const },
];

export function Blueprint({
  navigate,
  motion,
}: {
  navigate: (view: ViewId) => void;
  motion: boolean;
}) {
  const [stage, setStage] = useState(0);
  const active = pipeline[stage];

  return (
    <>
      <section className="view-hero blueprint-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span>07</span> Blueprint / Whole system</p>
          <h1>The whole plan, <em>one page.</em></h1>
          <p className="lede">
            Five pipeline stages, seven dashboard views, one evidence contract. This is the
            complete system as built, with the release state and the open items in plain sight.
          </p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => navigate("overview")}>
              <Icon name="overview" />Back to the console
            </button>
            <button type="button" className="btn" onClick={() => navigate("extensions")}>
              <Icon name="extensions" />Open contracts
            </button>
          </div>
          <div className="meta-line">
            <span><i />{snapshot.accounts} accounts</span>
            <span>{techniqueCount} primitives</span>
            <span>Upload after approval</span>
          </div>
        </div>
        <FigurePanel
          variant="stack"
          index="FIG. 07"
          title="System stack"
          meta="Five layers / one export"
          tags={["5 stages", "7 views", "read-only"]}
          note="Auto: layers breathe and the beam rises"
          foot="Ready for review"
          motion={motion}
        />
      </section>

      <div className="blueprint-top">
        <Panel title="Pipeline" meta={`${stage + 1} / ${pipeline.length}`} glow>
          <div className="stage-list">
            {pipeline.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === stage ? "is-active" : undefined}
                onClick={() => setStage(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{item.label}</b>
                <em>{item.value} {item.unit}</em>
              </button>
            ))}
          </div>
          <div className="stage-detail">
            <span>{active.unit}</span>
            <b>{active.value}</b>
            <p>{active.detail}</p>
          </div>
        </Panel>

        <Panel title="Release state" meta={generatedLabel}>
          <div className="release-state">
            <span className="release-mark"><Icon name="check" size={20} /></span>
            <div><b>Ready for approval</b><p>The complete dashboard is built. Publishing waits for your sign-off.</p></div>
          </div>
          <ul className="check-list">
            {CHECKS.map((check) => (
              <li key={check.label} className={check.state}>
                <i>{check.state === "approval" ? "!" : "✓"}</i>
                <span>{check.label}</span>
                <em>{check.state}</em>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Architecture" meta="Apsis → Penumbra">
        <div className="arch-flow">
          {ARCH.map((item, index) => (
            <div key={item.label} className="arch-item">
              <span className="arch-icon"><Icon name={item.icon} size={18} /></span>
              <b>{item.label}</b>
              <em>{item.detail}</em>
              {index < ARCH.length - 1 ? <span className="arch-arrow" aria-hidden="true">→</span> : null}
            </div>
          ))}
        </div>
        <p className="arch-note">
          The engine produces a static export. The dashboard reads it without a backend. Penumbra
          consumes one alert and one evidence manifest; there is no connector repository and no
          shared database.
        </p>
      </Panel>

      <Panel title="Modules" meta="seven views">
        <div className="module-table">
          {modules.map((module) => (
            <button key={module.id} type="button" onClick={() => navigate(module.id as ViewId)}>
              <span>{module.index}</span>
              <b>{module.label}</b>
              <em>{module.detail}</em>
              <span className="module-status"><i />built</span>
              <Icon name="arrow" size={14} />
            </button>
          ))}
        </div>
      </Panel>

      <div className="blueprint-lower">
        <Panel title="Contracts" meta="shared evidence">
          <div className="contract-list compact-list">
            {contracts.map((contract) => (
              <div key={contract.file} className="contract-row">
                <span className={`tag ${contract.status}`}>{contract.status}</span>
                <div><b>{contract.name}</b><em>{contract.file}</em></div>
                <span className="contract-owner">{contract.owner}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Roadmap" meta="now / next / later">
          <div className="roadmap">
            <div><span>Now</span>{roadmap.now.map((item) => <p key={item}>{item}</p>)}</div>
            <div><span>Next</span>{roadmap.next.map((item) => <p key={item}>{item}</p>)}</div>
            <div><span>Later</span>{roadmap.later.map((item) => <p key={item}>{item}</p>)}</div>
          </div>
        </Panel>
      </div>

      <Panel title="Open items" meta="before publish">
        <div className="open-items">
          <div><span>01</span><b>Approval</b><p>You sign off on the dashboard direction and the release shape.</p></div>
          <div><span>02</span><b>Remote</b><p>Configure the GitHub remote and confirm the Pages workflow picks up the build.</p></div>
          <div><span>03</span><b>Live import</b><p>GetAccountAuthorizationDetails remains roadmap; the shipped console reads static fixtures.</p></div>
        </div>
      </Panel>
    </>
  );
}
