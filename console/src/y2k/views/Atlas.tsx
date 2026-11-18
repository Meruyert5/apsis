import { useEffect, useMemo, useState } from "react";
import { byKey } from "../../lib/data";
import type { GraphNode } from "../../lib/types";
import { fleet, showcase } from "../model";
import type { ViewId } from "../model";
import { Chip, FigurePanel, Icon, Panel } from "../ui";

type KindFilter = "all" | "user" | "role" | "group" | "admin";

const KIND_COLOR: Record<string, string> = {
  admin: "#f4efe3",
  role: "#7b86c9",
  user: "#a78bfa",
  group: "#5f6b7a",
  lambda: "#8a8f96",
  ec2: "#8a8f96",
  ecs: "#8a8f96",
  glue: "#8a8f96",
  sagemaker: "#8a8f96",
  cloudformation: "#8a8f96",
};

type Point = { x: number; y: number };

function curvePath(a: Point, b: Point, bend: number, trim = 16) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const sx = a.x + ux * trim;
  const sy = a.y + uy * trim;
  const ex = b.x - ux * trim;
  const ey = b.y - uy * trim;
  const cx = (sx + ex) / 2 - uy * bend;
  const cy = (sy + ey) / 2 + ux * bend;
  return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
}

function shortLabel(node: GraphNode) {
  const base = node.label
    .replace(/ role$/i, "")
    .replace(/ engineer$/i, "")
    .replace(/ lead$/i, "")
    .replace(/ services$/i, "");
  const compact: Record<string, string> = {
    Administrator: "Admin",
    "Studio administrator": "Studio",
    "Outsource artist": "Contractor",
    "Tools intern": "Intern",
    "Player insights": "Insights",
    "Player support": "Support",
    "Game server": "Server",
    "Art pipeline": "Art",
    "Live-ops": "Ops",
    "Power users": "Power",
  };
  return compact[base] ?? base;
}

