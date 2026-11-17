import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActHeader } from "../components/ActHeader";
import { Organism } from "../map/Organism";
import { buildOrganism } from "../lib/organism";
import type { OrganismRoute } from "../lib/organism";
import { bundles, byKey, index } from "../lib/data";
import type { Bundle, GraphNode } from "../lib/types";

const FEATURED = "games-studio";

function firstSource(bundle: Bundle, model: ReturnType<typeof buildOrganism>): string | null {
  return bundle.signature?.nodes[0] ?? model.principals[0]?.node.id ?? null;
}

export function Map() {
  const [focusKey, setFocusKey] = useState(FEATURED);
  const bundle = byKey.get(focusKey) ?? byKey.get(FEATURED)!;
  const model = useMemo(() => buildOrganism(bundle), [bundle]);

  const [source, setSource] = useState<string | null>(() => firstSource(bundle, model));
  const [node, setNode] = useState<string | null>(source);
  const [route, setRoute] = useState<OrganismRoute | null>(() => (source ? model.routeFor(source) : null));
  const [step, setStep] = useState(() => (route ? route.hops - 1 : 0));
  const [cut, setCut] = useState(false);
  const [tab, setTab] = useState<"route" | "node" | "cut">("route");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "user" | "role">("all");
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveTab = cut ? "cut" : tab;
  const nodeItem: GraphNode | null = node ? model.nodeById.get(node) ?? null : null;
  const sourceItem: GraphNode | null = source ? model.nodeById.get(source) ?? null : null;
  const hasRoutes = model.principals.length > 0 && bundle.stats.routes > 0;
  const activeStep = route ? Math.min(step, route.hops - 1) : 0;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return model.principals.filter(({ node: item }) => {
      const kindOk = kind === "all" || item.kind === kind;
      const queryOk = !q || item.label.toLowerCase().includes(q) || item.id.includes(q);
      return kindOk && queryOk;
    });
  }, [model, query, kind]);

  const chooseAccount = (key: string) => {
    const nextBundle = byKey.get(key);
    if (!nextBundle) return;
    const nextModel = buildOrganism(nextBundle);
    const nextSource = firstSource(nextBundle, nextModel);
    setFocusKey(key);
    setSource(nextSource);
    setNode(nextSource);
    setRoute(nextSource ? nextModel.routeFor(nextSource) : null);
    setStep(nextSource ? (nextModel.routeFor(nextSource)?.hops ?? 1) - 1 : 0);
    setCut(false);
    setTab("route");
    setPlaying(false);
    setCopied(false);
  };

  const select = useCallback((id: string) => {
    setNode(id);
    const nextRoute = model.routeFor(id);
    if (nextRoute) {
      setSource(id);
      setRoute(nextRoute);
      setStep(nextRoute.hops - 1);
      setCut(false);
      setTab("route");
      setPlaying(false);
    } else {
      setCut(false);
      setTab("node");
    }
  }, [model]);

  useEffect(() => {
    if (!playing || !route) return;
    if (effectiveTab !== "route") {
      setPlaying(false);
      return;
    }
    if (step >= route.hops - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setStep((value) => Math.min(value + 1, route.hops - 1));
    }, 760);
    return () => window.clearTimeout(timer);
  }, [playing, step, route, effectiveTab]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const sever = () => {
    if (!hasRoutes) return;
    setCut((value) => !value);
    setTab(cut ? "route" : "cut");
    setStep(0);
    setPlaying(false);
  };

  const copyRoute = async () => {
    if (!route) return;
    const labels = route.nodes.map((id) => model.nodeById.get(id)?.label ?? id);
    try {
      await navigator.clipboard.writeText(labels.join(" → "));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const chooseRef = useRef(chooseAccount);
  chooseRef.current = chooseAccount;
  useEffect(() => {
    const onFocus = (event: Event) => chooseRef.current((event as CustomEvent<string>).detail);
    window.addEventListener("apsis:focus", onFocus);
    return () => window.removeEventListener("apsis:focus", onFocus);
  }, []);

  const status = cut
    ? `Account closed. ${bundle.sever.edgeCut.edges.length} edges cut, ${bundle.sever.permissionSteps.length} actions revoked. No route remains.`
    : hasRoutes
      ? `${bundle.stats.sourcesWithPath} principals can reach an administrator in ${bundle.scenario.title}.`
      : `No route to an administrator in ${bundle.scenario.title}.`;

  return (
    <section className="bio-act" id="map" aria-labelledby="map-title">
      <ActHeader
        index="02"
        label="Map"
        title={
          <span id="map-title">
            The account, <em>in orbit.</em>
          </span>
        }
        lede={
          <>
            The administrator is the primary star. Every identity is a body on the
            orbit its hops allow; every escalation is a flux tube. Pick a principal,
            walk its route, then sever the cut.
          </>
        }
        meta={
          <>
            <b>{bundle.stats.identities}</b> identities<br />
            <b>{bundle.stats.routes}</b> routes<br />
            <b>{bundle.stats.sourcesWithPath}</b> reach admin<br />
            <b>{bundle.stats.shortest ?? "—"}</b> shortest hop
          </>
        }
      />

      <div className="bio-toolbar">
        <div className="bio-account">
          <i aria-hidden="true" />
          <div>
            <select
              value={focusKey}
              onChange={(event) => chooseAccount(event.target.value)}
              aria-label="Account"
            >
              {bundles.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.bundle.scenario.title}</option>
              ))}
            </select>
            <br />
            <span>{bundle.scenario.accountId} / {bundle.scenario.region}</span>
          </div>
        </div>

        <div className="bio-stats">
          <span><b>{cut ? 0 : bundle.stats.routes}</b> routes</span>
          <span><b>{cut ? 0 : bundle.stats.sourcesWithPath}/{bundle.stats.sources}</b> reach</span>
          <span><b>{bundle.sever.edgeCut.edges.length}</b> edges cut</span>
          <span><b>{bundle.sever.permissionSteps.length}</b> actions</span>
        </div>

        <button
          type="button"
          className="bio-sever"
          data-on={cut ? "true" : undefined}
          disabled={!hasRoutes}
          onClick={sever}
        >
          {cut ? "Restore routes" : "Sever minimum cut"}
        </button>
        <p className="bio-live" aria-live="polite">{status}</p>
      </div>

      <div className="bio-grid">
        <aside className="bio-panel bio-principals" aria-label="Principals">
          <div className="bio-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search principals"
              aria-label="Search principals"
            />
          </div>
          <div className="bio-filters" role="group" aria-label="Filter principals">
            {(["all", "user", "role"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="bio-filter"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {value === "all" ? "All" : value === "user" ? "Users" : "Roles"}
              </button>
            ))}
          </div>
          <div className="bio-railhead"><span>Principal</span><span>Hops</span></div>
          <div className="bio-rows">
            {rows.map(({ node: item, route: itemRoute }) => (
              <button
                key={item.id}
                type="button"
                className="bio-prow"
                aria-selected={item.id === source}
                onClick={() => select(item.id)}
              >
                <i data-kind={item.kind} aria-hidden="true" />
                <span>{item.label}</span>
                <em>{String(itemRoute.hops).padStart(2, "0")}</em>
              </button>
            ))}
            {rows.length === 0 ? <p className="bio-empty">No principal matches.</p> : null}
          </div>
          <p className="bio-railfoot">
            {cut
              ? `${model.principals.length} principals were reachable · cut verified`
              : `${rows.length} of ${model.principals.length} principals with a route`}
          </p>
        </aside>

        <div className="bio-stage">
          <Organism
            bundle={bundle}
            model={model}
            source={source}
            node={node}
            route={route}
            cut={cut}
            onSelect={select}
          />
          <div className="bio-stagetag">
            <b>Magnetic orrery</b>
            <span>star · orbit shells · flux tubes</span>
          </div>
          <div className="bio-legend" aria-hidden="true">
            <span><i style={{ background: "var(--violet)" }} />user</span>
            <span><i style={{ background: "var(--cyan)" }} />role</span>
            <span><i style={{ background: "var(--mint)" }} />group</span>
            <span><i style={{ background: "var(--amber)" }} />primary star</span>
          </div>
        </div>

        <aside className="bio-panel bio-readout" aria-label="Readout">
          <div className="bio-tabs" role="tablist" aria-label="Readout">
            {(["route", "node", "cut"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                className="bio-tab"
                aria-selected={effectiveTab === value}
                onClick={() => setTab(value)}
              >
                {value === "route" ? "Route" : value === "node" ? "Node" : "Cut"}
              </button>
            ))}
          </div>
          <div className="bio-tabbody">
            {effectiveTab === "cut" ? (
              <CutView bundle={bundle} onRestore={sever} />
            ) : effectiveTab === "node" ? (
              <NodeView
                item={nodeItem ?? sourceItem}
                depth={node ? model.depth.get(node) ?? 0 : 0}
                onWalk={select}
              />
            ) : (
              <RouteView
                route={route}
                item={sourceItem}
                step={activeStep}
                onCopy={copyRoute}
                copied={copied}
                onSever={sever}
                onStep={setStep}
              />
            )}
          </div>
        </aside>
      </div>

      <div className="bio-hopbar">
        <button
          type="button"
          className="bio-play"
          aria-label={playing ? "Pause the walk" : "Play the walk"}
          onClick={() => setPlaying((value) => !value)}
          disabled={!route || cut}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="bio-hops">
          {route && !cut
            ? route.edges.map((edge, index) => (
                <button
                  key={edge.id}
                  type="button"
                  className="bio-hop"
                  aria-current={index === step}
                  data-past={index < step ? "true" : undefined}
                  title={edge.name}
                  onClick={() => { setPlaying(false); setStep(index); }}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))
            : null}
        </div>
        <span className="bio-hopcount">
          {route && !cut
            ? `${String(activeStep + 1).padStart(2, "0")} / ${String(route.hops).padStart(2, "0")}`
            : "—"}
        </span>
        <span className="bio-hopname">
          {cut ? "account closed" : route ? route.edges[activeStep]?.name : "no route"}
        </span>
      </div>

      <p className="bio-footer" style={{ border: 0, marginTop: 18, paddingTop: 0 }}>
        <span>Fig. 02 / magnetic orrery / star · orbit shells · flux tubes</span>
        <span>source: {index.engine.name} export / {bundle.scenario.accountId}</span>
      </p>
    </section>
  );
}

