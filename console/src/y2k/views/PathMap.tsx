import { useEffect, useMemo, useState } from "react";
import { byKey } from "../../lib/data";
import type { Route } from "../../lib/types";
import {
  fleet,
  routeGroups,
  showcase,
  showcaseRoute,
  techniqueRows,
} from "../model";
import type { ViewId } from "../model";
import { Chip, FigurePanel, Icon, Panel } from "../ui";

export function PathMap({
  account,
  setAccount,
  motion,
  notify,
  navigate,
}: {
  account: string;
  setAccount: (key: string) => void;
  motion: boolean;
  notify: (message: string) => void;
  navigate: (view: ViewId) => void;
}) {
  const bundle = byKey.get(account) ?? showcase;
  const groups = routeGroups.get(account) ?? [];
  const signatureSourceId = bundle.signature?.nodes[0];
  const initialSource =
    groups.find((item) => item.sourceId === signatureSourceId)?.sourceId ??
    groups[0]?.sourceId ??
    "";
  const [sourceId, setSourceId] = useState(initialSource);
  const [routeIndex, setRouteIndex] = useState(0);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(motion);
  const [speed, setSpeed] = useState(1);
  const [cut, setCut] = useState(false);

  const group = groups.find((item) => item.sourceId === sourceId) ?? groups[0];
  const route: Route = group?.routes[routeIndex] ?? group?.routes[0] ?? showcaseRoute;
  const labels = route.labels;
  const last = labels.length - 1;
  const step = route.steps[Math.min(active, route.steps.length - 1)];
  const technique = techniqueRows.find((item) => item.id === step?.technique);
  const conditional = route.steps.filter((item) => item.conditional).length;

  useEffect(() => {
    const signature = bundle.signature;
    const nextSource =
      groups.find((item) => item.sourceId === signature?.nodes[0])?.sourceId ??
      groups[0]?.sourceId ??
      "";
    const nextGroup = groups.find((item) => item.sourceId === nextSource) ?? groups[0];
    const nextRoute = signature && nextGroup
      ? nextGroup.routes.findIndex((item) => item.labels.join("|") === signature.labels.join("|"))
      : -1;
    setSourceId(nextSource);
    setRouteIndex(nextRoute >= 0 ? nextRoute : 0);
    setActive(0);
    setCut(false);
    setPlaying(motion);
  }, [account]);

  useEffect(() => {
    setActive(0);
    setCut(false);
    setPlaying(motion);
  }, [sourceId, routeIndex]);

  useEffect(() => {
    setPlaying(motion);
  }, [motion]);

  useEffect(() => {
    if (!playing || cut || !route) return;
    if (active >= last) {
      const timer = window.setTimeout(() => {
        if (motion) setActive(0);
      }, 2600);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setActive((value) => Math.min(last, value + 1));
    }, 1150 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, active, last, cut, route, speed, motion]);

  const togglePlay = () => {
    if (cut) {
      setCut(false);
      setActive(0);
      setPlaying(true);
      return;
    }
    if (active >= last) setActive(0);
    setPlaying((value) => !value);
  };

  const stepForward = () => {
    setPlaying(false);
    setActive((value) => Math.min(last, value + 1));
  };

  const jumpTo = (index: number) => {
    setPlaying(false);
    setCut(false);
    setActive(index);
  };

  const toggleCut = () => {
    const next = !cut;
    setCut(next);
    setPlaying(false);
    setActive(next ? last : 0);
    notify(next ? "Minimum cut applied · route closed" : "Route restored · read-only");
  };

  const selectRoute = (index: number) => {
    setRouteIndex(index);
    setActive(0);
    setCut(false);
    setPlaying(motion);
  };

  const selectSource = (id: string) => {
    setSourceId(id);
    setRouteIndex(0);
  };

  const openRoute = (nextSource: string, nextIndex: number) => {
    setSourceId(nextSource);
    setRouteIndex(nextIndex);
    setActive(0);
    setCut(false);
    setPlaying(motion);
  };

  return (
    <>
      <section className="view-head path-head">
        <div>
          <p className="eyebrow"><span>03</span> Path map / Escalation</p>
          <h1>Step the route. Then <em>close it.</em></h1>
          <p className="lede">
            A live chart of one escalation. Every hop carries its IAM action, technique and
            evidence. The cut closes every route in the selected account.
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => navigate("atlas")}>
            <Icon name="atlas" />Open atlas
          </button>
        </div>
      </section>

      <div className="path-layout">
        <aside className="path-side">
          <Panel title="Scope" meta={bundle.scenario.region}>
            <label className="field-label" htmlFor="path-account">Account</label>
            <div className="select-wrap">
              <select id="path-account" value={account} onChange={(event) => setAccount(event.target.value)}>
                {fleet.map((row) => (
                  <option key={row.key} value={row.key}>{row.short} — {row.routes} routes</option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
            </div>
            <div className="scope-stats">
              <div><b>{bundle.stats.identities}</b><span>identities</span></div>
              <div><b>{bundle.stats.routes}</b><span>routes</span></div>
              <div><b>{bundle.sever.edgeCut.edges.length}</b><span>cut</span></div>
            </div>
          </Panel>

          <Panel title="Sources" meta={`${groups.length} with a path`}>
            <div className="source-list">
              {groups.map((item) => (
                <button
                  key={item.sourceId}
                  type="button"
                  className={item.sourceId === group?.sourceId ? "is-active" : undefined}
                  onClick={() => selectSource(item.sourceId)}
                >
                  <span>{item.source}</span>
                  <em>{item.routes.length}</em>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Routes" meta={`${group?.routes.length ?? 0} walks`}>
            <div className="route-list">
              {(group?.routes ?? []).map((item, index) => (
                <button
                  key={`${item.labels[0]}-${index}`}
                  type="button"
                  className={index === routeIndex ? "is-active" : undefined}
                  onClick={() => selectRoute(index)}
                >
                  <span className="route-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="route-copy">
                    <b>{item.hops} hops</b>
                    <em>{item.labels[item.labels.length - 1]}</em>
                  </span>
                  <Icon name="arrow" size={13} />
                </button>
              ))}
            </div>
          </Panel>
        </aside>

        <section className="path-stage">
          <FigurePanel
            variant="ascent"
            index="FIG. 03"
            title="Escalation ascent"
            meta={`${group?.source ?? "Source"} → administrator`}
            tags={[`${route.hops} hops`, `${conditional} conditional`, cut ? "cut" : "open"]}
            note="The active node is the current hop"
            foot={`${active + 1} / ${labels.length}`}
            motion={motion}
            active={active}
            count={labels.length}
            cut={cut}
          />

          <div className="path-controls">
            <div className="control-group">
              <button type="button" className="icon-button primary" onClick={togglePlay} aria-label={playing ? "Pause route" : "Play route"}>
                <Icon name={playing ? "pause" : "play"} />
              </button>
              <button type="button" className="icon-button" onClick={stepForward} aria-label="Next hop">
                <Icon name="step" />
              </button>
              <button type="button" className="icon-button" onClick={() => { setPlaying(false); setActive(0); setCut(false); }} aria-label="Reset route">
                <Icon name="reset" />
              </button>
            </div>
            <div className="speed-control" aria-label="Playback speed">
              {[0.5, 1, 2].map((value) => (
                <button key={value} type="button" className={speed === value ? "is-active" : undefined} onClick={() => setSpeed(value)}>
                  {value}×
                </button>
              ))}
            </div>
            <button type="button" className={`cut-button ${cut ? "is-cut" : ""}`} onClick={toggleCut}>
              <Icon name="cut" />{cut ? "Restore route" : "Apply cut"}
            </button>
          </div>

          <div className="hop-rail" role="list" aria-label="Route hops">
            {labels.map((label, index) => (
              <button
                key={`${label}-${index}`}
                type="button"
                role="listitem"
                className={`${index === active ? "is-active" : ""} ${index < active ? "is-done" : ""}`.trim()}
                aria-current={index === active ? "step" : undefined}
                onClick={() => jumpTo(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{label}</b>
              </button>
            ))}
          </div>

          <Panel title="Route" meta={`${labels.length} identities / ${route.hops} hops`}>
            <div className="route-chain">
              {labels.map((label, index) => (
                <span key={`${label}-chain-${index}`}>
                  <b>{label}</b>
                  {index < labels.length - 1 ? <i>→</i> : null}
                </span>
              ))}
            </div>
          </Panel>
        </section>

        <aside className="path-detail">
          {cut ? (
            <Panel title="Route closed" meta="minimum cut" glow>
              <div className="closed-block">
                <span className="closed-mark"><Icon name="cut" size={22} /></span>
                <b>{bundle.sever.edgeCut.edges.length} edges cut</b>
                <p>No routes remain in {bundle.scenario.title}. Nothing is written back.</p>
                <button type="button" className="btn" onClick={toggleCut}>
                  <Icon name="reset" />Restore view
                </button>
              </div>
            </Panel>
          ) : active >= last ? (
            <Panel title="Administrator" meta="end of route" glow>
              <div className="closed-block">
                <span className="closed-mark"><Icon name="check" size={22} /></span>
                <b>Administrator reached</b>
                <p>The route ends here. Apply the cut to close every walk in this account.</p>
                <button type="button" className="btn primary" onClick={toggleCut}>
                  <Icon name="cut" />Apply the cut
                </button>
              </div>
            </Panel>
          ) : (
            <Panel title="Hop detail" meta={`${active + 1} / ${labels.length}`} glow>
              <div className="hop-detail">
                <div className="hop-title">
                  <span>{String(active + 1).padStart(2, "0")}</span>
                  <div><b>{step?.name ?? "Step"}</b><em>{step?.technique ?? "action"}</em></div>
                </div>
                <dl className="detail-list">
                  <div><dt>From</dt><dd>{labels[active]}</dd></div>
                  <div><dt>To</dt><dd>{labels[active + 1]}</dd></div>
                  <div><dt>MITRE</dt><dd>{technique?.mitre ?? step?.mitre ?? "—"}</dd></div>
                  <div><dt>Conditional</dt><dd>{step?.conditional ? "yes" : "no"}</dd></div>
                </dl>
                {step?.actions?.length ? (
                  <div className="detail-block">
                    <span>Actions</span>
                    <div className="action-tags">{step.actions.map((action) => <code key={action}>{action}</code>)}</div>
                  </div>
                ) : null}
                {step?.evidence ? <p className="detail-note"><b>Evidence.</b> {step.evidence}</p> : null}
                {step?.narration ? <p className="detail-note">{step.narration}</p> : null}
                {technique?.fix ? <p className="detail-note"><b>Fix.</b> {technique.fix}</p> : null}
              </div>
            </Panel>
          )}

          <Panel title="Route state" meta={cut ? "closed" : "open"}>
            <div className="route-meta">
              <div><span>Source</span><b>{labels[0]}</b></div>
              <div><span>Target</span><b>{labels[last]}</b></div>
              <div><span>Severity</span><b>{bundle.scenario.severity}</b></div>
              <div><span>Conditional</span><b>{conditional}</b></div>
            </div>
            <div className="path-progress" aria-hidden="true">
              <i style={{ width: `${((active + 1) / labels.length) * 100}%` }} />
            </div>
          </Panel>
        </aside>
      </div>

      <Panel title="Route ledger" meta={`${bundle.stats.routes} routes / ${groups.length} sources`} className="route-ledger-panel">
        <div className="route-ledger">
          {groups.flatMap((entry) =>
            entry.routes.map((item, index) => (
              <button
                key={`${entry.sourceId}-${index}`}
                type="button"
                className={entry.sourceId === sourceId && index === routeIndex ? "is-active" : undefined}
                onClick={() => openRoute(entry.sourceId, index)}
              >
                <span className="ledger-index">R{String(index + 1).padStart(2, "0")}</span>
                <span className="ledger-source">{entry.source}</span>
                <em>{String(item.hops).padStart(2, "0")} hops</em>
                <span className="ledger-target">{item.labels[item.labels.length - 1]}</span>
                <Icon name="arrow" size={13} />
              </button>
            )),
          )}
        </div>
      </Panel>
    </>
  );
}
