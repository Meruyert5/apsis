import { useEffect, useMemo, useState } from "react";
import { byKey } from "../../lib/data";
import type { GraphNode } from "../../lib/types";
import { fleet, showcase } from "../model";
import type { ViewId } from "../model";
import { Chip, FigurePanel, Icon, Panel } from "../ui";

type KindFilter = "all" | "user" | "role" | "group" | "admin";

const KIND_COLOR: Record<string, string> = {
  admin: "#ffffff",
  role: "#2b3cff",
  user: "#7a6cff",
  group: "#44506e",
  lambda: "#5d6b8a",
  ec2: "#5d6b8a",
  ecs: "#5d6b8a",
  glue: "#5d6b8a",
  sagemaker: "#5d6b8a",
  cloudformation: "#5d6b8a",
};

export function Atlas({
  account,
  setAccount,
  motion,
  navigate,
}: {
  account: string;
  setAccount: (key: string) => void;
  motion: boolean;
  navigate: (view: ViewId) => void;
}) {
  const bundle = byKey.get(account) ?? showcase;
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(bundle.nodes[0]?.id ?? null);

  useEffect(() => {
    setSelectedId(bundle.nodes[0]?.id ?? null);
    setQuery("");
    setKind("all");
  }, [account]);

  const focusIndex = Math.max(0, fleet.findIndex((row) => row.key === account));
  const nodes = bundle.nodes;
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    nodes.forEach((node) => {
      map.set(node.id, {
        x: 64 + ((node.x - minX) / spanX) * 772,
        y: 64 + ((node.y - minY) / spanY) * 432,
      });
    });
    return map;
  }, [nodes]);

  const visible = (node: GraphNode) => {
    const term = query.trim().toLowerCase();
    const kindOk =
      kind === "all" ||
      (kind === "admin" ? node.admin : node.kind === kind);
    const queryOk =
      !term ||
      `${node.label} ${node.id} ${node.arn}`.toLowerCase().includes(term);
    return kindOk && queryOk;
  };

  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const selectedRoutes = selected ? bundle.paths[selected.id]?.length ?? 0 : 0;

  return (
    <>
      <section className="view-hero atlas-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span>04</span> Atlas / Accounts + identities</p>
          <h1>Every identity in its <em>orbit.</em></h1>
          <p className="lede">
            {fleet.length} accounts, {bundle.stats.identities} identities in focus and{" "}
            {bundle.edges.length} escalation edges. Click a constellation node to switch accounts,
            or a node in the graph to inspect its trust and routes.
          </p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => navigate("path")}>
              <Icon name="path" />Open path map
            </button>
            <button type="button" className="btn" onClick={() => navigate("extensions")}>
              <Icon name="extensions" />Open extensions
            </button>
          </div>
        </div>
        <FigurePanel
          variant="atlas"
          index="FIG. 04"
          title="Account constellation"
          meta="16 nodes / one fleet"
          tags={[`${fleet.length} accounts`, `${bundle.stats.identities} in focus`, `${bundle.edges.length} edges`]}
          note="Auto: nodes pulse / click a node to switch account"
          foot={bundle.scenario.title}
          motion={motion}
          focus={focusIndex}
          onPick={(index) => {
            const next = fleet[index];
            if (next) setAccount(next.key);
          }}
        />
      </section>

      <div className="atlas-layout">
        <Panel title="Accounts" meta={`${fleet.length} nodes`} className="account-panel">
          <div className="account-list">
            {fleet.map((row, index) => (
              <button
                key={row.key}
                type="button"
                className={row.key === account ? "is-active" : undefined}
                onClick={() => setAccount(row.key)}
              >
                <span className="account-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="account-copy"><b>{row.short}</b><em>{row.identities} identities</em></span>
                <span className={`mark ${row.severity}`} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Identity graph"
          meta={`${bundle.stats.identities} identities / ${bundle.edges.length} edges`}
          className="graph-panel"
          actions={<span className="mini-note">{bundle.scenario.region}</span>}
        >
          <div className="graph-toolbar">
            <div className="field">
              <Icon name="search" size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search identities…"
                aria-label="Search identities"
              />
            </div>
            <div className="chip-row">
              {(["all", "user", "role", "group", "admin"] as KindFilter[]).map((item) => (
                <Chip key={item} active={kind === item} onClick={() => setKind(item)}>{item}</Chip>
              ))}
            </div>
          </div>
          <div className="graph-wrap">
            <svg className="identity-graph" viewBox="0 0 900 560" role="img" aria-label="Identity graph">
              <g className="graph-grid">
                {Array.from({ length: 9 }, (_, index) => (
                  <line key={`v${index}`} x1={90 + index * 90} y1="30" x2={90 + index * 90} y2="530" />
                ))}
                {Array.from({ length: 6 }, (_, index) => (
                  <line key={`h${index}`} x1="30" y1={90 + index * 90} x2="870" y2={90 + index * 90} />
                ))}
              </g>
              {bundle.edges.map((edge) => {
                const a = positions.get(edge.source);
                const b = positions.get(edge.target);
                if (!a || !b) return null;
                const active = selectedId === edge.source || selectedId === edge.target;
                return (
                  <line
                    key={edge.id}
                    className={`graph-edge ${active ? "is-active" : ""}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                );
              })}
              {nodes.map((node) => {
                const point = positions.get(node.id);
                if (!point) return null;
                const on = visible(node);
                const isSelected = node.id === selectedId;
                return (
                  <g
                    key={node.id}
                    className={`graph-node ${isSelected ? "is-selected" : ""} ${on ? "" : "is-dim"}`.trim()}
                    transform={`translate(${point.x} ${point.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${node.label}, ${node.kind}${node.admin ? ", administrator" : ""}`}
                    onClick={() => setSelectedId(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(node.id);
                      }
                    }}
                  >
                    <title>{node.label}</title>
                    {node.admin ? (
                      <rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" fill={KIND_COLOR.admin} />
                    ) : (
                      <circle r={node.kind === "role" ? 8 : 6.5} fill={KIND_COLOR[node.kind] ?? "#5d6b8a"} />
                    )}
                    <circle className="node-ring" r="15" />
                    <text className="node-label" x="0" y="-18" textAnchor="middle">
                      {isSelected || node.admin ? node.label : ""}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="graph-legend">
              <span><i style={{ background: "#fff" }} />admin</span>
              <span><i style={{ background: "#2b3cff" }} />role</span>
              <span><i style={{ background: "#7a6cff" }} />user</span>
              <span><i style={{ background: "#44506e" }} />group</span>
            </div>
          </div>
        </Panel>

        <div className="atlas-inspector">
          <Panel title="Inspector" meta={selected?.kind ?? "—"} glow={Boolean(selected)}>
            {selected ? (
              <div className="node-detail">
                <div className="node-title">
                  <span className={`mark ${selected.admin ? "critical" : "high"}`} />
                  <div><b>{selected.label}</b><em>{selected.id}</em></div>
                </div>
                <dl className="detail-list">
                  <div><dt>Kind</dt><dd>{selected.kind === "admin" ? "administrator" : selected.kind}</dd></div>
                  <div><dt>Degree</dt><dd>{selected.degree}</dd></div>
                  <div><dt>Routes</dt><dd>{selectedRoutes}</dd></div>
                </dl>
                {selected.arn ? <code className="arn">{selected.arn}</code> : null}
                {selected.groups.length ? (
                  <div className="detail-block">
                    <span>Groups</span>
                    <div className="action-tags">{selected.groups.map((group) => <code key={group}>{group}</code>)}</div>
                  </div>
                ) : null}
                {selected.trust.length ? (
                  <div className="detail-block">
                    <span>Trust</span>
                    <div className="action-tags">{selected.trust.map((trust) => <code key={trust}>{trust}</code>)}</div>
                  </div>
                ) : null}
                {selected.note ? <p className="detail-note">{selected.note}</p> : null}
                {selectedRoutes > 0 ? (
                  <button type="button" className="btn primary small" onClick={() => navigate("path")}>
                    <Icon name="path" />Open its route
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="detail-note">Select a node in the graph.</p>
            )}
          </Panel>
          <Panel title="Fleet readout" meta="account focus">
            <div className="route-meta">
              <div><span>Account</span><b>{bundle.scenario.title}</b></div>
              <div><span>Account ID</span><b>{bundle.scenario.accountId}</b></div>
              <div><span>Region</span><b>{bundle.scenario.region}</b></div>
              <div><span>Severity</span><b>{bundle.scenario.severity}</b></div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