function hexPoints(radius: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2 - Math.PI / 2;
    return `${(Math.cos(angle) * radius).toFixed(1)},${(Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
}

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
    const map = new Map<string, Point>();
    if (!nodes.length) return map;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const scale = Math.min(840 / spanX, 510 / spanY);
    const width = spanX * scale;
    const height = spanY * scale;
    const originX = (940 - width) / 2;
    const originY = (600 - height) / 2 + 10;
    nodes.forEach((node) => {
      map.set(node.id, {
        x: originX + (node.x - minX) * scale,
        y: originY + (node.y - minY) * scale,
      });
    });
    return map;
  }, [nodes]);

  const adjacent = useMemo(() => {
    const map = new Map<string, Set<string>>();
    nodes.forEach((node) => map.set(node.id, new Set<string>()));
    bundle.edges.forEach((edge) => {
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    });
    return map;
  }, [bundle, nodes]);

  const neighbors = selectedId ? adjacent.get(selectedId) ?? new Set<string>() : new Set<string>();
  const kindCounts = nodes.reduce(
    (acc, node) => {
      const key = node.admin ? "admin" : node.kind;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

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
          title="Account system"
          meta="16 bodies / one fleet"
          tags={[`${fleet.length} accounts`, `${bundle.stats.identities} in focus`, `${bundle.edges.length} edges`]}
          note="Auto: bodies orbit / click one to switch account"
          foot={bundle.scenario.title}
          motion={motion}
          focus={focusIndex}
          onPick={(index) => {
            const next = fleet[index];
            if (next) setAccount(next.key);
          }}
        />
      </section>

      <div className="account-strip-wrap">
        <span className="strip-label">Accounts / select focus</span>
        <div className="account-strip" role="tablist" aria-label="Accounts">
          {fleet.map((row, index) => (
            <button
              key={row.key}
              type="button"
              role="tab"
              aria-selected={row.key === account}
              className={row.key === account ? "is-active" : undefined}
              onClick={() => setAccount(row.key)}
            >
              <span className="account-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="account-copy">
                <b>{row.short}</b>
                <em>{row.routes} routes</em>
              </span>
              <span className={`mark ${row.severity}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="atlas-workbench">
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
            <svg
              className="identity-graph"
              viewBox="0 0 940 600"
              role="img"
              aria-labelledby="identity-graph-title"
            >
              <title id="identity-graph-title">
                Identity trust graph for {bundle.scenario.title}
              </title>
              <defs>
                <radialGradient id="graph-field" cx="58%" cy="50%" r="64%">
                  <stop offset="0" stopColor="#a78bfa" stopOpacity=".12" />
                  <stop offset=".55" stopColor="#ffb26b" stopOpacity=".035" />
                  <stop offset="1" stopColor="#08090b" stopOpacity="0" />
                </radialGradient>
                <marker
                  id="graph-arrow"
                  viewBox="0 0 8 8"
                  refX="6"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 L8 4 L0 8 Z" fill="rgb(236 231 218 / .4)" />
                </marker>
                <marker
                  id="graph-arrow-live"
                  viewBox="0 0 8 8"
                  refX="6"
                  refY="4"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 L8 4 L0 8 Z" fill="#a78bfa" />
                </marker>
              </defs>
              <rect width="940" height="600" fill="url(#graph-field)" />
              <g className="graph-grid" aria-hidden="true">
                {Array.from({ length: 9 }, (_, index) => (
                  <line key={`v${index}`} x1={94 + index * 94} y1="30" x2={94 + index * 94} y2="570" />
                ))}
                {Array.from({ length: 6 }, (_, index) => (
                  <line key={`h${index}`} x1="30" y1={90 + index * 90} x2="910" y2={90 + index * 90} />
                ))}
              </g>
              <g className="admin-orbits" aria-hidden="true">
                {nodes.filter((node) => node.admin).map((node) => {
                  const point = positions.get(node.id);
                  if (!point) return null;
                  return (
                    <g key={`orbit-${node.id}`}>
                      <circle cx={point.x} cy={point.y} r="48" />
                      <circle className="is-dashed" cx={point.x} cy={point.y} r="92" />
                      <circle className="is-dashed is-outer" cx={point.x} cy={point.y} r="140" />
                    </g>
                  );
                })}
              </g>
              <g className="graph-edges">
                {bundle.edges.map((edge, index) => {
                  const a = positions.get(edge.source);
                  const b = positions.get(edge.target);
                  if (!a || !b) return null;
                  const active = selectedId === edge.source || selectedId === edge.target;
                  const bend = ((index % 4) - 1.5) * 18;
                  return (
                    <path
                      key={edge.id}
                      className={`graph-edge ${active ? "is-active" : ""}`}
                      d={curvePath(a, b, bend, 18)}
                      markerEnd={active ? "url(#graph-arrow-live)" : "url(#graph-arrow)"}
                    >
                      <title>{`${edge.source} to ${edge.target} - ${edge.technique}`}</title>
                    </path>
                  );
                })}
              </g>
              <g className="graph-nodes">
                {nodes.map((node, index) => {
                  const point = positions.get(node.id);
                  if (!point) return null;
                  const on = visible(node);
                  const isSelected = node.id === selectedId;
                  const isNeighbor = neighbors.has(node.id);
                  const edgeRight = point.x > 760;
                  const edgeLeft = point.x < 180;
                  const clustered = point.y > 340 && point.y < 450;
                  const labelX = edgeRight ? 28 : edgeLeft ? -28 : 0;
                  const labelAnchor = edgeRight ? "start" : edgeLeft ? "end" : "middle";
                  const labelY = edgeRight || edgeLeft
                    ? 5
                    : clustered && index % 2 === 1
                      ? 36
                      : -28;
                  return (
                    <g
                      key={node.id}
                      className={`graph-node ${isSelected ? "is-selected" : ""} ${isNeighbor ? "is-neighbor" : ""} ${on ? "" : "is-dim"}`.trim()}
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
                      <title>{`${node.label} - ${node.kind}${node.admin ? ", administrator" : ""} - degree ${node.degree}`}</title>
                      {isSelected || isNeighbor ? (
                        <circle className="node-halo" r={isSelected ? 30 : 23} />
                      ) : null}
                      <circle className="node-ring" r={node.kind === "admin" ? 21 : 17} />
                      {node.kind === "admin" ? (
                        <rect
                          className="node-core node-diamond"
                          x="-12"
                          y="-12"
                          width="24"
                          height="24"
                          transform="rotate(45)"
                          fill={KIND_COLOR.admin}
                        />
                      ) : node.kind === "role" ? (
                        <polygon
                          className="node-core node-hex"
                          points={hexPoints(12)}
                          fill={KIND_COLOR.role}
                        />
                      ) : node.kind === "group" ? (
                        <rect
                          className="node-core node-square"
                          x="-9"
                          y="-9"
                          width="18"
                          height="18"
                          rx="2"
                          fill={KIND_COLOR.group}
                        />
                      ) : (
                        <circle
                          className="node-core"
                          r={8}
                          fill={KIND_COLOR[node.kind] ?? "#7b86c9"}
                        />
                      )}
                      <text
                        className={`node-label ${isSelected ? "is-selected" : ""} ${node.admin ? "is-admin" : ""}`.trim()}
                        x={labelX}
                        y={labelY}
                        textAnchor={labelAnchor}
                      >
                        {shortLabel(node)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
            <div className="graph-legend">
              <span><i style={{ background: "#f4efe3" }} />admin <b>{kindCounts.admin ?? 0}</b></span>
              <span><i style={{ background: "#7b86c9" }} />role <b>{kindCounts.role ?? 0}</b></span>
              <span><i style={{ background: "#a78bfa" }} />user <b>{kindCounts.user ?? 0}</b></span>
              <span><i style={{ background: "#5f6b7a" }} />group <b>{kindCounts.group ?? 0}</b></span>
              <span className="graph-legend-note">arrow = escalation direction</span>
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
