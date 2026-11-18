import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { driftFor, fleet, type ViewId } from "../model";
import { Count, FigurePanel, Icon, Panel } from "../ui";

const BEFORE = "ci-cd";
const AFTER = "ci-cd-after";

export function Drift({
  motion,
  navigate,
  setAccount,
}: {
  motion: boolean;
  navigate: (view: ViewId) => void;
  setAccount: (key: string) => void;
}) {
  const [beforeKey, setBeforeKey] = useState(BEFORE);
  const [afterKey, setAfterKey] = useState(AFTER);
  const summary = useMemo(() => driftFor(beforeKey, afterKey), [beforeKey, afterKey]);
  const statusLabel = summary.status === "worsened" ? "Worsened" : summary.status === "improved" ? "Improved" : "Steady";
  const canOpen = summary.afterRoutes > 0;

  return (
    <>
      <section className="view-head drift-head">
        <div>
          <p className="eyebrow"><span>05</span> Drift / Snapshot comparison</p>
          <h1>See what changed. Then <em>close it.</em></h1>
          <p className="lede">
            A route-aware diff of two snapshots. New escalation edges and new walks are called
            out; a closed route is proof the cut worked. This is the same comparator as
            <code> apsis diff</code>.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn primary"
            disabled={!canOpen}
            onClick={() => {
              setAccount(afterKey);
              navigate("path");
            }}
          >
            <Icon name="path" />Open the after route
          </button>
          <button type="button" className="btn" onClick={() => navigate("survey")}>
            <Icon name="survey" />Fleet ledger
          </button>
        </div>
      </section>

      <section className="kpi-grid four" aria-label="Drift figures">
        {[
          { label: "New routes", value: summary.newRoutes.length, foot: "after only", tone: "blue" },
          { label: "New edges", value: summary.added.length, foot: "escalation", tone: "" },
          { label: "Closed routes", value: summary.lostRoutes.length, foot: "before only", tone: "accent" },
          { label: "Status", value: statusLabel, foot: `${summary.beforeRoutes} → ${summary.afterRoutes}`, tone: "ink", text: true },
        ].map((item, index) => (
          <article
            key={item.label}
            className={`kpi ${item.tone}`.trim()}
            style={{ "--i": index } as CSSProperties}
          >
            <span className="kpi-label">{item.label}</span>
            <b className={`kpi-value ${item.text ? "is-text" : ""}`.trim()}>
              {item.text ? item.value : <Count value={item.value as number} motion={motion} />}
            </b>
            <span className="kpi-foot">{item.foot}</span>
          </article>
        ))}
      </section>

      <div className="drift-layout">
        <section className="drift-stage">
          <FigurePanel
            variant="drift"
            index="FIG. 05"
            title="Drift pair"
            meta={`${summary.beforeTitle} → ${summary.afterTitle}`}
            tags={[`+${summary.added.length} edges`, `-${summary.removed.length} edges`, `${summary.newRoutes.length} new routes`]}
            note="Auto: the scan reads both planets / the seam carries changes"
            foot={`${summary.beforeRoutes} → ${summary.afterRoutes} routes`}
            motion={motion}
            count={summary.added.length}
            focus={summary.removed.length}
          />

          <div className="drift-selects">
            <label className="field-label" htmlFor="drift-before">Before</label>
            <div className="select-wrap">
              <select id="drift-before" value={beforeKey} onChange={(event) => setBeforeKey(event.target.value)}>
                {fleet.map((row) => (
                  <option key={row.key} value={row.key}>{row.short} — {row.routes} routes</option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
            </div>
            <label className="field-label" htmlFor="drift-after">After</label>
            <div className="select-wrap">
              <select id="drift-after" value={afterKey} onChange={(event) => setAfterKey(event.target.value)}>
                {fleet.map((row) => (
                  <option key={row.key} value={row.key}>{row.short} — {row.routes} routes</option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
            </div>
          </div>

          <Panel title="Edge changes" meta={`${summary.added.length} added / ${summary.removed.length} removed`}>
            <div className="diff-list">
              {summary.added.map((edge) => (
                <div key={`a-${edge.id}`} className="diff-row is-added">
                  <span className="diff-tag">+</span>
                  <b>{edge.technique}</b>
                  <em>{edge.name}</em>
                  <span>{edge.severity}</span>
                </div>
              ))}
              {summary.removed.map((edge) => (
                <div key={`r-${edge.id}`} className="diff-row is-removed">
                  <span className="diff-tag">-</span>
                  <b>{edge.technique}</b>
                  <em>{edge.name}</em>
                  <span>{edge.severity}</span>
                </div>
              ))}
              {summary.added.length + summary.removed.length === 0 ? (
                <p className="empty-note">No edge changed between these snapshots.</p>
              ) : null}
            </div>
          </Panel>
        </section>

        <aside className="drift-side">
          <Panel title="New routes" meta={`${summary.newRoutes.length} after only`} glow={summary.newRoutes.length > 0}>
            <div className="diff-list">
              {summary.newRoutes.map((route, index) => (
                <button
                  key={`${route.source}-${index}`}
                  type="button"
                  className="diff-route"
                  onClick={() => {
                    setAccount(afterKey);
                    navigate("path");
                  }}
                >
                  <span className="diff-tag">+</span>
                  <span className="diff-route-copy">
                    <b>{route.sourceLabel}</b>
                    <em>{route.hops} hops / {route.labels.at(-1)}</em>
                    <span>{route.labels.join(" → ")}</span>
                  </span>
                  <Icon name="arrow" size={14} />
                </button>
              ))}
              {summary.newRoutes.length === 0 ? (
                <p className="empty-note">No new route in the after snapshot.</p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Closed routes" meta={`${summary.lostRoutes.length} before only`} glow={summary.lostRoutes.length > 0}>
            <div className="diff-list">
              {summary.lostRoutes.map((route, index) => (
                <div key={`${route.source}-lost-${index}`} className="diff-route is-closed">
                  <span className="diff-tag">-</span>
                  <span className="diff-route-copy">
                    <b>{route.sourceLabel}</b>
                    <em>{route.hops} hops / {route.labels.at(-1)}</em>
                    <span>{route.labels.join(" → ")}</span>
                  </span>
                </div>
              ))}
              {summary.lostRoutes.length === 0 ? (
                <p className="empty-note">No route closed between these snapshots.</p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Snapshot" meta="route-aware">
            <div className="route-meta">
              <div><span>Before</span><b>{summary.beforeTitle}</b></div>
              <div><span>After</span><b>{summary.afterTitle}</b></div>
              <div><span>Routes</span><b>{summary.beforeRoutes} → {summary.afterRoutes}</b></div>
              <div><span>Status</span><b>{statusLabel}</b></div>
            </div>
            <p className="detail-note">
              The comparator keys edges by source, target and technique, then re-derives every
              walk. A removed edge that closes no route is still reported, because it may be
              load-bearing for a longer path.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