function RouteView({
  route,
  item,
  step,
  onCopy,
  copied,
  onSever,
  onStep,
}: {
  route: OrganismRoute | null;
  item: GraphNode | null;
  step: number;
  onCopy: () => void;
  copied: boolean;
  onSever: () => void;
  onStep: (value: number) => void;
}) {
  if (!route) {
    return (
      <>
        <p className="bio-kick">Route</p>
        <h2>No route.</h2>
        <p className="bio-meta">This account has no principal that reaches an administrator.</p>
        <p className="bio-note"><b>Clean result.</b> Nothing to sever. The export still describes the account.</p>
      </>
    );
  }
  return (
    <>
      <p className="bio-kick">Route / {String(route.hops).padStart(2, "0")} hops · theoretical</p>
      <h2>{item?.label ?? route.nodes[0]}</h2>
      <p className="bio-meta">{item?.kind ?? "principal"} → administrator</p>
      <div className="bio-tags">
        <span className="bio-tag bio-tag--hot">{route.hops} hops</span>
        <span className="bio-tag bio-tag--cool">{route.edges.length} steps</span>
      </div>
      <ul className="bio-steps">
        {route.edges.map((edge, index) => (
          <li className="bio-step" key={edge.id} aria-current={index === step}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <div>
              <span>{edge.name}</span>
              <em>{edge.actions.join(", ")}</em>
            </div>
          </li>
        ))}
      </ul>
      <div className="bio-actions">
        <button type="button" className="bio-btn bio-btn--solid" onClick={onCopy}>
          {copied ? "Copied" : "Copy route"}
        </button>
        <button type="button" className="bio-btn" onClick={onSever}>Sever cut</button>
      </div>
    </>
  );
}

