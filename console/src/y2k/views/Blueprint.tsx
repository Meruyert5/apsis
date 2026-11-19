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
  { label: "Dashboard / 8 views", state: "ready" },
  { label: "Build / tsc + vite", state: "verified" },
  { label: "Logic tests / node --test", state: "verified" },
  { label: "CloudTrail overlay + import", state: "verified" },
  { label: "Conditions + resource policies", state: "verified" },
  { label: "Drift + CSV ledger", state: "verified" },
  { label: "CI a11y + Lighthouse", state: "configured" },
  { label: "Responsive / 390-1440", state: "checked" },
  { label: "Docs / README + changelog", state: "updated" },
  { label: "Schema contracts / alert + evidence", state: "ready" },
  { label: "Fixture validation / 16 bundles", state: "ready" },
  { label: "Reproducible / snapshot", state: "ready" },
  { label: "Fullscreen / every figure", state: "verified" },
  { label: "Penumbra handoff / alert + evidence", state: "delivered" },
  { label: "Pages workflow", state: "live" },
  { label: "Remote / publish", state: "published" },
];

const ARCH = [
  { label: "Engine", detail: "Python / AWS CLI import", icon: "blueprint" as const },
  { label: "Static export", detail: "16 bundles + evidence", icon: "extensions" as const },
  { label: "Dashboard", detail: "React + Three.js", icon: "overview" as const },
  { label: "Penumbra", detail: "alert + evidence / delivered", icon: "atlas" as const },
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
          <p className="eyebrow"><span>08</span> Blueprint / Whole system</p>
          <h1>The whole plan, <em>one page.</em></h1>
          <p className="lede">
            Five pipeline stages, eight dashboard views, one evidence contract. This is the
            complete system as built, with the release state and the published URLs in plain sight.
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
            <span>Live / GitHub Pages</span>
          </div>
        </div>
        <FigurePanel
          variant="stack"
          index="FIG. 08"
          title="System stack"
          meta="Five layers / one export"
          tags={["5 stages", "8 views", "read-only"]}
          note="Auto: layers breathe and the beam rises"
          foot="Published / live"
          motion={motion}
        />
      </section>

      <div className="blueprint-top">
        <div className="blueprint-left">
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

          <Panel title="Engine additions" meta="completed">
            <ul className="engine-list">
              <li><b>CloudTrail overlay</b><span>Observed edges, first/last seen, route coverage; `scan`, `export` and `overlay`.</span></li>
              <li><b>Live IAM import</b><span>`GetAccountAuthorizationDetails` via the AWS CLI or a saved dump, converted to a fixture.</span></li>
              <li><b>Condition evaluation</b><span>String, ARN, Bool, IP, date and numeric operators; unknown guards stay conditional.</span></li>
              <li><b>Resource policies</b><span>Principal, Allow and Deny evaluation for resource-based policies.</span></li>
              <li><b>Drift + CSV</b><span>Route-aware snapshot comparison and a per-edge CSV ledger.</span></li>
              <li><b>CI gate</b><span>All eight views at 1440/390 plus Lighthouse accessibility, best practices and SEO.</span></li>
            </ul>
          </Panel>
        </div>

        <Panel title="Release state" meta={generatedLabel}>
          <div className="release-state">
            <span className="release-mark"><Icon name="check" size={20} /></span>
            <div><b>Live — published to GitHub Pages</b><p>The repository is public, <code>main</code> is pushed, and the pages workflow deploys the console on every push. The engine, eight views and the Penumbra handoff are complete.</p></div>
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

      <section className="horizon-row">
        <FigurePanel
          variant="horizon"
          index="FIG. 09"
          title="Event horizon"
          meta="0 routes remain / the cut held"
          tags={["37 edges cut", "144 routes closed", "0 writes"]}
          note="Auto: the disk turns / the horizon holds"
          foot="Verified"
          motion={motion}
        />
        <Panel title="Closure" meta="event horizon verified">
          <div className="horizon-copy">
            <h3>Every route closed.</h3>
            <p>
              The minimum cut removes 37 edges. Re-running the survey from every identity
              returns no walk to an administrator; the four clean fixtures stay clean.
            </p>
          </div>
          <ul className="horizon-stats">
            <li><b>{snapshot.routes}</b><span>routes before</span></li>
            <li><b>0</b><span>routes after</span></li>
            <li><b>{snapshot.cut}</b><span>edges cut</span></li>
            <li><b>{snapshot.writes}</b><span>writes</span></li>
          </ul>
          <p className="detail-note">
            The horizon is the state the engine is trying to reach, not a live account. It is
            computed from the fixture export and rendered read-only.
          </p>
        </Panel>
      </section>

      <Panel title="Modules" meta="eight views">
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

      <Panel title="Published" meta="after release">
        <div className="open-items">
          <div><span>01</span><b>Repository</b><p>Public at <code>github.com/Meruyert5/apsis</code>; <code>main</code> tracks origin and CI runs on every push.</p></div>
          <div><span>02</span><b>Pages</b><p>HTTPS site at <code>meruyert5.github.io/apsis</code>, rebuilt by the pages workflow from <code>console/dist</code>.</p></div>
          <div><span>03</span><b>Live import</b><p><code>apsis import --from-aws</code> reads <code>GetAccountAuthorizationDetails</code> through the AWS CLI; this demo runs on the synthetic 16-account fleet.</p></div>
        </div>
      </Panel>
    </>
  );
}

