import type { Route } from "../lib/types";

interface Point {
  x: number;
  y: number;
  label: string;
}

const WIDTH = 880;
const HEIGHT = 330;
const PAD_X = 74;
const MID_Y = 166;
const WAVE = [0, -34, 28, -40, 34, -28, 36, 0];

function routePoints(labels: string[]): Point[] {
  const step = (WIDTH - PAD_X * 2) / Math.max(1, labels.length - 1);
  return labels.map((label, index) => ({
    x: PAD_X + index * step,
    y: MID_Y + (WAVE[index % WAVE.length] ?? 0),
    label,
  }));
}

function smoothPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function labelLines(label: string): string[] {
  const words = label.split(" ");
  if (words.length < 3) return [label];
  const split = Math.ceil(words.length / 2);
  return [words.slice(0, split).join(" "), words.slice(split).join(" ")];
}

export function RouteAtlas({ route, account }: { route: Route; account: string }) {
  const points = routePoints(route.labels);
  const path = smoothPath(points);
  const last = points.length - 1;
  const beforeCut = points[last - 1];
  const cut = points[last];
  const cutX = beforeCut.x + (cut.x - beforeCut.x) * 0.76;
  const cutY = beforeCut.y + (cut.y - beforeCut.y) * 0.76;

  return (
    <div className="atlas">
      <svg
        className="atlas-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Shortest route in ${account}: ${route.labels.join(" to ")}, ${route.hops} hops`}
      >
        <defs>
          <filter id="route-glow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>

        <g className="atlas-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <line key={index} x1={PAD_X + index * ((WIDTH - PAD_X * 2) / 7)} y1="44" x2={PAD_X + index * ((WIDTH - PAD_X * 2) / 7)} y2={HEIGHT - 34} />
          ))}
          {Array.from({ length: 16 }, (_, index) => (
            <rect key={index} x={PAD_X + index * ((WIDTH - PAD_X * 2) / 15)} y="34" width="2" height="5" />
          ))}
        </g>

        {[28, 19, 10, -10, -19, -28].map((offset) => (
          <path key={offset} className="atlas-ghost" d={path} transform={`translate(0 ${offset})`} />
        ))}
        <path className="atlas-path-glow" d={path} filter="url(#route-glow)" />
        <path className="atlas-path" d={path} markerEnd="url(#route-arrow)" />

        {points.slice(0, -1).map((point, index) => {
          const next = points[index + 1];
          return (
            <g key={`hop-${index}`} className="atlas-hop">
              <circle cx={(point.x + next.x) / 2} cy={(point.y + next.y) / 2 - 18} r="9" />
              <text x={(point.x + next.x) / 2} y={(point.y + next.y) / 2 - 15} textAnchor="middle">
                {String(index + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}

        <g className="atlas-cut">
          <line x1={cutX - 7} y1={cutY - 7} x2={cutX + 7} y2={cutY + 7} />
          <line x1={cutX + 7} y1={cutY - 7} x2={cutX - 7} y2={cutY + 7} />
        </g>

        {points.map((point, index) => {
          const above = index % 2 === 1;
          const lines = labelLines(point.label);
          const role = index === 0 ? "start" : index === last ? "admin" : "step";
          return (
            <g key={point.label} className={`atlas-node ${role}`}>
              <title>{point.label}</title>
              <circle cx={point.x} cy={point.y} r="12" />
              <rect x={point.x - 5.5} y={point.y - 5.5} width="11" height="11" transform={`rotate(45 ${point.x} ${point.y})`} />
              {role !== "step" ? <circle className="atlas-halo" cx={point.x} cy={point.y} r="19" /> : null}
              <text className="atlas-label" x={point.x} y={above ? point.y - 26 : point.y + 36} textAnchor="middle">
                {lines.map((line, lineIndex) => (
                  <tspan key={line} x={point.x} dy={lineIndex === 0 ? 0 : 11}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="atlas-legend" aria-hidden="true">
        <span><i className="dot mag" />Closest route</span>
        <span><i className="dot lime" />Administrator</span>
        <span><i className="dot ice" />Identity</span>
      </div>

      <ol className="hoplist">
        {route.steps.map((step, index) => (
          <li key={`${step.edge}-${index}`} title={step.technique.replaceAll("_", " ")}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{step.name}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