function NodeView({
  item,
  depth,
  onWalk,
}: {
  item: GraphNode | null;
  depth: number;
  onWalk: (id: string) => void;
}) {
  if (!item) {
    return <p className="bio-empty">Pick a cell in the organism.</p>;
  }
  return (
    <>
      <p className="bio-kick">Node / {item.admin ? "administrator" : item.kind}</p>
      <h2>{item.label}</h2>
      <p className="bio-meta">{item.degree} connections · {depth} hops to administrator</p>
      <div className="bio-tags">
        <span className="bio-tag bio-tag--cool">{item.kind}</span>
        {item.admin ? <span className="bio-tag bio-tag--hot">destination</span> : null}
      </div>
      <p className="bio-meta">{item.arn || "No ARN in this fixture"}</p>
      {item.note ? <p className="bio-note">{item.note}</p> : null}
      {!item.admin ? (
        <div className="bio-actions">
          <button type="button" className="bio-btn" onClick={() => onWalk(item.id)}>
            Walk this cell's route →
          </button>
        </div>
      ) : null}
    </>
  );
}

function CutView({ bundle, onRestore }: { bundle: Bundle; onRestore: () => void }) {
  const steps = bundle.sever.permissionSteps;
  const edges = bundle.sever.edgeCut.edges.length;
  if (edges === 0) {
    return (
      <>
        <p className="bio-kick">Cut / verified</p>
        <h2>No cut required.</h2>
        <p className="bio-meta">0 routes before · 0 after · 0 edges cut</p>
        <p className="bio-note"><b>Clean account.</b> There is no route to an administrator to sever.</p>
      </>
    );
  }
  return (
    <>
      <p className="bio-kick">Cut / verified</p>
      <h2>0 routes remain.</h2>
      <p className="bio-meta">{bundle.stats.routes} before · {bundle.sever.routesAfter} after · {edges} edges cut</p>
      <div className="bio-tags">
        <span className="bio-tag bio-tag--hot">{edges} edges</span>
        <span className="bio-tag bio-tag--cool">{steps.length} actions</span>
      </div>
      <ul className="bio-steps">
        {steps.map((step, index) => (
          <li className="bio-step" key={`${step.action}-${index}`}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <div>
              <span>{step.action}</span>
              <em>
                {step.edgesRemoved} edge{step.edgesRemoved === 1 ? "" : "s"} removed ·{" "}
                {step.routesKilled} route{step.routesKilled === 1 ? "" : "s"} killed
              </em>
            </div>
          </li>
        ))}
      </ul>
      <p className="bio-note"><b>Printed, not applied.</b> One action can remove several edges. Review the operational cost before revoking.</p>
      <div className="bio-actions">
        <button type="button" className="bio-btn" onClick={onRestore}>Restore routes</button>
      </div>
    </>
  );
}
